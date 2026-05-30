"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Weight, Activity, Pencil } from "lucide-react";
import { WeightChart } from "@/components/WeightChart";
import { getDashboardData, updateUserHeight } from "@/lib/data-service";
import type { DashboardData } from "@/types";
import { BMI_CATEGORY_COLORS, type BmiCategory } from "@/lib/bmi";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

function RobotMascot() {
  return (
    <div>
      <svg width="56" height="64" viewBox="0 0 56 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Antenna stem */}
        <rect x="25" y="1" width="4" height="12" fill="#F0EBE3" />
        {/* Antenna tip */}
        <circle cx="27" cy="1" r="5" fill="#3B82F6" />
        <circle cx="27" cy="1" r="2.5" fill="#1E40AF" />
        {/* Ear bolts */}
        <rect x="1" y="19" width="7" height="9" rx="1" fill="#F0EBE3" />
        <rect x="48" y="19" width="7" height="9" rx="1" fill="#F0EBE3" />
        {/* Head */}
        <rect x="8" y="13" width="40" height="29" rx="2" fill="#F0EBE3" />
        {/* Eye sockets */}
        <rect x="13" y="20" width="12" height="12" rx="1" fill="#1A1A1A" />
        <rect x="31" y="20" width="12" height="12" rx="1" fill="#1A1A1A" />
        {/* Pupils */}
        <circle cx="19" cy="26" r="4" fill="#3B82F6" />
        <circle cx="37" cy="26" r="4" fill="#3B82F6" />
        {/* Glint */}
        <circle cx="20.5" cy="24.5" r="1.5" fill="white" />
        <circle cx="38.5" cy="24.5" r="1.5" fill="white" />
        {/* Mouth */}
        <rect x="16" y="35" width="24" height="4" rx="1" fill="#1A1A1A" />
        {/* Body */}
        <rect x="11" y="42" width="34" height="22" rx="2" fill="#D5D0C8" />
        <rect x="11" y="42" width="34" height="3" fill="#C0BAB2" rx="2" />
        {/* Chest panel */}
        <rect x="19" y="48" width="18" height="9" rx="1" fill="#1A1A1A" />
        <circle cx="24" cy="52.5" r="2.5" fill="#3B82F6" />
        <circle cx="32" cy="52.5" r="2.5" fill="#3B82F6" />
      </svg>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [editingHeight, setEditingHeight] = useState(false);
  const [heightCm, setHeightCm] = useState("");

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
    const handleRefresh = () => loadData();
    window.addEventListener("stridestack:refresh", handleRefresh);
    return () => window.removeEventListener("stridestack:refresh", handleRefresh);
  }, []);

  return (
    <div className="px-5 pb-8">
      {/* Hero header */}
      <motion.header
        className="pt-12 pb-8"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted mb-2">StrideStack</p>
        <h1 className="font-display text-[72px] leading-none uppercase text-foreground">
          Pro<br />gress
        </h1>
      </motion.header>

      {/* Divider */}
      <div className="border-t border-border-strong" />

      {/* Weight + BMI row */}
      <div className="grid grid-cols-2 mt-8">
        {/* Weight */}
        <Reveal>
          <div className="py-6 pr-6 border-r border-border">
            <SectionLabel>Weight</SectionLabel>
            <div className="mt-4 flex items-end gap-2 leading-none">
              <span className="font-display text-6xl text-foreground">{data?.weight ?? "--"}</span>
              <span className="text-muted text-base pb-1">kg</span>
            </div>
          </div>
        </Reveal>

        {/* BMI */}
        <Reveal delay={0.12}>
          <div className="py-6 pl-6">
          <div className="flex items-center gap-2">
            <SectionLabel>BMI</SectionLabel>
            <button
              onClick={() => {
                setHeightCm(String(Math.round((data?.userHeightM ?? 1.8) * 100)));
                setEditingHeight(true);
              }}
              className="-mt-0.5"
            >
              <Pencil size={10} className="text-muted hover:text-foreground transition-colors" />
            </button>
          </div>

          {editingHeight ? (
            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleHeightSave();
                  if (e.key === "Escape") setEditingHeight(false);
                }}
                className="w-16 bg-surface border border-border-strong text-foreground text-sm px-2 py-1 outline-none focus:border-foreground transition-colors [color-scheme:dark]"
                placeholder="cm"
                autoFocus
              />
              <button onClick={handleHeightSave} className="text-success text-sm font-bold">✓</button>
              <button onClick={() => setEditingHeight(false)} className="text-muted text-sm">✗</button>
            </div>
          ) : (
            <div className="mt-4 leading-none">
              <span className="font-display text-6xl text-foreground">{data?.bmi ?? "--"}</span>
              {data?.bmiCategory && data.bmi !== "--" && (
                <p className={`text-[10px] font-semibold uppercase tracking-widest mt-2 ${BMI_CATEGORY_COLORS[data.bmiCategory as BmiCategory] ?? "text-muted"}`}>
                  {data.bmiCategory}
                </p>
              )}
            </div>
          )}
          </div>
        </Reveal>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Total Distance — hero stat */}
      <Reveal delay={0.1}>
        <div className="relative py-8">
          <SectionLabel>Total Distance</SectionLabel>
          <div className="mt-4 flex items-end gap-3 leading-none">
            <span className="font-display text-[88px] leading-none text-gold">
              {data?.totalDistance ?? 0}
            </span>
            <span className="text-muted text-2xl pb-2">km</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted mt-3">
            Run: {data?.runDistance ?? 0}km &nbsp;·&nbsp; Bike: {data?.bikeDistance ?? 0}km
          </p>
          {/* Robot mascot */}
          <div className="absolute bottom-4 right-0 pointer-events-none robot-wobble">
            <RobotMascot />
          </div>
        </div>
      </Reveal>

      {/* Divider */}
      <div className="border-t border-border mb-6" />

      {/* Weight Chart */}
      <Reveal delay={0.1}>
        <WeightChart lastUpdated={data?.lastUpdated} onUpdate={loadData} />
      </Reveal>
    </div>
  );
}
