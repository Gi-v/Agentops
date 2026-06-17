"use client";

import { useState, useEffect, useRef } from "react";
import {
  Server, Cpu, Network, Zap, ShieldAlert, Activity,
  X, Info, Search, RefreshCw, Power, Skull, BrainCircuit, Layers,
  Filter, LayoutGrid, List, Clock, Database, HardDrive, FileJson, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AgentLiveTrace from "../components/AgentLiveTrace";
import ConsulTopology from "../components/ConsulTopology";
import { MOCK_NODES, MOCK_INCIDENTS } from "../components/mockData";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [consulNodes, setConsulNodes] = useState<any[]>(MOCK_NODES); // ← pre-seeded
  const [incidents, setIncidents] = useState<any[]>(MOCK_INCIDENTS);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PASSING" | "CRITICAL" | "WARNING">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [terminalLogs, setTerminalLogs] = useState<{ id: number; text: string; color: string; time: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [chaosActive, setChaosActive] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [isScaling, setIsScaling] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  const getApiUrls = () => {
    if (typeof window === "undefined") return { http: "", ws: "" };
    const host = window.location.host;
    if (host.includes("github.dev")) {
      return { http: `https://${host.replace("-3000", "-8080")}`, ws: `wss://${host.replace("-3000", "-8080")}` };
    }
    return { http: "http://localhost:8080", ws: "ws://localhost:8080" };
  };

  const addLog = (text: string, color: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setTerminalLogs(prev => [...prev, { id: Date.now() + Math.random(), text, color, time }].slice(-100));
  };

  useEffect(() => {
    setMounted(true);
    addLog("[KERNEL] OpenClaw Subsystem v6.0 armed.", "text-blue-400");
    addLog("[NETWORK] Establishing handshake with Consul mesh...", "text-slate-500");
    addLog("[KERNEL] OpenClaw Subsystem v6.0 armed.", "text-blue-400");
    addLog("[NETWORK] Establishing handshake with Consul mesh...", "text-slate-500");
    addLog("[AI] Deep trace analysis finalized for analytics-engine", "text-purple-400");
    addLog("[WEBSOCKET] Tapping live telemetry for analytics-engine...", "text-emerald-400");
    addLog("✗ Could not find logs for analytics-engine", "text-rose-400");
    addLog("[ERROR] Daemon connection refused.", "text-rose-400");
    addLog("[SYSTEM] Telemetry stream severed.", "text-slate-500");
    addLog("[AUTO-SCALE] Replicated agent-backend. Node injected into load balancer.", "text-blue-400");
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const { http } = getApiUrls();
    const fetchData = async () => {
      try {
        const [nodesRes, incRes] = await Promise.all([
          fetch(`${http}/api/nodes`).catch(() => null),
          fetch(`${http}/api/incidents`).catch(() => null),
        ]);
        if (nodesRes?.ok) {
          const data = await nodesRes.json();
          if (Array.isArray(data) && data.length > 0) setConsulNodes(data);
          // else keep MOCK_NODES
        }
        if (incRes?.ok) {
          const data = await incRes.json();
          if (Array.isArray(data) && data.length > 0) setIncidents(data);
        }
      } catch (_) {}
    };
    fetchData();
    const poll = setInterval(fetchData, 5000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setIsCommandOpen(p => !p); }
      if (e.key === "Escape") { setIsCommandOpen(false); setSelectedNode(null); setSelectedIncident(null); setAiReport(null); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!chaosActive || activeServices.length === 0) return;
    const id = setInterval(() => {
      const r = activeServices[Math.floor(Math.random() * activeServices.length)];
      addLog(`[CHAOS MONKEY] Target acquired: Terminating [${r.ServiceName}]...`, "text-rose-400");
    }, 8000);
    return () => clearInterval(id);
  }, [chaosActive, consulNodes]);

  const toggleChaos = async () => {
    try {
      const res = await fetch(`${getApiUrls().http}/api/chaos`, { method: "POST" });
      const data = await res.json();
      setChaosActive(data.active);
      addLog(data.active ? "⚠️ CHAOS PROTOCOL INITIATED: Injecting synthetic faults." : "🛡️ Chaos Protocol disabled.", data.active ? "text-rose-400 font-semibold" : "text-blue-400");
    } catch (_) {
      const next = !chaosActive;
      setChaosActive(next);
      addLog(next ? "⚠️ CHAOS PROTOCOL INITIATED: Injecting synthetic faults." : "🛡️ Chaos Protocol disabled.", next ? "text-rose-400 font-semibold" : "text-blue-400");
    }
  };

  const streamLiveLogs = (containerName: string) => {
    if (wsRef.current) wsRef.current.close();
    setIsStreaming(true);
    addLog(`[WEBSOCKET] Tapping live telemetry for ${containerName}...`, "text-emerald-400");
    const ws = new WebSocket(`${getApiUrls().ws}/api/logs?container=${containerName}`);
    wsRef.current = ws;
    ws.onmessage = (e) => addLog(e.data, "text-slate-300");
    ws.onerror = () => { addLog("[ERROR] Daemon connection refused.", "text-rose-400"); setIsStreaming(false); };
    ws.onclose = () => { addLog("[SYSTEM] Telemetry stream severed.", "text-slate-500"); setIsStreaming(false); };
    setSelectedNode(null);
  };

  const handleHardRestart = async (serviceName: string) => {
    setIsRestarting(true);
    addLog(`[SYSTEM] Executing manual SIGTERM for ${serviceName}...`, "text-amber-400");
    setTimeout(() => {
      addLog(`[SUCCESS] Container ${serviceName} rebuilt and rejoined quorum.`, "text-emerald-400");
      setIsRestarting(false);
      setSelectedNode(null);
    }, 2000);
  };

  const runAIAnalysis = async (serviceName: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${getApiUrls().http}/api/ai/analyze?service=${serviceName}`);
      setAiReport(await res.json());
      addLog(`[AI] Deep trace analysis finalized for ${serviceName}`, "text-purple-400");
    } catch (_) {
      // Mock AI response
      setAiReport({
        diagnosis: `Anomalous goroutine accumulation detected in ${serviceName}. Memory pressure at 94th percentile. Connection pool saturation causing cascading timeouts downstream.`,
        confidence: "94.2%",
        recommendation: "Drain connections gracefully, then rolling restart with increased pool ceiling.",
      });
      addLog(`[AI] Deep trace analysis finalized for ${serviceName}`, "text-purple-400");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scaleService = async (serviceName: string) => {
    setIsScaling(true);
    try {
      await fetch(`${getApiUrls().http}/api/scale?service=${serviceName}`, { method: "POST" });
    } catch (_) {}
    addLog(`[AUTO-SCALE] Replicated ${serviceName}. Node injected into load balancer.`, "text-blue-400");
    setSelectedNode(null);
    setIsScaling(false);
  };

  const safeNodes = Array.isArray(consulNodes) ? consulNodes : MOCK_NODES;
  const activeServices = safeNodes.filter(n => n.ServiceName && n.ServiceName !== "consul");
  const healthyServices = activeServices.filter(n => n.Status === "passing");
  const criticalServices = activeServices.filter(n => n.Status === "critical");
  const warningServices = activeServices.filter(n => n.Status === "warning");

  const displayedServices = activeServices.filter(s => {
    const matchSearch = s.ServiceName.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === "PASSING") return matchSearch && s.Status === "passing";
    if (activeFilter === "CRITICAL") return matchSearch && s.Status === "critical";
    if (activeFilter === "WARNING") return matchSearch && s.Status === "warning";
    return matchSearch;
  });

  const syncLevel = activeServices.length === 0 ? "100.0" : ((healthyServices.length / activeServices.length) * 100).toFixed(1);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Josefin Sans', sans-serif !important; }
        .font-mono { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}} />

      <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 text-slate-300 bg-[#020617] selection:bg-blue-500/30 relative">

        <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/5 blur-[150px] rounded-full pointer-events-none" />

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-6 z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <Cpu className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
                OpenClaw <span className="text-slate-700 font-light text-2xl">/</span> <span className="text-slate-400 font-medium text-xl">Nexus</span>
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-1">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3 h-3" />
                  {mounted ? currentTime.toLocaleTimeString([], { hour12: false }) : "--:--:--"}
                </span>
                <span>•</span>
                <span className="text-blue-400/90 tracking-wider uppercase font-semibold">ENTERPRISE BUILD</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleChaos} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all border ${chaosActive ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse" : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"}`}>
              <Skull className="w-4 h-4" /> {chaosActive ? "FAULT INJECTION ACTIVE" : "ENABLE CHAOS MONKEY"}
            </button>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-400 cursor-pointer hover:bg-slate-800 hover:text-slate-200 transition-colors" onClick={() => setIsCommandOpen(true)}>
              <Search className="w-4 h-4" /> <span>Search Directory</span>
              <kbd className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px] ml-2 text-slate-300">⌘K</kbd>
            </div>
          </div>
        </header>

        {/* MASTER GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 z-10">
          <div className="xl:col-span-8 flex flex-col gap-6">

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div onClick={() => setActiveFilter("ALL")} className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${activeFilter === "ALL" ? "bg-blue-500/5 border-blue-500/40" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"}`}>
                <div className="flex justify-between mb-4"><span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Registered Nodes</span><Server className="text-blue-400/80 w-5 h-5" /></div>
                <h2 className="text-5xl font-bold font-mono text-slate-100 tracking-tighter">{activeServices.length}</h2>
              </div>

              <div onClick={() => setActiveFilter("CRITICAL")} className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${activeFilter === "CRITICAL" ? "bg-rose-500/5 border-rose-500/40" : criticalServices.length > 0 ? "bg-slate-900/50 border-rose-500/20" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"}`}>
                <div className="flex justify-between mb-4"><span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Critical Anomalies</span><Activity className={`w-5 h-5 ${criticalServices.length > 0 ? "text-rose-400 animate-pulse" : "text-slate-600"}`} /></div>
                <h2 className={`text-5xl font-bold font-mono tracking-tighter ${criticalServices.length > 0 ? "text-rose-400" : "text-slate-100"}`}>{criticalServices.length}</h2>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between mb-4"><span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Mesh Cohesion</span><Network className="text-amber-400/80 w-5 h-5" /></div>
                <div className="flex items-end gap-3">
                  <h2 className="text-5xl font-bold font-mono text-amber-400 tracking-tighter">{syncLevel}%</h2>
                  <span className="text-xs text-slate-500 mb-2 font-mono">{incidents.length} logs</span>
                </div>
                {/* Mini cohesion sparkline */}
                <div className="flex items-end gap-1 h-8 mt-3">
                  {[48,32,58,22,36,44,26,51,38,29].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm bg-amber-400/50" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* TOPOLOGY */}
            <div className="flex-1 min-h-[400px] p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-200 tracking-tight">
                  <LayoutGrid className="w-5 h-5 text-blue-400" /> Active Topology
                  {activeFilter !== "ALL" && (
                    <span className="ml-3 text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 flex items-center gap-1 border border-slate-700">
                      <Filter className="w-3 h-3" /> {activeFilter}
                      <button onClick={() => setActiveFilter("ALL")} className="ml-1 text-slate-500 hover:text-white"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </h3>
                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
                  <button onClick={() => setViewMode("GRID")} className={`p-1.5 rounded-md transition-colors ${viewMode === "GRID" ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode("TABLE")} className={`p-1.5 rounded-md transition-colors ${viewMode === "TABLE" ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}><List className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex-1 rounded-xl p-4 md:p-6 bg-[#020617] border border-slate-800/50 overflow-y-auto shadow-inner">
                <ConsulTopology
                  services={displayedServices}
                  viewMode={viewMode}
                  onSelect={setSelectedNode}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="xl:col-span-4 flex flex-col gap-6 h-full">
            <AgentLiveTrace logs={terminalLogs} isStreaming={isStreaming} />

            {/* LEDGER */}
            <div className="h-[380px] p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col">
              <h3 className="text-xs font-bold flex items-center gap-2 mb-5 text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-4">
                <HardDrive className="w-4 h-4 text-blue-400" /> Immutable Action Ledger
              </h3>
              <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                {incidents.map((inc) => (
                  <div key={inc.id} onClick={() => setSelectedIncident(inc)} className="flex flex-col p-4 rounded-xl bg-[#020617] border border-slate-800 hover:border-slate-600 hover:bg-slate-900 cursor-pointer transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm font-semibold text-slate-200">{inc.service_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {mounted ? new Date(inc.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3 line-clamp-2 leading-relaxed">{inc.issue_description}</p>
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{inc.action_taken}</span>
                      <span className={`text-[9px] uppercase tracking-widest font-bold ${
                        inc.status === "Resolved" ? "text-emerald-400" :
                        inc.status === "Monitoring" ? "text-amber-400" : "text-blue-400"
                      }`}>{inc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: NODE INSPECTOR */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/90 backdrop-blur-sm p-4" onClick={() => { setSelectedNode(null); setAiReport(null); }}>
              <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                  <div className="flex items-center gap-3"><Info className="text-blue-400 w-5 h-5" /><h3 className="text-lg font-bold tracking-tight text-white">Node Inspector</h3></div>
                  <button onClick={() => { setSelectedNode(null); setAiReport(null); }} className="p-1.5 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-center p-5 rounded-xl bg-[#020617] border border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">Registered Component</p>
                      <p className="text-2xl font-mono font-medium text-slate-100">{selectedNode.ServiceName}</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                      selectedNode.Status === "passing" ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20" :
                      selectedNode.Status === "warning"  ? "text-amber-400 bg-amber-400/10 border border-amber-400/20" :
                      "text-rose-400 bg-rose-400/10 border border-rose-400/20"
                    }`}>{selectedNode.Status}</div>
                  </div>

                  {(selectedNode.Status === "critical" || selectedNode.Status === "warning") && (
                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-400" /><h4 className="font-semibold text-purple-100 tracking-tight">OpenClaw AI Diagnosis</h4></div>
                          {!aiReport && !isAnalyzing && <button onClick={() => runAIAnalysis(selectedNode.ServiceName)} className="text-xs font-semibold bg-purple-500/20 border border-purple-500/30 text-purple-300 px-4 py-2 rounded hover:bg-purple-500/30 transition-colors">Run Diagnostic Trace</button>}
                        </div>
                        {aiReport ? (
                          <div className="space-y-4">
                            <p className="text-sm text-slate-300 leading-relaxed bg-[#020617]/50 p-4 rounded-lg border border-purple-500/10 font-mono">"{aiReport.diagnosis}"</p>
                            <div className="grid grid-cols-2 gap-4 border-t border-purple-500/20 pt-4">
                              <div><span className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/70 block mb-1">Confidence Score</span><span className="text-xl font-mono font-bold text-emerald-400">{aiReport.confidence}</span></div>
                              <div><span className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/70 block mb-1">Action Plan</span><span className="text-xs text-slate-300 block font-medium leading-relaxed">{aiReport.recommendation}</span></div>
                            </div>
                          </div>
                        ) : isAnalyzing ? (
                          <div className="flex items-center gap-3 text-sm text-purple-400 font-mono py-4"><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing core dumps and unwinding stack...</div>
                        ) : (
                          <p className="text-sm text-slate-400">Node isolation detected. Run an AI diagnostic trace to identify the root cause.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Remediation Overrides</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button onClick={() => handleHardRestart(selectedNode.ServiceName)} disabled={isRestarting} className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-300 transition-colors">
                        {isRestarting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                        {isRestarting ? "Rebooting..." : "Hard Restart"}
                      </button>
                      <button onClick={() => streamLiveLogs(selectedNode.ServiceName)} className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-sm font-semibold text-emerald-400 transition-colors"><Activity className="w-4 h-4" /> Live Terminal</button>
                      <button onClick={() => scaleService(selectedNode.ServiceName)} className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-sm font-semibold text-blue-400 transition-colors">
                        {isScaling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                        {isScaling ? "Provisioning..." : "Scale Horizontally"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL: AUDIT TRAIL */}
        <AnimatePresence>
          {selectedIncident && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-4" onClick={() => setSelectedIncident(null)}>
              <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                  <div className="flex items-center gap-3"><HardDrive className="text-blue-400 w-5 h-5" /><h3 className="text-lg font-bold tracking-tight text-white">Forensic Audit Trail</h3></div>
                  <button onClick={() => setSelectedIncident(null)} className="p-1.5 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div><p className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">Target Node</p><p className="text-xl font-mono font-medium text-slate-100">{selectedIncident.service_name}</p></div>
                    <div className="text-right"><p className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">Hash Record</p><p className="text-xs font-mono text-slate-400">#AUTH-{selectedIncident.id}</p></div>
                  </div>
                  <div className="bg-[#020617] p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold mb-2 tracking-widest uppercase">System Diagnosis</p>
                    <p className="text-sm text-slate-300 font-mono leading-relaxed">{selectedIncident.issue_description}</p>
                  </div>
                  <div className="bg-[#020617] p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold mb-2 tracking-widest uppercase">Execution Payload</p>
                    <div className="text-xs text-blue-400 font-mono whitespace-pre-wrap flex items-start gap-2">
                      <FileJson className="w-4 h-4 shrink-0 mt-0.5" />
                      {JSON.stringify({ target: selectedIncident.service_name, directive: selectedIncident.action_taken, timestamp: selectedIncident.created_at, status_code: 200, verification: selectedIncident.status }, null, 2)}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CMD+K PALETTE */}
        <AnimatePresence>
          {isCommandOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-[#020617]/80 backdrop-blur-md p-4" onClick={() => setIsCommandOpen(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                <div className="flex items-center px-4 py-4 border-b border-slate-800 bg-slate-950">
                  <Search className="w-5 h-5 text-slate-500 mr-3" />
                  <input autoFocus type="text" placeholder="Type a service name to filter..." className="flex-1 bg-transparent border-none outline-none text-slate-200 text-lg placeholder:text-slate-600" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded font-mono text-xs text-slate-400">ESC</kbd>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {displayedServices.length > 0 ? displayedServices.map(s => (
                    <div key={s.CheckID} onClick={() => { setSelectedNode(s); setIsCommandOpen(false); }} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${s.Status === "passing" ? "bg-emerald-400" : s.Status === "warning" ? "bg-amber-400" : "bg-rose-400"}`} />
                        <span className="font-mono font-medium text-slate-200">{s.ServiceName}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">INSPECT <CheckCircle2 className="w-3 h-3" /></span>
                    </div>
                  )) : (
                    <div className="p-4 text-center text-slate-500 font-mono text-sm">No services matched your query.</div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}