import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signage Controller",
  description:
    "Real-Time Advertainment & Digital Signage Control System built with Next.js App Router and Server-Sent Events.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#F8FAFC] text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
