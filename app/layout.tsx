import type { Metadata } from "next";
import { Poppins, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import CookieBanner from "./components/CookieBanner";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
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
      className={`${poppins.variable} ${sora.variable} font-sans h-full antialiased`}
    >
      <body className={`${poppins.className} font-sans min-h-full flex flex-col antialiased bg-[#0A0B0D] text-[#A1A1AA]`}>
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}



