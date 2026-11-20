import type { Metadata } from "next";

// The page is a client component, which can't export metadata, so the title lives here.
export const metadata: Metadata = { title: "Sign in · User Story Schneider" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
