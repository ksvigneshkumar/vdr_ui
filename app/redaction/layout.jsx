import MainSidebar from "@/components/MainSidebar";
import RedactionSidebar from "@/components/redaction/RedactionSidebar";

export default function RedactionLayout({ children }) {
  return (
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-[#FAFBFD] font-sans pt-16 md:pt-0">
      {/* 1) Main Global Sidebar */}
      <MainSidebar />

      {/* 2) Redaction Secondary Sidebar */}
      <RedactionSidebar />

      {/* 3) Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
