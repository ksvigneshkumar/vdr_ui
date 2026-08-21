import MainSidebar from '@/components/MainSidebar';
import GroupsLayoutWrapper from '../../components/groups/GroupsLayoutWrapper';

export default function GroupsLayout({ children }) {
  return (
    <div className="h-screen w-full bg-white flex overflow-hidden font-sans">
      <MainSidebar />
      <GroupsLayoutWrapper>
        {children}
      </GroupsLayoutWrapper>
    </div>
  );
}