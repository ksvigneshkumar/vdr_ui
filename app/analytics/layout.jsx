import MainSidebar from '@/components/MainSidebar';
import AnalyticsLayoutWrapper from '@/components/analytics/AnalyticsLayoutWrapper';

export default function AnalyticsLayout({ children }) {
  return (
    <div className="h-[100dvh] w-full bg-white flex overflow-hidden font-sans">
      <MainSidebar />
      <AnalyticsLayoutWrapper>
        {children}
      </AnalyticsLayoutWrapper>
    </div>
  );
}
