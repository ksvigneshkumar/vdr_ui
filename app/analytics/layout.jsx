import MainSidebar from '@/components/MainSidebar';
import AnalyticsLayoutWrapper from '@/components/analytics/AnalyticsLayoutWrapper';

export default function AnalyticsLayout({ children }) {
  return (
    <div className="h-screen w-full bg-white flex overflow-hidden font-sans">
      <MainSidebar />
      <AnalyticsLayoutWrapper>
        {children}
      </AnalyticsLayoutWrapper>
    </div>
  );
}
