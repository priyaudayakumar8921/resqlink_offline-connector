import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LogOut, Activity, MapPin, AlertTriangle, RadioTower, CheckCircle2, 
  User, Clock, ShieldAlert, Map as MapIcon, Cpu, Zap, Send, Plane, PlaySquare, 
  Network, Truck, ShieldBan, MessageSquare, Phone, MessagesSquare, Mic, Image,
  Tent, Video, Route, Waves, Users, Package, Search, BrainCircuit, Droplets,
  CloudRain, TrendingUp, Sliders, Database, Sparkles, ArrowRight, BookmarkCheck,
  Calendar, Layers, ArrowUpRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { API_BASE_URL } from '../config';
import AIFloodPredictor from './AIFloodPredictor';
import AIRoadmap from './AIRoadmap';

// Fix for default leaflet icons not showing in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Kerala Center Coordinates
const KERALA_CENTER = [10.8505, 76.2711];

// Specification Metadata for Less Important / Upcoming Modules
const COMING_SOON_DATA = {
  CAMPS: {
    title: "Relief Camp Density & Occupancy Tracking",
    icon: Tent,
    phase: "Phase 2 (Q1 2027)",
    description: "State-wide monitoring of 3,200+ registered emergency relief shelters across all 14 Kerala districts.",
    features: [
      "Dynamic Camp Occupancy Heatmaps (KSDMA & District DDMA)",
      "Daily ration, drinking water, and infant formula stock monitoring",
      "Offline citizen check-in sync via ResQLink Station Hubs"
    ]
  },
  DRONE: {
    title: "Live NDRF Drone Feeds & Aerial FLIR Thermal",
    icon: Video,
    phase: "Phase 3 (Q2 2027)",
    description: "Autonomous aerial search and rescue feeds streaming dual 4K RGB and Long-Wave Infrared (LWIR) survivor detection over flooded zones.",
    features: [
      "YOLOv8-Thermal edge survivor bounding box streaming",
      "Autonomous search grid navigation via Wi-Fi Mesh gateways",
      "Automated payload release targeting for emergency supply airdrops"
    ]
  },
  EVAC: {
    title: "Dynamic Flooded Evacuation Corridor AI",
    icon: Route,
    phase: "Phase 3 (Q2 2027)",
    description: "Graph-based routing engine that continuously recalculates safe citizen evacuation pathways by avoiding inundated roads and breached bridges.",
    features: [
      "Dynamic Time-Dependent A* road network rerouting",
      "Real-time coupling with AI Flood Predictor hydrograph depths",
      "Emergency convoy prioritization for NDRF, Fire & Rescue, and ambulances"
    ]
  },
  TELEMETRY: {
    title: "CWC River Gauge & KSEB Dam Telemetry Ingestion",
    icon: Waves,
    phase: "Phase 2 (Q1 2027)",
    description: "Automated telemetry ingestion connecting Central Water Commission ultrasonic river sensors and 14 major Kerala dam supervisory SCADA systems.",
    features: [
      "Real-time inflow/outflow cusec measurement from 39 CWC river stations",
      "Automated rule curve violation alerts for Idukki and Mullaperiyar",
      "Piezometric dam wall pressure and seismic sensor feeds"
    ]
  },
  FLEET: {
    title: "Fleet & Aviation Real-Time Tracking",
    icon: Truck,
    phase: "Phase 3 (Q2 2027)",
    description: "Integrated AIS marine and ADS-B aviation tracking for Coast Guard helicopters, Indian Navy Dorniers, and state rescue motorboats.",
    features: [
      "Live GPS positions of all deployed NDRF rubber dinghies and trucks",
      "Helicopter rescue winching coordinates overlay",
      "Automated fuel depot range and turnaround time calculations"
    ]
  },
  VOLUNTEER: {
    title: "Volunteer Task Force (Aapda Mitra Mobilization)",
    icon: Users,
    phase: "Phase 2 (Q1 2027)",
    description: "State-wide registry mobilizing 25,000+ certified Aapda Mitra volunteers, Ham radio operators, and civil defense volunteers.",
    features: [
      "Skill-based task allocation (Swimmers, First-Aid, Boat Drivers)",
      "Geofenced volunteer deployment via Sub-Admin Hubs",
      "Automated attendance and insurance coverage ledger"
    ]
  },
  INVENTORY: {
    title: "Resource Matrix & Emergency Logistics",
    icon: Package,
    phase: "Phase 2 (Q1 2027)",
    description: "Centralized inventory database monitoring life-saving hardware across all 14 district disaster warehouses.",
    features: [
      "Real-time stock of life jackets, inflatable boats, and dewatering pumps",
      "Inter-district resource requisition and automated transfer approvals",
      "QR-code supply distribution ledger"
    ]
  },
  MISSING: {
    title: "Missing Persons Ledger & Facial Recognition",
    icon: Search,
    phase: "Phase 3 (Q2 2027)",
    description: "Centralized tracing portal cross-referencing field hospital admissions, relief camp rosters, and citizen reports.",
    features: [
      "Facial recognition matching against relief camp check-in photos",
      "Cross-agency reconciliation (Police FIRs, District Collectorate helpdesks)",
      "Family reunification automated SMS / WhatsApp notifications"
    ]
  },
  SUPPLY: {
    title: "Supply Chain AI & Fuel / Ration Forecasting",
    icon: Activity,
    phase: "Phase 4 (Q3 2027)",
    description: "Predictive supply chain engine forecasting medical, food, and generator fuel depletion rates in cut-off disaster zones.",
    features: [
      "Anticipatory logistics dispatch before roads become inundated",
      "Hospital diesel generator run-time prediction",
      "Cold-chain anti-venom and insulin stock safeguards"
    ]
  },
  MULTI_AGENCY: {
    title: "Multi-Agency Inter-Departmental Federation",
    icon: Network,
    phase: "Phase 4 (Q3 2027)",
    description: "Unified data exchange protocol bridging KSDMA, Police ERSS (112), Fire & Rescue, Coast Guard, and Revenue Department.",
    features: [
      "Common Operating Picture (COP) synchronized across departments",
      "Automated jurisdictional incident dispatch without duplicate responses",
      "State cabinet situation summary automation"
    ]
  },
  INFRA: {
    title: "ResQLink Mesh Hardware Infrastructure Health",
    icon: Cpu,
    phase: "Phase 2 (Q1 2027)",
    description: "Health monitoring and telemetry diagnostics for physical ResQLink Wi-Fi Direct and LoRa relay nodes across Kerala.",
    features: [
      "Battery voltage, solar charging status, and signal strength (RSSI)",
      "Mesh topology neighbor routing tables",
      "Automated failover alerts when an edge node goes offline"
    ]
  },
  PLAYBACK: {
    title: "Historical DVR Playback & Simulation",
    icon: PlaySquare,
    phase: "Phase 3 (Q2 2027)",
    description: "Time-machine timeline scrubber replaying disaster evolution, flood water progression, and emergency response for after-action reviews.",
    features: [
      "Minute-by-minute playback of 2018, 2019, and 2024 disaster trajectories",
      "Post-disaster audit of response dispatch times",
      "Drill simulation mode for District Collector tabletop exercises"
    ]
  }
};

export default function Dashboard({ onLogout }) {
  const [sosList, setSosList] = useState([]);
  const [liveConnections, setLiveConnections] = useState(1402);
  const [activeView, setActiveView] = useState('COMMAND'); // COMMAND, FLOOD_AI, AI_ROADMAP, CITIZEN_SOS, INTER_DEPT, GIS, or COMING_SOON keys
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [targetDistricts, setTargetDistricts] = useState(['ALL']);
  const [channels, setChannels] = useState({ sms: true, whatsapp: false });

  const KERALA_DISTRICTS = [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", 
    "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", 
    "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
  ];

  const toggleDistrict = (district) => {
    if (district === 'ALL') {
      setTargetDistricts(['ALL']);
      return;
    }
    
    let newSelection = targetDistricts.filter(d => d !== 'ALL');
    if (newSelection.includes(district)) {
      newSelection = newSelection.filter(d => d !== district);
    } else {
      newSelection.push(district);
    }
    
    if (newSelection.length === 0) newSelection = ['ALL'];
    setTargetDistricts(newSelection);
  };

  const [notices, setNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState({ target: 'ALL_DISTRICTS', type: 'TEXT', content: '' });
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [showFloodHazardLayer, setShowFloodHazardLayer] = useState(true);

  const toggleRecord = (e) => {
    e.preventDefault();
    if (isRecording) {
        setIsRecording(false);
        const fileName = "voice_memo_" + Date.now() + ".wav";
        setRecordedAudio(fileName);
        setNoticeForm({...noticeForm, content: fileName});
    } else {
        setIsRecording(true);
        setRecordedAudio(null);
        setNoticeForm({...noticeForm, content: ''});
    }
  };

  useEffect(() => {
    // Poll the mock hub server every 3 seconds for new SOS signals
    const fetchSOS = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/sos`);
        const data = await response.json();
        setSosList(data);
      } catch (err) {
        console.error('Error fetching SOS from Hub:', err);
      }
    };

    const fetchNotices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/notices`);
        const data = await res.json();
        setNotices(data);
      } catch(err) {
        console.error('Error fetching notices:', err);
      }
    };
    
    fetchSOS();
    fetchNotices();
    const interval = setInterval(() => {
       fetchSOS();
       fetchNotices();
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    
    alert(`Transmitting "${broadcastMsg}" to ${targetDistricts.join(', ')} via channels: ${Object.keys(channels).filter(k => channels[k]).join(', ')}`);
    setBroadcastMsg('');
  };

  const handleSendNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.content) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/v1/notices`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            sender: 'KSDMA Super Admin',
            target: noticeForm.target,
            type: noticeForm.type,
            content: noticeForm.content
         })
      });
      setNoticeForm({ ...noticeForm, content: '' });
      setRecordedAudio(null);
      alert('Internal Notice dispatched securely over internet.');
    } catch(err) {
      console.error(err);
      alert('Failed to send notice');
    }
  };

  const SidebarButton = ({ view, icon: Icon, label, isComingSoon, isLive, badge }) => (
    <button 
      onClick={() => setActiveView(view)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '0.8rem 1rem', border: 'none',
        background: activeView === view ? 'rgba(45, 52, 54, 0.08)' : 'transparent',
        color: activeView === view ? 'var(--primary)' : 'var(--text-muted)',
        borderLeft: activeView === view ? '4px solid var(--primary)' : '4px solid transparent',
        cursor: 'pointer', transition: 'all 0.2s',
        fontWeight: activeView === view ? 'bold' : 'normal',
        textAlign: 'left', fontSize: '0.88rem'
      }}
    >
      <div className="flex items-center gap-2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Icon size={16} /> <span>{label}</span>
      </div>
      {isLive && (
        <span className="badge badge-success font-bold" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>LIVE</span>
      )}
      {isComingSoon && (
        <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 5px', background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>COMING SOON</span>
      )}
      {badge && (
        <span className="badge badge-primary font-bold" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>{badge}</span>
      )}
    </button>
  );

  // Clean, Branded Coming Soon Component for non-core features
  const renderComingSoonCard = (key) => {
    const item = COMING_SOON_DATA[key] || {
      title: key.replace('_', ' '),
      icon: Zap,
      phase: "Phase 3 (2027)",
      description: "This Super-Admin module is planned for integration in an upcoming deployment phase.",
      features: ["Sensor and telemetry synchronization", "District collectorate integration"]
    };
    const Icon = item.icon;

    return (
      <div className="glass-panel" style={{ padding: '3rem 2.5rem', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
        <div className="flex items-center justify-between flex-wrap gap-4" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(45, 52, 54, 0.06)', padding: '14px', borderRadius: '12px', color: 'var(--primary)' }}>
              <Icon size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{item.title}</h2>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ResQLink Super Admin Capability Module</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', fontWeight: 'bold', fontSize: '0.8rem', padding: '5px 12px' }}>
              ⏳ COMING SOON
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: {item.phase}</span>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontSize: '1.05rem' }}>Module Overview</h4>
          <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
            {item.description}
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '2rem' }}>
          <h4 className="flex items-center gap-2" style={{ margin: '0 0 1rem', fontSize: '0.95rem' }}>
            <BookmarkCheck size={18} color="var(--primary)" /> Planned Core Capabilities
          </h4>
          <div className="flex flex-col gap-2">
            {item.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2" style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <CheckCircle2 size={15} color="var(--accent)" /> {feat}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center flex-wrap gap-4" style={{ background: 'rgba(45, 52, 54, 0.03)', padding: '1.25rem 1.5rem', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Want to see technical architecture or explore active AI capabilities?
          </span>
          <div className="flex gap-2">
            <button onClick={() => setActiveView('FLOOD_AI')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <Waves size={15} /> Launch AI Flood Predictor
            </button>
            <button onClick={() => setActiveView('AI_ROADMAP')} className="btn" style={{ fontSize: '0.85rem', border: '1px solid var(--border-light)' }}>
              <BrainCircuit size={15} /> View Full AI Roadmap
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen flex" style={{ overflow: 'hidden' }}>
      {/* Sidebar Navigation */}
      <aside style={{ 
        width: '270px', background: 'var(--bg-card)', 
        borderRight: '1px solid var(--border-light)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-3">
            <Activity size={26} color="var(--primary)" />
            <div>
              <h2 className="text-gradient" style={{ fontSize: '1.15rem', margin: 0 }}>KSDMA HQ</h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Super Admin Command Center</span>
            </div>
          </div>
        </div>
        
        <div style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          
          {/* Active AI Modules Section */}
          <div style={{ padding: '0.75rem 1rem 0.35rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            AI & PREDICTIVE INTELLIGENCE
          </div>
          <SidebarButton view="FLOOD_AI" icon={Waves} label="AI Flood Predictor" isLive={true} />
          <SidebarButton view="AI_ROADMAP" icon={BrainCircuit} label="AI Modules Roadmap" badge="NEW" />

          {/* Core Operations Section */}
          <div style={{ padding: '0.9rem 1rem 0.35rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            CORE OPERATIONS
          </div>
          <SidebarButton view="COMMAND" icon={ShieldAlert} label="Command & Broadcast" />
          <SidebarButton view="CITIZEN_SOS" icon={User} label="Citizen Alerts (Sub-Admin)" />
          <SidebarButton view="INTER_DEPT" icon={MessagesSquare} label="Internal Comms" />
          <SidebarButton view="GIS" icon={MapIcon} label="GIS Live Heatmap" />
          
          {/* Tactical & Maps Section */}
          <div style={{ padding: '0.9rem 1rem 0.35rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            TACTICAL & SENSORS
          </div>
          <SidebarButton view="CAMPS" icon={Tent} label="Relief Camp Density" isComingSoon={true} />
          <SidebarButton view="DRONE" icon={Video} label="Drone Video Feeds" isComingSoon={true} />
          <SidebarButton view="EVAC" icon={Route} label="Evacuation Corridor AI" isComingSoon={true} />
          <SidebarButton view="TELEMETRY" icon={Waves} label="River & Dam Telemetry" isComingSoon={true} />
          <SidebarButton view="FLEET" icon={Truck} label="Fleet & Aviation" isComingSoon={true} />
          
          {/* State Disaster Management Section */}
          <div style={{ padding: '0.9rem 1rem 0.35rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            MANAGEMENT MODULES
          </div>
          <SidebarButton view="VOLUNTEER" icon={Users} label="Volunteer Task Force" isComingSoon={true} />
          <SidebarButton view="INVENTORY" icon={Package} label="Resource Matrix" isComingSoon={true} />
          <SidebarButton view="SUPPLY" icon={Activity} label="Supply Chain AI" isComingSoon={true} />
          <SidebarButton view="MISSING" icon={Search} label="Missing Persons Ledger" isComingSoon={true} />
          <SidebarButton view="MULTI_AGENCY" icon={Network} label="Multi-Agency Sync" isComingSoon={true} />
          
          {/* System Section */}
          <div style={{ padding: '0.9rem 1rem 0.35rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            SYSTEM & PLAYBACK
          </div>
          <SidebarButton view="INFRA" icon={Cpu} label="Hardware Mesh Health" isComingSoon={true} />
          <SidebarButton view="PLAYBACK" icon={PlaySquare} label="Historical Playback" isComingSoon={true} />
        </div>

        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
           <button onClick={onLogout} className="btn w-full" style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', fontSize: '0.85rem' }}>
             <LogOut size={15} /> Secure Logout
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Portal Switcher Bar */}
        <div className="glass-panel flex items-center justify-between" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="flex items-center gap-3">
            <span className="badge badge-primary font-bold">👑 SUPERADMIN PORTAL</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kerala State Disaster Management Authority (KSDMA HQ)</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '4px' }}>Switch Portal:</span>
            <Link 
              to="/superadmin" 
              className="badge badge-primary font-bold"
              style={{ textDecoration: 'none', padding: '5px 12px', color: 'white' }}
            >
              👑 Superadmin
            </Link>
            <Link 
              to="/admin" 
              className="badge"
              style={{ textDecoration: 'none', padding: '5px 12px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
            >
              🏛️ District Admin
            </Link>
            <Link 
              to="/subadmin" 
              className="badge"
              style={{ textDecoration: 'none', padding: '5px 12px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
            >
              🛰️ Sub-Admin (Hub & Excel Logs)
            </Link>
          </div>
        </div>

        {/* Header Stats Bar */}
        <div className="flex gap-4" style={{ marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ flex: '1 1 200px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>ACTIVE CITIZEN NODES</p>
               <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', margin: 0 }}>{liveConnections.toLocaleString()}</h2>
             </div>
             <Network size={28} color="var(--primary)" style={{ opacity: 0.2 }} />
          </div>
          
          <div className="glass-panel" style={{ flex: '1 1 200px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>STATE MESH HUBS</p>
               <h2 style={{ fontSize: '1.8rem', color: 'var(--accent)', margin: 0 }}>14 / 14 Online</h2>
             </div>
             <Cpu size={28} color="var(--accent)" style={{ opacity: 0.2 }} />
          </div>

          {/* Interactive AI Flood Predictor Card in stats bar */}
          <div 
            onClick={() => setActiveView('FLOOD_AI')}
            className="glass-panel hover-card" 
            style={{ 
              flex: '1 1 240px', 
              padding: '1.25rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: activeView === 'FLOOD_AI' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(239, 68, 68, 0.08) 100%)'
            }}
          >
             <div>
               <div className="flex items-center gap-1">
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold', margin: 0 }}>AI FLOOD PREDICTOR</p>
                 <span className="badge badge-success font-bold" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>LIVE</span>
               </div>
               <h2 style={{ fontSize: '1.8rem', color: 'var(--danger)', margin: 0 }}>
                 88.5% <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 'bold' }}>RED ALERT</span>
               </h2>
             </div>
             <Waves size={28} color="var(--danger)" />
          </div>
        </div>

        {/* Dynamic View Content */}
        
        {/* 1. BRAND NEW: AI Flood Predictor Module */}
        {activeView === 'FLOOD_AI' && (
          <AIFloodPredictor />
        )}

        {/* 2. BRAND NEW: AI Implementation Roadmap */}
        {activeView === 'AI_ROADMAP' && (
          <AIRoadmap />
        )}

        {/* 3. Core Operational View: Advanced State-Wide Command & Broadcast */}
        {activeView === 'COMMAND' && (
          <div className="flex gap-6">
            <div style={{ flex: 1 }} className="flex flex-col gap-6">
              <div className="glass-panel" style={{ padding: '1.75rem', flex: 1 }}>
                <h3 className="flex items-center gap-2" style={{ marginBottom: '1rem', color: 'var(--danger)' }}>
                  <AlertTriangle size={20} /> Advanced State-Wide Broadcast (Override)
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Use this terminal to override local protocols and transmit emergency directives across multiple channels instantly.
                </p>
                <form onSubmit={handleBroadcast} className="flex flex-col gap-4">
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Target Section (Select Multiple)</label>
                    <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.4)' }}>
                      <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.9rem', fontWeight: targetDistricts.includes('ALL') ? 'bold' : 'normal' }}>
                        <input type="checkbox" checked={targetDistricts.includes('ALL')} onChange={() => toggleDistrict('ALL')} /> Entire State (All Districts)
                      </label>
                      <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.25rem 0' }}></div>
                      {KERALA_DISTRICTS.map(d => (
                        <label key={d} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.9rem' }}>
                          <input type="checkbox" checked={targetDistricts.includes(d)} onChange={() => toggleDistrict(d)} /> {d}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Transmission Channels</label>
                    <div className="flex flex-col gap-2" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={channels.sms} onChange={e=>setChannels({...channels, sms: e.target.checked})} /> <MessageSquare size={14} color="#10b981"/> Fallback SMS Gateway (Internet)</label>
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={channels.whatsapp} onChange={e=>setChannels({...channels, whatsapp: e.target.checked})} /> <Phone size={14} color="#25D366"/> WhatsApp API (Internet)</label>
                    </div>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <textarea 
                      className="input-field" rows="3" placeholder="Enter broadcast message..."
                      value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} required
                    />
                  </div>
                  <button type="submit" className="btn" style={{ background: 'var(--danger)', color: 'white' }}>
                    <Send size={16} /> TRANSMIT OVERRIDE
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 4. Citizen SOS Alerts View */}
        {activeView === 'CITIZEN_SOS' && (
           <div className="flex flex-col gap-4">
              <div style={{ padding: '0.5rem 0' }}>
                 <h3 className="flex items-center gap-2 text-gradient"><Activity size={24}/> Citizen Alerts (Forwarded from Sub-Admins)</h3>
                 <p style={{ color: 'var(--text-muted)' }}>Emergency SOS signals captured by local Police and Fire & Rescue stations, forwarded to the Secretariat.</p>
              </div>
              
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
                 {sosList.filter(s => s.status === 'ACTIVE').length === 0 && <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No Active SOS Operations.</div>}
                 {sosList.filter(s => s.status === 'ACTIVE').map(sos => (
                   <div key={sos.id} className="glass-panel hover-card" style={{ padding: '1.25rem' }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 style={{ margin: 0 }}>{sos.id}</h4>
                            <span className="badge badge-danger">CRITICAL</span>
                          </div>
                          <div className="flex items-center gap-4 text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                            <span className="flex items-center gap-1"><User size={14} /> {sos.citizenId}</span>
                            <span className="flex items-center gap-1"><Clock size={14} /> {formatDistanceToNow(sos.timestamp)} ago</span>
                          </div>
                          <div className="flex items-center gap-4 text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            <span className="flex items-center gap-1"><MapPin size={14} /> {sos.lat?.toFixed(4) || 'Unknown'}, {sos.lng?.toFixed(4) || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }} onClick={async () => {
                             await fetch(`${API_BASE_URL}/api/v1/sos/${sos.id}/resolve`, { method: 'PUT' });
                          }}>
                             <CheckCircle2 size={14} /> Resolve
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.03)', borderRadius: '6px', fontSize: '0.85rem' }}>
                         <strong>Internet Relay Pathway: </strong> Hardware Node 8922 → Sub-Admin Internet Gateway → KSDMA Server. <span style={{ color: 'var(--accent)' }}>0.4s latency.</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* 5. Inter-Departmental Comms */}
        {activeView === 'INTER_DEPT' && (
           <div className="flex gap-6 flex-wrap">
              <div className="glass-panel" style={{ flex: '1 1 450px', padding: '1.75rem' }}>
                 <h3 className="flex items-center gap-2 text-gradient" style={{ marginBottom: '1rem' }}>
                    <MessagesSquare size={20} /> Secure Internal Dispatch (Internet)
                 </h3>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                    Send direct notices, voice memos, or critical images to District Admins and Sub-Admins over the secure internet backbone.
                 </p>
                 
                 <form onSubmit={handleSendNotice} className="flex flex-col gap-4">
                    <div className="input-group">
                       <label className="input-label">Select Target Department(s)</label>
                       <select className="input-field" value={noticeForm.target} onChange={e=>setNoticeForm({...noticeForm, target: e.target.value})}>
                          <option value="ALL_DISTRICTS">All 14 District Collectorates</option>
                          <option value="ALL_SUB_ADMINS">All Police & Fire Stations (State-Wide)</option>
                          <option value="ERNAKULAM_COLLECTORATE">Ernakulam Collectorate Only</option>
                          <option value="WAYANAD_COLLECTORATE">Wayanad Collectorate Only</option>
                       </select>
                    </div>

                    <div className="input-group">
                       <label className="input-label">Payload Type</label>
                       <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                             <input type="radio" name="type" value="TEXT" checked={noticeForm.type==='TEXT'} onChange={e=>setNoticeForm({...noticeForm, type: e.target.value})}/> <MessageSquare size={16}/> Text Notice
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                             <input type="radio" name="type" value="VOICE" checked={noticeForm.type==='VOICE'} onChange={e=>setNoticeForm({...noticeForm, type: e.target.value})}/> <Mic size={16}/> Voice Memo
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                             <input type="radio" name="type" value="IMAGE" checked={noticeForm.type==='IMAGE'} onChange={e=>setNoticeForm({...noticeForm, type: e.target.value})}/> <Image size={16}/> Satellite/Drone Image
                          </label>
                       </div>
                    </div>

                    <div className="input-group">
                       <label className="input-label">{noticeForm.type === 'TEXT' ? 'Notice Content' : (noticeForm.type === 'VOICE' ? 'Voice Memo' : 'Image URL')}</label>
                       
                       {noticeForm.type === 'VOICE' ? (
                          <div className="flex flex-col items-center justify-center gap-4" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: '8px' }}>
                             <button onClick={toggleRecord} className={`btn ${isRecording ? 'btn-danger pulse-animation' : 'btn-primary'}`} style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                 <Mic size={32} color="white" />
                             </button>
                             <span style={{ color: isRecording ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                                 {isRecording ? "🔴 Recording... Tap to Stop" : (recordedAudio ? `✅ Audio Ready: ${recordedAudio}` : "Tap to Record Voice Memo")}
                             </span>
                          </div>
                       ) : (
                          <textarea 
                             className="input-field" rows="4" 
                             placeholder={noticeForm.type === 'TEXT' ? "Type emergency directive..." : "Simulate file attachment/link here..."}
                             value={noticeForm.content} onChange={e=>setNoticeForm({...noticeForm, content: e.target.value})} required
                          />
                       )}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isRecording || !noticeForm.content}>
                       <Send size={16} /> Dispatch Notice via Internet API
                    </button>
                 </form>
              </div>

              <div className="glass-panel" style={{ flex: '1 1 450px', padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
                 <h3 className="text-muted" style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>Dispatch Log</h3>
                 <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px' }}>
                    {notices.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No internal notices sent yet.</p>}
                    {notices.map(n => (
                       <div key={n.id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                          <div className="flex justify-between" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                             <strong>To: {n.target}</strong>
                             <span>{formatDistanceToNow(new Date(n.timestamp))} ago</span>
                          </div>
                          <div className="flex items-center gap-2" style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                             {n.type === 'VOICE' ? <Mic size={16} color="var(--primary)"/> : (n.type === 'IMAGE' ? <Image size={16} color="var(--primary)"/> : <MessageSquare size={16} color="var(--primary)"/>)}
                             {n.type} PAYLOAD
                          </div>
                          <div style={{ fontSize: '0.95rem' }}>{n.content}</div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* 6. GIS Live Heatmap */}
        {activeView === 'GIS' && (
           <div className="glass-panel" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
             <div className="flex justify-between items-center flex-wrap gap-2" style={{ marginBottom: '1rem' }}>
               <h3 className="flex items-center gap-2 text-gradient" style={{ margin: 0 }}>
                 <MapIcon size={20}/> GIS Live Kerala Heatmap
               </h3>
               
               <div className="flex items-center gap-3">
                 <label className="flex items-center gap-2 cursor-pointer font-bold" style={{ fontSize: '0.85rem' }}>
                   <input 
                     type="checkbox" 
                     checked={showFloodHazardLayer} 
                     onChange={(e) => setShowFloodHazardLayer(e.target.checked)} 
                   />
                   <span>🌊 Show AI Flood Hazard Districts</span>
                 </label>
                 <button onClick={() => setActiveView('FLOOD_AI')} className="btn" style={{ padding: '4px 10px', fontSize: '0.8rem', border: '1px solid var(--border-light)' }}>
                   Open Full Predictor &rarr;
                 </button>
                 <span className="badge badge-primary font-bold">Google Satellite Hybrid</span>
               </div>
             </div>

             <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)', minHeight: '75vh', position: 'relative' }}>
                <MapContainer center={KERALA_CENTER} zoom={7} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; Google'
                    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    maxZoom={22}
                  />

                  {/* Active SOS Citizen Markers */}
                  {sosList.filter(s => s.status === 'ACTIVE').map(sos => (
                    sos.lat && <Marker key={sos.id} position={[sos.lat, sos.lng]}>
                      <Popup>
                        <strong>{sos.id}</strong><br/>
                        Citizen: {sos.citizenId}<br/>
                        Status: ACTIVE SOS
                      </Popup>
                    </Marker>
                  ))}

                  {sosList.filter(s => s.status === 'ACTIVE').map(sos => (
                    sos.lat && <Circle key={`c-${sos.id}`} center={[sos.lat, sos.lng]} pathOptions={{ color: 'red', fillColor: 'red' }} radius={5000} />
                  ))}

                  {/* AI Flood High-Risk Inundation Overlays */}
                  {showFloodHazardLayer && (
                    <>
                      {/* Idukki - Extreme Red Alert */}
                      <Circle center={[9.8494, 76.9720]} radius={24000} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.25, weight: 2, dashArray: '4, 4' }}>
                        <Popup><strong>🔴 Idukki District</strong><br/>AI Flood Probability: 88.5%<br/>Periyar Basin Inundation</Popup>
                      </Circle>
                      {/* Wayanad - Extreme Red Alert */}
                      <Circle center={[11.6854, 76.1320]} radius={22000} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.25, weight: 2, dashArray: '4, 4' }}>
                        <Popup><strong>🔴 Wayanad District</strong><br/>AI Flood Probability: 91.2%<br/>Kabini Basin Flash Surge</Popup>
                      </Circle>
                      {/* Pathanamthitta - Red Alert */}
                      <Circle center={[9.2648, 76.7870]} radius={20000} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.25, weight: 2, dashArray: '4, 4' }}>
                        <Popup><strong>🔴 Pathanamthitta District</strong><br/>AI Flood Probability: 84.0%<br/>Pamba Basin Inundation</Popup>
                      </Circle>
                      {/* Alappuzha - High Orange Alert */}
                      <Circle center={[9.4981, 76.3388]} radius={18000} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2, weight: 1.5 }}>
                        <Popup><strong>🟠 Alappuzha District</strong><br/>AI Flood Probability: 72.4%<br/>Kuttanad Delta Waterlogging</Popup>
                      </Circle>
                      {/* Ernakulam - High Orange Alert */}
                      <Circle center={[9.9816, 76.2999]} radius={18000} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2, weight: 1.5 }}>
                        <Popup><strong>🟠 Ernakulam District</strong><br/>AI Flood Probability: 68.5%<br/>Lower Periyar Outflow</Popup>
                      </Circle>
                    </>
                  )}
                </MapContainer>
             </div>
           </div>
        )}

        {/* 7. Beautiful Coming Soon Cards for all less important / upcoming features */}
        {Object.keys(COMING_SOON_DATA).includes(activeView) && (
          renderComingSoonCard(activeView)
        )}

      </main>
    </div>
  );
}
