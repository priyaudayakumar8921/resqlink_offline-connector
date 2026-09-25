import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, RadioTower, Building, ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }) {
  const [stations, setStations] = useState([]);
  const [department, setDepartment] = useState('');
  const [stationId, setStationId] = useState('');
  const [password, setPassword] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
  };

  const fallbackStations = [
    { stationId: "POL-ALP-SOUTH", stationName: "Alappuzha South Police Station", department: "POLICE" },
    { stationId: "POL-ALP-NORTH", stationName: "Alappuzha North Police Station", department: "POLICE" },
    { stationId: "POL-PUNNAPRA", stationName: "Punnapra Police Station", department: "POLICE" },
    { stationId: "POL-AMBALAPUZHA", stationName: "Ambalapuzha Police Station", department: "POLICE" },
    { stationId: "POL-NEDUMUDY", stationName: "Nedumudy Police Station", department: "POLICE" },
    { stationId: "POL-MARARIKKULAM", stationName: "Mararikkulam Police Station", department: "POLICE" },
    { stationId: "POL-MANNANCHERY", stationName: "Mannanchery Police Station", department: "POLICE" },
    { stationId: "POL-CHERTHALA", stationName: "Cherthala Police Station", department: "POLICE" },
    { stationId: "POL-AROOR", stationName: "Aroor Police Station", department: "POLICE" },
    { stationId: "POL-KUTHIATHODE", stationName: "Kuthiathode Police Station", department: "POLICE" },
    { stationId: "POL-PATTANAKKAD", stationName: "Pattanakkad Police Station", department: "POLICE" },
    { stationId: "POL-MUHAMMA", stationName: "Muhamma Police Station", department: "POLICE" },
    { stationId: "POL-ARTHUNKAL", stationName: "Arthunkal Police Station", department: "POLICE" },
    { stationId: "POL-PULINCUNNU", stationName: "Pulincunnu Police Station", department: "POLICE" },
    { stationId: "POL-EDATHUA", stationName: "Edathua Police Station", department: "POLICE" },
    { stationId: "POL-RAMANKARI", stationName: "Ramankari Police Station", department: "POLICE" },
    { stationId: "POL-KAINADY", stationName: "Kainady Police Station", department: "POLICE" },
    { stationId: "POL-KAYAMKULAM", stationName: "Kayamkulam Police Station", department: "POLICE" },
    { stationId: "POL-HARIPPAD", stationName: "Harippad Police Station", department: "POLICE" },
    { stationId: "POL-KAREELAKULANGARA", stationName: "Kareelakulangara Police Station", department: "POLICE" },
    { stationId: "POL-TRIKKUNNAPUZHA", stationName: "Trikkunnapuzha Police Station", department: "POLICE" },
    { stationId: "POL-KANAKAKUNNU", stationName: "Kanakakunnu Police Station", department: "POLICE" },
    { stationId: "POL-VALLIKUNNAM", stationName: "Vallikunnam Police Station", department: "POLICE" },
    { stationId: "POL-CHENGANNUR", stationName: "Chengannur Police Station", department: "POLICE" },
    { stationId: "POL-MANNAR", stationName: "Mannar Police Station", department: "POLICE" },
    { stationId: "POL-VENMONY", stationName: "Venmony Police Station", department: "POLICE" },
    { stationId: "POL-MAVELIKARA", stationName: "Mavelikara Police Station", department: "POLICE" },
    { stationId: "POL-NOORANAD", stationName: "Nooranad Police Station", department: "POLICE" },
    { stationId: "POL-KURATHIKAD", stationName: "Kurathikad Police Station", department: "POLICE" },
    { stationId: "POL-VEEYAPURAM", stationName: "Veeyapuram Police Station", department: "POLICE" },
    { stationId: "POL-CYBER", stationName: "Cyber Police Station", department: "POLICE" },
    { stationId: "POL-VANITHA", stationName: "Alappuzha Vanitha Police Station", department: "POLICE" },
    { stationId: "POL-COASTAL", stationName: "Thottappally Coastal Police Station", department: "POLICE" },
    { stationId: "POL-TRAFFIC", stationName: "Alappuzha Traffic Police Station", department: "POLICE" },
    { stationId: "FRS-ALAPPUZHA", stationName: "Fire and Rescue Station, Alappuzha", department: "FIRE_AND_RESCUE" },
    { stationId: "FRS-AROOR", stationName: "Fire and Rescue Station, Aroor", department: "FIRE_AND_RESCUE" },
    { stationId: "FRS-CHERTHALA", stationName: "Fire and Rescue Station, Cherthala", department: "FIRE_AND_RESCUE" },
    { stationId: "FRS-THAKAZHY", stationName: "Fire and Rescue Station, Thakazhy", department: "FIRE_AND_RESCUE" },
    { stationId: "FRS-HARIPAD", stationName: "Fire and Rescue Station, Haripad", department: "FIRE_AND_RESCUE" },
    { stationId: "FRS-KAYAMKULAM", stationName: "Fire and Rescue Station, Kayamkulam", department: "FIRE_AND_RESCUE" },
    { stationId: "FRS-MAVELIKKARA", stationName: "Fire and Rescue Station, Mavelikkara", department: "FIRE_AND_RESCUE" },
    { stationId: "FRS-CHENGANNUR", stationName: "Fire and Rescue Station, Chengannur", department: "FIRE_AND_RESCUE" }
  ];

  useEffect(() => {
    generateCaptcha();
    fetch('http://localhost:3000/api/v1/stations')
      .then(res => res.json())
      .then(data => setStations(data))
      .catch(err => {
        console.error('Error fetching stations, using fallback:', err);
        setStations(fallbackStations);
      });
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (captchaInput.toUpperCase() !== captchaText) {
      setError('Invalid CAPTCHA.');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/api/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin();
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      // Offline fallback
      if (password === 'admin123') {
        onLogin();
      } else {
        setError('Server offline. Use admin123 for local demo.');
      }
    }
  };


  const filteredStations = stations.filter(s => s.department === department);

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="glass-panel animate-slide-up" style={{ padding: '3rem', width: '100%', maxWidth: '480px' }}>
        <div className="flex flex-col items-center gap-4" style={{ marginBottom: '2rem' }}>
          <div className="pulse-animation" style={{ 
            background: 'rgba(239, 68, 68, 0.2)', 
            padding: '1rem', 
            borderRadius: '50%',
            color: 'var(--danger)'
          }}>
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '2rem' }}>ResQLink Admin</h1>
          <p className="text-muted">Command Center Access</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col w-full">
          
          <div className="input-group">
            <label className="input-label flex items-center gap-2">
              <Building size={16} /> Select Department
            </label>
            <div className="flex gap-4" style={{ marginTop: '0.5rem' }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="department" 
                  value="POLICE" 
                  checked={department === 'POLICE'}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setStationId('');
                  }}
                />
                Police Station
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="department" 
                  value="FIRE_AND_RESCUE" 
                  checked={department === 'FIRE_AND_RESCUE'}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setStationId('');
                  }}
                />
                Fire & Rescue
              </label>
            </div>
          </div>

          {department && (
            <div className="input-group animate-slide-up" style={{ marginTop: '1rem' }}>
              <label className="input-label flex items-center gap-2">
                <RadioTower size={16} /> Select Station
              </label>
              <select
                className="input-field"
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                required
              >
                <option value="" disabled>-- Select a Station --</option>
                {filteredStations.map(st => (
                  <option key={st.stationId} value={st.stationId}>
                    {st.stationName}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {stationId && (
            <div className="animate-slide-up" style={{ marginTop: '1rem' }}>
              <div className="input-group">
                <label className="input-label flex items-center gap-2">
                  <KeyRound size={16} /> Password
                </label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label className="input-label flex items-center gap-2">
                  <ShieldCheck size={16} /> Security Captcha
                </label>
                <div className="flex gap-2 items-center">
                  <div style={{ 
                    background: '#111', 
                    padding: '0.75rem', 
                    letterSpacing: '4px', 
                    fontFamily: 'monospace',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: 'var(--danger)',
                    borderRadius: '4px',
                    userSelect: 'none'
                  }}>
                    {captchaText}
                  </div>
                  <input 
                    type="text" 
                    className="input-field flex-1" 
                    placeholder="Enter Captcha"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <div style={{ color: 'var(--danger)', marginTop: '1rem', textAlign: 'center' }}>{error}</div>}

              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1.5rem' }}>
                Access Dashboard
              </button>
            </div>
          )}
        </form>


      </div>
    </div>
  );
}
