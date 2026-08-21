"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsIndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const routeUser = async () => {
      const raw = localStorage.getItem("vdr_session");
      if (!raw) { router.push('/login'); return; }
      const session = JSON.parse(raw);

      if (session.role === 'super_admin') {
        router.replace('/settings/branding');
        return;
      }

      try {
        const res = await fetch('/api/settings/access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session })
        });
        const data = await res.json();

        if (!data.success || !data.perms.settings) {
          router.replace('/documents');
          return;
        }

        // SMART ROUTING:
        if (data.perms.branding) {
          router.replace('/settings/branding');
        } else if (data.perms.watermark) {
          router.replace('/settings/watermark');
        } else if (data.perms.nda) {
          router.replace('/settings/nda');
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        router.replace('/documents');
      }
    };

    routeUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#F8FAFC]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#F8FAFC]">
      <div className="text-center p-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 className="text-xl font-bold text-slate-700">Workspace Settings</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          You have access to the settings module, but no specific configuration menus have been assigned to you.
        </p>
      </div>
    </div>
  );
}














// "use client";

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };

// export default function SettingsIndexPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const routeUser = async () => {
//       const raw = localStorage.getItem("vdr_session");
//       if (!raw) { router.push('/login'); return; }
//       const session = JSON.parse(raw);

//       // ONLY Super Admin defaults to branding
//       if (session.role === 'super_admin') {
//         router.replace('/settings/branding');
//         return;
//       }

//       const { data: ugRows } = await supabase.from('user_groups').select('group_id').eq('user_id', session.id);
//       const groupIds = ugRows?.map(r => r.group_id) || [];

//       if (groupIds.length === 0) {
//         router.replace('/documents');
//         return;
//       }

//       const { data: perms } = await supabase
//         .from('permissions')
//         .select('can_access_settings, can_access_branding, can_access_watermarks')
//         .eq('scope', 'workspace')
//         .in('group_id', groupIds);

//       const hasSettings = perms?.some(p => p.can_access_settings);
//       const canBranding = perms?.some(p => p.can_access_branding);
//       const canWatermark = perms?.some(p => p.can_access_watermarks);

//       if (!hasSettings) {
//         router.replace('/documents');
//         return;
//       }

//       // SMART ROUTING:
//       if (canBranding) {
//         router.replace('/settings/branding');
//       } else if (canWatermark) {
//         router.replace('/settings/watermark');
//       } else {
//         // If they have Settings = ON, but Branding=OFF & Watermark=OFF
//         // Do nothing. Stay on this page and show the "Empty White State".
//         setLoading(false);
//       }
//     };

//     routeUser();
//   }, [router]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-full w-full bg-[#F8FAFC]">
//         <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   // THIS IS THE "FULL WHITE NOTHING" PAGE THEY SEE IF BRANDING/WATERMARK ARE BOTH OFF
//   return (
//     <div className="flex flex-col items-center justify-center h-full w-full bg-[#F8FAFC]">
//       <div className="text-center p-10">
//         <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//           <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//           <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//         </svg>
//         <h2 className="text-xl font-bold text-slate-700">Workspace Settings</h2>
//         <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
//           You have access to the settings module, but no specific configuration menus have been assigned to you.
//         </p>
//       </div>
//     </div>
//   );
// }

