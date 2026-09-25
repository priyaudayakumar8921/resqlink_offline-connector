import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, RadioTower, Building, ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }) {
  const [district, setDistrict] = useState('');
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

  const KERALA_DISTRICTS = [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", 
    "Kottayam", "Idukki", "Ernakulam", "Thrissur", 
    "Palakkad", "Malappuram", "Kozhikode", "Wayanad", 
    "Kannur", "Kasaragod"
  ];

  useEffect(() => {
    generateCaptcha();
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
      if (password === 'admin123') {
        localStorage.setItem('adminDistrict', district);
        onLogin();
      } else {
        setError('Invalid District Password. Use admin123 for local demo.');
      }
    } catch (err) {
      setError('Login failed.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="glass-panel animate-slide-up" style={{ padding: '3rem', width: '100%', maxWidth: '480px' }}>
        <div className="flex flex-col items-center gap-4" style={{ marginBottom: '2rem' }}>
          <div className="pulse-animation" style={{ 
            background: 'rgba(5, 150, 105, 0.2)', 
            padding: '1rem', 
            borderRadius: '50%',
            color: 'var(--primary)'
          }}>
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '2rem' }}>DDMA Portal</h1>
          <p className="text-muted">District Command Center</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col w-full">
          
          <div className="input-group">
            <label className="input-label flex items-center gap-2">
              <Building size={16} /> Select District
            </label>
            <select
              className="input-field"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              required
            >
              <option value="" disabled>-- Choose Your District --</option>
              {KERALA_DISTRICTS.map(d => (
                <option key={d} value={d}>{d} Collectorate</option>
              ))}
            </select>
          </div>

          {district && (
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
                Access District Portal
              </button>
            </div>
          )}
        </form>


      </div>
    </div>
  );
}
