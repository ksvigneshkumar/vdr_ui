import MainSidebar from "@/components/MainSidebar";

export default function QALayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFBFD]">
      {/* Main Global Sidebar */}
      <MainSidebar />

      {/* Main Content Area (which contains the QA secondary sidebar & table) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
