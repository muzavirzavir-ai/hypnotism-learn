import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";

/** Access the active language and translation helper. */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
