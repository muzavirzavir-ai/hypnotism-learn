import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/access";
import Common "../types/common";
import AuditTypes "../types/audit";
import AuditLib "audit";

module {
  // Rate limiting: after this many consecutive failures a principal is blocked
  // for RATE_WINDOW_NANOS. The window is measured against server time.
  let MAX_FAILED_ATTEMPTS : Nat = 5;
  let RATE_WINDOW_NANOS : Int = 60_000_000_000; // 60 seconds

  public type FailedAttempt = {
    var count : Nat;
    var lastAttemptAt : Common.Timestamp;
  };

  public type State = {
    adminKey : Text;
    studentKey : Text;
    sessions : Map.Map<Common.SessionToken, Common.Session>;
    failedAttempts : Map.Map<Principal, FailedAttempt>;
    auditLog : Map.Map<Common.AuditId, AuditTypes.AuditEntry>;
    auditState : AuditLib.State;
  };

  // A session token is derived from the caller principal and the server clock.
  // It is opaque to the frontend and is only meaningful to the backend.
  func newToken(caller : Principal, now : Int) : Common.SessionToken {
    caller.toText() # ":" # now.toText();
  };

  func retryAfterSeconds(attempt : FailedAttempt, now : Int) : Nat {
    let elapsed = now - attempt.lastAttemptAt;
    if (elapsed >= RATE_WINDOW_NANOS) {
      0;
    } else {
      ((RATE_WINDOW_NANOS - elapsed) / 1_000_000_000).toNat();
    };
  };

  // Verify an access key for the given kind. On success a session is created and
  // returned; on failure the caller's failure counter is advanced and, once the
  // threshold is reached, further attempts are rate-limited for a retry window.
  public func verifyKey(
    state : State,
    accessControlState : AccessControl.AccessControlState,
    caller : Principal,
    kind : Types.KeyKind,
    key : Text,
  ) : Types.VerifyResult {
    let now = Time.now();
    let attempt : FailedAttempt = switch (state.failedAttempts.get(caller)) {
      case (?a) { a };
      case null { { var count = 0; var lastAttemptAt = 0 } };
    };

    if (attempt.count >= MAX_FAILED_ATTEMPTS) {
      let retry = retryAfterSeconds(attempt, now);
      if (retry > 0) {
        return #rateLimited({ retryAfterSeconds = retry });
      };
      // Window elapsed: reset the counter and allow the attempt.
      attempt.count := 0;
    };

    let expected = switch (kind) {
      case (#admin) { state.adminKey };
      case (#student) { state.studentKey };
    };

    if (key != expected) {
      attempt.count := attempt.count + 1;
      attempt.lastAttemptAt := now;
      state.failedAttempts.add(caller, attempt);
      ignore AuditLib.append(
        state.auditLog,
        state.auditState,
        #failedKey,
        caller,
        "Invalid " # (switch (kind) { case (#admin) { "admin" }; case (#student) { "student" } }) # " key",
      );
      return #invalidKey;
    };

    // Success clears the failure counter.
    state.failedAttempts.remove(caller);

    let role : Common.Role = switch (kind) {
      case (#admin) { #admin };
      case (#student) { #student };
    };

    // Register the caller with the platform authorization component so that
    // role-guarded endpoints (which call AccessControl.hasPermission) resolve a
    // role instead of trapping with "User is not registered". The admin key
    // grants the #admin role; the student key grants the #user role. This is
    // written directly because assignRole requires an existing admin caller,
    // which a first-time admin does not yet have.
    let accessRole : AccessControl.UserRole = switch (kind) {
      case (#admin) { #admin };
      case (#student) { #user };
    };
    accessControlState.userRoles.add(caller, accessRole);

    let token = newToken(caller, now);
    let session : Common.Session = { token; role; issuedAt = now };
    state.sessions.add(token, session);
    ignore AuditLib.append(
      state.auditLog,
      state.auditState,
      #signIn,
      caller,
      (switch (kind) { case (#admin) { "Admin" }; case (#student) { "Student" } }) # " signed in",
    );
    #ok(session);
  };

  public func getSession(
    state : State,
    token : Types.SessionToken,
  ) : ?Types.SessionView {
    switch (state.sessions.get(token)) {
      case (?session) { ?{ role = session.role; issuedAt = session.issuedAt } };
      case null { null };
    };
  };

  public func signOut(state : State, caller : Principal, token : Types.SessionToken) : () {
    switch (state.sessions.get(token)) {
      case (?session) {
        ignore session;
        state.sessions.remove(token);
        ignore AuditLib.append(
          state.auditLog,
          state.auditState,
          #signOut,
          caller,
          "Signed out",
        );
      };
      case null {};
    };
  };
};
