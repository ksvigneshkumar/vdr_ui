import MainSidebar from "@/components/MainSidebar";
import RedactionSidebar from "@/components/redaction/RedactionSidebar";

export default function RedactionLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFBFD]">
      {/* 1) Main Global Sidebar */}
      <MainSidebar />

      {/* 2) Redaction Secondary Sidebar */}
      <RedactionSidebar />

      {/* 3) Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
