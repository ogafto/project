import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sklep Internetowy | Iskral",
  description: "Dedykowany sklep internetowy na platformie Iskral",
};

export default async function SubdomainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  return <div className="min-h-screen bg-[#0E0E11] text-white">{children}</div>;
}
