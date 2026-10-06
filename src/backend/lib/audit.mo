import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Types "../types/audit";
import Common "../types/common";

module {
  public type State = {
    var nextAuditId : Nat;
  };

  // Append an audit entry. The id is allocated from the shared counter and the
  // timestamp is taken from server time, so entries are ordered by server clock.
  public func append(
    auditLog : Map.Map<Common.AuditId, Types.AuditEntry>,
    state : State,
    action : Types.AuditAction,
    actorPrincipal : Principal,
    detail : Text,
  ) : Types.AuditEntry {
    let id = state.nextAuditId;
    state.nextAuditId := id + 1;
    let entry : Types.AuditEntry = {
      id;
      action;
      actorPrincipal;
      detail;
      at = Time.now();
    };
    auditLog.add(id, entry);
    entry;
  };

  // Most recent entries first, capped at `limit`. A limit of 0 returns nothing.
  public func listAudit(
    auditLog : Map.Map<Common.AuditId, Types.AuditEntry>,
    limit : Nat,
  ) : [Types.AuditEntry] {
    let all = auditLog.values().toArray();
    let sorted = all.sort(func(a, b) = Nat.compare(b.id, a.id));
    if (sorted.size() <= limit) {
      sorted;
    } else {
      sorted.sliceToArray(0, limit.toInt());
    };
  };
};
