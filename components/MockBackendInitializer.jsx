"use client";
import { useEffect } from "react";

const normalizeOrgPlan = (rawPlan) => {
  if (!rawPlan) return "Starter Plan";
  const p = String(rawPlan).trim().toLowerCase();
  if (p === "standard plan" || p === "standard" || p === "basic" || p === "free tier" || p === "free" || p === "starter" || p === "starter plan") {
    return "Starter Plan";
  }
  if (p === "pro plan" || p === "pro" || p === "professional" || p === "professional plan" || p === "pro tier") {
    return "Professional Plan";
  }
  if (p === "enterprise" || p === "enterprise plan" || p === "enterprise tier") {
    return "Enterprise Plan";
  }
  return rawPlan.includes("Plan") ? rawPlan : `${rawPlan} Plan`;
};

export default function MockBackendInitializer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.__mockBackendInitialized) return;
    window.__mockBackendInitialized = true;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const [resource, config] = args;
      const url = (typeof resource === "string" ? resource : resource?.url) || "";

      // BYPASS MOCK FOR TERMINAL LOGGING ROUTES
      if (url.includes("/api/invite")) {
        return originalFetch(...args);
      }

      // Only intercept /api calls
      if (url.startsWith("/api") || url.startsWith("http://localhost:3000/api")) {
        console.log("[Mock Backend] Intercepted request to:", url);

        return new Promise((resolve) => {
          setTimeout(async () => {
            var mockData = { success: true, mock: true };

            try {
              if (url.includes("/api/auth")) {
                const userObj = {
                  id: "mock-user-123",
                  email: "demo@customer.com",
                  name: "Demo Admin",
                  role: "super_admin",
                  company_id: "demo-org",
                  nda_status: "signed",
                  request_status: "approved"
                };
                mockData = {
                  success: true,
                  data: userObj,
                  user: userObj
                };
              } else if (url.includes("/api/workspaces")) {
                if (typeof window !== "undefined" && !window.__mockWorkspaces) {
                  window.__mockWorkspaces = [
                    { id: "ws-1", name: "Project Horizon Data Room", status: "Active", user_count: 5 },
                    { id: "ws-2", name: "Q4 Financial Audits", status: "Active", user_count: 2 }
                  ];
                }
                const workspaces = typeof window !== "undefined" ? window.__mockWorkspaces : [];

                if (config?.method === "POST") {
                  const body = config?.body ? JSON.parse(config.body) : { name: "New Workspace" };
                  const newWs = { id: Math.random().toString(), name: body.name, status: "Active", user_count: 1 };
                  if (typeof window !== "undefined") window.__mockWorkspaces.push(newWs);
                  mockData = { success: true, workspace: newWs };
                } else if (config?.method === "PUT" || config?.method === "DELETE") {
                  const wsId = url.split('/').pop();
                  const body = config?.body ? JSON.parse(config.body) : {};
                  const status = config?.method === "DELETE" ? "Deleted" : (body.status || "Deleted");
                  if (typeof window !== "undefined") {
                    const ws = window.__mockWorkspaces.find(w => w.id === wsId);
                    if (ws) ws.status = status;
                  }
                  mockData = { success: true };
                } else {
                  mockData = { success: true, workspaces };
                }
              } else if (url.includes("/api/companies")) {
                mockData = { company: { id: "demo-org", name: "Global Tech Inc.", plan: "Enterprise" } };
              } else if (url.includes("/api/settings/nda")) {
                const bodyStr = config?.body;
                let body = {};
                try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch (e) {}

                if (body.action === 'fetch_users') {
                  mockData = {
                    success: true,
                    users: [
                      { id: "u-1", name: "John Doe", email: "john@demo.com", created_at: "2026-08-10T10:00:00Z", nda_accepted_at: "2026-08-12T14:30:00Z", nda_status: "accepted", nda_ip_address: "192.168.1.100" },
                      { id: "u-2", name: "Alice Smith", email: "alice@demo.com", created_at: "2026-08-11T10:00:00Z", nda_accepted_at: "2026-08-14T09:15:00Z", nda_status: "accepted", nda_ip_address: "192.168.1.102" },
                      { id: "u-3", name: "Bob Johnson", email: "bob@demo.com", created_at: "2026-08-15T10:00:00Z", nda_accepted_at: null, nda_status: "pending", nda_ip_address: null },
                      { id: "u-4", name: "Emma Davis", email: "emma@demo.com", created_at: "2026-08-16T10:00:00Z", nda_accepted_at: "2026-08-17T11:45:00Z", nda_status: "accepted", nda_ip_address: "192.168.1.105" }
                    ]
                  };
                } else if (body.action === 'fetch_text') {
                  mockData = { success: true, nda_text: null }; // Let the frontend use default text
                } else {
                  mockData = { success: true, users: [] };
                }
              } else if (url.includes("/api/documents/list")) {
                if (typeof window !== "undefined") {
                  let stored = null;
                  try { stored = localStorage.getItem("vdr_mock_documents"); } catch(e){}
                  if (stored) {
                    try { window.__mockDocuments = JSON.parse(stored); } catch(e){}
                  }
                  if (!window.__mockDocuments || window.__mockDocuments.length === 0) {
                    window.__mockDocuments = [
                      { id: "fold-1", name: "pibi", type: "folder", size_bytes: 26624, created_at: "2026-08-17T10:00:00.000Z", parentId: null, version: "V1", index: "1" },
                      { id: "doc-1", name: "Advanced EEG Epilepsy Detection System Using Hybrid Quantum-ClassicalAI Conferance.pptx", type: "file", size_bytes: 1468006, created_at: "2026-08-06T10:00:00.000Z", parentId: null, version: "V1", index: "2", is_bookmarked: false, is_downloaded: false, is_deleted: false },
                      { id: "doc-2", name: "Abhishek_KJ_AI Engineer_Resume.docx", type: "file", size_bytes: 17408, created_at: "2026-08-07T10:00:00.000Z", parentId: null, version: "V2", index: "3", is_bookmarked: true, is_downloaded: true, is_deleted: false },
                      { id: "doc-3", name: "Abhishek_KJ_AI Engineer_Resume.docx", type: "file", size_bytes: 17408, created_at: "2026-08-05T10:00:00.000Z", parentId: null, version: "V1", index: "4", is_bookmarked: false, is_downloaded: true, is_deleted: false },
                      { id: "doc-4", name: "VDR DOCUMENT PAGE.docx", type: "file", size_bytes: 19456, created_at: "2026-08-13T10:00:00.000Z", parentId: null, version: "V1", index: "5", is_bookmarked: true, is_downloaded: false, is_deleted: false },
                      { id: "doc-5", name: "Tech-Acceptance-Criteria (1).txt", type: "file", size_bytes: 6144, created_at: "2026-08-11T10:00:00.000Z", parentId: null, version: "V1", index: "6", is_bookmarked: false, is_downloaded: false, is_deleted: false },
                      { id: "doc-6", name: "Abhishek_KJ_AI Engineer_Resume.docx", type: "file", size_bytes: 17408, created_at: "2026-08-11T12:00:00.000Z", parentId: null, version: "V1", index: "7", is_bookmarked: false, is_downloaded: false, is_deleted: false },
                      { id: "doc-del-1", name: "Old_Financial_Report_2024.pdf", type: "file", size_bytes: 4500000, created_at: "2024-05-10T10:00:00.000Z", parentId: null, version: "V1", index: "8", is_bookmarked: false, is_downloaded: false, is_deleted: true, deleted_at: "2026-08-15T12:00:00.000Z", deleted_by: "Demo Admin" },
                      { id: "fold-del-1", name: "Obsolete Projects", type: "folder", size_bytes: 0, created_at: "2025-01-10T10:00:00.000Z", parentId: null, version: "V1", index: "9", is_deleted: true, deleted_at: "2026-08-14T09:30:00.000Z", deleted_by: "Demo Admin" }
                    ];
                    try { localStorage.setItem("vdr_mock_documents", JSON.stringify(window.__mockDocuments)); } catch(e){}
                  }
                }
                
                mockData = {
                  success: true,
                  files: typeof window !== "undefined" ? (window.__mockDocuments || []) : [],
                  mergedPerms: {},
                  globalFolderPerms: {}
                };
              } else if (url.includes("/api/access/list")) {
                mockData = {
                  success: true,
                  groups: [
                    { id: "grp-1", name: "Executive Team" },
                    { id: "grp-2", name: "External Auditors" }
                  ],
                  folders: [
                    { id: "fold-1", name: "Financials", parent_folder_id: null },
                    { id: "fold-2", name: "HR & Legal", parent_folder_id: null }
                  ],
                  documents: [
                    { id: "doc-1", name: "Q3_Earnings_Report.pdf", folder_id: null },
                    { id: "doc-2", name: "Employee_Contracts.docx", folder_id: null }
                  ],
                  groupMembers: {
                    "grp-1": [{ id: "u1", name: "Alice", email: "alice@demo.com" }]
                  },
                  permissions: {
                    "grp-1_doc_doc-1": { can_view: true, can_download_secure: true },
                    "grp-1_fol_fold-1": { can_view: true, can_upload: true }
                  }
                };
              } else if (url.includes("/api/groups/details")) {
                const bodyStr = config?.body;
                let body = {};
                try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch (e) {}

                const slug = body.groupSlug || "grp";
                const mockGroup = { id: slug, name: slug.replace(/-/g, " "), description: "Demo group for managing " + slug.replace(/-/g, " ") + " access" };
                
                const dummyMembers = [
                  { id: "u-1", name: "John Doe", email: "john@demo.com", phone: "+91 98765 43210", phone_number: "+91 98765 43210", status: "Active", role: "Admin" },
                  { id: "u-2", name: "Alice Smith", email: "alice@demo.com", phone: "+91 98451 23456", phone_number: "+91 98451 23456", status: "Active", role: "Member" },
                  { id: "u-3", name: "Bob Johnson", email: "bob@demo.com", phone: "+91 97890 65432", phone_number: "+91 97890 65432", status: "Active", role: "Member" },
                  { id: "u-4", name: "Emma Davis", email: "emma@demo.com", phone: "+91 99401 87654", phone_number: "+91 99401 87654", status: "Active", role: "Member" }
                ];

                mockData = {
                  success: true,
                  group: mockGroup,
                  members: dummyMembers,
                  canAddMembers: true,
                  canRemoveMembers: true,
                  canEditPermissions: true
                };
              } else if (url.includes("/api/access/save")) {
                mockData = { success: true };
              } else if (url.includes("/api/plans") || url.includes("/api/business-owner/plans")) {
                if (typeof window !== "undefined") {
                  let stored = null;
                  try { stored = localStorage.getItem("vdr_mock_plans"); } catch(e){}
                  if (stored) {
                    try { window.__mockPlans = JSON.parse(stored); } catch(e){}
                  }
                  if (!window.__mockPlans || window.__mockPlans.length === 0) {
                    window.__mockPlans = [
                      { 
                        id: "1", 
                        name: "Starter", 
                        price: "₹999/month", 
                        description: "Perfect for startups and small businesses to securely share documents.",
                        storageLimitMb: 25600, 
                        maxUsers: 10,
                        features: ["Secure Document Storage", "3 Workspaces", "Role-Based Access"]
                      },
                      { 
                        id: "2", 
                        name: "Professional", 
                        price: "₹2,999/month", 
                        description: "Ideal for growing businesses managing multiple projects and teams.",
                        storageLimitMb: 204800, 
                        maxUsers: 50,
                        features: ["Everything in Starter", "20 Workspaces", "Dynamic Watermarking"]
                      },
                      { 
                        id: "3", 
                        name: "Enterprise", 
                        price: "Custom", 
                        description: "Designed for large enterprises, M&A transactions, and highly secure data rooms.",
                        storageLimitMb: 1024000, 
                        maxUsers: 185,
                        features: ["Everything in Professional", "Unlimited Workspaces"]
                      }
                    ];
                    try { localStorage.setItem("vdr_mock_plans", JSON.stringify(window.__mockPlans)); } catch(e){}
                  }

                  const bodyStr = config?.body;
                  let body = {};
                  try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch (e) {}

                  const reqMethod = config?.method?.toUpperCase() || "GET";

                  if (reqMethod === "POST") {
                    const newPlan = {
                      id: "plan-" + Date.now(),
                      name: body.name || "New Plan",
                      price: body.price || "Custom",
                      description: body.description || "",
                      storageLimitMb: body.storageLimitMb || 0,
                      maxUsers: body.maxUsers || 10,
                      features: body.features || []
                    };
                    window.__mockPlans.push(newPlan);
                    try { localStorage.setItem("vdr_mock_plans", JSON.stringify(window.__mockPlans)); } catch(e){}
                  } else if (reqMethod === "PUT") {
                    const planId = body.id || body.planId;
                    const index = window.__mockPlans.findIndex(p => p.id === planId);
                    if (index !== -1) {
                      window.__mockPlans[index] = { ...window.__mockPlans[index], ...body };
                      try { localStorage.setItem("vdr_mock_plans", JSON.stringify(window.__mockPlans)); } catch(e){}
                    }
                  } else if (reqMethod === "DELETE") {
                    const idUrlMatch = url.match(/id=([^&]+)/);
                    const idToDelete = idUrlMatch ? idUrlMatch[1] : null;
                    if (idToDelete) {
                      window.__mockPlans = window.__mockPlans.filter(p => p.id !== idToDelete);
                      try { localStorage.setItem("vdr_mock_plans", JSON.stringify(window.__mockPlans)); } catch(e){}
                    }
                  }
                }

                mockData = {
                  success: true,
                  plans: typeof window !== "undefined" ? (window.__mockPlans || []) : []
                };
              } else if (url.includes("/api/settings/layout")) {
                mockData = {
                  success: true,
                  perms: { settings: true, branding: true, watermark: true, nda: true }
                };
              } else if (url.includes("/api/documents/action") || url.includes("/api/documents/upload") || url.includes("/api/documents/versions/restore") || url.includes("/api/auth/logout") || url.includes("/api/access/save")) {
                const bodyStr = config?.body;
                let body = {};
                try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch (e) {}

                if (url.includes("/api/documents/action") && typeof window !== "undefined" && window.__mockDocuments) {
                  const docIds = body.payload?.docIds || body.docIds || [];
                  const folderIds = body.payload?.folderIds || body.folderIds || [];
                  const allIds = [...docIds, ...folderIds];

                  if (body.action === 'trash') {
                    window.__mockDocuments = window.__mockDocuments.map(doc => allIds.includes(doc.id) ? { ...doc, is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: "Demo Admin" } : doc);
                  } else if (body.action === 'recover') {
                    window.__mockDocuments = window.__mockDocuments.map(doc => allIds.includes(doc.id) ? { ...doc, is_deleted: false, deleted_at: null, deleted_by: null } : doc);
                  } else if (body.action === 'permanent_delete') {
                    window.__mockDocuments = window.__mockDocuments.filter(doc => !allIds.includes(doc.id));
                  } else if (body.action === 'reindex') {
                    const docUpdates = body.payload?.docUpdates || [];
                    const folderUpdates = body.payload?.folderUpdates || [];
                    const updatesMap = new Map();
                    docUpdates.forEach(u => updatesMap.set(u.id, u.index));
                    folderUpdates.forEach(u => updatesMap.set(u.id, u.index_number));
                    
                    window.__mockDocuments = window.__mockDocuments.map(doc => {
                        if (updatesMap.has(doc.id)) {
                            return { ...doc, index: updatesMap.get(doc.id).toString() };
                        }
                        return doc;
                    });
                  }
                  try { localStorage.setItem("vdr_mock_documents", JSON.stringify(window.__mockDocuments)); } catch(e){}
                }

                mockData = { success: true, message: "Action mocked successfully" };
              } else if (url.includes("/api/view")) {
                const bodyStr = config?.body;
                let body = {};
                try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch (e) {}
                
                let docs = [];
                if (typeof window !== "undefined") {
                  try { const stored = localStorage.getItem("vdr_mock_documents"); if (stored) docs = JSON.parse(stored); } catch(e){}
                  if (docs.length === 0 && window.__mockDocuments) docs = window.__mockDocuments;
                }
                const doc = docs.find(d => d.id === body.docId);
                
                if (doc && doc.dataUrl) {
                  const base64Data = doc.dataUrl.split(',')[1];
                  const ext = doc.name.split('.').pop().toLowerCase();
                  mockData = { success: true, docName: doc.name, fileExt: ext, base64Data: base64Data, brandLogo: null, watermarkSettings: null };
                } else {
                  mockData = { success: true, message: "Mock view not available", fileExt: "txt", base64Data: btoa("Mock content not available for pre-loaded documents.") };
                }
              } else if (url.includes("/api/documents/download")) {
                mockData = { success: true, url: "#" };
              } else if (url.includes("/api/documents/versions/list")) {
                mockData = { 
                  success: true, 
                  versions: [
                    { id: "v-1", document_id: "doc-1", name: "Advanced EEG Epilepsy Detection System Using Hybrid Quantum-ClassicalAI Conferance.pptx", version_number: 1, upload_comment: "Initial Draft", uploaded_by_name: "Demo Admin", created_at: "2026-08-01T10:00:00.000Z", file_size_bytes: 1400000 },
                    { id: "v-2", document_id: "doc-1", name: "Advanced EEG Epilepsy Detection System Using Hybrid Quantum-ClassicalAI Conferance.pptx", version_number: 2, upload_comment: "Updated formatting", uploaded_by_name: "John Doe", created_at: "2026-08-06T10:00:00.000Z", file_size_bytes: 1468006 },
                    { id: "v-3", document_id: "doc-2", name: "Abhishek_KJ_AI Engineer_Resume.docx", version_number: 1, upload_comment: "First version", uploaded_by_name: "Demo Admin", created_at: "2026-08-05T10:00:00.000Z", file_size_bytes: 17000 },
                    { id: "v-4", document_id: "doc-2", name: "Abhishek_KJ_AI Engineer_Resume.docx", version_number: 2, upload_comment: "Added new skills", uploaded_by_name: "Demo Admin", created_at: "2026-08-07T10:00:00.000Z", file_size_bytes: 17408 }
                  ] 
                };
              } else if (url.includes("/api/user/nav-access")) {
                mockData = { success: true, role: "super_admin", perms: { settings: true, groups: true, qa: true } };
              } else if (url.includes("/api/groups/details")) {
                mockData = { 
                  success: true, 
                  group: { id: "grp-1", name: "kln grp Group", description: "Manage access and administration settings for members in this group." },
                  members: [
                    { id: "u-1", name: "John Doe", email: "john@demo.com", phone: "+91 98765 43210", phone_number: "+91 98765 43210", status: "active", role: "Admin" },
                    { id: "u-2", name: "Alice Smith", email: "alice@demo.com", phone: "+91 98451 23456", phone_number: "+91 98451 23456", status: "active", role: "Member" },
                    { id: "u-3", name: "Bob Johnson", email: "bob@demo.com", phone: "+91 97890 65432", phone_number: "+91 97890 65432", status: "active", role: "Member" },
                    { id: "u-4", name: "Emma Davis", email: "emma@demo.com", phone: "+91 99401 87654", phone_number: "+91 99401 87654", status: "active", role: "Member" }
                  ],
                  canAddMembers: true,
                  canRemoveMembers: true,
                  canEditPermissions: true
                };
              } else if (url.includes("/api/settings/watermark")) {
                mockData = { success: true, watermark: { type: "dynamic", text: "CONFIDENTIAL", opacity: 0.5 } };
              } else if (url.includes("/api/groups/permissions")) {
                mockData = { success: true, rawPermissions: [] };
              } else if (url.includes("/api/groups/members")) {
                mockData = { success: true, members: [] };
              } else if (url.includes("/api/settings/access")) {
                mockData = { success: true, settings: { block_downloads: false } };
              } else if (url.includes("/api/settings/branding")) {
                const bodyStr = config?.body;
                let body = {};
                try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch (e) {}

                let storedBranding = null;
                if (typeof window !== "undefined") {
                  try { storedBranding = JSON.parse(localStorage.getItem('vdr_mock_branding')); } catch(e){}
                }

                if (body.action === 'save' && body.payload) {
                  storedBranding = { ...storedBranding, ...body.payload };
                  if (typeof window !== "undefined") {
                    try { 
                      localStorage.setItem('vdr_mock_branding', JSON.stringify(storedBranding)); 
                      if (body.payload.active_theme) {
                        localStorage.setItem('vdr_theme', JSON.stringify(body.payload.active_theme));
                      }
                    } catch(e){}
                  }
                  mockData = { success: true, recordId: "rec-branding-1" };
                } else {
                  mockData = { 
                    success: true, 
                    data: storedBranding || { 
                      brand_name: "My Workspace",
                      logo_url: null, 
                      active_theme: "#1C7F9F",
                      admin_name: "Admin Demo",
                      admin_email: "admin@workspace.com",
                      admin_phone: "+91 98765 43210"
                    } 
                  };
                }
              } else if (url.includes("/api/auth/generate-otp") || url.includes("/api/auth/verify-otp") || url.includes("/api/auth/toggle-2fa")) {
                mockData = { success: true, message: "2FA mocked successfully", enabled: true };
              } else if (url.includes("/api/business-owner/email-templates")) {
                if (typeof window !== "undefined") {
                  let stored = null;
                  try { stored = localStorage.getItem("vdr_mock_email_templates"); } catch(e){}
                  if (stored) {
                    try { window.__mockEmailTemplates = JSON.parse(stored); } catch(e){}
                  }
                  if (!window.__mockEmailTemplates || window.__mockEmailTemplates.length === 0) {
                    window.__mockEmailTemplates = [
                      {
                        id: "tpl-welcome",
                        name: "Welcome Email",
                        subject: "Welcome to {{company_name}} VDR Portal",
                        body: `<p>Dear Customer,</p><p>Welcome to the Secure Virtual Data Room!</p><p>Your organization's workspace has been successfully created and approved. You can now securely manage your confidential files, invite team members, and collaborate with enterprise-level security.</p><p>To access your data room, please click the link below to login:<br><a href="https://vdr.example.com/login" style="color:#0D9488;text-decoration:underline;">https://vdr.example.com/login</a></p><p><strong>Important Guidelines:</strong></p><ol style="margin-top:5px;padding-left:20px;"><li>Please complete your profile and set up 2-Factor Authentication (2FA).</li><li>Do not share your login credentials with unauthorized persons.</li></ol><p>If you have any questions or need support, please contact our support team.</p><p>Best regards,<br>Virtual Data Room Team</p>`
                      },
                      {
                        id: "tpl-invite",
                        name: "User Invitation",
                        subject: "You have been invited to collaborate on {{company_name}} VDR",
                        body: `<p>Hello <strong>{{user_name}}</strong>,</p> <p>You have been invited as a guest collaborator in the <strong>{{company_name}}</strong> data room.</p> <p>Please log in and review the required NDA before accessing sensitive deal documents:</p> <p><a href="{{login_url}}" style="padding:10px 18px;background-color:#0D9488;color:#ffffff;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;margin-top:10px;">View Invitation</a></p>`
                      },
                      {
                        id: "tpl-reset",
                        name: "Password Reset",
                        subject: "Password Reset Request - {{company_name}} VDR",
                        body: `<p>Hello <strong>{{user_name}}</strong>,</p> <p>We received a request to reset your security password for your VDR account.</p> <p>Please click the button below to securely reset your credentials:</p> <p><a href="{{reset_link}}" style="padding:10px 18px;background-color:#E11D48;color:#ffffff;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;margin-top:10px;">Reset Password</a></p>`
                      }
                    ];
                    try { localStorage.setItem("vdr_mock_email_templates", JSON.stringify(window.__mockEmailTemplates)); } catch(e){}
                  }

                  const reqMethod = config?.method?.toUpperCase() || "GET";
                  if (reqMethod === "PUT") {
                    const bodyStr = config?.body;
                    let body = {};
                    try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch (e) {}
                    
                    const tplId = body.id;
                    const index = window.__mockEmailTemplates.findIndex(t => t.id === tplId);
                    if (index !== -1) {
                      window.__mockEmailTemplates[index] = { ...window.__mockEmailTemplates[index], ...body };
                      try { localStorage.setItem("vdr_mock_email_templates", JSON.stringify(window.__mockEmailTemplates)); } catch(e){}
                    }
                  }
                }

                mockData = {
                  success: true,
                  templates: typeof window !== "undefined" ? (window.__mockEmailTemplates || []) : []
                };
              } else if (url.includes("/api/business-owner/storage")) {
                if (typeof window !== "undefined") {
                  let storedGlobalLimit = localStorage.getItem("vdr_mock_global_storage_limit");
                  let globalLimit = storedGlobalLimit ? Number(storedGlobalLimit) : 500;

                  const reqMethod = config?.method?.toUpperCase() || "GET";
                  if (reqMethod === "POST" || reqMethod === "PUT") {
                    const bodyStr = config?.body;
                    let body = {};
                    try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch (e) {}
                    if (body.globalStorageLimitGb) {
                      globalLimit = Number(body.globalStorageLimitGb);
                      localStorage.setItem("vdr_mock_global_storage_limit", String(globalLimit));
                    }
                  }

                  let orgs = window.__mockOrganizations || [];
                  if (!orgs || orgs.length === 0) {
                    try {
                      const st = localStorage.getItem("vdr_mock_organizations");
                      if (st) orgs = JSON.parse(st);
                    } catch(e){}
                  }
                  const totalUsed = (orgs || []).reduce((sum, o) => sum + (Number(o.storageUsedGb) || 0), 0);

                  mockData = { 
                    success: true, 
                    storageUsedGb: totalUsed > 0 ? totalUsed : 154,
                    storageLimitGb: globalLimit
                  };
                } else {
                  mockData = { 
                    success: true, 
                    storageUsedGb: 154,
                    storageLimitGb: 500
                  };
                }
              } else if (url.includes("/api/business-owner/organizations")) {
                if (typeof window !== "undefined") {
                  let stored = null;
                  try { stored = localStorage.getItem("vdr_mock_organizations"); } catch(e){}
                  if (stored) {
                    try { 
                      let parsed = JSON.parse(stored);
                      parsed = parsed.map(o => ({
                        ...o,
                        plan: normalizeOrgPlan(o.plan)
                      }));
                      window.__mockOrganizations = parsed;
                      try { localStorage.setItem("vdr_mock_organizations", JSON.stringify(parsed)); } catch(e){}
                    } catch(e){}
                  }
                  if (!window.__mockOrganizations || window.__mockOrganizations.length === 0) {
                    window.__mockOrganizations = [
                      {
                        id: "org-1",
                        name: "Acme Corp",
                        adminName: "John Doe",
                        adminEmail: "admin@acmecorp.com",
                        usersCount: 12,
                        usersLimit: 15,
                        plan: "Professional Plan",
                        status: "active",
                        created_at: "2026-08-10T10:00:00.000Z",
                        storageUsedGb: 45,
                        storageLimitGb: 100,
                        storageLimitMb: 102400
                      },
                      {
                        id: "org-2",
                        name: "Global Tech Inc",
                        adminName: "Jane Smith",
                        adminEmail: "jane@globaltech.io",
                        usersCount: 3,
                        usersLimit: 5,
                        plan: "Starter Plan",
                        status: "trial",
                        created_at: "2026-08-12T14:30:00.000Z",
                        storageUsedGb: 8,
                        storageLimitGb: 50,
                        storageLimitMb: 51200
                      },
                      {
                        id: "org-3",
                        name: "Innovate Ltd",
                        adminName: "Mark Wilson",
                        adminEmail: "mark.w@innovateltd.net",
                        usersCount: 45,
                        usersLimit: 50,
                        plan: "Enterprise Plan",
                        status: "active",
                        created_at: "2026-08-17T09:15:00.000Z",
                        storageUsedGb: 101,
                        storageLimitGb: 350,
                        storageLimitMb: 358400
                      }
                    ];
                    try { localStorage.setItem("vdr_mock_organizations", JSON.stringify(window.__mockOrganizations)); } catch(e){}
                  }

                  const bodyStr = config?.body;
                  let body = {};
                  try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch (e) {}
                  const reqMethod = config?.method?.toUpperCase() || "GET";

                  if (reqMethod === "POST") {
                    const storageGb = body.storageLimitGb !== undefined
                      ? Number(body.storageLimitGb)
                      : (body.storageLimitMb !== undefined ? Math.round(Number(body.storageLimitMb) / 1024) : 50);
                    const storageMb = body.storageLimitMb !== undefined
                      ? Number(body.storageLimitMb)
                      : storageGb * 1024;

                    const newOrg = {
                      id: "org-" + Date.now(),
                      name: body.name || "New Org",
                      adminName: body.adminName || "Admin",
                      adminEmail: body.adminEmail || "admin@example.com",
                      usersCount: body.usersCount || 1,
                      usersLimit: body.usersLimit || 10,
                      plan: body.plan || "Starter Plan",
                      status: body.status || "trial",
                      created_at: new Date().toISOString(),
                      storageUsedGb: body.storageUsedGb || 0,
                      storageLimitGb: storageGb,
                      storageLimitMb: storageMb
                    };
                    window.__mockOrganizations.push(newOrg);
                    try { localStorage.setItem("vdr_mock_organizations", JSON.stringify(window.__mockOrganizations)); } catch(e){}
                  } else if (reqMethod === "PUT") {
                    const orgId = body.id || body.orgId;
                    const index = window.__mockOrganizations.findIndex(o => o.id === orgId);
                    if (index !== -1) {
                      const currentOrg = window.__mockOrganizations[index];
                      const updatedLimitGb = body.storageLimitGb !== undefined
                        ? Number(body.storageLimitGb)
                        : (body.storageLimitMb !== undefined ? Math.round(Number(body.storageLimitMb) / 1024) : currentOrg.storageLimitGb || 50);
                      const updatedLimitMb = body.storageLimitMb !== undefined
                        ? Number(body.storageLimitMb)
                        : updatedLimitGb * 1024;

                      window.__mockOrganizations[index] = {
                        ...currentOrg,
                        ...body,
                        id: orgId,
                        storageLimitGb: updatedLimitGb,
                        storageLimitMb: updatedLimitMb,
                      };
                      try { localStorage.setItem("vdr_mock_organizations", JSON.stringify(window.__mockOrganizations)); } catch(e){}
                    }
                  } else if (reqMethod === "DELETE") {
                    const idUrlMatch = url.match(/id=([^&]+)/);
                    const idToDelete = idUrlMatch ? idUrlMatch[1] : null;
                    if (idToDelete) {
                      window.__mockOrganizations = window.__mockOrganizations.filter(o => o.id !== idToDelete);
                      try { localStorage.setItem("vdr_mock_organizations", JSON.stringify(window.__mockOrganizations)); } catch(e){}
                    }
                  }
                }

                mockData = {
                  success: true,
                  organizations: typeof window !== "undefined" ? (window.__mockOrganizations || []) : []
                };
              } else if (url.includes("/api/business-owner/overview")) {
                if (typeof window !== "undefined") {
                  let stored = null;
                  try { stored = localStorage.getItem("vdr_mock_organizations"); } catch(e){}
                  if (stored) {
                    try { 
                      let parsed = JSON.parse(stored);
                      parsed = parsed.map(o => ({
                        ...o,
                        plan: normalizeOrgPlan(o.plan)
                      }));
                      window.__mockOrganizations = parsed;
                      try { localStorage.setItem("vdr_mock_organizations", JSON.stringify(parsed)); } catch(e){}
                    } catch(e){}
                  }
                  
                  if (!window.__mockOrganizations || window.__mockOrganizations.length === 0) {
                    window.__mockOrganizations = [
                      {
                        id: "org-1",
                        name: "Acme Corp",
                        adminName: "John Doe",
                        adminEmail: "admin@acmecorp.com",
                        usersCount: 12,
                        usersLimit: 15,
                        plan: "Professional Plan",
                        status: "active",
                        created_at: "2026-08-10T10:00:00.000Z",
                        storageUsedGb: 45,
                        storageLimitGb: 100,
                        storageLimitMb: 102400
                      },
                      {
                        id: "org-2",
                        name: "Global Tech Inc",
                        adminName: "Jane Smith",
                        adminEmail: "jane@globaltech.io",
                        usersCount: 3,
                        usersLimit: 5,
                        plan: "Starter Plan",
                        status: "trial",
                        created_at: "2026-08-12T14:30:00.000Z",
                        storageUsedGb: 8,
                        storageLimitGb: 50,
                        storageLimitMb: 51200
                      },
                      {
                        id: "org-3",
                        name: "Innovate Ltd",
                        adminName: "Mark Wilson",
                        adminEmail: "mark.w@innovateltd.net",
                        usersCount: 45,
                        usersLimit: 50,
                        plan: "Enterprise Plan",
                        status: "active",
                        created_at: "2026-08-17T09:15:00.000Z",
                        storageUsedGb: 101,
                        storageLimitGb: 350,
                        storageLimitMb: 358400
                      }
                    ];
                    try { localStorage.setItem("vdr_mock_organizations", JSON.stringify(window.__mockOrganizations)); } catch(e){}
                  }

                  const orgs = (window.__mockOrganizations || []).map(o => ({
                    ...o,
                    plan: normalizeOrgPlan(o.plan)
                  }));
                  const activeOrgs = orgs.filter(o => o.status === 'active').length;
                  const trialOrgs = orgs.filter(o => o.status === 'trial' || o.status === 'pending').length;
                  const totalUsers = orgs.reduce((sum, o) => sum + (Number(o.usersCount) || Number(o.usersLimit) || 1), 0);
                  const storageUsedGb = orgs.reduce((sum, o) => sum + (Number(o.storageUsedGb) || 0), 0);
                  
                  let storedGlobalLimit = null;
                  try { storedGlobalLimit = localStorage.getItem("vdr_mock_global_storage_limit"); } catch(e){}
                  const totalAllocatedTenantStorage = orgs.reduce((sum, o) => sum + (Number(o.storageLimitGb) || 0), 0);
                  const storageLimitGb = storedGlobalLimit ? Number(storedGlobalLimit) : (totalAllocatedTenantStorage > 0 ? totalAllocatedTenantStorage : 500);
                  const storagePercentage = storageLimitGb > 0 ? Math.min(100, Math.round((storageUsedGb / storageLimitGb) * 100)) : 0;
                  
                  let currentPlans = window.__mockPlans || [];
                  if (!currentPlans || currentPlans.length === 0) {
                    try {
                      const sp = localStorage.getItem("vdr_mock_plans");
                      if (sp) currentPlans = JSON.parse(sp);
                    } catch(e){}
                  }
                  if (!currentPlans || currentPlans.length === 0) {
                    currentPlans = [
                      { id: "1", name: "Starter" },
                      { id: "2", name: "Professional" },
                      { id: "3", name: "Enterprise" }
                    ];
                  }

                  const activePlansCount = 3;
                  const activePlansList = 'Starter • Professional • Enterprise';

                  const planCounts = {
                    "Starter": 0,
                    "Professional": 0,
                    "Enterprise": 0
                  };

                  orgs.forEach(o => {
                    const norm = normalizeOrgPlan(o.plan);
                    if (norm.includes("Starter")) {
                      planCounts["Starter"] += 1;
                    } else if (norm.includes("Professional")) {
                      planCounts["Professional"] += 1;
                    } else if (norm.includes("Enterprise")) {
                      planCounts["Enterprise"] += 1;
                    }
                  });
                  
                  const recentActivity = [...orgs]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5)
                    .map(o => ({
                      id: `act-${o.id}`,
                      iconType: 'org',
                      action: 'Organization Provisioned',
                      description: `Tenant '${o.name}' active on ${o.plan} (${o.storageLimitGb || 50} GB allocated).`,
                      timestamp: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    }));

                  mockData = {
                    success: true,
                    totalOrganizations: orgs.length,
                    activeOrgs,
                    trialOrgs,
                    totalUsers,
                    storageUsedGb,
                    storageLimitGb,
                    storagePercentage,
                    activePlansCount,
                    activePlansList,
                    planCounts,
                    recentActivity
                  };
                } else {
                  mockData = { success: true, mock: true, message: "Overview not available on server side" };
                }
              } else if (url.includes("/api/request-workspace")) {
                if (typeof window !== "undefined") {
                  let stored = null;
                  try { stored = localStorage.getItem("vdr_mock_organizations"); } catch(e){}
                  if (stored) {
                    try { window.__mockOrganizations = JSON.parse(stored); } catch(e){}
                  }
                  
                  if (!window.__mockOrganizations || window.__mockOrganizations.length === 0) {
                    window.__mockOrganizations = [
                      {
                        id: "org-1",
                        name: "Acme Corp",
                        adminName: "John Doe",
                        adminEmail: "admin@acmecorp.com",
                        usersCount: 12,
                        usersLimit: 15,
                        plan: "Professional Plan",
                        status: "active",
                        created_at: "2026-08-10T10:00:00.000Z",
                        storageUsedGb: 45,
                        storageLimitGb: 100,
                        storageLimitMb: 102400
                      },
                      {
                        id: "org-2",
                        name: "Global Tech Inc",
                        adminName: "Jane Smith",
                        adminEmail: "jane@globaltech.io",
                        usersCount: 3,
                        usersLimit: 5,
                        plan: "Starter Plan",
                        status: "trial",
                        created_at: "2026-08-12T14:30:00.000Z",
                        storageUsedGb: 8,
                        storageLimitGb: 50,
                        storageLimitMb: 51200
                      },
                      {
                        id: "org-3",
                        name: "Innovate Ltd",
                        adminName: "Mark Wilson",
                        adminEmail: "mark.w@innovateltd.net",
                        usersCount: 45,
                        usersLimit: 50,
                        plan: "Enterprise Plan",
                        status: "active",
                        created_at: "2026-08-17T09:15:00.000Z",
                        storageUsedGb: 101,
                        storageLimitGb: 350,
                        storageLimitMb: 358400
                      }
                    ];
                    try { localStorage.setItem("vdr_mock_organizations", JSON.stringify(window.__mockOrganizations)); } catch(e){}
                  }

                  const orgs = window.__mockOrganizations || [];
                  
                  // Extract status from URL query params
                  const urlObj = new URL(url.startsWith("http") ? url : `http://localhost:3000${url}`);
                  const requestedStatus = urlObj.searchParams.get("status") || "pending";

                  const filteredOrgs = orgs.filter(o => {
                    if (requestedStatus === 'pending') return o.status === 'trial';
                    if (requestedStatus === 'approved') return o.status === 'active';
                    if (requestedStatus === 'rejected') return o.status === 'rejected';
                    if (requestedStatus === 'all') return true;
                    return o.status === 'trial'; // fallback
                  });

                  const formattedRequests = filteredOrgs.map(o => ({
                      id: o.id,
                      company_name: o.name,
                      admin_name: o.adminName,
                      admin_email: o.adminEmail,
                      plan_id: o.plan,
                      created_at: o.created_at,
                      status: o.status === 'trial' ? 'pending' : (o.status === 'active' ? 'approved' : o.status),
                      rejection_reason: o.rejection_reason || null
                    }));

                  mockData = { success: true, requests: formattedRequests };
                } else {
                  mockData = { success: true, requests: [] };
                }
              } else if (url.includes("/api/approve-request")) {
                const bodyStr = config?.body;
                let body = {};
                try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch (e) {}
                
                if (typeof window !== "undefined" && window.__mockOrganizations) {
                  const reqId = body.requestId;
                  const orgIndex = window.__mockOrganizations.findIndex(o => o.id === reqId);
                  if (orgIndex !== -1) {
                    window.__mockOrganizations[orgIndex].status = "active";
                    try { localStorage.setItem("vdr_mock_organizations", JSON.stringify(window.__mockOrganizations)); } catch(e){}
                  }
                }
                mockData = { success: true };
              } else if (url.includes("/api/reject-request")) {
                const bodyStr = config?.body;
                let body = {};
                try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch (e) {}
                
                if (typeof window !== "undefined" && window.__mockOrganizations) {
                  const reqId = body.requestId;
                  const orgIndex = window.__mockOrganizations.findIndex(o => o.id === reqId);
                  if (orgIndex !== -1) {
                    window.__mockOrganizations[orgIndex].status = "rejected";
                    window.__mockOrganizations[orgIndex].rejection_reason = body.reason;
                    try { localStorage.setItem("vdr_mock_organizations", JSON.stringify(window.__mockOrganizations)); } catch(e){}
                  }
                }
                mockData = { success: true };
              } else {
                // Generic fallback for any other intercepted API
                mockData = { success: true, mock: true, message: "This is a mock response" };
              }
            } catch (err) {
              console.error("[Mock Backend] Error processing mock response:", err);
              mockData = { success: false, error: "Mock interceptor error" };
            }

            // Fake a successful 200 OK Response with the mock JSON payload
            resolve(
              new Response(JSON.stringify(mockData), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
            );
          }, 10); // 10ms network delay simulation
        });
      }

      // Let non-API requests (static assets, Next.js internal fetching, etc.) pass through normally
      return originalFetch(...args);
    };

    console.log("[Mock Backend] Interceptor successfully initialized. All API requests will be mocked locally.");
  }, []);

  return null;
}
