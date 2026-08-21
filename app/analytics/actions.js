export const fetchGroupsAnalytics = async () => ({
    data: [
        { id: "grp-1", name: "kln grp Group" },
        { id: "grp-2", name: "Executive Team" },
        { id: "grp-3", name: "External Auditors" }
    ]
});

export const fetchUserGroupsByGroupIdAnalytics = async (groupId) => ({
    data: [
        { user_id: "u-1" },
        { user_id: "u-2" },
        { user_id: "u-3" }
    ]
});

export const fetchUsersByIdsAnalytics = async (userIds) => ({
    data: [
        { id: "u-1", name: "John Doe", email: "john@demo.com" },
        { id: "u-2", name: "Alice Smith", email: "alice@demo.com" },
        { id: "u-3", name: "Bob Johnson", email: "bob@demo.com" }
    ].filter(u => userIds.includes(u.id))
});

export const fetchLoginHistoryFilteredAnalytics = async (userIds, dateFrom, dateTo) => {
    const now = new Date();
    return {
        data: [
            { user_id: "u-1", created_at: new Date(now.getTime() - 86400000 * 2).toISOString() },
            { user_id: "u-1", created_at: new Date(now.getTime() - 86400000 * 1).toISOString() },
            { user_id: "u-2", created_at: new Date(now.getTime() - 86400000 * 3).toISOString() },
            { user_id: "u-3", created_at: new Date(now.getTime() - 86400000 * 1).toISOString() },
            { user_id: "u-2", created_at: new Date(now.getTime() - 86400000 * 0).toISOString() }
        ]
    };
};

export const fetchDocumentEditLogsFilteredAnalytics = async (userIds, actions, dateFrom, dateTo) => ({
    data: [
        { user_id: "u-1", document_id: "doc-1", action: "DOWNLOAD_PDF", changed_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { user_id: "u-2", document_id: "doc-2", action: "DOWNLOAD", changed_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { user_id: "u-1", document_id: "doc-2", action: "DOWNLOAD", changed_at: new Date(Date.now() - 86400000 * 0).toISOString() }
    ]
});

export const fetchDocumentsByIdsAnalytics = async (docIds) => ({
    data: [
        { id: "doc-1", name: "Q3_Financial_Report.pdf" },
        { id: "doc-2", name: "Employee_Contracts.docx" }
    ]
});

export const fetchDocumentAccessLogsFilteredAnalytics = async (userIds, dateFrom, dateTo) => ({
    data: [
        { user_id: "u-1", document_id: "doc-1", opened_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { user_id: "u-2", document_id: "doc-1", opened_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { user_id: "u-3", document_id: "doc-2", opened_at: new Date(Date.now() - 86400000 * 3).toISOString() },
        { user_id: "u-1", document_id: "doc-2", opened_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { user_id: "u-2", document_id: "doc-2", opened_at: new Date(Date.now() - 86400000 * 0).toISOString() }
    ]
});

export const fetchQnaMessagesAnalytics = async (userNames, dateFrom, dateTo) => ({
    data: [
        { sender: "John Doe", thread_id: "th-1", created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { sender: "Alice Smith", thread_id: "th-2", created_at: new Date(Date.now() - 86400000 * 2).toISOString() }
    ]
});

export const fetchQnaThreadsAnalytics = async (threadIds) => ({
    data: [
        { id: "th-1", documents: { name: "Q3_Financial_Report.pdf" } },
        { id: "th-2", documents: { name: "Employee_Contracts.docx" } }
    ]
});

export const fetchUserGroupsByGroupIdsAnalytics = async (groupIds) => ({
    data: [
        { group_id: "grp-1", user_id: "u-1" },
        { group_id: "grp-1", user_id: "u-2" },
        { group_id: "grp-2", user_id: "u-2" },
        { group_id: "grp-2", user_id: "u-3" },
        { group_id: "grp-3", user_id: "u-1" },
        { group_id: "grp-3", user_id: "u-3" }
    ]
});
export const fetchLoginHistoryForCompanyAnalytics = async (companyId) => ({
    data: [
        { user_id: "u-1", created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { user_id: "u-2", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { user_id: "u-3", created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
        { user_id: "u-1", created_at: new Date(Date.now() - 86400000 * 0).toISOString() },
        { user_id: "u-2", created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { user_id: "u-2", created_at: new Date(Date.now() - 86400000 * 0).toISOString() },
        { user_id: "u-3", created_at: new Date(Date.now() - 86400000 * 1).toISOString() }
    ]
});
export const fetchUsersByCompany = async () => ({
    data: [
        { id: "u-1", name: "John Doe", email: "john@demo.com" },
        { id: "u-2", name: "Alice Smith", email: "alice@demo.com" },
        { id: "u-3", name: "Bob Johnson", email: "bob@demo.com" }
    ]
});
export const fetchFoldersAnalytics = async () => ({
    data: [
        { id: "f-1", name: "Financial Reports 2023" },
        { id: "f-2", name: "Legal Documents" },
        { id: "f-3", name: "HR Policies" },
        { id: "f-4", name: "Board Meetings" }
    ]
});
export const fetchDocumentsAnalytics = async () => ({
    data: [
        { id: "doc-1", name: "Q3_Financial_Report.pdf", folder_id: "f-1" },
        { id: "doc-2", name: "Employee_Contracts.docx", folder_id: "f-2" },
        { id: "doc-3", name: "Code_of_Conduct.pdf", folder_id: "f-3" },
        { id: "doc-4", name: "Tax_Filings.pdf", folder_id: "f-1" },
        { id: "doc-5", name: "Meeting_Minutes_Oct.pdf", folder_id: "f-4" }
    ]
});
export const fetchDocumentAccessLogsAnalytics = async () => ({
    data: [
        { id: "log-1", document_id: "doc-1", user_id: "u-1", opened_at: new Date(Date.now() - 86400000 * 1).toISOString(), duration: 120 },
        { id: "log-2", document_id: "doc-1", user_id: "u-2", opened_at: new Date(Date.now() - 86400000 * 2).toISOString(), duration: 300 },
        { id: "log-3", document_id: "doc-2", user_id: "u-3", opened_at: new Date(Date.now() - 86400000 * 3).toISOString(), duration: 45 },
        { id: "log-4", document_id: "doc-3", user_id: "u-1", opened_at: new Date(Date.now() - 86400000 * 1).toISOString(), duration: 600 },
        { id: "log-5", document_id: "doc-4", user_id: "u-2", opened_at: new Date(Date.now() - 86400000 * 0).toISOString(), duration: 180 },
        { id: "log-6", document_id: "doc-5", user_id: "u-1", opened_at: new Date(Date.now() - 43200000 * 1).toISOString(), duration: 1500 }
    ]
});
export const fetchDocumentEditLogsAnalytics = async () => ({
    data: [
        { id: "elog-1", document_id: "doc-1", user_id: "u-1", action_type: "DOWNLOAD_ORIGINAL", changed_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { id: "elog-2", document_id: "doc-1", user_id: "u-2", action_type: "DOWNLOAD_SECURE", changed_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: "elog-3", document_id: "doc-2", user_id: "u-1", action_type: "DOWNLOAD_ORIGINAL", changed_at: new Date(Date.now() - 86400000 * 0).toISOString() },
        { id: "elog-4", document_id: "doc-3", user_id: "u-3", action_type: "UPLOAD", changed_at: new Date(Date.now() - 86400000 * 4).toISOString() },
        { id: "elog-5", document_id: "doc-4", user_id: "u-2", action_type: "DELETE", changed_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { id: "elog-6", document_id: "doc-5", user_id: "u-1", action_type: "DOWNLOAD_SECURE", changed_at: new Date(Date.now() - 43200000 * 1).toISOString() }
    ]
});
