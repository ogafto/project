"use client";

import Image from "next/image";
import Link from "next/link";

export default function AuthHeader() {
  return (
    <header className="w-full flex items-center justify-center py-6 sm:py-8 z-50">
      <Link href="/" className="transition-transform duration-200 hover:scale-105 inline-block">
        <Image
          src="/logo.svg"
          alt="Logo Platformy"
          width={180}
          height={40}
          className="w-[150px] sm:w-[180px] h-auto object-contain"
          priority
        />
      </Link>
    </header>
  );
}
