import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk, IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import "./ui.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";

// The same three faces as AgentiX, loaded through next/font so the CSP's
// `font-src 'self'` still holds: names and headings, reading text, data.
const sans = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-sans" });
const display = Familjen_Grotesk({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-display" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], display: "swap", weight: ["400", "500"], variable: "--font-mono-face" });

export const metadata: Metadata = {
  title: "User Story Schneider · XoXoCom",
  description: "Describe your project in a sentence. Get user stories and a roadmap.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ECEEF2" },
    { media: "(prefers-color-scheme: dark)", color: "#060607" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
