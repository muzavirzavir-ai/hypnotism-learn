import Common "common";

module {
  public type Role = Common.Role;
  public type Session = Common.Session;
  public type SessionToken = Common.SessionToken;

  public type KeyKind = {
    #admin;
    #student;
  };

  public type VerifyResult = {
    #ok : Session;
    #invalidKey;
    #rateLimited : { retryAfterSeconds : Nat };
  };

  public type SessionView = {
    role : Role;
    issuedAt : Common.Timestamp;
  };
};
