import MainSidebar from "@/components/MainSidebar";

export default function QALayout({ children }) {
  return (
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-[#FAFBFD] font-sans pt-16 md:pt-0">
      {/* Main Global Sidebar */}
      <MainSidebar />

      {/* Main Content Area (which contains the QA secondary sidebar & table) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
