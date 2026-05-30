"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Weight, CheckSquare, Upload, ChevronDown, ChevronUp, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { addWeightEntry, addActivityEntry } from "@/lib/data-service";
import * as FitDecoderModule from "fit-decoder";
import dynamic from "next/dynamic";

const ActivitySummaryModal = dynamic(() => import("@/components/ActivitySummaryModal"), { ssr: false });

interface Segment { id: number; distanceRange: string; pace: string; speed: string; }
interface GPSPoint { lat: number; lng: number; }
interface ActivitySummary { totalDistance: number; totalTime: number; avgPace: string; avgSpeed: string; path: GPSPoint[]; date: string; }
interface AddEntryModalProps { isOpen: boolean; onClose: () => void; }

export function AddEntryModal({ isOpen, onClose }: AddEntryModalProps) {
  const router = useRouter();
  const [type, setType] = useState<"weight" | "activity" | "suunto">("weight");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => { setError(null); }, [isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const rawData = FitDecoderModule.fit2json(buffer);
      const data = FitDecoderModule.parseRecords(rawData);
      const allMessages = data.records || [];
      const records = allMessages.filter((m: any) => m.type === "record").map((m: any) => m.data);
      const sessions = allMessages.filter((m: any) => m.type === "session").map((m: any) => m.data);
      const session = sessions[0] || {};
      if (records.length === 0) { alert("No GPX records found in this FIT file."); setLoading(false); return; }

      const calculatedSegments: Segment[] = [];
      const path: GPSPoint[] = [];
      let segmentStartTime: number | null = null;
      let segmentStartDistance = 0;
      let segmentId = 1;
      const firstRecord = records[0];
      const lastRecord = records[records.length - 1];
      let totalTimeMs = 0;
      if (firstRecord?.timestamp && lastRecord?.timestamp) {
        const start = new Date(firstRecord.timestamp).getTime();
        const end = new Date(lastRecord.timestamp).getTime();
        if (!isNaN(start) && !isNaN(end)) totalTimeMs = end - start;
      }
      const totalDistance = session.total_distance || lastRecord.distance || lastRecord.total_distance || 0;
      const sessionTotalTime = session.total_timer_time || session.total_elapsed_time || totalTimeMs / 1000;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const distance = record.distance ?? record.total_distance;
        const timestamp = record.timestamp;
        const { position_lat, position_long } = record;
        if (distance === undefined || timestamp === undefined) continue;
        if (position_lat !== undefined && position_long !== undefined) {
          const lat = Math.abs(position_lat) > 180 ? position_lat * (180 / Math.pow(2, 31)) : position_lat;
          const lng = Math.abs(position_long) > 180 ? position_long * (180 / Math.pow(2, 31)) : position_long;
          path.push({ lat, lng });
        }
        if (segmentStartTime === null) { segmentStartTime = new Date(timestamp).getTime(); segmentStartDistance = distance; }
        const distanceInSegment = distance - segmentStartDistance;
        if (distanceInSegment >= 100) {
          const currentTime = new Date(timestamp).getTime();
          const timeElapsedMs = currentTime - segmentStartTime;
          if (timeElapsedMs > 0) {
            const timeSeconds = timeElapsedMs / 1000;
            const speedKmh = ((distanceInSegment / timeSeconds) * 3.6).toFixed(1);
            const paceMinPerKm = ((timeSeconds / distanceInSegment) * 1000) / 60;
            const paceMin = Math.floor(paceMinPerKm);
            const paceSec = Math.round((paceMinPerKm - paceMin) * 60);
            calculatedSegments.push({ id: segmentId++, distanceRange: `${Math.round(segmentStartDistance)}m – ${Math.round(distance)}m`, pace: `${paceMin}:${paceSec.toString().padStart(2, "0")}`, speed: speedKmh });
          }
          segmentStartTime = new Date(timestamp).getTime();
          segmentStartDistance = distance;
        }
      }

      const avgPaceMinPerKm = ((sessionTotalTime / totalDistance) * 1000) / 60;
      const avgPaceMin = Math.floor(avgPaceMinPerKm);
      const avgPaceSec = Math.round((avgPaceMinPerKm - avgPaceMin) * 60);
      const activitySummary: ActivitySummary = {
        totalDistance, totalTime: sessionTotalTime,
        avgPace: totalDistance > 0 && sessionTotalTime > 0 ? `${avgPaceMin}:${avgPaceSec.toString().padStart(2, "0")}` : "0:00",
        avgSpeed: sessionTotalTime > 0 ? ((totalDistance / sessionTotalTime) * 3.6).toFixed(1) : "0.0",
        path, date: firstRecord?.timestamp || new Date().toISOString(),
      };
      localStorage.setItem("stridestack_last_activity", JSON.stringify({ summary: activitySummary, segments: calculatedSegments }));
      setSegments(calculatedSegments);
      setSummary(activitySummary);
      setShowSummary(true);
    } catch (error: any) {
      alert(`Failed to parse FIT file: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const labelClass = "block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5";
  const tabBase = "flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors";
  const tabActive = "bg-surface-raised text-foreground";
  const tabInactive = "text-muted hover:text-foreground";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-black/75">
      <div className="w-full max-w-md bg-background p-6 border-t border-border sm:border sm:border-border animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 fade-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl uppercase text-foreground">Add Entry</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-muted hover:text-foreground transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Type switcher */}
        <div className="flex border border-border mb-6">
          <button onClick={() => setType("weight")} className={cn(tabBase, type === "weight" ? tabActive : tabInactive)}>
            <Weight size={15} /> Weight
          </button>
          <button onClick={() => setType("activity")} className={cn(tabBase, "border-l border-border", type === "activity" ? tabActive : tabInactive)}>
            <CheckSquare size={15} /> Sport
          </button>
          <button onClick={() => setType("suunto")} className={cn(tabBase, "border-l border-border", type === "suunto" ? tabActive : tabInactive)}>
            <Upload size={15} /> Suunto
          </button>
        </div>

        {/* Weight form */}
        {type === "weight" ? (
          <form className="space-y-4" action={async (formData) => {
            setError(null);
            const weight = parseFloat(formData.get("weight") as string);
            const date = formData.get("date") as string;
            if (!weight || isNaN(weight) || weight <= 0) { setError("Please enter a valid weight."); return; }
            const result = await addWeightEntry(weight, date);
            if (result && !result.success && result.error === "ALREADY_EXISTS") { setError("A weight entry for this day already exists!"); return; }
            window.dispatchEvent(new CustomEvent("stridestack:refresh"));
            onClose();
          }}>
            <div>
              <label className={labelClass}>Weight (kg)</label>
              <input name="weight" type="number" step="0.1" className="input-ui" placeholder="0.0" autoFocus />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="input-ui" onChange={() => setError(null)} />
            </div>
            {error && (
              <div className="text-danger text-xs font-semibold uppercase tracking-wide p-3 border border-danger/40 bg-danger/8">
                {error}
              </div>
            )}
            <button className="btn-primary">Save Weight</button>
          </form>

        ) : type === "activity" ? (
          <form className="space-y-4" action={async (formData) => {
            const t = formData.get("type") as string;
            const distance = parseFloat(formData.get("distance") as string);
            const date = formData.get("date") as string;
            if (!t || !distance || isNaN(distance) || distance <= 0) return;
            await addActivityEntry(t, distance, date);
            window.dispatchEvent(new CustomEvent("stridestack:refresh"));
            onClose();
          }}>
            <div>
              <label className={labelClass}>Activity Type</label>
              <div className="grid grid-cols-2 gap-2">
                {["RUN", "BIKE"].map((val) => (
                  <label key={val} className="cursor-pointer">
                    <input type="radio" name="type" value={val} className="peer sr-only" defaultChecked={val === "RUN"} />
                    <div className="border border-border py-3 text-center text-sm font-semibold uppercase tracking-wider text-muted peer-checked:bg-surface-raised peer-checked:text-foreground peer-checked:border-border-strong transition-all">
                      {val === "RUN" ? "Run" : "Bike"}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Distance (km)</label>
              <input name="distance" type="number" step="0.01" className="input-ui" placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="input-ui" />
            </div>
            <button className="btn-primary">Save Activity</button>
          </form>

        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input type="file" accept=".fit" onChange={handleFileUpload} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className={`border-dashed-ui p-8 flex flex-col items-center justify-center gap-3 transition-colors ${loading ? "bg-surface" : "hover:bg-surface"}`}>
                <div className="w-12 h-12 flex items-center justify-center text-muted border border-border">
                  <Upload size={22} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    {loading ? "Processing..." : "Click or drag a .fit file"}
                  </p>
                  <p className="text-[10px] text-muted uppercase tracking-widest mt-1">Export from the Suunto app</p>
                </div>
              </div>
            </div>

            {segments.length > 0 && (
              <div className="flex flex-col gap-2">
                <button onClick={() => setShowSummary(true)} className="btn-primary flex items-center justify-center gap-2 py-3">
                  <MapIcon size={18} /> Show Summary
                </button>
                <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted py-2 hover:text-foreground transition-colors">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {isExpanded ? "Hide segments" : "Show segments"}
                </button>
              </div>
            )}

            {isExpanded && segments.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface text-muted font-semibold sticky top-0 border-b border-border-subtle">
                    <tr>
                      <th className="px-3 py-2 uppercase tracking-wider">Distance</th>
                      <th className="px-3 py-2 text-right uppercase tracking-wider">Pace</th>
                      <th className="px-3 py-2 text-right uppercase tracking-wider">Speed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segments.map((segment) => (
                      <tr key={segment.id} className="hover:bg-surface border-t border-border-subtle transition-colors">
                        <td className="px-3 py-2 font-semibold text-foreground">{segment.distanceRange}</td>
                        <td className="px-3 py-2 text-right text-muted">{segment.pace}</td>
                        <td className="px-3 py-2 text-right font-bold text-gold">{segment.speed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {summary && <ActivitySummaryModal isOpen={showSummary} onClose={() => setShowSummary(false)} summary={summary} />}
    </div>
  );
}
