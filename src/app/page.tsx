"use client";

import { useEffect, useState } from "react";
import { Weight, MapPin, Activity, Pencil } from "lucide-react";
import { WeightChart } from "@/components/WeightChart";
import { getDashboardData, updateUserHeight } from "@/lib/data-service";
import type { DashboardData } from "@/types";
import { BMI_CATEGORY_COLORS, type BmiCategory } from "@/lib/bmi";

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [editingHeight, setEditingHeight] = useState(false);
  const [heightCm, setHeightCm] = useState('');

  const handleHeightSave = async () => {
    const h = parseFloat(heightCm);
    if (isNaN(h) || h < 50 || h > 300) return;
    await updateUserHeight(h / 100);
    setEditingHeight(false);
    loadData();
  };

  const loadData = async () => {
    const dashboardData = await getDashboardData();
    setData(dashboardData);
  };

  useEffect(() => {
    loadData();

    const handleRefresh = () => {
      console.log("Refresh event received");
      loadData();
    };

    window.addEventListener("stridestack:refresh", handleRefresh);
    return () =>
      window.removeEventListener("stridestack:refresh", handleRefresh);
  }, []);

  return (
    <div className="p-4 space-y-6 mb-8">
      <header className="pt-8 pb-4">
        <h1 className="text-3xl font-bold">Progress</h1>
        <p className="text-zinc-400">Your latest stats</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card p-4 rounded-2xl flex">
          <div className="bg-card p-4 rounded-2xl flex flex-col justify-between">
            <div className="bg-blue-500/10 w-10 h-10 rounded-full flex items-center justify-center text-blue-500">
              <Weight size={20} />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Weight</p>
              <p className="text-2xl font-bold">{data?.weight ?? "--"} kg</p>
            </div>
          </div>
          <div className="bg-card p-4 rounded-2xl flex flex-col justify-between">
            <div className="bg-green-500/10 w-10 h-10 rounded-full flex items-center justify-center text-green-500">
              <Activity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-zinc-400 text-sm">BMI</p>
                <button
                  onClick={() => {
                    setHeightCm(String(Math.round((data?.userHeightM ?? 1.80) * 100)));
                    setEditingHeight(true);
                  }}
                >
                  <Pencil size={11} className="text-zinc-500 hover:text-zinc-300" />
                </button>
              </div>
              {editingHeight ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={heightCm}
                    onChange={e => setHeightCm(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleHeightSave(); if (e.key === 'Escape') setEditingHeight(false); }}
                    className="w-14 bg-zinc-800 text-white text-sm rounded px-1.5 py-0.5 outline-none"
                    placeholder="cm"
                    autoFocus
                  />
                  <button onClick={handleHeightSave} className="text-green-400 text-sm">✓</button>
                  <button onClick={() => setEditingHeight(false)} className="text-zinc-400 text-sm">✗</button>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold">{data?.bmi ?? "--"}</p>
                  {data?.bmiCategory && data.bmi !== '--' && (
                    <p className={`text-xs font-medium ${BMI_CATEGORY_COLORS[data.bmiCategory as BmiCategory] ?? 'text-zinc-400'}`}>
                      {data.bmiCategory}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="bg-card p-4 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500/10 w-10 h-10 rounded-full flex items-center justify-center text-orange-500">
              <MapPin size={20} />
            </div>
            <p className="text-lg font-semibold">Total Distance</p>
          </div>
          <p className="text-3xl font-bold pl-1">
            {data?.totalDistance ?? 0} km
          </p>
          <p className="text-zinc-400 text-sm pl-1">
            Run: {data?.runDistance ?? 0}km • Bike: {data?.bikeDistance ?? 0}km
          </p>
        </div>
      </div>

      {/* Weight Chart */}
      <WeightChart lastUpdated={data?.lastUpdated} onUpdate={loadData} />
    </div>
  );
}
