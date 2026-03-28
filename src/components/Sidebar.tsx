import { FileText, LayoutDashboard, Settings, UploadCloud } from "lucide-react";

export function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          Curator AI
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <a href="#" className="flex items-center gap-3 px-4 py-3 bg-indigo-600/20 text-indigo-400 rounded-xl font-medium">
          <LayoutDashboard size={20} />
          Dashboard
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-colors">
          <FileText size={20} />
          My Files
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-colors">
          <Settings size={20} />
          Settings
        </a>
      </nav>

      <div className="p-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Documents</h2>
        <div className="space-y-3">
          {["Q3_Strategy.pdf", "Financial_Report.docx", "Meeting_Notes.txt"].map((doc, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-400 hover:text-white cursor-pointer">
              <FileText size={16} />
              <span className="truncate">{doc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
