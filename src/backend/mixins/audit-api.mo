import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/audit";
import Common "../types/common";
import AuditLib "../lib/audit";

mixin (
  accessControlState : AccessControl.AccessControlState,
  auditLog : Map.Map<Common.AuditId, Types.AuditEntry>,
) {
  public query ({ caller }) func listAudit(limit : Nat) : async [Types.AuditEntry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    AuditLib.listAudit(auditLog, limit);
  };
};
