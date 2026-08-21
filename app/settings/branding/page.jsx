"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChromePicker } from 'react-color';
import { useDialog } from '@/components/ui/DialogProvider';
import { applyBrandTheme, DEFAULT_BRAND } from '@/lib/theme';
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };

const PRESET_COLORS = [
  '#1C7F9F', // PiBi Default Cyan
  '#3B82F6', // Ocean Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Royal Purple
  '#EC4899', // Bright Pink
  '#EF4444', // Coral Red
  '#F59E0B', // Amber Gold
  '#10B981', // Emerald Green
];

export default function BrandingPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState(null);

  const [activeTheme, setActiveTheme] = useState(DEFAULT_BRAND);
  const [themeMode, setThemeMode] = useState('single');
  const [doubleColors, setDoubleColors] = useState([]);
  const { showAlert } = useDialog();

  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  // User Profile States
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  // Modal control & temporary inputs
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  // â”€â”€â”€ Session Initialization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const raw = localStorage.getItem('vdr_session');
    if (!raw) { router.push('/login'); return; }
    // eslint-disable-next-line
    setSession(JSON.parse(raw));
  }, [router]);

  // â”€â”€â”€ Fetch from DB on mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const fetchBranding = async () => {
      if (!session || !session.company_id) return;

      setLoading(true);
      try {
        const res = await fetch('/api/settings/branding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'fetch',
            session
          })
        });
        const json = await res.json();
        
        if (json.success && json.data) {
          const data = json.data;
          setRecordId(data.id);
          setBrandName(data.brand_name ?? '');
          setLogoUrl(data.logo_url ?? null);
          const loadedTheme = data.active_theme ?? DEFAULT_BRAND;
          setActiveTheme(loadedTheme);
          if (typeof loadedTheme === 'string' && loadedTheme.includes('linear-gradient')) {
            setThemeMode('double');
            const colors = loadedTheme.match(/#[0-9a-fA-F]+/g) || [];
            if (colors.length >= 2) setDoubleColors(colors);
          } else {
            setThemeMode('single');
            setDoubleColors([]);
          }
          setAdminName(data.admin_name ?? '');
          setAdminEmail(data.admin_email ?? '');
          setAdminPhone(data.admin_phone ?? '');
        }
      } catch (err) {
        console.error('Error fetching workspace settings:', err);
      }
      setLoading(false);
    };

    fetchBranding();
  }, [session]);

  // â”€â”€â”€ Logo Helper Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getLogoDisplayUrl = (pathOrBase64) => {
    if (!pathOrBase64) return null;
    if (pathOrBase64.startsWith('data:image')) return pathOrBase64;
    if (pathOrBase64.startsWith('http')) return pathOrBase64;
    const { data } = supabase.storage.from('vdr-logos').getPublicUrl(pathOrBase64);
    return data?.publicUrl || null;
  };

  // â”€â”€â”€ Save / Publish to DB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handlePublish = async () => {
    setSaving(true);
    try {
      let logoBase64 = null;
      let logoMime = null;
      let logoName = null;

      if (logoFile && logoUrl && logoUrl.startsWith('data:image')) {
        const parts = logoUrl.split(',');
        if (parts.length > 1) {
          logoBase64 = parts[1];
          logoMime = logoFile.type;
          logoName = logoFile.name;
        }
      }

      const payload = {
        company_id:   session.company_id,
        recordId:     recordId,
        brand_name:   brandName,
        logo_url:     !logoFile ? logoUrl : undefined, // pass existing url if no new logo
        active_theme: activeTheme,
        admin_name:   adminName,
        admin_email:  adminEmail,
        admin_phone:  adminPhone,
        logoBase64,
        logoMime,
        logoName
      };

      const res = await fetch('/api/settings/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          session,
          payload
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      if (json.recordId) setRecordId(json.recordId);
      if (json.logo_url) {
        setLogoUrl(json.logo_url);
        setLogoFile(null); // Reset file so we don't upload again
      }
      
      await showAlert('Branding settings published successfully!', 'Success');
    } catch (err) {
      await showAlert('Failed to save: ' + err.message, 'Error');
    }
    setSaving(false);
  };

  // â”€â”€â”€ Logo upload (preview only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        await showAlert('Logo size must be less than 2MB', 'Invalid Logo');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // â”€â”€â”€ Profile Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleEditProfileClick = () => {
    setTempName(adminName);
    setTempEmail(adminEmail);
    setTempPhone(adminPhone);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!tempName.trim()) {
      await showAlert('Name cannot be empty.', 'Invalid Name');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        company_id:  session.company_id,
        recordId:    recordId,
        admin_name:  tempName,
        admin_email: tempEmail,
        admin_phone: tempPhone,
      };

      if (!recordId) {
        payload.brand_name = brandName;
        payload.active_theme = activeTheme;
      }

      const res = await fetch('/api/settings/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          session,
          payload
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      
      if (json.recordId) setRecordId(json.recordId);

      setAdminName(tempName);
      setAdminEmail(tempEmail);
      setAdminPhone(tempPhone);
      setIsEditProfileOpen(false);
    } catch (err) {
      await showAlert('Failed to save profile: ' + err.message, 'Error');
    }
    setSaving(false);
  };

  const getInitials = (name) => {
    return name.split(' ').map(p => p.charAt(0)).join('').toUpperCase().substring(0, 2) || 'AD';
  };

  // Ensure currentColor is always a string (guard against numeric DB values or objects)
  const currentColor = (typeof activeTheme === 'string' && activeTheme.length > 0) 
    ? activeTheme 
    : (activeTheme?.primaryColor || DEFAULT_BRAND.primaryColor || '#1C7F9F');

  useEffect(() => {
    applyBrandTheme(currentColor);
  }, [currentColor]);

  const handleColorClick = (color) => {
    if (themeMode === 'single') {
      setActiveTheme(color);
      setDoubleColors([]);
    } else {
      let newColors = [...doubleColors];
      if (newColors.length >= 2) {
        newColors = [color];
      } else {
        newColors.push(color);
      }
      setDoubleColors(newColors);
      
      if (newColors.length === 2) {
        setActiveTheme(`linear-gradient(135deg, ${newColors[0]} 0%, ${newColors[1]} 100%)`);
      } else if (newColors.length === 1) {
        setActiveTheme(newColors[0]);
      }
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--brand)] border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading branding settingsâ€¦</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-50 to-transparent pointer-events-none transition-colors duration-500"></div>
      
      <div className="relative p-4 md:p-6 max-w-5xl mx-auto w-full space-y-5 animate-in slide-in-from-bottom-4 fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Branding &amp; Identity</h1>
            <p className="text-gray-500 mt-2 text-[15px]">Design a workspace that feels native to your clients and partners.</p>
          </div>
          <button 
            onClick={handlePublish}
            disabled={saving}
            className="px-6 py-2.5 brand-button text-white text-sm font-medium rounded-xl hover:shadow-sm hover:-translate-y-0.5 focus:ring-4 focus:ring-gray-200 transition-all duration-500 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Savingâ€¦</>
            ) : 'Publish Changes'}
          </button>
        </div>

        {/* User Profile Card */}
        <div className="relative overflow-hidden bg-white border border-gray-200/80 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-gray-300 transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-soft rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-800 text-xl font-bold shadow-sm ring-4 ring-white overflow-hidden transition-colors duration-500`}>
                {logoUrl ? <img src={getLogoDisplayUrl(logoUrl)} alt="Logo" className="w-full h-full object-contain p-1" /> : <span className="text-brand">{getInitials(adminName)}</span>}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <div className="w-4 h-4 brand-bg rounded-full transition-colors duration-500"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{brandName || 'My Workspace'}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-soft text-brand rounded-md border border-gray-200/50 uppercase tracking-wider transition-colors duration-500">Workspace</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[14px] text-gray-500 mt-1.5 font-medium">
                <span className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {adminName || 'â€”'}
                </span>
                <span className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  {adminEmail || 'â€”'}
                </span>
                <span className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {adminPhone || 'â€”'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleEditProfileClick}
            className="px-5 py-2.5 bg-white border border-gray-200 text-brand text-sm font-semibold rounded-xl hover:bg-brand-50 hover:border-gray-300 focus:ring-brand focus:border-brand transition-all shadow-sm cursor-pointer"
          >
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Brand Assets Card */}
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100/60 bg-gradient-to-r from-gray-50/50 to-white">
              <h3 className="text-lg font-bold text-gray-900">Brand Assets</h3>
              <p className="text-[13px] text-gray-500 mt-1">Configure your main workspace identifiers.</p>
            </div>
            <div className="p-6 space-y-5 flex-1">
              <div>
                <label className="block text-[14px] font-bold text-gray-800 mb-3">Workspace Logo</label>
                <div className="flex items-start gap-4">
                  <div className="relative group cursor-pointer">
                    <input type="file" accept="image/png, image/svg+xml, image/jpeg" onChange={handleLogoChange} className="hidden" id="logo-upload-input" />
                    <label htmlFor="logo-upload-input" className="cursor-pointer block">
                      <div className="absolute inset-0 bg-gradient-to-tr from-brand to-brand/20 opacity-0 group-hover:opacity-20 rounded-lg blur-md transition-opacity duration-500"></div>
                      <div className="relative w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 border-brand-soft hover:bg-brand-50 transition-all duration-300 overflow-hidden">
                        {logoUrl ? (
                          <img src={getLogoDisplayUrl(logoUrl)} alt="Logo" className="w-full h-full object-contain p-1.5" />
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand transition-colors mb-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-brand transition-colors">Upload</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-[14px] text-gray-600 leading-relaxed">This logo will be featured on your login screen, shared links, and all outgoing email notifications.</p>
                    <div className="flex items-center gap-4 mt-3">
                      <p className="text-[12px] font-medium text-gray-400 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                        SVG or PNG â€¢ 512x512px â€¢ Max 2MB
                      </p>
                      {logoUrl && (
                        <button type="button" onClick={() => { setLogoUrl(null); setLogoFile(null); }} className="text-[12px] font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer">Remove Logo</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label htmlFor="brandName" className="block text-[14px] font-bold text-gray-800 mb-2 flex items-center justify-between">
                  Display Name
                  <span className="text-[11px] font-normal text-gray-400 uppercase tracking-wider">Required</span>
                </label>
                <div className="relative">
                  <input 
                    id="brandName"
                    type="text" 
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-brand focus:border-brand transition-all placeholder-gray-400 shadow-inner"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 bg-green-50 p-1 rounded-md transition-opacity" style={{ opacity: brandName.length > 0 ? 1 : 0 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Card */}
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100/60 bg-gradient-to-r from-gray-50/50 to-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Workspace Theme</h3>
                <p className="text-[13px] text-gray-500 mt-0.5">Choose a color that defines your brand.</p>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Workspace Theme Color</p>
                <div className="flex bg-gray-100 p-1 rounded-lg w-max mb-5">
                  <button 
                    type="button"
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${themeMode === 'single' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setThemeMode('single')}
                  >
                    Single Color
                  </button>
                  <button 
                    type="button"
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${themeMode === 'double' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setThemeMode('double')}
                  >
                    Double Color
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-3.5 max-w-xs">
                  {PRESET_COLORS.map((color) => {
                    let isSelected = false;
                    let badgeText = '';
                    
                    if (themeMode === 'single') {
                      isSelected = currentColor.toUpperCase() === color.toUpperCase();
                      badgeText = (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      );
                    } else {
                      const idx = doubleColors.indexOf(color);
                      if (idx !== -1) {
                        isSelected = true;
                        badgeText = <span className="text-white text-[13px] font-bold drop-shadow-md">{idx + 1}</span>;
                      }
                    }

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorClick(color)}
                        className="relative w-11 h-11 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 flex items-center justify-center border border-black/5 shadow-sm"
                        style={{ 
                          backgroundColor: color,
                          boxShadow: isSelected ? `0 0 0 3px white, 0 0 0 5px ${color}` : 'none'
                        }}
                      >
                        {isSelected && badgeText}
                      </button>
                    );
                  })}
                  
                  {/* Custom Color Picker */}
                  <div 
                    className="relative w-11 h-11 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm"
                    style={{ 
                      background: !PRESET_COLORS.includes(currentColor.toUpperCase()) 
                        ? currentColor 
                        : 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
                      boxShadow: !PRESET_COLORS.includes(currentColor.toUpperCase()) && themeMode === 'single'
                        ? `0 0 0 3px white, 0 0 0 5px ${currentColor}`
                        : 'none'
                    }}
                  >
                    <input 
                      type="color" 
                      value={currentColor.startsWith('#') ? currentColor : '#1C7F9F'}
                      onChange={(e) => {
                        setThemeMode('single');
                        setActiveTheme(e.target.value);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {!PRESET_COLORS.includes(currentColor.toUpperCase()) && themeMode === 'single' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                        <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                        <path d="M2 2l7.586 7.586"></path>
                        <circle cx="11" cy="11" r="2"></circle>
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-700">This workspace uses the selected theme color for primary buttons, sidebar links, highlights, and accent states. Click &quot;Publish Changes&quot; above to save the selected theme.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl border border-gray-200 shadow-md w-full max-w-md overflow-hidden animate-in scale-in duration-300">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Full Name</label>
                <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full px-4 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-brand focus:border-brand transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Email Address</label>
                <input type="email" value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} className="w-full px-4 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-brand focus:border-brand transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Phone Number</label>
                <input type="text" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className="w-full px-4 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-brand focus:border-brand transition-all" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setIsEditProfileOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} className="px-5 py-2 brand-button text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-sm transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                {saving ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />Savingâ€¦</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

