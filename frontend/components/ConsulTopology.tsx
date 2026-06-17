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
    status === "passing" ? "bg-slate-500" :
    status === "warning" ? "bg-amber-400" :
    "bg-rose-400 animate-pulse";
  return (
    <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function ConsulTopology({ services, viewMode, onSelect }: ConsulTopologyProps) {
  if (services.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg">
          <Database className="w-8 h-8 opacity-40 text-blue-300" />
        </div>
        <p className="font-mono text-sm tracking-widest uppercase">Awaiting Mesh Quorum</p>
      </div>
    );
  }

  const dotClass = (s: string) =>
    s === "passing" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" :
    s === "warning"  ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]" :
    "bg-rose-400 animate-pulse shadow-[0_0_10px_rgba(251,113,133,0.6)]";

  const statusColor = (s: string) =>
    s === "passing" ? "text-emerald-400" :
    s === "warning"  ? "text-amber-400" :
    "text-rose-400";

  const cardBorder = (s: string) =>
    s === "passing" ? "border-slate-700 bg-slate-800/60 hover:border-blue-400/40" :
    s === "warning"  ? "border-amber-700/50 bg-amber-900/10 hover:border-amber-400/60" :
    "border-rose-700/50 bg-rose-900/20 hover:border-rose-400/80";

  if (viewMode === "TABLE") {
    return (
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700">
          <tr>
            <th className="px-6 py-4 font-semibold tracking-wider">Service</th>
            <th className="px-6 py-4 font-semibold tracking-wider">CPU</th>
            <th className="px-6 py-4 font-semibold tracking-wider">RAM</th>
            <th className="px-6 py-4 font-semibold tracking-wider">Node ID</th>
            <th className="px-6 py-4 font-semibold text-right tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => {
            const m = NODE_METRICS[s.ServiceName] ?? { cpu: 20, ram: 30 };
            return (
              <tr key={s.CheckID} onClick={() => onSelect(s)} className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors backdrop-blur-sm">
                <td className="px-6 py-4 font-mono font-medium text-slate-200">{s.ServiceName}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 w-28">
                    <MeterBar value={m.cpu} status={s.Status} />
                    <span className="text-[10px] text-slate-400 font-mono w-8">{m.cpu}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 w-28">
                    <MeterBar value={m.ram} status={s.Status} />
                    <span className="text-[10px] text-slate-400 font-mono w-8">{m.ram}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{s.CheckID}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2.5 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase shadow-sm ${
                    s.Status === "passing" ? "text-emerald-300 bg-emerald-900/30 border border-emerald-700/50" :
                    s.Status === "warning"  ? "text-amber-300 bg-amber-900/30 border border-amber-700/50" :
                    "text-rose-300 bg-rose-900/30 border border-rose-700/50"
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
              className={`p-5 rounded-xl border flex flex-col gap-4 w-[220px] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-md ${cardBorder(s.Status)}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-sm font-medium text-slate-100 leading-tight drop-shadow-sm">{s.ServiceName}</span>
                <div className={`w-2.5 h-2.5 mt-1 rounded-full flex-shrink-0 ${dotClass(s.Status)}`} />
              </div>

              <div className="flex flex-col gap-2.5 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase w-6 tracking-wider">CPU</span>
                  <MeterBar value={m.cpu} status={s.Status} />
                  <span className="text-[9px] text-slate-400 font-mono w-7 text-right">{m.cpu}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase w-6 tracking-wider">RAM</span>
                  <MeterBar value={m.ram} status={s.Status} />
                  <span className="text-[9px] text-slate-400 font-mono w-7 text-right">{m.ram}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-700/60 pt-3 mt-1">
                <span className={`text-[10px] uppercase font-bold tracking-widest drop-shadow-sm ${statusColor(s.Status)}`}>{s.Status}</span>
                <span className="text-[10px] text-slate-500 font-mono">Quorum: 1</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}