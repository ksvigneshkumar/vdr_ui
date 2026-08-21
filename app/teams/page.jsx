"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/teams/manage-admin');
  }, [router]);

  return (
    <div className="w-full h-full flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">Redirecting…</p>
      </div>
    </div>
  );
}
