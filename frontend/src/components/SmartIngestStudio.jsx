import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Info, 
  ArrowRight, 
  Plus, 
  X, 
  Loader2, 
  Radio,
  Eye
} from 'lucide-react';
import { prescanFiles } from '../api/client';

export default function SmartIngestStudio({ onAnalyze, isLoading }) {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [prescanData, setPrescanData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [companionDragActive, setCompanionDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const companionInputRef = useRef(null);

  const handleFiles = async (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;
    const combined = [...files, ...Array.from(newFiles)].slice(0, 2);
    setFiles(combined);

    // Trigger instant pre-scan
    setIsScanning(true);
    try {
      const data = await prescanFiles(combined);
      setPrescanData(data);
      // If no query yet and suggestions available, set the first suggested query
      if (!query && data.suggested_queries && data.suggested_queries.length > 0) {
        setQuery(data.suggested_queries[0]);
      }
    } catch (err) {
      console.error('Prescan failed', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleCompanionDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCompanionDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (idx) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    if (updated.length > 0) {
      handleFiles(updated);
    } else {
      setPrescanData(null);
    }
  };

  const loadSample = async (type) => {
    setIsScanning(true);
    try {
      let fileNames = [];
      let sampleQuery = '';
      if (type === 'sar-river') {
        fileNames = ['sar_fusion.png'];
        sampleQuery = 'What is the dominant land cover and is there any river visible?';
      } else if (type === 'optical') {
        fileNames = ['optical_single.png'];
        sampleQuery = 'Describe the land-cover and major objects visible in this image.';
      } else if (type === 'fusion') {
        fileNames = ['optical_fusion.png', 'sar_fusion.png'];
        sampleQuery = 'Use optical and SAR images together to identify built-up and water through cloud cover.';
      } else if (type === 'temporal') {
        fileNames = ['temporal_t1.png', 'temporal_t2.png'];
        sampleQuery = 'What changed between these two dates, and where did the change occur?';
      }

      // Fetch sample images as Blobs and create File objects
      const fetchedFiles = await Promise.all(
        fileNames.map(async (name) => {
          const res = await fetch(`/samples/${name}`);
          const blob = await res.blob();
          return new File([blob], name, { type: 'image/png' });
        })
      );

      setFiles(fetchedFiles);
      setQuery(sampleQuery);
      const data = await prescanFiles(fetchedFiles);
      setPrescanData(data);
    } catch (err) {
      console.error('Failed to load sample', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length === 0 || !query.trim()) return;
    onAnalyze(query, files);
  };

  // Modality state
  const isSingleSAR = prescanData?.modalities?.length === 1 && prescanData.modalities[0].is_radar;
  const isSingleOptical = prescanData?.modalities?.length === 1 && !prescanData.modalities[0].is_radar;
  const isDualReady = files.length === 2;

  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-[#141418] to-[#0c0c0e] p-6 shadow-2xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Layers className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Universal Smart Ingestion & Auto-Guidance Pipeline
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Drop any satellite raster (SAR Radar or Optical Multispectral). The engine auto-detects sensor physics, maps features, and advises if companion imagery is needed.
          </p>
        </div>

        {/* 1-Click Sample Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-zinc-500 font-medium mr-1">Quick Test:</span>
          <button
            onClick={() => loadSample('sar-river')}
            className="px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium transition flex items-center gap-1"
          >
            <span>🌊 SAR River (Radar)</span>
          </button>
          <button
            onClick={() => loadSample('optical')}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition flex items-center gap-1"
          >
            <span>🌲 Optical (Sentinel-2)</span>
          </button>
          <button
            onClick={() => loadSample('fusion')}
            className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[11px] font-medium transition flex items-center gap-1"
          >
            <span>☁️ Optical + SAR Pair</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* Drop Zone Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Upload / File #1 */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => files.length === 0 && fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-6 transition flex flex-col items-center justify-center min-h-[160px] cursor-pointer text-center ${
              dragActive
                ? 'border-sky-400 bg-sky-950/20'
                : files.length > 0
                ? 'border-zinc-700/80 bg-zinc-900/50'
                : 'border-zinc-700/60 hover:border-zinc-500 bg-zinc-900/20 hover:bg-zinc-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".tif,.tiff,.png,.jpg,.jpeg"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />

            {files.length === 0 ? (
              <>
                <div className="p-3 rounded-full bg-zinc-800/80 text-zinc-400 mb-2">
                  <UploadCloud className="h-6 w-6 text-sky-400" />
                </div>
                <p className="text-xs font-medium text-zinc-200">
                  Drag & drop your satellite image here, or <span className="text-sky-400 underline">browse</span>
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Supports GeoTIFF, TIFF, PNG, JPG (Sentinel-1 SAR, Sentinel-2 Optical, Landsat)
                </p>
              </>
            ) : (
              <div className="w-full text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Primary Satellite Ingestion
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(0);
                    }}
                    className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <div className="text-xs font-medium text-white truncate">{files[0].name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {(files[0].size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  {prescanData?.modalities?.[0] && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        prescanData.modalities[0].is_radar
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {prescanData.modalities[0].is_radar ? '🛰️ SAR Radar' : '🛰️ Optical MSI'}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-sky-400 hover:text-sky-300 underline block pt-1"
                >
                  Replace image
                </button>
              </div>
            )}
          </div>

          {/* Secondary / Companion Slot */}
          <div
            onDragEnter={(e) => { e.preventDefault(); setCompanionDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setCompanionDragActive(false); }}
            onDragOver={(e) => { e.preventDefault(); setCompanionDragActive(true); }}
            onDrop={handleCompanionDrop}
            onClick={() => companionInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-6 transition flex flex-col items-center justify-center min-h-[160px] cursor-pointer text-center ${
              companionDragActive
                ? 'border-purple-400 bg-purple-950/20'
                : files.length >= 2
                ? 'border-zinc-700/80 bg-zinc-900/50'
                : isSingleSAR
                ? 'border-cyan-500/40 bg-cyan-950/10 hover:border-cyan-400'
                : 'border-zinc-800 bg-zinc-950/30 hover:border-zinc-700'
            }`}
          >
            <input
              ref={companionInputRef}
              type="file"
              accept=".tif,.tiff,.png,.jpg,.jpeg"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />

            {files.length < 2 ? (
              <>
                <div className="p-3 rounded-full bg-zinc-800/80 text-zinc-400 mb-2">
                  <Plus className="h-6 w-6 text-purple-400" />
                </div>
                <p className="text-xs font-medium text-zinc-300">
                  {isSingleSAR
                    ? '+ Add Optical Companion Image (Unlocks Fusion)'
                    : '+ Add Companion Image (Temporal or SAR)'}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Optional. Required for Bi-Temporal Change Detection or Cross-Modal Optical+SAR Fusion.
                </p>
              </>
            ) : (
              <div className="w-full text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-400" />
                    Companion Satellite Image #2
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(1);
                    }}
                    className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <div className="text-xs font-medium text-white truncate">{files[1].name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {(files[1].size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  {prescanData?.modalities?.[1] && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        prescanData.modalities[1].is_radar
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      }`}
                    >
                      {prescanData.modalities[1].is_radar ? '🛰️ SAR Radar' : '🛰️ Optical MSI'}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => companionInputRef.current?.click()}
                  className="text-[11px] text-purple-400 hover:text-purple-300 underline block pt-1"
                >
                  Replace companion
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Intelligent Pre-Scan & Guidance Banner */}
        {isScanning && (
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2 text-xs text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
            <span>Diagnosing sensor spectrum, variance, and physical backscatter...</span>
          </div>
        )}

        {prescanData && !isScanning && (
          <div className="rounded-xl border border-zinc-800 bg-[#0e0e11] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-zinc-200">
                  Sensor Diagnosis & Spatial Intelligence
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                {prescanData.file_count} stream(s) validated
              </span>
            </div>

            {/* Radar Feature Summary if SAR */}
            {isSingleSAR && prescanData.modalities[0].radar_stats && (
              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-xs space-y-1.5">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-cyan-400" />
                  <span>Sentinel-1 SAR Radar Physics Model Activated</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Calm surface water produces <strong>specular microwave reflection</strong> (radar bounces away from the sensor, appearing dark). High backscatter signifies urban structural double-bounce.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded bg-zinc-900/60 border border-cyan-500/20">
                    <div className="text-[10px] text-cyan-400 font-medium">Specular Water / River</div>
                    <div className="text-sm font-bold text-white font-mono">
                      {prescanData.modalities[0].radar_stats.specular_water_pct}%
                    </div>
                  </div>
                  <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400 font-medium">Diffuse Terrain/Roughness</div>
                    <div className="text-sm font-bold text-white font-mono">
                      {prescanData.modalities[0].radar_stats.diffuse_terrain_pct}%
                    </div>
                  </div>
                  <div className="p-2 rounded bg-zinc-900/60 border border-amber-500/20">
                    <div className="text-[10px] text-amber-400 font-medium">Double-Bounce Structures</div>
                    <div className="text-sm font-bold text-white font-mono">
                      {prescanData.modalities[0].radar_stats.double_bounce_structure_pct}%
                    </div>
                  </div>
                </div>

                {/* Missing Modality Advice */}
                <div className="mt-2 pt-2 border-t border-cyan-500/20 text-[11px] text-cyan-200 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Cross-Modal Tip:</strong> Single-band SAR lacks multispectral optical bands (Red/NIR) to compute chlorophyll indices (NDVI) or crop health. To unlock 100% full multi-spectral fusion, drop an Optical companion image above!
                  </span>
                </div>
              </div>
            )}

            {/* If 2 Images (Fusion or Change) */}
            {isDualReady && (
              <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/30 text-xs">
                <div className="font-semibold text-purple-300 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  <span>Dual Raster Stream Loaded</span>
                </div>
                <p className="text-zinc-300 text-[11px]">
                  {prescanData.guidance_alerts?.[0]?.message || 'Ready for multi-image agentic routing and analysis.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Query Input Box */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300">
            Natural Language Query for Domain Specialist
          </label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-800 focus-within:border-sky-500 transition shadow-inner">
            <Sparkles className="h-4 w-4 text-sky-400 ml-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="e.g. What is the dominant land cover and is there any river visible?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none px-2"
            />
          </div>

          {/* Suggested Context Pills */}
          {prescanData?.suggested_queries && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold py-1">
                Suggested Prompts:
              </span>
              {prescanData.suggested_queries.map((sq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuery(sq)}
                  className="px-2 py-0.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] transition text-left"
                >
                  "{sq}"
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submit Execution Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading || files.length === 0 || !query.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-black font-semibold text-xs shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Executing Agent Pipeline...</span>
              </>
            ) : (
              <>
                <span>Run SatQuery AI Agent</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
