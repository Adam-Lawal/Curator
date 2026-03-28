import React, { useState } from "react";
import { Send, FileText, Sparkles, MessageSquare, BarChart2 } from "lucide-react";

interface ResultsDashboardProps {
  data: any;
}

export function ResultsDashboard({ data }: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState("summary");
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setQuery("");
    setChatHistory((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsTyping(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_query: userMessage,
          context: data.originalText || data.narrativeOverview 
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const chatData = await res.json();
      
      if (!res.ok) {
        throw new Error(chatData.error || "Failed to get response");
      }
      
      setChatHistory((prev) => [...prev, { role: "ai", text: chatData.response }]);
    } catch (error: any) {
      if (error.name === "AbortError") {
        setChatHistory((prev) => [...prev, { role: "ai", text: "Error: The request timed out after 30 seconds. Please try again." }]);
      } else {
        setChatHistory((prev) => [...prev, { role: "ai", text: `Error: ${error.message || "Could not connect to AI."}` }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)]">
      {/* Left Card: Original Document */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <FileText className="text-gray-400" size={20} />
          <h3 className="font-semibold text-gray-800 truncate">{data.filename || "Original Document"}</h3>
        </div>
        <div className="p-6 overflow-y-auto flex-1 text-gray-600 leading-relaxed text-sm">
          {data.originalText || "Document text not available."}
        </div>
      </div>

      {/* Right Card: Analysis & Chat */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden relative">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              activeTab === "summary" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Sparkles size={16} />
            AI Summary
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              activeTab === "analysis" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <BarChart2 size={16} />
            Deep Analysis
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 pb-24">
          {activeTab === "summary" ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Key Takeaways</h4>
                <ul className="space-y-3">
                  {data.summaryBullets?.map((bullet: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Narrative Overview</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{data.narrativeOverview}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">Sentiment Analysis</h4>
                <p className="text-sm text-gray-600">The document exhibits a <strong className="text-indigo-600">{data.sentiment}</strong> tone overall.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">Entity Extraction</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Strategy", "Q3", "Enterprise", "Growth"].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare size={16} />
                Q&A History
              </h4>
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user" ? "bg-indigo-600 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Chat Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleChatSubmit} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask AI about this document..."
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!query.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
