import React, { useState, useEffect } from 'react';
import { LogOut, Activity, MapPin, AlertTriangle, RadioTower, CheckCircle2, User, Clock, ShieldAlert, MessagesSquare, Mic, Image, MessageSquare, MapIcon, Cpu, Zap, Truck, Tent, Video, Route, Users, Waves, Smartphone, Package, Search, Network } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';

const MOCK_SOS = [
  { id: 'SOS-001', citizenId: 'USER-9482', lat: 34.0522, lng: -118.2437, timestamp: new Date(Date.now() - 1000 * 60 * 5), status: 'ACTIVE' },
  { id: 'SOS-002', citizenId: 'USER-1122', lat: 34.0529, lng: -118.2440, timestamp: new Date(Date.now() - 1000 * 60 * 15), status: 'RESOLVED' },
  { id: 'SOS-003', citizenId: 'USER-8831', lat: null, lng: null, timestamp: new Date(Date.now() - 1000 * 60 * 2), status: 'ACTIVE' },
];

export default function Dashboard({ onLogout }) {
  const [sosList, setSosList] = useState([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [liveConnections, setLiveConnections] = useState(0);
  const [activeTab, setActiveTab] = useState('HOME'); // 'HOME', 'CITIZEN_ALERTS', 'RESOLVED', 'FALSE_ALARM', 'INTER_DEPT'
  const [notices, setNotices] = useState([]);
  
  const districtName = localStorage.getItem('adminDistrict') || 'District';
  // Standard center for map, can be adjusted per district in a real app
  const KERALA_CENTER = [10.8505, 76.2711];

  useEffect(() => {
    // Poll the mock hub server every 3 seconds for new SOS signals
    const fetchSOS = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/sos');
        const data = await response.json();
        
        // Mock filtering logic for the district since real data doesn't have district info yet
        const districtFiltered = data.filter(sos => {
           // Basic hash to assign SOS consistently to a district for demo
           const hash = sos.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
           return (hash % 14) === ["Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"].indexOf(districtName);
        });
        
        setSosList(districtFiltered);
      } catch (err) {
        console.error('Error fetching SOS from Hub:', err);
      }
    };
    
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/stats');
        const data = await response.json();
        setLiveConnections(data.liveConnections);
      } catch (err) {
        console.error('Error fetching stats:', err);
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
    
    fetchSOS(); // Initial fetch
    fetchStats();
    fetchNotices();
    
    const interval = setInterval(() => {
      fetchSOS();
      fetchStats();
      fetchNotices();
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/broadcast', {
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

  const SidebarButton = ({ view, icon: Icon, label }) => (
    <button 
      className={`sidebar-btn ${activeTab === view ? 'active' : ''}`}
      onClick={() => setActiveTab(view)}
      style={{
         display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', 
         border: 'none', background: activeTab === view ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
         color: activeTab === view ? 'var(--primary)' : 'var(--text-muted)',
         textAlign: 'left', cursor: 'pointer', borderLeft: activeTab === view ? '3px solid var(--primary)' : '3px solid transparent',
         transition: 'all 0.2s', fontWeight: activeTab === view ? 'bold' : 'normal'
      }}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <header className="app-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="pulse-animation" style={{ color: 'var(--primary)' }}>
            <Activity size={28} />
          </div>
          <h2 className="text-gradient">{districtName} Collectorate (DDMA)</h2>
          <span className="badge badge-success">
            <RadioTower size={14} /> District Mesh Connected
          </span>
        </div>
        <button onClick={onLogout} className="btn" style={{ background: 'transparent', color: 'var(--text-muted)' }}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <main className="flex h-full" style={{ overflow: 'hidden' }}>
        
        {/* Left Sidebar */}
        <div className="glass-panel" style={{ width: '280px', borderRadius: 0, borderTop: 'none', borderBottom: 'none', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
           <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Core Operations
           </div>
           <SidebarButton view="HOME" icon={Activity} label="District Overview" />
           <SidebarButton view="CITIZEN_ALERTS" icon={User} label="Citizen Alerts (Sub-Admin)" />
           <SidebarButton view="INTER_DEPT" icon={MessagesSquare} label="Internal Notices" />
           <SidebarButton view="RESOLVED" icon={CheckCircle2} label="Data Logs" />
           
           <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', borderTop: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>
              Pro Features (Tactical)
           </div>
           <SidebarButton view="GIS" icon={MapIcon} label="GIS Heatmap" />
           <SidebarButton view="CAMPS" icon={Tent} label="Relief Camp Density" />
           <SidebarButton view="DRONE" icon={Video} label="Drone Video Feeds" />
           <SidebarButton view="EVAC" icon={Route} label="Evacuation Corridor AI" />
           <SidebarButton view="TELEMETRY" icon={Waves} label="River & Dam Telemetry" />
           <SidebarButton view="FLEET" icon={Truck} label="Fleet & Aviation" />
           <SidebarButton view="GEOFENCE" icon={Smartphone} label="Geo-Fenced SMS" />
           
           <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', borderTop: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>
              Pro Features (Management)
           </div>
           <SidebarButton view="VOLUNTEER" icon={Users} label="Volunteer Task Force" />
           <SidebarButton view="INVENTORY" icon={Package} label="Resource Matrix" />
           <SidebarButton view="SUPPLY" icon={Activity} label="Supply Chain AI" />
           <SidebarButton view="MISSING" icon={Search} label="Missing Persons Ledger" />
           <SidebarButton view="MULTI_AGENCY" icon={Network} label="Multi-Agency Sync" />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6" style={{ overflowY: 'auto', background: 'var(--bg-dark)' }}>
        
        {/* Main Content Area Container */}
        <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
          
          {activeTab === 'HOME' && (
             <div className="flex gap-6">
                <div className="glass-panel flex flex-col items-center justify-center" style={{ flex: 2, padding: '4rem 2rem', textAlign: 'center' }}>
                   <ShieldAlert size={64} color="var(--border-light)" style={{ marginBottom: '1rem' }} />
                   <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>{districtName} Collectorate Dashboard</h2>
                   <p style={{ color: 'var(--text-muted)', maxWidth: '500px' }}>
                      Welcome to the District Command Center. Core operations and newly added tactical Pro Features are accessible via the sidebar menu.
                   </p>
                </div>
                
                {/* Right Column: Actions */}
                <div className="flex flex-col gap-6" style={{ flex: 1, width: '100%' }}>
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 className="flex items-center gap-2" style={{ marginBottom: '1.5rem', color: 'var(--warning)' }}>
                      <AlertTriangle size={20} /> District Broadcast Alert
                    </h3>
                    <form onSubmit={handleBroadcast} className="flex flex-col gap-4">
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <textarea 
                          className="input-field" 
                          rows="4" 
                          placeholder={`Enter message to broadcast to all citizens in ${districtName}...`}
                          value={broadcastMsg}
                          onChange={(e) => setBroadcastMsg(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-danger w-full">
                        <RadioTower size={18} /> Send District Broadcast
                      </button>
                    </form>
                  </div>
                  
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                     <h3 className="text-muted" style={{ marginBottom: '1rem', fontSize: '1rem' }}>System Status</h3>
                     <div className="flex flex-col gap-3" style={{ fontSize: '0.9rem' }}>
                        <div className="flex justify-between items-center">
                           <span style={{ color: 'var(--text-muted)' }}>Local Network</span>
                           <span className="text-success">Connected</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span style={{ color: 'var(--text-muted)' }}>ESP32 Hub</span>
                           <span className="text-success">Active (192.168.4.1)</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span style={{ color: 'var(--text-muted)' }}>Active Citizens</span>
                           <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{liveConnections} Devices</span>
                        </div>
                     </div>
                  </div>
                </div>
             </div>
          )}

            {['CITIZEN_ALERTS', 'RESOLVED', 'FALSE_ALARM'].includes(activeTab) && sosList.filter(s => s.status === (activeTab === 'CITIZEN_ALERTS' ? 'ACTIVE' : activeTab)).length === 0 ? (
               <div className="text-center text-muted" style={{ padding: '2rem' }}>
                 No {activeTab.toLowerCase().replace('_', ' ')} found.
               </div>
            ) : null}
            
            {['CITIZEN_ALERTS', 'RESOLVED', 'FALSE_ALARM'].includes(activeTab) && sosList.filter(s => s.status === (activeTab === 'CITIZEN_ALERTS' ? 'ACTIVE' : activeTab)).map((sos) => (
              <div key={sos.id} className="glass-panel hover-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h4 style={{ fontSize: '1.1rem' }}>{sos.id}</h4>
                    {sos.status === 'ACTIVE' && <span className="badge badge-danger">Active</span>}
                    {sos.status === 'RESOLVED' && <span className="badge badge-success">Resolved</span>}
                    {sos.status === 'FALSE_ALARM' && <span className="badge badge-warning" style={{ background: '#333', color: '#ccc', borderColor: '#555' }}>False Alarm</span>}
                  </div>
                  <div className="flex items-center gap-4 text-muted" style={{ fontSize: '0.9rem' }}>
                    <span className="flex items-center gap-1">
                      <User size={14} /> {sos.citizenId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {formatDistanceToNow(sos.timestamp)} ago
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {sos.lat ? (
                    <a href={`https://www.google.com/maps?q=${sos.lat},${sos.lng}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }}>
                        <MapPin size={14} /> {sos.lat.toFixed(4)}, {sos.lng.toFixed(4)}
                      </span>
                    </a>
                  ) : (
                    <span className="badge badge-warning">No Location</span>
                  )}
                  {sos.status === 'ACTIVE' && (
                    <div className="flex gap-2">
                      <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={async () => {
                         try {
                           await fetch(`http://localhost:3000/api/v1/sos/${sos.id}/resolve`, { method: 'PUT' });
                           setSosList(sosList.map(s => s.id === sos.id ? {...s, status: 'RESOLVED'} : s));
                         } catch (e) {
                           console.error('Failed to resolve SOS', e);
                         }
                      }}>
                        <CheckCircle2 size={14} /> Mark Resolved
                      </button>
                      <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#333', color: '#fff' }} onClick={async () => {
                         try {
                           await fetch(`http://localhost:3000/api/v1/sos/${sos.id}/false-alarm`, { method: 'PUT' });
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
            ))}
            
            {['RESOLVED', 'FALSE_ALARM'].includes(activeTab) && sosList.filter(s => s.status === activeTab).map((sos) => (
              <div key={sos.id} className="glass-panel hover-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h4 style={{ fontSize: '1.1rem' }}>{sos.id}</h4>
                    {sos.status === 'RESOLVED' && <span className="badge badge-success">Resolved</span>}
                    {sos.status === 'FALSE_ALARM' && <span className="badge badge-warning" style={{ background: '#333', color: '#ccc', borderColor: '#555' }}>False Alarm</span>}
                  </div>
                  <div className="flex items-center gap-4 text-muted" style={{ fontSize: '0.9rem' }}>
                    <span className="flex items-center gap-1">
                      <User size={14} /> {sos.citizenId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {formatDistanceToNow(sos.timestamp)} ago
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {sos.lat ? (
                    <a href={`https://www.google.com/maps?q=${sos.lat},${sos.lng}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }}>
                        <MapPin size={14} /> {sos.lat.toFixed(4)}, {sos.lng.toFixed(4)}
                      </span>
                    </a>
                  ) : (
                    <span className="badge badge-warning">No Location</span>
                  )}
                </div>
              </div>
            ))}

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

            {/* 10 Advanced Pro Features */}
            {activeTab === 'CAMPS' && (
              <div className="glass-panel" style={{ padding: '2rem', minHeight: '500px' }}>
                <h3 className="flex items-center gap-2 text-warning mb-4"><Tent size={24}/> Relief Camp Density</h3>
                <div className="text-center text-muted" style={{ padding: '4rem 2rem' }}>
                   No active relief camps registered in this district.
                </div>
              </div>
            )}

            {activeTab === 'DRONE' && (
              <div className="glass-panel flex flex-col" style={{ padding: '2rem', height: '600px' }}>
                <h3 className="flex items-center gap-2 text-danger mb-4"><Video size={24}/> Live Drone Feed (NDRF)</h3>
                <div style={{ flex: 1, background: '#000', borderRadius: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <div className="pulse-animation" style={{ color: 'red', position: 'absolute', top: '1rem', right: '1rem' }}>● REC</div>
                   <span style={{ color: 'rgba(255,255,255,0.5)' }}>Awaiting Video Stream Connection...</span>
                </div>
              </div>
            )}

            {activeTab === 'TELEMETRY' && (
              <div className="glass-panel" style={{ padding: '2rem', minHeight: '500px' }}>
                <h3 className="flex items-center gap-2 text-primary mb-4"><Waves size={24}/> River Gauge & Dam Telemetry</h3>
                <div className="text-center text-muted" style={{ padding: '4rem 2rem' }}>
                   Awaiting sensor data synchronization from district gauges.
                </div>
              </div>
            )}

            {activeTab === 'VOLUNTEER' && (
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

            {activeTab === 'INVENTORY' && (
              <div className="glass-panel" style={{ padding: '2rem', minHeight: '500px' }}>
                <h3 className="flex items-center gap-2 text-success mb-4"><Package size={24}/> Resource Matrix</h3>
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                   <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}><h2>0</h2><p className="text-muted">Life Jackets</p></div>
                   <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}><h2>0</h2><p className="text-muted">Rescue Boats</p></div>
                   <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}><h2>0</h2><p className="text-muted">Food Packets</p></div>
                </div>
              </div>
            )}

            {activeTab === 'MISSING' && (
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

            {['EVAC', 'GEOFENCE', 'SUPPLY', 'MULTI_AGENCY'].includes(activeTab) && (
               <div className="glass-panel flex flex-col items-center justify-center" style={{ padding: '4rem 2rem', textAlign: 'center', minHeight: '600px' }}>
                  <Zap size={64} color="var(--primary)" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' }} />
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.8rem' }}>
                    {activeTab.replace('_', ' ')} AI MODULE (PRO)
                  </h2>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '600px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                     This District-Level premium module is active and awaiting API integration. Data streams will populate this interface automatically upon deployment.
                  </p>
               </div>
            )}

            {/* Pro Features: Maps */}
            {['GIS', 'INFRA', 'FLEET', 'AI'].includes(activeTab) && (
              <div className="glass-panel" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
                 <h3 className="flex items-center gap-2 text-gradient" style={{ marginBottom: '1rem' }}>
                   {activeTab === 'GIS' && <><MapIcon size={20}/> District GIS Heatmap</>}
                   {activeTab === 'INFRA' && <><Cpu size={20}/> District Hardware Infrastructure</>}
                   {activeTab === 'FLEET' && <><Truck size={20}/> Emergency Fleet Tracking</>}
                   {activeTab === 'AI' && <><Zap size={20}/> Predictive AI Flood Mapping</>}
                 </h3>
                 <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)', minHeight: '500px', position: 'relative' }}>
                    <MapContainer center={KERALA_CENTER} zoom={7} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; Google'
                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                        maxZoom={22}
                      />
                      
                      {activeTab === 'GIS' && sosList.filter(s => s.status === 'ACTIVE').map(sos => (
                        sos.lat && <Circle key={`c-${sos.id}`} center={[sos.lat, sos.lng]} pathOptions={{ color: 'red', fillColor: 'red' }} radius={5000} />
                      ))}
                      
                    </MapContainer>
                 </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
