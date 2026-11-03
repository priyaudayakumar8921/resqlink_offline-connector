import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, RadioTower, Building, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config';

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
    fetch(`${API_BASE_URL}/api/v1/stations`)
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
      const res = await fetch(`${API_BASE_URL}/api/v1/login`, {
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
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #090a0f 0%, #1a1c29 100%)',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(220, 38, 38, 0.15) 0%, transparent 50%), radial-gradient(circle at 10% 90%, rgba(37, 99, 235, 0.05) 0%, transparent 50%)',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div className="animate-slide-up" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '3rem',
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(220, 38, 38, 0.1) inset'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div className="pulse-animation" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(153, 27, 27, 0.4) 100%)',
            padding: '1.25rem',
            borderRadius: '50%',
            color: '#f87171',
            boxShadow: '0 0 20px rgba(220, 38, 38, 0.4)',
            marginBottom: '1.5rem'
          }}>
            <ShieldAlert size={56} strokeWidth={1.5} />
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            background: 'linear-gradient(to right, #ffffff, #9ca3af)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-1px'
          }}>RESQLINK</h1>
          <p style={{ color: '#9ca3af', fontSize: '0.95rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '600' }}>
            Restricted Admin Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Building size={14} /> Department
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['POLICE', 'FIRE_AND_RESCUE'].map((dept) => (
                <label key={dept} style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.875rem',
                  background: department === dept ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${department === dept ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '12px',
                  color: department === dept ? '#f87171' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}>
                  <input 
                    type="radio" 
                    name="department" 
                    value={dept} 
                    checked={department === dept}
                    onChange={(e) => { setDepartment(e.target.value); setStationId(''); }}
                    style={{ display: 'none' }}
                  />
                  {dept === 'POLICE' ? 'POLICE' : 'FIRE & RESCUE'}
                </label>
              ))}
            </div>
          </div>

          {department && (
            <div className="animate-slide-up">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <RadioTower size={14} /> Station Location
              </label>
              <select
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  color: '#f3f4f6',
                  fontSize: '1rem',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                required
              >
                <option value="" disabled style={{ color: '#6b7280' }}>-- Select Assigned Station --</option>
                {filteredStations.map(st => (
                  <option key={st.stationId} value={st.stationId} style={{ background: '#111827', color: '#fff' }}>
                    {st.stationName}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {stationId && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <KeyRound size={14} /> Authorization Key
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '1rem',
                    color: '#f3f4f6',
                    fontSize: '1rem',
                    outline: 'none',
                    letterSpacing: '2px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <ShieldCheck size={14} /> Security Validation
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ 
                    background: 'linear-gradient(to right, #000000, #111827)', 
                    padding: '0.875rem 1.5rem', 
                    letterSpacing: '6px', 
                    fontFamily: 'monospace',
                    fontSize: '1.25rem',
                    fontWeight: '800',
                    color: '#f87171',
                    borderRadius: '12px',
                    userSelect: 'none',
                    border: '1px dashed rgba(239, 68, 68, 0.3)',
                    textShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                  }}>
                    {captchaText}
                  </div>
                  <input 
                    type="text" 
                    placeholder="ENTER CAPTCHA"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                    required
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '1rem',
                      color: '#f3f4f6',
                      fontSize: '1rem',
                      outline: 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '2px'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>
              </div>

              {error && (
                <div className="animate-slide-up" style={{ 
                  color: '#f87171', 
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '1rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  {error}
                </div>
              )}

              <button type="submit" style={{ 
                marginTop: '1rem',
                width: '100%',
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '700',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.4)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                AUTHENTICATE
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
