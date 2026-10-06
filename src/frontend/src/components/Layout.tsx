import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

/** Shared application shell: sticky header, content region, and footer. */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 bg-background" data-ocid="page.content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
