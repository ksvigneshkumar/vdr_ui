"use client";

import { useEffect, useState } from 'react';
const qB = { then: (r) => r({ data: [], error: null }), single: async () => ({ data: null, error: null }), maybeSingle: async () => ({ data: null, error: null }) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };
import { useDialog } from '@/components/ui/DialogProvider';
import { fetchGroups, fetchUserGroupsByUserId, fetchUsersMinimal, fetchAllUserGroups } from '../actions';

export default function ManageGroupsPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCompanyId, setCurrentCompanyId] = useState('');
  const { showConfirm } = useDialog();

  // Selection state
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, group }

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    role: 'external_user'
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    // Mocking state for the frontend demo matching the sidebar
    const mockGroups = [
      { id: "grp-1", name: "kln grp", role: "admin", description: "Admin group", creator_name: "Admin", created_at: new Date().toISOString() },
      { id: "grp-2", name: "admin grp 1", role: "admin", description: "Admin group 1", creator_name: "Admin", created_at: new Date().toISOString() },
      { id: "grp-3", name: "sub admin grp 1", role: "sub_admin", description: "Sub admin group", creator_name: "Admin", created_at: new Date().toISOString() },
      { id: "grp-4", name: "new grp", role: "external_user", description: "New external group", creator_name: "Admin", created_at: new Date().toISOString() },
      { id: "grp-5", name: "users grp 1", role: "external_user", description: "Users external group", creator_name: "Admin", created_at: new Date().toISOString() }
    ];
    setGroups(mockGroups);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Global listener to close context menu on left click
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Filter groups based on search query
  const filteredGroups = groups.filter(group => {
    const query = searchQuery.toLowerCase();
    const nameMatch = group.name?.toLowerCase().includes(query);
    const descMatch = group.description?.toLowerCase().includes(query);
    const roleMatch = group.role?.toLowerCase().includes(query);
    const creatorMatch = group.creator_name?.toLowerCase().includes(query);
    return nameMatch || descMatch || roleMatch || creatorMatch;
  });

  // Handle row checkbox selection
  const handleSelectGroup = (groupId) => {
    setSelectedGroupIds(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  // Handle master checkbox selection
  const handleSelectAll = () => {
    if (selectedGroupIds.length === filteredGroups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(filteredGroups.map(g => g.id));
    }
  };

  // Right-Click Context Menu trigger
  const handleContextMenu = (e, group) => {
    e.preventDefault();
    const menuHeight = 110;
    const openUpwards = e.clientY + menuHeight > window.innerHeight;
    setContextMenu({
      x: Math.max(10, Math.min(e.clientX, window.innerWidth - 190)),
      y: openUpwards ? Math.max(10, e.clientY - menuHeight) : e.clientY,
      group
    });
  };

  // Toast helper
  const showToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Delete Group Action (Bulk or Single)
  const handleDeleteGroups = async () => {
    const idsToDelete = selectedGroupIds.length > 0
      ? selectedGroupIds
      : [];

    if (idsToDelete.length === 0) {
      showToast('Please select one or more groups to delete.', true);
      return;
    }

    const confirmMsg = idsToDelete.length === 1
      ? 'Are you sure you want to delete this group?'
      : `Are you sure you want to delete the ${idsToDelete.length} selected groups?`;

    if (!(await showConfirm(confirmMsg))) return;

    try {
      setLoading(true);

      // Delete relationships in user_groups and permissions first for all target groups
      await supabase.from('user_groups').delete().in('group_id', idsToDelete);
      await supabase.from('permissions').delete().in('group_id', idsToDelete);

      // Delete groups
      const { error } = await supabase
        .from('groups')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      showToast(`${idsToDelete.length} group(s) deleted successfully.`);
      setSelectedGroupIds([]);
      fetchData();
    } catch (err) {
      console.error('Error deleting groups:', err);
      showToast('Failed to delete groups.', true);
      setLoading(false);
    }
  };

  // Delete group from right-click
  const handleDeleteSingleGroup = async (group) => {
    if (!(await showConfirm(`Are you sure you want to delete the group "${group.name}"?`))) return;
    try {
      await supabase.from('user_groups').delete().eq('group_id', group.id);
      await supabase.from('permissions').delete().eq('group_id', group.id);

      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id);

      if (error) throw error;

      showToast('Group deleted successfully.');
      setSelectedGroupIds(prev => prev.filter(id => id !== group.id));
      fetchData();
    } catch (err) {
      console.error('Error deleting group:', err);
      showToast('Failed to delete group.', true);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const groupsToExport = selectedGroupIds.length > 0
      ? groups.filter(g => selectedGroupIds.includes(g.id))
      : filteredGroups;

    if (groupsToExport.length === 0) {
      showToast('No groups to export.', true);
      return;
    }

    const headers = ['Group Name', 'Created By', 'Created Date', 'Access Role', 'Description'];
    const rows = groupsToExport.map(group => [
      group.name || '',
      group.creator_name || 'System',
      formatDate(group.created_at),
      group.role || 'external_user',
      group.description || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VDR_Groups_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${groupsToExport.length} group(s) exported.`);
  };

  // Open edit modal (Action bar or context menu)
  const openEditModal = (group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name || '',
      description: group.description || '',
      role: group.role || 'external_user'
    });
    setIsEditModalOpen(true);
  };

  // Open edit modal for selected group in checkbox list
  const handleEditSelected = () => {
    if (selectedGroupIds.length !== 1) return;
    const group = groups.find(g => g.id === selectedGroupIds[0]);
    if (group) openEditModal(group);
  };

  // Handle submit Create/Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const rawSession = localStorage.getItem('vdr_session');
      const session = rawSession ? JSON.parse(rawSession) : null;
      const creatorId = session ? session.id : null;

      if (isCreateModalOpen) {
        // Create new group
        const { error } = await supabase
          .from('groups')
          .insert({
            company_id: currentCompanyId,
            workspace_id: session ? session.active_workspace_id : null,
            name: formData.name,
            description: formData.description,
            role: formData.role,
            created_by: creatorId
          });

        if (error) throw error;
        showToast('Group created successfully.');
        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedGroup) {
        // Update group
        const { error } = await supabase
          .from('groups')
          .update({
            name: formData.name,
            description: formData.description,
            role: formData.role
          })
          .eq('id', selectedGroup.id);

        if (error) throw error;
        showToast('Group updated successfully.');
        setIsEditModalOpen(false);
      }

      // Reset
      setFormData({ name: '', description: '', role: 'external_user' });
      setSelectedGroupIds([]);
      fetchData();
    } catch (err) {
      console.error('Error submitting group form:', err);
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date exactly MM/DD/YY (e.g. 07/08/26)
  const formatDate = (dateStr) => {
    if (!dateStr) return '07/08/26';
    try {
      const d = new Date(dateStr);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${month}/${day}/${year}`;
    } catch (e) {
      return '07/08/26';
    }
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
            Manage Groups
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
            {groups.length}
          </span>
          {selectedGroupIds.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20">
              {selectedGroupIds.length} selected
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
              placeholder="Search groups..."
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
          <p className="text-sm text-slate-400 font-semibold">Fetching workspace groups...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M9 21V9" /><path d="M3 9h18" /></svg>
          </div>
          <p className="text-sm text-slate-400 font-semibold">No groups found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse select-none min-w-[620px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 font-extrabold text-[11px] tracking-wider border-b border-slate-200">
                  {/* Master Checkbox */}
                  <th className="py-3.5 sm:py-4 px-4 sm:px-5 w-10">
                    <input
                      type="checkbox"
                      checked={filteredGroups.length > 0 && selectedGroupIds.length === filteredGroups.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/20 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 sm:py-4 px-3 sm:px-4">GROUP NAME</th>
                  <th className="py-3.5 sm:py-4 px-4 sm:px-5">CREATED BY</th>
                  <th className="py-3.5 sm:py-4 px-4 sm:px-5">CREATED DATE</th>
                  <th className="py-3.5 sm:py-4 px-3 sm:px-4 text-center w-12">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGroups.map(group => {
                  const isSelected = selectedGroupIds.includes(group.id);

                  return (
                    <tr
                      key={group.id}
                      onContextMenu={(e) => handleContextMenu(e, group)}
                      className={`hover:bg-slate-50/60 transition-colors duration-200 cursor-context-menu ${isSelected ? 'bg-slate-50/80' : ''
                        }`}
                    >
                      {/* Checkbox Column */}
                      <td className="py-3 sm:py-4 px-4 sm:px-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectGroup(group.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/20 cursor-pointer"
                        />
                      </td>

                      {/* Group Name */}
                      <td className="py-3 sm:py-4 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center border border-teal-100/30 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-[13px] hover:text-[var(--brand)] transition-colors block">
                              {group.name}
                            </span>
                            {group.description && (
                              <span className="text-[10px] text-slate-400 font-medium truncate block max-w-[200px] sm:max-w-[280px]">
                                {group.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Created By */}
                      <td className="py-3 sm:py-4 px-4 sm:px-5 text-xs sm:text-[13px] text-slate-700 font-bold">
                        {group.creator_name}
                      </td>

                      {/* Created Date */}
                      <td className="py-3 sm:py-4 px-4 sm:px-5 text-xs sm:text-[13px] text-slate-500 font-semibold">
                        {formatDate(group.created_at)}
                      </td>

                      {/* Quick 3-dots Action Menu */}
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const menuHeight = 110;
                            const openUpwards = rect.bottom + menuHeight > window.innerHeight;
                            setContextMenu({
                              x: Math.max(10, Math.min(rect.right - 180, window.innerWidth - 190)),
                              y: openUpwards ? Math.max(10, rect.top - menuHeight) : rect.bottom + 4,
                              group
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
      )}

      {/* Helper Context Instructions */}
      <div className="mt-6 text-center">
        <p className="text-[11px] text-slate-400 font-semibold tracking-wide flex items-center justify-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
          Pro Tip: Right-click on any group row to open the quick action menu (Edit, Remove).
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
                openEditModal(contextMenu.group);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              Edit Group
            </button>

            <div className="border-t border-slate-100 my-1"></div>

            {/* Delete */}
            <button
              onClick={() => {
                handleDeleteSingleGroup(contextMenu.group);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 text-xs font-extrabold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
              Delete Group
            </button>
          </div>
        </>
      )}

      {/* CREATE / EDIT GROUP DIALOG MODAL */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            onClick={() => {
              setIsCreateModalOpen(false);
              setIsEditModalOpen(false);
            }}
            className="absolute inset-0 bg-slate-900/40 transition-opacity"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-2xl p-5 sm:p-6.5 z-10 animate-fade-in max-h-[92vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {isCreateModalOpen ? 'Create Access Group' : 'Edit Access Group'}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Create and configure logical user groups to apply sweeping permission controls.
            </p>

            {errorMsg && (
              <div className="mt-4 bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-xs text-rose-600 font-semibold leading-relaxed">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              {/* Group Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PwC, Due Diligence Team, etc."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/8 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  placeholder="Describe the purpose of this access group..."
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/8 transition-all resize-none"
                />
              </div>

              {/* Access Role */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Group Access Role Level</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/8 transition-all"
                >
                  <option value="external_user">External User / Reviewer (Default)</option>
                  <option value="sub_admin">Sub-Administrator</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
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
                  {isCreateModalOpen ? 'Create Group' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

