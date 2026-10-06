import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/access";
import AccessLib "../lib/access";

mixin (state : AccessLib.State, accessControlState : AccessControl.AccessControlState) {
  public shared ({ caller }) func verifyAccessKey(kind : Types.KeyKind, key : Text) : async Types.VerifyResult {
    AccessLib.verifyKey(state, accessControlState, caller, kind, key);
  };

  public query func getSession(token : Types.SessionToken) : async ?Types.SessionView {
    AccessLib.getSession(state, token);
  };

  public shared ({ caller }) func signOut(token : Types.SessionToken) : async () {
    AccessLib.signOut(state, caller, token);
  };
};
