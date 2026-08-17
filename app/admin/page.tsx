"use client";

import React, { useState, useEffect } from "react";
import AdminStatsOverview from "./components/AdminStatsOverview";

export default function AdminOverviewPage() {
  const [waitlistCount, setWaitlistCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/newsletter")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.count === "number") {
          setWaitlistCount(data.count);
        }
      })
      .catch(() => {});
  }, []);

  return <AdminStatsOverview waitlistCount={waitlistCount} />;
}
