import type { Metadata } from "next";
import { Inter, Outfit, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { FocusProvider } from "@/context/focus-context";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeadlineAI — The AI Executive Assistant",
  description: "An active, AI-powered productivity companion that triages workloads, breaks down tasks, and intervenes to drive completion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${manrope.variable} dark h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-[#012624] text-[#edfffe] overflow-x-hidden">
        <AuthProvider>
          <FocusProvider>
            {children}
          </FocusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

