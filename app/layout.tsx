import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Wellms",
  description: "Learning Management System",
  manifest: "/manifest.json",
  themeColor: "#1abc9c",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wellms",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} h-full`} style={{ colorScheme: "light", background: "#ffffff" }}>
      <body className="min-h-full flex flex-col bg-white text-[#555555]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
