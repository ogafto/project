"use client";

import React, { useState } from "react";
import AdminUsersTable from "../components/AdminUsersTable";
import UserDetailModal from "../components/UserDetailModal";

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div className="w-full space-y-6">
      <AdminUsersTable
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectUser={(userId) => setSelectedUserId(userId)}
      />

      <UserDetailModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
