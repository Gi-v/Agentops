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
    <div className="flex-1 flex flex-col rounded-2xl bg-slate-800/50 border border-slate-700 shadow-xl min-h-[400px] overflow-hidden backdrop-blur-sm">
      <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <TerminalSquare className={`w-4 h-4 ${isStreaming ? "text-blue-400 animate-pulse" : "text-slate-500"}`} />
          <h3 className="text-xs font-bold text-slate-300 font-mono tracking-widest uppercase">Aegis Telemetry Stream</h3>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
        </div>
      </div>

      <div className="p-5 flex-1 font-mono text-[12px] flex flex-col gap-2 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 transparent" }}>
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              key={log.id}
              className={`${log.color} flex gap-3 break-all`}
            >
              <span className="opacity-40 shrink-0 select-none text-slate-400">[{log.time}]</span>
              <span className="leading-relaxed drop-shadow-sm">{log.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="w-2 h-4 bg-slate-500 animate-pulse mt-1" />
        <div ref={bottomRef} />
      </div>
    </div>
  );
}