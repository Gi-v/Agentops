"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TerminalSquare } from "lucide-react";

interface LogEntry {
  id: number;
  text: string;
  color: string;
  time: string;
}

interface AgentLiveTraceProps {
  logs: LogEntry[];
  isStreaming: boolean;
}

export default function AgentLiveTrace({ logs, isStreaming }: AgentLiveTraceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex-1 flex flex-col rounded-2xl bg-[#020617] border border-slate-800 shadow-xl min-h-[400px] overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <TerminalSquare className={`w-4 h-4 ${isStreaming ? "text-blue-400 animate-pulse" : "text-slate-500"}`} />
          <h3 className="text-xs font-bold text-slate-300 font-mono tracking-widest uppercase">Observability Stream</h3>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        </div>
      </div>

      <div className="p-5 flex-1 font-mono text-[12px] flex flex-col gap-2 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}>
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              key={log.id}
              className={`${log.color} flex gap-3 break-all`}
            >
              <span className="opacity-40 shrink-0 select-none text-slate-500">[{log.time}]</span>
              <span className="leading-relaxed">{log.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="w-2 h-4 bg-slate-500 animate-pulse mt-1" />
        <div ref={bottomRef} />
      </div>
    </div>
  );
}