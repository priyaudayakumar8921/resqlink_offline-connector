import React, { useState, useEffect } from 'react';
import { 
  LogOut, Activity, MapPin, AlertTriangle, RadioTower, CheckCircle2, 
  User, Clock, ShieldAlert, Map as MapIcon, Cpu, Zap, Send, Plane, PlaySquare, 
  Network, Truck, ShieldBan, MessageSquare, Phone, MessagesSquare, Mic, Image,
  Tent, Video, Route, Waves, Users, Package, Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix for default leaflet icons not showing in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Kerala Center Coordinates
const KERALA_CENTER = [10.8505, 76.2711];

export default function Dashboard({ onLogout }) {
  const [sosList, setSosList] = useState([]);
  const [liveConnections, setLiveConnections] = useState(1402);
  const [activeView, setActiveView] = useState('COMMAND'); // COMMAND, GIS, INFRA, AI, FLEET, PLAYBACK
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
        const response = await fetch('http://localhost:3000/api/v1/sos');
        const data = await response.json();
        setSosList(data);
      } catch (err) {
        console.error('Error fetching SOS from Hub:', err);
      }
    };

    const fetchNotices = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/v1/notices');
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
      await fetch('http://localhost:3000/api/v1/notices', {
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

  const SidebarButton = ({ view, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveView(view)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', 
        width: '100%', padding: '1rem', border: 'none',
        background: activeView === view ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: activeView === view ? 'var(--primary)' : 'var(--text-muted)',
        borderLeft: activeView === view ? '4px solid var(--primary)' : '4px solid transparent',
        cursor: 'pointer', transition: 'all 0.2s',
        fontWeight: activeView === view ? 'bold' : 'normal',
        textAlign: 'left', fontSize: '0.95rem'
      }}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="w-full h-screen flex" style={{ overflow: 'hidden' }}>
      {/* Sidebar Navigation */}
      <aside style={{ 
        width: '260px', background: 'var(--bg-card)', 
        borderRight: '1px solid var(--border-light)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-3">
            <Activity size={28} color="var(--primary)" />
            <div>
              <h2 className="text-gradient" style={{ fontSize: '1.2rem', margin: 0 }}>KSDMA</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Super Admin Portal</span>
            </div>
          </div>
        </div>
        
        <div style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>CORE OPERATIONS</div>
          <SidebarButton view="COMMAND" icon={ShieldAlert} label="Command & Broadcast" />
          <SidebarButton view="CITIZEN_SOS" icon={User} label="Citizen Alerts (Sub-Admin)" />
          <SidebarButton view="INTER_DEPT" icon={MessagesSquare} label="Internal Comms" />
          
          <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>TACTICAL & MAPS</div>
          <SidebarButton view="GIS" icon={MapIcon} label="GIS Heatmap" />
          <SidebarButton view="CAMPS" icon={Tent} label="Relief Camp Density" />
          <SidebarButton view="DRONE" icon={Video} label="Drone Video Feeds" />
          <SidebarButton view="EVAC" icon={Route} label="Evacuation Corridor AI" />
          <SidebarButton view="TELEMETRY" icon={Waves} label="River & Dam Telemetry" />
          <SidebarButton view="FLEET" icon={Truck} label="Fleet & Aviation" />
          
          <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>MANAGEMENT</div>
          <SidebarButton view="VOLUNTEER" icon={Users} label="Volunteer Task Force" />
          <SidebarButton view="INVENTORY" icon={Package} label="Resource Matrix" />
          <SidebarButton view="SUPPLY" icon={Activity} label="Supply Chain AI" />
          <SidebarButton view="MISSING" icon={Search} label="Missing Persons Ledger" />
          <SidebarButton view="MULTI_AGENCY" icon={Network} label="Multi-Agency Sync" />
          
          <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>SYSTEM</div>
          <SidebarButton view="INFRA" icon={Cpu} label="Hardware Infrastructure" />
          <SidebarButton view="AI" icon={Zap} label="Predictive AI Mapping" />
          <SidebarButton view="PLAYBACK" icon={PlaySquare} label="Historical Playback" />
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
           <button onClick={onLogout} className="btn w-full" style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
             <LogOut size={16} /> Secure Logout
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Stats Bar */}
        <div className="flex gap-4" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>ACTIVE CITIZEN NODES</p>
               <h2 style={{ fontSize: '2rem', color: 'var(--primary)', margin: 0 }}>{liveConnections.toLocaleString()}</h2>
             </div>
             <Network size={32} color="var(--primary)" style={{ opacity: 0.2 }} />
          </div>
          <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>STATE MESH HUBS</p>
               <h2 style={{ fontSize: '2rem', color: 'var(--accent)', margin: 0 }}>14 / 14 Online</h2>
             </div>
             <Cpu size={32} color="var(--accent)" style={{ opacity: 0.2 }} />
          </div>
          <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>AI THREAT LEVEL</p>
               <h2 style={{ fontSize: '2rem', color: 'var(--warning)', margin: 0 }}>MODERATE</h2>
             </div>
             <Zap size={32} color="var(--warning)" style={{ opacity: 0.2 }} />
          </div>
        </div>

        {/* Dynamic View Content */}
        {activeView === 'COMMAND' && (
          <div className="flex gap-6">
            <div style={{ flex: 1 }} className="flex flex-col gap-6">
              <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
                <h3 className="flex items-center gap-2" style={{ marginBottom: '1.5rem', color: 'var(--danger)' }}>
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

        {/* Citizen SOS Alerts View */}
        {activeView === 'CITIZEN_SOS' && (
           <div className="flex flex-col gap-4">
              <div style={{ padding: '1rem 0' }}>
                 <h3 className="flex items-center gap-2 text-gradient"><Activity size={24}/> Citizen Alerts (Forwarded from Sub-Admins)</h3>
                 <p style={{ color: 'var(--text-muted)' }}>Emergency SOS signals captured by local Police and Fire & Rescue stations, forwarded to the Secretariat.</p>
              </div>
              
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
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
                             await fetch(`http://localhost:3000/api/v1/sos/${sos.id}/resolve`, { method: 'PUT' });
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

        {/* Inter-Departmental Comms */}
        {activeView === 'INTER_DEPT' && (
           <div className="flex gap-6">
              <div className="glass-panel" style={{ flex: 1, padding: '2rem' }}>
                 <h3 className="flex items-center gap-2 text-gradient" style={{ marginBottom: '1.5rem' }}>
                    <MessagesSquare size={20} /> Secure Internal Dispatch (Internet)
                 </h3>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
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

              <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                 <h3 className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Dispatch Log</h3>
                 <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

        {/* Real-time Mapping Interface */}
        {activeView !== 'COMMAND' && activeView !== 'INTER_DEPT' && activeView !== 'CITIZEN_SOS' && (
           <div className="glass-panel" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
             <h3 className="flex items-center gap-2 text-gradient" style={{ marginBottom: '1rem' }}>
               {activeView === 'GIS' && <><MapIcon size={20}/> GIS Live Heatmap</>}
               {activeView === 'INFRA' && <><Cpu size={20}/> Hardware Infrastructure Map</>}
               {activeView === 'FLEET' && <><Truck size={20}/> Fleet & Aviation Live Tracking</>}
               {activeView === 'AI' && <><Zap size={20}/> AI Flood Probability Map</>}
               {activeView === 'PLAYBACK' && <><PlaySquare size={20}/> Historical DVR Playback</>}
             </h3>

             <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)', minHeight: '75vh', position: 'relative' }}>
                <MapContainer center={KERALA_CENTER} zoom={7} style={{ height: '100%', width: '100%' }}>
                  
                  {/* Google Maps Hybrid Layer (Ultra High Res Satellite + Streets) */}
                  <TileLayer
                    attribution='&copy; Google'
                    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    maxZoom={22}
                  />

                  {/* Render based on Active View */}

                  {(activeView === 'GIS' || activeView === 'PLAYBACK') && sosList.filter(s => s.status === 'ACTIVE').map(sos => (
                    sos.lat && <Marker key={sos.id} position={[sos.lat, sos.lng]}>
                      <Popup>
                        <strong>{sos.id}</strong><br/>
                        Citizen: {sos.citizenId}<br/>
                        Status: ACTIVE SOS
                      </Popup>
                    </Marker>
                  ))}

                  {activeView === 'GIS' && sosList.filter(s => s.status === 'ACTIVE').map(sos => (
                    sos.lat && <Circle key={`c-${sos.id}`} center={[sos.lat, sos.lng]} pathOptions={{ color: 'red', fillColor: 'red' }} radius={5000} />
                  ))}

                  {/* NOTE: Infra, Fleet, and AI data will be mapped here once real API endpoints are connected */}
                  
                </MapContainer>
             </div>

             {/* Playback Controls Footer */}
             {activeView === 'PLAYBACK' && (
               <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                 <button className="btn btn-primary"><PlaySquare size={16} /> Play</button>
                 <input type="range" style={{ flex: 1 }} />
                 <span style={{ color: 'var(--text-muted)' }}>Aug 15, 2018 - 14:00</span>
               </div>
             )}

           </div>
        )}
        )}

        {/* New 10 Pro Features Sync */}
        {activeView === 'CAMPS' && (
          <div className="glass-panel" style={{ padding: '2rem', minHeight: '500px' }}>
            <h3 className="flex items-center gap-2 text-warning mb-4"><Tent size={24}/> State-Wide Relief Camp Density</h3>
            <div className="text-center text-muted" style={{ padding: '4rem 2rem' }}>
               No active relief camps registered across the state.
            </div>
          </div>
        )}

        {activeView === 'DRONE' && (
          <div className="glass-panel flex flex-col" style={{ padding: '2rem', height: '600px' }}>
            <h3 className="flex items-center gap-2 text-danger mb-4"><Video size={24}/> Live Drone Feed (NDRF)</h3>
            <div style={{ flex: 1, background: '#000', borderRadius: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div className="pulse-animation" style={{ color: 'red', position: 'absolute', top: '1rem', right: '1rem' }}>● REC</div>
               <span style={{ color: 'rgba(255,255,255,0.5)' }}>Awaiting Video Stream Connection...</span>
            </div>
          </div>
        )}

        {activeView === 'TELEMETRY' && (
          <div className="glass-panel" style={{ padding: '2rem', minHeight: '500px' }}>
            <h3 className="flex items-center gap-2 text-primary mb-4"><Waves size={24}/> River Gauge & Dam Telemetry</h3>
            <div className="text-center text-muted" style={{ padding: '4rem 2rem' }}>
               Awaiting sensor data synchronization from district gauges.
            </div>
          </div>
        )}

        {activeView === 'VOLUNTEER' && (
          <div className="glass-panel" style={{ padding: '2rem', minHeight: '500px' }}>
            <h3 className="flex items-center gap-2 mb-4"><Users size={24}/> Volunteer Task Force</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid var(--border-light)' }}><th style={{ padding: '1rem' }}>Name</th><th>Skills</th><th>Status</th></tr></thead>
              <tbody>
              </tbody>
            </table>
            <div className="text-center text-muted" style={{ padding: '2rem' }}>
               No volunteers currently deployed.
            </div>
          </div>
        )}

        {activeView === 'INVENTORY' && (
          <div className="glass-panel" style={{ padding: '2rem', minHeight: '500px' }}>
            <h3 className="flex items-center gap-2 text-success mb-4"><Package size={24}/> Resource Matrix</h3>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
               <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}><h2>0</h2><p className="text-muted">Life Jackets</p></div>
               <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}><h2>0</h2><p className="text-muted">Rescue Boats</p></div>
               <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}><h2>0</h2><p className="text-muted">Food Packets</p></div>
            </div>
          </div>
        )}

        {activeView === 'MISSING' && (
          <div className="glass-panel" style={{ padding: '2rem', minHeight: '500px' }}>
            <h3 className="flex items-center gap-2 text-primary mb-4"><Search size={24}/> Missing Persons Ledger</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid var(--border-light)' }}><th style={{ padding: '1rem' }}>Reported Missing</th><th>Last Known Location</th><th>Match Status</th></tr></thead>
              <tbody>
              </tbody>
            </table>
            <div className="text-center text-muted" style={{ padding: '2rem' }}>
               No missing person reports filed.
            </div>
          </div>
        )}

        {['EVAC', 'GEOFENCE', 'SUPPLY', 'MULTI_AGENCY'].includes(activeView) && (
           <div className="glass-panel flex flex-col items-center justify-center" style={{ padding: '4rem 2rem', textAlign: 'center', minHeight: '600px' }}>
              <Zap size={64} color="var(--primary)" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' }} />
              <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.8rem' }}>
                {activeView.replace('_', ' ')} AI MODULE (PRO)
              </h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '600px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                 This Super-Admin premium module is active and awaiting API integration. Data streams will populate this interface automatically upon deployment.
              </p>
           </div>
        )}

      </main>
    </div>
  );
}
