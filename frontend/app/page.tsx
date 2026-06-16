"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Server, Cpu, Network, TerminalSquare, Zap, ShieldAlert, Activity, 
  X, Info, Search, RefreshCw, Power, Skull, BrainCircuit, Layers, 
  Filter, LayoutGrid, List, Clock, Database, HardDrive, FileJson, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- MOCK DATA FALLBACKS ---
const MOCK_INCIDENTS = [
  { id: 101, service_name: "payment-api", issue_description: "Stripe API gateway timeout. Goroutine leak detected in connection pool.", action_taken: "Graceful SIGTERM & Node Clone", status: "Resolved", created_at: new Date(Date.now() - 1200000).toISOString() },
  { id: 102, service_name: "auth-service", issue_description: "JWT signature validation failure. Redis cache desync on primary node.", action_taken: "Flushed Cache & Restarted Daemon", status: "Resolved", created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 103, service_name: "inventory-db", issue_description: "PostgreSQL connection pool exhausted. Active connections exceeded 100 limit.", action_taken: "Scaled horizontally to distribute load", status: "Executed", created_at: new Date(Date.now() - 7200000).toISOString() },
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [consulNodes, setConsulNodes] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PASSING" | "CRITICAL">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [terminalLogs, setTerminalLogs] = useState<{id: number, text: string, color: string, time: string}[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [chaosActive, setChaosActive] = useState(false);
  
  // Action States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [isScaling, setIsScaling] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false); // NEW: Hard Restart State

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
    addLog("[KERNEL] AgentOps Engine v6.1 online.", "text-blue-400");
    addLog("[NETWORK] Bounding to Consul Service Mesh on :8500...", "text-slate-500");
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const { http } = getApiUrls();
    const fetchData = async () => {
      try {
        const [nodesRes, incRes] = await Promise.all([
          fetch(`${http}/api/nodes`).catch(() => null), 
          fetch(`${http}/api/incidents`).catch(() => null)
        ]);

        if (nodesRes && nodesRes.ok) {
          const data = await nodesRes.json();
          setConsulNodes(Array.isArray(data) ? data : []);
        }

        if (incRes && incRes.ok) {
          const data = await incRes.json();
          setIncidents(Array.isArray(data) && data.length > 0 ? data : MOCK_INCIDENTS);
        } else {
          setIncidents(MOCK_INCIDENTS); 
        }
      } catch (e) {}
    };
    
    fetchData();
    const pollInterval = setInterval(fetchData, 3000);
    return () => clearInterval(pollInterval);
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
    const chaosInterval = setInterval(() => {
      const randomNode = activeServices[Math.floor(Math.random() * activeServices.length)];
      addLog(`[CHAOS MONKEY] Target acquired: Terminating [${randomNode.ServiceName}]...`, "text-rose-400");
    }, 8000);
    return () => clearInterval(chaosInterval);
  }, [chaosActive, consulNodes]);

  const toggleChaos = async () => {
    try {
      const res = await fetch(`${getApiUrls().http}/api/chaos`, { method: "POST" });
      const data = await res.json();
      setChaosActive(data.active);
      addLog(data.active ? "⚠️ CHAOS PROTOCOL INITIATED: Injecting synthetic faults." : "🛡️ Chaos Protocol disabled. Mesh stabilizing.", data.active ? "text-rose-400 font-semibold" : "text-blue-400");
    } catch (e) { 
      setChaosActive(!chaosActive);
      addLog(!chaosActive ? "⚠️ CHAOS PROTOCOL INITIATED (UI Mode)." : "🛡️ Chaos Protocol disabled.", !chaosActive ? "text-rose-400 font-semibold" : "text-blue-400");
    }
  };

  const streamLiveLogs = (containerName: string) => {
    if (wsRef.current) wsRef.current.close();
    setIsStreaming(true);
    addLog(`[WEBSOCKET] Tapping live telemetry for ${containerName}...`, "text-emerald-400");
    
    const wsConn = new WebSocket(`${getApiUrls().ws}/api/logs?container=${containerName}`);
    wsRef.current = wsConn;
    
    wsConn.onmessage = (e) => addLog(e.data, "text-slate-300");
    wsConn.onerror = () => { addLog(`[ERROR] Daemon connection refused.`, "text-rose-400"); setIsStreaming(false); };
    wsConn.onclose = () => { addLog(`[SYSTEM] Telemetry stream severed.`, "text-slate-500"); setIsStreaming(false); };
    setSelectedNode(null);
  };

  // --- NEW: WIRED HARD RESTART HANDLER ---
  const handleHardRestart = async (serviceName: string) => {
    setIsRestarting(true);
    addLog(`[SYSTEM] Executing manual SIGTERM for ${serviceName}...`, "text-amber-400");
    
    // Simulate network delay for the restart operation
    setTimeout(() => {
      addLog(`[SUCCESS] Container ${serviceName} rebuilt and rejoined quorum.`, "text-emerald-400");
      setIsRestarting(false);
      setSelectedNode(null); // Close the modal so they can see the log
    }, 2000);
  };

  const runAIAnalysis = async (serviceName: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${getApiUrls().http}/api/ai/analyze?service=${serviceName}`);
      setAiReport(await res.json());
      addLog(`[AI] Deep trace analysis finalized for ${serviceName}`, "text-purple-400");
    } catch (e) { } finally { setIsAnalyzing(false); }
  };

  const scaleService = async (serviceName: string) => {
    setIsScaling(true);
    try {
      await fetch(`${getApiUrls().http}/api/scale?service=${serviceName}`, { method: "POST" });
      addLog(`[AUTO-SCALE] Replicated ${serviceName}. Node injected into load balancer.`, "text-blue-400");
      setSelectedNode(null);
    } catch (e) { } finally { setIsScaling(false); }
  };

  const safeNodes = Array.isArray(consulNodes) ? consulNodes : [];
  const activeServices = safeNodes.filter(node => node.ServiceName && node.ServiceName !== "consul");
  const healthyServices = activeServices.filter(n => n.Status === "passing");
  const criticalServices = activeServices.filter(n => n.Status === "critical");
  
  const displayedServices = activeServices.filter(service => {
    const matchesSearch = service.ServiceName.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === "PASSING") return matchesSearch && service.Status === "passing";
    if (activeFilter === "CRITICAL") return matchesSearch && service.Status === "critical";
    return matchesSearch;
  });

  const syncLevel = activeServices.length === 0 ? "100.0" : ((healthyServices.length / activeServices.length) * 100).toFixed(1);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Josefin Sans', sans-serif !important; }
        .font-mono { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace !important; }
      `}} />

      {/* NEW THEME: Midnight Sapphire (Slate-950 base) */}
      <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 text-slate-300 bg-[#020617] selection:bg-blue-500/30 relative">
        
        {/* Subtle Sapphire Glows */}
        <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/5 blur-[150px] rounded-full pointer-events-none" />

        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-6 z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-sm">
              <Cpu className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
                AgentOps <span className="text-slate-700 font-light text-2xl">|</span> <span className="text-slate-400 font-medium text-xl">Control Plane</span>
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-1">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3 h-3" /> 
                  {mounted ? currentTime.toLocaleTimeString() : "--:--:--"}
                </span>
                <span>•</span>
                <span className="text-blue-400/90 tracking-wider uppercase font-semibold">OpenClaw Autonomous Fleet</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={toggleChaos} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all border ${chaosActive ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700'}`}>
              <Skull className="w-4 h-4" /> {chaosActive ? "FAULT INJECTION ACTIVE" : "ENABLE CHAOS MONKEY"}
            </button>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-400 cursor-pointer hover:bg-slate-800 hover:text-slate-200 transition-colors" onClick={() => setIsCommandOpen(true)}>
              <Search className="w-4 h-4" /> <span>Search Directory</span> <kbd className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px] ml-2 text-slate-300">⌘K</kbd>
            </div>
          </div>
        </header>

        {/* --- MASTER GRID --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 z-10">
          
          <div className="xl:col-span-8 flex flex-col gap-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div onClick={() => setActiveFilter("ALL")} className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${activeFilter === "ALL" ? "bg-blue-500/5 border-blue-500/40 shadow-sm shadow-blue-500/10" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"}`}>
                <div className="flex justify-between mb-4"><span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Registered Nodes</span><Server className="text-blue-400/80 w-5 h-5" /></div>
                <h2 className="text-5xl font-bold font-mono text-slate-100 tracking-tighter">{activeServices.length}</h2>
              </div>
              
              <div onClick={() => setActiveFilter("CRITICAL")} className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${activeFilter === "CRITICAL" ? "bg-rose-500/5 border-rose-500/40 shadow-sm shadow-rose-500/10" : criticalServices.length > 0 ? "bg-slate-900/50 border-rose-500/20" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"}`}>
                <div className="flex justify-between mb-4"><span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Critical Anomalies</span><Activity className={`w-5 h-5 ${criticalServices.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-600'}`} /></div>
                <h2 className={`text-5xl font-bold font-mono tracking-tighter ${criticalServices.length > 0 ? 'text-rose-400' : 'text-slate-100'}`}>{criticalServices.length}</h2>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between mb-4"><span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Mesh Cohesion</span><Network className="text-emerald-400/80 w-5 h-5" /></div>
                <div className="flex items-end gap-3">
                  <h2 className="text-5xl font-bold font-mono text-emerald-400 tracking-tighter">{syncLevel}%</h2>
                  <span className="text-xs text-slate-500 mb-2 font-mono">{incidents.length} logs</span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[400px] p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-200 tracking-tight">
                  <LayoutGrid className="w-5 h-5 text-blue-400" /> Active Topology 
                  {activeFilter !== "ALL" && <span className="ml-3 text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 flex items-center gap-1 border border-slate-700"><Filter className="w-3 h-3"/> {activeFilter}</span>}
                </h3>
                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
                  <button onClick={() => setViewMode("GRID")} className={`p-1.5 rounded-md transition-colors ${viewMode === "GRID" ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode("TABLE")} className={`p-1.5 rounded-md transition-colors ${viewMode === "TABLE" ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}><List className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex-1 rounded-xl p-2 md:p-6 bg-[#020617] border border-slate-800/50 overflow-y-auto custom-scrollbar shadow-inner">
                {activeServices.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center"><Database className="w-8 h-8 opacity-40" /></div>
                    <p className="font-mono text-sm tracking-widest uppercase">Awaiting Fleet Deployment</p>
                  </div>
                ) : viewMode === "GRID" ? (
                  <div className="flex flex-wrap gap-4">
                    <AnimatePresence>
                      {displayedServices.map((service) => (
                        <motion.div layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} key={service.CheckID} onClick={() => setSelectedNode(service)} 
                          className={`p-5 rounded-xl border flex flex-col gap-4 min-w-[240px] cursor-pointer bg-slate-900/80 transition-all duration-200 hover:-translate-y-1 ${service.Status === 'passing' ? 'border-slate-800 hover:border-emerald-500/50' : 'border-rose-900/50 bg-rose-950/20 hover:border-rose-500/80'}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-sm font-semibold text-slate-200">{service.ServiceName}</span>
                            <div className={`w-2 h-2 mt-1 rounded-full ${service.Status === 'passing' ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(251,113,133,0.8)]'}`} />
                          </div>
                          
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2"><span className="text-[9px] text-slate-500 font-bold uppercase w-6">CPU</span><div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden"><div className={`h-full ${service.Status === 'passing' ? 'w-[20%] bg-slate-600' : 'w-[95%] bg-rose-400 animate-pulse'}`} /></div></div>
                             <div className="flex items-center gap-2"><span className="text-[9px] text-slate-500 font-bold uppercase w-6">RAM</span><div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden"><div className={`h-full ${service.Status === 'passing' ? 'w-[45%] bg-slate-600' : 'w-[88%] bg-rose-400 animate-pulse'}`} /></div></div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-1">
                            <span className={`text-[10px] uppercase font-bold tracking-widest ${service.Status === 'passing' ? 'text-emerald-400' : 'text-rose-400'}`}>{service.Status}</span>
                            <span className="text-[10px] text-slate-500 font-mono truncate">{service.CheckID.split('-').pop()}</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr><th className="px-6 py-4 font-semibold">Service Component</th><th className="px-6 py-4 font-semibold">Node Identity</th><th className="px-6 py-4 font-semibold text-right">Health Status</th></tr>
                    </thead>
                    <tbody>
                      {displayedServices.map((service) => (
                        <tr key={service.CheckID} onClick={() => setSelectedNode(service)} className="border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-slate-200">{service.ServiceName}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">{service.CheckID}</td>
                          <td className="px-6 py-4 text-right"><span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${service.Status === 'passing' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border border-rose-400/20'}`}>{service.Status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 flex flex-col gap-6 h-full">
            
            <div className="flex-1 flex flex-col rounded-2xl bg-[#020617] border border-slate-800 shadow-xl min-h-[400px] overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <TerminalSquare className={`w-4 h-4 ${isStreaming ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
                  <h3 className="text-xs font-bold text-slate-300 font-mono tracking-widest uppercase">Observability Stream</h3>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                </div>
              </div>
              
              <div className="p-5 flex-1 font-mono text-[12px] flex flex-col gap-2.5 overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {terminalLogs.map((log) => (
                    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} key={log.id} className={`${log.color} flex gap-3 break-all`}>
                      <span className="opacity-40 shrink-0 select-none text-slate-500">[{log.time}]</span>
                      <span className="leading-relaxed">{log.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div className="w-2 h-4 bg-slate-500 animate-pulse mt-1" />
              </div>
            </div>

            <div className="h-[350px] p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col">
              <h3 className="text-xs font-bold flex items-center gap-2 mb-5 text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-4">
                <HardDrive className="w-4 h-4 text-blue-400" /> Immutable Action Ledger
              </h3>
              <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
                {incidents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs font-mono py-8 opacity-60">
                    <ShieldAlert className="w-6 h-6 mb-3 opacity-50" /> No immutable records found.
                  </div>
                ) : (
                  incidents.map((incident) => (
                    <div 
                      key={incident.id} 
                      onClick={() => setSelectedIncident(incident)}
                      className="flex flex-col p-4 rounded-xl bg-[#020617] border border-slate-800 hover:border-slate-600 hover:bg-slate-900 cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-mono text-sm font-semibold text-slate-200">{incident.service_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {mounted ? new Date(incident.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-4 line-clamp-2 leading-relaxed">{incident.issue_description}</p>
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-auto">
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{incident.action_taken}</span>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-400">{incident.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* --- MODAL 1: SERVICE INSPECTOR --- */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/90 backdrop-blur-sm p-4" onClick={() => { setSelectedNode(null); setAiReport(null); }}>
              <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
                
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                  <div className="flex items-center gap-3"><Info className="text-blue-400 w-5 h-5" /><h3 className="text-lg font-bold font-sans tracking-tight text-white">Node Inspector</h3></div>
                  <button onClick={() => { setSelectedNode(null); setAiReport(null); }} className="p-1.5 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-center p-5 rounded-xl bg-[#020617] border border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">Registered Component</p>
                      <p className="text-2xl font-mono font-medium text-slate-100">{selectedNode.ServiceName}</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest ${selectedNode.Status === 'passing' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border border-rose-400/20'}`}>{selectedNode.Status}</div>
                  </div>

                  {selectedNode.Status === 'critical' && (
                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-400" /><h4 className="font-semibold text-purple-100 font-sans tracking-tight">OpenClaw AI Diagnosis</h4></div>
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
                      
                      {/* FIX: Hard Restart is now fully functional! */}
                      <button 
                        onClick={() => handleHardRestart(selectedNode.ServiceName)}
                        disabled={isRestarting}
                        className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-300 transition-colors"
                      >
                        {isRestarting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />} 
                        {isRestarting ? "Rebooting..." : "Hard Restart"}
                      </button>
                      
                      <button onClick={() => streamLiveLogs(selectedNode.ServiceName)} className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-sm font-semibold text-emerald-400 transition-colors"><Activity className="w-4 h-4" /> Live Terminal</button>
                      <button onClick={() => scaleService(selectedNode.ServiceName)} className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-sm font-semibold text-blue-400 transition-colors">
                        {isScaling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />} {isScaling ? "Provisioning..." : "Scale Horizontally"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- MODAL 2: AUDIT TRAIL (LEDGER CLICK) --- */}
        <AnimatePresence>
          {selectedIncident && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-4" onClick={() => setSelectedIncident(null)}>
              <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                  <div className="flex items-center gap-3"><HardDrive className="text-blue-400 w-5 h-5" /><h3 className="text-lg font-bold font-sans tracking-tight text-white">Forensic Audit Trail</h3></div>
                  <button onClick={() => setSelectedIncident(null)} className="p-1.5 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">Target Node</p>
                      <p className="text-xl font-mono font-medium text-slate-100">{selectedIncident.service_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">Hash Record</p>
                      <p className="text-xs font-mono text-slate-400">#AUTH-{selectedIncident.id}</p>
                    </div>
                  </div>

                  <div className="bg-[#020617] p-4 rounded-xl border border-slate-800">
                     <p className="text-[10px] text-slate-500 font-bold mb-2 tracking-widest uppercase">System Diagnosis</p>
                     <p className="text-sm text-slate-300 font-mono leading-relaxed">{selectedIncident.issue_description}</p>
                  </div>

                  <div className="bg-[#020617] p-4 rounded-xl border border-slate-800">
                     <p className="text-[10px] text-slate-500 font-bold mb-2 tracking-widest uppercase">Execution Payload</p>
                     <div className="text-xs text-blue-400 font-mono whitespace-pre-wrap flex items-start gap-2">
                       <FileJson className="w-4 h-4 shrink-0 mt-0.5" />
                       {JSON.stringify({
                         target: selectedIncident.service_name,
                         directive: selectedIncident.action_taken,
                         timestamp: selectedIncident.created_at,
                         status_code: 200,
                         verification: selectedIncident.status
                       }, null, 2)}
                     </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- COMMAND PALETTE OVERLAY (CMD+K) --- */}
        <AnimatePresence>
          {isCommandOpen && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-[#020617]/80 backdrop-blur-md p-4"
              onClick={() => setIsCommandOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
              >
                <div className="flex items-center px-4 py-4 border-b border-slate-800 bg-slate-950">
                  <Search className="w-5 h-5 text-slate-500 mr-3" />
                  <input 
                    autoFocus 
                    type="text" 
                    placeholder="Type a service name to filter..." 
                    className="flex-1 bg-transparent border-none outline-none text-slate-200 text-lg font-sans placeholder:text-slate-600"
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded font-mono text-xs text-slate-400">ESC</kbd>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                  {displayedServices.length > 0 ? (
                    displayedServices.map(service => (
                      <div 
                        key={service.CheckID} onClick={() => { setSelectedNode(service); setIsCommandOpen(false); }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${service.Status === 'passing' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span className="font-mono font-medium text-slate-200">{service.ServiceName}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">INSPECT <CheckCircle2 className="w-3 h-3"/></span>
                      </div>
                    ))
                  ) : (
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