import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Micas AgentHub",
  description: "Micas AgentHub starter project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
