import { SessionContext } from "@/context/SessionContext";
import { useContext } from "react";

/** Access the active session, role, and sign-in/sign-out actions. */
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
