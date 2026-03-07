import type { Metadata } from "next";
import { Inter, DM_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono" });

export const metadata: Metadata = {
  title: "solo.dev",
  description: "Solo developer project management",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${dmMono.variable}`}
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
