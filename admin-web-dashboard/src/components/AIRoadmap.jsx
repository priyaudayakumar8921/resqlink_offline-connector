import React, { useState } from 'react';
import { 
  BrainCircuit, Waves, Mountain, Mic, Video, Route, Bot, 
  CheckCircle2, Clock, Calendar, ArrowRight, ShieldCheck, Sparkles, 
  ExternalLink, Layers, Cpu, Compass
} from 'lucide-react';

const ROADMAP_MODULES = [
  {
    id: "M1",
    name: "AI Flood Predictor & Inundation Modeler",
    phase: "Phase 1 (Completed & Live)",
    status: "LIVE",
    icon: Waves,
    badgeColor: "var(--accent)",
    summary: "Real-time district-level flood early warning, hydrograph peak prediction, and dam shutter regulation recommendations.",
    dataSources: [
      "Kaggle Kerala Rainfall & Floods (1901–2021) Dataset",
      "Kaggle Flood Prediction Benchmark (Playground S4E5)",
      "Real-time CWC River Gauges & KSEB Dam Telemetry",
      "NASA SMAP Satellite Soil Moisture"
    ],
    techStack: "XGBoost Classifier + LightGBM Regressor + LSTM Recurrent Network",
    metrics: "ROC-AUC: 0.948 | F1-Score: 0.924 | Latency: 12.4ms",
    deliverables: [
      "District risk threat matrix (Red, Orange, Yellow alerts)",
      "Interactive What-If rainfall & dam discharge sensitivity sandbox",
      "Automated dam shutter opening & evacuation population estimations"
    ]
  },
  {
    id: "M2",
    name: "AI Landslide Hazard & Debris Flow Predictor",
    phase: "Phase 2 (Q1 2027)",
    status: "IN_DEV",
    icon: Mountain,
    badgeColor: "var(--warning)",
    summary: "Western Ghats high-risk slope stability monitoring (Wayanad, Idukki, Nilambur) using dynamic physics-informed slope mechanics.",
    dataSources: [
      "SRTM 30m Digital Elevation Models (DEM) & Slope Rasters",
      "Geological Survey of India (GSI) Historical Landslide Inventory",
      "In-situ Piezometer Tilt Sensors & Soil Saturation Probes"
    ],
    techStack: "Physics-Informed Neural Networks (PINN) + Infinite Slope FoS Equations",
    metrics: "Target Prediction Horizon: 3 to 6 Hours Prior to Slope Failure",
    deliverables: [
      "Dynamic Factor of Safety (FoS) heatmaps on Leaflet GIS",
      "Rainfall intensity-duration tipping threshold alerts (I = α · D^-β)",
      "Automated taluk-level mountain road closure directives"
    ]
  },
  {
    id: "M3",
    name: "Acoustic & Voice SOS Emergency Triage",
    phase: "Phase 2 (Q1 2027)",
    status: "IN_DEV",
    icon: Mic,
    badgeColor: "var(--warning)",
    summary: "Automatic acoustic hazard detection and deep speech recognition for voice distress notes transmitted from citizen offline mesh nodes.",
    dataSources: [
      "Offline ResQLink Android Vosk Voice Recordings",
      "Environmental Disaster Audio Bank (water rushing, structural collapse, cries)",
      "Kerala Regional Dialect Vocabulary & Gazetteer"
    ],
    techStack: "Edge Vosk (Kaldi) + Whisper-v3 Large + Audio Spectrogram Transformer (AST)",
    metrics: "Acoustic Detection Precision: 92.4% | Latency < 300ms",
    deliverables: [
      "Automatic sound classification (Flood rushing sound vs screams vs rubble)",
      "Malayalam/English Named Entity Recognition (trapped count, landmarks)",
      "Auto-escalation of SOS priority from NORMAL to CRITICAL"
    ]
  },
  {
    id: "M4",
    name: "Autonomous Drone Mesh Vision & Survivor Detection",
    phase: "Phase 3 (Q2 2027)",
    status: "UPCOMING",
    icon: Video,
    badgeColor: "var(--primary)",
    summary: "Aerial thermal and optical survivor identification through tree canopies, floodwaters, and rubble using autonomous NDRF drone swarms.",
    dataSources: [
      "Dual Optical (RGB 4K) + FLIR LWIR Long-Wave Infrared Feeds",
      "Aerial Search & Rescue Dataset (SARD) + Thermal Drone Imagery",
      "Local Wi-Fi Mesh Telemetry Nodes"
    ],
    techStack: "YOLOv8-Thermal / YOLOv9-OBB on NVIDIA Jetson Orin Edge + ACO Path Routing",
    metrics: "Detection Recall: 89.4% in Zero-Visibility Night Operations",
    deliverables: [
      "Real-time survivor bounding-box coordinates overlaid on Super Admin map",
      "Battery-constrained autonomous search path optimization (Ant Colony)",
      "Automated payload release coordinates (food, medical, RF beacon drops)"
    ]
  },
  {
    id: "M5",
    name: "Dynamic Flooded Evacuation Corridor Optimizer",
    phase: "Phase 3 (Q2 2027)",
    status: "UPCOMING",
    icon: Route,
    badgeColor: "var(--primary)",
    summary: "Graph-based routing engine that continuously reroutes rescue convoys and citizen evacuation fleets away from rising floodwaters and blocked bridges.",
    dataSources: [
      "OpenStreetMap Kerala Road Network Graph (Vertices & Edges)",
      "AI Flood Inundation Hydrographs (Water Depth h(e, t))",
      "District Police Road Blockage & Bridge Structural Incident Reports"
    ],
    techStack: "Time-Dependent Contraction Hierarchies (TDCH) + Dynamic A* Search",
    metrics: "Statewide Route Recalculation Time < 45ms",
    deliverables: [
      "Safe evacuation corridor calculation for 14 district collectorates",
      "Submerged road penalty assignment preventing convoy entrapment",
      "Multi-Depot Vehicle Routing Problem solver for NDRF rubber dinghies"
    ]
  },
  {
    id: "M6",
    name: "Multi-Agent Inter-Agency Orchestrator (LLM Swarm)",
    phase: "Phase 4 (Q3 2027)",
    status: "UPCOMING",
    icon: Bot,
    badgeColor: "var(--primary)",
    summary: "Autonomous collaborative AI agents synchronizing KSDMA State HQ, DDMA District Collectors, NDRF, Kerala Police, Fire & Rescue, and Health departments.",
    dataSources: [
      "State Emergency Operations Center (SEOC) Operating Procedures",
      "District Resource Ledgers & Hospital Bed/Oxygen Telemetry",
      "Citizen Distress Feeds & Incident Reports"
    ],
    techStack: "LangGraph / AutoGen State-Machine Framework + Claude 3.5 / Gemini Pro",
    metrics: "Inter-Agency Directives Synthesized in < 15 seconds",
    deliverables: [
      "Automated hourly SITREP (Situation Report) generation for Chief Minister",
      "Inter-district resource borrowing (boats, generators, rescue pumps)",
      "Unified public emergency advisory authoring across SMS & WhatsApp"
    ]
  }
];

export default function AIRoadmap() {
  const [selectedModule, setSelectedModule] = useState(ROADMAP_MODULES[0]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(45, 52, 54, 0.05) 0%, rgba(139, 92, 246, 0.08) 100%)' }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '12px' }}>
              <BrainCircuit size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>ResQLink Super Admin AI Architecture Roadmap</h2>
                <span className="badge badge-primary font-bold">2026–2027 Vision</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Comprehensive technical roadmap for all Artificial Intelligence and Machine Learning systems across the Kerala State Command Center.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="badge badge-success font-bold">1 Module Live</span>
            <span className="badge badge-warning font-bold">2 In Development</span>
            <span className="badge" style={{ background: 'rgba(0,0,0,0.06)' }}>3 In Research</span>
          </div>
        </div>
      </div>

      {/* Main Roadmap Grid */}
      <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
        
        {/* Left Column: Modules List */}
        <div style={{ flex: '1 1 360px' }} className="flex flex-col gap-3">
          {ROADMAP_MODULES.map((m) => {
            const isSelected = selectedModule.id === m.id;
            const Icon = m.icon;
            return (
              <div 
                key={m.id}
                onClick={() => setSelectedModule(m)}
                className="glass-panel hover-card"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: isSelected ? 'rgba(45, 52, 54, 0.06)' : 'var(--bg-card)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div style={{ 
                      background: isSelected ? 'var(--primary)' : 'rgba(0,0,0,0.05)', 
                      color: isSelected ? 'white' : 'var(--text-main)', 
                      padding: '8px', 
                      borderRadius: '8px' 
                    }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                        {m.name}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {m.phase}
                      </span>
                    </div>
                  </div>
                  
                  <span 
                    className="badge" 
                    style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold',
                      background: m.status === 'LIVE' ? 'rgba(16, 185, 129, 0.15)' : (m.status === 'IN_DEV' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0,0,0,0.05)'),
                      color: m.status === 'LIVE' ? 'var(--accent)' : (m.status === 'IN_DEV' ? 'var(--warning)' : 'var(--text-muted)')
                    }}
                  >
                    {m.status === 'LIVE' ? '● LIVE' : (m.status === 'IN_DEV' ? '⏳ DEV' : '🗓️ PLANNED')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Module Blueprint */}
        <div style={{ flex: '2 1 540px' }} className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex justify-between items-start flex-wrap gap-4" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div className="flex items-center gap-3">
                <selectedModule.icon size={26} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{selectedModule.name}</h3>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {selectedModule.summary}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="badge badge-primary font-bold">{selectedModule.phase}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Module Code: {selectedModule.id}</span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* Model Architecture & Tech Stack */}
            <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <span className="flex items-center gap-2 font-bold" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <Cpu size={15} color="var(--primary)" /> MACHINE LEARNING ARCHITECTURE & ALGORITHMS
              </span>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>
                {selectedModule.techStack}
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                Key Benchmark: {selectedModule.metrics}
              </div>
            </div>

            {/* Ingestion & Training Datasets */}
            <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <span className="flex items-center gap-2 font-bold" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <Layers size={15} color="var(--accent)" /> DATASETS & TELEMETRY INGESTION
              </span>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', lineHeight: '1.6' }}>
                {selectedModule.dataSources.map((ds, idx) => (
                  <li key={idx}>{ds}</li>
                ))}
              </ul>
            </div>

            {/* Core Operational Deliverables */}
            <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <span className="flex items-center gap-2 font-bold" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <Sparkles size={15} color="#8b5cf6" /> SUPER ADMIN OPERATIONAL DELIVERABLES
              </span>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', lineHeight: '1.6' }}>
                {selectedModule.deliverables.map((deliv, idx) => (
                  <li key={idx} className="flex items-center gap-2" style={{ marginBottom: '0.3rem' }}>
                    <CheckCircle2 size={14} color="var(--accent)" /> {deliv}
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Status Callout */}
            <div style={{ padding: '1rem', background: selectedModule.status === 'LIVE' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.03)', borderRadius: '8px', borderLeft: `4px solid ${selectedModule.status === 'LIVE' ? 'var(--accent)' : 'var(--primary)'}` }}>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {selectedModule.status === 'LIVE' ? '✅ This module is fully active and running on the Super Admin Portal.' : '🛠️ Engineering Roadmap item under active development.'}
                </span>
                {selectedModule.status === 'LIVE' && (
                  <span className="badge badge-success font-bold">Try Live Predictor</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

