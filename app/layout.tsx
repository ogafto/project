import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import CookieBanner from "./components/CookieBanner";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
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
      className={`${bricolage.variable} font-sans h-full antialiased`}
    >
      <body className={`${bricolage.className} font-sans min-h-full flex flex-col antialiased bg-[#0A0B0D] text-[#A1A1AA]`}>
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}



