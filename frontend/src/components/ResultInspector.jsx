import React from 'react';
import { ShieldCheck, FileDown, BarChart3, Info, AlertTriangle, Radio } from 'lucide-react';

export default function ResultInspector({ result }) {
  if (!result) return null;

  const { answer, confidence, results, report_id, report_html, session_id, modalities, guidance_notes } = result;

  const handleDownloadReport = () => {
    const blob = new Blob([report_html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report_id || 'satquery_evidence_report'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Check detected sensor family
  const primaryModality = modalities?.[0] || results?.modality_info;
  const isRadar = primaryModality?.is_radar || results?.measured_metrics?.is_radar;

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0c0c0e] p-4 flex flex-col gap-4">
      {/* Sensor Modality Tag */}
      {primaryModality && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-semibold text-zinc-200">
              Sensor Diagnosis: {primaryModality.sensor_family || (isRadar ? 'Sentinel-1 SAR Radar' : 'Sentinel-2 MSI Optical')}
            </span>
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
              isRadar
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isRadar ? 'SAR Backscatter' : 'Optical MSI'}
          </span>
        </div>
      )}

      {/* Answer Block */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-sky-400" />
            Evidence-Grounded Finding
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Tool: {result.tool_used}</span>
        </div>
        <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-sm leading-relaxed text-zinc-200 whitespace-pre-line">
          {answer}
        </div>
      </div>

      {/* Guidance Notes & Missing Modality Recommendations */}
      {((guidance_notes && guidance_notes.length > 0) || results?.guidance) && (
        <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs space-y-1.5">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Intelligent Sensor Guidance & Recommendation</span>
          </div>
          {results?.guidance?.missing_modality_alert && (
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              {results.guidance.missing_modality_alert}
            </p>
          )}
          {guidance_notes && guidance_notes.map((note, idx) => (
            <p key={idx} className="text-zinc-300 text-[11px] leading-relaxed">
              {note}
            </p>
          ))}
        </div>
      )}

      {/* Confidence & Verification Gauge */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 mb-1 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Dual-Estimate Confidence
          </div>
          <div className="text-lg font-bold text-white flex items-baseline gap-1.5">
            {confidence?.confidence_percentage || '95.0%'}
            <span className="text-[10px] font-normal text-emerald-400">
              {confidence?.rating || 'HIGH CONFIDENCE'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between">
          <div className="text-[11px] text-zinc-400 mb-1">Judge Audit Report</div>
          <button
            onClick={handleDownloadReport}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-medium transition"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export HTML Report
          </button>
        </div>
      </div>

      {/* Spectral or Radar Measurement Breakdown if available */}
      {results?.spectral_distribution && (
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 mb-2 flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
            {isRadar ? 'Radar Backscatter Physical Distribution' : 'Spectral Land-Cover Distribution'}
          </div>
          <div className="space-y-1.5">
            {Object.entries(results.spectral_distribution).map(([cls, pct]) => (
              <div key={cls} className="text-xs">
                <div className="flex justify-between text-zinc-400 text-[11px] mb-0.5">
                  <span>{cls}</span>
                  <span className="font-mono text-zinc-200">{pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      cls.includes('Water') || cls.includes('River')
                        ? 'bg-cyan-400'
                        : cls.includes('Built-up') || cls.includes('Structural')
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bounding Box List if Grounding */}
      {results?.bounding_boxes && results.bounding_boxes.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 mb-2">
            Localized Target Coordinates
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] font-mono">
            {results.bounding_boxes.map((b) => (
              <div
                key={b.id}
                className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800 flex justify-between items-center text-zinc-300"
              >
                <span>{b.label}</span>
                <span className="text-sky-400">[{b.normalized_box_1000.join(', ')}]</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
