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
} from "@/app/actions";
import { useRouter } from "next/navigation";
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
}

export function WeightChart({ lastUpdated }: WeightChartProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("DAILY");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<WeightData[]>([]);
  const [historyList, setHistoryList] = useState<WeightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [earliestDate, setEarliestDate] = useState<Date>(new Date());

  useEffect(() => {
    async function init() {
      const d = await getEarliestWeightDate();
      setEarliestDate(new Date(d));
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let start: Date, end: Date;

      if (viewMode === "DAILY") {
        // Last 7 days
        start = startOfDay(subDays(currentDate, 6));
        end = endOfDay(currentDate);
        const history = await getWeightHistory(start, end);
        // Ensure 7 days are always present for consistency
        const dailyData: WeightData[] = [];
        for (let i = 0; i < 7; i++) {
          const day = startOfDay(addDays(start, i));
          const entry = history.find(
            (h: WeightData) =>
              startOfDay(new Date(h.date)).getTime() === day.getTime(),
          );
          dailyData.push({
            date: day.toISOString(),
            weight: entry ? entry.weight : (null as any),
          });
        }
        setData(dailyData);
        setHistoryList(history);
      } else {
        // Weekly view - last 4 weeks average
        const endOfCurrentPeriod = endOfWeek(currentDate, { weekStartsOn: 1 });
        const startOfPeriod = startOfWeek(subWeeks(endOfCurrentPeriod, 3), {
          weekStartsOn: 1,
        });

        const history = await getWeightHistory(
          startOfPeriod,
          endOfCurrentPeriod,
        );

        // Group by week and calculate average
        const weeklyData: WeightData[] = [];
        for (let i = 0; i < 4; i++) {
          const weekStart = startOfWeek(subWeeks(endOfCurrentPeriod, 3 - i), {
            weekStartsOn: 1,
          });
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

          const weekEntries = history.filter((entry: WeightData) => {
            const date = new Date(entry.date);
            return date >= weekStart && date <= weekEnd;
          });

          if (weekEntries.length > 0) {
            const avg =
              weekEntries.reduce((acc, curr) => acc + curr.weight, 0) /
              weekEntries.length;
            weeklyData.push({
              date: weekStart.toISOString(),
              weight: Number(avg.toFixed(1)),
            });
          } else {
            weeklyData.push({
              date: weekStart.toISOString(),
              weight: null as any,
            });
          }
        }
        setData(weeklyData);
        setHistoryList([]); // Don't show individual entries in weekly view
      }
      setLoading(false);
    }

    fetchData();
  }, [viewMode, currentDate, lastUpdated]);

  const handlePrevious = () => {
    if (viewMode === "DAILY") {
      setCurrentDate(subDays(currentDate, 7));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "DAILY") {
      const nextDate = addDays(currentDate, 7);
      if (isAfter(nextDate, new Date())) {
        setCurrentDate(new Date());
      } else {
        setCurrentDate(nextDate);
      }
    } else {
      const nextDate = addWeeks(currentDate, 1);
      if (isAfter(nextDate, new Date())) {
        setCurrentDate(new Date());
      } else {
        setCurrentDate(nextDate);
      }
    }
  };

  const canGoNext = () => {
    const today = new Date();
    if (viewMode === "DAILY") {
      return (
        isBefore(currentDate, today) &&
        format(currentDate, "yyyy-MM-dd") !== format(today, "yyyy-MM-dd")
      );
    } else {
      const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      const todayWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
      return isBefore(currentWeekEnd, todayWeekEnd);
    }
  };

  const canGoPrev = () => {
    if (viewMode === "DAILY") {
      // If the entire window (currentDate - 6 days) is before earliestDate, stop
      const startOfWindow = subDays(currentDate, 6);
      return isAfter(startOfWindow, earliestDate);
    } else {
      // If the rightmost week (currentDate) of the 4-week window is before earliestDate, stop
      // Actually, we should be able to see the earliest entry.
      // So if startOfWindow (currentDate - 3 weeks) is after earliestDate, we can still go back.
      const endOfCurrentPeriod = endOfWeek(currentDate, { weekStartsOn: 1 });
      const startOfPeriod = startOfWeek(subWeeks(endOfCurrentPeriod, 3), {
        weekStartsOn: 1,
      });
      const earliestStartOfWeek = startOfWeek(earliestDate, {
        weekStartsOn: 1,
      });
      return isAfter(startOfPeriod, earliestStartOfWeek);
    }
  };

  const getDateRangeLabel = () => {
    if (viewMode === "DAILY") {
      const start = subDays(currentDate, 6);
      return `${format(start, "MMM d")} - ${format(currentDate, "MMM d, yyyy")}`;
    } else {
      const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
      const startOfPeriod = startOfWeek(subWeeks(endOfCurrentWeek, 3), {
        weekStartsOn: 1,
      });

      const startMonth = format(startOfPeriod, "MMMM", { locale: pl });
      const endMonth = format(endOfCurrentWeek, "MMMM", { locale: pl });
      const year = format(endOfCurrentWeek, "yyyy");

      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

      if (startMonth === endMonth) {
        return `${capitalize(startMonth)} ${year}`;
      } else {
        return `${capitalize(startMonth)}/${capitalize(endMonth)} ${year}`;
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten wpis?")) {
      const res = await deleteWeightEntry(id);
      if (res.success) {
        router.refresh();
      } else {
        alert("Błąd podczas usuwania wpisu");
      }
    }
  };

  return (
    <div className="bg-card p-4 rounded-2xl">
      {/* Header with View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Postępy wagi</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("DAILY")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "DAILY"
                ? "bg-blue-600 text-white"
                : "bg-black/40 text-zinc-400 hover:text-white"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode("WEEKLY")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "WEEKLY"
                ? "bg-blue-600 text-white"
                : "bg-black/40 text-zinc-400 hover:text-white"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevious}
          disabled={!canGoPrev()}
          className="p-2 rounded-lg bg-black/40 hover:bg-black/60 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm text-zinc-400">{getDateRangeLabel()}</span>
        <button
          onClick={handleNext}
          disabled={!canGoNext()}
          className="p-2 rounded-lg bg-black/40 hover:bg-black/60 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-zinc-400">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-zinc-400">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => format(new Date(value), "d.MM.yy")}
              stroke="#666"
              style={{ fontSize: "10px" }}
            />
            <YAxis
              stroke="#666"
              style={{ fontSize: "12px" }}
              domain={["dataMin - 1", "dataMax + 1"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1A1A",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                if (viewMode === "DAILY") {
                  return `Data: ${format(date, "d.MM.yy")}`;
                } else {
                  const end = endOfWeek(date, { weekStartsOn: 1 });
                  return `Tydzień: ${format(date, "d.MM.yy")} - ${format(end, "d.MM.yy")}`;
                }
              }}
              formatter={(value: any) => [
                `${value} kg`,
                viewMode === "DAILY" ? "Waga" : "Średnia",
              ]}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: "#10B981", r: 4, stroke: "#10B981", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#10B981" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* History List */}
      {viewMode === "DAILY" && historyList.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 px-1">
            Ostatnie wpisy
          </h3>
          <div className="space-y-2">
            {[...historyList].reverse().map((entry) => (
              <div
                key={entry.id}
                className="bg-black/40 rounded-xl p-3 flex items-center justify-between border border-white/5"
              >
                <div className="flex flex-col">
                  <span className="text-white font-medium">
                    {entry.weight} kg
                  </span>
                  <span className="text-xs text-zinc-500">
                    {format(new Date(entry.date), "PPPP", { locale: pl })}
                  </span>
                </div>
                <button
                  onClick={() => entry.id && handleDelete(entry.id)}
                  className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
