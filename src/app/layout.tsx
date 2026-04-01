import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECLIPSO — Professional Video & Audio Editor",
  description: "The next-generation creative suite for video editing and music production. Powered by the web.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
