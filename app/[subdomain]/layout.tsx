import React, { Suspense } from "react";
import type { Metadata } from "next";
import SubdomainLoading from "./loading";
import { StoreHydrationWrapper } from "./StoreHydrationWrapper";

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
      <StoreHydrationWrapper>
        {children}
      </StoreHydrationWrapper>
    </Suspense>
  );
}
