import { FiFolder, FiSettings, FiUsers, FiBarChart2, FiCheckSquare, FiShield, FiEdit3, FiMessageCircle } from 'react-icons/fi';

export const NAV_ITEMS = [
  { key: 'analytics', href: '/analytics', label: 'Analytics', icon: <img src="/an.png" alt="Analytics" className="w-[20px] h-[20px] object-contain opacity-80 group-hover:opacity-100" /> },
  { key: 'documents', href: '/documents', label: 'Documents', icon: <img src="/files.png" alt="Documents" className="w-[20px] h-[20px] object-contain opacity-80 group-hover:opacity-100" /> },
  { key: 'groups', href: '/groups', label: 'Groups', icon: <img src="/group.jpeg" alt="Groups" className="w-[20px] h-[20px] object-contain opacity-80 group-hover:opacity-100" /> },
  { key: 'redaction', href: '/redaction/documents', label: 'Redaction', icon: <img src="/red.png" alt="Redaction" className="w-[20px] h-[20px] object-contain opacity-80 group-hover:opacity-100" /> },
  { key: 'teams', href: '/teams/manage-admin', label: 'Teams', icon: <img src="/teams.png" alt="Teams" className="w-[20px] h-[20px] object-contain opacity-80 group-hover:opacity-100" /> },
  { key: 'settings', href: '/settings', label: 'Settings', icon: <img src="/settings.png" alt="Settings" className="w-[20px] h-[20px] object-contain opacity-80 group-hover:opacity-100" /> },
  { key: 'qa', href: '/qa', label: 'Q&A', icon: <img src="/qa.png" alt="Q&A" className="w-[20px] h-[20px] object-contain opacity-80 group-hover:opacity-100" /> }
];
