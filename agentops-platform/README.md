<div align="center">

<img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Docker.svg" width="45" align="center" style="margin-right: 12px;"/> 
<img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Go.svg" width="45" align="center" style="margin-right: 12px;"/>
<img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NextJS-Dark.svg" width="45" align="center" style="margin-right: 12px;"/>
<img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/PostgreSQL.svg" width="45" align="center" style="margin-right: 12px;"/>
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prometheus/prometheus-original.svg" width="45" align="center" />
<br><br>

<pre>
    _    _____ ____ ___ ____    __  __ _____ ____  _   _ 
   / \  | ____/ ___|_ _/ ___|  |  \/  | ____/ ___|| | | |
  / _ \ |  _|| |  _ | |\___ \  | |\/| |  _| \___ \| |_| |
 / ___ \| |__| |_| || | ___) | | |  | | |___ ___) |  _  |
/_/   \_\_____\____|___|____/  |_|  |_|_____|____/|_| |_|
</pre>

<a href="#">
  <img src="https://readme-typing-svg.demolab.com?font=Josefin+Sans&weight=600&size=24&pause=2000&color=3B82F6&center=true&vCenter=true&width=700&lines=Autonomous+Fleet+Orchestration;Self-Healing+Service+Mesh;AI-Driven+Root+Cause+Analysis;Immutable+SRE+Ledger;Real-Time+WebSocket+Telemetry" alt="Typing SVG" />
</a>
<br>

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](#)
[![Version](https://img.shields.io/badge/version-v6.1.0_enterprise-blue?style=for-the-badge)](#)
[![Go Report](https://img.shields.io/badge/go_report-A+-success?style=for-the-badge&logo=go&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

*An event-driven SRE daemon that monitors microservices, autonomously diagnoses root causes using AI heuristics, and executes zero-touch remediation before human intervention is required.*

<br>

<img src="https://images.unsplash.com/photo-1618401471353-b98a5f13ff86?q=80&w=1200&auto=format&fit=crop" alt="Aegis Mesh Dashboard" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3); border: 1px solid #1e293b;"/>

<br><br>
<p align="center">
  <i>(Actual UI Demo: Record a high-res .gif of your dashboard filtering critical errors and replace the URL above to bring this repo to life!)</i>
</p>

</div>

---

## 📖 Table of Contents
1. [The Philosophy: Problem vs. Solution](#-the-philosophy-problem-vs-solution)
2. [Enterprise Capabilities](#-enterprise-capabilities)
3. [System Architecture](#-system-architecture)
4. [Quickstart (Zero-Dependency)](#-quickstart-zero-dependency)
5. [Developer Commands](#-developer-commands)
6. [Control Plane Tour](#-control-plane-tour)
7. [Roadmap & Limitations](#-roadmap--limitations)

---

## ⚡ The Philosophy: Problem vs. Solution

Modern microservice architectures are highly resilient but notoriously brittle under load. When a Node.js gateway leaks memory or a PostgreSQL connection pool exhausts, human Site Reliability Engineers (SREs) must manually parse logs, identify the failing container, and restart it—costing thousands of dollars in downtime. 

**Aegis Mesh eliminates the human bottleneck.**

| Feature | Traditional Operations | The Aegis Approach |
| :--- | :--- | :--- |
| **Detection** | Humans waiting for PagerDuty alerts. | **Sub-second anomaly detection** via Consul Mesh polling. |
| **Diagnosis** | Manually `grep`-ing through Kibana logs. | **Automated AI Root Cause Analysis** directly from `stderr`. |
| **Remediation**| SSH-ing into servers to run `docker restart`.| Go API executes secure, host-level daemon WebSockets. |
| **Auditing** | Fragmented Slack channel histories. | **Cryptographic, immutable logging** in PostgreSQL. |

---

## 🛠️ Enterprise Capabilities

* **🧠 Heuristic AI Diagnosis:** Generates instant, high-confidence Action Plans based on live core-dump analysis and simulated stack unwinding.
* **⚖️ Dynamic Auto-Scaling:** Clones heavy-load containers horizontally, provisions IPs, and registers them into the load balancer.
* **🐒 Native Chaos Protocol:** Built-in fault injection (*Chaos Monkey*) to simulate severe network degradation, container assassination, and latency spikes for resiliency testing.
* **📡 Multiplexed Telemetry:** Streams secure, real-time Docker Daemon logs directly to the browser UI via WebSocket multiplexing.
* **🛡️ SRE Graceful Degradation:** Features exponential jittered backoffs, Context propagation, and Prometheus `/metrics` endpoints to prevent cascading cluster failure.

---

## 🏗️ System Architecture

Aegis Mesh operates on a deeply decoupled, 5-layer microservice architecture. By isolating the Control Plane from the Autonomous Daemon, the system ensures that if the UI crashes, the self-healing engine continues to protect the fleet unconditionally.

```mermaid
graph TD
    %% Styling Configuration
    classDef ui fill:#020617,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef api fill:#0f172a,stroke:#14b8a6,stroke-width:2px,color:#fff
    classDef core fill:#4c1d95,stroke:#a855f7,stroke-width:2px,color:#fff
    classDef mesh fill:#7f1d1d,stroke:#f43f5e,stroke-width:2px,color:#fff
    classDef db fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#fff

    %% Node Definitions
    UI[Control Plane <br> Next.js 14]:::ui
    API[API Gateway <br> Go + slog]:::api
    Brain[Aegis Daemon <br> Go Worker]:::core
    Consul[Service Mesh <br> HashiCorp Consul]:::mesh
    DB[(Action Ledger <br> PostgreSQL)]:::db
    Docker((Docker Daemon <br> Host Socket))

    %% Edge Connections
    UI -- REST / WebSockets --> API
    API -- Reads / Writes --> DB
    API -- Executes Commands --> Docker
    Brain -- Polls Quorum State --> Consul
    Brain -- Fires Remediation Webhooks --> API
    Consul -- TTL Health Checks --> Docker