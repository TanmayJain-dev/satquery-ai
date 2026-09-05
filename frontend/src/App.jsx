import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, Send, UploadCloud, Loader2, AlertCircle } from 'lucide-react';

import Header from './components/Header';
import DemoPresetBar from './components/DemoPresetBar';
import ImageCanvas from './components/ImageCanvas';
import AgentTraceLog from './components/AgentTraceLog';
import ResultInspector from './components/ResultInspector';
import UploadModal from './components/UploadModal';

import { fetchHealth, fetchDemos, runDemoScenario, analyzeCustomQuery } from './api/client';

export default function App() {
  const [activeDemoId, setActiveDemoId] = useState('demo-1');
  const [customQuery, setCustomQuery] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Queries
  const { data: health } = useQuery({ queryKey: ['health'], queryFn: fetchHealth });
  const { data: demosData } = useQuery({ queryKey: ['demos'], queryFn: fetchDemos });

  const demos = demosData?.demos || [];

  // Mutation for running preset demo
  const demoMutation = useMutation({
    mutationFn: runDemoScenario,
    onSuccess: (data) => {
      setCurrentResult(data);
    },
  });

  // Mutation for custom analysis
  const customMutation = useMutation({
    mutationFn: ({ query, files }) => analyzeCustomQuery(query, files),
    onSuccess: (data) => {
      setCurrentResult(data);
    },
  });

  const isLoading = demoMutation.isPending || customMutation.isPending;

  // Auto-run Demo 1 on initial load so the user immediately sees a working prototype!
  useEffect(() => {
    if (demos.length > 0 && !currentResult && !demoMutation.isPending) {
      demoMutation.mutate('demo-1');
    }
  }, [demos.length]);

  const handleSelectDemo = (demoId) => {
    setActiveDemoId(demoId);
    demoMutation.mutate(demoId);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    // If the user types a custom question while viewing the current demo image, re-run with active demo
    if (activeDemoId) {
      // Run with demo images
      demoMutation.mutate(activeDemoId);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      <Header health={health} />

      {/* 1-Click SIH Preset Bar */}
      <DemoPresetBar
        demos={demos}
        activeDemoId={activeDemoId}
        onSelectDemo={handleSelectDemo}
        isLoading={isLoading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Natural Language Query Bar */}
        <div className="bg-[#121215] border border-zinc-800 p-2.5 rounded-2xl flex items-center gap-3 shadow-xl shadow-black/40">
          <div className="pl-3 text-sky-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder={
              currentResult?.query
                ? `Active query: "${currentResult.query}" (type to modify)`
                : "Ask SatQuery AI about satellite imagery (e.g. 'Describe land cover' or 'Highlight water bodies')..."
            }
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition"
          >
            <UploadCloud className="h-4 w-4 text-zinc-400" />
            <span className="hidden sm:inline">Upload Custom Imagery</span>
          </button>
          <button
            onClick={handleCustomSubmit}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-semibold shadow-md shadow-sky-500/20 transition disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Run Query</span>
          </button>
        </div>

        {/* Loading Banner */}
        {isLoading && (
          <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30 flex items-center gap-3 text-sky-300 text-xs animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
            <span>Agentic Orchestrator active: classifying query, validating rasters, and extracting spatial evidence...</span>
          </div>
        )}

        {/* Primary Split View: Canvas on Left, Insights & Logs on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Image Canvas (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <ImageCanvas result={currentResult} />
            <AgentTraceLog
              trace={currentResult?.trace || []}
              duration={currentResult?.duration_ms || 0}
            />
          </div>

          {/* Right Column: Result Inspector & Evidence Audit (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <ResultInspector result={currentResult} />
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={(query, files) => customMutation.mutate({ query, files })}
        isLoading={customMutation.isPending}
      />
    </div>
  );
}
