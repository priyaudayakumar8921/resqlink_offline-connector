import React, { useState, useEffect } from 'react';
import { LogOut, Activity, MapPin, AlertTriangle, RadioTower, CheckCircle2, User, Clock, ShieldAlert, MessagesSquare, Mic, Image, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MOCK_SOS = [
  { id: 'SOS-001', citizenId: 'USER-9482', lat: 34.0522, lng: -118.2437, timestamp: new Date(Date.now() - 1000 * 60 * 5), status: 'ACTIVE' },
  { id: 'SOS-002', citizenId: 'USER-1122', lat: 34.0529, lng: -118.2440, timestamp: new Date(Date.now() - 1000 * 60 * 15), status: 'RESOLVED' },
  { id: 'SOS-003', citizenId: 'USER-8831', lat: null, lng: null, timestamp: new Date(Date.now() - 1000 * 60 * 2), status: 'ACTIVE' },
];

export default function Dashboard({ onLogout }) {
  const [sosList, setSosList] = useState([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [liveConnections, setLiveConnections] = useState(0);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE', 'RESOLVED', 'FALSE_ALARM', 'INTER_DEPT'
  const [notices, setNotices] = useState([]);
  
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

  return (
    <div className="w-full h-full flex flex-col">
      <header className="app-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="pulse-animation" style={{ color: 'var(--danger)' }}>
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-gradient">Command Center</h2>
          <span className="badge badge-success">
            <RadioTower size={14} /> Hub Connected
          </span>
        </div>
        <button onClick={onLogout} className="btn" style={{ background: 'transparent', color: 'var(--text-muted)' }}>
          <LogOut size={18} /> Logout
        </button>
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
              <Activity size={16} /> Live Command
            </button>
            <button 
              className={`btn ${activeTab === 'RESOLVED' ? 'btn-primary' : ''}`}
              style={activeTab !== 'RESOLVED' ? { background: 'transparent', color: 'var(--text-muted)' } : {}}
              onClick={() => setActiveTab('RESOLVED')}
            >
              <CheckCircle2 size={16} /> Data Logs
            </button>
            <button 
              className={`btn ${activeTab === 'FALSE_ALARM' ? 'btn-danger' : ''}`}
              style={activeTab !== 'FALSE_ALARM' ? { background: 'transparent', color: 'var(--text-muted)' } : {}}
              onClick={() => setActiveTab('FALSE_ALARM')}
            >
              <AlertTriangle size={16} /> False Alerts
            </button>
            <button 
              className={`btn ${activeTab === 'INTER_DEPT' ? 'btn-primary' : ''}`}
              style={activeTab !== 'INTER_DEPT' ? { background: 'transparent', color: 'var(--text-muted)' } : {}}
              onClick={() => setActiveTab('INTER_DEPT')}
            >
              <MessagesSquare size={16} /> Internal Notices
            </button>
          </div>
          
          <div className="flex flex-col gap-4">
            {activeTab !== 'INTER_DEPT' && sosList.filter(s => s.status === activeTab).length === 0 ? (
               <div className="text-center text-muted" style={{ padding: '2rem' }}>
                 No {activeTab.toLowerCase().replace('_', ' ')} alerts found.
               </div>
            ) : null}
            
            {activeTab !== 'INTER_DEPT' && sosList.filter(s => s.status === activeTab).map((sos) => (
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

        {/* Right Column: Actions */}
        <div className="flex flex-col gap-6" style={{ flex: 1, width: '100%' }}>
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
      </main>
    </div>
  );
}
