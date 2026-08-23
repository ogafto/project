import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchStoreFromSupabase, fetchProductsFromSupabase } from "@/lib/supabase";
import { TenantStoreFront } from "./TenantStoreFront";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ subdomain: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SubdomainStorePage(props: PageProps) {
  // 1. Next.js 15/16 Async Params Resolution
  const { subdomain } = await props.params;
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;

  if (!subdomain) {
    return notFound();
  }

  const cleanSub = decodeURIComponent(subdomain).toLowerCase().trim();

  // 2. Pobranie danych ze sklepu i bazy Supabase na serwerze
  let initialStore: any = null;
  let initialProducts: any[] = [];

  try {
    const dbStore = await fetchStoreFromSupabase(cleanSub);
    if (dbStore?.id) {
      initialStore = dbStore;
      initialProducts = (await fetchProductsFromSupabase(dbStore.id)) || [];
    }
  } catch (err) {
    console.error("Błąd pobierania danych ze sklepu:", err);
  }

  return (
    <Suspense fallback={null}>
      <TenantStoreFront
        subdomain={cleanSub}
        initialStore={initialStore}
        initialProducts={initialProducts}
        searchParams={resolvedSearchParams}
      />
    </Suspense>
  );
}
