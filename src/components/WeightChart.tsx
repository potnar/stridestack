"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import {
  getWeightHistory,
  getEarliestWeightDate,
  deleteWeightEntry,
} from "@/lib/data-service";
import {
  format,
  startOfWeek,
  endOfWeek,
  subWeeks,
  addWeeks,
  subDays,
  addDays,
  startOfDay,
  endOfDay,
  isAfter,
  isBefore,
} from "date-fns";
import { pl } from "date-fns/locale";

type ViewMode = "DAILY" | "WEEKLY";

interface WeightData {
  id?: string;
  date: string;
  weight: number;
}

interface WeightChartProps {
  lastUpdated?: number;
  onUpdate?: () => void;
}

export function WeightChart({ lastUpdated, onUpdate }: WeightChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("DAILY");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<WeightData[]>([]);
  const [historyList, setHistoryList] = useState<WeightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [earliestDate, setEarliestDate] = useState<Date>(new Date());

  useEffect(() => {
    async function init() {
      const d = await getEarliestWeightDate();
      if (d) setEarliestDate(new Date(d));
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      if (viewMode === "DAILY") {
        const start = startOfDay(subDays(currentDate, 6));
        const end = endOfDay(currentDate);
        const history = await getWeightHistory(start, end);
        const dailyData: WeightData[] = [];
        for (let i = 0; i < 7; i++) {
          const day = startOfDay(addDays(start, i));
          const entry = history.find(
            (h: any) => startOfDay(new Date(h.date)).getTime() === day.getTime(),
          );
          dailyData.push({ date: day.toISOString(), weight: entry ? entry.weight : (null as any) });
        }
        setData(dailyData);
        setHistoryList(history);
      } else {
        const endOfCurrentPeriod = endOfWeek(currentDate, { weekStartsOn: 1 });
        const startOfPeriod = startOfWeek(subWeeks(endOfCurrentPeriod, 3), { weekStartsOn: 1 });
        const history = await getWeightHistory(startOfPeriod, endOfCurrentPeriod);
        const weeklyData: WeightData[] = [];
        for (let i = 0; i < 4; i++) {
          const weekStart = startOfWeek(subWeeks(endOfCurrentPeriod, 3 - i), { weekStartsOn: 1 });
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekEntries = history.filter((entry: any) => {
            const date = new Date(entry.date);
            return date >= weekStart && date <= weekEnd;
          });
          if (weekEntries.length > 0) {
            const avg = weekEntries.reduce((acc: number, curr: any) => acc + curr.weight, 0) / weekEntries.length;
            weeklyData.push({ date: weekStart.toISOString(), weight: Number(avg.toFixed(1)) });
          } else {
            weeklyData.push({ date: weekStart.toISOString(), weight: null as any });
          }
        }
        setData(weeklyData);
        setHistoryList([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [viewMode, currentDate, lastUpdated]);

  const handlePrevious = () => setCurrentDate(viewMode === "DAILY" ? subDays(currentDate, 7) : subWeeks(currentDate, 1));

  const handleNext = () => {
    const next = viewMode === "DAILY" ? addDays(currentDate, 7) : addWeeks(currentDate, 1);
    setCurrentDate(isAfter(next, new Date()) ? new Date() : next);
  };

  const canGoNext = () => {
    const today = new Date();
    if (viewMode === "DAILY") return isBefore(currentDate, today) && format(currentDate, "yyyy-MM-dd") !== format(today, "yyyy-MM-dd");
    return isBefore(endOfWeek(currentDate, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 }));
  };

  const canGoPrev = () => {
    if (viewMode === "DAILY") return isAfter(subDays(currentDate, 6), earliestDate);
    const endOfCurrentPeriod = endOfWeek(currentDate, { weekStartsOn: 1 });
    const startOfPeriod = startOfWeek(subWeeks(endOfCurrentPeriod, 3), { weekStartsOn: 1 });
    return isAfter(startOfPeriod, startOfWeek(earliestDate, { weekStartsOn: 1 }));
  };

  const getDateRangeLabel = () => {
    if (viewMode === "DAILY") {
      return `${format(subDays(currentDate, 6), "MMM d")} – ${format(currentDate, "MMM d, yyyy")}`;
    }
    const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
    const startOfPeriod = startOfWeek(subWeeks(endOfCurrentWeek, 3), { weekStartsOn: 1 });
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const startMonth = capitalize(format(startOfPeriod, "MMMM", { locale: pl }));
    const endMonth = capitalize(format(endOfCurrentWeek, "MMMM", { locale: pl }));
    const year = format(endOfCurrentWeek, "yyyy");
    return startMonth === endMonth ? `${startMonth} ${year}` : `${startMonth}/${endMonth} ${year}`;
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteWeightEntry(id);
      window.dispatchEvent(new CustomEvent("stridestack:refresh"));
      onUpdate?.();
      setCurrentDate(new Date(currentDate));
    }
  };

  const navBtnClass = "p-2 text-muted hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="section-label">Weight Progress</p>
        <div className="flex border border-border">
          <button
            onClick={() => setViewMode("DAILY")}
            className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              viewMode === "DAILY" ? "bg-surface-raised text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode("WEEKLY")}
            className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider border-l border-border transition-colors ${
              viewMode === "WEEKLY" ? "bg-surface-raised text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevious} disabled={!canGoPrev()} className={navBtnClass}>
          <ChevronLeft size={18} />
        </button>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          {getDateRangeLabel()}
        </span>
        <button onClick={handleNext} disabled={!canGoNext()} className={navBtnClass}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-56 flex items-center justify-center text-muted text-[10px] uppercase tracking-widest">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-muted text-[10px] uppercase tracking-widest">
          No data for this period
        </div>
      ) : (
        <div className="p-4 card-surface">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(240, 235, 227, 0.06)" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => format(new Date(v), "d.MM")}
                stroke="transparent"
                tick={{ fill: "#5C5855", fontSize: 10 }}
              />
              <YAxis
                stroke="transparent"
                tick={{ fill: "#5C5855", fontSize: 11 }}
                domain={["dataMin - 1", "dataMax + 1"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#191919",
                  border: "1px solid rgba(240, 235, 227, 0.25)",
                  borderRadius: 0,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#5C5855", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.12em" }}
                itemStyle={{ color: "#C8A96E", fontWeight: 700 }}
                labelFormatter={(v) => {
                  const d = new Date(v);
                  return viewMode === "DAILY"
                    ? format(d, "d.MM.yy")
                    : `${format(d, "d.MM")} – ${format(endOfWeek(d, { weekStartsOn: 1 }), "d.MM.yy")}`;
                }}
                formatter={(v: any) => [`${v} kg`, viewMode === "DAILY" ? "Weight" : "Avg"]}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#C8A96E"
                strokeWidth={2}
                dot={{ fill: "#C8A96E", r: 3, stroke: "#C8A96E", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#C8A96E", stroke: "#111111", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History list */}
      {viewMode === "DAILY" && historyList.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="section-label mb-3">Recent Entries</p>
          {[...historyList].reverse().map((entry) => (
            <div
              key={entry.id}
              className="card-surface flex items-center justify-between px-4 py-3"
            >
              <div>
                <span className="font-bold text-foreground tabular-nums">{entry.weight} kg</span>
                <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">
                  {format(new Date(entry.date), "PPPP", { locale: pl })}
                </p>
              </div>
              <button
                onClick={() => entry.id && handleDelete(entry.id)}
                className="p-2 text-muted hover:text-danger transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
