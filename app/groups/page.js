"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUsers } from "react-icons/fa";

export default function GroupsPage() {
  const router = useRouter();

  useEffect(() => {
    const rawSession = localStorage.getItem("vdr_session");
    if (!rawSession) {
      router.push("/login");
      return;
    }
    
    // In our dummy data, we set up "grp-1" as the default group.
    // Instead of querying the database to find the first group, we redirect directly to the dummy group.
    router.replace(`/groups/grp-1`);
  }, [router]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[70vh] font-sans">
      <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
        <FaUsers className="text-3xl text-blue-500 animate-pulse" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Loading Groups...</h2>
      <p className="text-sm text-slate-500 max-w-sm text-center">
        Please wait while we fetch your team and external user groups.
      </p>
    </div>
  );
}
