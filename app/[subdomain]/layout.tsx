import React, { Suspense } from "react";
import type { Metadata } from "next";
import SubdomainLoading from "./loading";

export const metadata: Metadata = {
  title: "Sklep Internetowy | Iskral",
  description: "Dedykowany sklep internetowy na platformie Iskral",
};

export default function SubdomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SubdomainLoading />}>
      {children}
    </Suspense>
  );
}
