import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Providers } from "./providers";
import { SITE_NAME, SITE_URL } from "./lib/seo";
import { getLocale, getT } from "./i18n/server";
import { INTL_LOCALE } from "./i18n/config";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
    description: t.common.siteDescription,
    manifest: "/manifest.json",
    openGraph: { siteName: SITE_NAME, type: "website", locale: INTL_LOCALE[locale].replace("-", "_") },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: SITE_NAME,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1abc9c",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${figtree.variable} h-full`} style={{ colorScheme: "light", background: "#ffffff" }}>
      <body className="min-h-full flex flex-col bg-white text-[#555555]">
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
