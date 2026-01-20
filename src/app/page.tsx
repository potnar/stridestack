"use client";

import { useEffect, useState } from "react";
import { Weight, MapPin, Activity } from "lucide-react";
import { WeightChart } from "@/components/WeightChart";
import { getDashboardData } from "@/lib/data-service";

export default function Home() {
  const [data, setData] = useState<any>(null);

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
              <p className="text-zinc-400 text-sm">BMI</p>
              <p className="text-2xl font-bold">{data?.bmi ?? "--"}</p>
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
