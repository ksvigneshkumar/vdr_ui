export const fetchQnAThreads = async (session, { activeDocId, activeFolderId }) => {
  return [
    {
      id: "qna-1",
      displayId: "Q-001",
      subject: "Question about Q3 Earnings",
      fileName: "Q3_Earnings_Report.pdf",
      creatorName: "Alice Smith",
      groupName: "External Auditors",
      documentOwnerName: "Bob Admin",
      status: "open",
      officialAnswer: null,
      createdAt: new Date().toISOString(),
      rawDate: new Date().toISOString(),
      isCreator: true,
      isDocOwner: false,
      isGroupMember: true,
      messages: [
        {
          id: "msg-1",
          authorName: "Alice Smith",
          role: "external_user",
          text: "Can you clarify the revenue figures on page 3?",
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: "qna-2",
      displayId: "Q-002",
      subject: "Missing signature",
      fileName: "Employee_Contracts.docx",
      creatorName: "Charlie Brown",
      groupName: "Legal Team",
      documentOwnerName: "Bob Admin",
      status: "answered",
      officialAnswer: "The signature was added in the revised version.",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      rawDate: new Date(Date.now() - 86400000).toISOString(),
      isCreator: false,
      isDocOwner: true,
      isGroupMember: false,
      messages: []
    }
  ];
};

export const createQuestionThread = async (session, { fileId, folderId, subject, description, attachmentFile }) => {
  console.log("Mock createQuestionThread:", { fileId, subject });
  return true;
};

export const submitSuggestedAnswer = async (session, { threadId, text, attachmentFile }) => {
  console.log("Mock submitSuggestedAnswer:", { threadId, text });
  return true;
};

export const publishOfficialAnswer = async (session, { threadId, answerText, attachmentFile, messageId }) => {
  console.log("Mock publishOfficialAnswer:", { threadId, answerText, messageId });
  return true;
};

export const setThreadStatus = async (session, threadId, newStatus) => {
  console.log("Mock setThreadStatus:", { threadId, newStatus });
  return true;
};

export const downloadAttachment = async (session, attachmentPath, fileName) => {
  console.log("Mock downloadAttachment:", { attachmentPath });
  return true;
};
