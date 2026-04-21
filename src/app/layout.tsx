import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApplyAI — Land Interviews Faster",
  description:
    "Paste any job. Get an ATS-optimized resume rewrite + personalized cover letter in 15 seconds. Powered by Gemini.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="gradient-bg min-h-screen antialiased">{children}</body>
    </html>
  );
}
