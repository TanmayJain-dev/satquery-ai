import React, { useState } from 'react';
import { Layers, Eye, Sliders, Maximize2, SplitSquareHorizontal } from 'lucide-react';

export default function ImageCanvas({ result, scenario }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [activeLayer, setActiveLayer] = useState('overlay'); // 'overlay', 't1', 't2', 'sar', 'optical'

  if (!result || !result.results) {
    return (
      <div className="h-[440px] rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 flex flex-col items-center justify-center text-zinc-500">
        <Layers className="h-10 w-10 stroke-1 mb-2 text-zinc-600" />
        <p className="text-sm">Select an SIH Scenario above or upload satellite imagery to begin</p>
      </div>
    );
  }

  const { task, results } = result;
  const isTemporal = task === 'TEMPORAL_CHANGE' || task === 'CHANGE_VQA';
  const isFusion = task === 'OPTICAL_SAR_FUSION';
  const isGrounding = task === 'GROUNDING';

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden flex flex-col">
      {/* Top Canvas Toolbar */}
      <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-200">Interactive Canvas</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono">
            {task}
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 text-xs">
          {isTemporal && (
            <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
              <SplitSquareHorizontal className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-[11px] text-zinc-400">Swipe Split Slider Active</span>
            </div>
          )}
          {isFusion && (
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded border border-zinc-800">
              <button
                onClick={() => setActiveLayer('optical')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  activeLayer === 'optical' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Optical
              </button>
              <button
                onClick={() => setActiveLayer('sar')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  activeLayer === 'sar' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                SAR (Radar)
              </button>
              <button
                onClick={() => setActiveLayer('overlay')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  activeLayer === 'overlay' ? 'bg-sky-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Fused Output
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative h-[420px] w-full flex items-center justify-center bg-black/40 overflow-hidden select-none">
        {/* Temporal Split-Slider View */}
        {isTemporal && results.t1_url && results.change_heatmap_url ? (
          <div className="relative w-full h-full max-w-[512px] max-h-[420px] mx-auto overflow-hidden">
            {/* Base T1 Image (Left side) */}
            <img
              src={results.t1_url}
              alt="T1 Baseline"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
            {/* T2 / Change Heatmap Overlay (Right side with clip-path) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
            >
              <img
                src={results.change_heatmap_url}
                alt="Change Heatmap"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Interactive Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-sky-400 shadow-lg cursor-ew-resize z-20"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-md">
                ⇄
              </div>
            </div>
            {/* Range Slider for Interaction */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
            />
            {/* Labels */}
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded text-[11px] font-mono text-zinc-300 border border-white/10 z-10">
              T1 (Baseline)
            </div>
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded text-[11px] font-mono text-sky-400 border border-sky-500/30 z-10">
              T2 (Change Heatmap)
            </div>
          </div>
        ) : isFusion ? (
          /* Optical + SAR Fusion View */
          <div className="relative w-full h-full max-w-[512px] max-h-[420px] mx-auto flex items-center justify-center">
            <img
              src={
                activeLayer === 'optical'
                  ? results.optical_url
                  : activeLayer === 'sar'
                  ? results.sar_url
                  : results.fused_url
              }
              alt="Fusion Layer"
              className="w-full h-full object-contain transition-opacity duration-200"
            />
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded text-[11px] font-mono text-zinc-300 border border-white/10">
              Layer: {activeLayer.toUpperCase()}
            </div>
          </div>
        ) : isGrounding && results.annotated_url ? (
          /* Grounding with Bounding Boxes */
          <div className="relative w-full h-full max-w-[512px] max-h-[420px] mx-auto flex items-center justify-center">
            <img
              src={results.annotated_url}
              alt="Grounding Annotations"
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded text-[11px] font-mono text-sky-400 border border-sky-500/30">
              {results.detected_count} Target(s) Bounded
            </div>
          </div>
        ) : (
          /* Standard Single VQA Optical View */
          <div className="relative w-full h-full max-w-[512px] max-h-[420px] mx-auto flex items-center justify-center">
            <img
              src={results.overlay_url}
              alt="Analyzed Scene"
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
