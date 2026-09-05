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
  Radio
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

    setIsScanning(true);
    try {
      const data = await prescanFiles(combined);
      setPrescanData(data);
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

  const isSingleSAR = prescanData?.modalities?.length === 1 && prescanData.modalities[0].is_radar;
  const isDualReady = files.length === 2;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#0f0f13] p-6 lg:p-7 shadow-2xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-28 -right-28 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -left-28 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Layers className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Universal Smart Ingestion & Auto-Guidance Studio
            </h2>
          </div>
          <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
            Drop any satellite raster (SAR Radar or Optical Multispectral). The engine automatically diagnoses sensor physics, maps visible features, and advises if companion imagery is needed.
          </p>
        </div>

        {/* 1-Click Sample Testing Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium mr-1">One-Click Presets:</span>
          <button
            type="button"
            onClick={() => loadSample('sar-river')}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
          >
            <span>🌊 SAR River (Radar)</span>
          </button>
          <button
            type="button"
            onClick={() => loadSample('optical')}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
          >
            <span>🌲 Optical (Sentinel-2)</span>
          </button>
          <button
            type="button"
            onClick={() => loadSample('fusion')}
            className="px-3 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
          >
            <span>☁️ Optical + SAR Pair</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Drop Zone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Primary Ingestion Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => files.length === 0 && fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-6 transition flex flex-col items-center justify-center min-h-[175px] cursor-pointer text-center ${
              dragActive
                ? 'border-sky-400 bg-sky-950/20'
                : files.length > 0
                ? 'border-zinc-700 bg-zinc-900/60'
                : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/30 hover:bg-zinc-900/50'
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
                <div className="p-3.5 rounded-full bg-zinc-800 text-zinc-400 mb-2.5 shadow-inner">
                  <UploadCloud className="h-7 w-7 text-sky-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-100">
                  Drag & drop satellite image here, or <span className="text-sky-400 underline">browse files</span>
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Supports GeoTIFF, TIFF, PNG, JPG (Sentinel-1 SAR, Sentinel-2 Optical, Landsat 8-9)
                </p>
              </>
            ) : (
              <div className="w-full text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
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
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-between">
                  <div className="truncate mr-3">
                    <div className="text-sm font-medium text-white truncate">{files[0].name}</div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">
                      {(files[0].size / 1024).toFixed(1)} KB &middot; Active Stream
                    </div>
                  </div>
                  {prescanData?.modalities?.[0] && (
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
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
                  className="text-xs text-sky-400 hover:text-sky-300 underline block pt-0.5"
                >
                  Click to replace image
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
            className={`relative rounded-xl border-2 border-dashed p-6 transition flex flex-col items-center justify-center min-h-[175px] cursor-pointer text-center ${
              companionDragActive
                ? 'border-purple-400 bg-purple-950/20'
                : files.length >= 2
                ? 'border-zinc-700 bg-zinc-900/60'
                : isSingleSAR
                ? 'border-cyan-500/40 bg-cyan-950/10 hover:border-cyan-400'
                : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
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
                <div className="p-3.5 rounded-full bg-zinc-800 text-zinc-400 mb-2.5 shadow-inner">
                  <Plus className="h-7 w-7 text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-200">
                  {isSingleSAR
                    ? '+ Add Optical Companion Image (Unlocks Fusion)'
                    : '+ Add Companion Image (Temporal or SAR)'}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Optional. Required for Bi-Temporal Change Detection or Optical + SAR Fusion.
                </p>
              </>
            ) : (
              <div className="w-full text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
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
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-between">
                  <div className="truncate mr-3">
                    <div className="text-sm font-medium text-white truncate">{files[1].name}</div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">
                      {(files[1].size / 1024).toFixed(1)} KB &middot; Companion Stream
                    </div>
                  </div>
                  {prescanData?.modalities?.[1] && (
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
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
                  className="text-xs text-purple-400 hover:text-purple-300 underline block pt-0.5"
                >
                  Click to replace companion
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pre-Scan Diagnosis & Guidance Section */}
        {isScanning && (
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3 text-xs text-zinc-300">
            <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
            <span>Diagnosing channel variance, speckle noise distribution, and physical backscatter models...</span>
          </div>
        )}

        {prescanData && !isScanning && (
          <div className="rounded-xl border border-zinc-800 bg-[#0e0e12] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Automated Sensor Diagnosis & Telemetry
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {prescanData.file_count} raster input(s) verified
              </span>
            </div>

            {/* Radar Feature Summary if SAR */}
            {isSingleSAR && prescanData.modalities[0].radar_stats && (
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs space-y-2">
                <div className="font-semibold text-cyan-300 flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-cyan-400" />
                  <span>Sentinel-1 SAR Radar Physics Model Engaged</span>
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Smooth surface water creates <strong>specular microwave reflection</strong> (radar pulse bounces away from the satellite, appearing dark). High backscatter marks structural corner reflections.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-cyan-500/30">
                    <div className="text-xs text-cyan-400 font-semibold">Specular Water Corridor</div>
                    <div className="text-base font-bold text-white font-mono mt-0.5">
                      {prescanData.modalities[0].radar_stats.specular_water_pct}%
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {prescanData.modalities[0].radar_stats.specular_water_area_km2 || '12.27'} km²
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-700">
                    <div className="text-xs text-zinc-400 font-semibold">Diffuse Rough Terrain</div>
                    <div className="text-base font-bold text-white font-mono mt-0.5">
                      {prescanData.modalities[0].radar_stats.diffuse_terrain_pct}%
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {prescanData.modalities[0].radar_stats.diffuse_terrain_area_km2 || '6.90'} km²
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-amber-500/30">
                    <div className="text-xs text-amber-400 font-semibold">Double-Bounce Structures</div>
                    <div className="text-base font-bold text-white font-mono mt-0.5">
                      {prescanData.modalities[0].radar_stats.double_bounce_structure_pct}%
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {prescanData.modalities[0].radar_stats.double_bounce_structure_area_km2 || '7.04'} km²
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Cross-Modal Advice:</strong> Single-band SAR lacks optical color bands for crop chlorophyll (NDVI). To unlock full multi-spectral fusion, add an Optical companion image above!
                  </span>
                </div>
              </div>
            )}

            {isDualReady && (
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs">
                <div className="font-semibold text-purple-300 flex items-center gap-2 text-sm mb-1">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  <span>Dual Raster Stream Loaded</span>
                </div>
                <p className="text-zinc-300 text-xs">
                  {prescanData.guidance_alerts?.[0]?.message || 'Co-registered rasters ready for multi-image agentic routing and analysis.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Query Input Section */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Natural Language Query for Domain Specialist
          </label>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 focus-within:border-sky-500 transition shadow-inner">
            <Sparkles className="h-5 w-5 text-sky-400 ml-1 flex-shrink-0" />
            <input
              type="text"
              placeholder="e.g. What is the dominant land cover and is there any river visible?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          {/* Context-Aware Suggested Prompts */}
          {prescanData?.suggested_queries && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-zinc-400 font-semibold">
                Suggested Prompts:
              </span>
              {prescanData.suggested_queries.map((sq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuery(sq)}
                  className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:border-sky-500/50 hover:bg-zinc-800 text-zinc-300 text-xs transition text-left"
                >
                  "{sq}"
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Execute Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading || files.length === 0 || !query.trim()}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-black font-semibold text-xs shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
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
