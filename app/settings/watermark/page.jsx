"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDialog } from '@/components/ui/DialogProvider';

const DEFAULT_ATTRIBUTES = { userName: true, email: true, ip: false, date: false, cmplogo: false, cmpname: false };

const DEFAULT_POSITIONS = {
  'top-left': true, 'top-center': false, 'top-right': false,
  'middle-left': false, 'middle-center': true, 'middle-right': false,
  'bottom-left': false, 'bottom-center': false, 'bottom-right': true,
};

const EMPTY_TEMPLATE = {
  name: '', watermark_type: 'dynamic', custom_text: 'Confidential', email_address: '',
  font_size: 14, text_color: '#64748B', text_opacity: 25, rotation: -30,
  attributes: DEFAULT_ATTRIBUTES, positions: DEFAULT_POSITIONS,
  logo_path: '', logo_opacity: 0.2, logo_position: 'middle-center',
};

export default function WatermarkPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const { showConfirm, showAlert } = useDialog();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState(null);

  // Settings state
  const [activeType, setActiveType] = useState('dynamic');
  const [customText, setCustomText] = useState('Confidential');
  const [attributes, setAttributes] = useState(DEFAULT_ATTRIBUTES);
  const [fontSize, setFontSize] = useState(14);
  const [textColor, setTextColor] = useState('#64748B');
  const [textOpacity, setTextOpacity] = useState(25);
  const [rotation, setRotation] = useState(-30);
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);

  const [emailText, setEmailText] = useState('');
  const [brandLogo, setBrandLogo] = useState(null);
  const [logoPath, setLogoPath] = useState('');
  const [logoOpacity, setLogoOpacity] = useState(0.5);

  // Template state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocName, setPreviewDocName] = useState('');
  const [previewDocType, setPreviewDocType] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState({ ...EMPTY_TEMPLATE });
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  const logoRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // ─── SESSION & INITIAL FETCH ────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem("vdr_session");
    if (!raw) { router.push('/login'); return; }
    const s = JSON.parse(raw);
    setSession(s);
  }, [router]);

  useEffect(() => {
    if (session) fetchAllData();
  }, [session]);

  async function fetchAllData() {
    setLoading(true);
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/settings/watermark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch_all', session })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (data.brandLogo) setBrandLogo(data.brandLogo);
      if (data.templates) setTemplates(data.templates);

      const settings = data.settings;
      if (settings) {
        setRecordId(settings.id);
        setActiveType(settings.watermark_type ?? 'dynamic');
        setCustomText(settings.custom_text ?? 'Confidential');
        setFontSize(settings.font_size ?? 14);
        setTextColor(settings.text_color ?? '#64748B');
        setTextOpacity(settings.text_opacity ?? 25);
        setRotation(settings.rotation ?? -30);
        setAttributes({ ...DEFAULT_ATTRIBUTES, ...(settings.attributes ?? {}) });
        setEmailText(settings.email_address ?? '');
        setPositions({ ...DEFAULT_POSITIONS, ...(settings.positions ?? {}) });
        setLogoPath(settings.logo_path ?? '');
        setLogoOpacity(settings.logo_opacity ?? 0.5);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingTemplates(false);
    }
  }

  // ─── Save active settings ───────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    const settingsPayload = {
      watermark_type: activeType, custom_text: customText, email_address: emailText,
      font_size: fontSize, text_color: textColor, text_opacity: textOpacity,
      rotation: rotation, attributes: attributes, positions: positions,
      logo_path: logoPath || brandLogo || '', logo_opacity: logoOpacity,
    };

    try {
      const res = await fetch('/api/settings/watermark', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_settings', session, payload: { recordId, settingsPayload } })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setRecordId(data.recordId);
      await showAlert('Watermark settings saved securely!', 'Success');
    } catch (err) {
      await showAlert('Failed to save: ' + err.message, 'Error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Apply template ─────────────────────
  async function applyTemplate(t) {
    setActiveType(t.watermark_type ?? 'dynamic');
    setCustomText(t.name ?? 'Confidential');
    setEmailText(t.email_address ?? '');
    setFontSize(t.font_size ?? 14);
    setTextColor(t.text_color ?? '#64748B');
    setTextOpacity(t.text_opacity ?? 25);
    setRotation(t.rotation ?? -30);
    setAttributes({ ...DEFAULT_ATTRIBUTES, ...(t.attributes ?? {}) });
    setPositions({ ...DEFAULT_POSITIONS, ...(t.positions ?? {}) });
    setLogoPath(t.logo_path ?? '');
    setLogoOpacity(t.logo_opacity ?? 0.5);

    try {
      await fetch('/api/settings/watermark', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply_template', session, payload: { templateId: t.id } })
      });
      
      // Update the local templates state to move the "Applied" badge
      setTemplates(prev => prev.map(tmpl => ({
        ...tmpl,
        present: tmpl.id === t.id
      })));
      
      setShowTemplateModal(false);
      await showAlert(`Template "${t.name}" applied! Please click "Save Changes" to update the database.`, 'Template Applied');
    } catch (err) { await showAlert('Failed to apply template', 'Error'); }
  }

  // ─── Save template to DB ─────────────────────────────────────
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  async function handleSaveTemplate() {
    if (!templateForm.name.trim()) return await showAlert('Give the template a name', 'Missing Name');
    setSavingTemplate(true);

    try {
      let logoBase64 = null;
      let logoMime = null;
      let logoName = null;

      if (logoFile) {
        logoBase64 = await fileToBase64(logoFile);
        logoMime = logoFile.type;
        logoName = logoFile.name;
      }

      const res = await fetch('/api/settings/watermark', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_template', session,
          payload: { templateId: editingTemplateId, templateForm, logoBase64, logoMime, logoName }
        })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setTemplateForm({ ...EMPTY_TEMPLATE });
      setEditingTemplateId(null);
      setLogoFile(null);
      setLogoPreview('');
      await fetchAllData();
    } catch (err) {
      await showAlert('Failed: ' + err.message, 'Error');
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(id) {
    if (!(await showConfirm('Delete this template?'))) return;
    await fetch('/api/settings/watermark', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_template', session, payload: { templateId: id } })
    });
    await fetchAllData();
  }

  function handleEditTemplate(t) {
    setTemplateForm({
      name: t.name, watermark_type: t.watermark_type, custom_text: t.name,
      email_address: t.email_address || '', font_size: t.font_size, text_color: t.text_color,
      text_opacity: t.text_opacity, rotation: t.rotation,
      attributes: { ...DEFAULT_ATTRIBUTES, ...(t.attributes ?? {}) },
      positions: { ...DEFAULT_POSITIONS, ...(t.positions ?? {}) },
      logo_path: t.logo_path || '', logo_opacity: t.logo_opacity || 0.2, logo_position: t.logo_position || 'middle-center',
    });
    setEditingTemplateId(t.id);
    setLogoFile(null);
    setLogoPreview('');
  }

  function handleLogoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function openTemplateModal() {
    setShowTemplateModal(true);
  }

  const handlePositionToggle = (pos) => setPositions(prev => ({ ...prev, [pos]: !prev[pos] }));

  const getWatermarkLines = () => {
    if (activeType === 'static') return [customText];
    const parts = [customText];
    if (emailText) parts.push(emailText);
    if (attributes?.ip) parts.push('192.168.1.1');
    if (attributes?.date) parts.push(new Date().toLocaleString());
    return parts.filter(Boolean);
  };

  const hexToRGBA = (hex, opacity) => {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      let c = hex.substring(1).split('');
      if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      c = '0x' + c.join('');
      return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${opacity / 100})`;
    }
    return `rgba(100, 116, 139, ${opacity / 100})`;
  };

  // 🔥 Generate public URL dynamically without needing Supabase SDK!
  const getLogoUrl = (path) => {
    if (!path) return null;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vdr-logos/${path}`;
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-brand border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading watermark settings…</p>
        </div>
      </div>
    );
  }

  // 🔥 EXACT UI PRESERVED BELOW THIS LINE 🔥
  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-50 to-transparent pointer-events-none" />

      {/* ── Full A4 Preview Modal ──────────────────────────────── */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 md:p-10" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="relative w-full max-w-3xl h-full flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{previewDocName || 'A4 Document Preview'}</h2>
                  <p className="text-white/50 text-xs">210 × 297 mm • {previewDocUrl ? 'Your document with watermark' : 'Real-time watermark preview'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPreviewModal(false)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all text-lg">✕</button>
              </div>
            </div>

            {/* A4 Document */}
            <div className="flex-1 overflow-auto flex justify-center rounded-lg bg-slate-800/50 p-6 md:p-10 border border-white/5">
              <div className="w-full max-w-[680px] bg-white rounded-lg shadow-md overflow-hidden flex flex-col" style={{ minHeight: '960px', aspectRatio: '210 / 297' }}>
                {/* Doc Toolbar */}
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-2.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400">{previewDocName || 'financial_report_q2.pdf'} — Page 1 of 1</span>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </div>
                  </div>
                </div>

                {/* Document Body with watermark */}
                <div className="relative flex-1 flex flex-col select-none">
                  {/* Watermark Overlay - always on top */}
                  <div className="absolute inset-0 p-8 grid grid-cols-3 grid-rows-3 pointer-events-none z-10">
                    {[
                      { key: 'top-left',      cls: 'flex items-start justify-start' },
                      { key: 'top-center',    cls: 'flex items-start justify-center' },
                      { key: 'top-right',     cls: 'flex items-start justify-end' },
                      { key: 'middle-left',   cls: 'flex items-center justify-start' },
                      { key: 'middle-center', cls: 'flex items-center justify-center' },
                      { key: 'middle-right',  cls: 'flex items-center justify-end' },
                      { key: 'bottom-left',   cls: 'flex items-end justify-start' },
                      { key: 'bottom-center', cls: 'flex items-end justify-center' },
                      { key: 'bottom-right',  cls: 'flex items-end justify-end' },
                    ].map(({ key, cls }) => (
                      <div key={key} className={`${cls} overflow-visible`}>
                        {positions[key] && (
                          <div style={{ transform: `rotate(${rotation}deg)`, color: hexToRGBA(textColor, textOpacity) }}
                            className="font-bold origin-center transition-all duration-200 flex flex-col items-center justify-center">
                            {(logoPath || brandLogo) && (
                              <img src={getLogoUrl(logoPath || brandLogo)} alt="logo" className="h-10 object-contain mb-1.5" style={{ opacity: logoOpacity }} />
                            )}
                            <div style={{ fontSize: `${fontSize}px`, whiteSpace: 'nowrap' }} className="flex flex-col items-center">
                              {getWatermarkLines().map((line, idx) => (
                                <span key={idx} className="block leading-tight">{line}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Real Document or Dummy Content */}
                  {previewDocUrl ? (
                    previewDocType === 'pdf' ? (
                      <iframe src={`${previewDocUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full flex-1 border-0" title="PDF Preview" />
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
                        <img src={previewDocUrl} alt="Document Preview" className="max-w-full max-h-full object-contain rounded" />
                      </div>
                    )
                  ) : (
                    <div className="flex-1 p-10 flex flex-col">
                      <div className="flex flex-col gap-4 relative z-0">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                          <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                          </div>
                          <div className="text-right">
                            <div className="h-3 w-32 bg-slate-200 rounded mb-1.5" />
                            <div className="h-2.5 w-20 bg-slate-100 rounded" />
                          </div>
                        </div>
                        <div className="h-7 w-3/5 bg-slate-300 rounded-md mt-2" />
                        <div className="h-4 w-2/5 bg-slate-200 rounded" />
                        <div className="mt-4 flex flex-col gap-2.5">
                          <div className="h-3.5 w-full bg-slate-100 rounded" />
                          <div className="h-3.5 w-full bg-slate-100 rounded" />
                          <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
                          <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <div className="h-5 w-1/3 bg-slate-200 rounded-md" />
                        </div>
                        <div className="flex flex-col gap-2.5 mt-2">
                          <div className="h-3.5 w-full bg-slate-100 rounded" />
                          <div className="h-3.5 w-full bg-slate-100 rounded" />
                          <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
                        </div>
                        <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2.5 flex gap-6">
                            <div className="h-3 w-1/4 bg-slate-200 rounded" />
                            <div className="h-3 w-1/4 bg-slate-200 rounded" />
                            <div className="h-3 w-1/4 bg-slate-200 rounded" />
                            <div className="h-3 w-1/6 bg-slate-200 rounded" />
                          </div>
                          {[1,2,3].map(i => (
                            <div key={i} className="px-4 py-3 flex gap-6 border-t border-slate-50">
                              <div className="h-3 w-1/4 bg-slate-100 rounded" />
                              <div className="h-3 w-1/4 bg-slate-100 rounded" />
                              <div className="h-3 w-1/4 bg-slate-100 rounded" />
                              <div className="h-3 w-1/6 bg-slate-100 rounded" />
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <div className="h-5 w-2/5 bg-slate-200 rounded-md" />
                        </div>
                        <div className="flex flex-col gap-2.5 mt-2">
                          <div className="h-3.5 w-full bg-slate-100 rounded" />
                          <div className="h-3.5 w-full bg-slate-100 rounded" />
                          <div className="h-3.5 w-3/4 bg-slate-100 rounded" />
                          <div className="h-3.5 w-full bg-slate-100 rounded" />
                          <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
                        </div>
                        <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-center">
                          <div className="h-2.5 w-1/4 bg-slate-100 rounded" />
                          <div className="h-2.5 w-16 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Template Modal ─────────────────────────────────────── */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-md w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Watermark Templates</h2>
                <p className="text-sm text-gray-500 mt-0.5">Save reusable watermark configurations</p>
              </div>
              <button onClick={() => { setShowTemplateModal(false); setTemplateForm({ ...EMPTY_TEMPLATE }); setEditingTemplateId(null); setLogoPreview(''); setLogoFile(null); }}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-lg font-bold">✕</button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Form */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  {editingTemplateId ? 'Edit Template' : 'New Template'}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Template Name *</label>
                    <input value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value, custom_text: e.target.value }))}
                      placeholder="e.g. Client Review, Confidential..."
                      className="w-full px-4 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-brand focus:border-brand transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                    <input type="email" value={templateForm.email_address} onChange={e => setTemplateForm(f => ({ ...f, email_address: e.target.value }))}
                      placeholder="e.g. user@example.com"
                      className="w-full px-4 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-brand focus:border-brand transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={templateForm.text_color} onChange={e => setTemplateForm(f => ({ ...f, text_color: e.target.value }))}
                        className="w-10 h-10 border-0 rounded-lg cursor-pointer" />
                      <span className="text-xs font-mono text-gray-600">{templateForm.text_color.toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Font Size ({templateForm.font_size}px)</label>
                    <input type="range" min="10" max="32" value={templateForm.font_size}
                      onChange={e => setTemplateForm(f => ({ ...f, font_size: parseInt(e.target.value) }))}
                      className="w-full accent-[var(--brand)] mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Opacity ({templateForm.text_opacity}%)</label>
                    <input type="range" min="5" max="100" value={templateForm.text_opacity}
                      onChange={e => setTemplateForm(f => ({ ...f, text_opacity: parseInt(e.target.value) }))}
                      className="w-full accent-[var(--brand)] mt-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Rotation ({templateForm.rotation}°)</label>
                    <input type="range" min="-90" max="90" value={templateForm.rotation}
                      onChange={e => setTemplateForm(f => ({ ...f, rotation: parseInt(e.target.value) }))}
                      className="w-full accent-brand mt-2" />
                  </div>
                </div>

                {/* Logo upload */}
                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Company Logo (PNG/JPG)</label>
                  <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/jpg" hidden onChange={handleLogoSelect} />
                  <div className="flex items-center gap-3">
                    <button onClick={() => logoRef.current?.click()}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                      Upload Logo
                    </button>
                    {(logoPreview || templateForm.logo_path) && (
                      <div className="flex items-center gap-2">
                        <img src={logoPreview || getLogoUrl(templateForm.logo_path)} alt="logo"
                          className="h-10 w-20 object-contain rounded-lg border border-gray-100 bg-gray-50 p-1" />
                        <button onClick={() => { setLogoFile(null); setLogoPreview(''); setTemplateForm(f => ({ ...f, logo_path: '' })); }}
                          className="text-red-400 hover:text-red-600 text-lg">✕</button>
                      </div>
                    )}
                    {!logoPreview && !templateForm.logo_path && (
                      <span className="text-sm text-gray-400">No logo selected</span>
                    )}
                  </div>
                  {(logoPreview || templateForm.logo_path) && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Logo Opacity ({Math.round(templateForm.logo_opacity * 100)}%)</label>
                        <input type="range" min="0.05" max="1" step="0.05" value={templateForm.logo_opacity}
                          onChange={e => setTemplateForm(f => ({ ...f, logo_opacity: parseFloat(e.target.value) }))}
                          className="w-full accent-brand" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Logo Position</label>
                        <select value={templateForm.logo_position} onChange={e => setTemplateForm(f => ({ ...f, logo_position: e.target.value }))}
                          className="w-full px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-brand focus:border-brand transition-all">
                          {['top-left','top-center','top-right','middle-left','middle-center','middle-right','bottom-left','bottom-center','bottom-right'].map(p => (
                            <option key={p} value={p}>{p.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleSaveTemplate} disabled={savingTemplate}
                    className="flex-1 py-2.5 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-90 hover:shadow-sm transition-all disabled:opacity-60">
                    {savingTemplate ? 'Saving…' : editingTemplateId ? 'Update Template' : 'Save Template'}
                  </button>
                  {editingTemplateId && (
                    <button onClick={() => { setTemplateForm({ ...EMPTY_TEMPLATE }); setEditingTemplateId(null); setLogoPreview(''); setLogoFile(null); }}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Saved templates */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Saved Templates ({templates.length})
                </h3>
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-4 border-[var(--brand)] border-t-transparent animate-spin" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-400 text-sm">No templates yet. Create one on the left.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templates.map(t => {
                      const isPresent = t.present === true || t.present === 'true';
                      return (
                      <div key={t.id} className={`border rounded-lg p-4 transition-all ${isPresent ? 'bg-brand-50/50 border-brand-200 shadow-sm' : 'bg-gray-50/30 border-gray-100 opacity-60 hover:opacity-100'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Mini preview */}
                            <div className={`w-12 h-14 bg-white border ${isPresent ? 'border-brand-200' : 'border-gray-200'} rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative`}>
                              <span style={{ color: t.text_color, fontSize: '5px', fontWeight: 'bold', transform: `rotate(${t.rotation}deg)`, opacity: t.text_opacity / 100, textAlign: 'center', lineHeight: 1.2 }}>
                                {t.name?.substring(0, 8)}
                              </span>
                              {t.logo_path && (
                                <img src={getLogoUrl(t.logo_path)} alt="logo" className="absolute w-5 h-5 object-contain bottom-1 right-1" style={{ opacity: t.logo_opacity }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{t.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{t.name} {t.email_address ? `· ${t.email_address}` : ''} · {t.watermark_type} · {t.text_opacity}% opacity</p>
                              {t.logo_path && <span className="text-xs text-brand font-medium">🖼 Has logo</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {isPresent ? (
                              <span className="px-3 py-1.5 bg-brand-100 text-brand-dark text-xs font-bold rounded-lg flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Applied
                              </span>
                            ) : (
                              <button onClick={() => applyTemplate(t)}
                                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand hover:border-brand-200 text-xs font-bold rounded-lg transition-colors">Apply</button>
                            )}
                            <button onClick={() => handleEditTemplate(t)}
                              className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-white transition-colors">Edit</button>
                            <button onClick={() => handleDeleteTemplate(t.id)}
                              className="px-2 py-1.5 border border-red-100 text-red-400 text-xs rounded-lg hover:bg-red-50 transition-colors">✕</button>
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Page ──────────────────────────────────────────── */}
      <div className="relative p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Watermark Settings</h1>
            <p className="text-gray-500 mt-2 text-[15px]">Protect your confidential files with customizable document watermarks.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openTemplateModal}
              className="px-5 py-2.5 border border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] text-sm font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Watermark Templates
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-90 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {saving ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Saving…</>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Panel */}
          <div className="lg:col-span-7 space-y-6">

            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 p-6 space-y-6">

              {/* Text */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[14px] font-bold text-gray-800 mb-2">Template Name</label>
                  <input type="text" value={customText} onChange={e => setCustomText(e.target.value)}
                    placeholder="Enter template name..."
                    className="w-full px-4 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-[var(--brand)]/10 focus:border-[var(--brand)] transition-all" />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-gray-800 mb-2">Email Address</label>
                  <input type="email" value={emailText} onChange={e => setEmailText(e.target.value)}
                    placeholder="Enter email to display in watermark..."
                    className="w-full px-4 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-[var(--brand)]/10 focus:border-[var(--brand)] transition-all" />
                </div>
              </div>

              {/* Dynamic Variables */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-[14px] font-bold text-gray-800 mb-3">Dynamic Variables</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={attributes?.ip || false} onChange={e => setAttributes(a => ({ ...a, ip: e.target.checked }))} className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand" />
                    <span className="text-sm font-medium text-gray-700">IP Address</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={attributes?.date || false} onChange={e => setAttributes(a => ({ ...a, date: e.target.checked }))} className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand" />
                    <span className="text-sm font-medium text-gray-700">Date & Time</span>
                  </label>
                </div>
              </div>

              {/* Font & Opacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-bold text-gray-800 mb-2">Font Size ({fontSize}px)</label>
                  <input type="range" min="10" max="32" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full accent-[var(--brand)] cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-gray-800 mb-2">Opacity ({textOpacity}%)</label>
                  <input type="range" min="5" max="100" value={textOpacity} onChange={e => setTextOpacity(parseInt(e.target.value))} className="w-full accent-[var(--brand)] cursor-pointer" />
                </div>
              </div>

              {/* Rotation & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-bold text-gray-800 mb-2">Rotation ({rotation}°)</label>
                  <input type="range" min="-90" max="90" value={rotation} onChange={e => setRotation(parseInt(e.target.value))} className="w-full accent-[var(--brand)] cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-gray-800 mb-2">Watermark Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent" />
                    <span className="text-sm font-semibold font-mono text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg flex-1 text-center">{textColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Position Grid */}
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-md font-bold text-gray-900">Watermark Positions</h3>
                <p className="text-[13px] text-gray-500 mt-1">Select areas on the document where the watermark will overlay.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100 max-w-sm mx-auto">
                {Object.keys(positions).map(pos => {
                  const label = pos.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  return (
                    <button key={pos} onClick={() => handlePositionToggle(pos)}
                      className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[11px] font-bold border transition-all ${positions[pos] ? 'bg-brand border-brand text-white shadow-sm scale-[1.03]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
                      <span className="uppercase text-[9px] tracking-wider">{label}</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${positions[pos] ? 'bg-white border-white text-brand' : 'border-gray-300 bg-gray-50'}`}>
                        {positions[pos] && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Live Preview */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 p-6 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-md font-bold text-gray-900">Live Document Preview</h3>
                  <p className="text-[13px] text-gray-500 mt-1">Real-time simulation of a secured VDR document.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    {previewDocUrl ? 'Change Doc' : 'Load Doc'}
                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const isPdf = file.type === 'application/pdf';
                      const isImage = file.type.startsWith('image/');
                      if (!isPdf && !isImage) { showAlert('Please select a PDF or image file', 'Invalid File'); return; }
                      if (previewDocUrl) URL.revokeObjectURL(previewDocUrl);
                      const url = URL.createObjectURL(file);
                      setPreviewDocUrl(url);
                      setPreviewDocName(file.name);
                      setPreviewDocType(isPdf ? 'pdf' : 'image');
                      e.target.value = '';
                    }} />
                  </label>
                  {previewDocUrl && (
                    <button onClick={() => { URL.revokeObjectURL(previewDocUrl); setPreviewDocUrl(null); setPreviewDocName(''); setPreviewDocType(''); }}
                      className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all border border-red-100" title="Clear Document">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="relative flex-1 min-h-[420px] bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex flex-col p-4 shadow-inner">
                {/* Toolbar */}
                <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 flex items-center justify-between mb-4 shadow-sm z-20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 truncate max-w-[200px]">{previewDocName || 'financial_report_q2.pdf'}</span>
                </div>

                {/* Small Preview Document */}
                <div className="relative flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  {/* Watermark Overlay - always on top */}
                  <div className="absolute inset-0 p-4 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 overflow-visible">
                    {[
                      { key: 'top-left',      cls: 'flex items-start justify-start' },
                      { key: 'top-center',    cls: 'flex items-start justify-center' },
                      { key: 'top-right',     cls: 'flex items-start justify-end' },
                      { key: 'middle-left',   cls: 'flex items-center justify-start' },
                      { key: 'middle-center', cls: 'flex items-center justify-center' },
                      { key: 'middle-right',  cls: 'flex items-center justify-end' },
                      { key: 'bottom-left',   cls: 'flex items-end justify-start' },
                      { key: 'bottom-center', cls: 'flex items-end justify-center' },
                      { key: 'bottom-right',  cls: 'flex items-end justify-end' },
                    ].map(({ key, cls }) => (
                      <div key={key} className={`${cls} overflow-visible`}>
                        {positions[key] && (
                          <div style={{ transform: `rotate(${rotation}deg)`, color: hexToRGBA(textColor, textOpacity) }}
                            className="font-bold origin-center transition-all duration-200 flex flex-col items-center justify-center">
                            {brandLogo && (
                              <img src={getLogoUrl(brandLogo)} alt="logo" className="h-6 object-contain mb-1 opacity-50" />
                            )}
                            <div style={{ fontSize: `${Math.max(10, fontSize * 0.6)}px`, whiteSpace: 'nowrap' }} className="flex flex-col items-center">
                              {getWatermarkLines().map((line, idx) => (
                                <span key={idx} className="block leading-tight">{line}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Document Content */}
                  {previewDocUrl ? (
                    previewDocType === 'pdf' ? (
                      <div className="flex-1 overflow-hidden relative">
                        <iframe src={`${previewDocUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-0" title="PDF Preview" />
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-2 bg-slate-50">
                        <img src={previewDocUrl} alt="Document Preview" className="max-w-full max-h-full object-contain rounded" />
                      </div>
                    )
                  ) : (
                    <div className="flex-1 p-6 flex flex-col scale-[0.85] origin-top overflow-y-auto">
                      <div className="flex flex-col gap-4 relative z-0 pb-10">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                          </div>
                          <div className="text-right">
                            <div className="h-2.5 w-24 bg-slate-200 rounded mb-1" />
                            <div className="h-2 w-16 bg-slate-100 rounded" />
                          </div>
                        </div>
                        <div className="h-5 w-3/5 bg-slate-300 rounded-md mt-1" />
                        <div className="h-3 w-2/5 bg-slate-200 rounded" />
                        <div className="mt-2 flex flex-col gap-2">
                          <div className="h-2.5 w-full bg-slate-100 rounded" />
                          <div className="h-2.5 w-full bg-slate-100 rounded" />
                          <div className="h-2.5 w-5/6 bg-slate-100 rounded" />
                        </div>
                        <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 px-3 py-2 flex gap-4">
                            <div className="h-2 w-1/4 bg-slate-200 rounded" />
                            <div className="h-2 w-1/4 bg-slate-200 rounded" />
                            <div className="h-2 w-1/4 bg-slate-200 rounded" />
                          </div>
                          {[1,2].map(i => (
                            <div key={i} className="px-3 py-2 flex gap-4 border-t border-slate-50">
                              <div className="h-2 w-1/4 bg-slate-100 rounded" />
                              <div className="h-2 w-1/4 bg-slate-100 rounded" />
                              <div className="h-2 w-1/4 bg-slate-100 rounded" />
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                          <div className="h-2.5 w-full bg-slate-100 rounded" />
                          <div className="h-2.5 w-4/5 bg-slate-100 rounded" />
                          <div className="h-2.5 w-full bg-slate-100 rounded" />
                          <div className="h-2.5 w-3/4 bg-slate-100 rounded" />
                          <div className="h-2.5 w-full bg-slate-100 rounded" />
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                          <div className="h-2.5 w-full bg-slate-100 rounded" />
                          <div className="h-2.5 w-5/6 bg-slate-100 rounded" />
                          <div className="h-2.5 w-full bg-slate-100 rounded" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Button */}
              <button onClick={() => setShowPreviewModal(true)}
                className="mt-4 w-full flex items-center justify-center gap-2.5 py-3 bg-gradient-to-r from-brand to-brand-dark text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-sm hover:-translate-y-0.5 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                Preview Full A4 Document
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}












//previous abhishek code
// "use client";

// import { useState, useEffect, useRef } from 'react';
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };

// const COMPANY_ID = '11111111-1111-1111-1111-111111111111';

// const DEFAULT_ATTRIBUTES = {
//   userName:  true,
//   email:     true,
//   cmplogo:   false,
//   cmpname:   false,
// };

// const DEFAULT_POSITIONS = {
//   'top-left':      true,
//   'top-center':    false,
//   'top-right':     false,
//   'middle-left':   false,
//   'middle-center': true,
//   'middle-right':  false,
//   'bottom-left':   false,
//   'bottom-center': false,
//   'bottom-right':  true,
// };

// const EMPTY_TEMPLATE = {
//   name: '',
//   watermark_type: 'dynamic',
//   custom_text: 'Confidential',
//   email_address: '',
//   font_size: 14,
//   text_color: '#64748B',
//   text_opacity: 25,
//   rotation: -30,
//   attributes: DEFAULT_ATTRIBUTES,
//   positions: DEFAULT_POSITIONS,
//   logo_path: '',
//   logo_opacity: 0.2,
//   logo_position: 'middle-center',
// };

// export default function WatermarkPage() {
//   const [loading, setLoading]       = useState(true);
//   const [saving, setSaving]         = useState(false);
//   const [recordId, setRecordId]     = useState(null);

//   // Settings state
//   const [activeType, setActiveType]     = useState('dynamic');
//   const [customText, setCustomText]     = useState('Confidential');
//   const [attributes, setAttributes]     = useState(DEFAULT_ATTRIBUTES);
//   const [fontSize, setFontSize]         = useState(14);
//   const [textColor, setTextColor]       = useState('#64748B');
//   const [textOpacity, setTextOpacity]   = useState(25);
//   const [rotation, setRotation]         = useState(-30);
//   const [positions, setPositions]       = useState(DEFAULT_POSITIONS);

//   const [emailText, setEmailText]       = useState('');
//   const [brandLogo, setBrandLogo]       = useState(null);
//   const [logoPath, setLogoPath]         = useState('');
//   const [logoOpacity, setLogoOpacity]   = useState(0.5);

//   // Template state
//   const [showTemplateModal, setShowTemplateModal] = useState(false);
//   const [showPreviewModal, setShowPreviewModal]   = useState(false);
//   const [previewDocUrl, setPreviewDocUrl]         = useState(null);
//   const [previewDocName, setPreviewDocName]       = useState('');
//   const [previewDocType, setPreviewDocType]       = useState('');  // 'pdf' or 'image'
//   const [templates, setTemplates]                 = useState([]);
//   const [templateForm, setTemplateForm]           = useState({ ...EMPTY_TEMPLATE });
//   const [editingTemplateId, setEditingTemplateId] = useState(null);
//   const [savingTemplate, setSavingTemplate]       = useState(false);
//   const [loadingTemplates, setLoadingTemplates]   = useState(false);
//   const logoRef = useRef(null);
//   const [logoFile, setLogoFile]   = useState(null);
//   const [logoPreview, setLogoPreview] = useState('');

//   // ─── Fetch settings on mount ────────────────────────────────
//   useEffect(() => {
//     fetchSettings();
//   }, []);

//   async function fetchSettings() {
//     setLoading(true);
    
//     // Fetch branding logo
//     const { data: wsData } = await supabase
//       .from('workspace_settings')
//       .select('logo_url')
//       .eq('company_id', COMPANY_ID)
//       .single();
//     if (wsData?.logo_url) setBrandLogo(wsData.logo_url);

//     const { data, error } = await supabase
//       .from('watermark_settings')
//       .select('*')
//       .eq('company_id', COMPANY_ID)
//       .limit(1)
//       .single();

//     if (error && error.code !== 'PGRST116') {
//       console.error('Error fetching watermark settings:', error);
//     }

//     if (data) {
//       setRecordId(data.id);
//       setActiveType(data.watermark_type ?? 'dynamic');
//       setCustomText(data.custom_text ?? 'Confidential');
//       setFontSize(data.font_size ?? 14);
//       setTextColor(data.text_color ?? '#64748B');
//       setTextOpacity(data.text_opacity ?? 25);
//       setRotation(data.rotation ?? -30);
//       setAttributes({ ...DEFAULT_ATTRIBUTES, ...(data.attributes ?? {}) });
//       setEmailText(data.email_address ?? '');
//       setPositions({ ...DEFAULT_POSITIONS, ...(data.positions ?? {}) });
//       setLogoPath(data.logo_path ?? '');
//       setLogoOpacity(data.logo_opacity ?? 0.5);
//     }
//     setLoading(false);
//   }

//   async function fetchTemplates(currentBrandLogo = null) {
//     setLoadingTemplates(true);
//     const { data, error } = await supabase
//       .from('watermark_templates')
//       .select('*')
//       .eq('company_id', COMPANY_ID)
//       .order('created_at', { ascending: false });
    
//     if (!error && data) {
//       // Auto-fix any templates that have a null or empty logo_path
//       const fallbackLogo = currentBrandLogo || brandLogo;
//       if (fallbackLogo) {
//         const needsFix = data.filter(t => !t.logo_path);
//         for (const t of needsFix) {
//           await supabase.from('watermark_templates').update({ logo_path: fallbackLogo }).eq('id', t.id);
//           t.logo_path = fallbackLogo; // update locally
//         }
//       }
//       setTemplates(data);
//     } else {
//       setTemplates([]);
//     }
//     setLoadingTemplates(false);
//   }

//   // ─── Save settings ───────────────────────────────────────────
//   const handleSave = async () => {
//     setSaving(true);
//     const payload = {
//       company_id:     COMPANY_ID,
//       watermark_type: activeType,
//       custom_text:    customText,
//       email_address:  emailText,
//       font_size:      fontSize,
//       text_color:     textColor,
//       text_opacity:   textOpacity,
//       rotation:       rotation,
//       attributes:     attributes,
//       positions:      positions,
//       logo_path:      logoPath || brandLogo || '',
//       logo_opacity:   logoOpacity,
//     };

//     let error;
//     if (recordId) {
//       ({ error } = await supabase.from('watermark_settings').update(payload).eq('id', recordId));
//     } else {
//       const { data, error: insertError } = await supabase
//         .from('watermark_settings').insert(payload).select().single();
//       error = insertError;
//       if (data) setRecordId(data.id);
//     }

//     setSaving(false);
//     if (error) alert('Failed to save: ' + error.message);
//     else alert('Watermark settings saved!');
//   };

//   // ─── Apply template to current settings ─────────────────────
//   async function applyTemplate(t) {
//     setActiveType(t.watermark_type ?? 'dynamic');
//     setCustomText(t.name ?? 'Confidential');
//     setEmailText(t.email_address ?? '');
//     setFontSize(t.font_size ?? 14);
//     setTextColor(t.text_color ?? '#64748B');
//     setTextOpacity(t.text_opacity ?? 25);
//     setRotation(t.rotation ?? -30);
//     setAttributes({ ...DEFAULT_ATTRIBUTES, ...(t.attributes ?? {}) });
//     setPositions({ ...DEFAULT_POSITIONS, ...(t.positions ?? {}) });
//     setLogoPath(t.logo_path ?? '');
//     setLogoOpacity(t.logo_opacity ?? 0.5);

//     // Mark all templates as present: false for this company
//     await supabase
//       .from('watermark_templates')
//       .update({ present: false })
//       .eq('company_id', COMPANY_ID);

//     // Mark the selected template as present: true
//     await supabase
//       .from('watermark_templates')
//       .update({ present: true })
//       .eq('id', t.id);

//     await fetchTemplates(); // Refresh to update UI if needed

//     setShowTemplateModal(false);
//     alert(`Template "${t.name}" applied!`);
//   }

//   // ─── Save template to DB ─────────────────────────────────────
//   async function handleSaveTemplate() {
//     if (!templateForm.name.trim()) return alert('Give the template a name');
//     setSavingTemplate(true);

//     let logoPath = templateForm.logo_path || brandLogo || '';

//     // Upload logo if new file selected
//     if (logoFile) {
//       const ext = logoFile.name.split('.').pop();
//       const fileName = `${COMPANY_ID}_${Date.now()}.${ext}`;
//       const { error: uploadErr } = await supabase.storage
//         .from('vdr-logos')
//         .upload(fileName, logoFile, { contentType: logoFile.type });
//       if (!uploadErr) logoPath = fileName;
//     }

//     const payload = {
//       company_id:     COMPANY_ID,
//       name:           templateForm.name,
//       watermark_type: templateForm.watermark_type,
//       custom_text:    templateForm.custom_text,
//       email_address:  templateForm.email_address,
//       font_size:      templateForm.font_size,
//       text_color:     templateForm.text_color,
//       text_opacity:   templateForm.text_opacity,
//       rotation:       templateForm.rotation,
//       attributes:     templateForm.attributes,
//       positions:      templateForm.positions,
//       logo_path:      logoPath,
//       logo_opacity:   templateForm.logo_opacity,
//       logo_position:  templateForm.logo_position,
//     };

//     let error;
//     let isCurrentlyApplied = false;
//     if (editingTemplateId) {
//       const existingT = templates.find(t => t.id === editingTemplateId);
//       if (existingT && (existingT.present === true || existingT.present === 'true')) {
//         isCurrentlyApplied = true;
//       }
//       ({ error } = await supabase.from('watermark_templates').update(payload).eq('id', editingTemplateId));
//     } else {
//       ({ error } = await supabase.from('watermark_templates').insert(payload));
//     }

//     setSavingTemplate(false);
//     if (error) { alert('Failed: ' + error.message); return; }

//     if (isCurrentlyApplied) {
//       setActiveType(payload.watermark_type);
//       setCustomText(payload.name);
//       setEmailText(payload.email_address);
//       setFontSize(payload.font_size);
//       setTextColor(payload.text_color);
//       setTextOpacity(payload.text_opacity);
//       setRotation(payload.rotation);
//       setAttributes(payload.attributes);
//       setPositions(payload.positions);
//       setLogoPath(payload.logo_path);
//       setLogoOpacity(payload.logo_opacity);
//     }

//     setTemplateForm({ ...EMPTY_TEMPLATE });
//     setEditingTemplateId(null);
//     setLogoFile(null);
//     setLogoPreview('');
//     await fetchTemplates();
//   }

//   async function handleDeleteTemplate(id) {
//     if (!confirm('Delete this template?')) return;
//     await supabase.from('watermark_templates').delete().eq('id', id);
//     await fetchTemplates();
//   }

//   function handleEditTemplate(t) {
//     setTemplateForm({
//       name:           t.name,
//       watermark_type: t.watermark_type,
//       custom_text:    t.name,
//       email_address:  t.email_address || '',
//       font_size:      t.font_size,
//       text_color:     t.text_color,
//       text_opacity:   t.text_opacity,
//       rotation:       t.rotation,
//       attributes:     { ...DEFAULT_ATTRIBUTES, ...(t.attributes ?? {}) },
//       positions:      { ...DEFAULT_POSITIONS, ...(t.positions ?? {}) },
//       logo_path:      t.logo_path || '',
//       logo_opacity:   t.logo_opacity || 0.2,
//       logo_position:  t.logo_position || 'middle-center',
//     });
//     setEditingTemplateId(t.id);
//     setLogoFile(null);
//     setLogoPreview('');
//   }

//   function handleLogoSelect(e) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setLogoFile(file);
//     const reader = new FileReader();
//     reader.onload = () => setLogoPreview(reader.result);
//     reader.readAsDataURL(file);
//   }

//   // ─── Open modal ──────────────────────────────────────────────
//   function openTemplateModal() {
//     setShowTemplateModal(true);
//     fetchTemplates();
//   }

//   // ─── Helpers ─────────────────────────────────────────────────
//   const handlePositionToggle = (pos) => setPositions(prev => ({ ...prev, [pos]: !prev[pos] }));
//   const toggleAttribute      = (attr) => setAttributes(prev => ({ ...prev, [attr]: !prev[attr] }));

//   const getWatermarkLines = () => {
//     if (activeType === 'static') return [customText];
//     const parts = [customText];
//     if (emailText)            parts.push(emailText);
//     return parts.filter(Boolean);
//   };

//   const hexToRGBA = (hex, opacity) => {
//     if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
//       let c = hex.substring(1).split('');
//       if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
//       c = '0x' + c.join('');
//       return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${opacity / 100})`;
//     }
//     return `rgba(100, 116, 139, ${opacity / 100})`;
//   };

//   const getLogoUrl = (path) => {
//     if (!path) return null;
//     const { data } = supabase.storage.from('vdr-logos').getPublicUrl(path);
//     return data?.publicUrl || null;
//   };

//   const renderDummyDocument = (extraClasses = "flex-1") => (
//     <div className={`relative bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col gap-3 select-none ${extraClasses}`}>
//       {/* Watermark Overlay */}
//       <div className="absolute inset-0 p-4 grid grid-cols-3 grid-rows-3 pointer-events-none z-10">
//         {[
//           { key: 'top-left',      cls: 'flex items-start justify-start' },
//           { key: 'top-center',    cls: 'flex items-start justify-center' },
//           { key: 'top-right',     cls: 'flex items-start justify-end' },
//           { key: 'middle-left',   cls: 'flex items-center justify-start' },
//           { key: 'middle-center', cls: 'flex items-center justify-center' },
//           { key: 'middle-right',  cls: 'flex items-center justify-end' },
//           { key: 'bottom-left',   cls: 'flex items-end justify-start' },
//           { key: 'bottom-center', cls: 'flex items-end justify-center' },
//           { key: 'bottom-right',  cls: 'flex items-end justify-end' },
//         ].map(({ key, cls }) => (
//           <div key={key} className={`${cls} overflow-hidden`}>
//             {positions[key] && (
//               <div style={{ transform: `rotate(${rotation}deg)`, color: hexToRGBA(textColor, textOpacity) }}
//                 className="font-bold origin-center transition-all duration-200 flex flex-col items-center justify-center">
//                 {(logoPath || brandLogo) && (
//                   <img src={getLogoUrl(logoPath || brandLogo)} alt="logo" className="h-8 object-contain mb-1" style={{ opacity: logoOpacity }} />
//                 )}
//                 <div style={{ fontSize: `${fontSize}px`, whiteSpace: 'nowrap' }} className="flex flex-col items-center">
//                   {getWatermarkLines().map((line, idx) => (
//                     <span key={idx} className="block leading-tight">{line}</span>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Dummy Content */}
//       <div className="h-6 w-1/3 bg-slate-200 rounded-md" />
//       <div className="h-4 w-5/6 bg-slate-100 rounded-md mt-2" />
//       <div className="h-4 w-full bg-slate-100 rounded-md" />
//       <div className="h-4 w-4/5 bg-slate-100 rounded-md" />
//       <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col gap-2">
//         <div className="h-24 bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-4">
//           <div className="flex-1 flex flex-col gap-2">
//             <div className="h-3 w-1/2 bg-slate-200 rounded" />
//             <div className="h-3 w-5/6 bg-slate-100 rounded" />
//           </div>
//           <div className="w-16 h-16 bg-brand-50/50 rounded-xl flex items-center justify-center">
//             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
//           </div>
//         </div>
//       </div>
//       <div className="h-4 w-full bg-slate-100 rounded-md mt-auto" />
//       <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
//     </div>
//   );

//   if (loading) {
//     return (
//       <div className="relative min-h-screen bg-[#F8FAFC] flex items-center justify-center">
//         <div className="flex flex-col items-center gap-4">
//           <div className="w-10 h-10 rounded-full border-4 border-brand border-t-transparent animate-spin" />
//           <p className="text-gray-500 text-sm font-medium">Loading watermark settings…</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="relative min-h-screen bg-[#F8FAFC]">
//       <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-50 to-transparent pointer-events-none" />

//       {/* ── Full A4 Preview Modal ──────────────────────────────── */}
//       {showPreviewModal && (
//         <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 md:p-10" style={{ animation: 'fadeIn 0.3s ease-out' }}>
//           <div className="relative w-full max-w-3xl h-full flex flex-col">
//             {/* Modal Header */}
//             <div className="flex justify-between items-center mb-5 shrink-0">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
//                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
//                 </div>
//                 <div>
//                   <h2 className="text-lg font-bold text-white">{previewDocName || 'A4 Document Preview'}</h2>
//                   <p className="text-white/50 text-xs">210 × 297 mm • {previewDocUrl ? 'Your document with watermark' : 'Real-time watermark preview'}</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2">
//                 <button onClick={() => setShowPreviewModal(false)}
//                   className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all text-lg">✕</button>
//               </div>
//             </div>

//             {/* A4 Document */}
//             <div className="flex-1 overflow-auto flex justify-center rounded-lg bg-slate-800/50 p-6 md:p-10 border border-white/5">
//               <div className="w-full max-w-[680px] bg-white rounded-lg shadow-md overflow-hidden flex flex-col" style={{ minHeight: '960px', aspectRatio: '210 / 297' }}>
//                 {/* Doc Toolbar */}
//                 <div className="bg-gray-50 border-b border-gray-200 px-5 py-2.5 flex items-center justify-between shrink-0">
//                   <div className="flex items-center gap-2">
//                     <div className="w-3 h-3 rounded-full bg-red-400" />
//                     <div className="w-3 h-3 rounded-full bg-yellow-400" />
//                     <div className="w-3 h-3 rounded-full bg-green-400" />
//                   </div>
//                   <span className="text-[11px] font-semibold text-gray-400">{previewDocName || 'financial_report_q2.pdf'} — Page 1 of 1</span>
//                   <div className="flex items-center gap-1">
//                     <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
//                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Document Body with watermark */}
//                 <div className="relative flex-1 flex flex-col select-none">
//                   {/* Watermark Overlay - always on top */}
//                   <div className="absolute inset-0 p-8 grid grid-cols-3 grid-rows-3 pointer-events-none z-10">
//                     {[
//                       { key: 'top-left',      cls: 'flex items-start justify-start' },
//                       { key: 'top-center',    cls: 'flex items-start justify-center' },
//                       { key: 'top-right',     cls: 'flex items-start justify-end' },
//                       { key: 'middle-left',   cls: 'flex items-center justify-start' },
//                       { key: 'middle-center', cls: 'flex items-center justify-center' },
//                       { key: 'middle-right',  cls: 'flex items-center justify-end' },
//                       { key: 'bottom-left',   cls: 'flex items-end justify-start' },
//                       { key: 'bottom-center', cls: 'flex items-end justify-center' },
//                       { key: 'bottom-right',  cls: 'flex items-end justify-end' },
//                     ].map(({ key, cls }) => (
//                       <div key={key} className={`${cls} overflow-visible`}>
//                         {positions[key] && (
//                           <div style={{ transform: `rotate(${rotation}deg)`, color: hexToRGBA(textColor, textOpacity) }}
//                             className="font-bold origin-center transition-all duration-200 flex flex-col items-center justify-center">
//                             {(logoPath || brandLogo) && (
//                               <img src={getLogoUrl(logoPath || brandLogo)} alt="logo" className="h-10 object-contain mb-1.5" style={{ opacity: logoOpacity }} />
//                             )}
//                             <div style={{ fontSize: `${fontSize}px`, whiteSpace: 'nowrap' }} className="flex flex-col items-center">
//                               {getWatermarkLines().map((line, idx) => (
//                                 <span key={idx} className="block leading-tight">{line}</span>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>

//                   {/* Real Document or Dummy Content */}
//                   {previewDocUrl ? (
//                     previewDocType === 'pdf' ? (
//                       <iframe src={`${previewDocUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full flex-1 border-0" title="PDF Preview" />
//                     ) : (
//                       <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
//                         <img src={previewDocUrl} alt="Document Preview" className="max-w-full max-h-full object-contain rounded" />
//                       </div>
//                     )
//                   ) : (
//                     <div className="flex-1 p-10 flex flex-col">
//                       <div className="flex flex-col gap-4 relative z-0">
//                         {/* Header */}
//                         <div className="flex items-center justify-between pb-4 border-b border-gray-100">
//                           <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
//                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
//                           </div>
//                           <div className="text-right">
//                             <div className="h-3 w-32 bg-slate-200 rounded mb-1.5" />
//                             <div className="h-2.5 w-20 bg-slate-100 rounded" />
//                           </div>
//                         </div>
//                         <div className="h-7 w-3/5 bg-slate-300 rounded-md mt-2" />
//                         <div className="h-4 w-2/5 bg-slate-200 rounded" />
//                         <div className="mt-4 flex flex-col gap-2.5">
//                           <div className="h-3.5 w-full bg-slate-100 rounded" />
//                           <div className="h-3.5 w-full bg-slate-100 rounded" />
//                           <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
//                           <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
//                         </div>
//                         <div className="mt-6 pt-4 border-t border-gray-100">
//                           <div className="h-5 w-1/3 bg-slate-200 rounded-md" />
//                         </div>
//                         <div className="flex flex-col gap-2.5 mt-2">
//                           <div className="h-3.5 w-full bg-slate-100 rounded" />
//                           <div className="h-3.5 w-full bg-slate-100 rounded" />
//                           <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
//                         </div>
//                         <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
//                           <div className="bg-slate-50 px-4 py-2.5 flex gap-6">
//                             <div className="h-3 w-1/4 bg-slate-200 rounded" />
//                             <div className="h-3 w-1/4 bg-slate-200 rounded" />
//                             <div className="h-3 w-1/4 bg-slate-200 rounded" />
//                             <div className="h-3 w-1/6 bg-slate-200 rounded" />
//                           </div>
//                           {[1,2,3].map(i => (
//                             <div key={i} className="px-4 py-3 flex gap-6 border-t border-slate-50">
//                               <div className="h-3 w-1/4 bg-slate-100 rounded" />
//                               <div className="h-3 w-1/4 bg-slate-100 rounded" />
//                               <div className="h-3 w-1/4 bg-slate-100 rounded" />
//                               <div className="h-3 w-1/6 bg-slate-100 rounded" />
//                             </div>
//                           ))}
//                         </div>
//                         <div className="mt-6 pt-4 border-t border-gray-100">
//                           <div className="h-5 w-2/5 bg-slate-200 rounded-md" />
//                         </div>
//                         <div className="flex flex-col gap-2.5 mt-2">
//                           <div className="h-3.5 w-full bg-slate-100 rounded" />
//                           <div className="h-3.5 w-full bg-slate-100 rounded" />
//                           <div className="h-3.5 w-3/4 bg-slate-100 rounded" />
//                           <div className="h-3.5 w-full bg-slate-100 rounded" />
//                           <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
//                         </div>
//                         <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-center">
//                           <div className="h-2.5 w-1/4 bg-slate-100 rounded" />
//                           <div className="h-2.5 w-16 bg-slate-100 rounded" />
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── Template Modal ─────────────────────────────────────── */}
//       {showTemplateModal && (
//         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-xl shadow-md w-full max-w-4xl max-h-[90vh] overflow-y-auto">
//             <div className="p-6 border-b border-gray-100 flex items-center justify-between">
//               <div>
//                 <h2 className="text-xl font-extrabold text-gray-900">Watermark Templates</h2>
//                 <p className="text-sm text-gray-500 mt-0.5">Save reusable watermark configurations</p>
//               </div>
//               <button onClick={() => { setShowTemplateModal(false); setTemplateForm({ ...EMPTY_TEMPLATE }); setEditingTemplateId(null); setLogoPreview(''); setLogoFile(null); }}
//                 className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-lg font-bold">✕</button>
//             </div>

//             <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
//               {/* Left: Form */}
//               <div className="space-y-4">
//                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
//                   {editingTemplateId ? 'Edit Template' : 'New Template'}
//                 </h3>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Template Name *</label>
//                     <input value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value, custom_text: e.target.value }))}
//                       placeholder="e.g. Client Review, Confidential..."
//                       className="w-full px-4 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-brand focus:border-brand transition-all" />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
//                     <input type="email" value={templateForm.email_address} onChange={e => setTemplateForm(f => ({ ...f, email_address: e.target.value }))}
//                       placeholder="e.g. user@example.com"
//                       className="w-full px-4 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-brand focus:border-brand transition-all" />
//                   </div>
//                 </div>



//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Color</label>
//                     <div className="flex items-center gap-2">
//                       <input type="color" value={templateForm.text_color} onChange={e => setTemplateForm(f => ({ ...f, text_color: e.target.value }))}
//                         className="w-10 h-10 border-0 rounded-lg cursor-pointer" />
//                       <span className="text-xs font-mono text-gray-600">{templateForm.text_color.toUpperCase()}</span>
//                     </div>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Font Size ({templateForm.font_size}px)</label>
//                     <input type="range" min="10" max="32" value={templateForm.font_size}
//                       onChange={e => setTemplateForm(f => ({ ...f, font_size: parseInt(e.target.value) }))}
//                       className="w-full accent-[var(--brand)] mt-2" />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Opacity ({templateForm.text_opacity}%)</label>
//                     <input type="range" min="5" max="100" value={templateForm.text_opacity}
//                       onChange={e => setTemplateForm(f => ({ ...f, text_opacity: parseInt(e.target.value) }))}
//                       className="w-full accent-[var(--brand)] mt-2" />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Rotation ({templateForm.rotation}°)</label>
//                     <input type="range" min="-90" max="90" value={templateForm.rotation}
//                       onChange={e => setTemplateForm(f => ({ ...f, rotation: parseInt(e.target.value) }))}
//                       className="w-full accent-brand mt-2" />
//                   </div>
//                 </div>

//                 {/* Logo upload */}
//                 <div className="border-t border-gray-100 pt-4">
//                   <label className="block text-sm font-bold text-gray-700 mb-2">Company Logo (PNG/JPG)</label>
//                   <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/jpg" hidden onChange={handleLogoSelect} />
//                   <div className="flex items-center gap-3">
//                     <button onClick={() => logoRef.current?.click()}
//                       className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
//                       Upload Logo
//                     </button>
//                     {(logoPreview || templateForm.logo_path) && (
//                       <div className="flex items-center gap-2">
//                         <img src={logoPreview || getLogoUrl(templateForm.logo_path)} alt="logo"
//                           className="h-10 w-20 object-contain rounded-lg border border-gray-100 bg-gray-50 p-1" />
//                         <button onClick={() => { setLogoFile(null); setLogoPreview(''); setTemplateForm(f => ({ ...f, logo_path: '' })); }}
//                           className="text-red-400 hover:text-red-600 text-lg">✕</button>
//                       </div>
//                     )}
//                     {!logoPreview && !templateForm.logo_path && (
//                       <span className="text-sm text-gray-400">No logo selected</span>
//                     )}
//                   </div>
//                   {(logoPreview || templateForm.logo_path) && (
//                     <div className="mt-3 grid grid-cols-2 gap-3">
//                       <div>
//                         <label className="block text-xs font-bold text-gray-500 mb-1">Logo Opacity ({Math.round(templateForm.logo_opacity * 100)}%)</label>
//                         <input type="range" min="0.05" max="1" step="0.05" value={templateForm.logo_opacity}
//                           onChange={e => setTemplateForm(f => ({ ...f, logo_opacity: parseFloat(e.target.value) }))}
//                           className="w-full accent-brand" />
//                       </div>
//                       <div>
//                         <label className="block text-xs font-bold text-gray-500 mb-1">Logo Position</label>
//                         <select value={templateForm.logo_position} onChange={e => setTemplateForm(f => ({ ...f, logo_position: e.target.value }))}
// className="w-full px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-brand focus:border-brand transition-all">                          {['top-left','top-center','top-right','middle-left','middle-center','middle-right','bottom-left','bottom-center','bottom-right'].map(p => (
//                             <option key={p} value={p}>{p.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
//                           ))}
//                         </select>
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex gap-3 pt-2">
//                   <button onClick={handleSaveTemplate} disabled={savingTemplate}
//                     className="flex-1 py-2.5 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-90 hover:shadow-sm transition-all disabled:opacity-60">
//                     {savingTemplate ? 'Saving…' : editingTemplateId ? 'Update Template' : 'Save Template'}
//                   </button>
//                   {editingTemplateId && (
//                     <button onClick={() => { setTemplateForm({ ...EMPTY_TEMPLATE }); setEditingTemplateId(null); setLogoPreview(''); setLogoFile(null); }}
//                       className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
//                       Cancel
//                     </button>
//                   )}
//                 </div>
//               </div>

//               {/* Right: Saved templates */}
//               <div>
//                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
//                   Saved Templates ({templates.length})
//                 </h3>
//                 {loadingTemplates ? (
//                   <div className="flex items-center justify-center py-12">
//                     <div className="w-8 h-8 rounded-full border-4 border-[var(--brand)] border-t-transparent animate-spin" />
//                   </div>
//                 ) : templates.length === 0 ? (
//                   <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
//                     <p className="text-gray-400 text-sm">No templates yet. Create one on the left.</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {templates.map(t => {
//                       const isPresent = t.present === true || t.present === 'true';
//                       return (
//                       <div key={t.id} className={`border rounded-lg p-4 transition-all ${isPresent ? 'bg-brand-50/50 border-brand-200 shadow-sm' : 'bg-gray-50/30 border-gray-100 opacity-60 hover:opacity-100'}`}>
//                         <div className="flex items-start justify-between gap-3">
//                           <div className="flex items-center gap-3 flex-1 min-w-0">
//                             {/* Mini preview */}
//                             <div className={`w-12 h-14 bg-white border ${isPresent ? 'border-brand-200' : 'border-gray-200'} rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative`}>
//                               <span style={{ color: t.text_color, fontSize: '5px', fontWeight: 'bold', transform: `rotate(${t.rotation}deg)`, opacity: t.text_opacity / 100, textAlign: 'center', lineHeight: 1.2 }}>
//                                 {t.name?.substring(0, 8)}
//                               </span>
//                               {t.logo_path && (
//                                 <img src={getLogoUrl(t.logo_path)} alt="logo" className="absolute w-5 h-5 object-contain bottom-1 right-1" style={{ opacity: t.logo_opacity }} />
//                               )}
//                             </div>
//                             <div className="flex-1 min-w-0">
//                               <p className="font-bold text-gray-900 text-sm truncate">{t.name}</p>
//                               <p className="text-xs text-gray-500 mt-0.5">{t.name} {t.email_address ? `· ${t.email_address}` : ''} · {t.watermark_type} · {t.text_opacity}% opacity</p>
//                               {t.logo_path && <span className="text-xs text-brand font-medium">🖼 Has logo</span>}
//                             </div>
//                           </div>
//                           <div className="flex gap-2 flex-shrink-0">
//                             {isPresent ? (
//                               <span className="px-3 py-1.5 bg-brand-100 text-brand-dark text-xs font-bold rounded-lg flex items-center gap-1">
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
//                                 Applied
//                               </span>
//                             ) : (
//                               <button onClick={() => applyTemplate(t)}
//                                 className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand hover:border-brand-200 text-xs font-bold rounded-lg transition-colors">Apply</button>
//                             )}
//                             <button onClick={() => handleEditTemplate(t)}
//                               className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-white transition-colors">Edit</button>
//                             <button onClick={() => handleDeleteTemplate(t.id)}
//                               className="px-2 py-1.5 border border-red-100 text-red-400 text-xs rounded-lg hover:bg-red-50 transition-colors">✕</button>
//                           </div>
//                         </div>
//                       </div>
//                     )})}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── Main Page ──────────────────────────────────────────── */}
//       <div className="relative p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700">

//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
//           <div>
//             <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Watermark Settings</h1>
//             <p className="text-gray-500 mt-2 text-[15px]">Protect your confidential files with customizable document watermarks.</p>
//           </div>
//           <div className="flex items-center gap-3">
//             <button onClick={openTemplateModal}
//               className="px-5 py-2.5 border border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] text-sm font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2">
//               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
//               Watermark Templates
//             </button>
//             <button onClick={handleSave} disabled={saving}
//               className="px-6 py-2.5 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-90 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
//               {saving ? (
//                 <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Saving…</>
//               ) : 'Save Changes'}
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

//           {/* Left Panel */}
//           <div className="lg:col-span-7 space-y-6">

//             <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 p-6 space-y-6">



//               {/* Text */}
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-[14px] font-bold text-gray-800 mb-2">Template Name</label>
//                   <input type="text" value={customText} onChange={e => setCustomText(e.target.value)}
//                     placeholder="Enter template name..."
//                     className="w-full px-4 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-[var(--brand)]/10 focus:border-[var(--brand)] transition-all" />
//                 </div>
//                 <div>
//                   <label className="block text-[14px] font-bold text-gray-800 mb-2">Email Address</label>
//                   <input type="email" value={emailText} onChange={e => setEmailText(e.target.value)}
//                     placeholder="Enter email to display in watermark..."
//                     className="w-full px-4 py-2.5 text-[15px] font-medium text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-[var(--brand)]/10 focus:border-[var(--brand)] transition-all" />
//                 </div>


//               </div>

//               {/* Font & Opacity */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-[14px] font-bold text-gray-800 mb-2">Font Size ({fontSize}px)</label>
//                   <input type="range" min="10" max="32" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full accent-[var(--brand)] cursor-pointer" />
//                 </div>
//                 <div>
//                   <label className="block text-[14px] font-bold text-gray-800 mb-2">Opacity ({textOpacity}%)</label>
//                   <input type="range" min="5" max="100" value={textOpacity} onChange={e => setTextOpacity(parseInt(e.target.value))} className="w-full accent-[var(--brand)] cursor-pointer" />
//                 </div>
//               </div>

//               {/* Rotation & Color */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-[14px] font-bold text-gray-800 mb-2">Rotation ({rotation}°)</label>
//                   <input type="range" min="-90" max="90" value={rotation} onChange={e => setRotation(parseInt(e.target.value))} className="w-full accent-[var(--brand)] cursor-pointer" />
//                 </div>
//                 <div>
//                   <label className="block text-[14px] font-bold text-gray-800 mb-2">Watermark Color</label>
//                   <div className="flex items-center gap-3">
//                     <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent" />
//                     <span className="text-sm font-semibold font-mono text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg flex-1 text-center">{textColor.toUpperCase()}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Position Grid */}
//             <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 p-6">
//               <div className="mb-4">
//                 <h3 className="text-md font-bold text-gray-900">Watermark Positions</h3>
//                 <p className="text-[13px] text-gray-500 mt-1">Select areas on the document where the watermark will overlay.</p>
//               </div>
//               <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100 max-w-sm mx-auto">
//                 {Object.keys(positions).map(pos => {
//                   const label = pos.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
//                   return (
//                     <button key={pos} onClick={() => handlePositionToggle(pos)}
//                       className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[11px] font-bold border transition-all ${positions[pos] ? 'bg-brand border-brand text-white shadow-sm scale-[1.03]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
//                       <span className="uppercase text-[9px] tracking-wider">{label}</span>
//                       <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${positions[pos] ? 'bg-white border-white text-brand' : 'border-gray-300 bg-gray-50'}`}>
//                         {positions[pos] && (
//                           <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
//                         )}
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>

//           {/* Right Panel: Live Preview */}
//           <div className="lg:col-span-5 flex flex-col">
//             <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 p-6 flex-1 flex flex-col">
//               <div className="flex items-start justify-between mb-4">
//                 <div>
//                   <h3 className="text-md font-bold text-gray-900">Live Document Preview</h3>
//                   <p className="text-[13px] text-gray-500 mt-1">Real-time simulation of a secured VDR document.</p>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <label className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200">
//                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
//                     {previewDocUrl ? 'Change Doc' : 'Load Doc'}
//                     <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => {
//                       const file = e.target.files?.[0];
//                       if (!file) return;
//                       const isPdf = file.type === 'application/pdf';
//                       const isImage = file.type.startsWith('image/');
//                       if (!isPdf && !isImage) { alert('Please select a PDF or image file'); return; }
//                       if (previewDocUrl) URL.revokeObjectURL(previewDocUrl);
//                       const url = URL.createObjectURL(file);
//                       setPreviewDocUrl(url);
//                       setPreviewDocName(file.name);
//                       setPreviewDocType(isPdf ? 'pdf' : 'image');
//                       e.target.value = '';
//                     }} />
//                   </label>
//                   {previewDocUrl && (
//                     <button onClick={() => { URL.revokeObjectURL(previewDocUrl); setPreviewDocUrl(null); setPreviewDocName(''); setPreviewDocType(''); }}
//                       className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all border border-red-100" title="Clear Document">
//                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
//                     </button>
//                   )}
//                 </div>
//               </div>

//               <div className="relative flex-1 min-h-[420px] bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex flex-col p-4 shadow-inner">
//                 {/* Toolbar */}
//                 <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 flex items-center justify-between mb-4 shadow-sm z-20">
//                   <div className="flex items-center gap-2">
//                     <div className="w-3 h-3 rounded-full bg-red-400" />
//                     <div className="w-3 h-3 rounded-full bg-yellow-400" />
//                     <div className="w-3 h-3 rounded-full bg-green-400" />
//                   </div>
//                   <span className="text-[11px] font-bold text-slate-500 truncate max-w-[200px]">{previewDocName || 'financial_report_q2.pdf'}</span>
//                 </div>

//                 {/* Small Preview Document */}
//                 <div className="relative flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//                   {/* Watermark Overlay - always on top */}
//                   <div className="absolute inset-0 p-4 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 overflow-visible">
//                     {[
//                       { key: 'top-left',      cls: 'flex items-start justify-start' },
//                       { key: 'top-center',    cls: 'flex items-start justify-center' },
//                       { key: 'top-right',     cls: 'flex items-start justify-end' },
//                       { key: 'middle-left',   cls: 'flex items-center justify-start' },
//                       { key: 'middle-center', cls: 'flex items-center justify-center' },
//                       { key: 'middle-right',  cls: 'flex items-center justify-end' },
//                       { key: 'bottom-left',   cls: 'flex items-end justify-start' },
//                       { key: 'bottom-center', cls: 'flex items-end justify-center' },
//                       { key: 'bottom-right',  cls: 'flex items-end justify-end' },
//                     ].map(({ key, cls }) => (
//                       <div key={key} className={`${cls} overflow-visible`}>
//                         {positions[key] && (
//                           <div style={{ transform: `rotate(${rotation}deg)`, color: hexToRGBA(textColor, textOpacity) }}
//                             className="font-bold origin-center transition-all duration-200 flex flex-col items-center justify-center">
//                             {brandLogo && (
//                               <img src={getLogoUrl(brandLogo)} alt="logo" className="h-6 object-contain mb-1 opacity-50" />
//                             )}
//                             <div style={{ fontSize: `${Math.max(10, fontSize * 0.6)}px`, whiteSpace: 'nowrap' }} className="flex flex-col items-center">
//                               {getWatermarkLines().map((line, idx) => (
//                                 <span key={idx} className="block leading-tight">{line}</span>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>

//                   {/* Document Content */}
//                   {previewDocUrl ? (
//                     previewDocType === 'pdf' ? (
//                       <div className="flex-1 overflow-hidden relative">
//                         <iframe src={`${previewDocUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-0" title="PDF Preview" />
//                       </div>
//                     ) : (
//                       <div className="flex-1 flex items-center justify-center p-2 bg-slate-50">
//                         <img src={previewDocUrl} alt="Document Preview" className="max-w-full max-h-full object-contain rounded" />
//                       </div>
//                     )
//                   ) : (
//                     <div className="flex-1 p-6 flex flex-col scale-[0.85] origin-top overflow-y-auto">
//                       <div className="flex flex-col gap-4 relative z-0 pb-10">
//                         <div className="flex items-center justify-between pb-3 border-b border-gray-100">
//                           <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
//                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
//                           </div>
//                           <div className="text-right">
//                             <div className="h-2.5 w-24 bg-slate-200 rounded mb-1" />
//                             <div className="h-2 w-16 bg-slate-100 rounded" />
//                           </div>
//                         </div>
//                         <div className="h-5 w-3/5 bg-slate-300 rounded-md mt-1" />
//                         <div className="h-3 w-2/5 bg-slate-200 rounded" />
//                         <div className="mt-2 flex flex-col gap-2">
//                           <div className="h-2.5 w-full bg-slate-100 rounded" />
//                           <div className="h-2.5 w-full bg-slate-100 rounded" />
//                           <div className="h-2.5 w-5/6 bg-slate-100 rounded" />
//                         </div>
//                         <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
//                           <div className="bg-slate-50 px-3 py-2 flex gap-4">
//                             <div className="h-2 w-1/4 bg-slate-200 rounded" />
//                             <div className="h-2 w-1/4 bg-slate-200 rounded" />
//                             <div className="h-2 w-1/4 bg-slate-200 rounded" />
//                           </div>
//                           {[1,2].map(i => (
//                             <div key={i} className="px-3 py-2 flex gap-4 border-t border-slate-50">
//                               <div className="h-2 w-1/4 bg-slate-100 rounded" />
//                               <div className="h-2 w-1/4 bg-slate-100 rounded" />
//                               <div className="h-2 w-1/4 bg-slate-100 rounded" />
//                             </div>
//                           ))}
//                         </div>
//                         <div className="flex flex-col gap-2 mt-4">
//                           <div className="h-2.5 w-full bg-slate-100 rounded" />
//                           <div className="h-2.5 w-4/5 bg-slate-100 rounded" />
//                           <div className="h-2.5 w-full bg-slate-100 rounded" />
//                           <div className="h-2.5 w-3/4 bg-slate-100 rounded" />
//                           <div className="h-2.5 w-full bg-slate-100 rounded" />
//                         </div>
//                         <div className="flex flex-col gap-2 mt-4">
//                           <div className="h-2.5 w-full bg-slate-100 rounded" />
//                           <div className="h-2.5 w-5/6 bg-slate-100 rounded" />
//                           <div className="h-2.5 w-full bg-slate-100 rounded" />
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Preview Button */}
//               <button onClick={() => setShowPreviewModal(true)}
//                 className="mt-4 w-full flex items-center justify-center gap-2.5 py-3 bg-gradient-to-r from-brand to-brand-dark text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-sm hover:-translate-y-0.5 transition-all">
//                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
//                 Preview Full A4 Document
//               </button>
//             </div>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }








