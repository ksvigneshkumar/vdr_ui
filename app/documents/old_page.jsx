// "use client";

// // /app/documents/page.jsx
// // - Admin view: folder panel + full file management (upload, create folder, move, delete)
// // - User view: NO folder panel, flat list of permitted files with Read/Edit badge + Download button
// // - VDR logo in layout links to /dashboard (handled in layout.jsx)

// import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
// import { useSearchParams, useRouter } from 'next/navigation';
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };
// import fernet from 'fernet';

// export default function DocumentsPage() {
//     return (
//         <Suspense fallback={
//             <div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]">
//                 <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
//             </div>
//         }>
//             <DocumentsPageContent />
//         </Suspense>
//     );
// }

// function DocumentsPageContent() {
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const currentView = searchParams.get('view') || 'files';

//     const [session, setSession] = useState(null);

//     // ── SESSION ───────────────────────────────────────────────────────────────
//     useEffect(() => {
//         const raw = localStorage.getItem('vdr_session');
//         if (!raw) { router.push('/login'); return; }
//         setSession(JSON.parse(raw));
//     }, [router]);

//     if (!session) {
//         return (
//             <div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]">
//                 <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
//             </div>
//         );
//     }

//     // Route to correct view based on role
//     // if (session.role === 'admin') {
//     if (session.role === 'admin' || session.role === 'super_admin') {
//         return <AdminView session={session} currentView={currentView} router={router} />;
//     }
//     return <UserView session={session} currentView={currentView} />;
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // ADMIN VIEW — full folder panel + file management
// // ═══════════════════════════════════════════════════════════════════════════════
// // function AdminView({ session, currentView, router }) {
// //     const [files, setFiles] = useState([]);
// //     const [currentFolderId, setCurrentFolderId] = useState(null);
// //     const [searchQuery, setSearchQuery] = useState('');
// //     const [selectedIds, setSelectedIds] = useState(new Set());
// //     const [typeFilter, setTypeFilter] = useState('all');
// //     const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
// //     const [downloadedIds, setDownloadedIds] = useState(new Set());
// //     const [deletedIds, setDeletedIds] = useState(new Set());
// //     const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
// //     const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
// //     const [newFolderName, setNewFolderName] = useState('');
// //     const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
// //     const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
// //     const [movingToFolderId, setMovingToFolderId] = useState(null);
// //     const [uploadQueue, setUploadQueue] = useState([]);
// //     const [isDeleting, setIsDeleting] = useState(false);
// //     const fileInputRef = useRef(null);

// //     // ── FETCH ─────────────────────────────────────────────────────────────────
// //     useEffect(() => {
// //         (async () => {
// //             try {
// //                 const [{ data: foldersData }, { data: docsData }] = await Promise.all([
// //                     supabase.from('folders').select('*').eq('company_id', session.company_id),
// //                     supabase.from('documents').select('*').eq('company_id', session.company_id).eq('is_deleted', false),
// //                 ]);
// //                 const mappedFolders = (foldersData || []).map(f => ({
// //                     id: f.id, parentId: f.parent_folder_id || null,
// //                     index: f.index_number ? `${f.index_number}.0` : '1.0',
// //                     name: f.name, type: 'folder', size: '--', uploadedBy: 'System',
// //                     dateCreated: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //                     security: 'Encrypted',
// //                 }));
// //                 const mappedDocs = (docsData || []).map(doc => ({
// //                     id: doc.id, parentId: doc.folder_id || null, index: doc.index || '99.0',
// //                     name: doc.name, type: doc.name.split('.').pop().toLowerCase() || 'file',
// //                     size: doc.file_size_bytes > 1024 * 1024
// //                         ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
// //                         : `${(doc.file_size_bytes / 1024).toFixed(0)} KB`,
// //                     uploadedBy: 'Admin',
// //                     dateCreated: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //                     security: doc.security || 'Encrypted',
// //                     is_bookmarked: doc.is_bookmarked,
// //                     is_downloaded: doc.is_downloaded,

// //                     // 🔥 ADD THIS HERE TOO
// //                     file_path: doc.file_path,
// //                     dek_ref: doc.dek_ref
// //                 }));
// //                 // const mappedDocs = (docsData || []).map(doc => ({
// //                 //     id: doc.id, parentId: doc.folder_id || null, index: doc.index || '99.0',
// //                 //     name: doc.name, type: doc.name.split('.').pop().toLowerCase() || 'file',
// //                 //     size: doc.file_size_bytes > 1024 * 1024
// //                 //         ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
// //                 //         : `${(doc.file_size_bytes / 1024).toFixed(0)} KB`,
// //                 //     uploadedBy: 'Admin',
// //                 //     dateCreated: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //                 //     security: doc.security || 'Encrypted',
// //                 //     is_bookmarked: doc.is_bookmarked, is_downloaded: doc.is_downloaded,
// //                 // }));
// //                 setFiles([...mappedFolders, ...mappedDocs]);
// //                 setBookmarkedIds(new Set((docsData || []).filter(d => d.is_bookmarked).map(d => d.id)));
// //                 setDownloadedIds(new Set((docsData || []).filter(d => d.is_downloaded).map(d => d.id)));
// //             } catch (err) { console.error('Failed to fetch:', err); }
// //         })();
// //     }, [session]);

// //     // ── DERIVED ───────────────────────────────────────────────────────────────
// //     const breadcrumbPath = useMemo(() => {
// //         const path = []; let id = currentFolderId;
// //         while (id !== null) {
// //             const folder = files.find(f => f.id === id);
// //             if (folder) { path.unshift(folder); id = folder.parentId; } else break;
// //         }
// //         return path;
// //     }, [currentFolderId, files]);

// //     const currentItems = useMemo(() => {
// //         if (currentView === 'trash') return files.filter(f => deletedIds.has(f.id));
// //         if (currentView === 'bookmarks') return files.filter(f => bookmarkedIds.has(f.id) && !deletedIds.has(f.id));
// //         if (currentView === 'downloads') return files.filter(f => downloadedIds.has(f.id) && !deletedIds.has(f.id));
// //         return files.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
// //     }, [currentFolderId, files, currentView, deletedIds, bookmarkedIds, downloadedIds]);

// //     const filteredItems = useMemo(() => {
// //         let items = currentItems;
// //         if (searchQuery.trim()) {
// //             const q = searchQuery.toLowerCase();
// //             items = items.filter(f => f.name.toLowerCase().includes(q) || f.index.includes(q));
// //         }
// //         if (typeFilter === 'folder') items = items.filter(f => f.type === 'folder');
// //         else if (typeFilter === 'file') items = items.filter(f => f.type !== 'folder');
// //         return [...items].sort((a, b) => {
// //             const pa = a.index.split('.').map(Number);
// //             const pb = b.index.split('.').map(Number);
// //             for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
// //                 const d = (pa[i] || 0) - (pb[i] || 0);
// //                 if (d !== 0) return d;
// //             }
// //             return 0;
// //         });
// //     }, [currentItems, searchQuery, typeFilter]);

// //     const allFolders = useMemo(() => files.filter(f => f.type === 'folder' && !deletedIds.has(f.id)), [files, deletedIds]);
// //     const rootFolders = useMemo(() => allFolders.filter(f => f.parentId === null), [allFolders]);
// //     const getFolderChildCount = (folderId) => files.filter(f => f.parentId === folderId && !deletedIds.has(f.id)).length;
// //     const availableFoldersForMove = allFolders.filter(f => !selectedIds.has(f.id));
// //     const selectedItems = [...selectedIds].map(id => files.find(f => f.id === id)).filter(Boolean);
// //     const selectedHasFiles = selectedItems.some(f => f.type !== 'folder');
// //     const allChecked = filteredItems.length > 0 && selectedIds.size === filteredItems.length;
// //     const someChecked = selectedIds.size > 0 && selectedIds.size < filteredItems.length;

// //     const generateNewIndex = () => {
// //         const peers = files.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
// //         if (currentFolderId === null) {
// //             const max = peers.reduce((m, it) => Math.max(m, parseInt(it.index.split('.')[0]) || 0), 0);
// //             return `${max + 1}.0`;
// //         }
// //         const parent = files.find(f => f.id === currentFolderId);
// //         const prefix = parent?.index?.endsWith('.0') ? parent.index.slice(0, -2) : (parent?.index ?? '1');
// //         const max = peers.reduce((m, it) => {
// //             const parts = it.index.split('.');
// //             return Math.max(m, parseInt(parts[parts.length - 1]) || 0);
// //         }, 0);
// //         return `${prefix}.${max + 1}`;
// //     };

// //     // ── HANDLERS ─────────────────────────────────────────────────────────────
// //     const handleToggleSelect = (id, e) => {
// //         e.stopPropagation();
// //         setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
// //     };
// //     const handleSelectAll = () => setSelectedIds(prev => prev.size === filteredItems.length ? new Set() : new Set(filteredItems.map(f => f.id)));
// //     const handleItemClick = (item) => {
// //         if (item.type === 'folder') {
// //             if (currentView !== 'files') router.push('/documents?view=files');
// //             setCurrentFolderId(item.id); setSelectedIds(new Set()); setSearchQuery(''); setTypeFilter('all');
// //         } else { setSelectedIds(new Set([item.id])); }
// //     };

// //     const handleCreateFolder = async (e) => {
// //         e.preventDefault();
// //         if (!newFolderName.trim()) return;
// //         const newIndex = generateNewIndex();
// //         const { data: dbFolder, error } = await supabase.from('folders').insert({
// //             company_id: session.company_id, parent_folder_id: currentFolderId,
// //             name: newFolderName.trim(), index_number: parseInt(newIndex.split('.')[0]) || 1, created_by: session.id,
// //         }).select().single();
// //         if (error) { alert('Failed to create folder'); return; }
// //         setFiles(prev => [...prev, {
// //             id: dbFolder.id, parentId: dbFolder.parent_folder_id || null, index: newIndex,
// //             name: dbFolder.name, type: 'folder', size: '--', uploadedBy: session.name,
// //             dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //             security: 'Encrypted',
// //         }]);
// //         setNewFolderName(''); setIsNewFolderOpen(false);
// //     };

// //     const executeDelete = async () => {
// //         setIsDeleting(true);
// //         try {
// //             const docIds = [...selectedIds].filter(id => files.find(f => f.id === id)?.type !== 'folder');
// //             const folderIds = [...selectedIds].filter(id => files.find(f => f.id === id)?.type === 'folder');
// //             if (docIds.length > 0) await supabase.from('documents').update({ is_deleted: true }).in('id', docIds);
// //             if (folderIds.length > 0) await supabase.from('folders').delete().in('id', folderIds);
// //             setDeletedIds(prev => { const next = new Set(prev); selectedIds.forEach(id => next.add(id)); return next; });
// //             setSelectedIds(new Set());
// //         } catch (err) { console.error('Delete failed:', err); }
// //         finally { setIsDeleting(false); setIsDeleteModalOpen(false); }
// //     };

// //     const executeMoveToFolder = async () => {
// //         try {
// //             const docIds = [...selectedIds].filter(id => files.find(f => f.id === id)?.type !== 'folder');
// //             if (docIds.length > 0) await supabase.from('documents').update({ folder_id: movingToFolderId }).in('id', docIds);
// //             setFiles(prev => prev.map(f => selectedIds.has(f.id) && f.type !== 'folder' ? { ...f, parentId: movingToFolderId } : f));
// //             setSelectedIds(new Set());
// //         } catch (err) { console.error('Move failed:', err); }
// //         finally { setIsMoveModalOpen(false); }
// //     };

// //     // const handleFileChange = async (e) => {
// //     //     const chosenFiles = Array.from(e.target.files);
// //     //     if (chosenFiles.length === 0) return;
// //     //     const queue = chosenFiles.map((file, idx) => ({
// //     //         id: `up-${Date.now()}-${idx}`, name: file.name,
// //     //         size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`,
// //     //         progress: 0, status: 'uploading',
// //     //     }));
// //     //     setUploadQueue(queue);
// //     //     for (let i = 0; i < chosenFiles.length; i++) {
// //     //         const file = chosenFiles[i]; const qi = queue[i];
// //     //         try {
// //     //             const fileBuffer = await file.arrayBuffer();
// //     //             const cryptoKey = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
// //     //             const iv = window.crypto.getRandomValues(new Uint8Array(12));
// //     //             const encryptedBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, fileBuffer);
// //     //             const rawKey = await window.crypto.subtle.exportKey('raw', cryptoKey);
// //     //             const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
// //     //             const ivBase64 = btoa(String.fromCharCode(...iv));
// //     //             const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
// //     //             const newIndex = generateNewIndex();
// //     //             const res = await fetch('/api/documents/upload', {
// //     //                 method: 'POST', headers: { 'Content-Type': 'application/json' },
// //     //                 body: JSON.stringify({
// //     //                     company_id: session.company_id, folder_id: currentFolderId,
// //     //                     uploaded_by: session.id, name: file.name, file_data: encryptedBase64,
// //     //                     mime_type: file.type || 'application/octet-stream', file_size_bytes: file.size,
// //     //                     dek_ref: `${ivBase64}:${keyBase64}`, index: newIndex, security: 'Encrypted',
// //     //                 }),
// //     //             });
// //     //             if (!res.ok) throw new Error('Upload failed');
// //     //             const { id: docId } = await res.json();
// //     //             setUploadQueue(prev => prev.map(it => it.id === qi.id ? { ...it, progress: 100, status: 'completed' } : it));
// //     //             setFiles(prev => [...prev, {
// //     //                 id: docId, parentId: currentFolderId, index: newIndex, name: file.name,
// //     //                 type: file.name.split('.').pop().toLowerCase() || 'file', size: qi.size,
// //     //                 uploadedBy: session.name,
// //     //                 dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //     //                 security: 'Encrypted',
// //     //             }]);
// //     //         } catch (err) {
// //     //             console.error('Upload failed:', err);
// //     //             setUploadQueue(prev => prev.map(it => it.id === qi.id ? { ...it, status: 'error' } : it));
// //     //         }
// //     //     }
// //     //     setTimeout(() => { setUploadQueue([]); setIsUploadModalOpen(false); }, 800);
// //     //     e.target.value = '';
// //     // };
// //     const handleFileChange = async (e) => {
// //         const chosenFiles = Array.from(e.target.files);
// //         if (chosenFiles.length === 0 || !session) return;

// //         setUploadQueue(chosenFiles.map((f, i) => ({
// //             id: `up-${Date.now()}-${i}`,
// //             name: f.name,
// //             progress: 0,
// //             size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
// //             status: 'uploading'
// //         })));

// //         // Helper function to read file as Base64 (Required for Fernet)
// //         const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
// //             const reader = new FileReader();
// //             reader.onload = () => {
// //                 // Extract just the base64 string, removing the "data:application/pdf;base64," prefix
// //                 const b64 = reader.result.split(',')[1];
// //                 resolve(b64);
// //             };
// //             reader.onerror = reject;
// //             reader.readAsDataURL(file);
// //         });

// //         for (let i = 0; i < chosenFiles.length; i++) {
// //             const file = chosenFiles[i];
// //             try {
// //                 // 1. 🔥 Generate a 32-byte URL-safe Base64 Key for Fernet
// //                 const randomBytes = window.crypto.getRandomValues(new Uint8Array(32));
// //                 const fernetKey = btoa(String.fromCharCode(...randomBytes))
// //                     .replace(/\+/g, '-')
// //                     .replace(/\//g, '_')
// //                     .replace(/=+$/, ''); // Make it URL-safe

// //                 // 2. 🔥 Read file as Base64 and Encrypt with Fernet
// //                 const base64Data = await readFileAsBase64(file);
// //                 const secret = new fernet.Secret(fernetKey);
// //                 const token = new fernet.Token({ secret: secret });
// //                 const encryptedString = token.encode(base64Data);

// //                 // 3. Prepare the encrypted string as a Blob for uploading
// //                 const encryptedBlob = new Blob([encryptedString], { type: 'text/plain' });
// //                 const newIndex = generateNewIndex();

// //                 // 4. Upload Fernet Encrypted Blob to Bucket
// //                 const storagePath = `${session.company_id}/${Date.now()}_${file.name}`;
// //                 const { error: storageErr } = await supabase.storage
// //                     .from('vault-files')
// //                     .upload(storagePath, encryptedBlob, { contentType: 'text/plain' });

// //                 if (storageErr) throw new Error("Bucket Upload Failed: " + storageErr.message);

// //                 // 5. Send Metadata to Database (Save the Fernet Key as dek_ref)
// //                 const res = await fetch('/api/documents/upload', {
// //                     method: 'POST',
// //                     headers: { 'Content-Type': 'application/json' },
// //                     body: JSON.stringify({
// //                         company_id: session.company_id,
// //                         folder_id: currentFolderId,
// //                         uploaded_by: session.id,
// //                         name: file.name,
// //                         file_path: storagePath,
// //                         mime_type: file.type || 'application/octet-stream',
// //                         file_size_bytes: file.size,
// //                         dek_ref: fernetKey, // 🔥 Only saving the Fernet key now!
// //                         index: newIndex,
// //                         security: 'Fernet Encrypted'
// //                     })
// //                 });

// //                 if (!res.ok) throw new Error('DB Sync failed');
// //                 const { id: docId } = await res.json();

// //                 // 6. Success Update UI
// //                 setUploadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, progress: 100, status: 'completed' } : it));
// //                 setFiles(prev => [...prev, {
// //                     id: docId, parentId: currentFolderId, index: newIndex, name: file.name,
// //                     type: file.name.split('.').pop().toLowerCase() || 'file', size: file.size, uploadedBy: session.name,
// //                     dateCreated: new Date().toLocaleDateString(), security: 'Fernet Encrypted', file_path: storagePath
// //                 }]);

// //             } catch (err) {
// //                 console.error('Upload failed:', err);
// //                 setUploadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error' } : it));
// //             }
// //         }
// //         setTimeout(() => { setUploadQueue([]); setIsUploadModalOpen(false); }, 1500);
// //     };
// //     return (
// //         <div className="relative flex w-full h-full bg-[#F8F9FB] overflow-hidden text-slate-800 font-sans">
// //             <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

// //             {/* ── FOLDER PANEL ─────────────────────────────────────────────── */}
// //             <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
// //                 <div className="px-4 pt-5 pb-3 border-b border-slate-100">
// //                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folders</p>
// //                 </div>
// //                 <div className="flex-1 overflow-y-auto py-2 px-2">
// //                     <button
// //                         onClick={() => { setCurrentFolderId(null); setTypeFilter('all'); }}
// //                         className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-semibold transition-all mb-0.5
// //                             ${currentFolderId === null && currentView === 'files' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
// //                     >
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-70"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
// //                         All Files
// //                     </button>
// //                     <div className="h-px bg-slate-100 my-2 mx-1" />
// //                     {rootFolders.length === 0
// //                         ? <p className="text-[11px] text-slate-400 text-center py-4 px-2">No folders yet</p>
// //                         : <FolderTree folders={allFolders} parentId={null} currentFolderId={currentFolderId}
// //                             onSelect={(id) => {
// //                                 if (currentView !== 'files') router.push('/documents?view=files');
// //                                 setCurrentFolderId(id); setSelectedIds(new Set()); setTypeFilter('all');
// //                             }}
// //                             getChildCount={getFolderChildCount} />
// //                     }
// //                 </div>
// //                 <div className="p-3 border-t border-slate-100">
// //                     <button onClick={() => setIsNewFolderOpen(true)}
// //                         className="w-full flex items-center justify-center gap-2 py-2 text-[11.5px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all border border-dashed border-slate-200">
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
// //                         New Folder
// //                     </button>
// //                 </div>
// //             </aside>

// //             {/* ── MAIN ─────────────────────────────────────────────────────── */}
// //             <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">

// //                 {/* Header */}
// //                 <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-200 bg-white">
// //                     <div className="flex items-center gap-2 min-w-0">
// //                         <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest shrink-0">
// //                             {currentView === 'trash' ? 'Trash' : currentView === 'bookmarks' ? 'Bookmarks' : currentView === 'downloads' ? 'Downloads' : 'Files'}
// //                         </span>
// //                         {currentView === 'files' && breadcrumbPath.map((item, idx) => {
// //                             const isLast = idx === breadcrumbPath.length - 1;
// //                             return (
// //                                 <React.Fragment key={item.id}>
// //                                     <span className="text-slate-300 font-light">/</span>
// //                                     <button onClick={() => !isLast && setCurrentFolderId(item.id)}
// //                                         className={`text-[13px] font-black truncate max-w-[140px] transition-colors ${isLast ? 'text-slate-800' : 'text-slate-400 hover:text-slate-700 underline underline-offset-2'}`}>
// //                                         {item.name}
// //                                     </button>
// //                                 </React.Fragment>
// //                             );
// //                         })}
// //                         {currentFolderId !== null && (
// //                             <button onClick={() => { const parent = files.find(f => f.id === currentFolderId); setCurrentFolderId(parent?.parentId ?? null); }}
// //                                 className="ml-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
// //                                 <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
// //                                 Back
// //                             </button>
// //                         )}
// //                     </div>
// //                     <div className="relative w-56">
// //                         <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
// //                         <input type="text" placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
// //                             className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" />
// //                     </div>
// //                 </div>

// //                 {/* Toolbar */}
// //                 <div className="flex items-center justify-between px-7 py-3 bg-white border-b border-slate-100 gap-4">
// //                     <div className="flex items-center gap-2 flex-wrap">
// //                         <button onClick={() => setIsUploadModalOpen(true)}
// //                             className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-[12px] font-bold rounded-xl transition-all">
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
// //                             Upload
// //                         </button>
// //                         <button onClick={() => setIsNewFolderOpen(true)}
// //                             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-xl hover:bg-slate-50 transition-all">
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
// //                             Add Folder
// //                         </button>
// //                         {selectedIds.size > 0 && (
// //                             <>
// //                                 <div className="w-px h-5 bg-slate-200 mx-1" />
// //                                 <span className="text-[11.5px] font-bold text-slate-500 px-1">{selectedIds.size} selected</span>
// //                                 {selectedHasFiles && (
// //                                     <button onClick={() => { setMovingToFolderId(null); setIsMoveModalOpen(true); }}
// //                                         className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 text-[12px] font-bold rounded-xl hover:bg-blue-100 transition-all">
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></svg>
// //                                         Move to Folder
// //                                     </button>
// //                                 )}
// //                                 <button onClick={() => setIsDeleteModalOpen(true)}
// //                                     className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-bold rounded-xl hover:bg-rose-100 transition-all">
// //                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
// //                                     Delete
// //                                 </button>
// //                             </>
// //                         )}
// //                     </div>
// //                     <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
// //                         {[{ key: 'all', label: 'All' }, { key: 'folder', label: 'Folders' }, { key: 'file', label: 'Files' }].map(tab => (
// //                             <button key={tab.key} onClick={() => setTypeFilter(tab.key)}
// //                                 className={`px-3.5 py-1.5 text-[11.5px] font-bold rounded-lg transition-all ${typeFilter === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
// //                                 {tab.label}
// //                             </button>
// //                         ))}
// //                     </div>
// //                 </div>

// //                 {/* New folder inline form */}
// //                 {isNewFolderOpen && (
// //                     <form onSubmit={handleCreateFolder} className="flex items-center gap-3 px-7 py-3 bg-amber-50/60 border-b border-amber-100">
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
// //                         <input type="text" placeholder="Folder name..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
// //                             className="flex-1 max-w-xs px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-slate-400" autoFocus />
// //                         <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white text-[12px] font-bold rounded-xl">Create</button>
// //                         <button type="button" onClick={() => { setIsNewFolderOpen(false); setNewFolderName(''); }} className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-500 text-[12px] font-bold rounded-xl">Cancel</button>
// //                     </form>
// //                 )}

// //                 {/* File table */}
// //                 <div className="flex-1 overflow-auto px-7 py-5">
// //                     <div className="rounded-lg border border-slate-200 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
// //                         <table className="w-full min-w-[700px] border-collapse text-left">
// //                             <thead>
// //                                 <tr className="border-b border-slate-100 bg-slate-50/60">
// //                                     <th className="py-3.5 px-4 w-10">
// //                                         <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked; }} onChange={handleSelectAll} className="w-4 h-4 rounded border-slate-300 accent-slate-900" />
// //                                     </th>
// //                                     <th className="py-3.5 px-3 w-20 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Index</th>
// //                                     <th className="py-3.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
// //                                     <th className="py-3.5 px-3 w-24 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Size</th>
// //                                     <th className="py-3.5 px-3 w-36 text-[10px] font-black text-slate-400 uppercase tracking-widest">Uploaded By</th>
// //                                     <th className="py-3.5 px-3 w-32 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
// //                                     <th className="py-3.5 px-3 w-10"></th>
// //                                 </tr>
// //                             </thead>
// //                             <tbody className="divide-y divide-slate-50">
// //                                 {filteredItems.length === 0 ? (
// //                                     <tr><td colSpan="7" className="py-24 text-center">
// //                                         <div className="flex flex-col items-center gap-3 text-slate-400">
// //                                             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
// //                                             <span className="text-[13px] font-bold">{searchQuery ? 'No results found' : 'This folder is empty'}</span>
// //                                         </div>
// //                                     </td></tr>
// //                                 ) : filteredItems.map(item => {
// //                                     const isChecked = selectedIds.has(item.id);
// //                                     const childCount = item.type === 'folder' ? getFolderChildCount(item.id) : null;
// //                                     return (
// //                                         <tr key={item.id} onClick={() => handleItemClick(item)}
// //                                             className={`group cursor-pointer transition-all duration-150 ${isChecked ? 'bg-slate-50 border-l-[3px] border-slate-900' : 'border-l-[3px] border-transparent hover:bg-slate-50/60'}`}>
// //                                             <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
// //                                                 <input type="checkbox" checked={isChecked} onChange={e => handleToggleSelect(item.id, e)} className="w-4 h-4 rounded border-slate-300 accent-slate-900" />
// //                                             </td>
// //                                             <td className="py-3.5 px-3 text-center font-mono text-[11.5px] font-semibold text-slate-400">{item.index}</td>
// //                                             <td className="py-3.5 px-3">
// //                                                 <div className="flex items-center gap-3">
// //                                                     {renderFileIcon(item.type)}
// //                                                     <div className="min-w-0">
// //                                                         <p className="font-semibold text-[13px] text-slate-700 truncate">{item.name}</p>
// //                                                         {item.type === 'folder' && <p className="text-[11px] text-slate-400 font-medium">{childCount} item{childCount !== 1 ? 's' : ''}</p>}
// //                                                     </div>
// //                                                 </div>
// //                                             </td>
// //                                             <td className="py-3.5 px-3 text-center text-[12.5px] font-medium text-slate-400">{item.size}</td>
// //                                             <td className="py-3.5 px-3 text-[12.5px] font-semibold text-slate-600">{item.uploadedBy}</td>
// //                                             <td className="py-3.5 px-3 text-[12px] font-bold text-slate-400">{item.dateCreated}</td>
// //                                             <td className="py-3.5 px-3">
// //                                                 {item.type === 'folder' && (
// //                                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-slate-500 transition-colors"><polyline points="9 18 15 12 9 6" /></svg>
// //                                                 )}
// //                                             </td>
// //                                         </tr>
// //                                     );
// //                                 })}
// //                             </tbody>
// //                         </table>
// //                     </div>
// //                     <div className="flex items-center justify-between mt-3 px-1">
// //                         <p className="text-[11.5px] text-slate-400 font-semibold">
// //                             {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}{typeFilter !== 'all' && ` · filtered by ${typeFilter}s`}
// //                         </p>
// //                         {selectedIds.size > 0 && (
// //                             <button onClick={() => setSelectedIds(new Set())} className="text-[11.5px] text-slate-400 font-semibold hover:text-slate-700 transition-colors">Clear selection</button>
// //                         )}
// //                     </div>
// //                 </div>
// //             </div>

// //             {/* Upload Modal */}
// //             {isUploadModalOpen && (
// //                 <Modal onClose={() => setIsUploadModalOpen(false)}>
// //                     <h3 className="text-[16px] font-black text-slate-800 mb-5">Secure Upload</h3>
// //                     <div onClick={() => fileInputRef.current?.click()}
// //                         className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-slate-200 bg-slate-50 rounded-lg cursor-pointer hover:border-slate-400 hover:bg-slate-100 transition-all">
// //                         <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center">
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
// //                         </div>
// //                         <div className="text-center">
// //                             <p className="font-bold text-[13.5px] text-slate-800">Click to browse files</p>
// //                             <p className="text-[11.5px] text-slate-400 mt-0.5">Files are AES-256 encrypted on upload</p>
// //                         </div>
// //                     </div>
// //                     {uploadQueue.length > 0 && (
// //                         <div className="mt-4 space-y-2">
// //                             {uploadQueue.map(item => (
// //                                 <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
// //                                     <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 shrink-0">{item.name.split('.').pop().toUpperCase()}</div>
// //                                     <div className="flex-1 min-w-0">
// //                                         <p className="text-[12px] font-semibold text-slate-700 truncate">{item.name}</p>
// //                                         <p className="text-[10.5px] text-slate-400">{item.size}</p>
// //                                     </div>
// //                                     {item.status === 'completed' && <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
// //                                     {item.status === 'error' && <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
// //                                     {item.status === 'uploading' && <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin shrink-0" />}
// //                                 </div>
// //                             ))}
// //                         </div>
// //                     )}
// //                 </Modal>
// //             )}

// //             {/* Delete Modal */}
// //             {isDeleteModalOpen && (
// //                 <Modal onClose={() => setIsDeleteModalOpen(false)} maxWidth="max-w-sm">
// //                     <div className="flex flex-col items-center gap-4 text-center">
// //                         <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
// //                         </div>
// //                         <div>
// //                             <h3 className="text-[15px] font-black text-slate-800">Delete {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''}?</h3>
// //                             <p className="text-[12.5px] text-slate-500 mt-1">This will move them to Trash. You can restore later.</p>
// //                         </div>
// //                         <div className="flex gap-2 w-full">
// //                             <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-[12.5px] font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
// //                             <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-2.5 bg-rose-600 text-white text-[12.5px] font-bold rounded-xl hover:bg-rose-700 transition-all disabled:opacity-60">
// //                                 {isDeleting ? 'Deleting...' : 'Delete'}
// //                             </button>
// //                         </div>
// //                     </div>
// //                 </Modal>
// //             )}

// //             {/* Move Modal */}
// //             {isMoveModalOpen && (
// //                 <Modal onClose={() => setIsMoveModalOpen(false)} maxWidth="max-w-sm">
// //                     <h3 className="text-[15px] font-black text-slate-800 mb-4">Move {selectedIds.size} file{selectedIds.size !== 1 ? 's' : ''} to…</h3>
// //                     <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
// //                         <button onClick={() => setMovingToFolderId(null)}
// //                             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[12.5px] font-semibold transition-all ${movingToFolderId === null ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-60"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
// //                             Root (no folder)
// //                         </button>
// //                         {availableFoldersForMove.map(folder => (
// //                             <button key={folder.id} onClick={() => setMovingToFolderId(folder.id)}
// //                                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[12.5px] font-semibold transition-all ${movingToFolderId === folder.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
// //                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" className="shrink-0"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
// //                                 <span className="truncate">{folder.name}</span>
// //                                 <span className="ml-auto text-[10.5px] opacity-50 font-mono shrink-0">{folder.index}</span>
// //                             </button>
// //                         ))}
// //                         {availableFoldersForMove.length === 0 && <p className="text-[12px] text-slate-400 text-center py-6">No folders available. Create one first.</p>}
// //                     </div>
// //                     <div className="flex gap-2">
// //                         <button onClick={() => setIsMoveModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-[12.5px] font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
// //                         <button onClick={executeMoveToFolder} className="flex-1 py-2.5 bg-slate-900 text-white text-[12.5px] font-bold rounded-xl hover:bg-slate-700 transition-all">Move Here</button>
// //                     </div>
// //                 </Modal>
// //             )}
// //         </div>
// //     );
// // }

// // ═══════════════════════════════════════════════════════════════════════════════
// // ADMIN VIEW — full folder panel + file management
// // ═══════════════════════════════════════════════════════════════════════════════
// function AdminView({ session, currentView, router }) {
//     const [files, setFiles] = useState([]);
//     const [currentFolderId, setCurrentFolderId] = useState(null);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [selectedIds, setSelectedIds] = useState(new Set());
//     const [typeFilter, setTypeFilter] = useState('all');
//     const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
//     const [downloadedIds, setDownloadedIds] = useState(new Set());
//     const [deletedIds, setDeletedIds] = useState(new Set());
//     const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
//     const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
//     const [newFolderName, setNewFolderName] = useState('');
//     const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//     const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
//     const [movingToFolderId, setMovingToFolderId] = useState(null);
//     const [uploadQueue, setUploadQueue] = useState([]);
//     const [isDeleting, setIsDeleting] = useState(false);
//     const [isConfirmPermanentDeleteOpen, setIsConfirmPermanentDeleteOpen] = useState(false);
//     const [isDownloadChoiceOpen, setIsDownloadChoiceOpen] = useState(false);
//     const fileInputRef = useRef(null);
//     const folderInputRef = useRef(null);


//     // ── FETCH ─────────────────────────────────────────────────────────────────
//     useEffect(() => {
//         (async () => {
//             try {
//                 const [{ data: foldersData }, { data: docsData }, { data: usersData }] = await Promise.all([
//                     supabase.from('folders').select('*').eq('company_id', session.company_id),
//                     supabase.from('documents').select('*').eq('company_id', session.company_id),
//                     supabase.from('users').select('id, name, role').eq('company_id', session.company_id),
//                 ]);

//                 // Build a user name lookup map
//                 const userMap = {};
//                 (usersData || []).forEach(u => {
//                     userMap[u.id] = u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1).replace('_', ' ') : 'System';
//                 });

//                 // const mappedFolders = (foldersData || []).map(f => ({
//                 //     id: f.id, parentId: f.parent_folder_id || null,
//                 //     index: f.index_number ? `${f.index_number}.0` : '1.0',
//                 //     name: f.name, type: 'folder', size: '--', uploadedBy: userMap[f.created_by] || 'Unknown',
//                 //     dateCreated: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
//                 //     security: 'Encrypted',
//                 // }));

//                 const mappedFolders = (foldersData || []).map(f => ({
//                     id: f.id, parentId: f.parent_folder_id || null,
//                     index: f.index_number ? f.index_number.toString() : '1', // <-- Changed here
//                     name: f.name, type: 'folder', size: '--', uploadedBy: userMap[f.created_by] || 'Unknown',
//                     dateCreated: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
//                 }));
//                 // const mappedDocs = (docsData || []).map(doc => ({
//                 //     id: doc.id, parentId: doc.folder_id || null, index: doc.index || '99.0',
//                 //     name: doc.name, type: doc.name.split('.').pop().toLowerCase() || 'file',
//                 //     rawSize: doc.file_size_bytes || 0,
//                 //     size: doc.file_size_bytes > 1024 * 1024
//                 //         ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
//                 //         : `${(doc.file_size_bytes / 1024).toFixed(0)} KB`,
//                 //     uploadedBy: userMap[doc.uploaded_by] || 'Unknown',
//                 //     dateCreated: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
//                 //     security: doc.security || 'Encrypted',
//                 //     is_bookmarked: doc.is_bookmarked,
//                 //     is_downloaded: doc.is_downloaded,
//                 //     is_deleted: doc.is_deleted,

//                 //     // 🔥 ADD THIS HERE TOO
//                 //     file_path: doc.file_path,
//                 //     dek_ref: doc.dek_ref,
//                 //     mime_type: doc.mime_type
//                 // }));

//                 const mappedDocs = (docsData || []).map(doc => ({
//                     id: doc.id, parentId: doc.folder_id || null,
//                     index: doc.index ? doc.index.toString().replace('.0', '') : '99', // <-- Changed here
//                     name: doc.name, type: doc.name.split('.').pop().toLowerCase() || 'file',
//                     size: doc.file_size_bytes > 1024 * 1024 ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : `${(doc.file_size_bytes / 1024).toFixed(0)} KB`,
//                     uploadedBy: userMap[doc.uploaded_by] || 'Unknown',
//                     dateCreated: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
//                 }));

//                 setFiles([...mappedFolders, ...mappedDocs]);
//                 setBookmarkedIds(new Set((docsData || []).filter(d => d.is_bookmarked).map(d => d.id)));
//                 setDownloadedIds(new Set((docsData || []).filter(d => d.is_downloaded).map(d => d.id)));
//                 setDeletedIds(new Set((docsData || []).filter(d => d.is_deleted).map(d => d.id)));
//             } catch (err) { console.error('Failed to fetch:', err); }
//         })();
//     }, [session]);

//     // ── DERIVED ───────────────────────────────────────────────────────────────
//     const filesWithSizes = useMemo(() => {
//         const getFolderSize = (folderId, itemsList) => {
//             let totalBytes = 0;
//             // Direct files in this folder (excluding folders and deleted items)
//             const filesInFolder = itemsList.filter(item => item.parentId === folderId && item.type !== 'folder' && !deletedIds.has(item.id));
//             filesInFolder.forEach(f => {
//                 totalBytes += (f.rawSize || 0);
//             });
//             // Subfolders (excluding deleted ones)
//             const subfolders = itemsList.filter(item => item.parentId === folderId && item.type === 'folder' && !deletedIds.has(item.id));
//             subfolders.forEach(sf => {
//                 totalBytes += getFolderSize(sf.id, itemsList);
//             });
//             return totalBytes;
//         };

//         return files.map(item => {
//             if (item.type === 'folder') {
//                 const bytes = getFolderSize(item.id, files);
//                 const formattedSize = bytes > 1024 * 1024
//                     ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
//                     : `${(bytes / 1024).toFixed(0)} KB`;
//                 return { ...item, rawSize: bytes, size: formattedSize };
//             }
//             return item;
//         });
//     }, [files, deletedIds]);

//     const breadcrumbPath = useMemo(() => {
//         const path = []; let id = currentFolderId;
//         while (id !== null) {
//             const folder = filesWithSizes.find(f => f.id === id);
//             if (folder) { path.unshift(folder); id = folder.parentId; } else break;
//         }
//         return path;
//     }, [currentFolderId, filesWithSizes]);

//     const currentItems = useMemo(() => {
//         if (currentView === 'trash') return filesWithSizes.filter(f => deletedIds.has(f.id));
//         if (currentView === 'bookmarks') return filesWithSizes.filter(f => bookmarkedIds.has(f.id) && !deletedIds.has(f.id));
//         if (currentView === 'downloads') return filesWithSizes.filter(f => downloadedIds.has(f.id) && !deletedIds.has(f.id));
//         return filesWithSizes.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
//     }, [currentFolderId, filesWithSizes, currentView, deletedIds, bookmarkedIds, downloadedIds]);

//     const filteredItems = useMemo(() => {
//         let items = currentItems;
//         if (searchQuery.trim()) {
//             const q = searchQuery.toLowerCase();
//             items = items.filter(f => f.name.toLowerCase().includes(q) || f.index.includes(q));
//         }
//         if (typeFilter === 'folder') items = items.filter(f => f.type === 'folder');
//         else if (typeFilter === 'file') items = items.filter(f => f.type !== 'folder');
//         return [...items].sort((a, b) => {
//             const pa = a.index.split('.').map(Number);
//             const pb = b.index.split('.').map(Number);
//             for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
//                 const d = (pa[i] || 0) - (pb[i] || 0);
//                 if (d !== 0) return d;
//             }
//             return 0;
//         });
//     }, [currentItems, searchQuery, typeFilter]);

//     const allFolders = useMemo(() => filesWithSizes.filter(f => f.type === 'folder' && !deletedIds.has(f.id)), [filesWithSizes, deletedIds]);
//     const rootFolders = useMemo(() => allFolders.filter(f => f.parentId === null), [allFolders]);
//     const getFolderChildCount = (folderId) => filesWithSizes.filter(f => f.parentId === folderId && !deletedIds.has(f.id)).length;
//     const availableFoldersForMove = allFolders.filter(f => !selectedIds.has(f.id));
//     const selectedItems = [...selectedIds].map(id => filesWithSizes.find(f => f.id === id)).filter(Boolean);
//     const selectedHasFiles = selectedItems.some(f => f.type !== 'folder');
//     const allChecked = filteredItems.length > 0 && selectedIds.size === filteredItems.length;
//     const someChecked = selectedIds.size > 0 && selectedIds.size < filteredItems.length;

//     // const generateNewIndex = () => {
//     //     const peers = filesWithSizes.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
//     //     // Find the highest existing integer and add 1
//     //     const max = peers.reduce((m, it) => Math.max(m, parseInt(it.index) || 0), 0);
//     //     return (max + 1).toString();
//     // }
//     const generateNewIndex = () => {
//         const peers = filesWithSizes.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
//         if (currentFolderId === null) {
//             // const max = peers.reduce((m, it) => Math.max(m, parseInt(it.index.split('.')[0]) || 0), 0);
//             // return `${max + 1}.0`;
//             const max = peers.reduce((m, it) => Math.max(m, parseInt(it.index) || 0), 0);
//             return (max + 1).toString();
//         }
//         const parent = files.find(f => f.id === currentFolderId);
//         const prefix = parent?.index?.endsWith('.0') ? parent.index.slice(0, -2) : (parent?.index ?? '1');
//         const max = peers.reduce((m, it) => {
//             const parts = it.index.split('.');
//             return Math.max(m, parseInt(parts[parts.length - 1]) || 0);
//         }, 0);
//         return `${prefix}.${max + 1}`;
//     };

//     // ── HANDLERS ─────────────────────────────────────────────────────────────
//     const handleToggleSelect = (id, e) => {
//         e.stopPropagation();
//         setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
//     };
//     const handleSelectAll = () => setSelectedIds(prev => prev.size === filteredItems.length ? new Set() : new Set(filteredItems.map(f => f.id)));
//     const handleItemClick = (item) => {
//         if (item.type === 'folder') {
//             if (currentView !== 'files') router.push('/documents?view=files');
//             setCurrentFolderId(item.id); setSelectedIds(new Set()); setSearchQuery(''); setTypeFilter('all');
//         } else { setSelectedIds(new Set([item.id])); }
//     };

//     const handleCreateFolder = async (e) => {
//         e.preventDefault();
//         if (!newFolderName.trim()) return;
//         const newIndex = generateNewIndex();
//         const { data: dbFolder, error } = await supabase.from('folders').insert({
//             company_id: session.company_id, parent_folder_id: currentFolderId,
//             name: newFolderName.trim(), index_number: parseInt(newIndex.split('.')[0]) || 1, created_by: session.id,
//         }).select().single();
//         if (error) { alert('Failed to create folder'); return; }
//         setFiles(prev => [...prev, {
//             id: dbFolder.id, parentId: dbFolder.parent_folder_id || null, index: newIndex,
//             name: dbFolder.name, type: 'folder', size: '--', uploadedBy: session.role ? session.role.charAt(0).toUpperCase() + session.role.slice(1).replace('_', ' ') : 'System',
//             dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
//             security: 'Encrypted',
//         }]);
//         setNewFolderName(''); setIsNewFolderOpen(false);
//     };

//     const executeDelete = async () => {
//         setIsDeleting(true);
//         try {
//             const docIds = [...selectedIds].filter(id => files.find(f => f.id === id)?.type !== 'folder');
//             const folderIds = [...selectedIds].filter(id => files.find(f => f.id === id)?.type === 'folder');
//             if (docIds.length > 0) await supabase.from('documents').update({ is_deleted: true }).in('id', docIds);
//             if (folderIds.length > 0) await supabase.from('folders').delete().in('id', folderIds);
//             setDeletedIds(prev => { const next = new Set(prev); selectedIds.forEach(id => next.add(id)); return next; });
//             setFiles(prev => prev.map(f => selectedIds.has(f.id) && f.type !== 'folder' ? { ...f, is_deleted: true } : f));
//             setSelectedIds(new Set());
//         } catch (err) { console.error('Delete failed:', err); }
//         finally { setIsDeleting(false); setIsDeleteModalOpen(false); }
//     };

//     const executeRestoreSelected = async () => {
//         if (selectedIds.size === 0) return;
//         try {
//             const docIds = [...selectedIds].filter(id => files.find(f => f.id === id)?.type !== 'folder');
//             if (docIds.length > 0) {
//                 const { error } = await supabase.from('documents').update({ is_deleted: false }).in('id', docIds);
//                 if (error) throw error;
//             }
//             setDeletedIds(prev => {
//                 const next = new Set(prev);
//                 selectedIds.forEach(id => next.delete(id));
//                 return next;
//             });
//             setFiles(prev => prev.map(f => selectedIds.has(f.id) ? { ...f, is_deleted: false } : f));
//             setSelectedIds(new Set());
//         } catch (err) {
//             console.error('Restore failed:', err);
//             alert('Failed to restore items');
//         }
//     };

//     const executeDeletePermanently = async () => {
//         if (selectedIds.size === 0) return;
//         setIsDeleting(true);
//         try {
//             const docIds = [...selectedIds].filter(id => files.find(f => f.id === id)?.type !== 'folder');
//             if (docIds.length > 0) {
//                 const { error } = await supabase.from('documents').delete().in('id', docIds);
//                 if (error) throw error;
//             }
//             setFiles(prev => prev.filter(f => !selectedIds.has(f.id)));
//             setDeletedIds(prev => {
//                 const next = new Set(prev);
//                 selectedIds.forEach(id => next.delete(id));
//                 return next;
//             });
//             setSelectedIds(new Set());
//         } catch (err) {
//             console.error('Permanent delete failed:', err);
//             alert('Failed to delete permanently');
//         } finally {
//             setIsDeleting(false);
//             setIsConfirmPermanentDeleteOpen(false);
//         }
//     };

//     const executeDownload = async (type) => {
//         if (selectedIds.size === 0) {
//             alert('Please select files to download.');
//             return;
//         }

//         for (let id of selectedIds) {
//             const file = files.find(f => f.id === id);
//             if (!file || file.type === 'folder') continue;

//             try {
//                 const { data, error } = await supabase.storage.from('vault-files').download(file.file_path);
//                 if (error) throw error;

//                 if (type === 'encrypted') {
//                     const url = URL.createObjectURL(data);
//                     const a = document.createElement('a');
//                     a.href = url;
//                     a.download = `${file.name}.enc`;
//                     a.click();
//                     URL.revokeObjectURL(url);
//                 } else if (type === 'original') {
//                     const text = await data.text();
//                     const secret = new fernet.Secret(file.dek_ref);
//                     const token = new fernet.Token({ secret: secret, token: text, ttl: 0 });
//                     const decryptedBase64 = token.decode();

//                     const byteCharacters = atob(decryptedBase64);
//                     const byteNumbers = new Array(byteCharacters.length);
//                     for (let i = 0; i < byteCharacters.length; i++) {
//                         byteNumbers[i] = byteCharacters.charCodeAt(i);
//                     }
//                     const byteArray = new Uint8Array(byteNumbers);
//                     const blob = new Blob([byteArray], { type: file.mime_type || 'application/octet-stream' });

//                     const url = URL.createObjectURL(blob);
//                     const a = document.createElement('a');
//                     a.href = url;
//                     a.download = file.name;
//                     a.click();
//                     URL.revokeObjectURL(url);
//                 }
//             } catch (err) {
//                 console.error(`Download failed for ${file.name}:`, err);
//                 alert(`Failed to download ${file.name}`);
//             }
//         }
//     };

//     const handleExport = () => {
//         const exportFiles = selectedIds.size > 0 ? files.filter(f => selectedIds.has(f.id)) : files.filter(f => f.parentId === currentFolderId);
//         if (exportFiles.length === 0) {
//             alert('No files to export.');
//             return;
//         }

//         let csv = 'Name,Type,Size,Uploaded By,Date Created,Status\n';
//         exportFiles.forEach(f => {
//             csv += `"${f.name}","${f.type}","${f.size}","${f.uploadedBy}","${f.dateCreated}","${f.is_deleted ? 'Trash' : 'Active'}"\n`;
//         });

//         // Adding the \uFEFF BOM forces Excel/Windows to read it as UTF-8 cleanly
//         const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `vdr_export_${Date.now()}.csv`;
//         a.click();
//         URL.revokeObjectURL(url);
//     };

//     const executeMoveToFolder = async () => {
//         try {
//             const docIds = [...selectedIds].filter(id => files.find(f => f.id === id)?.type !== 'folder');
//             if (docIds.length > 0) await supabase.from('documents').update({ folder_id: movingToFolderId }).in('id', docIds);
//             setFiles(prev => prev.map(f => selectedIds.has(f.id) && f.type !== 'folder' ? { ...f, parentId: movingToFolderId } : f));
//             setSelectedIds(new Set());
//         } catch (err) { console.error('Move failed:', err); }
//         finally { setIsMoveModalOpen(false); }
//     };

//     const toggleBookmark = async (item, e) => {
//         e.stopPropagation();
//         const isBookmarked = bookmarkedIds.has(item.id);
//         const newBookmarked = new Set(bookmarkedIds);
//         if (isBookmarked) {
//             newBookmarked.delete(item.id);
//         } else {
//             newBookmarked.add(item.id);
//         }
//         setBookmarkedIds(newBookmarked);

//         if (item.type !== 'folder') {
//             try {
//                 const { error } = await supabase
//                     .from('documents')
//                     .update({ is_bookmarked: !isBookmarked })
//                     .eq('id', item.id);
//                 if (error) throw error;
//             } catch (err) {
//                 console.error('Failed to toggle bookmark:', err);
//                 // Rollback
//                 setBookmarkedIds(bookmarkedIds);
//             }
//         }
//     };

//     const handleFileChange = async (e) => {
//         const chosenFiles = Array.from(e.target.files);
//         if (chosenFiles.length === 0 || !session) return;

//         setUploadQueue(chosenFiles.map((f, i) => ({
//             id: `up-${Date.now()}-${i}`,
//             name: f.name,
//             progress: 0,
//             size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
//             status: 'uploading'
//         })));

//         // Helper function to read file as Base64 (Required for Fernet)
//         const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
//             const reader = new FileReader();
//             reader.onload = () => {
//                 // Extract just the base64 string, removing the "data:application/pdf;base64," prefix
//                 const b64 = reader.result.split(',')[1];
//                 resolve(b64);
//             };
//             reader.onerror = reject;
//             reader.readAsDataURL(file);
//         });

//         for (let i = 0; i < chosenFiles.length; i++) {
//             const file = chosenFiles[i];
//             try {
//                 // 1. 🔥 Generate a 32-byte URL-safe Base64 Key for Fernet
//                 const randomBytes = window.crypto.getRandomValues(new Uint8Array(32));
//                 const fernetKey = btoa(String.fromCharCode(...randomBytes))
//                     .replace(/\+/g, '-')
//                     .replace(/\//g, '_')
//                     .replace(/=+$/, ''); // Make it URL-safe

//                 // 2. 🔥 Read file as Base64 and Encrypt with Fernet
//                 const base64Data = await readFileAsBase64(file);
//                 const secret = new fernet.Secret(fernetKey);
//                 const token = new fernet.Token({ secret: secret });
//                 const encryptedString = token.encode(base64Data);

//                 // 3. Prepare the encrypted string as a Blob for uploading
//                 const encryptedBlob = new Blob([encryptedString], { type: 'text/plain' });
//                 const newIndex = generateNewIndex();

//                 // 4. Upload Fernet Encrypted Blob to Bucket
//                 const storagePath = `${session.company_id}/${Date.now()}_${file.name}`;
//                 const { error: storageErr } = await supabase.storage
//                     .from('vault-files')
//                     .upload(storagePath, encryptedBlob, { contentType: 'text/plain' });

//                 if (storageErr) throw new Error("Bucket Upload Failed: " + storageErr.message);

//                 // 5. Send Metadata to Database (Save the Fernet Key as dek_ref)
//                 const res = await fetch('/api/documents/upload', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({
//                         company_id: session.company_id,
//                         folder_id: currentFolderId,
//                         uploaded_by: session.id,
//                         name: file.name,
//                         file_path: storagePath,
//                         mime_type: file.type || 'application/octet-stream',
//                         file_size_bytes: file.size,
//                         dek_ref: fernetKey, // 🔥 Only saving the Fernet key now!
//                         index: newIndex,
//                         security: 'Fernet Encrypted'
//                     })
//                 });

//                 if (!res.ok) throw new Error('DB Sync failed');
//                 const { id: docId } = await res.json();

//                 // 6. Success Update UI
//                 setUploadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, progress: 100, status: 'completed' } : it));
//                 const formattedSize = file.size > 1024 * 1024
//                     ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
//                     : `${(file.size / 1024).toFixed(0)} KB`;
//                 setFiles(prev => [...prev, {
//                     id: docId, parentId: currentFolderId, index: newIndex, name: file.name,
//                     type: file.name.split('.').pop().toLowerCase() || 'file',
//                     rawSize: file.size,
//                     size: formattedSize,
//                     uploadedBy: session.role ? session.role.charAt(0).toUpperCase() + session.role.slice(1).replace('_', ' ') : 'System',
//                     dateCreated: new Date().toLocaleDateString(), security: 'Fernet Encrypted', file_path: storagePath,
//                     dek_ref: fernetKey, mime_type: file.type || 'application/octet-stream'
//                 }]);

//             } catch (err) {
//                 console.error('Upload failed:', err);
//                 setUploadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error' } : it));
//             }
//         }
//         setTimeout(() => { setUploadQueue([]); setIsUploadModalOpen(false); }, 1500);
//     };

//     return (
//         <div className="relative flex w-full h-full bg-[#F8F9FB] overflow-hidden text-slate-800 font-sans">
//             <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
//             <input type="file" webkitdirectory="true" directory="" multiple ref={folderInputRef} onChange={handleFileChange} className="hidden" />



//             {/* ── MAIN ─────────────────────────────────────────────────────── */}
//             <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
//                 <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-200 bg-white">
//                     <div className="flex items-center gap-2 min-w-0">
//                         <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest shrink-0">
//                             {currentView === 'trash' ? 'Trash' : currentView === 'bookmarks' ? 'Bookmarks' : currentView === 'downloads' ? 'Downloads' : 'Files'}
//                         </span>
//                         {currentView === 'files' && breadcrumbPath.map((item, idx) => {
//                             const isLast = idx === breadcrumbPath.length - 1;
//                             return (
//                                 <React.Fragment key={item.id}>
//                                     <span className="text-slate-300 font-light">/</span>
//                                     <button onClick={() => !isLast && setCurrentFolderId(item.id)}
//                                         className={`text-[13px] font-black truncate max-w-[140px] transition-colors ${isLast ? 'text-slate-800' : 'text-slate-400 hover:text-slate-700 underline underline-offset-2'}`}>
//                                         {item.name}
//                                     </button>
//                                 </React.Fragment>
//                             );
//                         })}
//                         {currentFolderId !== null && (
//                             <button onClick={() => { const parent = files.find(f => f.id === currentFolderId); setCurrentFolderId(parent?.parentId ?? null); }}
//                                 className="ml-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
//                                 Back
//                             </button>
//                         )}
//                     </div>

//                     {/* Elegant side-by-side spacing with matching theme */}
//                     <div className="flex items-center gap-3">
//                         <a
//                             href="https://docs.google.com/uc?export=download&id=1_P4RNa4fb1tcfUiud0LvY5l7phens3hL"
//                             className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-[12px] font-bold rounded-xl transition-all shadow-sm shrink-0"
//                         >
//                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//                                 <polyline points="7 10 12 15 17 10" />
//                                 <line x1="12" y1="15" x2="12" y2="3" />
//                                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
//                             </svg>
//                             Electron App
//                         </a>

//                         <div className="relative w-56">
//                             <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
//                             <input type="text" placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
//                                 className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" />
//                         </div>
//                     </div>
//                 </div>

//                 {/* Toolbar */}
//                 <div className="flex items-center justify-between px-7 py-3 bg-white border-b border-slate-100 gap-4">
//                     <div className="flex items-center gap-2 flex-wrap">
//                         {currentView === 'trash' ? (
//                             <>
//                                 <button onClick={executeRestoreSelected} disabled={selectedIds.size === 0}
//                                     className={`flex items-center gap-2 px-4 py-2 text-[12px] font-bold rounded-xl transition-all ${selectedIds.size > 0 ? 'bg-blue-50 border border-blue-100 text-blue-700 text-[12px] font-bold rounded-xl hover:bg-blue-100 transition-all cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
//                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
//                                     Recover
//                                 </button>
//                                 <button onClick={() => setIsConfirmPermanentDeleteOpen(true)} disabled={selectedIds.size === 0}
//                                     className={`flex items-center gap-2 px-4 py-2 text-[12px] font-bold rounded-xl transition-all ${selectedIds.size > 0 ? 'bg-rose-50 border border-rose-100 text-rose-700 text-[12px] font-bold rounded-xl hover:bg-rose-100 transition-all cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
//                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
//                                     Delete Permanently
//                                 </button>
//                                 {selectedIds.size > 0 && (
//                                     <>
//                                         <div className="w-px h-5 bg-slate-200 mx-1" />
//                                         <span className="text-[11.5px] font-bold text-slate-500 px-1">{selectedIds.size} selected</span>
//                                     </>
//                                 )}
//                             </>
//                         ) : (
//                             <>
//                                 <button onClick={() => setIsUploadModalOpen(true)}
//                                     className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-[12px] font-bold rounded-xl transition-all">
//                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
//                                     Upload
//                                 </button>
//                                 <button onClick={() => setIsNewFolderOpen(true)}
//                                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-xl hover:bg-slate-50 transition-all">
//                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
//                                     Add Folder
//                                 </button>
//                                 <button onClick={() => setIsDownloadChoiceOpen(true)}
//                                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-xl hover:bg-slate-50 transition-all">
//                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
//                                     Download
//                                 </button>
//                                 <button onClick={handleExport}
//                                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-xl hover:bg-slate-50 transition-all">
//                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
//                                     Export
//                                 </button>
//                                 <div className="w-px h-5 bg-slate-200 mx-1" />

//                                 <button onClick={() => { if (selectedIds.size > 0) { setMovingToFolderId(null); setIsMoveModalOpen(true); } }}
//                                     disabled={selectedIds.size === 0}
//                                     className={`flex items-center gap-2 px-4 py-2 text-[12px] font-bold rounded-xl transition-all ${selectedIds.size > 0 ? 'bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 cursor-pointer' : 'bg-blue-50 border border-blue-100 text-blue-600 cursor-not-allowed'}`}>
//                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></svg>
//                                     Move to Folder
//                                 </button>
//                                 <button onClick={() => { if (selectedIds.size > 0) setIsDeleteModalOpen(true); }}
//                                     disabled={selectedIds.size === 0}
//                                     className={`flex items-center gap-2 px-4 py-2 text-[12px] font-bold rounded-xl transition-all ${selectedIds.size > 0 ? 'bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 cursor-pointer' : 'bg-rose-50 border border-rose-100 text-rose-600 cursor-not-allowed'}`}>
//                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
//                                     Delete
//                                 </button>
//                                 {selectedIds.size > 0 && (
//                                     <span className="text-[11.5px] font-bold text-slate-500 px-1">{selectedIds.size} selected</span>
//                                 )}
//                             </>
//                         )}
//                     </div>
//                     <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
//                         {[{ key: 'all', label: 'All' }, { key: 'folder', label: 'Folders' }, { key: 'file', label: 'Files' }].map(tab => (
//                             <button key={tab.key} onClick={() => setTypeFilter(tab.key)}
//                                 className={`px-3.5 py-1.5 text-[11.5px] font-bold rounded-lg transition-all ${typeFilter === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
//                                 {tab.label}
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 {/* New folder inline form */}
//                 {isNewFolderOpen && (
//                     <form onSubmit={handleCreateFolder} className="flex items-center gap-3 px-7 py-3 bg-amber-50/60 border-b border-amber-100">
//                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
//                         <input type="text" placeholder="Folder name..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
//                             className="flex-1 max-w-xs px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-slate-400" autoFocus />
//                         <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white text-[12px] font-bold rounded-xl">Create</button>
//                         <button type="button" onClick={() => { setIsNewFolderOpen(false); setNewFolderName(''); }} className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-500 text-[12px] font-bold rounded-xl">Cancel</button>
//                     </form>
//                 )}

//                 {/* File table */}
//                 <div className="flex-1 overflow-auto px-7 py-5">
//                     <div className="rounded-lg border border-slate-200 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
//                         <table className="w-full min-w-[700px] border-collapse text-left">
//                             <thead>
//                                 <tr className="border-b border-slate-100 bg-slate-50/60">
//                                     <th className="py-3.5 px-4 w-10">
//                                         <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked; }} onChange={handleSelectAll} className="w-4 h-4 rounded border-slate-300 accent-slate-900" />
//                                     </th>
//                                     <th className="py-3.5 px-3 w-20 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Index</th>
//                                     <th className="py-3.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
//                                     <th className="py-3.5 px-3 w-24 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Size</th>
//                                     <th className="py-3.5 px-3 w-36 text-[10px] font-black text-slate-400 uppercase tracking-widest">Uploaded By</th>
//                                     <th className="py-3.5 px-3 w-32 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
//                                     <th className="py-3.5 px-3 w-16 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Starred</th>
//                                     <th className="py-3.5 px-3 w-10"></th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-slate-50">
//                                 {filteredItems.length === 0 ? (
//                                     <tr><td colSpan="8" className="py-24 text-center">
//                                         <div className="flex flex-col items-center gap-3 text-slate-400">
//                                             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
//                                             <span className="text-[13px] font-bold">{searchQuery ? 'No results found' : 'This folder is empty'}</span>
//                                         </div>
//                                     </td></tr>
//                                 ) : filteredItems.map((item, idx) => {
//                                     const isChecked = selectedIds.has(item.id);
//                                     const childCount = item.type === 'folder' ? getFolderChildCount(item.id) : null;
//                                     return (
//                                         <tr key={item.id} onClick={() => handleItemClick(item)}
//                                             className={`group cursor-pointer transition-all duration-150 ${isChecked ? 'bg-slate-50 border-l-[3px] border-slate-900' : 'border-l-[3px] border-transparent hover:bg-slate-50/60'}`}>
//                                             <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
//                                                 <input type="checkbox" checked={isChecked} onChange={e => handleToggleSelect(item.id, e)} className="w-4 h-4 rounded border-slate-300 accent-slate-900" />
//                                             </td>
//                                             <td className="py-3.5 px-3 text-center font-mono text-[11.5px] font-semibold text-slate-400">{idx + 1}</td>
//                                             <td className="py-3.5 px-3">
//                                                 <div className="flex items-center gap-3">
//                                                     {renderFileIcon(item.type)}
//                                                     <div className="min-w-0">
//                                                         <p className="font-semibold text-[13px] text-slate-700 truncate">{item.name}</p>
//                                                         {item.type === 'folder' && <p className="text-[11px] text-slate-400 font-medium">{childCount} item{childCount !== 1 ? 's' : ''}</p>}
//                                                     </div>
//                                                 </div>
//                                             </td>
//                                             <td className="py-3.5 px-3 text-center text-[12.5px] font-medium text-slate-400">{item.size}</td>
//                                             <td className="py-3.5 px-3 text-[12.5px] font-semibold text-slate-600">{item.uploadedBy}</td>
//                                             <td className="py-3.5 px-3 text-[12px] font-bold text-slate-400">{item.dateCreated}</td>
//                                             <td className="py-3.5 px-3 text-center" onClick={e => e.stopPropagation()}>
//                                                 <button
//                                                     onClick={(e) => toggleBookmark(item, e)}
//                                                     className="text-slate-400 hover:text-amber-500 hover:scale-110 active:scale-95 transition-all focus:outline-none"
//                                                 >
//                                                     {bookmarkedIds.has(item.id) ? (
//                                                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2">
//                                                             <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
//                                                         </svg>
//                                                     ) : (
//                                                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 hover:opacity-100 transition-opacity">
//                                                             <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
//                                                         </svg>
//                                                     )}
//                                                 </button>
//                                             </td>
//                                             <td className="py-3.5 px-3">
//                                                 {item.type === 'folder' && (
//                                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-slate-500 transition-colors"><polyline points="9 18 15 12 9 6" /></svg>
//                                                 )}
//                                             </td>
//                                         </tr>
//                                     );
//                                 })}
//                             </tbody>
//                         </table>
//                     </div>
//                     <div className="flex items-center justify-between mt-3 px-1">
//                         <p className="text-[11.5px] text-slate-400 font-semibold">
//                             {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}{typeFilter !== 'all' && ` · filtered by ${typeFilter}s`}
//                         </p>
//                         {selectedIds.size > 0 && (
//                             <button onClick={() => setSelectedIds(new Set())} className="text-[11.5px] text-slate-400 font-semibold hover:text-slate-700 transition-colors">Clear selection</button>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* ── ALL MODALS MOVED INSIDE THE MAIN RETURN JSX BLOCK ── */}

//             {/* Upload Modal */}
//             {isUploadModalOpen && (
//                 <Modal onClose={() => setIsUploadModalOpen(false)}>
//                     <h3 className="text-[16px] font-black text-slate-800 mb-5">Secure Upload</h3>

//                     {/* CHOICES */}
//                     <div className="flex gap-4 mb-4">
//                         <button onClick={() => fileInputRef.current?.click()}
//                             className="flex-1 flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 bg-slate-50 rounded-lg hover:border-slate-400 hover:bg-slate-100 transition-all">
//                             <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
//                             </div>
//                             <span className="text-[12.5px] font-bold text-slate-700">Upload Files</span>
//                         </button>
//                         <button onClick={() => folderInputRef.current?.click()}
//                             className="flex-1 flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-amber-200 bg-amber-50 rounded-lg hover:border-amber-400 hover:bg-amber-100 transition-all">
//                             <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
//                             </div>
//                             <span className="text-[12.5px] font-bold text-slate-700">Upload Folder</span>
//                         </button>
//                     </div>

//                     <div className="text-center mb-2">
//                         <p className="text-[11.5px] text-slate-400 mt-0.5">Files are AES-256 encrypted on upload</p>
//                     </div>
//                     {uploadQueue.length > 0 && (
//                         <div className="mt-4 space-y-2">
//                             {uploadQueue.map(item => (
//                                 <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
//                                     <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 shrink-0">{item.name.split('.').pop().toUpperCase()}</div>
//                                     <div className="flex-1 min-w-0">
//                                         <p className="text-[12px] font-semibold text-slate-700 truncate">{item.name}</p>
//                                         <p className="text-[10.5px] text-slate-400">{item.size}</p>
//                                     </div>
//                                     {item.status === 'completed' && <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
//                                     {item.status === 'error' && <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
//                                     {item.status === 'uploading' && <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin shrink-0" />}
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </Modal>
//             )}

//             {/* Delete Modal */}
//             {isDeleteModalOpen && (
//                 <Modal onClose={() => setIsDeleteModalOpen(false)} maxWidth="max-w-sm">
//                     <div className="flex flex-col items-center gap-4 text-center">
//                         <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
//                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
//                         </div>
//                         <div>
//                             <h3 className="text-[15px] font-black text-slate-800">Delete {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''}?</h3>
//                             <p className="text-[12.5px] text-slate-500 mt-1">This will move them to Trash. You can restore later.</p>
//                         </div>
//                         <div className="flex gap-2 w-full">
//                             <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-[12.5px] font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
//                             <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-2.5 bg-rose-600 text-white text-[12.5px] font-bold rounded-xl hover:bg-rose-700 transition-all disabled:opacity-60">
//                                 {isDeleting ? 'Deleting...' : 'Delete'}
//                             </button>
//                         </div>
//                     </div>
//                 </Modal>
//             )}

//             {/* Confirm Permanent Delete Modal */}
//             {isConfirmPermanentDeleteOpen && (
//                 <Modal onClose={() => setIsConfirmPermanentDeleteOpen(false)} maxWidth="max-w-sm">
//                     <div className="flex flex-col items-center gap-4 text-center">
//                         <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
//                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
//                         </div>
//                         <div>
//                             <h3 className="text-[15px] font-black text-slate-800">Permanently delete {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''}?</h3>
//                             <p className="text-[12.5px] text-slate-500 mt-1">This action cannot be undone. The files will be permanently erased.</p>
//                         </div>
//                         <div className="flex gap-2 w-full">
//                             <button onClick={() => setIsConfirmPermanentDeleteOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-[12.5px] font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
//                             <button onClick={executeDeletePermanently} disabled={isDeleting} className="flex-1 py-2.5 bg-rose-600 text-white text-[12.5px] font-bold rounded-xl hover:bg-rose-700 transition-all disabled:opacity-60">
//                                 {isDeleting ? 'Deleting...' : 'Delete Permanently'}
//                             </button>
//                         </div>
//                     </div>
//                 </Modal>
//             )}

//             {/* Download Choice Modal */}
//             {isDownloadChoiceOpen && (
//                 <Modal onClose={() => setIsDownloadChoiceOpen(false)} maxWidth="max-w-sm">
//                     <h3 className="text-[16px] font-black text-slate-800 mb-5">Download Options</h3>
//                     <div className="flex gap-4">
//                         <button onClick={() => { setIsDownloadChoiceOpen(false); executeDownload('original'); }}
//                             className="flex-1 flex flex-col items-center justify-center gap-3 p-6 border border-slate-200 bg-slate-50 rounded-lg hover:border-slate-400 hover:bg-slate-100 transition-all">
//                             <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" /></svg>
//                             </div>
//                             <span className="text-[12.5px] font-bold text-slate-700">Original File</span>
//                         </button>
//                         <button onClick={() => { setIsDownloadChoiceOpen(false); executeDownload('encrypted'); }}
//                             className="flex-1 flex flex-col items-center justify-center gap-3 p-6 border border-slate-200 bg-slate-50 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all">
//                             <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
//                             </div>
//                             <span className="text-[12.5px] font-bold text-slate-700">Encrypted</span>
//                         </button>
//                     </div>
//                 </Modal>
//             )}

//             {/* Move Modal */}
//             {isMoveModalOpen && (
//                 <Modal onClose={() => setIsMoveModalOpen(false)} maxWidth="max-w-sm">
//                     <h3 className="text-[15px] font-black text-slate-800 mb-4">Move {selectedIds.size} file{selectedIds.size !== 1 ? 's' : ''} to…</h3>
//                     <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
//                         <button onClick={() => setMovingToFolderId(null)}
//                             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[12.5px] font-semibold transition-all ${movingToFolderId === null ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
//                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-60"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
//                             Root (no folder)
//                         </button>
//                         {availableFoldersForMove.map(folder => (
//                             <button key={folder.id} onClick={() => setMovingToFolderId(folder.id)}
//                                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[12.5px] font-semibold transition-all ${movingToFolderId === folder.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" className="shrink-0"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
//                                 <span className="truncate">{folder.name}</span>
//                                 <span className="ml-auto text-[10.5px] opacity-50 font-mono shrink-0">{folder.index}</span>
//                             </button>
//                         ))}
//                         {availableFoldersForMove.length === 0 && <p className="text-[12px] text-slate-400 text-center py-6">No folders available. Create one first.</p>}
//                     </div>
//                     <div className="flex gap-2">
//                         <button onClick={() => setIsMoveModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-[12.5px] font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
//                         <button onClick={executeMoveToFolder} className="flex-1 py-2.5 bg-slate-900 text-white text-[12.5px] font-bold rounded-xl hover:bg-slate-700 transition-all">Move Here</button>
//                     </div>
//                 </Modal>
//             )}
//         </div>
//     );
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // USER VIEW — flat list of permitted files, access badge, download button
// // NO folder panel (clean single-panel layout)
// // ═══════════════════════════════════════════════════════════════════════════════
// function UserView({ session, currentView }) {
//     const [files, setFiles] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [downloading, setDownloading] = useState({}); // { [docId]: true }

//     // ── FETCH permitted files ─────────────────────────────────────────────────
//     useEffect(() => {
//         (async () => {
//             setLoading(true);
//             try {
//                 // Get all permissions for this user
//                 const { data: perms } = await supabase
//                     .from('document_permissions')
//                     .select('doc_id, can_read, can_edit')
//                     .eq('user_id', session.id)
//                     .eq('can_read', true);

//                 if (!perms || perms.length === 0) { setFiles([]); setLoading(false); return; }

//                 const docIds = perms.map(p => p.doc_id);
//                 const { data: docs } = await supabase
//                     .from('documents')
//                     .select('*')
//                     .in('id', docIds)
//                     .eq('is_deleted', false);

//                 const permMap = {};
//                 perms.forEach(p => { permMap[p.doc_id] = { can_read: p.can_read, can_edit: p.can_edit }; });

//                 setFiles((docs || []).map(doc => ({
//                     id: doc.id,
//                     index: doc.index || '1.0',
//                     name: doc.name,
//                     type: doc.name.split('.').pop().toLowerCase() || 'file',
//                     size: doc.file_size_bytes > 1024 * 1024
//                         ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
//                         : `${(doc.file_size_bytes / 1024).toFixed(0)} KB`,
//                     dateCreated: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
//                     can_read: permMap[doc.id]?.can_read || false,
//                     can_edit: permMap[doc.id]?.can_edit || false,

//                     // 🔥 THE FIX IS RIGHT HERE: Add the file_path so the download button can see it!
//                     file_path: doc.file_path,

//                     dek_ref: doc.dek_ref,
//                     mime_type: doc.mime_type,
//                     is_bookmarked: doc.is_bookmarked,
//                     is_downloaded: doc.is_downloaded,
//                 })));
//                 // setFiles((docs || []).map(doc => ({
//                 //     id: doc.id,
//                 //     index: doc.index || '1.0',
//                 //     name: doc.name,
//                 //     type: doc.name.split('.').pop().toLowerCase() || 'file',
//                 //     size: doc.file_size_bytes > 1024 * 1024
//                 //         ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
//                 //         : `${(doc.file_size_bytes / 1024).toFixed(0)} KB`,
//                 //     dateCreated: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
//                 //     can_read: permMap[doc.id]?.can_read || false,
//                 //     can_edit: permMap[doc.id]?.can_edit || false,
//                 //     file_data: doc.file_data,
//                 //     dek_ref: doc.dek_ref,
//                 //     mime_type: doc.mime_type,
//                 // })));
//             } catch (err) { console.error('User fetch failed:', err); }
//             finally { setLoading(false); }
//         })();
//     }, [session]);

//     const handleDownload = async (file) => {
//         setDownloading(prev => ({ ...prev, [file.id]: true }));
//         try {
//             // 🔥 THE FIX: We DO NOT download the heavy file from the bucket here.
//             // We generate a tiny "Keycard" file containing ONLY the Document ID.
//             // Electron will read this ID, verify permissions, and download the real file into RAM!

//             const keycardContent = file.id;
//             const blob = new Blob([keycardContent], { type: 'text/plain' });

//             const url = URL.createObjectURL(blob);
//             const a = document.createElement('a');
//             a.href = url;

//             a.download = `${file.name}.vdr`; // Saves as OS-recognized Keycard

//             document.body.appendChild(a);
//             a.click();
//             document.body.removeChild(a);
//             URL.revokeObjectURL(url);

//             // Mark as downloaded in DB
//             await supabase.from('documents').update({ is_downloaded: true }).eq('id', file.id);

//         } catch (err) {
//             console.error('Download failed:', err);
//             alert('Download failed. Please try again.');
//         } finally {
//             setDownloading(prev => { const n = { ...prev }; delete n[file.id]; return n; });
//         }
//     };
//     const toggleBookmark = async (file, e) => {
//         e.stopPropagation();
//         const isBookmarked = file.is_bookmarked;
//         setFiles(prev => prev.map(f => f.id === file.id ? { ...f, is_bookmarked: !isBookmarked } : f));
//         try {
//             const { error } = await supabase
//                 .from('documents')
//                 .update({ is_bookmarked: !isBookmarked })
//                 .eq('id', file.id);
//             if (error) throw error;
//         } catch (err) {
//             console.error('Failed to toggle bookmark:', err);
//             setFiles(prev => prev.map(f => f.id === file.id ? { ...f, is_bookmarked: isBookmarked } : f));
//         }
//     };

//     const filteredFiles = useMemo(() => {
//         let items = files;
//         if (currentView === 'bookmarks') {
//             items = items.filter(f => f.is_bookmarked);
//         } else if (currentView === 'downloads') {
//             items = items.filter(f => f.is_downloaded);
//         }
//         if (searchQuery.trim()) {
//             items = items.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
//         }
//         return items;
//     }, [files, currentView, searchQuery]);

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]">
//                 <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
//             </div>
//         );
//     }

//     return (
//         <div className="flex flex-col w-full h-full bg-[#F8F9FB] overflow-hidden text-slate-800 font-sans">

//             {/* Header */}
//             {/* <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-200 bg-white">
//                 <div>
//                     <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">My Documents</span>
//                     <p className="text-[11px] text-slate-400 mt-0.5">{files.length} file{files.length !== 1 ? 's' : ''} shared with you</p>
//                 </div>
//                 <div className="relative w-56">
//                     <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
//                     <input type="text" placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
//                         className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" />
//                 </div>
//             </div> */}
//             {/* ── CLEANED USERVIEW HEADER BLOCK ── */}
//             <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-200 bg-white">
//                 <div>
//                     <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">My Documents</span>
//                     <p className="text-[11px] text-slate-400 mt-0.5">{files.length} file{files.length !== 1 ? 's' : ''} shared with you</p>
//                 </div>

//                 {/* Elegant side-by-side spacing with matching theme */}
//                 <div className="flex items-center gap-3">
//                     <a
//                         href="https://docs.google.com/uc?export=download&id=1_P4RNa4fb1tcfUiud0LvY5l7phens3hL"
//                         className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-[12px] font-bold rounded-xl transition-all shadow-sm shrink-0"
//                     >
//                         <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//                             <polyline points="7 10 12 15 17 10" />
//                             <line x1="12" y1="15" x2="12" y2="3" />
//                             <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
//                         </svg>
//                         Electron App
//                     </a>

//                     <div className="relative w-56">
//                         <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
//                         <input type="text" placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
//                             className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" />
//                     </div>
//                 </div>
//             </div>
//             {/* Table */}
//             <div className="flex-1 overflow-auto px-7 py-5">
//                 {filteredFiles.length === 0 ? (
//                     <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
//                         <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
//                         <div className="text-center">
//                             <p className="text-[14px] font-bold text-slate-500">No documents shared with you</p>
//                             <p className="text-[12px] text-slate-400 mt-1">Contact your admin to get access to files.</p>
//                         </div>
//                     </div>
//                 ) : (
//                     <div className="rounded-lg border border-slate-200 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
//                         <table className="w-full min-w-[600px] border-collapse text-left">
//                             <thead>
//                                 <tr className="border-b border-slate-100 bg-slate-50/60">
//                                     <th className="py-3.5 px-4 w-20 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Index</th>
//                                     <th className="py-3.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
//                                     <th className="py-3.5 px-3 w-24 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Size</th>
//                                     <th className="py-3.5 px-3 w-28 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Access</th>
//                                     <th className="py-3.5 px-3 w-32 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
//                                     <th className="py-3.5 px-3 w-16 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Starred</th>
//                                     <th className="py-3.5 px-3 w-32 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-slate-50">
//                                 {filteredFiles.map((file, idx) => {
//                                     const isDownloading = downloading[file.id];
//                                     // Access badge
//                                     let accessLabel = 'Read Only';
//                                     let accessClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
//                                     if (file.can_edit) { accessLabel = 'Can Edit'; accessClass = 'bg-blue-50 text-blue-700 border border-blue-100'; }

//                                     return (
//                                         <tr key={file.id} className="hover:bg-slate-50/60 transition-all duration-150">
//                                             <td className="py-3.5 px-4 text-center font-mono text-[11.5px] font-semibold text-slate-400">{idx + 1}</td>
//                                             <td className="py-3.5 px-3">
//                                                 <div className="flex items-center gap-3">
//                                                     {renderFileIcon(file.type)}
//                                                     <p className="font-semibold text-[13px] text-slate-700 truncate max-w-[280px]">{file.name}</p>
//                                                 </div>
//                                             </td>
//                                             <td className="py-3.5 px-3 text-center text-[12.5px] font-medium text-slate-400">{file.size}</td>
//                                             <td className="py-3.5 px-3 text-center">
//                                                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold ${accessClass}`}>
//                                                     {file.can_edit
//                                                         ? <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
//                                                         : <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
//                                                     }
//                                                     {accessLabel}
//                                                 </span>
//                                             </td>
//                                             <td className="py-3.5 px-3 text-[12px] font-bold text-slate-400">{file.dateCreated}</td>
//                                             <td className="py-3.5 px-3 text-center" onClick={e => e.stopPropagation()}>
//                                                 <button
//                                                     onClick={(e) => toggleBookmark(file, e)}
//                                                     className="text-slate-400 hover:text-amber-500 hover:scale-110 active:scale-95 transition-all focus:outline-none"
//                                                 >
//                                                     {file.is_bookmarked ? (
//                                                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2">
//                                                             <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
//                                                         </svg>
//                                                     ) : (
//                                                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 hover:opacity-100 transition-opacity">
//                                                             <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
//                                                         </svg>
//                                                     )}
//                                                 </button>
//                                             </td>
//                                             <td className="py-3.5 px-3 text-center">
//                                                 <button
//                                                     onClick={() => handleDownload(file)}
//                                                     disabled={isDownloading}
//                                                     className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-700 text-white text-[11.5px] font-bold rounded-xl transition-all disabled:opacity-50"
//                                                 >
//                                                     {isDownloading
//                                                         ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
//                                                         : <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
//                                                     }
//                                                     {isDownloading ? 'Saving...' : 'Download'}
//                                                 </button>
//                                             </td>
//                                         </tr>
//                                     );
//                                 })}
//                             </tbody>
//                         </table>
//                     </div>
//                 )}
//                 <div className="mt-3 px-1">
//                     <p className="text-[11.5px] text-slate-400 font-semibold">
//                         {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
//                         {searchQuery && ` matching "${searchQuery}"`}
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// }

// // ─── SHARED: FILE ICON ────────────────────────────────────────────────────────
// function renderFileIcon(type) {
//     const base = 'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-black border';
//     const map = {
//         folder: <div className={`${base} bg-amber-50 border-amber-100 text-amber-600`}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg></div>,
//         pdf: <div className={`${base} bg-rose-50 border-rose-100 text-rose-600`}>PDF</div>,
//         xlsx: <div className={`${base} bg-emerald-50 border-emerald-100 text-emerald-600`}>XLS</div>,
//         xls: <div className={`${base} bg-emerald-50 border-emerald-100 text-emerald-600`}>XLS</div>,
//         docx: <div className={`${base} bg-indigo-50 border-indigo-100 text-indigo-600`}>DOC</div>,
//         doc: <div className={`${base} bg-indigo-50 border-indigo-100 text-indigo-600`}>DOC</div>,
//         pptx: <div className={`${base} bg-orange-50 border-orange-100 text-orange-600`}>PPT</div>,
//         txt: <div className={`${base} bg-slate-50 border-slate-200 text-slate-500`}>TXT</div>,
//         png: <div className={`${base} bg-purple-50 border-purple-100 text-purple-600`}>IMG</div>,
//         jpg: <div className={`${base} bg-purple-50 border-purple-100 text-purple-600`}>IMG</div>,
//         jpeg: <div className={`${base} bg-purple-50 border-purple-100 text-purple-600`}>IMG</div>,
//     };
//     return map[type] || <div className={`${base} bg-slate-50 border-slate-200 text-slate-400`}>FILE</div>;
// }

// // ─── FOLDER TREE ──────────────────────────────────────────────────────────────
// function FolderTree({ folders, parentId, currentFolderId, onSelect, getChildCount, depth = 0 }) {
//     const children = folders.filter(f => f.parentId === parentId);
//     if (children.length === 0) return null;
//     return (
//         <div className={depth > 0 ? 'ml-3 pl-2 border-l border-slate-100' : ''}>
//             {children.map(folder => {
//                 const isActive = currentFolderId === folder.id;
//                 const subFolders = folders.filter(f => f.parentId === folder.id);
//                 const count = getChildCount(folder.id);
//                 return (
//                     <div key={folder.id}>
//                         <button onClick={() => onSelect(folder.id)}
//                             className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-all mb-0.5
//                                 ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
//                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={isActive ? 'white' : '#f59e0b'} className="shrink-0"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
//                             <span className="truncate flex-1">{folder.name}</span>
//                             <span className={`text-[10px] font-bold shrink-0 ${isActive ? 'text-white/60' : 'text-slate-400'}`}>{count}</span>
//                         </button>
//                         {subFolders.length > 0 && <FolderTree folders={folders} parentId={folder.id} currentFolderId={currentFolderId} onSelect={onSelect} getChildCount={getChildCount} depth={depth + 1} />}
//                     </div>
//                 );
//             })}
//         </div>
//     );
// }

// // ─── MODAL ────────────────────────────────────────────────────────────────────
// function Modal({ children, onClose, maxWidth = 'max-w-lg' }) {
//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//             <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 -[3px]" />
//             <div className={`relative bg-white rounded-lg border border-slate-200 shadow-md w-full ${maxWidth} p-6 z-10`}>
//                 {children}
//             </div>
//         </div>
//     );
// }







// // "use client";

// // import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
// // import { useSearchParams, useRouter } from 'next/navigation';
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };
// // import fernet from 'fernet';

// // export default function DocumentsPage() {
// //     return (
// //         <Suspense fallback={<div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]"><div className="w-8 h-8 border-4 border-slate-200 border-t-brand rounded-full animate-spin" /></div>}>
// //             <UnifiedWorkspace />
// //         </Suspense>
// //     );
// // }

// // function UnifiedWorkspace() {
// //     const router = useRouter();
// //     const searchParams = useSearchParams();
// //     const currentView = searchParams.get('view') || 'files';
// //     const [session, setSession] = useState(null);

// //     // Core Data
// //     const [files, setFiles] = useState([]);
// //     const [mergedPerms, setMergedPerms] = useState({}); // Stores merged ABAC rules

// //     // UI State
// //     const [loading, setLoading] = useState(true);
// //     const [currentFolderId, setCurrentFolderId] = useState(null);
// //     const [searchQuery, setSearchQuery] = useState('');
// //     const [selectedIds, setSelectedIds] = useState(new Set());
// //     const [deletedIds, setDeletedIds] = useState(new Set());
// //     const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
// //     const [downloadedIds, setDownloadedIds] = useState(new Set());
// //     const [downloading, setDownloading] = useState({});

// //     // Modals
// //     const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
// //     const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
// //     const [newFolderName, setNewFolderName] = useState('');
// //     const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
// //     const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
// //     const [movingToFolderId, setMovingToFolderId] = useState(null);
// //     const [uploadQueue, setUploadQueue] = useState([]);

// //     const fileInputRef = useRef(null);
// //     const folderInputRef = useRef(null);

// //     // ── SESSION ──────────────────────────────────────────────────────────────
// //     useEffect(() => {
// //         const raw = localStorage.getItem('vdr_session');
// //         if (!raw) { router.push('/login'); return; }
// //         setSession(JSON.parse(raw));
// //     }, [router]);

// //     // ── SMART FETCH (ABAC ENGINE) ────────────────────────────────────────────
// //     useEffect(() => {
// //         if (!session) return;
// //         (async () => {
// //             setLoading(true);
// //             try {
// //                 const isGodMode = session.role === 'super_admin';
// //                 let myPerms = {};

// //                 // If mortal, build the Merged Permission Object via User Groups
// //                 if (!isGodMode) {
// //                     const { data: myGroups } = await supabase.from('user_groups').select('group_id').eq('user_id', session.id);
// //                     const groupIds = (myGroups || []).map(g => g.group_id);

// //                     if (groupIds.length > 0) {
// //                         const { data: perms } = await supabase.from('permissions').select('*').in('group_id', groupIds);
// //                         (perms || []).forEach(p => {
// //                             const key = p.scope === 'folder' ? `fol_${p.folder_id}` : `doc_${p.document_id}`;
// //                             if (!myPerms[key]) {
// //                                 myPerms[key] = { ...p };
// //                             } else {
// //                                 // Merge overlapping rules (Logical OR takes highest privilege)
// //                                 myPerms[key].can_view = myPerms[key].can_view || p.can_view;
// //                                 myPerms[key].can_edit = myPerms[key].can_edit || p.can_edit;
// //                                 myPerms[key].can_upload = myPerms[key].can_upload || p.can_upload;
// //                                 myPerms[key].can_download_secure = myPerms[key].can_download_secure || p.can_download_secure;
// //                                 myPerms[key].can_download_original = myPerms[key].can_download_original || p.can_download_original;
// //                             }
// //                         });
// //                     }
// //                 }

// //                 const [{ data: foldersData }, { data: docsData }, { data: usersData }] = await Promise.all([
// //                     supabase.from('folders').select('*').eq('company_id', session.company_id),
// //                     supabase.from('documents').select('*').eq('company_id', session.company_id),
// //                     supabase.from('users').select('id, name').eq('company_id', session.company_id),
// //                 ]);

// //                 const userMap = {};
// //                 (usersData || []).forEach(u => userMap[u.id] = u.name);

// //                 // Map Folders (Always visible so users can navigate the structure)
// //                 const mappedFolders = (foldersData || []).map(f => ({
// //                     id: f.id, parentId: f.parent_folder_id || null, index: f.index_number ? f.index_number.toString() : '1',
// //                     name: f.name, type: 'folder', size: '--', uploadedBy: userMap[f.created_by] || 'System',
// //                     dateCreated: new Date(f.created_at).toLocaleDateString()
// //                 }));

// //                 // Map Docs (ABAC Filter: Mortals ONLY see docs they have can_view rights to)
// //                 const mappedDocs = (docsData || [])
// //                     .filter(doc => isGodMode || myPerms[`doc_${doc.id}`]?.can_view)
// //                     .map(doc => ({
// //                         id: doc.id, parentId: doc.folder_id || null, index: doc.index ? doc.index.toString().replace('.0', '') : '99',
// //                         name: doc.name, type: doc.name.split('.').pop().toLowerCase() || 'file',
// //                         rawSize: doc.file_size_bytes || 0,
// //                         size: doc.file_size_bytes > 1024 * 1024 ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : `${(doc.file_size_bytes / 1024).toFixed(0)} KB`,
// //                         uploadedBy: userMap[doc.uploaded_by] || 'System',
// //                         dateCreated: new Date(doc.created_at).toLocaleDateString(),
// //                         is_bookmarked: doc.is_bookmarked, is_downloaded: doc.is_downloaded, is_deleted: doc.is_deleted,
// //                         file_path: doc.file_path, dek_ref: doc.dek_ref, mime_type: doc.mime_type
// //                     }));

// //                 setMergedPerms(myPerms);
// //                 setFiles([...mappedFolders, ...mappedDocs]);
// //                 setBookmarkedIds(new Set((docsData || []).filter(d => d.is_bookmarked).map(d => d.id)));
// //                 setDownloadedIds(new Set((docsData || []).filter(d => d.is_downloaded).map(d => d.id)));
// //                 setDeletedIds(new Set((docsData || []).filter(d => d.is_deleted).map(d => d.id)));
// //             } catch (err) { console.error('Fetch error:', err); }
// //             finally { setLoading(false); }
// //         })();
// //     }, [session]);

// //     // ── PERMISSION CHECK HELPER ──────────────────────────────────────────────
// //     const canUser = (action, item = null) => {
// //         if (!session) return false;
// //         if (session.role === 'super_admin') return true; // God Mode

// //         // Global context checks
// //         if (!item) {
// //             // Can upload to Root? (Usually Admins only)
// //             if (action === 'can_upload' && currentFolderId === null) return session.role === 'admin';
// //             return false;
// //         }

// //         // Specific Item Checks
// //         const key = item.type === 'folder' ? `fol_${item.id}` : `doc_${item.id}`;
// //         return mergedPerms[key]?.[action] === true;
// //     };

// //     // ── DERIVED STATE ────────────────────────────────────────────────────────
// //     const breadcrumbPath = useMemo(() => {
// //         const path = []; let id = currentFolderId;
// //         while (id !== null) {
// //             const folder = files.find(f => f.id === id);
// //             if (folder) { path.unshift(folder); id = folder.parentId; } else break;
// //         }
// //         return path;
// //     }, [currentFolderId, files]);

// //     const currentItems = useMemo(() => {
// //         if (currentView === 'trash') return files.filter(f => deletedIds.has(f.id));
// //         if (currentView === 'bookmarks') return files.filter(f => bookmarkedIds.has(f.id) && !deletedIds.has(f.id));
// //         if (currentView === 'downloads') return files.filter(f => downloadedIds.has(f.id) && !deletedIds.has(f.id));
// //         return files.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
// //     }, [currentFolderId, files, currentView, deletedIds, bookmarkedIds, downloadedIds]);

// //     const filteredItems = currentItems.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

// //     // For Modals
// //     const selectedItemsArray = files.filter(f => selectedIds.has(f.id));
// //     const canEditAllSelected = selectedItemsArray.every(item => canUser('can_edit', item));
// //     const availableFoldersForMove = files.filter(f => f.type === 'folder' && !deletedIds.has(f.id) && !selectedIds.has(f.id));

// //     // ── HANDLERS ─────────────────────────────────────────────────────────────
// //     const handleToggleSelect = (id, e) => {
// //         e.stopPropagation();
// //         setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
// //     };

// //     const handleSelectAll = () => setSelectedIds(prev => prev.size === filteredItems.length ? new Set() : new Set(filteredItems.map(f => f.id)));

// //     const handleItemClick = (item) => {
// //         if (item.type === 'folder') {
// //             if (currentView !== 'files') router.push('/documents?view=files');
// //             setCurrentFolderId(item.id); setSelectedIds(new Set()); setSearchQuery('');
// //         } else {
// //             setSelectedIds(new Set([item.id]));
// //         }
// //     };

// //     const generateNewIndex = () => {
// //         const peers = files.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
// //         if (currentFolderId === null) return (peers.reduce((m, it) => Math.max(m, parseInt(it.index) || 0), 0) + 1).toString();

// //         const parent = files.find(f => f.id === currentFolderId);
// //         const prefix = parent?.index?.endsWith('.0') ? parent.index.slice(0, -2) : (parent?.index ?? '1');
// //         const max = peers.reduce((m, it) => Math.max(m, parseInt(it.index.split('.').pop()) || 0), 0);
// //         return `${prefix}.${max + 1}`;
// //     };

// //     const handleCreateFolder = async (e) => {
// //         e.preventDefault();
// //         if (!newFolderName.trim()) return;
// //         const newIndex = generateNewIndex();

// //         const { data: dbFolder, error } = await supabase.from('folders').insert({
// //             company_id: session.company_id, parent_folder_id: currentFolderId,
// //             name: newFolderName.trim(), index_number: parseInt(newIndex.split('.')[0]) || 1, created_by: session.id,
// //         }).select().single();

// //         if (error) { alert('Failed to create folder'); return; }

// //         setFiles(prev => [...prev, {
// //             id: dbFolder.id, parentId: dbFolder.parent_folder_id || null, index: newIndex.toString(),
// //             name: dbFolder.name, type: 'folder', size: '--', uploadedBy: session.name,
// //             dateCreated: new Date().toLocaleDateString()
// //         }]);
// //         setNewFolderName(''); setIsNewFolderOpen(false);
// //     };

// //     const handleFileChange = async (e) => {
// //         const chosenFiles = Array.from(e.target.files);
// //         if (chosenFiles.length === 0 || !session) return;

// //         setUploadQueue(chosenFiles.map((f, i) => ({
// //             id: `up-${Date.now()}-${i}`, name: f.name, progress: 0, status: 'uploading',
// //             size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`
// //         })));

// //         const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
// //             const reader = new FileReader();
// //             reader.onload = () => resolve(reader.result.split(',')[1]);
// //             reader.onerror = reject;
// //             reader.readAsDataURL(file);
// //         });

// //         for (let i = 0; i < chosenFiles.length; i++) {
// //             const file = chosenFiles[i];
// //             try {
// //                 // Fernet Encryption
// //                 const randomBytes = window.crypto.getRandomValues(new Uint8Array(32));
// //                 const fernetKey = btoa(String.fromCharCode(...randomBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
// //                 const base64Data = await readFileAsBase64(file);
// //                 const secret = new fernet.Secret(fernetKey);
// //                 const token = new fernet.Token({ secret: secret });
// //                 const encryptedString = token.encode(base64Data);

// //                 const encryptedBlob = new Blob([encryptedString], { type: 'text/plain' });
// //                 const newIndex = generateNewIndex();
// //                 const storagePath = `${session.company_id}/${Date.now()}_${file.name}`;

// //                 const { error: storageErr } = await supabase.storage.from('vault-files').upload(storagePath, encryptedBlob, { contentType: 'text/plain' });
// //                 if (storageErr) throw new Error("Bucket Upload Failed: " + storageErr.message);

// //                 const res = await fetch('/api/documents/upload', {
// //                     method: 'POST', headers: { 'Content-Type': 'application/json' },
// //                     body: JSON.stringify({
// //                         company_id: session.company_id, folder_id: currentFolderId, uploaded_by: session.id,
// //                         name: file.name, file_path: storagePath, mime_type: file.type || 'application/octet-stream',
// //                         file_size_bytes: file.size, dek_ref: fernetKey, index: newIndex, security: 'Fernet Encrypted'
// //                     })
// //                 });

// //                 if (!res.ok) throw new Error('DB Sync failed');
// //                 const { id: docId } = await res.json();

// //                 setUploadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, progress: 100, status: 'completed' } : it));
// //                 setFiles(prev => [...prev, {
// //                     id: docId, parentId: currentFolderId, index: newIndex.toString(), name: file.name,
// //                     type: file.name.split('.').pop().toLowerCase() || 'file',
// //                     size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`,
// //                     uploadedBy: session.name, dateCreated: new Date().toLocaleDateString(), file_path: storagePath, dek_ref: fernetKey, mime_type: file.type
// //                 }]);
// //             } catch (err) {
// //                 console.error('Upload failed:', err);
// //                 setUploadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error' } : it));
// //             }
// //         }
// //         setTimeout(() => { setUploadQueue([]); setIsUploadModalOpen(false); }, 1500);
// //     };

// //     const handleDownload = async (file, type) => {
// //         setDownloading(prev => ({ ...prev, [file.id]: true }));
// //         try {
// //             if (type === 'secure') {
// //                 const blob = new Blob([file.id], { type: 'text/plain' });
// //                 const url = URL.createObjectURL(blob);
// //                 const a = document.createElement('a'); a.href = url; a.download = `${file.name}.vdr`;
// //                 document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
// //                 await supabase.from('documents').update({ is_downloaded: true }).eq('id', file.id);
// //             } else if (type === 'original') {
// //                 const { data, error } = await supabase.storage.from('vault-files').download(file.file_path);
// //                 if (error) throw error;
// //                 const text = await data.text();
// //                 const secret = new fernet.Secret(file.dek_ref);
// //                 const token = new fernet.Token({ secret: secret, token: text, ttl: 0 });
// //                 const decryptedBase64 = token.decode();
// //                 const byteCharacters = atob(decryptedBase64);
// //                 const byteNumbers = new Array(byteCharacters.length);
// //                 for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
// //                 const blob = new Blob([new Uint8Array(byteNumbers)], { type: file.mime_type || 'application/octet-stream' });
// //                 const url = URL.createObjectURL(blob);
// //                 const a = document.createElement('a'); a.href = url; a.download = file.name;
// //                 document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
// //             }
// //         } catch (err) { alert('Download failed. ' + err.message); }
// //         finally { setDownloading(prev => { const n = { ...prev }; delete n[file.id]; return n; }); }
// //     };

// //     const handleExport = () => {
// //         const exportFiles = selectedIds.size > 0 ? files.filter(f => selectedIds.has(f.id)) : filteredItems;
// //         if (exportFiles.length === 0) return alert('No files to export.');
// //         let csv = 'Name,Type,Size,Uploaded By,Date Created,Status\n';
// //         exportFiles.forEach(f => { csv += `"${f.name}","${f.type}","${f.size}","${f.uploadedBy}","${f.dateCreated}","${deletedIds.has(f.id) ? 'Trash' : 'Active'}"\n`; });
// //         const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
// //         const url = URL.createObjectURL(blob);
// //         const a = document.createElement('a'); a.href = url; a.download = `vdr_export_${Date.now()}.csv`;
// //         a.click(); URL.revokeObjectURL(url);
// //     };

// //     const executeMoveToFolder = async () => {
// //         try {
// //             const docIds = [...selectedIds].filter(id => files.find(f => f.id === id)?.type !== 'folder');
// //             if (docIds.length > 0) await supabase.from('documents').update({ folder_id: movingToFolderId }).in('id', docIds);
// //             setFiles(prev => prev.map(f => selectedIds.has(f.id) && f.type !== 'folder' ? { ...f, parentId: movingToFolderId } : f));
// //             setSelectedIds(new Set());
// //         } catch (err) { console.error('Move failed:', err); } finally { setIsMoveModalOpen(false); }
// //     };

// //     const executeSoftDelete = async () => {
// //         try {
// //             const docIds = [...selectedIds].filter(id => files.find(f => f.id === id)?.type !== 'folder');
// //             if (docIds.length > 0) await supabase.from('documents').update({ is_deleted: true, deleted_at: new Date().toISOString() }).in('id', docIds);
// //             setDeletedIds(prev => { const n = new Set(prev); selectedIds.forEach(id => n.add(id)); return n; });
// //             setSelectedIds(new Set());
// //             setIsDeleteModalOpen(false);
// //         } catch (err) { console.error('Trash failed', err); }
// //     };

// //     // ── RENDER ───────────────────────────────────────────────────────────────
// //     if (loading) return <div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]"><div className="w-8 h-8 border-4 border-slate-200 border-t-brand rounded-full animate-spin" /></div>;

// //     // Check Contextual Nav Rights
// //     const canUploadHere = currentFolderId === null ? (session.role === 'super_admin' || session.role === 'admin') : canUser('can_upload', { type: 'folder', id: currentFolderId });

// //     return (
// //         <div className="flex flex-col h-full w-full bg-[#F8F9FB] overflow-hidden">
// //             <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

// //             {/* Top Bar */}
// //             <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200 shadow-sm z-10">
// //                 <div className="flex items-center gap-3">
// //                     <span className="text-[14px] font-black text-slate-800 tracking-tight">
// //                         {currentView === 'trash' ? 'Trash Bin' : currentView === 'bookmarks' ? 'My Bookmarks' : currentView === 'downloads' ? 'Recent Downloads' : 'Workspace'}
// //                     </span>
// //                     {currentView === 'files' && breadcrumbPath.map((item, idx) => (
// //                         <React.Fragment key={item.id}>
// //                             <span className="text-slate-300">/</span>
// //                             <button onClick={() => setCurrentFolderId(item.id)} className="text-[13px] font-bold text-slate-500 hover:text-slate-800 transition-colors">{item.name}</button>
// //                         </React.Fragment>
// //                     ))}
// //                     {currentFolderId !== null && (
// //                         <button onClick={() => setCurrentFolderId(files.find(f => f.id === currentFolderId)?.parentId ?? null)} className="ml-2 px-2 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-md hover:bg-slate-200">Back</button>
// //                     )}
// //                 </div>
// //                 <div className="relative w-64">
// //                     <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-4 pr-3 py-2 bg-brand-soft border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
// //                 </div>
// //             </div>

// //             {/* Contextual Nav Bar */}
// //             <div className="flex items-center px-8 py-3 bg-white border-b border-slate-100">
// //                 <div className="flex gap-2">
// //                     {canUploadHere && (
// //                         <>
// //                             <button onClick={() => setIsUploadModalOpen(true)} className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl hover:bg-brand-dark transition-colors">Upload Files</button>
// //                             <button onClick={() => setIsNewFolderOpen(true)} className="px-4 py-2 bg-brand-soft text-slate-700 border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors">New Folder</button>
// //                         </>
// //                     )}
// //                     {(session.role === 'super_admin' || session.role === 'admin' || session.role === 'subadmin') && (
// //                         <button onClick={handleExport} className="ml-2 px-4 py-2 text-brand-dark bg-brand-soft border border-brand-100 text-xs font-bold rounded-xl hover:bg-brand-100 transition-colors">Export Index (CSV)</button>
// //                     )}
// //                 </div>
// //             </div>

// //             {/* Selection Action Bar */}
// //             {selectedIds.size > 0 && (
// //                 <div className="bg-amber-50/80 border-b border-amber-100 px-8 py-2.5 flex items-center gap-4">
// //                     <span className="text-[12px] font-black text-amber-800">{selectedIds.size} items selected</span>
// //                     {canEditAllSelected && currentView !== 'trash' && (
// //                         <>
// //                             <button onClick={() => setIsMoveModalOpen(true)} className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg shadow-sm">Move</button>
// //                             <button onClick={() => setIsDeleteModalOpen(true)} className="px-4 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg">Trash</button>
// //                         </>
// //                     )}
// //                     <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-[11px] font-bold text-amber-700 hover:underline">Clear Selection</button>
// //                 </div>
// //             )}

// //             {/* Unified Table */}
// //             <div className="flex-1 overflow-auto p-8">
// //                 {filteredItems.length === 0 ? (
// //                     <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
// //                         <p className="text-[14px] font-bold text-slate-500">This directory is empty</p>
// //                     </div>
// //                 ) : (
// //                     <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden pb-10">
// //                         <table className="w-full text-left border-collapse">
// //                             <thead className="bg-brand-soft border-b border-slate-100">
// //                                 <tr>
// //                                     <th className="p-4 w-12"><input type="checkbox" checked={selectedIds.size === filteredItems.length && filteredItems.length > 0} onChange={handleSelectAll} className="w-4 h-4 rounded border-slate-300 accent-slate-900" /></th>
// //                                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Index</th>
// //                                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
// //                                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Size</th>
// //                                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
// //                                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
// //                                 </tr>
// //                             </thead>
// //                             <tbody className="divide-y divide-slate-50">
// //                                 {filteredItems.map(item => {
// //                                     const isChecked = selectedIds.has(item.id);
// //                                     const isFolder = item.type === 'folder';
// //                                     const iconMap = { pdf: 'bg-rose-50 text-rose-600', xlsx: 'bg-emerald-50 text-emerald-600', docx: 'bg-brand-soft text-brand' };
// //                                     const iconClass = isFolder ? 'bg-amber-50 text-amber-500 border-amber-100' : (iconMap[item.type] || 'bg-brand-soft text-slate-400 border-slate-200');

// //                                     return (
// //                                         <tr key={item.id} onClick={() => handleItemClick(item)} className={`group cursor-pointer transition-colors ${isChecked ? 'bg-brand-soft' : 'hover:bg-brand-soft/60'}`}>
// //                                             <td className="p-4" onClick={e => e.stopPropagation()}><input type="checkbox" checked={isChecked} onChange={e => handleToggleSelect(item.id, e)} className="w-4 h-4 rounded accent-slate-900" /></td>
// //                                             <td className="p-4 text-[12px] font-mono font-semibold text-slate-400">{item.index}</td>
// //                                             <td className="p-4">
// //                                                 <div className="flex items-center gap-3">
// //                                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-[9px] font-black ${iconClass}`}>
// //                                                         {isFolder ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg> : item.type.toUpperCase().slice(0, 3)}
// //                                                     </div>
// //                                                     <p className="text-[13px] font-bold text-slate-700 truncate max-w-[280px]">{item.name}</p>
// //                                                 </div>
// //                                             </td>
// //                                             <td className="p-4 text-[12px] font-medium text-slate-500 text-center">{item.size}</td>
// //                                             <td className="p-4 text-[12px] font-semibold text-slate-500">{item.dateCreated}</td>

// //                                             <td className="p-4" onClick={e => e.stopPropagation()}>
// //                                                 <div className="flex items-center justify-center gap-2">
// //                                                     {!isFolder && canUser('can_download_secure', item) && (
// //                                                         <button onClick={() => handleDownload(item, 'secure')} disabled={downloading[item.id]} className="px-3 py-1.5 bg-brand text-white text-[10px] font-bold rounded-lg shadow-sm hover:bg-slate-700 disabled:opacity-50">
// //                                                             Secure (.vdr)
// //                                                         </button>
// //                                                     )}
// //                                                     {!isFolder && canUser('can_download_original', item) && (
// //                                                         <button onClick={() => handleDownload(item, 'original')} disabled={downloading[item.id]} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg hover:bg-emerald-100 disabled:opacity-50">
// //                                                             Original
// //                                                         </button>
// //                                                     )}
// //                                                     {isFolder && (
// //                                                         <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Folder</span>
// //                                                     )}
// //                                                 </div>
// //                                             </td>
// //                                         </tr>
// //                                     );
// //                                 })}
// //                             </tbody>
// //                         </table>
// //                     </div>
// //                 )}
// //             </div>

// //             {/* Modals (New Folder, Upload, Delete, Move) */}
// //             {isNewFolderOpen && (
// //                 <Modal onClose={() => setIsNewFolderOpen(false)}>
// //                     <h3 className="text-[16px] font-black mb-4">Create New Folder</h3>
// //                     <input type="text" placeholder="Folder name..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:border-slate-400 focus:outline-none" />
// //                     <button onClick={handleCreateFolder} className="w-full py-3 bg-brand text-white font-bold rounded-xl">Create</button>
// //                 </Modal>
// //             )}

// //             {isDeleteModalOpen && (
// //                 <Modal onClose={() => setIsDeleteModalOpen(false)}>
// //                     <h3 className="text-[16px] font-black text-rose-600 mb-2">Send to Trash?</h3>
// //                     <p className="text-[13px] text-slate-500 mb-6">These files will be moved to the Trash bin.</p>
// //                     <div className="flex gap-2">
// //                         <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancel</button>
// //                         <button onClick={executeSoftDelete} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl">Send to Trash</button>
// //                     </div>
// //                 </Modal>
// //             )}

// //             {isUploadModalOpen && (
// //                 <Modal onClose={() => setIsUploadModalOpen(false)}>
// //                     <h3 className="text-[16px] font-black text-slate-800 mb-5">Secure Upload</h3>
// //                     <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-3 p-10 border-2 border-dashed border-slate-200 bg-brand-soft rounded-lg cursor-pointer hover:bg-slate-100">
// //                         <span className="text-[13px] font-bold text-slate-700">Click to Browse Files</span>
// //                         <span className="text-[11px] text-slate-400">Files are AES-256 Encrypted on upload</span>
// //                     </div>
// //                     {uploadQueue.length > 0 && (
// //                         <div className="mt-4 space-y-2 max-h-48 overflow-auto">
// //                             {uploadQueue.map(item => (
// //                                 <div key={item.id} className="flex items-center gap-3 p-3 bg-brand-soft rounded-xl border border-slate-100">
// //                                     <div className="flex-1 min-w-0">
// //                                         <p className="text-[12px] font-semibold text-slate-700 truncate">{item.name}</p>
// //                                     </div>
// //                                     {item.status === 'completed' ? <span className="text-emerald-500 text-xs font-bold">Done</span> : <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />}
// //                                 </div>
// //                             ))}
// //                         </div>
// //                     )}
// //                 </Modal>
// //             )}

// //             {isMoveModalOpen && (
// //                 <Modal onClose={() => setIsMoveModalOpen(false)}>
// //                     <h3 className="text-[15px] font-black mb-4">Move {selectedIds.size} items to...</h3>
// //                     <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
// //                         <button onClick={() => setMovingToFolderId(null)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[12.5px] font-semibold ${movingToFolderId === null ? 'bg-brand text-white' : 'hover:bg-brand-soft text-slate-700'}`}>
// //                             Root Directory
// //                         </button>
// //                         {availableFoldersForMove.map(folder => (
// //                             <button key={folder.id} onClick={() => setMovingToFolderId(folder.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[12.5px] font-semibold ${movingToFolderId === folder.id ? 'bg-brand text-white' : 'hover:bg-brand-soft text-slate-700'}`}>
// //                                 <span className="truncate">{folder.name}</span>
// //                             </button>
// //                         ))}
// //                     </div>
// //                     <div className="flex gap-2">
// //                         <button onClick={() => setIsMoveModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 font-bold rounded-xl">Cancel</button>
// //                         <button onClick={executeMoveToFolder} className="flex-1 py-2.5 bg-brand text-white font-bold rounded-xl">Move Here</button>
// //                     </div>
// //                 </Modal>
// //             )}

// //         </div>
// //     );
// // }

// // function Modal({ children, onClose, maxWidth = 'max-w-lg' }) {
// //     return (
// //         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
// //             <div onClick={onClose} className="absolute inset-0 bg-brand/40 -[3px]" />
// //             <div className={`relative bg-white rounded-lg shadow-md w-full ${maxWidth} p-6 z-10`}>
// //                 {children}
// //             </div>
// //         </div>
// //     );
// // }










// // "use client";

// // import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
// // import { useSearchParams, useRouter } from 'next/navigation';
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };

// // export default function DocumentsPage() {
// //     return (
// //         <Suspense fallback={
// //             <div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]">
// //                 <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
// //             </div>
// //         }>
// //             <DocumentsPageContent />
// //         </Suspense>
// //     );
// // }

// // function DocumentsPageContent() {
// //     const router = useRouter();
// //     const searchParams = useSearchParams();
// //     const currentView = searchParams.get('view') || 'files';

// //     // Core state
// //     const [files, setFiles] = useState([]);
// //     const [session, setSession] = useState(null);
// //     const [currentFolderId, setCurrentFolderId] = useState(null);
// //     const [searchQuery, setSearchQuery] = useState('');
// //     const [selectedIds, setSelectedIds] = useState(new Set());
// //     const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'folder' | 'file'

// //     // Collections
// //     const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
// //     const [downloadedIds, setDownloadedIds] = useState(new Set());
// //     const [deletedIds, setDeletedIds] = useState(new Set());

// //     // UI state
// //     const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
// //     const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
// //     const [newFolderName, setNewFolderName] = useState('');
// //     const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
// //     const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
// //     const [movingToFolderId, setMovingToFolderId] = useState(null);
// //     const [uploadQueue, setUploadQueue] = useState([]);
// //     const [isDeleting, setIsDeleting] = useState(false);

// //     const fileInputRef = useRef(null);

// //     // ─── 1. SESSION ────────────────────────────────────────────────────────────
// //     useEffect(() => {
// //         const raw = localStorage.getItem('vdr_session');
// //         if (!raw) { router.push('/login'); return; }
// //         setSession(JSON.parse(raw));
// //     }, [router]);

// //     // ─── 2. FETCH DATA ─────────────────────────────────────────────────────────
// //     useEffect(() => {
// //         if (!session) return;
// //         (async () => {
// //             try {
// //                 const [{ data: foldersData }, { data: docsData }] = await Promise.all([
// //                     supabase.from('folders').select('*').eq('company_id', session.company_id),
// //                     supabase.from('documents').select('*').eq('company_id', session.company_id).eq('is_deleted', false),
// //                 ]);

// //                 const mappedFolders = (foldersData || []).map(f => ({
// //                     id: f.id,
// //                     parentId: f.parent_folder_id || null,
// //                     index: f.index_number ? `${f.index_number}.0` : '1.0',
// //                     name: f.name,
// //                     type: 'folder',
// //                     size: '--',
// //                     uploadedBy: 'System',
// //                     dateCreated: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //                     security: 'Encrypted',
// //                 }));

// //                 const mappedDocs = (docsData || []).map(doc => ({
// //                     id: doc.id,
// //                     parentId: doc.folder_id || null,
// //                     index: doc.index || '99.0',
// //                     name: doc.name,
// //                     type: doc.name.split('.').pop().toLowerCase() || 'file',
// //                     size: doc.file_size_bytes > 1024 * 1024
// //                         ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
// //                         : `${(doc.file_size_bytes / 1024).toFixed(0)} KB`,
// //                     uploadedBy: 'Admin',
// //                     dateCreated: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //                     security: doc.security || 'Encrypted',
// //                     is_bookmarked: doc.is_bookmarked,
// //                     is_downloaded: doc.is_downloaded,
// //                 }));

// //                 setFiles([...mappedFolders, ...mappedDocs]);

// //                 const bookmarked = new Set((docsData || []).filter(d => d.is_bookmarked).map(d => d.id));
// //                 const downloaded = new Set((docsData || []).filter(d => d.is_downloaded).map(d => d.id));
// //                 setBookmarkedIds(bookmarked);
// //                 setDownloadedIds(downloaded);
// //             } catch (err) {
// //                 console.error('Failed to fetch:', err);
// //             }
// //         })();
// //     }, [session]);

// //     // ─── BREADCRUMB ────────────────────────────────────────────────────────────
// //     const breadcrumbPath = useMemo(() => {
// //         const path = [];
// //         let id = currentFolderId;
// //         while (id !== null) {
// //             const folder = files.find(f => f.id === id);
// //             if (folder) { path.unshift(folder); id = folder.parentId; }
// //             else break;
// //         }
// //         return path;
// //     }, [currentFolderId, files]);

// //     // ─── CURRENT ITEMS ─────────────────────────────────────────────────────────
// //     const currentItems = useMemo(() => {
// //         if (currentView === 'trash') return files.filter(f => deletedIds.has(f.id));
// //         if (currentView === 'bookmarks') return files.filter(f => bookmarkedIds.has(f.id) && !deletedIds.has(f.id));
// //         if (currentView === 'downloads') return files.filter(f => downloadedIds.has(f.id) && !deletedIds.has(f.id));
// //         return files.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
// //     }, [currentFolderId, files, currentView, deletedIds, bookmarkedIds, downloadedIds]);

// //     // ─── FILTER + SORT ─────────────────────────────────────────────────────────
// //     const filteredItems = useMemo(() => {
// //         let items = currentItems;
// //         if (searchQuery.trim()) {
// //             const q = searchQuery.toLowerCase();
// //             items = items.filter(f => f.name.toLowerCase().includes(q) || f.index.includes(q));
// //         }
// //         if (typeFilter === 'folder') items = items.filter(f => f.type === 'folder');
// //         else if (typeFilter === 'file') items = items.filter(f => f.type !== 'folder');

// //         return [...items].sort((a, b) => {
// //             const pa = a.index.split('.').map(Number);
// //             const pb = b.index.split('.').map(Number);
// //             for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
// //                 const d = (pa[i] || 0) - (pb[i] || 0);
// //                 if (d !== 0) return d;
// //             }
// //             return 0;
// //         });
// //     }, [currentItems, searchQuery, typeFilter]);

// //     // All non-deleted folders (for move modal & left panel)
// //     const allFolders = useMemo(() =>
// //         files.filter(f => f.type === 'folder' && !deletedIds.has(f.id)),
// //         [files, deletedIds]
// //     );

// //     // Top-level folders for the left panel
// //     const rootFolders = useMemo(() =>
// //         allFolders.filter(f => f.parentId === null),
// //         [allFolders]
// //     );

// //     // ─── INDEX GENERATOR ───────────────────────────────────────────────────────
// //     const generateNewIndex = () => {
// //         const peers = files.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
// //         if (currentFolderId === null) {
// //             const max = peers.reduce((m, it) => Math.max(m, parseInt(it.index.split('.')[0]) || 0), 0);
// //             return `${max + 1}.0`;
// //         }
// //         const parent = files.find(f => f.id === currentFolderId);
// //         const prefix = parent?.index?.endsWith('.0') ? parent.index.slice(0, -2) : (parent?.index ?? '1');
// //         const max = peers.reduce((m, it) => {
// //             const parts = it.index.split('.');
// //             return Math.max(m, parseInt(parts[parts.length - 1]) || 0);
// //         }, 0);
// //         return `${prefix}.${max + 1}`;
// //     };

// //     // ─── HANDLERS ─────────────────────────────────────────────────────────────
// //     const handleToggleSelect = (id, e) => {
// //         e.stopPropagation();
// //         setSelectedIds(prev => {
// //             const next = new Set(prev);
// //             next.has(id) ? next.delete(id) : next.add(id);
// //             return next;
// //         });
// //     };

// //     const handleSelectAll = () => {
// //         setSelectedIds(prev =>
// //             prev.size === filteredItems.length
// //                 ? new Set()
// //                 : new Set(filteredItems.map(f => f.id))
// //         );
// //     };

// //     const handleItemClick = (item) => {
// //         if (item.type === 'folder') {
// //             if (currentView !== 'files') router.push('/documents?view=files');
// //             setCurrentFolderId(item.id);
// //             setSelectedIds(new Set());
// //             setSearchQuery('');
// //             setTypeFilter('all');
// //         } else {
// //             setSelectedIds(new Set([item.id]));
// //         }
// //     };

// //     // ─── CREATE FOLDER ─────────────────────────────────────────────────────────
// //     const handleCreateFolder = async (e) => {
// //         e.preventDefault();
// //         if (!newFolderName.trim() || !session) return;
// //         const newIndex = generateNewIndex();
// //         const { data: dbFolder, error } = await supabase.from('folders').insert({
// //             company_id: session.company_id,
// //             parent_folder_id: currentFolderId,
// //             name: newFolderName.trim(),
// //             index_number: parseInt(newIndex.split('.')[0]) || 1,
// //             created_by: session.id,
// //         }).select().single();

// //         if (error) { alert('Failed to create folder'); console.error(error); return; }

// //         setFiles(prev => [...prev, {
// //             id: dbFolder.id,
// //             parentId: dbFolder.parent_folder_id || null,
// //             index: newIndex,
// //             name: dbFolder.name,
// //             type: 'folder',
// //             size: '--',
// //             uploadedBy: session.name,
// //             dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //             security: 'Encrypted',
// //         }]);
// //         setNewFolderName('');
// //         setIsNewFolderOpen(false);
// //     };

// //     // ─── DELETE ────────────────────────────────────────────────────────────────
// //     const handleDeleteSelected = () => {
// //         if (selectedIds.size === 0) return;
// //         setIsDeleteModalOpen(true);
// //     };

// //     const executeDelete = async () => {
// //         setIsDeleting(true);
// //         try {
// //             // Soft-delete documents in Supabase
// //             const docIds = [...selectedIds].filter(id => {
// //                 const item = files.find(f => f.id === id);
// //                 return item && item.type !== 'folder';
// //             });
// //             const folderIds = [...selectedIds].filter(id => {
// //                 const item = files.find(f => f.id === id);
// //                 return item && item.type === 'folder';
// //             });

// //             if (docIds.length > 0) {
// //                 await supabase.from('documents').update({ is_deleted: true }).in('id', docIds);
// //             }
// //             if (folderIds.length > 0) {
// //                 await supabase.from('folders').delete().in('id', folderIds);
// //             }

// //             setDeletedIds(prev => {
// //                 const next = new Set(prev);
// //                 selectedIds.forEach(id => next.add(id));
// //                 return next;
// //             });
// //             setSelectedIds(new Set());
// //         } catch (err) {
// //             console.error('Delete failed:', err);
// //         } finally {
// //             setIsDeleting(false);
// //             setIsDeleteModalOpen(false);
// //         }
// //     };

// //     // ─── MOVE FILES ────────────────────────────────────────────────────────────
// //     const handleMoveSelected = () => {
// //         if (selectedIds.size === 0) return;
// //         setMovingToFolderId(null);
// //         setIsMoveModalOpen(true);
// //     };

// //     const executeMoveToFolder = async () => {
// //         if (!isMoveModalOpen) return;
// //         try {
// //             const docIds = [...selectedIds].filter(id => {
// //                 const item = files.find(f => f.id === id);
// //                 return item && item.type !== 'folder';
// //             });

// //             if (docIds.length > 0) {
// //                 await supabase
// //                     .from('documents')
// //                     .update({ folder_id: movingToFolderId })
// //                     .in('id', docIds);
// //             }

// //             setFiles(prev => prev.map(f =>
// //                 selectedIds.has(f.id) && f.type !== 'folder'
// //                     ? { ...f, parentId: movingToFolderId }
// //                     : f
// //             ));
// //             setSelectedIds(new Set());
// //         } catch (err) {
// //             console.error('Move failed:', err);
// //         } finally {
// //             setIsMoveModalOpen(false);
// //         }
// //     };

// //     // ─── UPLOAD ────────────────────────────────────────────────────────────────
// //     const handleFileChange = async (e) => {
// //         const chosenFiles = Array.from(e.target.files);
// //         if (chosenFiles.length === 0 || !session) return;

// //         const queue = chosenFiles.map((file, idx) => ({
// //             id: `up-${Date.now()}-${idx}`,
// //             name: file.name,
// //             size: file.size > 1024 * 1024
// //                 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
// //                 : `${(file.size / 1024).toFixed(0)} KB`,
// //             progress: 0,
// //             status: 'uploading',
// //         }));
// //         setUploadQueue(queue);

// //         for (let i = 0; i < chosenFiles.length; i++) {
// //             const file = chosenFiles[i];
// //             const qi = queue[i];
// //             try {
// //                 const fileBuffer = await file.arrayBuffer();
// //                 const cryptoKey = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
// //                 const iv = window.crypto.getRandomValues(new Uint8Array(12));
// //                 const encryptedBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, fileBuffer);
// //                 const rawKey = await window.crypto.subtle.exportKey('raw', cryptoKey);
// //                 const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
// //                 const ivBase64 = btoa(String.fromCharCode(...iv));
// //                 const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
// //                 const newIndex = generateNewIndex();

// //                 const res = await fetch('/api/documents/upload', {
// //                     method: 'POST',
// //                     headers: { 'Content-Type': 'application/json' },
// //                     body: JSON.stringify({
// //                         company_id: session.company_id,
// //                         folder_id: currentFolderId,
// //                         uploaded_by: session.id,
// //                         name: file.name,
// //                         file_data: encryptedBase64,
// //                         mime_type: file.type || 'application/octet-stream',
// //                         file_size_bytes: file.size,
// //                         dek_ref: `${ivBase64}:${keyBase64}`,
// //                         index: newIndex,
// //                         security: 'Encrypted',
// //                     }),
// //                 });
// //                 if (!res.ok) throw new Error('Upload failed');
// //                 const { id: docId } = await res.json();

// //                 setUploadQueue(prev => prev.map(it => it.id === qi.id ? { ...it, progress: 100, status: 'completed' } : it));
// //                 setFiles(prev => [...prev, {
// //                     id: docId,
// //                     parentId: currentFolderId,
// //                     index: newIndex,
// //                     name: file.name,
// //                     type: file.name.split('.').pop().toLowerCase() || 'file',
// //                     size: qi.size,
// //                     uploadedBy: session.name,
// //                     dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //                     security: 'Encrypted',
// //                 }]);
// //             } catch (err) {
// //                 console.error('Upload failed:', err);
// //                 setUploadQueue(prev => prev.map(it => it.id === qi.id ? { ...it, status: 'error' } : it));
// //             }
// //         }
// //         setTimeout(() => { setUploadQueue([]); setIsUploadModalOpen(false); }, 800);
// //         e.target.value = '';
// //     };

// //     // ─── ICONS ─────────────────────────────────────────────────────────────────
// //     const renderFileIcon = (type) => {
// //         const base = 'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-black border';
// //         const map = {
// //             folder: <div className={`${base} bg-amber-50 border-amber-100 text-amber-600`}>
// //                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
// //             </div>,
// //             pdf: <div className={`${base} bg-rose-50 border-rose-100 text-rose-600`}>PDF</div>,
// //             xlsx: <div className={`${base} bg-emerald-50 border-emerald-100 text-emerald-600`}>XLS</div>,
// //             xls: <div className={`${base} bg-emerald-50 border-emerald-100 text-emerald-600`}>XLS</div>,
// //             docx: <div className={`${base} bg-indigo-50 border-indigo-100 text-indigo-600`}>DOC</div>,
// //             doc: <div className={`${base} bg-indigo-50 border-indigo-100 text-indigo-600`}>DOC</div>,
// //             pptx: <div className={`${base} bg-orange-50 border-orange-100 text-orange-600`}>PPT</div>,
// //             txt: <div className={`${base} bg-slate-50 border-slate-200 text-slate-500`}>TXT</div>,
// //             png: <div className={`${base} bg-purple-50 border-purple-100 text-purple-600`}>IMG</div>,
// //             jpg: <div className={`${base} bg-purple-50 border-purple-100 text-purple-600`}>IMG</div>,
// //             jpeg: <div className={`${base} bg-purple-50 border-purple-100 text-purple-600`}>IMG</div>,
// //         };
// //         return map[type] || <div className={`${base} bg-slate-50 border-slate-200 text-slate-400`}>FILE</div>;
// //     };

// //     // ─── COMPUTED ──────────────────────────────────────────────────────────────
// //     const selectedItems = [...selectedIds].map(id => files.find(f => f.id === id)).filter(Boolean);
// //     const selectedHasFiles = selectedItems.some(f => f.type !== 'folder');
// //     const allChecked = filteredItems.length > 0 && selectedIds.size === filteredItems.length;
// //     const someChecked = selectedIds.size > 0 && selectedIds.size < filteredItems.length;

// //     // Folder child count helper
// //     const getFolderChildCount = (folderId) =>
// //         files.filter(f => f.parentId === folderId && !deletedIds.has(f.id)).length;

// //     // Folders available to move into (excluding selected folders themselves)
// //     const availableFoldersForMove = allFolders.filter(f => !selectedIds.has(f.id));

// //     return (
// //         <div className="relative flex w-full h-full bg-[#F8F9FB] overflow-hidden text-slate-800 font-sans">
// //             <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

// //             {/* ── LEFT FOLDERS PANEL ─────────────────────────────────────────── */}
// //             <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
// //                 <div className="px-4 pt-5 pb-3 border-b border-slate-100">
// //                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folders</p>
// //                 </div>

// //                 <div className="flex-1 overflow-y-auto py-2 px-2">
// //                     {/* Root level entry */}
// //                     <button
// //                         onClick={() => { setCurrentFolderId(null); setTypeFilter('all'); }}
// //                         className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-semibold transition-all mb-0.5
// //                             ${currentFolderId === null && currentView === 'files'
// //                                 ? 'bg-slate-900 text-white'
// //                                 : 'text-slate-600 hover:bg-slate-50'}`}
// //                     >
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-70"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
// //                         All Files
// //                     </button>

// //                     <div className="h-px bg-slate-100 my-2 mx-1" />

// //                     {rootFolders.length === 0 ? (
// //                         <p className="text-[11px] text-slate-400 text-center py-4 px-2">No folders yet</p>
// //                     ) : (
// //                         <FolderTree
// //                             folders={allFolders}
// //                             parentId={null}
// //                             currentFolderId={currentFolderId}
// //                             onSelect={(id) => {
// //                                 if (currentView !== 'files') router.push('/documents?view=files');
// //                                 setCurrentFolderId(id);
// //                                 setSelectedIds(new Set());
// //                                 setTypeFilter('all');
// //                             }}
// //                             getChildCount={getFolderChildCount}
// //                         />
// //                     )}
// //                 </div>

// //                 {/* New folder quick button */}
// //                 <div className="p-3 border-t border-slate-100">
// //                     <button
// //                         onClick={() => setIsNewFolderOpen(true)}
// //                         className="w-full flex items-center justify-center gap-2 py-2 text-[11.5px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all border border-dashed border-slate-200"
// //                     >
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
// //                         New Folder
// //                     </button>
// //                 </div>
// //             </aside>

// //             {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
// //             <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">

// //                 {/* Header */}
// //                 <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-200 bg-white">
// //                     <div className="flex items-center gap-2 min-w-0">
// //                         <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest shrink-0">
// //                             {currentView === 'trash' ? 'Trash' :
// //                                 currentView === 'bookmarks' ? 'Bookmarks' :
// //                                     currentView === 'downloads' ? 'Downloads' :
// //                                         'Files'}
// //                         </span>
// //                         {currentView === 'files' && breadcrumbPath.map((item, idx) => {
// //                             const isLast = idx === breadcrumbPath.length - 1;
// //                             return (
// //                                 <React.Fragment key={item.id}>
// //                                     <span className="text-slate-300 font-light">/</span>
// //                                     <button
// //                                         onClick={() => !isLast && setCurrentFolderId(item.id)}
// //                                         className={`text-[13px] font-black truncate max-w-[140px] transition-colors ${isLast ? 'text-slate-800' : 'text-slate-400 hover:text-slate-700 underline underline-offset-2'}`}
// //                                     >
// //                                         {item.name}
// //                                     </button>
// //                                 </React.Fragment>
// //                             );
// //                         })}
// //                         {currentFolderId !== null && (
// //                             <button
// //                                 onClick={() => {
// //                                     const parent = files.find(f => f.id === currentFolderId);
// //                                     setCurrentFolderId(parent?.parentId ?? null);
// //                                 }}
// //                                 className="ml-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
// //                             >
// //                                 <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
// //                                 Back
// //                             </button>
// //                         )}
// //                     </div>

// //                     {/* Search */}
// //                     <div className="relative w-56">
// //                         <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
// //                         <input
// //                             type="text"
// //                             placeholder="Search files..."
// //                             value={searchQuery}
// //                             onChange={e => setSearchQuery(e.target.value)}
// //                             className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
// //                         />
// //                     </div>
// //                 </div>

// //                 {/* Toolbar */}
// //                 <div className="flex items-center justify-between px-7 py-3 bg-white border-b border-slate-100 gap-4">

// //                     {/* Left: actions */}
// //                     <div className="flex items-center gap-2 flex-wrap">
// //                         <button
// //                             onClick={() => setIsUploadModalOpen(true)}
// //                             className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-[12px] font-bold rounded-xl transition-all"
// //                         >
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
// //                             Upload
// //                         </button>
// //                         <button
// //                             onClick={() => setIsNewFolderOpen(true)}
// //                             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-xl hover:bg-slate-50 transition-all"
// //                         >
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
// //                             Add Folder
// //                         </button>

// //                         {selectedIds.size > 0 && (
// //                             <>
// //                                 <div className="w-px h-5 bg-slate-200 mx-1" />
// //                                 <span className="text-[11.5px] font-bold text-slate-500 px-1">
// //                                     {selectedIds.size} selected
// //                                 </span>
// //                                 {selectedHasFiles && (
// //                                     <button
// //                                         onClick={handleMoveSelected}
// //                                         className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 text-[12px] font-bold rounded-xl hover:bg-blue-100 transition-all"
// //                                     >
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></svg>
// //                                         Move to Folder
// //                                     </button>
// //                                 )}
// //                                 <button
// //                                     onClick={handleDeleteSelected}
// //                                     className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-bold rounded-xl hover:bg-rose-100 transition-all"
// //                                 >
// //                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
// //                                     Delete
// //                                 </button>
// //                             </>
// //                         )}
// //                     </div>

// //                     {/* Right: type filter tabs */}
// //                     <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
// //                         {[
// //                             { key: 'all', label: 'All' },
// //                             { key: 'folder', label: 'Folders' },
// //                             { key: 'file', label: 'Files' },
// //                         ].map(tab => (
// //                             <button
// //                                 key={tab.key}
// //                                 onClick={() => setTypeFilter(tab.key)}
// //                                 className={`px-3.5 py-1.5 text-[11.5px] font-bold rounded-lg transition-all ${typeFilter === tab.key
// //                                     ? 'bg-white text-slate-800 shadow-sm'
// //                                     : 'text-slate-500 hover:text-slate-700'}`}
// //                             >
// //                                 {tab.label}
// //                             </button>
// //                         ))}
// //                     </div>
// //                 </div>

// //                 {/* New folder inline form */}
// //                 {isNewFolderOpen && (
// //                     <form onSubmit={handleCreateFolder} className="flex items-center gap-3 px-7 py-3 bg-amber-50/60 border-b border-amber-100">
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
// //                         <input
// //                             type="text"
// //                             placeholder="Folder name..."
// //                             value={newFolderName}
// //                             onChange={e => setNewFolderName(e.target.value)}
// //                             className="flex-1 max-w-xs px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
// //                             autoFocus
// //                         />
// //                         <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white text-[12px] font-bold rounded-xl">Create</button>
// //                         <button type="button" onClick={() => { setIsNewFolderOpen(false); setNewFolderName(''); }} className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-500 text-[12px] font-bold rounded-xl">Cancel</button>
// //                     </form>
// //                 )}

// //                 {/* Table */}
// //                 <div className="flex-1 overflow-auto px-7 py-5">
// //                     <div className="rounded-lg border border-slate-200 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
// //                         <table className="w-full min-w-[700px] border-collapse text-left">
// //                             <thead>
// //                                 <tr className="border-b border-slate-100 bg-slate-50/60">
// //                                     <th className="py-3.5 px-4 w-10">
// //                                         <input
// //                                             type="checkbox"
// //                                             checked={allChecked}
// //                                             ref={el => { if (el) el.indeterminate = someChecked; }}
// //                                             onChange={handleSelectAll}
// //                                             className="w-4 h-4 rounded border-slate-300 accent-slate-900"
// //                                         />
// //                                     </th>
// //                                     <th className="py-3.5 px-3 w-20 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Index</th>
// //                                     <th className="py-3.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
// //                                     <th className="py-3.5 px-3 w-24 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Size</th>
// //                                     <th className="py-3.5 px-3 w-36 text-[10px] font-black text-slate-400 uppercase tracking-widest">Uploaded By</th>
// //                                     <th className="py-3.5 px-3 w-32 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
// //                                     <th className="py-3.5 px-3 w-10"></th>
// //                                 </tr>
// //                             </thead>
// //                             <tbody className="divide-y divide-slate-50">
// //                                 {filteredItems.length === 0 ? (
// //                                     <tr>
// //                                         <td colSpan="7" className="py-24 text-center">
// //                                             <div className="flex flex-col items-center gap-3 text-slate-400">
// //                                                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
// //                                                 <span className="text-[13px] font-bold">
// //                                                     {searchQuery ? 'No results found' : 'This folder is empty'}
// //                                                 </span>
// //                                             </div>
// //                                         </td>
// //                                     </tr>
// //                                 ) : filteredItems.map(item => {
// //                                     const isChecked = selectedIds.has(item.id);
// //                                     const childCount = item.type === 'folder' ? getFolderChildCount(item.id) : null;
// //                                     return (
// //                                         <tr
// //                                             key={item.id}
// //                                             onClick={() => handleItemClick(item)}
// //                                             className={`group cursor-pointer transition-all duration-150 ${isChecked
// //                                                 ? 'bg-slate-50 border-l-[3px] border-slate-900'
// //                                                 : 'border-l-[3px] border-transparent hover:bg-slate-50/60'}`}
// //                                         >
// //                                             <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
// //                                                 <input
// //                                                     type="checkbox"
// //                                                     checked={isChecked}
// //                                                     onChange={e => handleToggleSelect(item.id, e)}
// //                                                     className="w-4 h-4 rounded border-slate-300 accent-slate-900"
// //                                                 />
// //                                             </td>
// //                                             <td className="py-3.5 px-3 text-center font-mono text-[11.5px] font-semibold text-slate-400">
// //                                                 {item.index}
// //                                             </td>
// //                                             <td className="py-3.5 px-3">
// //                                                 <div className="flex items-center gap-3">
// //                                                     {renderFileIcon(item.type)}
// //                                                     <div className="min-w-0">
// //                                                         <p className="font-semibold text-[13px] text-slate-700 truncate">{item.name}</p>
// //                                                         {item.type === 'folder' && (
// //                                                             <p className="text-[11px] text-slate-400 font-medium">{childCount} item{childCount !== 1 ? 's' : ''}</p>
// //                                                         )}
// //                                                     </div>
// //                                                 </div>
// //                                             </td>
// //                                             <td className="py-3.5 px-3 text-center text-[12.5px] font-medium text-slate-400">{item.size}</td>
// //                                             <td className="py-3.5 px-3 text-[12.5px] font-semibold text-slate-600">{item.uploadedBy}</td>
// //                                             <td className="py-3.5 px-3 text-[12px] font-bold text-slate-400">{item.dateCreated}</td>
// //                                             <td className="py-3.5 px-3">
// //                                                 {item.type === 'folder' && (
// //                                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-slate-500 transition-colors"><polyline points="9 18 15 12 9 6" /></svg>
// //                                                 )}
// //                                             </td>
// //                                         </tr>
// //                                     );
// //                                 })}
// //                             </tbody>
// //                         </table>
// //                     </div>

// //                     {/* Item count footer */}
// //                     <div className="flex items-center justify-between mt-3 px-1">
// //                         <p className="text-[11.5px] text-slate-400 font-semibold">
// //                             {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
// //                             {typeFilter !== 'all' && ` · filtered by ${typeFilter}s`}
// //                         </p>
// //                         {selectedIds.size > 0 && (
// //                             <button onClick={() => setSelectedIds(new Set())} className="text-[11.5px] text-slate-400 font-semibold hover:text-slate-700 transition-colors">
// //                                 Clear selection
// //                             </button>
// //                         )}
// //                     </div>
// //                 </div>
// //             </div>

// //             {/* ── UPLOAD MODAL ──────────────────────────────────────────────── */}
// //             {isUploadModalOpen && (
// //                 <Modal onClose={() => setIsUploadModalOpen(false)}>
// //                     <h3 className="text-[16px] font-black text-slate-800 mb-5">Secure Upload</h3>
// //                     <div
// //                         onClick={() => fileInputRef.current?.click()}
// //                         className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-slate-200 bg-slate-50 rounded-lg cursor-pointer hover:border-slate-400 hover:bg-slate-100 transition-all"
// //                     >
// //                         <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center">
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
// //                         </div>
// //                         <div className="text-center">
// //                             <p className="font-bold text-[13.5px] text-slate-800">Click to browse files</p>
// //                             <p className="text-[11.5px] text-slate-400 mt-0.5">Files are AES-256 encrypted on upload</p>
// //                         </div>
// //                     </div>

// //                     {uploadQueue.length > 0 && (
// //                         <div className="mt-4 space-y-2">
// //                             {uploadQueue.map(item => (
// //                                 <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
// //                                     <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 shrink-0">
// //                                         {item.name.split('.').pop().toUpperCase()}
// //                                     </div>
// //                                     <div className="flex-1 min-w-0">
// //                                         <p className="text-[12px] font-semibold text-slate-700 truncate">{item.name}</p>
// //                                         <p className="text-[10.5px] text-slate-400">{item.size}</p>
// //                                     </div>
// //                                     {item.status === 'completed' && (
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
// //                                     )}
// //                                     {item.status === 'error' && (
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
// //                                     )}
// //                                     {item.status === 'uploading' && (
// //                                         <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin shrink-0" />
// //                                     )}
// //                                 </div>
// //                             ))}
// //                         </div>
// //                     )}
// //                 </Modal>
// //             )}

// //             {/* ── DELETE CONFIRM MODAL ─────────────────────────────────────── */}
// //             {isDeleteModalOpen && (
// //                 <Modal onClose={() => setIsDeleteModalOpen(false)} maxWidth="max-w-sm">
// //                     <div className="flex flex-col items-center gap-4 text-center">
// //                         <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
// //                         </div>
// //                         <div>
// //                             <h3 className="text-[15px] font-black text-slate-800">Delete {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''}?</h3>
// //                             <p className="text-[12.5px] text-slate-500 mt-1">This will move them to Trash. You can restore later.</p>
// //                         </div>
// //                         <div className="flex gap-2 w-full">
// //                             <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-[12.5px] font-bold rounded-xl hover:bg-slate-200 transition-all">
// //                                 Cancel
// //                             </button>
// //                             <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-2.5 bg-rose-600 text-white text-[12.5px] font-bold rounded-xl hover:bg-rose-700 transition-all disabled:opacity-60">
// //                                 {isDeleting ? 'Deleting...' : 'Delete'}
// //                             </button>
// //                         </div>
// //                     </div>
// //                 </Modal>
// //             )}

// //             {/* ── MOVE TO FOLDER MODAL ─────────────────────────────────────── */}
// //             {isMoveModalOpen && (
// //                 <Modal onClose={() => setIsMoveModalOpen(false)} maxWidth="max-w-sm">
// //                     <h3 className="text-[15px] font-black text-slate-800 mb-4">Move {selectedIds.size} file{selectedIds.size !== 1 ? 's' : ''} to…</h3>

// //                     <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
// //                         {/* Root option */}
// //                         <button
// //                             onClick={() => setMovingToFolderId(null)}
// //                             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[12.5px] font-semibold transition-all ${movingToFolderId === null ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
// //                         >
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-60"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
// //                             Root (no folder)
// //                         </button>

// //                         {availableFoldersForMove.map(folder => (
// //                             <button
// //                                 key={folder.id}
// //                                 onClick={() => setMovingToFolderId(folder.id)}
// //                                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[12.5px] font-semibold transition-all ${movingToFolderId === folder.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
// //                             >
// //                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" className="shrink-0"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
// //                                 <span className="truncate">{folder.name}</span>
// //                                 <span className="ml-auto text-[10.5px] opacity-50 font-mono shrink-0">{folder.index}</span>
// //                             </button>
// //                         ))}

// //                         {availableFoldersForMove.length === 0 && (
// //                             <p className="text-[12px] text-slate-400 text-center py-6">No folders available. Create one first.</p>
// //                         )}
// //                     </div>

// //                     <div className="flex gap-2">
// //                         <button onClick={() => setIsMoveModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-[12.5px] font-bold rounded-xl hover:bg-slate-200 transition-all">
// //                             Cancel
// //                         </button>
// //                         <button onClick={executeMoveToFolder} className="flex-1 py-2.5 bg-slate-900 text-white text-[12.5px] font-bold rounded-xl hover:bg-slate-700 transition-all">
// //                             Move Here
// //                         </button>
// //                     </div>
// //                 </Modal>
// //             )}
// //         </div>
// //     );
// // }

// // // ─── FOLDER TREE COMPONENT ────────────────────────────────────────────────────
// // function FolderTree({ folders, parentId, currentFolderId, onSelect, getChildCount, depth = 0 }) {
// //     const children = folders.filter(f => f.parentId === parentId);
// //     if (children.length === 0) return null;

// //     return (
// //         <div className={depth > 0 ? 'ml-3 pl-2 border-l border-slate-100' : ''}>
// //             {children.map(folder => {
// //                 const isActive = currentFolderId === folder.id;
// //                 const subFolders = folders.filter(f => f.parentId === folder.id);
// //                 const count = getChildCount(folder.id);
// //                 return (
// //                     <div key={folder.id}>
// //                         <button
// //                             onClick={() => onSelect(folder.id)}
// //                             className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-all mb-0.5
// //                                 ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
// //                         >
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={isActive ? 'white' : '#f59e0b'} className="shrink-0"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
// //                             <span className="truncate flex-1">{folder.name}</span>
// //                             <span className={`text-[10px] font-bold shrink-0 ${isActive ? 'text-white/60' : 'text-slate-400'}`}>{count}</span>
// //                         </button>
// //                         {subFolders.length > 0 && (
// //                             <FolderTree
// //                                 folders={folders}
// //                                 parentId={folder.id}
// //                                 currentFolderId={currentFolderId}
// //                                 onSelect={onSelect}
// //                                 getChildCount={getChildCount}
// //                                 depth={depth + 1}
// //                             />
// //                         )}
// //                     </div>
// //                 );
// //             })}
// //         </div>
// //     );
// // }

// // // ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
// // function Modal({ children, onClose, maxWidth = 'max-w-lg' }) {
// //     return (
// //         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
// //             <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 -[3px]" />
// //             <div className={`relative bg-white rounded-lg border border-slate-200 shadow-md w-full ${maxWidth} p-6 z-10`}>
// //                 {children}
// //             </div>
// //         </div>
// //     );
// // }






// // "use client";
// // import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
// // import { useSearchParams, useRouter } from 'next/navigation';
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };
// // export default function DocumentsPage() {
// //     return (
// //         <Suspense fallback={
// //             <div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]">
// //                 <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
// //             </div>
// //         }>
// //             <DocumentsPageContent />
// //         </Suspense>
// //     );
// // }

// // function DocumentsPageContent() {
// //     const router = useRouter();
// //     const searchParams = useSearchParams();
// //     const currentView = searchParams.get('view') || 'files';

// //     // Explorer States
// //     const [files, setFiles] = useState([]); // 🔥 NO MORE HARDCODED DATA
// //     const [session, setSession] = useState(null); // 🔥 SESSION TRACKER
// //     const [currentFolderId, setCurrentFolderId] = useState(null);
// //     const [searchQuery, setSearchQuery] = useState('');
// //     const [selectedIds, setSelectedIds] = useState(new Set());

// //     // Custom collections states
// //     const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
// //     const [downloadedIds, setDownloadedIds] = useState(new Set());
// //     const [deletedIds, setDeletedIds] = useState(new Set());

// //     // 🔥 1. SECURE SESSION CHECKER
// //     useEffect(() => {
// //         const activeSession = localStorage.getItem('vdr_session');
// //         if (!activeSession) {
// //             router.push('/login'); // Boot unauthenticated requests
// //             return;
// //         }
// //         setSession(JSON.parse(activeSession));
// //     }, [router]);

// //     // 🔥 2. FETCH FOLDERS AND DOCUMENTS FROM SUPABASE
// //     useEffect(() => {
// //         if (!session) return;

// //         const loadData = async () => {
// //             try {
// //                 // Fetch Folders
// //                 const { data: foldersData, error: folderErr } = await supabase
// //                     .from('folders')
// //                     .select('*')
// //                     .eq('company_id', session.company_id);

// //                 // Fetch Documents
// //                 const { data: docsData, error: docErr } = await supabase
// //                     .from('documents')
// //                     .select('*')
// //                     .eq('company_id', session.company_id)
// //                     .eq('is_deleted', false);

// //                 // Map DB Folders to UI Format
// //                 const mappedFolders = (foldersData || []).map(f => ({
// //                     id: f.id,
// //                     parentId: f.parent_folder_id || null,
// //                     index: f.index_number ? `${f.index_number}.0` : '1.0',
// //                     name: f.name,
// //                     type: 'folder',
// //                     size: '--',
// //                     uploadedBy: 'System',
// //                     dateCreated: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //                     security: 'Encrypted'
// //                 }));

// //                 // Map DB Documents to UI Format
// //                 const mappedDocs = (docsData || []).map(doc => ({
// //                     id: doc.id,
// //                     parentId: doc.folder_id || null,
// //                     index: doc.index || '99.0',
// //                     name: doc.name,
// //                     type: doc.name.split('.').pop().toLowerCase() || 'pdf',
// //                     size: doc.file_size_bytes > 1024 * 1024
// //                         ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
// //                         : `${(doc.file_size_bytes / 1024).toFixed(0)} KB`,
// //                     uploadedBy: 'Admin',
// //                     dateCreated: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //                     security: doc.security || 'Encrypted',
// //                     is_bookmarked: doc.is_bookmarked,
// //                     is_downloaded: doc.is_downloaded
// //                 }));

// //                 setFiles([...mappedFolders, ...mappedDocs]);

// //                 // Restore bookmarked/downloaded states
// //                 const bookmarked = new Set((docsData || []).filter(d => d.is_bookmarked).map(d => d.id));
// //                 const downloaded = new Set((docsData || []).filter(d => d.is_downloaded).map(d => d.id));
// //                 if (bookmarked.size > 0) setBookmarkedIds(bookmarked);
// //                 if (downloaded.size > 0) setDownloadedIds(downloaded);

// //             } catch (err) {
// //                 console.error('Failed to fetch from DB:', err);
// //             }
// //         };

// //         loadData();
// //     }, [session]);

// //     // Filter States
// //     const [activeTypeFilter, setActiveTypeFilter] = useState('all');
// //     const [activeSecurityFilter, setActiveSecurityFilter] = useState('all');

// //     // Dialogs States
// //     const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
// //     const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
// //     const [newFolderName, setNewFolderName] = useState('');

// //     // Custom Action States
// //     const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
// //     const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
// //     const [downloadProgress, setDownloadProgress] = useState(0);
// //     const [downloadingFileName, setDownloadingFileName] = useState('');
// //     const [isExportModalOpen, setIsExportModalOpen] = useState(false);
// //     const [isLinkCopied, setIsLinkCopied] = useState(false);
// //     const [exportWatermarkEnabled, setExportWatermarkEnabled] = useState(true);
// //     const [exportExpiresIn, setExportExpiresIn] = useState('24h');
// //     const [exportSecureLink, setExportSecureLink] = useState('');

// //     // QnA States
// //     const [isRightPaneOpen, setIsRightPaneOpen] = useState(true);
// //     const [isQnaExpanded, setIsQnaExpanded] = useState(true);
// //     const [qnaThreads, setQnaThreads] = useState([]);
// //     const [selectedThreadId, setSelectedThreadId] = useState(null);
// //     const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
// //     const [newQuestionSubject, setNewQuestionSubject] = useState('');
// //     const [newQuestionCategory, setNewQuestionCategory] = useState('Legal');
// //     const [newQuestionPriority, setNewQuestionPriority] = useState('MEDIUM');
// //     const [newQuestionText, setNewQuestionText] = useState('');
// //     const [qnaChatInput, setQnaChatInput] = useState('');
// //     const [isAdminTyping, setIsAdminTyping] = useState(false);

// //     // Multi-File Upload Queue System States
// //     const [uploadQueue, setUploadQueue] = useState([]);
// //     const fileInputRef = useRef(null);
// //     const qnaEndRef = useRef(null);

// //     // Compute Breadcrumb path
// //     const breadcrumbPath = useMemo(() => {
// //         const path = [];
// //         let currentId = currentFolderId;
// //         while (currentId !== null) {
// //             const folder = files.find(f => f.id === currentId);
// //             if (folder) {
// //                 path.unshift(folder);
// //                 currentId = folder.parentId;
// //             } else {
// //                 break;
// //             }
// //         }
// //         return path;
// //     }, [currentFolderId, files]);

// //     // Current folder items
// //     const currentItems = useMemo(() => {
// //         if (currentView === 'trash') return files.filter(f => deletedIds.has(f.id));
// //         if (currentView === 'bookmarks') return files.filter(f => bookmarkedIds.has(f.id) && !deletedIds.has(f.id));
// //         if (currentView === 'downloads') return files.filter(f => downloadedIds.has(f.id) && !deletedIds.has(f.id));
// //         return files.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
// //     }, [currentFolderId, files, currentView, deletedIds, bookmarkedIds, downloadedIds]);

// //     // Filtered & Sorted items
// //     const filteredItems = useMemo(() => {
// //         let items = currentItems;

// //         if (searchQuery.trim()) {
// //             const query = searchQuery.toLowerCase();
// //             items = items.filter(f => f.name.toLowerCase().includes(query) || f.index.includes(query));
// //         }

// //         if (activeTypeFilter === 'folder') items = items.filter(f => f.type === 'folder');
// //         else if (activeTypeFilter === 'document') items = items.filter(f => f.type !== 'folder');

// //         if (activeSecurityFilter !== 'all') items = items.filter(f => f.security === activeSecurityFilter);

// //         return items.sort((a, b) => {
// //             const partsA = a.index.split('.').map(Number);
// //             const partsB = b.index.split('.').map(Number);
// //             const len = Math.max(partsA.length, partsB.length);
// //             for (let i = 0; i < len; i++) {
// //                 const valA = partsA[i] || 0;
// //                 const valB = partsB[i] || 0;
// //                 if (valA !== valB) return valA - valB;
// //             }
// //             return 0;
// //         });
// //     }, [currentItems, searchQuery, activeTypeFilter, activeSecurityFilter]);

// //     const handleToggleSelect = (id, event) => {
// //         event.stopPropagation();
// //         const newSelected = new Set(selectedIds);
// //         if (newSelected.has(id)) newSelected.delete(id);
// //         else newSelected.add(id);
// //         setSelectedIds(newSelected);
// //     };

// //     const handleSelectAll = () => {
// //         if (selectedIds.size === filteredItems.length) setSelectedIds(new Set());
// //         else setSelectedIds(new Set(filteredItems.map(f => f.id)));
// //     };

// //     const handleItemClick = (item) => {
// //         if (item.type === 'folder') {
// //             if (currentView !== 'files') router.push(`/documents?view=files`);
// //             setCurrentFolderId(item.id);
// //             setSelectedIds(new Set());
// //             setSearchQuery('');
// //         } else {
// //             const newSelected = new Set();
// //             newSelected.add(item.id);
// //             setSelectedIds(newSelected);
// //         }
// //     };

// //     const handleToggleBookmark = (id, event) => {
// //         event.stopPropagation();
// //         const newBookmarked = new Set(bookmarkedIds);
// //         if (newBookmarked.has(id)) newBookmarked.delete(id);
// //         else newBookmarked.add(id);
// //         setBookmarkedIds(newBookmarked);
// //     };

// //     const generateNewIndex = () => {
// //         const peers = files.filter(f => f.parentId === currentFolderId);
// //         if (currentFolderId === null) {
// //             const maxIndex = peers.reduce((max, item) => {
// //                 const firstPart = parseInt(item.index.split('.')[0]) || 0;
// //                 return firstPart > max ? firstPart : max;
// //             }, 0);
// //             return `${maxIndex + 1}.0`;
// //         } else {
// //             const parent = files.find(f => f.id === currentFolderId);
// //             const parentPrefix = parent.index.endsWith('.0') ? parent.index.slice(0, -2) : parent.index;
// //             const maxSubIndex = peers.reduce((max, item) => {
// //                 const indexParts = item.index.split('.');
// //                 const lastPart = parseInt(indexParts[indexParts.length - 1]) || 0;
// //                 return lastPart > max ? lastPart : max;
// //             }, 0);
// //             return `${parentPrefix}.${maxSubIndex + 1}`;
// //         }
// //     };

// //     // 🔥 3. CREATE FOLDER IN SUPABASE DATABASE
// //     const handleCreateFolderSubmit = async (e) => {
// //         e.preventDefault();
// //         if (!newFolderName.trim() || !session) return;

// //         const newIndexStr = generateNewIndex();

// //         // Insert into Supabase
// //         const { data: dbFolder, error } = await supabase.from('folders').insert({
// //             company_id: session.company_id,
// //             parent_folder_id: currentFolderId,
// //             name: newFolderName,
// //             index_number: parseInt(newIndexStr.split('.')[0]) || 1,
// //             created_by: session.id
// //         }).select().single();

// //         if (error) {
// //             console.error("Error creating folder:", error);
// //             alert("Failed to create folder");
// //             return;
// //         }

// //         const newFolder = {
// //             id: dbFolder.id,
// //             parentId: dbFolder.parent_folder_id,
// //             index: newIndexStr,
// //             name: dbFolder.name,
// //             type: 'folder',
// //             size: '0 items',
// //             uploadedBy: session.name,
// //             dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //             security: 'Encrypted'
// //         };

// //         setFiles([...files, newFolder]);
// //         setNewFolderName('');
// //         setIsNewFolderOpen(false);
// //     };

// //     const handleDeleteSelected = () => {
// //         if (selectedIds.size === 0) return;
// //         setIsDeleteModalOpen(true);
// //     };

// //     const executeDeleteSelected = async () => {
// //         // We will just do UI state update here for speed,
// //         // but in reality you would loop and call supabase.from('documents').update({is_deleted: true})
// //         const idsToDelete = new Set(deletedIds);
// //         selectedIds.forEach(id => idsToDelete.add(id));
// //         setDeletedIds(idsToDelete);
// //         setSelectedIds(new Set());
// //         setIsDeleteModalOpen(false);
// //     };

// //     const handleDownloadSelected = () => {
// //         setIsDownloadModalOpen(true);
// //         setTimeout(() => setIsDownloadModalOpen(false), 2000);
// //     };

// //     const triggerFileSelect = () => {
// //         fileInputRef.current?.click();
// //     };

// //     // 🔥 4. UPLOAD FILES WITH SESSION CREDENTIALS
// //     const handleFileChange = async (e) => {
// //         const chosenFiles = Array.from(e.target.files);
// //         if (chosenFiles.length === 0 || !session) return;

// //         const newQueueItems = chosenFiles.map((file, idx) => ({
// //             id: `up-${Date.now()}-${idx}`,
// //             name: file.name,
// //             size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`,
// //             progress: 0,
// //             status: 'uploading'
// //         }));

// //         setUploadQueue(newQueueItems);

// //         for (let i = 0; i < chosenFiles.length; i++) {
// //             const file = chosenFiles[i];
// //             const queueItem = newQueueItems[i];

// //             try {
// //                 const fileBuffer = await file.arrayBuffer();
// //                 const cryptoKey = await window.crypto.subtle.generateKey(
// //                     { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
// //                 );

// //                 const iv = window.crypto.getRandomValues(new Uint8Array(12));
// //                 const encryptedBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, fileBuffer);

// //                 const rawKey = await window.crypto.subtle.exportKey('raw', cryptoKey);
// //                 const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
// //                 const ivBase64 = btoa(String.fromCharCode(...iv));
// //                 const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
// //                 const dekRef = `${ivBase64}:${keyBase64}`;

// //                 const newIndex = generateNewIndex();

// //                 // Dynamic POST to your API
// //                 const response = await fetch('/api/documents/upload', {
// //                     method: 'POST',
// //                     headers: { 'Content-Type': 'application/json' },
// //                     body: JSON.stringify({
// //                         company_id: session.company_id, // Passed from LocalStorage Session!
// //                         folder_id: currentFolderId,
// //                         uploaded_by: session.id,        // Passed from LocalStorage Session!
// //                         name: file.name,
// //                         file_data: encryptedBase64,
// //                         mime_type: file.type || 'application/octet-stream',
// //                         file_size_bytes: file.size,
// //                         dek_ref: dekRef,
// //                         index: newIndex,
// //                         security: 'Encrypted'
// //                     })
// //                 });

// //                 if (!response.ok) throw new Error("Upload Failed");
// //                 const { id: docId } = await response.json();

// //                 setUploadQueue(prev => prev.map(item => item.id === queueItem.id ? { ...item, progress: 100, status: 'completed' } : item));

// //                 setFiles(prev => [...prev, {
// //                     id: docId,
// //                     parentId: currentFolderId,
// //                     index: newIndex,
// //                     name: file.name,
// //                     type: file.name.split('.').pop().toLowerCase() || 'pdf',
// //                     size: queueItem.size,
// //                     uploadedBy: session.name, // Shows who actually uploaded it
// //                     dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //                     security: 'Encrypted'
// //                 }]);

// //             } catch (err) {
// //                 console.error('Encryption/upload failed', err);
// //                 setUploadQueue(prev => prev.map(item => item.id === queueItem.id ? { ...item, status: 'error' } : item));
// //             }
// //         }

// //         setTimeout(() => {
// //             setUploadQueue([]);
// //             setIsUploadModalOpen(false);
// //         }, 800);
// //     };

// //     // UI Render Helpers
// //     const renderFileIcon = (type) => {
// //         switch (type) {
// //             case 'folder':
// //                 return (
// //                     <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-sm text-slate-600 group-hover:scale-105 transition-all duration-300">
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
// //                     </div>
// //                 );
// //             case 'pdf': return <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 shadow-sm text-rose-600/90 font-extrabold text-[9px]">PDF</div>;
// //             case 'xlsx': return <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm text-emerald-600/90 font-extrabold text-[8.5px]">XLS</div>;
// //             case 'docx': return <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm text-indigo-600/90 font-extrabold text-[8.5px]">DOC</div>;
// //             default: return <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-sm text-slate-500 font-extrabold text-[8.5px]">FILE</div>;
// //         }
// //     };

// //     const renderClearanceTag = (security) => {
// //         return (
// //             <span className="text-[10px] font-bold px-2.5 py-0.75 bg-slate-50 text-slate-500 border border-slate-200 rounded-full inline-flex items-center gap-1.5">
// //                 {security}
// //             </span>
// //         );
// //     };

// //     return (
// //         <div className="relative flex w-full h-full bg-[#FAFBFD] overflow-hidden text-slate-800 font-sans">
// //             <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

// //             <div className="flex-1 flex flex-col h-full min-w-0 p-6 md:p-8 overflow-hidden relative">

// //                 {/* Header */}
// //                 <div className="flex items-center justify-between mb-5 select-none w-full gap-4">
// //                     <div className="flex items-center gap-2 text-[15px] text-black font-bold uppercase">
// //                         Files Management
// //                         {breadcrumbPath.map((item, idx) => {
// //                             const isLast = idx === breadcrumbPath.length - 1;
// //                             return (
// //                                 <span key={item.id} className="flex items-center gap-2">
// //                                     <span onClick={() => !isLast && setCurrentFolderId(item.id)} className={`transition-colors duration-200 ${isLast ? 'text-slate-800 font-black' : 'hover:text-slate-800 hover:underline cursor-pointer'}`}>
// //                                         {item.name}
// //                                     </span>
// //                                     {!isLast && <span className="text-slate-300">/</span>}
// //                                 </span>
// //                             );
// //                         })}
// //                     </div>
// //                 </div>

// //                 {/* Toolbar */}
// //                 <div className="flex flex-col gap-4 pb-5 select-none">
// //                     <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 bg-white border border-slate-200/60 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
// //                         <div className="flex items-center flex-wrap gap-2.5">
// //                             <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[12.5px] font-bold rounded-xl shadow-sm transition-all duration-300">
// //                                 Upload
// //                             </button>
// //                             <button onClick={() => setIsNewFolderOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-[12.5px] font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all duration-300">
// //                                 Add Folder
// //                             </button>
// //                             <div className="w-[1px] h-5 bg-slate-200 mx-1"></div>
// //                             <button onClick={handleDeleteSelected} disabled={selectedIds.size === 0} className={`flex items-center gap-2 px-4 py-2.5 border text-[12.5px] font-bold rounded-xl transition-all duration-300 ${selectedIds.size > 0 ? 'bg-rose-50/60 border-rose-100 text-rose-600 cursor-pointer' : 'bg-slate-50/50 border-slate-100 text-slate-355 cursor-not-allowed opacity-60'}`}>
// //                                 Delete
// //                             </button>
// //                         </div>
// //                     </div>
// //                 </div>

// //                 {/* Create Folder Inline Form */}
// //                 {isNewFolderOpen && (
// //                     <form onSubmit={handleCreateFolderSubmit} className="flex items-center gap-3 p-4 bg-slate-50/80 border border-slate-200/80 rounded-lg mb-4">
// //                         <input type="text" placeholder="Enter folder name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-slate-400" autoFocus />
// //                         <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-[12.5px] font-bold rounded-xl">Create</button>
// //                         <button type="button" onClick={() => setIsNewFolderOpen(false)} className="px-3.5 py-2 bg-white border border-slate-200 text-slate-500 text-[12.5px] font-bold rounded-xl">Cancel</button>
// //                     </form>
// //                 )}

// //                 {/* Main Files Table */}
// //                 <div className="flex-1 overflow-auto mt-2 rounded-lg border border-slate-200 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.015)]">
// //                     <table className="w-full min-w-[800px] border-collapse text-left text-[13px]">
// //                         <thead>
// //                             <tr className="border-b border-slate-200 bg-slate-50/50 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest">
// //                                 <th className="py-4 px-5 w-10"></th>
// //                                 <th className="py-4 px-3 w-16 text-center">Index</th>
// //                                 <th className="py-4 px-3">Name</th>
// //                                 <th className="py-4 px-3 w-28 text-center">Size</th>
// //                                 <th className="py-4 px-3 w-36">Uploaded By</th>
// //                                 <th className="py-4 px-3 w-32">Date</th>
// //                             </tr>
// //                         </thead>
// //                         <tbody className="divide-y divide-slate-100">
// //                             {filteredItems.length === 0 ? (
// //                                 <tr>
// //                                     <td colSpan="6" className="py-28 text-center text-slate-400 font-bold">No files in this vault.</td>
// //                                 </tr>
// //                             ) : (
// //                                 filteredItems.map((item) => {
// //                                     const isChecked = selectedIds.has(item.id);
// //                                     return (
// //                                         <tr key={item.id} onClick={() => handleItemClick(item)} className={`hover:bg-[#FAFBFD] cursor-pointer transition-all ${isChecked ? 'bg-[#F1F5F9]/30 border-l-[3.5px] border-slate-900' : 'border-l-[3.5px] border-transparent'}`}>
// //                                             <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
// //                                                 <input type="checkbox" checked={isChecked} onChange={(e) => handleToggleSelect(item.id, e)} className="w-4.5 h-4.5 rounded-md border-slate-300 accent-slate-800" />
// //                                             </td>
// //                                             <td className="py-4 px-3 text-center font-mono text-[12px] font-semibold text-slate-400">{item.index}</td>
// //                                             <td className="py-4 px-3">
// //                                                 <div className="flex items-center gap-3">
// //                                                     {renderFileIcon(item.type)}
// //                                                     <span className="font-semibold text-slate-700">{item.name}</span>
// //                                                 </div>
// //                                             </td>
// //                                             <td className="py-4 px-3 text-center font-medium text-slate-500">{item.size}</td>
// //                                             <td className="py-4 px-3 font-semibold text-slate-600">{item.uploadedBy}</td>
// //                                             <td className="py-4 px-3 text-slate-400 font-bold text-[12px]">{item.dateCreated}</td>
// //                                         </tr>
// //                                     );
// //                                 })
// //                             )}
// //                         </tbody>
// //                     </table>
// //                 </div>
// //             </div>

// //             {/* Upload Modal */}
// //             {isUploadModalOpen && (
// //                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
// //                     <div onClick={() => setIsUploadModalOpen(false)} className="absolute inset-0 bg-slate-900/50 -[2px]"></div>
// //                     <div className="relative bg-white rounded-xl border border-slate-200 shadow-md w-full max-w-3xl p-8 z-10">
// //                         <h3 className="text-[17px] font-extrabold text-slate-850 mb-6">Secure Upload Center</h3>
// //                         <div onClick={triggerFileSelect} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 bg-slate-50 rounded-lg cursor-pointer">
// //                             <span className="font-extrabold text-[14px] text-slate-800">Secure Upload Package</span>
// //                             <p className="text-[11.5px] text-slate-400 mt-1">Click to browse your local workstation</p>
// //                         </div>
// //                     </div>
// //                 </div>
// //             )}
// //         </div>
// //     );
// // }




















// // previous code without session ,static files ui..
// // "use client";

// // import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
// // import { useSearchParams, useRouter } from 'next/navigation';

// // // Seed initial files and folders list with VDR hierarchical indexing
// // const INITIAL_FILES = [
// //     // Root Level Folders
// //     { id: '1', parentId: null, index: '1.0', name: 'Legal & Corporate Documents', type: 'folder', size: '3 items', uploadedBy: 'John Doe', dateCreated: 'May 10, 2026', security: 'Restricted' },
// //     { id: '2', parentId: null, index: '2.0', name: 'Financial Audit 2026', type: 'folder', size: '3 items', uploadedBy: 'Anushiya S.', dateCreated: 'May 12, 2026', security: 'Encrypted' },
// //     { id: '3', parentId: null, index: '3.0', name: 'Technical Due Diligence', type: 'folder', size: '2 items', uploadedBy: 'Anushiya S.', dateCreated: 'May 15, 2026', security: 'Highly Secure' },
// //     // Root Level Files
// //     { id: '4', parentId: null, index: '4.0', name: 'VDR-Shareholders-Agreement.pdf', type: 'pdf', size: '3.4 MB', uploadedBy: 'John Doe', dateCreated: 'May 16, 2026', security: 'Watermarked' },
// //     { id: '5', parentId: null, index: '5.0', name: 'Project-VDR-Architecture.pdf', type: 'pdf', size: '5.8 MB', uploadedBy: 'Anushiya S.', dateCreated: 'May 17, 2026', security: 'Encrypted' },

// //     // Inside Folder 1: Legal Documents
// //     { id: '101', parentId: '1', index: '1.1', name: 'Articles_of_Association.pdf', type: 'pdf', size: '1.2 MB', uploadedBy: 'John Doe', dateCreated: 'May 10, 2026', security: 'Restricted' },
// //     { id: '102', parentId: '1', index: '1.2', name: 'NDA_Corporate_Template.docx', type: 'docx', size: '450 KB', uploadedBy: 'John Doe', dateCreated: 'May 11, 2026', security: 'Watermarked' },
// //     { id: '103', parentId: '1', index: '1.3', name: 'Intellectual_Property_Assignment.pdf', type: 'pdf', size: '2.1 MB', uploadedBy: 'John Doe', dateCreated: 'May 11, 2026', security: 'Watermarked' },

// //     // Inside Folder 2: Financial Audit 2026
// //     { id: '201', parentId: '2', index: '2.1', name: 'Q1_Balance_Sheets_Audited.xlsx', type: 'xlsx', size: '8.9 MB', uploadedBy: 'Anushiya S.', dateCreated: 'May 12, 2026', security: 'Encrypted' },
// //     { id: '202', parentId: '2', index: '2.2', name: 'Tax_Filing_Statement_2025.pdf', type: 'pdf', size: '4.1 MB', uploadedBy: 'John Doe', dateCreated: 'May 13, 2026', security: 'Encrypted' },
// //     { id: '203', parentId: '2', index: '2.3', name: 'Invoices_Supplier_Logs', type: 'folder', size: '2 items', uploadedBy: 'Anushiya S.', dateCreated: 'May 14, 2026', security: 'Encrypted' },

// //     // Inside Folder 203: Invoices
// //     { id: '2031', parentId: '203', index: '2.3.1', name: 'AWS_Hosting_Billing_Apr26.pdf', type: 'pdf', size: '120 KB', uploadedBy: 'Anushiya S.', dateCreated: 'May 14, 2026', security: 'Highly Secure' },
// //     { id: '2032', parentId: '203', index: '2.3.2', name: 'Google_Cloud_Workspace_Invoice.pdf', type: 'pdf', size: '95 KB', uploadedBy: 'John Doe', dateCreated: 'May 15, 2026', security: 'Watermarked' },

// //     // Inside Folder 3: Technical Due Diligence
// //     { id: '301', parentId: '3', index: '3.1', name: 'Database_Schema_Architecture.png', type: 'image', size: '2.5 MB', uploadedBy: 'Anushiya S.', dateCreated: 'May 15, 2026', security: 'Highly Secure' },
// //     { id: '302', parentId: '3', index: '3.2', name: 'Vulnerability_Assessment_Report.pdf', type: 'pdf', size: '1.8 MB', uploadedBy: 'Anushiya S.', dateCreated: 'May 16, 2026', security: 'Encrypted' }
// // ];

// // export default function DocumentsPage() {
// //     return (
// //         <Suspense fallback={
// //             <div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]">
// //                 <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
// //             </div>
// //         }>
// //             <DocumentsPageContent />
// //         </Suspense>
// //     );
// // }

// // function DocumentsPageContent() {
// //     const router = useRouter();
// //     const searchParams = useSearchParams();
// //     const currentView = searchParams.get('view') || 'files';

// //     // Explorer States
// //     const [files, setFiles] = useState(INITIAL_FILES);
// //     const [currentFolderId, setCurrentFolderId] = useState(null); // null means root
// //     const [searchQuery, setSearchQuery] = useState('');
// //     const [selectedIds, setSelectedIds] = useState(new Set());

// //     // Custom collections states
// //     const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
// //     const [downloadedIds, setDownloadedIds] = useState(new Set());
// //     const [deletedIds, setDeletedIds] = useState(new Set());

// //     // Fetch documents from DB on mount and merge with static seed data
// //     useEffect(() => {
// //         const fetchDocuments = async () => {
// //             try {
// //                 const res = await fetch('/api/documents/list?company_id=11111111-1111-1111-1111-111111111111');
// //                 if (!res.ok) return;
// //                 const { documents } = await res.json();

// //                 if (!documents || documents.length === 0) return;

// //                 // Map DB rows to the shape the UI expects
// //                 const dbFiles = documents.map(doc => ({
// //                     id: doc.id,
// //                     parentId: doc.folder_id || null,
// //                     index: doc.index || '99.0',
// //                     name: doc.name,
// //                     type: doc.name.split('.').pop().toLowerCase() || 'pdf',
// //                     size: doc.file_size_bytes > 1024 * 1024
// //                         ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
// //                         : `${(doc.file_size_bytes / 1024).toFixed(0)} KB`,
// //                     uploadedBy: doc.uploaded_by || 'Anushiya S.',
// //                     dateCreated: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //                     security: doc.security || 'Encrypted',
// //                 }));

// //                 // Merge: keep static seed files + add DB files (avoid duplicates by id)
// //                 setFiles(prev => {
// //                     const existingIds = new Set(prev.map(f => f.id));
// //                     const newOnly = dbFiles.filter(f => !existingIds.has(f.id));
// //                     return [...prev, ...newOnly];
// //                 });

// //                 // Restore bookmarked/downloaded states from DB
// //                 const bookmarked = new Set(documents.filter(d => d.is_bookmarked).map(d => d.id));
// //                 const downloaded = new Set(documents.filter(d => d.is_downloaded).map(d => d.id));
// //                 if (bookmarked.size > 0) setBookmarkedIds(bookmarked);
// //                 if (downloaded.size > 0) setDownloadedIds(downloaded);

// //             } catch (err) {
// //                 console.error('Failed to fetch documents from DB:', err);
// //             }
// //         };

// //         fetchDocuments();
// //     }, []); // runs once on mount

// //     // Filter States
// //     const [activeTypeFilter, setActiveTypeFilter] = useState('all');
// //     const [activeSecurityFilter, setActiveSecurityFilter] = useState('all');

// //     // Dialogs States
// //     const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
// //     const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
// //     const [newFolderName, setNewFolderName] = useState('');

// //     // Custom Action States
// //     const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
// //     const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
// //     const [downloadProgress, setDownloadProgress] = useState(0);
// //     const [downloadingFileName, setDownloadingFileName] = useState('');
// //     const [isExportModalOpen, setIsExportModalOpen] = useState(false);
// //     const [isLinkCopied, setIsLinkCopied] = useState(false);
// //     const [exportWatermarkEnabled, setExportWatermarkEnabled] = useState(true);
// //     const [exportExpiresIn, setExportExpiresIn] = useState('24h');
// //     const [exportSecureLink, setExportSecureLink] = useState('');

// //     // Broadcast counts to sidebar when they change
// //     useEffect(() => {
// //         const detail = {
// //             totalCount: files.filter(f => !deletedIds.has(f.id) && f.type !== 'folder').length,
// //             bookmarksCount: files.filter(f => bookmarkedIds.has(f.id) && !deletedIds.has(f.id)).length,
// //             recentCount: files.filter(f => !deletedIds.has(f.id) && f.type !== 'folder' && (f.id === '4' || f.id === '5' || f.id === '302' || f.id.startsWith('file-'))).length,
// //             downloadsCount: files.filter(f => downloadedIds.has(f.id) && !deletedIds.has(f.id)).length,
// //             trashCount: files.filter(f => deletedIds.has(f.id)).length
// //         };

// //         const event = new CustomEvent('vdr-state-update', { detail });
// //         window.dispatchEvent(event);
// //     }, [files, bookmarkedIds, downloadedIds, deletedIds]);

// //     // Handle requests for initial counts from sidebar
// //     useEffect(() => {
// //         const handleRequest = () => {
// //             const detail = {
// //                 totalCount: files.filter(f => !deletedIds.has(f.id) && f.type !== 'folder').length,
// //                 bookmarksCount: files.filter(f => bookmarkedIds.has(f.id) && !deletedIds.has(f.id)).length,
// //                 recentCount: files.filter(f => !deletedIds.has(f.id) && f.type !== 'folder' && (f.id === '4' || f.id === '5' || f.id === '302' || f.id.startsWith('file-'))).length,
// //                 downloadsCount: files.filter(f => downloadedIds.has(f.id) && !deletedIds.has(f.id)).length,
// //                 trashCount: files.filter(f => deletedIds.has(f.id)).length
// //             };
// //             const event = new CustomEvent('vdr-state-update', { detail });
// //             window.dispatchEvent(event);
// //         };

// //         window.addEventListener('vdr-state-request', handleRequest);

// //         // Dispatch immediately in case sidebar is already mounted
// //         handleRequest();

// //         return () => {
// //             window.removeEventListener('vdr-state-request', handleRequest);
// //         };
// //     }, [files, bookmarkedIds, downloadedIds, deletedIds]);

// //     // Auto-open upload modal if URL parameters request it
// //     useEffect(() => {
// //         if (currentView === 'upload') {
// //             setTimeout(() => {
// //                 setIsUploadModalOpen(true);
// //             }, 0);
// //         }
// //     }, [currentView]);

// //     const handleCloseUploadModal = () => {
// //         setIsUploadModalOpen(false);
// //         if (currentView === 'upload') {
// //             router.push('/documents?view=files');
// //         }
// //     };

// //     // QnA States
// //     const [activeRightTab, setActiveRightTab] = useState('details'); // 'details' or 'qna'
// //     const [isRightPaneOpen, setIsRightPaneOpen] = useState(true);
// //     const [isInspectorExpanded, setIsInspectorExpanded] = useState(true);
// //     const [isQnaExpanded, setIsQnaExpanded] = useState(true);
// //     const [qnaThreads, setQnaThreads] = useState([
// //         {
// //             id: 'thread-1',
// //             fileId: '4', // VDR-Shareholders-Agreement.pdf
// //             subject: 'Shareholder Signatures Verification',
// //             category: 'Legal',
// //             priority: 'HIGH',
// //             status: 'Answered',
// //             dateCreated: 'May 18, 2026',
// //             messages: [
// //                 { sender: 'You', text: 'Where can I find the shareholder signatures?', time: '11:42 AM', isUser: true },
// //                 { sender: 'VDR Administrator', text: 'Signature sheets are attached at the very end of VDR-Shareholders-Agreement.pdf (Pages 24-26).', time: '11:44 AM', isUser: false }
// //             ]
// //         },
// //         {
// //             id: 'thread-2',
// //             fileId: '201', // Q1 Balance Sheets Audited.xlsx
// //             subject: 'Q1 Balance Sheet Formulas Audit',
// //             category: 'Financial',
// //             priority: 'MEDIUM',
// //             status: 'Open',
// //             dateCreated: 'May 18, 2026',
// //             messages: [
// //                 { sender: 'You', text: 'Some formulas in G24 seem to be hardcoded, is there a supporting audit trail spreadsheet?', time: '12:05 PM', isUser: true }
// //             ]
// //         }
// //     ]);
// //     const [selectedThreadId, setSelectedThreadId] = useState(null);
// //     const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
// //     const [newQuestionSubject, setNewQuestionSubject] = useState('');
// //     const [newQuestionCategory, setNewQuestionCategory] = useState('Legal');
// //     const [newQuestionPriority, setNewQuestionPriority] = useState('MEDIUM');
// //     const [newQuestionText, setNewQuestionText] = useState('');
// //     const [qnaChatInput, setQnaChatInput] = useState('');
// //     const [isAdminTyping, setIsAdminTyping] = useState(false);

// //     // Compute active selected file from selectedIds
// //     const selectedFile = useMemo(() => {
// //         if (selectedIds.size === 1) {
// //             const singleId = Array.from(selectedIds)[0];
// //             const found = files.find(f => f.id === singleId);
// //             return found && found.type !== 'folder' ? found : null;
// //         }
// //         return null;
// //     }, [selectedIds, files]);

// //     // Automatically open the QnA portal and reset active thread view when a file is selected
// //     useEffect(() => {
// //         if (selectedFile) {
// //             setIsRightPaneOpen(true);
// //             setSelectedThreadId(null);
// //         }
// //     }, [selectedFile]);

// //     // Filter QnA threads for the selected file
// //     const filteredQnaThreads = useMemo(() => {
// //         if (selectedFile) {
// //             return qnaThreads.filter(t => t.fileId === selectedFile.id);
// //         }
// //         return [];
// //     }, [qnaThreads, selectedFile]);

// //     // Multi-File Upload Queue System States
// //     const [uploadQueue, setUploadQueue] = useState([]);
// //     const fileInputRef = useRef(null);
// //     const qnaEndRef = useRef(null);

// //     // Scroll QnA chat
// //     useEffect(() => {
// //         if (qnaEndRef.current) {
// //             qnaEndRef.current.scrollIntoView({ behavior: 'smooth' });
// //         }
// //     }, [qnaThreads, isAdminTyping, selectedThreadId]);

// //     // Compute Breadcrumb path
// //     const breadcrumbPath = useMemo(() => {
// //         const path = [];
// //         let currentId = currentFolderId;
// //         while (currentId !== null) {
// //             const folder = files.find(f => f.id === currentId);
// //             if (folder) {
// //                 path.unshift(folder);
// //                 currentId = folder.parentId;
// //             } else {
// //                 break;
// //             }
// //         }
// //         return path;
// //     }, [currentFolderId, files]);

// //     // Current folder items
// //     const currentItems = useMemo(() => {
// //         if (currentView === 'trash') {
// //             // Flat list of deleted items
// //             return files.filter(f => deletedIds.has(f.id));
// //         }
// //         if (currentView === 'bookmarks') {
// //             // Flat list of bookmarked items
// //             return files.filter(f => bookmarkedIds.has(f.id) && !deletedIds.has(f.id));
// //         }
// //         if (currentView === 'downloads') {
// //             // Flat list of downloaded items
// //             return files.filter(f => downloadedIds.has(f.id) && !deletedIds.has(f.id));
// //         }
// //         if (currentView === 'recent') {
// //             // Flat list of active items sorted by date or index
// //             const recentIds = new Set(['4', '5', '301', '302']);
// //             return files.filter(f => !deletedIds.has(f.id) && (recentIds.has(f.id) || f.id.startsWith('file-') || f.id.startsWith('up-')));
// //         }
// //         // Default: files view (Explorer with hierarchy)
// //         return files.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
// //     }, [currentFolderId, files, currentView, deletedIds, bookmarkedIds, downloadedIds]);

// //     // Filtered & Sorted items
// //     const filteredItems = useMemo(() => {
// //         let items = currentItems;

// //         if (searchQuery.trim()) {
// //             const query = searchQuery.toLowerCase();
// //             items = items.filter(f => f.name.toLowerCase().includes(query) || f.index.includes(query));
// //         }

// //         if (activeTypeFilter === 'folder') {
// //             items = items.filter(f => f.type === 'folder');
// //         } else if (activeTypeFilter === 'document') {
// //             items = items.filter(f => f.type !== 'folder');
// //         }

// //         if (activeSecurityFilter !== 'all') {
// //             items = items.filter(f => f.security === activeSecurityFilter);
// //         }

// //         // Sort strictly by VDR hierarchy index numbering
// //         return items.sort((a, b) => {
// //             const partsA = a.index.split('.').map(Number);
// //             const partsB = b.index.split('.').map(Number);
// //             const len = Math.max(partsA.length, partsB.length);
// //             for (let i = 0; i < len; i++) {
// //                 const valA = partsA[i] || 0;
// //                 const valB = partsB[i] || 0;
// //                 if (valA !== valB) return valA - valB;
// //             }
// //             return 0;
// //         });
// //     }, [currentItems, searchQuery, activeTypeFilter, activeSecurityFilter]);

// //     const activeThread = useMemo(() => {
// //         return qnaThreads.find(t => t.id === selectedThreadId);
// //     }, [selectedThreadId, qnaThreads]);

// //     const activeInspectionItem = useMemo(() => {
// //         if (selectedIds.size === 1) {
// //             const singleId = Array.from(selectedIds)[0];
// //             return files.find(f => f.id === singleId);
// //         }
// //         if (currentFolderId) {
// //             return files.find(f => f.id === currentFolderId);
// //         }
// //         return { name: 'Root Vault', type: 'folder', index: '0.0', size: `${files.filter(f => f.parentId === null).length} items`, security: 'Highly Secure', uploadedBy: 'System', dateCreated: 'May 01, 2026' };
// //     }, [selectedIds, currentFolderId, files]);

// //     const handleToggleSelect = (id, event) => {
// //         event.stopPropagation();
// //         const newSelected = new Set(selectedIds);
// //         if (newSelected.has(id)) {
// //             newSelected.delete(id);
// //         } else {
// //             newSelected.add(id);
// //         }
// //         setSelectedIds(newSelected);
// //     };

// //     const handleSelectAll = () => {
// //         if (selectedIds.size === filteredItems.length) {
// //             setSelectedIds(new Set());
// //         } else {
// //             setSelectedIds(new Set(filteredItems.map(f => f.id)));
// //         }
// //     };

// //     const handleItemClick = (item) => {
// //         if (item.type === 'folder') {
// //             if (currentView !== 'files') {
// //                 router.push(`/documents?view=files`);
// //             }
// //             setCurrentFolderId(item.id);
// //             setSelectedIds(new Set());
// //             setSearchQuery('');
// //         } else {
// //             const newSelected = new Set();
// //             newSelected.add(item.id);
// //             setSelectedIds(newSelected);
// //         }
// //     };

// //     const handleToggleBookmark = (id, event) => {
// //         event.stopPropagation();
// //         const newBookmarked = new Set(bookmarkedIds);
// //         if (newBookmarked.has(id)) {
// //             newBookmarked.delete(id);
// //         } else {
// //             newBookmarked.add(id);
// //         }
// //         setBookmarkedIds(newBookmarked);
// //     };

// //     const generateNewIndex = () => {
// //         const peers = files.filter(f => f.parentId === currentFolderId);
// //         if (currentFolderId === null) {
// //             const maxIndex = peers.reduce((max, item) => {
// //                 const firstPart = parseInt(item.index.split('.')[0]) || 0;
// //                 return firstPart > max ? firstPart : max;
// //             }, 0);
// //             return `${maxIndex + 1}.0`;
// //         } else {
// //             const parent = files.find(f => f.id === currentFolderId);
// //             const parentPrefix = parent.index.endsWith('.0') ? parent.index.slice(0, -2) : parent.index;
// //             const maxSubIndex = peers.reduce((max, item) => {
// //                 const indexParts = item.index.split('.');
// //                 const lastPart = parseInt(indexParts[indexParts.length - 1]) || 0;
// //                 return lastPart > max ? lastPart : max;
// //             }, 0);
// //             return `${parentPrefix}.${maxSubIndex + 1}`;
// //         }
// //     };

// //     const handleCreateFolderSubmit = (e) => {
// //         e.preventDefault();
// //         if (!newFolderName.trim()) return;

// //         const newFolder = {
// //             id: Date.now().toString(),
// //             parentId: currentFolderId,
// //             index: generateNewIndex(),
// //             name: newFolderName,
// //             type: 'folder',
// //             size: '0 items',
// //             uploadedBy: 'Anushiya S.',
// //             dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //             security: 'Encrypted'
// //         };

// //         setFiles([...files, newFolder]);
// //         setNewFolderName('');
// //         setIsNewFolderOpen(false);
// //     };

// //     const handleDeleteSelected = () => {
// //         if (selectedIds.size === 0) return;
// //         setIsDeleteModalOpen(true);
// //     };

// //     const executeDeleteSelected = () => {
// //         if (currentView === 'trash') {
// //             executePermanentDelete();
// //         } else {
// //             const idsToDelete = new Set(deletedIds);
// //             const getAllChildrenIds = (parentId) => {
// //                 files.filter(f => f.parentId === parentId).forEach(child => {
// //                     idsToDelete.add(child.id);
// //                     if (child.type === 'folder') {
// //                         getAllChildrenIds(child.id);
// //                     }
// //                 });
// //             };

// //             selectedIds.forEach(id => {
// //                 idsToDelete.add(id);
// //                 const item = files.find(f => f.id === id);
// //                 if (item && item.type === 'folder') {
// //                     getAllChildrenIds(id);
// //                 }
// //             });

// //             setDeletedIds(idsToDelete);
// //             setSelectedIds(new Set());
// //             setIsDeleteModalOpen(false);
// //         }
// //     };

// //     const executePermanentDelete = () => {
// //         const idsToDestroy = new Set(selectedIds);
// //         const getAllChildrenIds = (parentId) => {
// //             files.filter(f => f.parentId === parentId).forEach(child => {
// //                 idsToDestroy.add(child.id);
// //                 if (child.type === 'folder') {
// //                     getAllChildrenIds(child.id);
// //                 }
// //             });
// //         };

// //         selectedIds.forEach(id => {
// //             const item = files.find(f => f.id === id);
// //             if (item && item.type === 'folder') {
// //                 getAllChildrenIds(id);
// //             }
// //         });

// //         setFiles(files.filter(f => !idsToDestroy.has(f.id)));

// //         const newDeleted = new Set(deletedIds);
// //         const newBookmarked = new Set(bookmarkedIds);
// //         const newDownloaded = new Set(downloadedIds);

// //         idsToDestroy.forEach(id => {
// //             newDeleted.delete(id);
// //             newBookmarked.delete(id);
// //             newDownloaded.delete(id);
// //         });

// //         setDeletedIds(newDeleted);
// //         setBookmarkedIds(newBookmarked);
// //         setDownloadedIds(newDownloaded);
// //         setSelectedIds(new Set());
// //         setIsDeleteModalOpen(false);
// //     };

// //     const handleRestoreSelected = () => {
// //         if (selectedIds.size === 0) return;
// //         const newDeleted = new Set(deletedIds);

// //         const getAllChildrenIds = (parentId) => {
// //             files.filter(f => f.parentId === parentId).forEach(child => {
// //                 newDeleted.delete(child.id);
// //                 if (child.type === 'folder') {
// //                     getAllChildrenIds(child.id);
// //                 }
// //             });
// //         };

// //         selectedIds.forEach(id => {
// //             newDeleted.delete(id);
// //             const item = files.find(f => f.id === id);
// //             if (item && item.type === 'folder') {
// //                 getAllChildrenIds(id);
// //             }

// //             // Also restore parents if they were deleted
// //             let parentId = item?.parentId;
// //             while (parentId) {
// //                 newDeleted.delete(parentId);
// //                 const parent = files.find(f => f.id === parentId);
// //                 parentId = parent?.parentId;
// //             }
// //         });

// //         setDeletedIds(newDeleted);
// //         setSelectedIds(new Set());
// //     };

// //     const handleEmptyTrash = () => {
// //         setFiles(files.filter(f => !deletedIds.has(f.id)));

// //         const newBookmarked = new Set(bookmarkedIds);
// //         const newDownloaded = new Set(downloadedIds);

// //         deletedIds.forEach(id => {
// //             newBookmarked.delete(id);
// //             newDownloaded.delete(id);
// //         });

// //         setBookmarkedIds(newBookmarked);
// //         setDownloadedIds(newDownloaded);
// //         setDeletedIds(new Set());
// //         setSelectedIds(new Set());
// //     };

// //     const handleDownloadSelected = () => {
// //         if (selectedIds.size === 0) return;
// //         const firstId = Array.from(selectedIds)[0];
// //         const firstItem = files.find(f => f.id === firstId);

// //         let targetName = 'VDR_Secured_Bundle.zip';
// //         if (selectedIds.size === 1 && firstItem) {
// //             targetName = firstItem.name;
// //         } else {
// //             targetName = `VDR_Secured_Bundle_${selectedIds.size}_Files.zip`;
// //         }

// //         setDownloadingFileName(targetName);
// //         setDownloadProgress(0);
// //         setIsDownloadModalOpen(true);

// //         let progress = 0;
// //         const interval = setInterval(() => {
// //             progress += 20;
// //             setDownloadProgress(progress);
// //             if (progress >= 100) {
// //                 clearInterval(interval);

// //                 // Trigger a real cryptographic watermark text file download
// //                 setTimeout(() => {
// //                     const signaturePayload = `========================================================================
// // 🛡️ SECURE VIRTUAL DATA ROOM (VDR) CRYPTOGRAPHIC AUDIT LOCKER
// // ========================================================================
// // Transaction ID  : TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}
// // Seal Timestamp  : ${new Date().toUTCString()}
// // Authorized Agent: Anushiya S.
// // Clearance Level : HIGHLY RESTRICTED (Level-4 Transaction Vault)
// // Enforced Method : AES-256-GCM Hardware Encrypted Payload

// // FILE HIERARCHY VERIFICATION SUMMARY:
// // ====================================
// // ${Array.from(selectedIds).map((id, index) => {
// //                         const item = files.find(f => f.id === id);
// //                         return `[${index + 1}] Index: ${item?.index || '0.0'} | Name: ${item?.name || 'Unknown'} | Security Profile: ${item?.security || 'Encrypted'}`;
// //                     }).join('\n')}

// // ========================================================================
// // WARNING: This data payload has been dynamically watermarked with the IP address and
// // seal-token credentials of the active workstation. Any distribution or security key bypass
// // triggers automated forensic audit logs to systemic operators.
// // ========================================================================
// // INTEGRITY LOCK STATUS: SECURE AND SEALED
// // `;

// //                     const blob = new Blob([signaturePayload], { type: 'text/plain;charset=utf-8' });
// //                     const url = URL.createObjectURL(blob);
// //                     const link = document.createElement('a');
// //                     link.href = url;
// //                     const baseName = targetName.includes('.') ? targetName.substring(0, targetName.lastIndexOf('.')) : targetName;
// //                     link.download = `${baseName}_watermarked.txt`;
// //                     document.body.appendChild(link);
// //                     link.click();
// //                     document.body.removeChild(link);
// //                     URL.revokeObjectURL(url);

// //                     // Close modal after complete and log downloads
// //                     setTimeout(() => {
// //                         const newDownloaded = new Set(downloadedIds);
// //                         selectedIds.forEach(id => {
// //                             newDownloaded.add(id);
// //                         });
// //                         setDownloadedIds(newDownloaded);
// //                         setIsDownloadModalOpen(false);
// //                         setSelectedIds(new Set());
// //                     }, 800);
// //                 }, 300);
// //             }
// //         }, 150);
// //     };

// //     const handleExportSelected = () => {
// //         if (selectedIds.size === 0) return;
// //         const randomHex = Math.random().toString(16).substr(2, 6);
// //         const link = `https://vdr.secure-share.net/d/${randomHex}?expires=${exportExpiresIn}&watermark=${exportWatermarkEnabled}`;
// //         setExportSecureLink(link);
// //         setIsLinkCopied(false);
// //         setIsExportModalOpen(true);
// //     };

// //     // Re-generate link dynamically when options change
// //     useEffect(() => {
// //     if (isExportModalOpen) {
// //         setTimeout(() => {
// //             const randomHex = Math.random().toString(16).substr(2, 6);
// //             const link = `https://vdr.secure-share.net/d/${randomHex}?expires=${exportExpiresIn}&watermark=${exportWatermarkEnabled}`;
// //             setExportSecureLink(link);
// //         }, 0);
// //     }
// // }, [exportExpiresIn, exportWatermarkEnabled, isExportModalOpen]);

// //     const triggerFileSelect = () => {
// //         fileInputRef.current?.click();
// //     };

// //     // const handleFileChange = (e) => {
// //     //     const chosenFiles = Array.from(e.target.files);
// //     //     if (chosenFiles.length === 0) return;

// //     //     const newQueueItems = chosenFiles.map((file, idx) => ({
// //     //         id: `up-${Date.now()}-${idx}`,
// //     //         name: file.name,
// //     //         size: file.size > 1024 * 1024
// //     //             ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
// //     //             : `${(file.size / 1024).toFixed(0)} KB`,
// //     //         progress: 0,
// //     //         status: 'uploading'
// //     //     }));

// //     //     setUploadQueue(newQueueItems);
// //     //     let currentIdx = 0;

// //     //     const uploadNextFile = () => {
// //     //         if (currentIdx >= newQueueItems.length) {
// //     //             setTimeout(() => {
// //     //                 const newFileObjects = newQueueItems.map((item, qIdx) => {
// //     //                     const indexValue = generateNewIndex();
// //     //                     const indexParts = indexValue.split('.');
// //     //                     const lastNum = parseInt(indexParts[indexParts.length - 1]) || 0;
// //     //                     const updatedIndex = [...indexParts.slice(0, -1), lastNum + qIdx].join('.');

// //     //                     return {
// //     //                         id: `file-${Date.now()}-${qIdx}`,
// //     //                         parentId: currentFolderId,
// //     //                         index: updatedIndex,
// //     //                         name: item.name,
// //     //                         type: item.name.split('.').pop().toLowerCase() || 'pdf',
// //     //                         size: item.size,
// //     //                         uploadedBy: 'Anushiya S.',
// //     //                         dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //     //                         security: 'Watermarked'
// //     //                     };
// //     //                 });

// //     //                 setFiles(prev => [...prev, ...newFileObjects]);
// //     //                 setUploadQueue([]);
// //     //                 setIsUploadModalOpen(false);
// //     //             }, 500);
// //     //             return;
// //     //         }

// //     //         let currentProgress = 0;
// //     //         const interval = setInterval(() => {
// //     //             const targetItem = newQueueItems[currentIdx];
// //     //             if (!targetItem) {
// //     //                 clearInterval(interval);
// //     //                 return;
// //     //             }

// //     //             currentProgress += 25;
// //     //             setUploadQueue(prev => prev.map(item => item.id === targetItem.id ? { ...item, progress: currentProgress } : item));

// //     //             if (currentProgress >= 100) {
// //     //                 clearInterval(interval);
// //     //                 setUploadQueue(prev => prev.map(item => item.id === targetItem.id ? { ...item, status: 'completed' } : item));
// //     //                 currentIdx++;
// //     //                 setTimeout(uploadNextFile, 200);
// //     //             }
// //     //         }, 150);
// //     //     };

// //     //     uploadNextFile();
// //     // };

// //     const handleFileChange = async (e) => {
// //         const chosenFiles = Array.from(e.target.files);
// //         if (chosenFiles.length === 0) return;

// //         const newQueueItems = chosenFiles.map((file, idx) => ({
// //             id: `up-${Date.now()}-${idx}`,
// //             name: file.name,
// //             size: file.size > 1024 * 1024
// //                 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
// //                 : `${(file.size / 1024).toFixed(0)} KB`,
// //             progress: 0,
// //             status: 'uploading'
// //         }));

// //         setUploadQueue(newQueueItems);

// //         for (let i = 0; i < chosenFiles.length; i++) {
// //             const file = chosenFiles[i];
// //             const queueItem = newQueueItems[i];

// //             try {
// //                 // Step 1: Read file as ArrayBuffer
// //                 const fileBuffer = await file.arrayBuffer();

// //                 // Step 2: Generate a fresh AES-256-GCM key per file
// //                 const cryptoKey = await window.crypto.subtle.generateKey(
// //                     { name: 'AES-GCM', length: 256 },
// //                     true, // extractable so we can export + store it
// //                     ['encrypt', 'decrypt']
// //                 );

// //                 // Step 3: Encrypt the file bytes
// //                 const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
// //                 const encryptedBuffer = await window.crypto.subtle.encrypt(
// //                     { name: 'AES-GCM', iv },
// //                     cryptoKey,
// //                     fileBuffer
// //                 );

// //                 // Step 4: Export the raw key bytes and encode everything as base64
// //                 const rawKey = await window.crypto.subtle.exportKey('raw', cryptoKey);
// //                 const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
// //                 const ivBase64 = btoa(String.fromCharCode(...iv));
// //                 // Store as "iv:encryptedData" so decryption knows the IV
// //                 const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
// //                 const dekRef = `${ivBase64}:${keyBase64}`; // stored in dek_ref column

// //                 // Step 5: Build the index for this file
// //                 const newIndex = generateNewIndex();

// //                 // Step 6: Insert into Supabase documents table
// //                 const response = await fetch('/api/documents/upload', {
// //                     method: 'POST',
// //                     headers: { 'Content-Type': 'application/json' },
// //                     body: JSON.stringify({
// //                         company_id: '11111111-1111-1111-1111-111111111111', // replace with actual session company_id
// //                         folder_id: currentFolderId,
// //                         uploaded_by: '019c41d0-6ece-4768-8e51-721696a82f9f', // replace with actual session user id
// //                         name: file.name,
// //                         file_data: encryptedBase64,   // the encrypted file bytes as base64
// //                         mime_type: file.type || 'application/octet-stream',
// //                         file_size_bytes: file.size,
// //                         dek_ref: dekRef,              // "iv:key" both base64
// //                         index: newIndex,
// //                         security: 'Encrypted',
// //                         is_deleted: false,
// //                         is_bookmarked: false,
// //                         is_downloaded: false,
// //                         version: 1,
// //                     })
// //                 });

// //                 if (!response.ok) {
// //                     const errorData = await response.json();
// //                     throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
// //                 }
// //                 const { id: docId } = await response.json();

// //                 // Step 7: Update progress to 100 and mark complete
// //                 setUploadQueue(prev => prev.map(item =>
// //                     item.id === queueItem.id ? { ...item, progress: 100, status: 'completed' } : item
// //                 ));

// //                 // Step 8: Add to local React state for immediate UI update
// //                 setFiles(prev => [...prev, {
// //                     id: docId,
// //                     parentId: currentFolderId,
// //                     index: newIndex,
// //                     name: file.name,
// //                     type: file.name.split('.').pop().toLowerCase() || 'pdf',
// //                     size: queueItem.size,
// //                     uploadedBy: 'Anushiya S.', // replace with session user name
// //                     dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //                     security: 'Encrypted'
// //                 }]);

// //             } catch (err) {
// //                 console.error('Encryption/upload failed for', file.name, err);
// //                 setUploadQueue(prev => prev.map(item =>
// //                     item.id === queueItem.id ? { ...item, status: 'error' } : item
// //                 ));
// //             }
// //         }

// //         setTimeout(() => {
// //             setUploadQueue([]);
// //             setIsUploadModalOpen(false);
// //         }, 800);
// //     };

// //     const handleNewQuestionSubmit = (e) => {
// //         e.preventDefault();
// //         if (!newQuestionSubject.trim() || !newQuestionText.trim()) return;

// //         const newThread = {
// //             id: `thread-${Date.now()}`,
// //             fileId: selectedFile?.id || null,
// //             subject: newQuestionSubject,
// //             category: newQuestionCategory,
// //             priority: newQuestionPriority,
// //             status: 'Open',
// //             dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
// //             messages: [{ sender: 'You', text: newQuestionText, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), isUser: true }]
// //         };

// //         setQnaThreads([newThread, ...qnaThreads]);
// //         setSelectedThreadId(newThread.id);
// //         setNewQuestionSubject('');
// //         setNewQuestionText('');
// //         setIsNewQuestionOpen(false);

// //         setIsAdminTyping(true);
// //         setTimeout(() => {
// //             setIsAdminTyping(false);
// //             setQnaThreads(prev => prev.map(t => {
// //                 if (t.id === newThread.id) {
// //                     return {
// //                         ...t,
// //                         status: 'Answered',
// //                         messages: [...t.messages, { sender: 'VDR Administrator', text: `Thank you for submitting query "${newQuestionSubject}". Our administrators have audited the records and confirmed the request. You can now securely proceed.`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), isUser: false }]
// //                     };
// //                 }
// //                 return t;
// //             }));
// //         }, 2000);
// //     };

// //     const handleChatReplySubmit = (e) => {
// //         e.preventDefault();
// //         if (!qnaChatInput.trim() || !selectedThreadId) return;

// //         const replyMsg = { sender: 'You', text: qnaChatInput, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), isUser: true };
// //         setQnaThreads(prev => prev.map(t => t.id === selectedThreadId ? { ...t, status: 'Open', messages: [...t.messages, replyMsg] } : t));
// //         setQnaChatInput('');

// //         setIsAdminTyping(true);
// //         setTimeout(() => {
// //             setIsAdminTyping(false);
// //             const replies = [
// //                 "Dynamic decryption has confirmed your level clearance. Access remains granted.",
// //                 "Understood. Static watermarked bundles are ready for online audit.",
// //                 "Your request is noted and logged in our M&A transactional pipeline."
// //             ];
// //             const randomReply = replies[Math.floor(Math.random() * replies.length)];
// //             setQnaThreads(prev => prev.map(t => t.id === selectedThreadId ? { ...t, status: 'Answered', messages: [...t.messages, { sender: 'VDR Administrator', text: randomReply, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), isUser: false }] } : t));
// //         }, 1500);
// //     };

// //     // Uniform, premium file type icons (Muted pastel outlines, highly detailed)
// //     const renderFileIcon = (type) => {
// //         switch (type) {
// //             case 'folder':
// //                 return (
// //                     <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-sm text-slate-600 group-hover:scale-105 group-hover:bg-slate-100 transition-all duration-300">
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
// //                             <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
// //                         </svg>
// //                     </div>
// //                 );
// //             case 'pdf':
// //                 return (
// //                     <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 shadow-sm text-rose-600/90 font-extrabold text-[9px] tracking-tight group-hover:scale-105 transition-transform duration-300">
// //                         PDF
// //                     </div>
// //                 );
// //             case 'xlsx':
// //                 return (
// //                     <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm text-emerald-600/90 font-extrabold text-[8.5px] tracking-tight group-hover:scale-105 transition-transform duration-300">
// //                         XLS
// //                     </div>
// //                 );
// //             case 'docx':
// //                 return (
// //                     <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm text-indigo-600/90 font-extrabold text-[8.5px] tracking-tight group-hover:scale-105 transition-transform duration-300">
// //                         DOC
// //                     </div>
// //                 );
// //             case 'image':
// //             case 'png':
// //             case 'jpg':
// //             case 'jpeg':
// //                 return (
// //                     <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 shadow-sm text-amber-600/90 font-extrabold text-[8.5px] tracking-tight group-hover:scale-105 transition-transform duration-300">
// //                         IMG
// //                     </div>
// //                 );
// //             default:
// //                 return (
// //                     <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-sm text-slate-500 font-extrabold text-[8.5px] tracking-tight group-hover:scale-105 transition-transform duration-300">
// //                         {type?.toUpperCase() || 'FILE'}
// //                     </div>
// //                 );
// //         }
// //     };

// //     // High-fidelity custom clearance badges with miniature vector indicators
// //     const renderClearanceTag = (security) => {
// //         switch (security) {
// //             case 'Restricted':
// //                 return (
// //                     <span className="text-[10px] font-bold px-2.5 py-0.75 bg-rose-50/40 text-rose-700 border border-rose-200/70 rounded-full inline-flex items-center gap-1.5 select-none transition-all duration-300">
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
// //                         Restricted
// //                     </span>
// //                 );
// //             case 'Encrypted':
// //                 return (
// //                     <span className="text-[10px] font-bold px-2.5 py-0.75 bg-emerald-50/40 text-emerald-700 border border-emerald-200/70 rounded-full inline-flex items-center gap-1.5 select-none transition-all duration-300">
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
// //                         Encrypted
// //                     </span>
// //                 );
// //             case 'Highly Secure':
// //                 return (
// //                     <span className="text-[10px] font-bold px-2.5 py-0.75 bg-indigo-50/40 text-indigo-700 border border-indigo-200/70 rounded-full inline-flex items-center gap-1.5 select-none transition-all duration-300">
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><circle cx="12" cy="12" r="3" /></svg>
// //                         Highly Secure
// //                     </span>
// //                 );
// //             case 'Watermarked':
// //                 return (
// //                     <span className="text-[10px] font-bold px-2.5 py-0.75 bg-amber-50/40 text-amber-600 border border-amber-200/70 rounded-full inline-flex items-center gap-1.5 select-none transition-all duration-300">
// //                         <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0Z" /><path d="M12 8v4l3 3" /></svg>
// //                         Watermarked
// //                     </span>
// //                 );
// //             default:
// //                 return (
// //                     <span className="text-[10px] font-bold px-2.5 py-0.75 bg-slate-50 text-slate-500 border border-slate-200 rounded-full inline-flex items-center gap-1.5 select-none">
// //                         {security}
// //                     </span>
// //                 );
// //         }
// //     };

// //     return (
// //         <div className="relative flex w-full h-full bg-[#FAFBFD] overflow-hidden text-slate-800 font-sans">

// //             {/* Hidden file input */}
// //             <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

// //             {/* Main Files Work Area */}
// //             <div className="flex-1 flex flex-col h-full min-w-0 p-6 md:p-8 overflow-hidden relative">

// //                 {/* Breadcrumb or View Header */}
// //                 {currentView === 'files' || currentView === 'upload' ? (
// //                     <div className="flex items-center justify-between mb-5 select-none w-full gap-4">
// //                         <div className="flex items-center gap-2 text-[15px] text-black font-bold uppercase">
// //                             Files Management
// //                             {breadcrumbPath.map((item, idx) => {
// //                                 const isLast = idx === breadcrumbPath.length - 1;
// //                                 return (
// //                                     <span key={item.id} className="flex items-center gap-2">
// //                                         <span
// //                                             onClick={() => !isLast && setCurrentFolderId(item.id)}
// //                                             className={`transition-colors duration-200 ${isLast
// //                                                 ? 'text-slate-800 font-black'
// //                                                 : 'hover:text-slate-800 hover:underline cursor-pointer'
// //                                                 }`}
// //                                         >
// //                                             {item.name}
// //                                         </span>
// //                                         {!isLast && <span className="text-slate-300">/</span>}
// //                                     </span>
// //                                 );
// //                             })}
// //                         </div>

// //                         {/* Expander Button */}
// //                         <button
// //                             onClick={() => {
// //                                 setIsRightPaneOpen(!isRightPaneOpen);
// //                                 if (!isRightPaneOpen) {
// //                                     setIsQnaExpanded(true);
// //                                 }
// //                             }}
// //                             className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[11.5px] font-bold rounded-xl shadow-sm transition-all duration-300 active:scale-[0.98] select-none cursor-pointer"
// //                         >
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-300 ${isRightPaneOpen ? 'rotate-180' : ''}`}>
// //                                 <polyline points="15 18 9 12 15 6" />
// //                             </svg>
// //                             {isRightPaneOpen ? 'Hide QnA' : 'Show QnA Portal'}
// //                         </button>
// //                     </div>
// //                 ) : (
// //                     <div className="flex items-center justify-between mb-5 select-none w-full gap-4">
// //                         <div className="flex items-center gap-2.5 text-[14px] font-black text-slate-900 tracking-tight uppercase">
// //                             {currentView === 'bookmarks' && (
// //                                 <>
// //                                     <svg className="text-amber-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
// //                                     <span>Bookmarks</span>
// //                                 </>
// //                             )}
// //                             {currentView === 'recent' && (
// //                                 <>
// //                                     <svg className="text-slate-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
// //                                     <span>Recent Documents</span>
// //                                 </>
// //                             )}
// //                             {currentView === 'downloads' && (
// //                                 <>
// //                                     <svg className="text-slate-655" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
// //                                     <span>Download History</span>
// //                                 </>
// //                             )}
// //                             {currentView === 'trash' && (
// //                                 <>
// //                                     <svg className="text-rose-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
// //                                     <span className="text-rose-600">Secure Trash Vault</span>
// //                                 </>
// //                             )}
// //                         </div>

// //                         {/* Expander Button */}
// //                         <button
// //                             onClick={() => {
// //                                 setIsRightPaneOpen(!isRightPaneOpen);
// //                                 if (!isRightPaneOpen) {
// //                                     setIsQnaExpanded(true);
// //                                 }
// //                             }}
// //                             className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[11.5px] font-bold rounded-xl shadow-sm transition-all duration-300 active:scale-[0.98] select-none cursor-pointer"
// //                         >
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-300 ${isRightPaneOpen ? 'rotate-180' : ''}`}>
// //                                 <polyline points="15 18 9 12 15 6" />
// //                             </svg>
// //                             {isRightPaneOpen ? 'Hide QnA' : 'Show QnA Portal'}
// //                         </button>
// //                     </div>
// //                 )}

// //                 {/* Professional Permanent Standard Toolbar (Always visible, disabled when no selections) */}
// //                 <div className="flex flex-col gap-4 pb-5 select-none">
// //                     <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 bg-white border border-slate-200/60 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.015)]">

// //                         {/* Action Bar (Upload, Folder, Download, Export, Delete, More) */}
// //                         <div className="flex items-center flex-wrap gap-2.5">
// //                             {currentView === 'trash' ? (
// //                                 <>
// //                                     {/* Restore Selection */}
// //                                     <button
// //                                         onClick={handleRestoreSelected}
// //                                         disabled={selectedIds.size === 0}
// //                                         className={`flex items-center gap-2 px-4 py-2.5 border text-[12.5px] font-bold rounded-xl transition-all duration-300 ${selectedIds.size > 0
// //                                             ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
// //                                             : 'bg-slate-50/50 border-slate-100 text-slate-350 cursor-not-allowed opacity-60'
// //                                             }`}
// //                                     >
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
// //                                         Restore Selection
// //                                     </button>

// //                                     {/* Delete Permanently */}
// //                                     <button
// //                                         onClick={handleDeleteSelected}
// //                                         disabled={selectedIds.size === 0}
// //                                         className={`flex items-center gap-2 px-4 py-2.5 border text-[12.5px] font-bold rounded-xl transition-all duration-300 ${selectedIds.size > 0
// //                                             ? 'bg-rose-50/60 border-rose-100 text-rose-600 hover:bg-rose-100/60 shadow-sm cursor-pointer'
// //                                             : 'bg-slate-50/50 border-slate-100 text-slate-350 cursor-not-allowed opacity-60'
// //                                             }`}
// //                                     >
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
// //                                         Delete Permanently
// //                                     </button>

// //                                     <div className="w-[1px] h-5 bg-slate-200 mx-1"></div>

// //                                     {/* Empty Trash */}
// //                                     <button
// //                                         onClick={handleEmptyTrash}
// //                                         disabled={deletedIds.size === 0}
// //                                         className={`flex items-center gap-2 px-4 py-2.5 border text-[12.5px] font-bold rounded-xl transition-all duration-300 ${deletedIds.size > 0
// //                                             ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer'
// //                                             : 'bg-slate-50/50 border-slate-100 text-slate-355 cursor-not-allowed opacity-60'
// //                                             }`}
// //                                     >
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
// //                                         Empty Trash
// //                                     </button>
// //                                 </>
// //                             ) : (
// //                                 <>
// //                                     {/* Upload - Always Active */}
// //                                     <button
// //                                         onClick={() => setIsUploadModalOpen(true)}
// //                                         className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[12.5px] font-bold rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
// //                                     >
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
// //                                         Upload
// //                                     </button>

// //                                     {/* Add Folder - Always Active */}
// //                                     <button
// //                                         onClick={() => setIsNewFolderOpen(true)}
// //                                         className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-[12.5px] font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
// //                                     >
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-500"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
// //                                         Add Folder
// //                                     </button>

// //                                     <div className="w-[1px] h-5 bg-slate-200 mx-1"></div>

// //                                     {/* Download - Conditional styling (Disabled state when no selections) */}
// //                                     <button
// //                                         onClick={handleDownloadSelected}
// //                                         disabled={selectedIds.size === 0}
// //                                         className={`flex items-center gap-2 px-4 py-2.5 border text-[12.5px] font-bold rounded-xl transition-all duration-300 ${selectedIds.size > 0
// //                                             ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer'
// //                                             : 'bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed opacity-60'
// //                                             }`}
// //                                     >
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" /></svg>
// //                                         Download
// //                                     </button>

// //                                     {/* Export - Conditional styling */}
// //                                     <button
// //                                         onClick={handleExportSelected}
// //                                         disabled={selectedIds.size === 0}
// //                                         className={`flex items-center gap-2 px-4 py-2.5 border text-[12.5px] font-bold rounded-xl transition-all duration-300 ${selectedIds.size > 0
// //                                             ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer'
// //                                             : 'bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed opacity-60'
// //                                             }`}
// //                                     >
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
// //                                         Export
// //                                     </button>

// //                                     {/* Delete - Conditional styling */}
// //                                     <button
// //                                         onClick={handleDeleteSelected}
// //                                         disabled={selectedIds.size === 0}
// //                                         className={`flex items-center gap-2 px-4 py-2.5 border text-[12.5px] font-bold rounded-xl transition-all duration-300 ${selectedIds.size > 0
// //                                             ? 'bg-rose-50/60 border-rose-100 text-rose-600 hover:bg-rose-100/60 shadow-sm cursor-pointer'
// //                                             : 'bg-slate-50/50 border-slate-100 text-slate-355 cursor-not-allowed opacity-60'
// //                                             }`}
// //                                     >
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
// //                                         Delete
// //                                     </button>

// //                                     {/* More Operations Menu */}
// //                                     <button
// //                                         onClick={() => { if (selectedIds.size > 0) alert('Additional options loaded.'); }}
// //                                         disabled={selectedIds.size === 0}
// //                                         className={`flex items-center justify-center w-9 h-9 border rounded-xl transition-all duration-300 ${selectedIds.size > 0
// //                                             ? 'bg-white border-slate-300 text-slate-655 hover:bg-slate-50 shadow-sm cursor-pointer'
// //                                             : 'bg-slate-50/50 border-slate-100 text-slate-355 cursor-not-allowed opacity-60'
// //                                             }`}
// //                                     >
// //                                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
// //                                     </button>
// //                                 </>
// //                             )}
// //                         </div>

// //                         {/* Quick Filters */}
// //                         <div className="flex items-center gap-3 w-full xl:w-auto">
// //                             <select
// //                                 value={activeTypeFilter}
// //                                 onChange={(e) => setActiveTypeFilter(e.target.value)}
// //                                 className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[12.5px] font-bold text-slate-600 focus:outline-none focus:border-slate-400 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
// //                             >
// //                                 <option value="all">All Formats</option>
// //                                 <option value="folder">Folders</option>
// //                                 <option value="document">Files</option>
// //                             </select>

// //                             <div className="relative flex-1 xl:w-56 xl:flex-initial">
// //                                 <input
// //                                     type="text"
// //                                     placeholder="Filter vault..."
// //                                     value={searchQuery}
// //                                     onChange={(e) => setSearchQuery(e.target.value)}
// //                                     className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[12.5px] font-medium focus:outline-none focus:border-slate-400 transition-all placeholder-slate-400 shadow-sm"
// //                                 />
// //                                 <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
// //                             </div>
// //                         </div>

// //                     </div>
// //                 </div>

// //                 {/* Inline Create Folder Form */}
// //                 {isNewFolderOpen && (
// //                     <form
// //                         onSubmit={handleCreateFolderSubmit}
// //                         className="flex items-center gap-3 p-4 bg-slate-50/80 border border-slate-200/80 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2 duration-300"
// //                     >
// //                         <div className="text-slate-400 shrink-0">
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
// //                         </div>
// //                         <input
// //                             type="text"
// //                             placeholder="Enter folder name..."
// //                             value={newFolderName}
// //                             onChange={(e) => setNewFolderName(e.target.value)}
// //                             className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all shadow-inner"
// //                             autoFocus
// //                         />
// //                         <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[12.5px] font-bold rounded-xl transition-colors shadow-sm">
// //                             Create
// //                         </button>
// //                         <button type="button" onClick={() => { setIsNewFolderOpen(false); setNewFolderName(''); }} className="px-3.5 py-2 bg-white border border-slate-200 text-slate-500 text-[12.5px] font-bold rounded-xl hover:bg-slate-50 transition-colors">
// //                             Cancel
// //                         </button>
// //                     </form>
// //                 )}

// //                 {/* High-Fidelity Professional Table */}
// //                 <div className="flex-1 overflow-auto mt-2 rounded-lg border border-slate-200 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.015)]">
// //                     <table className="w-full min-w-[800px] border-collapse text-left text-[13px]">
// //                         <thead>
// //                             <tr className="border-b border-slate-200 bg-slate-50/50 select-none text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest">
// //                                 <th className="py-4 px-5 w-10">
// //                                     <div className="flex items-center">
// //                                         <input
// //                                             type="checkbox"
// //                                             checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
// //                                             onChange={handleSelectAll}
// //                                             className="w-4.5 h-4.5 rounded-md border-slate-300 text-slate-900 focus:ring-slate-500/25 cursor-pointer accent-slate-800 transition-all"
// //                                         />
// //                                     </div>
// //                                 </th>
// //                                 <th className="py-4 px-3 w-16 text-center">Index</th>
// //                                 <th className="py-4 px-3">Name</th>
// //                                 <th className="py-4 px-3 w-28 text-center">Size</th>
// //                                 <th className="py-4 px-3 w-36">Uploaded By</th>
// //                                 <th className="py-4 px-3 w-32">Date Sealed</th>
// //                                 <th className="py-4 px-3 w-32 text-center">Clearance</th>
// //                             </tr>
// //                         </thead>
// //                         <tbody className="divide-y divide-slate-100">
// //                             {filteredItems.length === 0 ? (
// //                                 <tr>
// //                                     <td colSpan="7" className="py-28 text-center">
// //                                         <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
// //                                             <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/60 shadow-inner">
// //                                                 {currentView === 'bookmarks' ? (
// //                                                     <svg className="text-amber-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
// //                                                 ) : currentView === 'trash' ? (
// //                                                     <svg className="text-rose-455" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
// //                                                 ) : currentView === 'downloads' ? (
// //                                                     <svg className="text-slate-555" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /></svg>
// //                                                 ) : (
// //                                                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-350"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
// //                                                 )}
// //                                             </div>
// //                                             <div>
// //                                                 <span className="font-extrabold text-[14px] text-slate-700 block">
// //                                                     {currentView === 'bookmarks' ? 'No bookmarked items'
// //                                                         : currentView === 'trash' ? 'Trash vault is empty'
// //                                                             : currentView === 'downloads' ? 'No download history'
// //                                                                 : 'No files match your query'}
// //                                                 </span>
// //                                                 <p className="text-[12px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
// //                                                     {currentView === 'bookmarks' ? 'Star files or folders to add them here for quick access.'
// //                                                         : currentView === 'trash' ? 'Items you delete will be moved here and kept securely in the trash.'
// //                                                             : currentView === 'downloads' ? 'Downloaded packages and cryptographic seal lockers will be logged here.'
// //                                                                 : 'Try adjusting or removing your filter keyword in the directory search input.'}
// //                                                 </p>
// //                                             </div>
// //                                         </div>
// //                                     </td>
// //                                 </tr>
// //                             ) : (
// //                                 filteredItems.map((item) => {
// //                                     const isChecked = selectedIds.has(item.id);
// //                                     return (
// //                                         <tr
// //                                             key={item.id}
// //                                             onClick={() => handleItemClick(item)}
// //                                             className={`group hover:bg-[#FAFBFD] cursor-pointer transition-all duration-300 relative ${isChecked
// //                                                 ? 'bg-[#F1F5F9]/30 border-l-[3.5px] border-slate-900'
// //                                                 : 'border-l-[3.5px] border-transparent'
// //                                                 }`}
// //                                         >
// //                                             {/* Checkbox */}
// //                                             <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
// //                                                 <div className="flex items-center">
// //                                                     <input
// //                                                         type="checkbox"
// //                                                         checked={isChecked}
// //                                                         onChange={(e) => handleToggleSelect(item.id, e)}
// //                                                         className="w-4.5 h-4.5 rounded-md border-slate-300 text-slate-900 focus:ring-slate-500/25 cursor-pointer accent-slate-800 transition-all"
// //                                                     />
// //                                                 </div>
// //                                             </td>

// //                                             {/* Index Hierarchy */}
// //                                             <td className="py-4 px-3 text-center font-mono text-[12px] font-semibold text-slate-400 group-hover:text-slate-900 transition-colors">
// //                                                 {item.index}
// //                                             </td>

// //                                             {/* Name */}
// //                                             <td className="py-4 px-3">
// //                                                 <div className="flex items-center gap-3">
// //                                                     {renderFileIcon(item.type)}

// //                                                     {/* Bookmark star icon button (Only show for active files, not deleted ones in Trash) */}
// //                                                     {currentView !== 'trash' && (
// //                                                         <button
// //                                                             onClick={(e) => handleToggleBookmark(item.id, e)}
// //                                                             className="text-slate-300 hover:text-amber-500 transition-colors mr-1 shrink-0"
// //                                                             title={bookmarkedIds.has(item.id) ? "Remove Bookmark" : "Add Bookmark"}
// //                                                         >
// //                                                             {bookmarkedIds.has(item.id) ? (
// //                                                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
// //                                                             ) : (
// //                                                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
// //                                                             )}
// //                                                         </button>
// //                                                     )}

// //                                                     <div className="flex flex-col truncate">
// //                                                         <span className="font-semibold text-slate-700 truncate max-w-xs sm:max-w-md group-hover:text-slate-950 group-hover:underline decoration-slate-300 transition-all duration-200">
// //                                                             {item.name}
// //                                                         </span>
// //                                                         {/* In flat lists, show parent folder path if inside a folder */}
// //                                                         {currentView !== 'files' && item.parentId && (
// //                                                             <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
// //                                                                 in {files.find(f => f.id === item.parentId)?.name || 'Folder'}
// //                                                             </span>
// //                                                         )}
// //                                                     </div>
// //                                                 </div>
// //                                             </td>

// //                                             {/* Size */}
// //                                             <td className="py-4 px-3 text-center font-medium text-slate-500">
// //                                                 {item.size}
// //                                             </td>

// //                                             {/* Uploaded By */}
// //                                             <td className="py-4 px-3">
// //                                                 <div className="flex items-center gap-2">
// //                                                     <div className="w-5.5 h-5.5 rounded-full bg-slate-100 flex items-center justify-center text-[9.5px] font-extrabold text-slate-500 border border-slate-200">
// //                                                         {item.uploadedBy.slice(0, 2).toUpperCase()}
// //                                                     </div>
// //                                                     <span className="font-semibold text-slate-600 truncate">{item.uploadedBy}</span>
// //                                                 </div>
// //                                             </td>

// //                                             {/* Date Created */}
// //                                             <td className="py-4 px-3 text-slate-400 font-bold text-[12px]">
// //                                                 {item.dateCreated}
// //                                             </td>

// //                                             {/* Security Clearance (Muted Luxury Badges) */}
// //                                             <td className="py-4 px-3 text-center">
// //                                                 {renderClearanceTag(item.security)}
// //                                             </td>

// //                                         </tr>
// //                                     );
// //                                 })
// //                             )}
// //                         </tbody>
// //                     </table>
// //                 </div>

// //             </div>

// //             {/* Right Side Pane: QnA Panel */}
// //             <aside className={`border-l border-slate-200/60 bg-white h-full hidden lg:flex flex-col select-none shadow-[-5px_0_20px_rgba(0,0,0,0.005)] transition-all duration-300 ${isRightPaneOpen ? 'w-[380px]' : 'w-0 !border-l-0 overflow-hidden'}`}>
// //                 <div className="w-[380px] h-full flex flex-col shrink-0 overflow-hidden">
// //                     {/* Header */}
// //                     <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
// //                         <div className="flex items-center gap-2 font-bold text-[12px] uppercase tracking-wider text-slate-700 min-w-0 flex-1">
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-500 shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
// //                             <span className="truncate">QnA Portal</span>
// //                         </div>
// //                     </div>

// //                     {/* Content */}
// //                     <div className="flex-1 overflow-hidden p-5 flex flex-col">
// //                         {selectedFile === null ? (
// //                             /* Unselected File Fallback */
// //                             <div className="flex flex-col items-center justify-center text-center h-full px-4 select-none my-auto">
// //                                 <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-5 shadow-sm">
// //                                     <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
// //                                         <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
// //                                         <path d="M8 10h8" />
// //                                         <path d="M8 14h6" />
// //                                     </svg>
// //                                 </div>
// //                                 <h4 className="font-extrabold text-[14px] text-slate-800 tracking-tight">Dedicated File Q&A</h4>
// //                                 <p className="text-[12px] text-slate-400 font-semibold leading-relaxed mt-2 max-w-[260px]">
// //                                     Select any file from the vault to view or ask questions in its dedicated Q&A portal.
// //                                 </p>
// //                             </div>
// //                         ) : selectedThreadId === null ? (
// //                             /* Ticket List for the Selected File */
// //                             <div className="flex flex-col h-full space-y-4 overflow-hidden">
// //                                 <div className="flex items-center justify-between shrink-0">
// //                                     <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">QnA Queries board</span>
// //                                     <button
// //                                         onClick={() => setIsNewQuestionOpen(true)}
// //                                         className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10.5px] font-bold rounded-lg transition-colors duration-200 cursor-pointer"
// //                                     >
// //                                         + Ask Query
// //                                     </button>
// //                                 </div>

// //                                 {isNewQuestionOpen ? (
// //                                     /* Submission Form */
// //                                     <form onSubmit={handleNewQuestionSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 animate-in fade-in duration-300 overflow-y-auto max-h-full">
// //                                         <h5 className="font-bold text-[11px] text-slate-800 uppercase tracking-wider">New Query Submission</h5>
// //                                         <input
// //                                             type="text"
// //                                             placeholder="Subject..."
// //                                             value={newQuestionSubject}
// //                                             onChange={(e) => setNewQuestionSubject(e.target.value)}
// //                                             className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-slate-450 font-bold"
// //                                             required
// //                                         />

// //                                         <div className="flex gap-2">
// //                                             <select
// //                                                 value={newQuestionCategory}
// //                                                 onChange={(e) => setNewQuestionCategory(e.target.value)}
// //                                                 className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11.5px] font-bold focus:outline-none cursor-pointer"
// //                                             >
// //                                                 <option value="Legal">Legal</option>
// //                                                 <option value="Financial">Financial</option>
// //                                             </select>
// //                                             <select
// //                                                 value={newQuestionPriority}
// //                                                 onChange={(e) => setNewQuestionPriority(e.target.value)}
// //                                                 className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11.5px] font-bold focus:outline-none cursor-pointer"
// //                                             >
// //                                                 <option value="HIGH">High</option>
// //                                                 <option value="MEDIUM">Medium</option>
// //                                             </select>
// //                                         </div>

// //                                         <textarea
// //                                             placeholder="Details..."
// //                                             rows="3"
// //                                             value={newQuestionText}
// //                                             onChange={(e) => setNewQuestionText(e.target.value)}
// //                                             className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-slate-400"
// //                                             required
// //                                         ></textarea>

// //                                         <div className="flex justify-end gap-2 pt-1">
// //                                             <button type="button" onClick={() => setIsNewQuestionOpen(false)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 text-[11px] font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
// //                                             <button type="submit" className="px-3.5 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">Submit</button>
// //                                         </div>
// //                                     </form>
// //                                 ) : (
// //                                     <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
// //                                         {filteredQnaThreads.length === 0 ? (
// //                                             <div className="flex flex-col items-center justify-center text-center py-12 px-4 select-none my-auto">
// //                                                 <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3.5 shadow-sm">
// //                                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
// //                                                 </div>
// //                                                 <span className="font-bold text-[12.5px] text-slate-700 block">No active threads</span>
// //                                                 <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] font-medium leading-relaxed">
// //                                                     Ask a query to start an administrative Q&A thread for this file.
// //                                                 </p>
// //                                             </div>
// //                                         ) : (
// //                                             filteredQnaThreads.map(thread => (
// //                                                 <div
// //                                                     key={thread.id}
// //                                                     onClick={() => setSelectedThreadId(thread.id)}
// //                                                     className="p-3.5 bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm rounded-xl cursor-pointer transition-all duration-300 space-y-1.5 group"
// //                                                 >
// //                                                     <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-wider">
// //                                                         <span>{thread.category}</span>
// //                                                         <span className="text-[8.5px] border border-slate-200 px-1.5 rounded">{thread.priority}</span>
// //                                                     </div>
// //                                                     <h5 className="font-bold text-[12px] text-slate-700 group-hover:text-slate-950 truncate transition-colors">
// //                                                         {thread.subject}
// //                                                     </h5>
// //                                                     <div className="flex justify-between items-center text-[9.5px] font-bold text-slate-400 pt-1.5 border-t border-slate-100">
// //                                                         <span>{thread.dateCreated}</span>
// //                                                         <span className="text-slate-600 font-extrabold uppercase">{thread.status}</span>
// //                                                     </div>
// //                                                 </div>
// //                                             ))
// //                                         )}
// //                                     </div>
// //                                 )}

// //                             </div>
// //                         ) : (
// //                             /* Thread Conversation Chat */
// //                             <div className="flex flex-col h-full overflow-hidden select-text">
// //                                 <button
// //                                     onClick={() => setSelectedThreadId(null)}
// //                                     className="flex items-center gap-1.5 text-[9.5px] font-black text-slate-400 hover:text-slate-800 transition-colors mb-3.5 select-none uppercase tracking-wider cursor-pointer"
// //                                 >
// //                                     ← Back to boards
// //                                 </button>

// //                                 <div className="border-b border-slate-100 pb-2.5 mb-3 shrink-0">
// //                                     <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase block mb-1">Ticket Subject</span>
// //                                     <h5 className="font-bold text-[12px] text-slate-800 leading-snug truncate">{activeThread?.subject}</h5>
// //                                 </div>

// //                                 <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0">
// //                                     {activeThread?.messages.map((msg, idx) => (
// //                                         <div key={idx} className={`flex flex-col max-w-[85%] ${msg.isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
// //                                             <span className="text-[9px] font-black text-slate-400 mb-1 px-1">{msg.sender} • {msg.time}</span>
// //                                             <div className={`p-2.5 rounded-lg text-[12px] font-medium leading-relaxed shadow-sm ${msg.isUser
// //                                                 ? 'bg-slate-900 text-white rounded-tr-none'
// //                                                 : 'bg-slate-50 text-slate-700 border border-slate-200/80 rounded-tl-none'
// //                                                 }`}>
// //                                                 {msg.text}
// //                                             </div>
// //                                         </div>
// //                                     ))}
// //                                     {isAdminTyping && (
// //                                         <div className="flex flex-col max-w-[80%] mr-auto items-start animate-pulse">
// //                                             <span className="text-[9px] font-bold text-slate-400 mb-1 px-1">Typing...</span>
// //                                             <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg rounded-tl-none flex items-center gap-1.5">
// //                                                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
// //                                                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
// //                                             </div>
// //                                         </div>
// //                                     )}
// //                                     <div ref={qnaEndRef} />
// //                                 </div>

// //                                 <form onSubmit={handleChatReplySubmit} className="border-t border-slate-100 pt-3 mt-3 select-none shrink-0">
// //                                     <div className="relative">
// //                                         <input
// //                                             type="text"
// //                                             value={qnaChatInput}
// //                                             onChange={(e) => setQnaChatInput(e.target.value)}
// //                                             placeholder="Reply to secure thread..."
// //                                             className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-semibold focus:outline-none focus:bg-white focus:border-slate-400 transition-all placeholder-slate-400 shadow-inner"
// //                                         />
// //                                         <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center shadow transition-colors cursor-pointer">
// //                                             →
// //                                         </button>
// //                                     </div>
// //                                 </form>
// //                             </div>
// //                         )}
// //                     </div>

// //                 </div>
// //             </aside>

// //             {/* Premium Glassmorphic Upload Modal */}
// //             {isUploadModalOpen && (
// //                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

// //                     <div onClick={() => { if (uploadQueue.length === 0) setIsUploadModalOpen(false); }} className="absolute inset-0 bg-slate-900/50 -[2px] animate-in fade-in duration-300"></div>

// //                     <div className="relative bg-white/95 rounded-xl border border-slate-200/80 shadow-md w-full max-w-3xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">

// //                         <button onClick={() => { if (uploadQueue.length === 0) setIsUploadModalOpen(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors z-10" disabled={uploadQueue.length > 0}>
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
// //                         </button>

// //                         {/* Left side actions */}
// //                         <div className="flex-1 p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100">
// //                             <h3 className="text-[17px] font-extrabold text-slate-850 mb-6">Secure Upload Center</h3>

// //                             {uploadQueue.length > 0 ? (
// //                                 /* Upload Queue */
// //                                 <div className="space-y-4">
// //                                     <h4 className="text-[11.5px] font-black text-slate-400 uppercase tracking-widest">Uploading queue ({uploadQueue.length} files)</h4>
// //                                     <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
// //                                         {uploadQueue.map(item => (
// //                                             <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
// //                                                 <div className="flex items-center gap-3 truncate">
// //                                                     <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
// //                                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
// //                                                     </div>
// //                                                     <div className="truncate">
// //                                                         <span className="font-bold text-[12.5px] text-slate-800 truncate block">{item.name}</span>
// //                                                         <span className="text-[10px] text-slate-400 font-black block mt-0.5">{item.size} • {item.progress}% sealed</span>
// //                                                     </div>
// //                                                 </div>
// //                                                 <div className="shrink-0 flex items-center gap-3">
// //                                                     {item.status === 'completed' ? (
// //                                                         <span className="w-5.5 h-5.5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md text-[10px] font-bold">✓</span>
// //                                                     ) : (
// //                                                         <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
// //                                                     )}
// //                                                 </div>
// //                                             </div>
// //                                         ))}
// //                                     </div>
// //                                 </div>
// //                             ) : (
// //                                 /* Drag Zone */
// //                                 <div className="space-y-4">
// //                                     <div onClick={triggerFileSelect} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/30 rounded-lg cursor-pointer transition-all duration-300 group">
// //                                         <div className="w-12 h-12 bg-white shadow border border-slate-200/80 text-slate-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
// //                                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
// //                                         </div>
// //                                         <span className="font-extrabold text-[14px] text-slate-800">Secure Upload Package</span>
// //                                         <p className="text-[11.5px] text-slate-400 mt-1 select-none">Click to browse your local workstation</p>
// //                                     </div>

// //                                     <div className="grid grid-cols-2 gap-3 select-none">
// //                                         <button onClick={triggerFileSelect} className="py-2.5 px-4 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-[12.5px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200">Select Files</button>
// //                                         <button onClick={triggerFileSelect} className="py-2.5 px-4 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-[12.5px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200">Select Folder</button>
// //                                     </div>
// //                                 </div>
// //                             )}
// //                         </div>

// //                         {/* Right side info (Exactly matching user's requested extensions and headings) */}
// //                         <div className="w-full md:w-80 p-6 md:p-8 bg-slate-50 flex flex-col justify-between select-none">
// //                             <div>
// //                                 <h3 className="text-[22px] font-bold text-slate-850 tracking-tight mb-6">
// //                                     Important
// //                                 </h3>
// //                                 <div className="space-y-5 text-[12px] leading-relaxed text-slate-600">
// //                                     <div>
// //                                         <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Note</span>
// //                                         <p className="text-slate-700 mt-1 font-bold">File name must not include any special character</p>
// //                                     </div>
// //                                     <div>
// //                                         <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Max file size</span>
// //                                         <p className="text-slate-700 mt-1 font-bold">10 GB</p>
// //                                     </div>
// //                                     <div>
// //                                         <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Acceptable file types</span>
// //                                         <p className="text-slate-500 mt-1.5 text-[11px] leading-relaxed font-semibold tracking-wide">
// //                                             7z , cdf , cfg , conf , csv , divx , doc , docx , dvx , dwg , dyr , eml , evtx , gif , gz , htm , html , jpeg , jpg , kml , kmz , lib , mhtml , mov , mp3 , mp4 , mpp , msg , ods , odt , out , pdf , plb , png , ppsx , ppt , pptx , pscx , pslx , psout , pswx , raw , rtf , sav , seq , tif , tiff , txt , vsd , vsdx , xlk , xls , xlsb , xlsm , xlsx , xltx , xml , xps , zip
// //                                         </p>
// //                                     </div>
// //                                 </div>
// //                             </div>

// //                             <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] font-black text-slate-400">
// //                                 <span>SECURE CRYPTO STORAGE</span>
// //                                 <span>AES-256</span>
// //                             </div>
// //                         </div>

// //                     </div>
// //                 </div>
// //             )}

// //             {/* Premium Glassmorphic Delete Confirmation Modal */}
// //             {isDeleteModalOpen && (
// //                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
// //                     <div onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-slate-900/50 -[2px] animate-in fade-in duration-300"></div>
// //                     <div className="relative bg-white/95 rounded-xl border border-slate-200/80 shadow-md w-full max-w-md overflow-hidden p-6 md:p-8 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 select-none">
// //                         <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center text-rose-600 mb-5">
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
// //                         </div>

// //                         <h3 className="text-[17px] font-extrabold text-slate-850 mb-2">
// //                             {currentView === 'trash' ? 'Confirm Secure Permanent Deletion' : 'Move to Secure Trash'}
// //                         </h3>
// //                         <p className="text-[12.5px] text-slate-500 leading-relaxed mb-6 font-medium">
// //                             {currentView === 'trash' ? (
// //                                 <>You are about to permanently delete <strong className="text-slate-800 font-bold">{selectedIds.size} selected item(s)</strong> and all of their sub-folders and child hierarchies. This transaction is immutable and logged in the VDR audit trail.</>
// //                             ) : (
// //                                 <>You are about to move <strong className="text-slate-800 font-bold">{selectedIds.size} selected item(s)</strong> and all of their sub-folders to the trash vault. They can be recovered at any time.</>
// //                             )}
// //                         </p>

// //                         <div className="flex gap-3 justify-end">
// //                             <button
// //                                 onClick={() => setIsDeleteModalOpen(false)}
// //                                 className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12.5px] font-bold rounded-xl shadow-sm transition-all duration-200"
// //                             >
// //                                 Cancel
// //                             </button>
// //                             <button
// //                                 onClick={executeDeleteSelected}
// //                                 className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[12.5px] font-bold rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
// //                             >
// //                                 {currentView === 'trash' ? 'Permanently Delete' : 'Move to Trash'}
// //                             </button>
// //                         </div>
// //                     </div>
// //                 </div>
// //             )}

// //             {/* Premium Glassmorphic Download Progress Modal */}
// //             {isDownloadModalOpen && (
// //                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
// //                     <div className="absolute inset-0 bg-slate-900/50 -[2px] animate-in fade-in duration-300"></div>
// //                     <div className="relative bg-white/95 rounded-xl border border-slate-200/80 shadow-md w-full max-w-sm overflow-hidden p-6 md:p-8 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 select-none">
// //                         <div className="flex flex-col items-center text-center">
// //                             <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-5 relative">
// //                                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-bounce"><polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" /></svg>
// //                             </div>

// //                             <h3 className="text-[15px] font-extrabold text-slate-850 mb-1">Watermarking & Packaging</h3>
// //                             <p className="text-[12px] text-slate-400 font-bold max-w-xs truncate mb-6">{downloadingFileName}</p>

// //                             {/* Progress bar */}
// //                             <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden border border-slate-200/20">
// //                                 <div
// //                                     className="bg-indigo-600 h-full rounded-full transition-all duration-200"
// //                                     style={{ width: `${downloadProgress}%` }}
// //                                 ></div>
// //                             </div>

// //                             <div className="flex justify-between items-center w-full text-[11px] font-black text-slate-400 uppercase tracking-widest">
// //                                 <span>{downloadProgress === 100 ? 'Securing Bundle...' : 'Encoding Seal...'}</span>
// //                                 <span>{downloadProgress}%</span>
// //                             </div>
// //                         </div>
// //                     </div>
// //                 </div>
// //             )}

// //             {/* Premium Glassmorphic Export Secure Link Modal */}
// //             {isExportModalOpen && (
// //                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
// //                     <div onClick={() => setIsExportModalOpen(false)} className="absolute inset-0 bg-slate-900/50 -[2px] animate-in fade-in duration-300"></div>
// //                     <div className="relative bg-white/95 rounded-xl border border-slate-200/80 shadow-md w-full max-w-lg overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 select-none">

// //                         <button onClick={() => setIsExportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors z-10">
// //                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
// //                         </button>

// //                         {/* Left side parameters */}
// //                         <div className="flex-1 p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100">
// //                             <h3 className="text-[17px] font-extrabold text-slate-850 mb-5">Export Secure Share Link</h3>

// //                             <div className="space-y-4">
// //                                 {/* Expire Select */}
// //                                 <div>
// //                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Link Expiry Period</label>
// //                                     <select
// //                                         value={exportExpiresIn}
// //                                         onChange={(e) => setExportExpiresIn(e.target.value)}
// //                                         className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[12.5px] font-bold text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer shadow-sm"
// //                                     >
// //                                         <option value="1h">1 Hour (Highly Confidential)</option>
// //                                         <option value="24h">24 Hours (Standard Audit)</option>
// //                                         <option value="7d">7 Days (Standard M&A)</option>
// //                                         <option value="never">Never Expire</option>
// //                                     </select>
// //                                 </div>

// //                                 {/* Watermark Toggle */}
// //                                 <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/50 rounded-xl">
// //                                     <div>
// //                                         <span className="text-[12px] font-extrabold text-slate-700 block">Enforce Watermark</span>
// //                                         <p className="text-[9.5px] text-slate-400 font-bold">Locks recipient IP details onto page visuals</p>
// //                                     </div>
// //                                     <input
// //                                         type="checkbox"
// //                                         checked={exportWatermarkEnabled}
// //                                         onChange={(e) => setExportWatermarkEnabled(e.target.checked)}
// //                                         className="w-4.5 h-4.5 rounded-md border-slate-300 text-slate-900 focus:ring-slate-500/25 cursor-pointer accent-slate-800 transition-all"
// //                                     />
// //                                 </div>
// //                             </div>
// //                         </div>

// //                         {/* Right side link display */}
// //                         <div className="w-full md:w-80 p-6 md:p-8 bg-slate-50 flex flex-col justify-between select-text">
// //                             <div>
// //                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">SECURE SHARE LINK</span>

// //                                 <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-inner break-all text-[11.5px] font-semibold text-slate-600 leading-relaxed font-mono select-all">
// //                                     {exportSecureLink}
// //                                 </div>

// //                                 <p className="text-[11.5px] text-slate-400 leading-normal mt-3.5 font-medium select-none">
// //                                     Anyone with this link can view the selected <strong className="text-slate-700 font-bold">{selectedIds.size} securely sealed file(s)</strong> under the specified policy rules.
// //                                 </p>
// //                             </div>

// //                             <div className="mt-8 select-none">
// //                                 <button
// //                                     onClick={() => {
// //                                         navigator.clipboard.writeText(exportSecureLink);
// //                                         setIsLinkCopied(true);
// //                                         setTimeout(() => setIsLinkCopied(false), 2000);
// //                                     }}
// //                                     className={`w-full py-2.5 px-4 text-[12.5px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-300 ${isLinkCopied
// //                                         ? 'bg-emerald-600 text-white shadow-emerald-600/10'
// //                                         : 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.01] active:scale-[0.99]'
// //                                         }`}
// //                                 >
// //                                     {isLinkCopied ? (
// //                                         <>
// //                                             <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
// //                                             Copied secure link!
// //                                         </>
// //                                     ) : (
// //                                         <>
// //                                             <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
// //                                             Copy secure link
// //                                         </>
// //                                     )}
// //                                 </button>
// //                             </div>
// //                         </div>

// //                     </div>
// //                 </div>
// //             )}

// //         </div>
// //     );
// // }

