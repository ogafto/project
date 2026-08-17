import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import CookieBanner from "./components/CookieBanner";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
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
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className={`${plusJakartaSans.className} min-h-full flex flex-col antialiased bg-[#0E0E11] text-[#A1A1AA]`}>
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}


