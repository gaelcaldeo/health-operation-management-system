
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GAEL HOMS | Healthcare Operations Management System",
    template: "%s | GAEL HOMS",
  },
  description:
    "GAEL HOMS is a healthcare operations management system designed to simplify patient records, insurance eligibility, claims, and prior authorization workflows.",
  applicationName: "GAEL HOMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased`}
    >
      <body className="min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
