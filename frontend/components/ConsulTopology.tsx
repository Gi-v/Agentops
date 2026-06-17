"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Database } from "lucide-react";
import { NODE_METRICS } from "./mockData";

interface Node {
  CheckID: string;
  ServiceName: string;
  Status: string;
}

interface ConsulTopologyProps {
  services: Node[];
  viewMode: "GRID" | "TABLE";
  onSelect: (node: Node) => void;
}

function MeterBar({ value, status }: { value: number; status: string }) {
  const color =
    status === "passing" ? "bg-slate-600" :
    status === "warning" ? "bg-amber-400" :
    "bg-rose-400 animate-pulse";
  return (
    <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function ConsulTopology({ services, viewMode, onSelect }: ConsulTopologyProps) {
  if (services.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
          <Database className="w-8 h-8 opacity-40" />
        </div>
        <p className="font-mono text-sm tracking-widest uppercase">Awaiting Fleet Deployment</p>
      </div>
    );
  }

  const dotClass = (s: string) =>
    s === "passing" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" :
    s === "warning"  ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" :
    "bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(251,113,133,0.8)]";

  const statusColor = (s: string) =>
    s === "passing" ? "text-emerald-400" :
    s === "warning"  ? "text-amber-400" :
    "text-rose-400";

  const cardBorder = (s: string) =>
    s === "passing" ? "border-slate-800 hover:border-emerald-500/50" :
    s === "warning"  ? "border-amber-900/50 bg-amber-950/10 hover:border-amber-500/60" :
    "border-rose-900/50 bg-rose-950/20 hover:border-rose-500/80";

  if (viewMode === "TABLE") {
    return (
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-slate-900 text-slate-400 border-b border-slate-800">
          <tr>
            <th className="px-6 py-4 font-semibold">Service</th>
            <th className="px-6 py-4 font-semibold">CPU</th>
            <th className="px-6 py-4 font-semibold">RAM</th>
            <th className="px-6 py-4 font-semibold">Node ID</th>
            <th className="px-6 py-4 font-semibold text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => {
            const m = NODE_METRICS[s.ServiceName] ?? { cpu: 20, ram: 30 };
            return (
              <tr key={s.CheckID} onClick={() => onSelect(s)} className="border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-slate-200">{s.ServiceName}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 w-28">
                    <MeterBar value={m.cpu} status={s.Status} />
                    <span className="text-[10px] text-slate-500 font-mono w-8">{m.cpu}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 w-28">
                    <MeterBar value={m.ram} status={s.Status} />
                    <span className="text-[10px] text-slate-500 font-mono w-8">{m.ram}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{s.CheckID}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${
                    s.Status === "passing" ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20" :
                    s.Status === "warning"  ? "text-amber-400 bg-amber-400/10 border border-amber-400/20" :
                    "text-rose-400 bg-rose-400/10 border border-rose-400/20"
                  }`}>{s.Status}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      <AnimatePresence>
        {services.map((s) => {
          const m = NODE_METRICS[s.ServiceName] ?? { cpu: 20, ram: 30 };
          return (
            <motion.div
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              key={s.CheckID}
              onClick={() => onSelect(s)}
              className={`p-5 rounded-xl border flex flex-col gap-4 w-[220px] cursor-pointer bg-slate-900/80 transition-all duration-200 hover:-translate-y-1 ${cardBorder(s.Status)}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-sm font-semibold text-slate-200 leading-tight">{s.ServiceName}</span>
                <div className={`w-2 h-2 mt-1 rounded-full flex-shrink-0 ${dotClass(s.Status)}`} />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase w-6">CPU</span>
                  <MeterBar value={m.cpu} status={s.Status} />
                  <span className="text-[9px] text-slate-500 font-mono w-7 text-right">{m.cpu}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase w-6">RAM</span>
                  <MeterBar value={m.ram} status={s.Status} />
                  <span className="text-[9px] text-slate-500 font-mono w-7 text-right">{m.ram}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <span className={`text-[10px] uppercase font-bold tracking-widest ${statusColor(s.Status)}`}>{s.Status}</span>
                <span className="text-[10px] text-slate-500 font-mono">1</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}