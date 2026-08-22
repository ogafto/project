import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import CookieBanner from "./components/CookieBanner";

const soehne = localFont({
  src: [
    {
      path: "../public/fonts/soehne-buch.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/soehne-kraftig.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/soehne-halbfett.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/soehne-halbfett.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-soehne",
  display: "swap",
});

const soehneMono = localFont({
  src: [
    {
      path: "../public/fonts/soehne-mono-buch.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/soehne-mono-halbfett.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-soehne-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Platforma",
  description: "Platforma e-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${soehne.variable} ${soehneMono.variable} h-full antialiased`}
    >
      <body className={`${soehne.className} min-h-full flex flex-col antialiased bg-[#0E0E11] text-[#A1A1AA]`}>
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}



