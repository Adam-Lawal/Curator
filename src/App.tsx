/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { UploadZone } from "./components/UploadZone";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { StatsRow } from "./components/StatsRow";

export default function App() {
  const [analysisData, setAnalysisData] = useState<any>(null);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {analysisData ? "Analysis Results" : "Dashboard"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {analysisData ? `Viewing analysis for ${analysisData.filename}` : "Welcome back to Curator AI"}
            </p>
          </div>
          
          {analysisData && (
            <button 
              onClick={() => setAnalysisData(null)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              Upload New File
            </button>
          )}
        </header>

        {analysisData ? (
          <div className="space-y-6">
            <ResultsDashboard data={analysisData} />
            <StatsRow data={analysisData} />
          </div>
        ) : (
          <UploadZone onUploadComplete={setAnalysisData} />
        )}
      </main>
    </div>
  );
}
