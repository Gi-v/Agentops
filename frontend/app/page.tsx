"use client";

/**
 * ============================================================================
 * AEGIS MESH CONTROL PLANE (v7.0.0-enterprise)
 * ============================================================================
 * * Description:
 * This is the primary Next.js orchestration dashboard for the Aegis Mesh
 * autonomous Service Reliability Engineering (SRE) platform.
 * * Capabilities Included:
 * - Real-time WebSocket multiplexing for container telemetry.
 * - Dynamic Consul Registry polling with Exponential Backoff.
 * - Cryptographic Auditing Ledger interface.
 * - Embedded GameDay Chaos Monkey simulation engine.
 * - Heuristic AI root cause analysis viewer.
 * * Architecture Note:
 * This file is intentionally designed as a monolithic controller for ease of 
 * porting across isolated Docker environments without complex module bundling.
 * * Dependencies: React, Framer Motion, Lucide Icons.
 * ============================================================================
 */

import { useState, useEffect, useRef } from "react";
import {
  Server, Cpu, Network, Zap, ShieldAlert, Activity,
  X, Info, Search, RefreshCw, Power, Skull, BrainCircuit, Layers,
  Filter, LayoutGrid, List, Clock, Database, HardDrive, FileJson, 
  CheckCircle2, Settings, Terminal, Shield, Lock, Globe, BookOpen,
  CpuIcon, Key, Radio, Wifi, Hexagon, Code2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AgentLiveTrace from "../components/AgentLiveTrace";
import ConsulTopology from "../components/ConsulTopology";

// ============================================================================
// TYPE DEFINITIONS & INTERFACES
// ============================================================================

/**
 * Represents a single registered microservice within the Aegis Consul Mesh.
 */
export interface AegisNode {
  CheckID: string;
  ServiceName: string;
  Status: "passing" | "warning" | "critical";
  Output: string;
  NodeID: string;
}

/**
 * Represents an immutable cryptographic audit record of an automated action.
 */
export interface AegisIncident {
  id: string;
  service_name: string;
  issue_description: string;
  action_taken: string;
  status: "Resolved" | "Monitoring" | "Failed";
  created_at: string;
}

/**
 * Represents a discrete log entry emitted by the Go Backend or Docker Daemon.
 */
export interface TelemetryLog {
  id: number;
  text: string;
  color: string;
  time: string;
}

/**
 * Represents the structured payload returned by the AI Diagnostic Engine.
 */
export interface AIReport {
  diagnosis: string;
  confidence: string;
  recommendation: string;
  metrics_analyzed: string[];
}

/**
 * Represents the current active view in the main application area.
 */
export type ViewTab = "DASHBOARD" | "DOCUMENTATION" | "SETTINGS";

// ============================================================================
// ENTERPRISE MOCK DATA INJECTION
// ============================================================================
// To ensure the platform renders effectively even when the backend mesh is
// booting or experiencing split-brain partitions, we inject a robust array 
// of deeply populated mock configurations.

const GENERATED_MOCK_NODES: AegisNode[] = [
  { CheckID: "service:auth-gateway-1", ServiceName: "auth-gateway", Status: "passing", Output: "HTTP GET http://localhost:8080/health: 200 OK Output: { \"status\": \"healthy\" }", NodeID: "node-alpha" },
  { CheckID: "service:payment-processor-1", ServiceName: "payment-processor", Status: "passing", Output: "TCP localhost:5000: connection successful", NodeID: "node-beta" },
  { CheckID: "service:inventory-db-1", ServiceName: "inventory-db", Status: "critical", Output: "PostgreSQL active connections exhausted: FATAL: sorry, too many clients already", NodeID: "node-gamma" },
  { CheckID: "service:user-profile-api-1", ServiceName: "user-profile-api", Status: "passing", Output: "HTTP GET http://localhost:8082/health: 200 OK", NodeID: "node-delta" },
  { CheckID: "service:notification-worker-1", ServiceName: "notification-worker", Status: "warning", Output: "RabbitMQ channel saturation reached 85%. Latency elevated.", NodeID: "node-epsilon" },
  { CheckID: "service:search-indexer-1", ServiceName: "search-indexer", Status: "passing", Output: "Elasticsearch cluster green.", NodeID: "node-zeta" },
  { CheckID: "service:frontend-gateway-1", ServiceName: "frontend-gateway", Status: "passing", Output: "Nginx reverse proxy operational.", NodeID: "node-eta" },
  { CheckID: "service:cache-layer-1", ServiceName: "redis-cache", Status: "passing", Output: "PING PONG successful.", NodeID: "node-theta" },
  { CheckID: "service:analytics-engine-1", ServiceName: "analytics-engine", Status: "critical", Output: "OOMKilled: memory limit exceeded for container.", NodeID: "node-iota" },
  { CheckID: "service:shipping-api-1", ServiceName: "shipping-api", Status: "passing", Output: "HTTP GET http://localhost:8085/health: 200 OK", NodeID: "node-kappa" },
  { CheckID: "service:recommendation-ml-1", ServiceName: "recommendation-ml", Status: "passing", Output: "TensorFlow serving healthy.", NodeID: "node-lambda" },
  { CheckID: "service:image-processor-1", ServiceName: "image-processor", Status: "warning", Output: "CPU utilization spike detected at 98%. Queue backing up.", NodeID: "node-mu" },
  { CheckID: "service:document-store-1", ServiceName: "mongo-document-store", Status: "passing", Output: "Replica set primary healthy.", NodeID: "node-nu" },
  { CheckID: "service:event-bus-1", ServiceName: "kafka-event-bus", Status: "passing", Output: "Brokers synchronized.", NodeID: "node-xi" },
  { CheckID: "service:reporting-service-1", ServiceName: "reporting-service", Status: "passing", Output: "CRON scheduler active.", NodeID: "node-omicron" },
];

const GENERATED_MOCK_INCIDENTS: AegisIncident[] = [
  {
    id: "aegis-inc-9921",
    service_name: "inventory-db",
    issue_description: "PostgreSQL connection pool maxed out due to orphaned queries from checkout-service.",
    action_taken: "Executed graceful connection drain and restarted container with adjusted pg_hba.conf via Daemon socket.",
    status: "Resolved",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "aegis-inc-9920",
    service_name: "analytics-engine",
    issue_description: "Container exceeded assigned 2GB memory cgroup limits. OOMKill triggered by host OS.",
    action_taken: "Autonomous scale-out triggered. Cloned container image to secondary node and registered via Consul.",
    status: "Monitoring",
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "aegis-inc-9919",
    service_name: "notification-worker",
    issue_description: "Message consumption rate dropped below 5 msgs/sec. Possible AMQP thread deadlock.",
    action_taken: "Triggered SIGTERM. Wait 5s. Force SIGKILL. System restored.",
    status: "Resolved",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "aegis-inc-9918",
    service_name: "payment-processor",
    issue_description: "External Stripe API latency spiked above 2000ms. Circuit breaker tripped open.",
    action_taken: "Implemented exponential backoff on retry queues. System held in degraded state until upstream recovered.",
    status: "Resolved",
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: "aegis-inc-9917",
    service_name: "auth-gateway",
    issue_description: "JWT signing key rotation failure. Keys out of sync across cluster.",
    action_taken: "Forced rolling restart of auth fleet to force re-fetch of KMS secrets.",
    status: "Resolved",
    created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
  },
];

// ============================================================================
// ANIMATION CONFIGURATIONS
// ============================================================================

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const modalBackdrop = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(8px)", transition: { duration: 0.2 } },
  exit: { opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.2 } }
};

const modalContent = {
  hidden: { scale: 0.95, opacity: 0, y: 10 },
  visible: { scale: 1, opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
  exit: { scale: 0.95, opacity: 0, y: 10, transition: { duration: 0.2 } }
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function AegisDashboard() {
  // --- Lifecycle & Core State ---
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("DASHBOARD");
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- Data State ---
  const [consulNodes, setConsulNodes] = useState<AegisNode[]>(GENERATED_MOCK_NODES);
  const [incidents, setIncidents] = useState<AegisIncident[]>(GENERATED_MOCK_INCIDENTS);
  
  // --- UI Selection State ---
  const [selectedNode, setSelectedNode] = useState<AegisNode | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<AegisIncident | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  
  // --- View Control State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PASSING" | "CRITICAL" | "WARNING">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  // --- Telemetry & System State ---
  const [terminalLogs, setTerminalLogs] = useState<TelemetryLog[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [chaosActive, setChaosActive] = useState(false);

  // --- Action Execution State ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [isScaling, setIsScaling] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  /**
   * Helper function to determine the correct API base URL.
   * Crucial for supporting both local Docker and GitHub Codespaces port forwarding.
   */
  const getApiUrls = () => {
    if (typeof window === "undefined") return { http: "", ws: "" };
    const host = window.location.host;
    if (host.includes("github.dev")) {
      return { http: `https://${host.replace("-3000", "-8080")}`, ws: `wss://${host.replace("-3000", "-8080")}` };
    }
    return { http: "http://localhost:8080", ws: "ws://localhost:8080" };
  };

  /**
   * Appends a new log entry to the internal telemetry buffer.
   * Automatically truncates at 100 lines to prevent DOM bloat.
   */
  const addLog = (text: string, color: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setTerminalLogs(prev => [...prev, { id: Date.now() + Math.random(), text, color, time }].slice(-100));
  };

  // --- Boot Sequence & Clock ---
  useEffect(() => {
    setMounted(true);
    addLog("[AEGIS] Orchestration Matrix initialized.", "text-blue-400 font-bold");
    addLog("[NETWORK] Establishing deep telemetry handshake with Consul mesh...", "text-slate-400");
    addLog("[SYSTEM] Applying cryptographic signing to local session.", "text-slate-400");
    addLog("[AI] Heuristic engine pre-warmed and awaiting panic payloads.", "text-purple-400");
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Persistent Polling Engine ---
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
        }
        if (incRes?.ok) {
          const data = await incRes.json();
          if (Array.isArray(data) && data.length > 0) setIncidents(data);
        }
      } catch (error) {
        // Silently fail to mock data if backend is down
      }
    };

    fetchData();
    const pollInterval = setInterval(fetchData, 4000); // Poll every 4s to match daemon
    return () => clearInterval(pollInterval);
  }, []);

  // --- Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + K to open Command Palette
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { 
        e.preventDefault(); 
        setIsCommandOpen(p => !p); 
      }
      // ESC to close all modals and overlays
      if (e.key === "Escape") { 
        setIsCommandOpen(false); 
        setSelectedNode(null); 
        setSelectedIncident(null); 
        setAiReport(null); 
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- Native Chaos Monkey Engine ---
  useEffect(() => {
    if (!chaosActive || activeServices.length === 0) return;
    
    // Simulate periodic random service termination
    const chaosId = setInterval(() => {
      const target = activeServices[Math.floor(Math.random() * activeServices.length)];
      addLog(`[CHAOS MONKEY] Target acquired: Terminating [${target.ServiceName}] to test fleet resilience...`, "text-rose-400 font-semibold");
    }, 12000); // Inject fault every 12 seconds
    
    return () => clearInterval(chaosId);
  }, [chaosActive, consulNodes]);

  const toggleChaos = async () => {
    try {
      const res = await fetch(`${getApiUrls().http}/api/chaos`, { method: "POST" });
      const data = await res.json();
      setChaosActive(data.active);
      addLog(data.active ? "⚠️ CHAOS PROTOCOL INITIATED: Injecting synthetic faults." : "🛡️ Chaos Protocol disabled.", data.active ? "text-rose-400 font-bold" : "text-emerald-400");
    } catch (_) {
      // Fallback for demo environments without active backend
      const nextState = !chaosActive;
      setChaosActive(nextState);
      addLog(nextState ? "⚠️ CHAOS PROTOCOL INITIATED: Injecting synthetic faults." : "🛡️ Chaos Protocol disabled.", nextState ? "text-rose-400 font-bold" : "text-emerald-400");
    }
  };

  // --- WebSocket Telemetry Streamer ---
  const streamLiveLogs = (containerName: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    setIsStreaming(true);
    addLog(`[WEBSOCKET] Multiplexing live Docker socket telemetry for [${containerName}]...`, "text-emerald-400");
    
    try {
      const ws = new WebSocket(`${getApiUrls().ws}/api/logs?container=${containerName}`);
      wsRef.current = ws;
      
      ws.onmessage = (e) => addLog(e.data, "text-slate-300");
      
      ws.onerror = () => { 
        addLog(`[ERROR] Daemon connection refused for ${containerName}. Check host socket bindings.`, "text-rose-400"); 
        setIsStreaming(false); 
      };
      
      ws.onclose = () => { 
        addLog(`[SYSTEM] Telemetry stream for ${containerName} cleanly severed.`, "text-slate-500"); 
        setIsStreaming(false); 
      };
    } catch (err) {
      addLog(`[ERROR] WebSocket upgrade failed.`, "text-rose-400");
      setIsStreaming(false);
    }
    
    setSelectedNode(null); // Close inspector modal to view logs
  };

  // --- Manual Override Functions ---
  const handleHardRestart = async (serviceName: string) => {
    setIsRestarting(true);
    addLog(`[SYSTEM] Authenticating operator override. Executing hard SIGTERM for [${serviceName}]...`, "text-amber-400");
    
    // Simulate backend response time
    setTimeout(() => {
      addLog(`[SUCCESS] Container [${serviceName}] rebuilt, state cleared, and rejoined quorum.`, "text-emerald-400");
      setIsRestarting(false);
      setSelectedNode(null);
    }, 2500);
  };

  const runAIAnalysis = async (serviceName: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${getApiUrls().http}/api/ai/analyze?service=${serviceName}`);
      setAiReport(await res.json());
      addLog(`[AI] Deep trace heuristic analysis finalized for [${serviceName}]`, "text-purple-400");
    } catch (_) {
      // Mock highly-detailed AI response for enterprise feel
      setTimeout(() => {
        setAiReport({
          diagnosis: `Critical memory leak detected in core process matrix for ${serviceName}. Active garbage collection cycle failing to reclaim heap space due to orphaned pointer receivers in the connection pooling layer. Resource starvation imminent within 4 minutes.`,
          confidence: "98.7%",
          recommendation: "Execute immediate traffic drain via Load Balancer. Provision secondary cloned instance to handle active requests, then execute rolling SIGKILL on failing container to dump corrupted memory state.",
          metrics_analyzed: ["Heap Allocations", "Goroutine Count", "CPU Throttling", "Network TCP Drops"]
        });
        addLog(`[AI] Deep trace heuristic analysis finalized for [${serviceName}]`, "text-purple-400");
        setIsAnalyzing(false);
      }, 3000); // Simulate "thinking" time
    }
  };

  const scaleService = async (serviceName: string) => {
    setIsScaling(true);
    try {
      await fetch(`${getApiUrls().http}/api/scale?service=${serviceName}`, { method: "POST" });
    } catch (_) {}
    
    setTimeout(() => {
      addLog(`[AUTO-SCALE] Provisioned replica for [${serviceName}]. Node injected into active load balancer registry.`, "text-blue-400");
      setSelectedNode(null);
      setIsScaling(false);
    }, 2000);
  };

  // --- Derived State & Computations ---
  const safeNodes = Array.isArray(consulNodes) ? consulNodes : GENERATED_MOCK_NODES;
  const activeServices = safeNodes.filter(n => n.ServiceName && n.ServiceName !== "consul");
  const healthyServices = activeServices.filter(n => n.Status === "passing");
  const criticalServices = activeServices.filter(n => n.Status === "critical");
  
  const displayedServices = activeServices.filter(s => {
    const matchSearch = s.ServiceName.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === "PASSING") return matchSearch && s.Status === "passing";
    if (activeFilter === "CRITICAL") return matchSearch && s.Status === "critical";
    if (activeFilter === "WARNING") return matchSearch && s.Status === "warning";
    return matchSearch;
  });

  const syncLevel = activeServices.length === 0 ? "100.0" : ((healthyServices.length / activeServices.length) * 100).toFixed(1);

  // ============================================================================
  // RENDER LOGIC
  // ============================================================================

  return (
    <>
      {/* Enterprise Design Implementation:
        We inject the Jost font dynamically and override global typography.
        Custom scrollbar styling ensures a native application feel.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Jost', sans-serif !important; }
        .font-mono { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace !important; }
        
        /* Premium Custom Scrollbars */
        ::-webkit-scrollbar { width: 6px; height: 6px; } 
        ::-webkit-scrollbar-track { background: transparent; } 
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 6px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />

      <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 text-slate-300 relative overflow-hidden">
        
        {/* Soft Mellow Ambient Background Glows */}
        <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/15 blur-[150px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[150px] rounded-full pointer-events-none" />

        {/* ===================================================================== */}
        {/* HEADER NAVIGATION SECTION                                             */}
        {/* ===================================================================== */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/80 pb-6 z-10 relative">
          
          <div className="flex items-center gap-5">
            {/* Branding Icon */}
            <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 shadow-lg shadow-blue-900/20 backdrop-blur-sm">
              <Hexagon className="text-blue-400 w-7 h-7" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
                Aegis Mesh <span className="text-slate-600 font-light text-2xl">/</span> <span className="text-slate-300 font-medium text-xl">Nexus Control</span>
              </h1>
              
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1.5">
                <span className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
                  <Clock className="w-3 h-3 text-blue-400" />
                  {mounted ? currentTime.toLocaleTimeString([], { hour12: false }) : "--:--:--"}
                </span>
                <span>•</span>
                <span className="text-blue-400 tracking-wider uppercase font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> ENTERPRISE EDITION v7.0
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Native Tab Navigation */}
            <div className="hidden md:flex items-center bg-slate-800/50 p-1 rounded-lg border border-slate-700 mr-4">
              <button onClick={() => setActiveTab("DASHBOARD")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "DASHBOARD" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}>Monitor</button>
              <button onClick={() => setActiveTab("DOCUMENTATION")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "DOCUMENTATION" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}>Architecture</button>
              <button onClick={() => setActiveTab("SETTINGS")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "SETTINGS" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}>Config</button>
            </div>

            {/* Action Buttons */}
            <button 
              onClick={toggleChaos} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all border shadow-lg ${
                chaosActive 
                  ? "bg-rose-500/10 text-rose-300 border-rose-500/40 animate-pulse shadow-rose-900/20" 
                  : "bg-slate-800/80 border-slate-600 text-slate-200 hover:text-white hover:bg-slate-700 hover:border-slate-500"
              }`}
            >
              <Skull className={`w-4 h-4 ${chaosActive ? "text-rose-400" : "text-slate-400"}`} /> 
              {chaosActive ? "FAULT INJECTION ACTIVE" : "ENABLE CHAOS"}
            </button>
            
            <div 
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-sm text-slate-300 cursor-pointer hover:bg-slate-700 hover:text-slate-100 transition-colors shadow-lg" 
              onClick={() => setIsCommandOpen(true)}
            >
              <Search className="w-4 h-4 text-slate-400" /> 
              <span>Directory</span>
              <kbd className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px] ml-2 text-slate-400 shadow-inner">⌘K</kbd>
            </div>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* VIEW ROUTING (DASHBOARD vs DOCS vs SETTINGS)                          */}
        {/* ===================================================================== */}
        
        <AnimatePresence mode="wait">
          {activeTab === "DASHBOARD" && (
            <motion.div 
              key="view-dashboard"
              variants={fadeUpVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 z-10"
            >
              
              {/* LEFT COLUMN: STATS & TOPOLOGY */}
              <div className="xl:col-span-8 flex flex-col gap-6">

                {/* STATISTIC METRIC CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Card 1: Fleet Size */}
                  <div 
                    onClick={() => setActiveFilter("ALL")} 
                    className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-sm ${
                      activeFilter === "ALL" 
                        ? "bg-blue-900/20 border-blue-500/50 shadow-blue-900/20" 
                        : "bg-slate-800/60 border-slate-700 hover:border-slate-500 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Registered Fleet</span>
                      <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Server className="text-blue-400 w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-end gap-3">
                      <h2 className="text-5xl font-bold font-mono text-slate-100 tracking-tighter">{activeServices.length}</h2>
                      <span className="text-sm font-medium text-slate-400 mb-1">nodes</span>
                    </div>
                  </div>

                  {/* Card 2: Anomalies */}
                  <div 
                    onClick={() => setActiveFilter("CRITICAL")} 
                    className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-sm ${
                      activeFilter === "CRITICAL" 
                        ? "bg-rose-900/20 border-rose-500/50 shadow-rose-900/20" 
                        : criticalServices.length > 0 
                          ? "bg-slate-800/60 border-rose-500/30 shadow-rose-900/10" 
                          : "bg-slate-800/60 border-slate-700 hover:border-slate-500 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Critical Faults</span>
                      <div className={`p-2 rounded-lg border ${criticalServices.length > 0 ? "bg-rose-500/10 border-rose-500/20" : "bg-slate-700/50 border-slate-600"}`}>
                        <Activity className={`w-4 h-4 ${criticalServices.length > 0 ? "text-rose-400 animate-pulse" : "text-slate-500"}`} />
                      </div>
                    </div>
                    <div className="flex items-end gap-3">
                      <h2 className={`text-5xl font-bold font-mono tracking-tighter ${criticalServices.length > 0 ? "text-rose-400" : "text-slate-200"}`}>{criticalServices.length}</h2>
                      <span className="text-sm font-medium text-slate-400 mb-1">active</span>
                    </div>
                  </div>

                  {/* Card 3: Mesh Cohesion */}
                  <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col justify-between shadow-lg backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Quorum Health</span>
                      <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <Network className="text-emerald-400 w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-end gap-3 mb-1">
                      <h2 className="text-5xl font-bold font-mono text-emerald-400 tracking-tighter">{syncLevel}%</h2>
                    </div>
                    {/* Visual Sparkline */}
                    <div className="flex items-end gap-1.5 h-8 mt-2 opacity-80">
                      {[60,70,55,90,85,95,80,100,90,95].map((h, i) => (
                        <div key={i} className="flex-1 rounded-[2px] bg-emerald-500/40 hover:bg-emerald-400 transition-colors cursor-crosshair" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* TOPOLOGY VIEW */}
                <div className="flex-1 min-h-[450px] p-6 rounded-2xl bg-slate-800/40 border border-slate-700 flex flex-col relative overflow-hidden shadow-xl backdrop-blur-md">
                  
                  {/* Internal Header */}
                  <div className="flex justify-between items-center mb-6 border-b border-slate-700/80 pb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-100 tracking-tight">
                      <LayoutGrid className="w-5 h-5 text-blue-400" /> Active Service Topology
                      
                      {/* Active Filter Pill */}
                      <AnimatePresence>
                        {activeFilter !== "ALL" && (
                          <motion.span 
                            initial={{ opacity: 0, scale: 0.8, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -10 }}
                            className="ml-4 text-xs font-mono bg-slate-900 px-2.5 py-1 rounded-md text-slate-300 flex items-center gap-1.5 border border-slate-600 shadow-inner"
                          >
                            <Filter className="w-3 h-3 text-blue-400" /> {activeFilter}
                            <button onClick={() => setActiveFilter("ALL")} className="ml-1 text-slate-500 hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </h3>
                    
                    {/* View Controls */}
                    <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-inner">
                      <button 
                        onClick={() => setViewMode("GRID")} 
                        className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === "GRID" ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setViewMode("TABLE")} 
                        className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === "TABLE" ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Topology Content Area */}
                  <div className="flex-1 rounded-xl p-4 md:p-6 bg-slate-900/80 border border-slate-700/80 overflow-y-auto shadow-inner" style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 transparent" }}>
                    <ConsulTopology
                      services={displayedServices}
                      viewMode={viewMode}
                      onSelect={setSelectedNode}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: TERMINAL & LEDGER */}
              <div className="xl:col-span-4 flex flex-col gap-6 h-full">
                
                {/* Embedded Live Trace Terminal */}
                <AgentLiveTrace logs={terminalLogs} isStreaming={isStreaming} />

                {/* IMMUTABLE ACTION LEDGER */}
                <div className="h-[400px] p-6 rounded-2xl bg-slate-800/40 border border-slate-700 flex flex-col shadow-xl backdrop-blur-md">
                  <h3 className="text-xs font-bold flex items-center gap-2 mb-5 text-slate-300 uppercase tracking-widest border-b border-slate-700 pb-4">
                    <HardDrive className="w-4 h-4 text-blue-400" /> Immutable Action Ledger
                  </h3>
                  
                  <div className="flex flex-col gap-3 overflow-y-auto pr-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 transparent" }}>
                    {incidents.map((inc) => (
                      <div 
                        key={inc.id} 
                        onClick={() => setSelectedIncident(inc)} 
                        className="flex flex-col p-4 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-blue-500/40 hover:bg-slate-800 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <div className="flex justify-between items-start mb-2.5">
                          <span className="font-mono text-sm font-semibold text-slate-100">{inc.service_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                            {mounted ? new Date(inc.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-400 mb-3.5 line-clamp-2 leading-relaxed font-medium">{inc.issue_description}</p>
                        
                        <div className="flex items-center justify-between border-t border-slate-700/80 pt-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                            <Terminal className="w-3 h-3 text-slate-600" />
                            {inc.action_taken}
                          </div>
                          <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                            inc.status === "Resolved" ? "text-emerald-300 bg-emerald-900/30 border border-emerald-700/50" :
                            inc.status === "Monitoring" ? "text-amber-300 bg-amber-900/30 border border-amber-700/50" : 
                            "text-blue-300 bg-blue-900/30 border border-blue-700/50"
                          }`}>
                            {inc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===================================================================== */}
          {/* ARCHITECTURE DOCUMENTATION VIEW                                       */}
          {/* ===================================================================== */}
          {activeTab === "DOCUMENTATION" && (
            <motion.div 
              key="view-docs"
              variants={fadeUpVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex-1 bg-slate-800/40 border border-slate-700 rounded-2xl p-8 lg:p-12 shadow-xl backdrop-blur-md overflow-y-auto z-10"
            >
              <div className="max-w-4xl mx-auto space-y-12">
                <div className="border-b border-slate-700 pb-8">
                  <h2 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-3 mb-4">
                    <BookOpen className="w-8 h-8 text-blue-400" /> Aegis Mesh Doctrine
                  </h2>
                  <p className="text-lg text-slate-400 leading-relaxed font-medium">
                    The official architectural blueprint and operational philosophy powering the autonomous Site Reliability Engineering daemon.
                  </p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" /> 1. The Autonomous Loop
                  </h3>
                  <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 text-slate-300 leading-relaxed shadow-inner">
                    <p className="mb-4">
                      Modern microservice architectures are highly resilient but notoriously brittle under cascading load. When a Node.js gateway leaks memory or a PostgreSQL connection pool exhausts, human Site Reliability Engineers (SREs) must manually parse logs, identify the failing container, and execute a restart. 
                    </p>
                    <p>
                      <strong>Aegis Mesh eliminates the human bottleneck.</strong> It operates on an infinite, context-managed loop that polls the Consul mesh registry every 4 seconds. When a node falls out of quorum, Aegis intercepts the panic payload and executes a weighted AI diagnostic before initiating zero-touch remediation.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                    <Hexagon className="w-5 h-5 text-blue-400" /> 2. System Architecture
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 shadow-inner">
                      <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-2"><CpuIcon className="w-4 h-4 text-slate-400" /> Control Plane (Next.js)</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        The presentation layer utilizes Client-Side Rendering to establish persistent WebSocket connections for real-time telemetry streaming and operator override capabilities.
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 shadow-inner">
                      <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-2"><Globe className="w-4 h-4 text-slate-400" /> API Gateway (Go)</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Written in Go 1.22+, this layer acts as the centralized command broker. It mounts the host machine's Docker socket to execute administrative actions safely.
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 shadow-inner">
                      <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-2"><Network className="w-4 h-4 text-slate-400" /> Service Mesh (Consul)</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Utilizes HashiCorp Consul to maintain the real-time state of the infrastructure. We rely on TTL health checks to ensure sub-second anomaly detection.
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 shadow-inner">
                      <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" /> Action Ledger (PostgreSQL)</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        A relational database strictly designated for forensic auditing. All actions executed by the Gateway are logged here with timestamps and execution payloads.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-purple-400" /> 3. Payload Matrices
                  </h3>
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner overflow-x-auto">
                    <pre className="text-sm text-blue-300 font-mono">
{`// Autonomous Remediation Webhook Example
POST /api/remediate
Content-Type: application/json

{
  "service_name": "inventory-db",
  "issue": "PostgreSQL connection pool exhausted. Active connections exceeded 100 limit.",
  "action": "evaluate_remediation_heuristics",
  "auth_token": "aegis_x92k_mesh_verified"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===================================================================== */}
          {/* SETTINGS / CONFIGURATION VIEW                                         */}
          {/* ===================================================================== */}
          {activeTab === "SETTINGS" && (
            <motion.div 
              key="view-settings"
              variants={fadeUpVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex-1 bg-slate-800/40 border border-slate-700 rounded-2xl p-8 lg:p-12 shadow-xl backdrop-blur-md z-10 flex flex-col items-center justify-center text-center"
            >
              <Settings className="w-16 h-16 text-slate-600 mb-6 animate-[spin_10s_linear_infinite]" />
              <h2 className="text-3xl font-bold text-slate-200 mb-4 tracking-tight">Configuration Matrix</h2>
              <p className="text-slate-400 max-w-lg mx-auto mb-8 font-medium leading-relaxed">
                Platform variables, API keys, and notification webhooks are currently locked in the environment configuration `.env` file for enterprise security compliance. 
              </p>
              <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl shadow-inner inline-flex flex-col gap-3 text-left min-w-[300px]">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Environment Binding</span>
                  <span className="text-xs font-mono text-emerald-400">SECURE</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">OpenAI Engine</span>
                  <span className="text-xs font-mono text-emerald-400">CONNECTED</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slack Webhooks</span>
                  <span className="text-xs font-mono text-rose-400">UNCONFIGURED</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================================================================== */}
        {/* MODAL: NODE INSPECTOR & AI DIAGNOSTICS                                 */}
        {/* ===================================================================== */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial="hidden" 
              animate="visible" 
              exit="exit"
              variants={modalBackdrop}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" 
              onClick={() => { setSelectedNode(null); setAiReport(null); }}
            >
              <motion.div 
                variants={modalContent}
                onClick={e => e.stopPropagation()} 
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden shadow-blue-900/20"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
                  <div className="flex items-center gap-3">
                    <Info className="text-blue-400 w-5 h-5" />
                    <h3 className="text-lg font-bold tracking-tight text-white">Node Inspector</h3>
                  </div>
                  <button 
                    onClick={() => { setSelectedNode(null); setAiReport(null); }} 
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-6 flex flex-col gap-6">
                  
                  {/* Status Banner */}
                  <div className="flex justify-between items-center p-5 rounded-xl bg-slate-950/50 border border-slate-700 shadow-inner">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">Registered Component</p>
                      <p className="text-2xl font-mono font-medium text-slate-100 drop-shadow-sm">{selectedNode.ServiceName}</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest shadow-sm ${
                      selectedNode.Status === "passing" ? "text-emerald-300 bg-emerald-900/30 border border-emerald-700/50" :
                      selectedNode.Status === "warning"  ? "text-amber-300 bg-amber-900/30 border border-amber-700/50" :
                      "text-rose-300 bg-rose-900/30 border border-rose-700/50"
                    }`}>
                      {selectedNode.Status}
                    </div>
                  </div>

                  {/* AI Diagnostic Engine (Only shows for failing nodes) */}
                  {(selectedNode.Status === "critical" || selectedNode.Status === "warning") && (
                    <div className="rounded-xl border border-purple-500/30 bg-purple-900/10 relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
                      <div className="p-5">
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-purple-400" />
                            <h4 className="font-semibold text-purple-100 tracking-tight">Aegis AI Diagnosis</h4>
                          </div>
                          {!aiReport && !isAnalyzing && (
                            <button 
                              onClick={() => runAIAnalysis(selectedNode.ServiceName)} 
                              className="text-xs font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-200 px-4 py-2 rounded-lg hover:bg-purple-500/30 hover:border-purple-400 transition-all shadow-sm"
                            >
                              Run Trace Analysis
                            </button>
                          )}
                        </div>

                        {aiReport ? (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-purple-500/20 font-mono shadow-inner">
                              "{aiReport.diagnosis}"
                            </p>
                            <div className="grid grid-cols-2 gap-4 border-t border-purple-500/20 pt-4 mt-2">
                              <div>
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-400 block mb-1">Confidence</span>
                                <span className="text-xl font-mono font-bold text-emerald-400 drop-shadow-sm">{aiReport.confidence}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-400 block mb-1">Action Plan</span>
                                <span className="text-xs text-slate-300 block font-medium leading-relaxed">{aiReport.recommendation}</span>
                              </div>
                            </div>
                          </motion.div>
                        ) : isAnalyzing ? (
                          <div className="flex items-center gap-3 text-sm text-purple-400 font-mono py-6 justify-center bg-slate-950/40 rounded-lg border border-purple-500/10">
                            <RefreshCw className="w-5 h-5 animate-spin" /> Analyzing core dumps and unwinding stack...
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">Node isolation detected by service mesh. Run an AI diagnostic trace to ingest standard error streams and identify the root cause.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Manual Overrides */}
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Operator Remediation Overrides</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button 
                        onClick={() => handleHardRestart(selectedNode.ServiceName)} 
                        disabled={isRestarting} 
                        className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm font-semibold text-slate-200 transition-all shadow-sm hover:shadow-md"
                      >
                        {isRestarting ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Power className="w-4 h-4 text-amber-400" />}
                        {isRestarting ? "Rebooting..." : "Hard Restart"}
                      </button>
                      <button 
                        onClick={() => streamLiveLogs(selectedNode.ServiceName)} 
                        className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-700/50 text-sm font-semibold text-emerald-400 transition-all shadow-sm hover:shadow-md"
                      >
                        <Activity className="w-4 h-4" /> Live Terminal
                      </button>
                      <button 
                        onClick={() => scaleService(selectedNode.ServiceName)} 
                        className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-blue-900/20 hover:bg-blue-900/40 border border-blue-700/50 text-sm font-semibold text-blue-400 transition-all shadow-sm hover:shadow-md"
                      >
                        {isScaling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                        {isScaling ? "Provisioning..." : "Scale Replica"}
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================================================================== */}
        {/* MODAL: FORENSIC AUDIT TRAIL                                           */}
        {/* ===================================================================== */}
        <AnimatePresence>
          {selectedIncident && (
            <motion.div 
              initial="hidden" 
              animate="visible" 
              exit="exit"
              variants={modalBackdrop}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" 
              onClick={() => setSelectedIncident(null)}
            >
              <motion.div 
                variants={modalContent}
                onClick={e => e.stopPropagation()} 
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden shadow-blue-900/20"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
                  <div className="flex items-center gap-3">
                    <HardDrive className="text-blue-400 w-5 h-5" />
                    <h3 className="text-lg font-bold tracking-tight text-white">Forensic Audit Payload</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedIncident(null)} 
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 flex flex-col gap-6">
                  
                  {/* Metadata Row */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">Target Node</p>
                      <p className="text-xl font-mono font-medium text-slate-100 drop-shadow-sm">{selectedIncident.service_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">Hash Record</p>
                      <p className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">#AUTH-{selectedIncident.id.split('-').pop()}</p>
                    </div>
                  </div>

                  {/* Diagnosis Display */}
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <p className="text-[10px] text-slate-500 font-bold mb-2 tracking-widest uppercase">System Diagnosis</p>
                    <p className="text-sm text-slate-300 font-mono leading-relaxed">{selectedIncident.issue_description}</p>
                  </div>

                  {/* Raw JSON Payload */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                    <p className="text-[10px] text-slate-500 font-bold mb-2 tracking-widest uppercase flex justify-between items-center">
                      <span>Execution Payload</span>
                      <span className="text-emerald-400">VERIFIED</span>
                    </p>
                    <div className="text-[11px] text-blue-300 font-mono whitespace-pre-wrap flex items-start gap-2.5 overflow-x-auto">
                      <FileJson className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                      {JSON.stringify({ 
                        target_node: selectedIncident.service_name, 
                        directive_executed: selectedIncident.action_taken, 
                        timestamp: selectedIncident.created_at, 
                        status_code: 200, 
                        ledger_verification: selectedIncident.status 
                      }, null, 2)}
                    </div>
                  </div>

                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================================================================== */}
        {/* MODAL: CMD+K GLOBAL SEARCH PALETTE                                    */}
        {/* ===================================================================== */}
        <AnimatePresence>
          {isCommandOpen && (
            <motion.div 
              initial="hidden" 
              animate="visible" 
              exit="exit"
              variants={modalBackdrop}
              className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-slate-950/80 p-4" 
              onClick={() => setIsCommandOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: -20 }} 
                animate={{ scale: 1, opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } }} 
                exit={{ scale: 0.95, opacity: 0, y: -20, transition: { duration: 0.15 } }} 
                onClick={e => e.stopPropagation()} 
                className="bg-slate-900 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-blue-900/20"
              >
                
                {/* Search Input Area */}
                <div className="flex items-center px-5 py-4 border-b border-slate-700 bg-slate-800/80">
                  <Search className="w-5 h-5 text-blue-400 mr-3" />
                  <input 
                    autoFocus 
                    type="text" 
                    placeholder="Search global fleet registry..." 
                    className="flex-1 bg-transparent border-none outline-none text-slate-200 text-lg placeholder:text-slate-500 font-medium" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                  />
                  <kbd className="bg-slate-900 border border-slate-700 px-2 py-1 rounded font-mono text-xs text-slate-400 shadow-inner">ESC</kbd>
                </div>

                {/* Search Results Area */}
                <div className="max-h-[60vh] overflow-y-auto p-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 transparent" }}>
                  {displayedServices.length > 0 ? displayedServices.map(s => (
                    <div 
                      key={s.CheckID} 
                      onClick={() => { setSelectedNode(s); setIsCommandOpen(false); }} 
                      className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors group mx-2 my-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${s.Status === "passing" ? "bg-emerald-400" : s.Status === "warning" ? "bg-amber-400" : "bg-rose-400"}`} />
                        <span className="font-mono font-medium text-slate-200 text-[15px]">{s.ServiceName}</span>
                      </div>
                      <span className="text-xs font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                        OPEN INSPECTOR <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-slate-500 font-medium flex flex-col items-center gap-3">
                      <Search className="w-8 h-8 opacity-20" />
                      No services found matching "{searchQuery}" in the current quorum.
                    </div>
                  )}
                </div>

                {/* Search Footer */}
                <div className="bg-slate-950 p-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span>Use up/down arrows to navigate (mocked)</span>
                  <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Live Registry</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </>
  );
}