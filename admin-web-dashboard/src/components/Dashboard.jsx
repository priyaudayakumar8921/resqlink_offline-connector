import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  LogOut, 
  Activity, 
  MapPin, 
  AlertTriangle, 
  RadioTower, 
  CheckCircle2, 
  User, 
  Clock, 
  ShieldAlert, 
  MessagesSquare, 
  Mic, 
  Image, 
  MessageSquare,
  Download,
  FileSpreadsheet,
  Cloud,
  Database,
  ExternalLink,
  Settings,
  Plus,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { API_BASE_URL } from '../config';

export default function Dashboard({ onLogout, role = 'SUPERADMIN' }) {
  const [sosList, setSosList] = useState([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [liveConnections, setLiveConnections] = useState(0);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE', 'RESOLVED', 'FALSE_ALARM', 'INTER_DEPT', 'ALL_LOGS'
  const [notices, setNotices] = useState([]);
  const [playingSosId, setPlayingSosId] = useState(null);
  
  // Sync Status
  const [syncStatus, setSyncStatus] = useState({
    supabase: { configured: false, status: 'INITIALIZING', pendingCount: 0 },
    googleSheets: { configured: false, webhookUrl: '', pendingCount: 0 },
    totalLogs: 0
  });
  
  // Google Sheets modal & view state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [sheetWebhookInput, setSheetWebhookInput] = useState('');
  const [sheetViewUrlInput, setSheetViewUrlInput] = useState('');
  const [configSaving, setConfigSaving] = useState(false);

  const knownActiveIds = useRef(new Set());
  const isInitialLoad = useRef(true);

  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playBeep = (time) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.start(time);
        osc.stop(time + 0.2);
      };
      
      playBeep(ctx.currentTime);
      playBeep(ctx.currentTime + 0.3);
      playBeep(ctx.currentTime + 0.6);
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };
  
  useEffect(() => {
    // Poll the mock hub server every 3 seconds for new SOS signals & sync status
    const fetchSOS = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/sos`);
        const data = await response.json();
        
        let hasNewAlert = false;
        const currentActiveIds = new Set();
        
        data.forEach(sos => {
          if (sos.status === 'ACTIVE') {
            currentActiveIds.add(sos.id);
            if (!knownActiveIds.current.has(sos.id)) {
              hasNewAlert = true;
            }
          }
        });
        
        if (hasNewAlert && !isInitialLoad.current) {
          playAlertSound();
        }
        
        knownActiveIds.current = currentActiveIds;
        isInitialLoad.current = false;
        
        setSosList(data);
      } catch (err) {
        console.error('Error fetching SOS from Hub:', err);
      }
    };
    
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/stats`);
        const data = await response.json();
        setLiveConnections(data.liveConnections);
      } catch (err) {
        console.error('Error fetching stats:', err);
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

    const fetchSync = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/sync/status`);
        if (res.ok) {
          const data = await res.json();
          setSyncStatus(data);
          if (data.googleSheets) {
            if (data.googleSheets.rawWebhookUrl && !sheetWebhookInput) {
              setSheetWebhookInput(data.googleSheets.rawWebhookUrl);
            } else if (data.googleSheets.webhookUrl && !sheetWebhookInput) {
              setSheetWebhookInput(data.googleSheets.webhookUrl);
            }
            if (data.googleSheets.viewUrl && !sheetViewUrlInput) {
              setSheetViewUrlInput(data.googleSheets.viewUrl);
            }
          }
        }
      } catch (err) {
        // hub might be restarting
      }
    };

    fetchSOS();
    fetchStats();
    fetchNotices();
    fetchSync();
    
    const interval = setInterval(() => {
      fetchSOS();
      fetchStats();
      fetchNotices();
      fetchSync();
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMsg })
      });
      if (response.ok) {
        alert('Broadcast successfully transmitted via Hub!');
      } else {
        alert('Failed to transmit broadcast');
      }
    } catch (error) {
      console.error('Error broadcasting:', error);
      alert('Error transmitting broadcast');
    }
    
    setBroadcastMsg('');
  };

  const handleExportCsv = () => {
    window.open(`${API_BASE_URL}/api/v1/sos/export-csv`, '_blank');
  };

  const handleOpenLiveSheet = () => {
    // 1. If user has a Google Sheet URL configured, open it
    const url = syncStatus.googleSheets?.viewUrl || sheetViewUrlInput;
    if (url && url.trim()) {
      window.open(url.trim(), '_blank');
    } else {
      // 2. Directly open/download the real-time Excel spreadsheet (.CSV)
      window.open(`${API_BASE_URL}/api/v1/sos/export-csv`, '_blank');
    }
  };

  const handleSaveGoogleSheetConfig = async (e) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sync/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          googleSheetWebhookUrl: sheetWebhookInput,
          googleSheetViewUrl: sheetViewUrlInput
        })
      });
      if (res.ok) {
        setShowConfigModal(false);
        // Refresh sync status immediately
        try {
          const syncRes = await fetch(`${API_BASE_URL}/api/v1/sync/status`);
          if (syncRes.ok) {
            const data = await syncRes.json();
            setSyncStatus(data);
          }
        } catch (_) {}
      } else {
        alert('Failed to update Google Sheet config');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to Hub server');
    } finally {
      setConfigSaving(false);
    }
  };

  // Filter list based on selected tab
  const displayedSosList = activeTab === 'ALL_LOGS' 
    ? sosList 
    : (activeTab === 'INTER_DEPT' ? [] : sosList.filter(s => s.status === activeTab));

  return (
    <div className="w-full h-full flex flex-col">
      <header className="app-header flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div className="flex items-center gap-4">
          <div className="pulse-animation" style={{ color: 'var(--danger)' }}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-gradient" style={{ margin: 0 }}>
              {role === 'SUPERADMIN' ? 'Superadmin Command Center' : role === 'SUBADMIN' ? 'Subadmin Hub Operations' : 'Station Admin Operations'}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {role === 'SUPERADMIN' ? 'Alappuzha Emergency HQ (Master Command)' : role === 'SUBADMIN' ? 'Local Mesh Gateway Node & Telemetry' : 'Local Station Response & Dispatch'}
            </div>
          </div>
          <span className="badge badge-success">
            <RadioTower size={14} /> Hub Active
          </span>
          <span className="badge badge-primary" style={{ fontWeight: 'bold' }}>
            {role === 'SUPERADMIN' ? '👑 SUPERADMIN' : role === 'SUBADMIN' ? '🛰️ SUBADMIN (HUB)' : '🛡️ ADMIN'}
          </span>
        </div>

        {/* Quick Portal Switcher: Superadmin, Admin, Subadmin */}
        <div className="flex gap-1" style={{ background: 'rgba(0,0,0,0.35)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <Link 
            to="/superadmin" 
            className={`badge ${role === 'SUPERADMIN' ? 'badge-primary font-bold' : ''}`}
            style={{ textDecoration: 'none', cursor: 'pointer', padding: '4px 10px', color: role === 'SUPERADMIN' ? 'white' : 'var(--text-muted)' }}
          >
            👑 Superadmin
          </Link>
          <Link 
            to="/admin" 
            className={`badge ${role === 'ADMIN' ? 'badge-primary font-bold' : ''}`}
            style={{ textDecoration: 'none', cursor: 'pointer', padding: '4px 10px', color: role === 'ADMIN' ? 'white' : 'var(--text-muted)' }}
          >
            🛡️ Admin
          </Link>
          <Link 
            to="/subadmin" 
            className={`badge ${role === 'SUBADMIN' ? 'badge-primary font-bold' : ''}`}
            style={{ textDecoration: 'none', cursor: 'pointer', padding: '4px 10px', color: role === 'SUBADMIN' ? 'white' : 'var(--text-muted)' }}
          >
            🛰️ Subadmin
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Export to CSV / Google Sheet button */}
          <button 
            onClick={handleExportCsv} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            title="Download full disaster data logs with Date, Time, Coordinates & Transcripts"
          >
            <Download size={15} /> Export Logs (.CSV)
          </button>

          {/* Option to View Real-Time Sheet in Excel */}
          <button 
            onClick={handleOpenLiveSheet}
            className="btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.85rem',
              background: 'rgba(34, 197, 94, 0.18)',
              borderColor: '#22c55e',
              color: '#4ade80',
              fontWeight: 600
            }}
            title="Open real-time disaster logs directly in Excel / Google Sheets"
          >
            <FileSpreadsheet size={15} /> View Real-Time Sheet (Excel)
          </button>

          {/* Plus button to connect new sheet */}
          <button 
            onClick={() => setShowConfigModal(true)} 
            className="btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.85rem',
              background: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'var(--border-light)'
            }}
            title="Connect new Google Sheet if needed"
          >
            <Plus size={16} /> Connect Sheet
          </button>

          <button onClick={onLogout} className="btn" style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="container flex-mobile-col flex gap-6" style={{ flex: 1, alignItems: 'flex-start' }}>
        
        {/* Left Column: SOS Feed */}
        <div className="flex flex-col gap-4" style={{ flex: 2, width: '100%' }}>
          
          {/* Navigation Tabs */}
          <div className="flex gap-2" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem', overflowX: 'auto' }}>
            <button 
              className={`btn ${activeTab === 'ACTIVE' ? 'btn-primary' : ''}`}
              style={activeTab !== 'ACTIVE' ? { background: 'transparent', color: 'var(--text-muted)' } : {}}
              onClick={() => setActiveTab('ACTIVE')}
            >
              <Activity size={16} /> Live Command ({sosList.filter(s => s.status === 'ACTIVE').length})
            </button>
            <button 
              className={`btn ${activeTab === 'RESOLVED' ? 'btn-primary' : ''}`}
              style={activeTab !== 'RESOLVED' ? { background: 'transparent', color: 'var(--text-muted)' } : {}}
              onClick={() => setActiveTab('RESOLVED')}
            >
              <CheckCircle2 size={16} /> Resolved ({sosList.filter(s => s.status === 'RESOLVED').length})
            </button>
            <button 
              className={`btn ${activeTab === 'ALL_LOGS' ? 'btn-primary' : ''}`}
              style={activeTab !== 'ALL_LOGS' ? { background: 'transparent', color: 'var(--text-muted)' } : {}}
              onClick={() => setActiveTab('ALL_LOGS')}
            >
              <Database size={16} /> All Logs ({sosList.length})
            </button>
            <button 
              className={`btn ${activeTab === 'FALSE_ALARM' ? 'btn-danger' : ''}`}
              style={activeTab !== 'FALSE_ALARM' ? { background: 'transparent', color: 'var(--text-muted)' } : {}}
              onClick={() => setActiveTab('FALSE_ALARM')}
            >
              <AlertTriangle size={16} /> False Alerts ({sosList.filter(s => s.status === 'FALSE_ALARM').length})
            </button>
            <button 
              className={`btn ${activeTab === 'INTER_DEPT' ? 'btn-primary' : ''}`}
              style={activeTab !== 'INTER_DEPT' ? { background: 'transparent', color: 'var(--text-muted)' } : {}}
              onClick={() => setActiveTab('INTER_DEPT')}
            >
              <MessagesSquare size={16} /> Internal Notices
            </button>
          </div>

          {/* Subheader info banner for Data Logs */}
          {(activeTab === 'RESOLVED' || activeTab === 'ALL_LOGS') && (
            <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.08)', borderLeft: '4px solid var(--primary)' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                  📊 Disaster SOS Data Logs ({displayedSosList.length} Records)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  All records include Date, Time, Latitude, Longitude, Citizen ID, Priority, and Voice Transcripts.
                </div>
              </div>
              <button onClick={handleExportCsv} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                <Download size={14} /> Download Dataset (.CSV)
              </button>
            </div>
          )}
          
          <div className="flex flex-col gap-4">
            {activeTab !== 'INTER_DEPT' && displayedSosList.length === 0 ? (
               <div className="text-center text-muted" style={{ padding: '2rem' }}>
                 No {activeTab.toLowerCase().replace('_', ' ')} alerts found.
               </div>
            ) : null}
            
            {activeTab !== 'INTER_DEPT' && displayedSosList.map((sos) => {
              const d = sos.timestamp ? new Date(sos.timestamp) : new Date();
              const formattedDate = d.toLocaleDateString('en-GB');
              const formattedTime = d.toLocaleTimeString('en-US');

              return (
              <div key={sos.id} className="glass-panel hover-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="flex flex-col gap-2" style={{ maxWidth: '75%' }}>
                  <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{sos.id}</h4>
                    {sos.status === 'ACTIVE' && <span className="badge badge-danger">Active</span>}
                    {sos.status === 'RESOLVED' && <span className="badge badge-success">Resolved</span>}
                    {sos.status === 'FALSE_ALARM' && <span className="badge badge-warning" style={{ background: '#333', color: '#ccc', borderColor: '#555' }}>False Alarm</span>}
                    
                    {sos.emergencyType && (
                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                          {sos.emergencyType}
                        </span>
                    )}

                    {sos.priority && (
                        <span className="badge" style={{ 
                          background: sos.priority === 'CRITICAL' ? 'rgba(239, 68, 68, 0.3)' : (sos.priority === 'HIGH' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.15)'), 
                          color: sos.priority === 'CRITICAL' ? '#f87171' : (sos.priority === 'HIGH' ? '#fbbf24' : '#60a5fa'),
                          fontWeight: 'bold'
                        }}>
                          PRIORITY: {sos.priority}
                        </span>
                    )}
                  </div>
                  
                  {sos.description && sos.description !== 'No description provided' && (
                    <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.75rem', 
                        background: 'rgba(0, 0, 0, 0.25)', 
                        borderRadius: '6px',
                        borderLeft: '3px solid var(--danger)',
                        fontSize: '0.95rem',
                        lineHeight: 1.4
                    }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: '0.25rem' }}>
                        <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                           <Mic size={14} /> VOICE TRANSCRIPT
                        </div>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            window.speechSynthesis.cancel();
                            
                            const rawContent = sos.description ? sos.description.replace(/\[VOICE_EMERGENCY\]/g, '').split('| Location:')[0].trim() : '';
                            const textToSpeak = rawContent || 'No voice transcript received.';
                            
                            const utterance = new SpeechSynthesisUtterance(textToSpeak);
                            const voices = window.speechSynthesis.getVoices();
                            if (voices.length > 0) {
                                utterance.voice = voices.find(v => v.lang.includes('en') || v.lang.includes('hi')) || voices[0];
                            }
                            
                            utterance.rate = 0.95;
                            utterance.pitch = 1.0;
                            utterance.volume = 1.0;
                            
                            utterance.onstart = () => setPlayingSosId(sos.id);
                            utterance.onend = () => setPlayingSosId(null);
                            utterance.onerror = () => setPlayingSosId(null);
                            
                            window.speechSynthesis.speak(utterance);
                          }}
                          className="badge" 
                          style={{ 
                            background: playingSosId === sos.id ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.2)', 
                            color: playingSosId === sos.id ? '#4ade80' : '#60a5fa', 
                            border: playingSosId === sos.id ? '1px solid rgba(34, 197, 94, 0.6)' : '1px solid rgba(59, 130, 246, 0.4)', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            fontWeight: 'bold'
                          }}
                        >
                          {playingSosId === sos.id ? '🔊 PLAYING AUDIO...' : '▶ PLAY AUDIO'}
                        </button>
                      </div>
                      <div style={{ fontStyle: 'italic', color: '#e2e8f0', marginTop: '4px' }}>
                        "{sos.description ? sos.description.replace(/\[VOICE_EMERGENCY\]/g, '').split('| Location:')[0].trim() : ''}"
                      </div>
                    </div>
                  )}

                  {/* Citizen ID, Date & Time */}
                  <div className="flex items-center gap-4 text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span className="flex items-center gap-1">
                      <User size={13} /> {sos.citizenId}
                    </span>
                    <span className="flex items-center gap-1" title={sos.timestamp}>
                      <Clock size={13} /> {formattedDate} at {formattedTime} ({formatDistanceToNow(d)} ago)
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {sos.lat ? (
                    <a href={`https://www.google.com/maps?q=${sos.lat},${sos.lng}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {Number(sos.lat).toFixed(4)}, {Number(sos.lng).toFixed(4)} <ExternalLink size={11} />
                      </span>
                    </a>
                  ) : (
                    <span className="badge badge-warning">No Location</span>
                  )}
                  {sos.status === 'ACTIVE' && (
                    <div className="flex gap-2">
                      <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={async () => {
                         try {
                           await fetch(`${API_BASE_URL}/api/v1/sos/${sos.id}/resolve`, { method: 'PUT' });
                           setSosList(sosList.map(s => s.id === sos.id ? {...s, status: 'RESOLVED'} : s));
                         } catch (e) {
                           console.error('Failed to resolve SOS', e);
                         }
                      }}>
                        <CheckCircle2 size={14} /> Mark Resolved
                      </button>
                      <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#333', color: '#fff' }} onClick={async () => {
                         try {
                           await fetch(`${API_BASE_URL}/api/v1/sos/${sos.id}/false-alarm`, { method: 'PUT' });
                           setSosList(sosList.map(s => s.id === sos.id ? {...s, status: 'FALSE_ALARM'} : s));
                         } catch (e) {
                           console.error('Failed to mark false alarm', e);
                         }
                      }}>
                        Mark False Alarm
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
            })}

            {activeTab === 'INTER_DEPT' && notices.map(n => (
               <div key={n.id} className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.7)', borderLeft: '4px solid var(--primary)' }}>
                  <div className="flex justify-between" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                     <strong>From: {n.sender}</strong>
                     <span>{formatDistanceToNow(new Date(n.timestamp))} ago</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                     {n.type === 'VOICE' ? <Mic size={18}/> : (n.type === 'IMAGE' ? <Image size={18}/> : <MessageSquare size={18}/>)}
                     {n.type} DIRECTIVE (INTERNET)
                  </div>
                  <div style={{ fontSize: '1rem', lineHeight: 1.5 }}>{n.content}</div>
                  <div style={{ marginTop: '1rem' }}>
                     <span className="badge badge-success">Target: {n.target}</span>
                  </div>
               </div>
            ))}
            {activeTab === 'INTER_DEPT' && notices.length === 0 && (
               <div className="text-center text-muted" style={{ padding: '2rem' }}>
                 No internal notices received.
               </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions & Real-Time Sync Status */}
        <div className="flex flex-col gap-6" style={{ flex: 1, width: '100%' }}>
          
          {/* Broadcast Form */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="flex items-center gap-2" style={{ marginBottom: '1.5rem', color: 'var(--warning)' }}>
              <AlertTriangle size={20} /> Broadcast Alert
            </h3>
            <form onSubmit={handleBroadcast} className="flex flex-col gap-4">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <textarea 
                  className="input-field" 
                  rows="4" 
                  placeholder="Enter message to broadcast to all connected citizen devices..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-danger w-full">
                <RadioTower size={18} /> Send Broadcast
              </button>
            </form>
          </div>
          
          {/* System & Dual-Cloud Sync Status */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
             <h3 className="text-muted" style={{ marginBottom: '1rem', fontSize: '1rem' }}>Dual-Storage & System Status</h3>
             <div className="flex flex-col gap-3" style={{ fontSize: '0.9rem' }}>
                <div className="flex justify-between items-center">
                   <span style={{ color: 'var(--text-muted)' }}>Local Emergency Hub</span>
                   <span className="text-success font-bold">Online (Port 3000)</span>
                </div>
                <div className="flex justify-between items-center">
                   <span style={{ color: 'var(--text-muted)' }}>Local Disaster Logs</span>
                   <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{syncStatus.totalLogs || sosList.length} Stored</span>
                </div>
                <div className="flex justify-between items-center">
                   <span style={{ color: 'var(--text-muted)' }}>Connected Citizen Devices</span>
                   <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{liveConnections} Active</span>
                </div>
                
                <hr style={{ borderColor: 'var(--border-light)', margin: '0.25rem 0' }} />

                {/* Supabase Status */}
                <div className="flex justify-between items-center">
                   <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                     <Cloud size={14} /> Supabase Cloud
                   </span>
                   {syncStatus.supabase?.status === 'CONNECTED' ? (
                     <span className="text-success font-bold">● Active Sync</span>
                   ) : syncStatus.supabase?.status === 'OFFLINE_QUEUED' ? (
                     <span style={{ color: '#fbbf24' }}>● Queued ({syncStatus.supabase.pendingCount})</span>
                   ) : syncStatus.supabase?.configured ? (
                     <span style={{ color: '#60a5fa' }}>● Configured</span>
                   ) : (
                     <span style={{ color: 'var(--text-muted)' }}>Offline Resilient</span>
                   )}
                </div>

                {/* Google Sheets Status */}
                <div className="flex justify-between items-center" style={{ marginTop: '0.4rem' }}>
                   <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                     <FileSpreadsheet size={14} /> Google Sheets
                   </span>
                   <div className="flex items-center gap-1.5">
                     {syncStatus.googleSheets?.configured ? (
                       <span className="text-success font-bold" style={{ fontSize: '0.8rem', marginRight: '4px' }}>
                         ● Active
                       </span>
                     ) : (
                       <span style={{ color: '#fbbf24', fontSize: '0.8rem', marginRight: '4px' }}>Offline</span>
                     )}
                     
                     <button
                       onClick={handleOpenLiveSheet}
                       className="badge"
                       style={{ 
                         background: 'rgba(34, 197, 94, 0.15)', 
                         color: '#4ade80', 
                         border: '1px solid rgba(34, 197, 94, 0.35)', 
                         cursor: 'pointer',
                         display: 'inline-flex',
                         alignItems: 'center',
                         gap: '4px',
                         padding: '3px 8px'
                       }}
                       title="View real-time Google Sheet"
                     >
                       <ExternalLink size={11} /> View Sheet
                     </button>

                     <button 
                       onClick={() => setShowConfigModal(true)} 
                       className="badge" 
                       style={{ 
                         background: 'rgba(59, 130, 246, 0.15)', 
                         color: '#60a5fa', 
                         border: '1px solid rgba(59, 130, 246, 0.35)', 
                         cursor: 'pointer',
                         display: 'inline-flex',
                         alignItems: 'center',
                         gap: '2px',
                         padding: '3px 6px'
                       }}
                       title="Connect new sheet"
                     >
                       <Plus size={13} />
                     </button>
                   </div>
                </div>
             </div>

             <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
               <button 
                 onClick={handleExportCsv} 
                 className="btn w-full"
                 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}
               >
                 <Download size={15} /> Download All Data Logs (.CSV)
               </button>
             </div>
          </div>
        </div>
      </main>

      {/* Clean Connect Google Sheet Modal (Zero Tutorial Clutter) */}
      {showConfigModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem', position: 'relative' }}>
            <button 
              onClick={() => setShowConfigModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3" style={{ marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(34, 197, 94, 0.18)', padding: '8px', borderRadius: '8px', color: '#4ade80' }}>
                <Plus size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Connect Google Sheet</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live distress signal logging & real-time viewing</div>
              </div>
            </div>

            <form onSubmit={handleSaveGoogleSheetConfig} className="flex flex-col gap-4">
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                  📊 Google Sheet URL (To View Real-Time):
                </label>
                <input 
                  type="url" 
                  className="input-field" 
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={sheetViewUrlInput}
                  onChange={(e) => setSheetViewUrlInput(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                  ⚡ Webhook URL (Apps Script /exec):
                </label>
                <input 
                  type="url" 
                  className="input-field" 
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={sheetWebhookInput}
                  onChange={(e) => setSheetWebhookInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3" style={{ marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowConfigModal(false)} 
                  className="btn"
                  style={{ background: 'transparent' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={configSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} />
                  {configSaving ? 'Saving...' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
