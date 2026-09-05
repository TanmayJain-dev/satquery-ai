import React from 'react';
import { Terminal, CheckCircle2 } from 'lucide-react';

export default function AgentTraceLog({ trace, duration }) {
  if (!trace || trace.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#0c0c0e] p-4 flex flex-col items-center justify-center text-zinc-500 h-[220px]">
        <Terminal className="h-6 w-6 stroke-1 mb-2 text-zinc-600" />
        <span className="text-xs">Agent execution logs will appear here during analysis</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden flex flex-col h-[260px]">
      <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-zinc-200">Observable Agentic Trace</span>
          <span className="text-[10px] text-zinc-500 font-mono">({trace.length} steps)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          <span>Completed in {duration}ms</span>
        </div>
      </div>

      <div className="p-3 font-mono text-[11px] overflow-y-auto space-y-2 flex-1 select-text">
        {trace.map((step) => {
          let badgeColor = 'text-zinc-400 border-zinc-800 bg-zinc-900';
          if (step.stage === 'CLASSIFY') badgeColor = 'text-purple-400 border-purple-500/20 bg-purple-500/10';
          if (step.stage === 'VALIDATE') badgeColor = 'text-amber-400 border-amber-500/20 bg-amber-500/10';
          if (step.stage === 'DISPATCH' || step.stage === 'COMPUTE') badgeColor = 'text-sky-400 border-sky-500/20 bg-sky-500/10';
          if (step.stage === 'CONFIDENCE') badgeColor = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
          if (step.stage === 'REPORT') badgeColor = 'text-pink-400 border-pink-500/20 bg-pink-500/10';

          return (
            <div key={step.step_id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-zinc-600 shrink-0">+{step.timestamp_ms}ms</span>
              <span className={`px-1.5 py-0.2 rounded border text-[10px] font-semibold tracking-wide shrink-0 ${badgeColor}`}>
                {step.stage}
              </span>
              <span className="text-zinc-300">{step.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
