"use client";

import { useEffect, useState } from 'react';
const qB = { then: (r) => r({ data: [], error: null }), single: async () => ({ data: null, error: null }), maybeSingle: async () => ({ data: null, error: null }) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };
import { fetchCompany, fetchUsers, fetchGroups, fetchUserGroups } from '../actions';
import { useDialog } from '@/components/ui/DialogProvider';

export default function ManageUsersPage() {
  const [loading, setLoading] = useState(true);
  const { showConfirm } = useDialog();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [currentCompanyId, setCurrentCompanyId] = useState('');

  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, user }

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    org: '',
    role: 'external_user',
    selectedGroups: [] // array of groupIds
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch data on load
  const fetchData = async () => {
    setLoading(true);
    const mockUsers = [
      { id: 1, name: "Vishwa Bhai", company_name: "Vishwa Tech", email: "vishwa@gmail.com", phone_number: "9894886657", created_at: null, expiry_date: "26 Aug 2027", status: "active" },
      { id: 2, name: "Vairajothi P", company_name: "Vishwa Tech", email: "vairajothi@gmail.com", phone_number: "78899975576", created_at: null, expiry_date: "15 Dec 2026", status: "active" },
      { id: 3, name: "dhanush", company_name: "Vishwa Tech", email: "dhanush@gmail.com", phone_number: "5379891726", created_at: null, expiry_date: "31 Dec 2026", status: "active" },
      { id: 4, name: "anusiya", company_name: "Vishwa Tech", email: "anusiya@gmail.com", phone_number: "7878987", created_at: null, expiry_date: "28 Feb 2027", status: "active" },
      { id: 5, name: "nagaraj", company_name: "Vishwa Tech", email: "nagaadmin@gmail.com", phone_number: "2345678901", created_at: null, expiry_date: "10 Jan 2027", status: "active" },
      { id: 6, name: "ragul", company_name: "Vishwa Tech", email: "ragul@gmail.com", phone_number: "1234567890", created_at: null, expiry_date: "18 Mar 2027", status: "active" },
    ];
    setUsers(mockUsers);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(query);
    const emailMatch = user.email?.toLowerCase().includes(query);
    const mobileMatch = user.phone_number?.toLowerCase().includes(query);
    const orgMatch = (user.company_name || companyName)?.toLowerCase().includes(query);
    const groupMatch = user.groups?.some(g => g.name.toLowerCase().includes(query));

    return nameMatch || emailMatch || mobileMatch || orgMatch || groupMatch;
  });

  // Handle row checkbox selection
  const handleSelectUser = (userId) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Handle master checkbox selection
  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  // Right-Click Context Menu trigger
  const handleContextMenu = (e, user) => {
    e.preventDefault();
    const menuHeight = 150;
    const openUpwards = e.clientY + menuHeight > window.innerHeight;
    setContextMenu({
      x: Math.max(10, Math.min(e.clientX, window.innerWidth - 190)),
      y: openUpwards ? Math.max(10, e.clientY - menuHeight) : e.clientY,
      user
    });
  };

  // Toggle user status (Active <-> Inactive)
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      showToast(`User status updated successfully.`);
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status.', true);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!(await showConfirm('Are you sure you want to remove this user from the workspace?'))) return;
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      showToast('User removed successfully.');
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
      fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast('Failed to remove user.', true);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const usersToExport = selectedUserIds.length > 0
      ? users.filter(u => selectedUserIds.includes(u.id))
      : filteredUsers;

    if (usersToExport.length === 0) {
      showToast('No users to export.', true);
      return;
    }

    const headers = ['Name', 'Organization', 'Email', 'Role', 'Mobile', 'Expiry Date', 'Status'];
    const rows = usersToExport.map(user => [
      user.name || '',
      user.company_name || companyName,
      user.email || '',
      user.role === 'external_user' ? 'External User' : user.role,
      user.phone_number || '',
      formatExpiryDate(user.created_at),
      user.status === 'active' ? 'Active' : 'Inactive'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VDR_Users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${usersToExport.length} users exported.`);
  };

  // Resend Invite Action
  const handleResendInvite = () => {
    const selected = users.filter(u => selectedUserIds.includes(u.id));
    if (selected.length === 0) {
      showToast('Please select one or more users to resend invitations.', true);
      return;
    }

    const emails = selected.map(u => u.email).join(', ');
    showToast(`Invitation email successfully resent to: ${emails}`);
    setSelectedUserIds([]);
  };

  // Toast Helper
  const showToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      mobile: user.phone_number || '',
      org: user.company_name || companyName,
      role: user.role || 'external_user',
      selectedGroups: user.groups?.map(g => g.id) || []
    });
    setIsEditModalOpen(true);
  };

  // Handle submit Add/Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (isAddModalOpen) {
        // 1. Create a new user in the users table directly
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            company_id: currentCompanyId,
            workspace_id: JSON.parse(localStorage.getItem('vdr_session'))?.active_workspace_id,
            name: formData.name,
            email: formData.email,
            phone_number: formData.mobile,
            role: formData.role,
            status: "active",
            // Default temp password hash
            password_hash: '$2a$10$rB3Q92wZ4k1Qh.iP76gqKOpn8r9/xP8lA6uK.gL9D7/tB5Hq17Hee'
          })
          .select()
          .single();

        if (userError) throw userError;

        // 2. Insert group memberships
        if (formData.selectedGroups.length > 0 && newUser) {
          const groupInserts = formData.selectedGroups.map(groupId => ({
            user_id: newUser.id,
            group_id: groupId
          }));
          const { error: groupError } = await supabase
            .from('user_groups')
            .insert(groupInserts);
          if (groupError) throw groupError;
        }

        showToast('User added successfully.');
        setIsAddModalOpen(false);
      } else if (isEditModalOpen && selectedUser) {
        // 1. Update user details
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: formData.name,
            phone_number: formData.mobile,
            role: formData.role
          })
          .eq('id', selectedUser.id);

        if (updateError) throw updateError;

        // 2. Update group memberships (delete existing and insert new)
        const { error: deleteError } = await supabase
          .from('user_groups')
          .delete()
          .eq('user_id', selectedUser.id);

        if (deleteError) throw deleteError;

        if (formData.selectedGroups.length > 0) {
          const groupInserts = formData.selectedGroups.map(groupId => ({
            user_id: selectedUser.id,
            group_id: groupId
          }));
          const { error: groupError } = await supabase
            .from('user_groups')
            .insert(groupInserts);
          if (groupError) throw groupError;
        }

        showToast('User updated successfully.');
        setIsEditModalOpen(false);
      }

      // Reset form and refresh
      setFormData({
        name: '',
        email: '',
        mobile: '',
        org: companyName,
        role: 'external_user',
        selectedGroups: []
      });
      fetchData();
    } catch (err) {
      console.error('Error submitting form:', err);
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGroupCheckboxChange = (groupId) => {
    setFormData(prev => {
      const isSelected = prev.selectedGroups.includes(groupId);
      const newGroups = isSelected
        ? prev.selectedGroups.filter(id => id !== groupId)
        : [...prev.selectedGroups, groupId];
      return { ...prev, selectedGroups: newGroups };
    });
  };

  const staticExpiryDates = [
    "26 Aug 2027",
    "15 Dec 2026",
    "31 Dec 2026",
    "28 Feb 2027",
    "10 Jan 2027",
    "18 Mar 2027",
  ];

  // Expiry Date generator (static fallback / created_at + 1 year)
  const formatExpiryDate = (createdAt, userId, explicitDate) => {
    if (explicitDate) return explicitDate;
    if (createdAt) {
      try {
        const d = new Date(createdAt);
        d.setFullYear(d.getFullYear() + 1);
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      } catch (e) {}
    }
    const idx = (typeof userId === 'number' ? userId - 1 : 0) % staticExpiryDates.length;
    return staticExpiryDates[Math.max(0, idx)] || "26 Aug 2027";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative min-h-full font-sans">
      {/* Dynamic Toasts */}
      {successMsg && (
        <div className="fixed top-20 sm:top-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 animate-slide-in">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
          <span className="text-xs sm:text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Title & Actions / Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manage Users
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
            {users.length}
          </span>
          {selectedUserIds.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20">
              {selectedUserIds.length} selected
            </span>
          )}
        </div>

        {/* Action Controls & Search Input */}
        <div className="flex items-center gap-2.5">
          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="h-9 px-4 rounded-full bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            <span>Export</span>
          </button>

          {/* Search bar */}
          <div className="relative w-full sm:w-60 lg:w-72">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 rounded-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs font-medium"
            />
            <svg
              className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-2xs flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-semibold">Fetching users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
          </div>
          <p className="text-sm text-slate-400 font-semibold">No users found</p>
        </div>
      ) : (
        <>
          {/* ── MOBILE LIST VIEW (Visible on < md screens) ── */}
          <div className="md:hidden space-y-3">
            {/* Mobile Select All Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/20 cursor-pointer"
                />
                <span>Select All ({filteredUsers.length})</span>
              </label>
              {selectedUserIds.length > 0 && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[var(--brand)] border border-blue-100">
                  {selectedUserIds.length} selected
                </span>
              )}
            </div>

            {/* Mobile Cards List */}
            {filteredUsers.map(user => {
              const isSelected = selectedUserIds.includes(user.id);
              const isUserActive = user.status === 'active';

              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className={`p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-blue-50/90 border-[var(--brand)] shadow-xs ring-1 ring-[var(--brand)]/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectUser(user.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/20 cursor-pointer"
                        />
                      </div>

                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isSelected 
                          ? 'bg-[var(--brand)] text-white shadow-2xs' 
                          : 'bg-blue-50 text-[var(--brand)] border border-blue-100/80'
                      }`}>
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-xs sm:text-sm tracking-tight truncate ${isSelected ? 'text-[var(--brand)]' : 'text-slate-900'}`}>
                            {user.name}
                          </span>
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200/80 shrink-0">
                            {user.company_name || companyName || 'Vishwa Tech'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-1 truncate">
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-slate-400"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                          <span className="truncate">{user.email}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-slate-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          <span>{user.phone_number ? `+91 ${user.phone_number}` : '--'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-slate-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <span>Expires: {formatExpiryDate(user.created_at, user.id, user.expiry_date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const menuHeight = 150;
                          const openUpwards = rect.bottom + menuHeight > window.innerHeight;
                          setContextMenu({
                            x: Math.max(10, Math.min(rect.right - 180, window.innerWidth - 190)),
                            y: openUpwards ? Math.max(10, rect.top - menuHeight) : rect.bottom + 4,
                            user
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Actions"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>

                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        isUserActive
                          ? 'bg-blue-50 text-[var(--brand)] border-blue-200/80'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-[var(--brand)]' : 'bg-slate-400'}`}></span>
                        {isUserActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── DESKTOP TABLE VIEW (Visible on >= md screens) ── */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse select-none min-w-[740px]">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-400 font-extrabold text-[11px] tracking-wider border-b border-slate-200">
                    {/* Master Checkbox */}
                    <th className="py-3.5 sm:py-4 px-4 sm:px-5 w-10">
                      <input
                        type="checkbox"
                        checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/20 cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 sm:py-4 px-3 sm:px-4">NAME</th>
                    <th className="py-3.5 sm:py-4 px-4 sm:px-5">ORGANIZATION</th>
                    <th className="py-3.5 sm:py-4 px-4 sm:px-5">EMAIL</th>
                    <th className="py-3.5 sm:py-4 px-4 sm:px-5">MOBILE</th>
                    <th className="py-3.5 sm:py-4 px-4 sm:px-5">EXPIRY DATE</th>
                    <th className="py-3.5 sm:py-4 px-4 sm:px-5">STATUS</th>
                    <th className="py-3.5 sm:py-4 px-3 sm:px-4 text-center w-12">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => {
                    const isSelected = selectedUserIds.includes(user.id);
                    const isUserActive = user.status === 'active';

                    return (
                      <tr
                        key={user.id}
                        onContextMenu={(e) => handleContextMenu(e, user)}
                        className={`hover:bg-slate-50/60 transition-colors duration-200 cursor-context-menu ${isSelected ? 'bg-blue-50/80' : ''
                          } ${!isUserActive ? 'opacity-70' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 sm:py-4 px-4 sm:px-5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectUser(user.id)}
                            className="w-4 h-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/20 cursor-pointer"
                          />
                        </td>

                        {/* Name */}
                        <td className="py-3 sm:py-4 px-3 sm:px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] font-bold text-[11px] flex items-center justify-center shrink-0">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-bold text-slate-900 text-xs sm:text-[13px] hover:text-[var(--brand)] transition-colors truncate max-w-[160px]">
                              {user.name}
                            </span>
                          </div>
                        </td>

                        {/* Org */}
                        <td className="py-3 sm:py-4 px-4 sm:px-5 text-xs sm:text-[13px] text-slate-600 font-bold">
                          {user.company_name || companyName}
                        </td>

                        {/* Email */}
                        <td className="py-3 sm:py-4 px-4 sm:px-5 text-xs sm:text-[13px] text-slate-500 font-medium">
                          {user.email}
                        </td>

                        {/* Mobile */}
                        <td className="py-3 sm:py-4 px-4 sm:px-5 text-xs sm:text-[13px] text-slate-500 font-medium">
                          {user.phone_number ? `+91 ${user.phone_number}` : '--'}
                        </td>

                        {/* Expiry Date */}
                        <td className="py-3 sm:py-4 px-4 sm:px-5 text-xs sm:text-[13px] text-slate-600 font-semibold">
                          {formatExpiryDate(user.created_at, user.id, user.expiry_date)}
                        </td>

                        {/* Status */}
                        <td className="py-3 sm:py-4 px-4 sm:px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold border ${isUserActive
                              ? 'bg-blue-50 text-[var(--brand)] border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-[var(--brand)]' : 'bg-slate-400'}`}></span>
                            {isUserActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Quick 3-dots Action Menu */}
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const menuHeight = 150;
                              const openUpwards = rect.bottom + menuHeight > window.innerHeight;
                              setContextMenu({
                                x: Math.max(10, Math.min(rect.right - 180, window.innerWidth - 190)),
                                y: openUpwards ? Math.max(10, rect.top - menuHeight) : rect.bottom + 4,
                                user
                              });
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Actions"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="19" r="2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Instructions Overlay at the bottom */}
      <div className="mt-6 text-center">
        <p className="text-[11px] text-slate-400 font-semibold tracking-wide flex items-center justify-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
          Pro Tip: Right-click on any user row to open the quick action menu (Edit, Inactive, Remove).
        </p>
      </div>

      {/* CUSTOM CONTEXT MENU PORTAL */}
      {contextMenu && (
        <>
          {/* Backdrop to close when clicking outside */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 w-44 text-left border-slate-100 animate-scale-up"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          >
            {/* Edit */}
            <button
              onClick={() => {
                openEditModal(contextMenu.user);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Edit
            </button>

            {/* Toggle Active/Inactive */}
            <button
              onClick={() => {
                handleToggleStatus(contextMenu.user);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {contextMenu.user.status === 'active' ? 'Inactive' : 'Active'}
            </button>

            <div className="border-t border-slate-100 my-1"></div>

            {/* Remove */}
            <button
              onClick={() => {
                handleDeleteUser(contextMenu.user.id);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 text-xs font-extrabold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
              Remove
            </button>
          </div>
        </>
      )}

      {/* ADD / EDIT USER DIALOG MODAL */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
            }}
            className="absolute inset-0 bg-slate-900/40 transition-opacity"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-2xl p-5 sm:p-6.5 z-10 animate-fade-in max-h-[92vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {isAddModalOpen ? 'Add User' : 'Edit User'}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Configure credentials, company organizations, and security group assignments.
            </p>

            {errorMsg && (
              <div className="mt-4 bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-xs text-rose-600 font-semibold leading-relaxed">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/8 transition-all"
                />
              </div>

              {/* Email (only editable on Add) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  disabled={isEditModalOpen}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/8 transition-all ${isEditModalOpen ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
              </div>

              {/* Row: Mobile & Organization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mobile */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/8 transition-all"
                  />
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Organization</label>
                  <input
                    type="text"
                    placeholder="Enter organization"
                    value={formData.org}
                    onChange={(e) => setFormData(prev => ({ ...prev, org: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/8 transition-all"
                  />
                </div>
              </div>

              {/* Group Assignments */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assign Groups</label>
                <div className="mt-1 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto flex flex-col gap-2.5 shadow-inner-sm">
                  {groups.length === 0 ? (
                    <span className="text-xs text-slate-400 font-semibold py-2 text-center">No groups available in this workspace</span>
                  ) : (
                    groups.map(group => {
                      const isChecked = formData.selectedGroups.includes(group.id);
                      return (
                        <label key={group.id} className="flex items-center gap-2.5 cursor-pointer py-0.5 group">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleGroupCheckboxChange(group.id)}
                            className="w-4 h-4 rounded text-[var(--brand)] focus:ring-[var(--brand)]/20 border-slate-300"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{group.name}</span>
                            {group.description && (
                              <span className="block text-[10px] text-slate-400 font-medium truncate max-w-[360px]">{group.description}</span>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-xs font-bold tracking-wide transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white text-xs font-extrabold tracking-wide hover:shadow-sm hover:shadow-[var(--brand)]/15 active:scale-95 disabled:opacity-60 disabled:pointer-events-none transition-all flex items-center gap-2"
                >
                  {submitting && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                  {isAddModalOpen ? 'Save User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

