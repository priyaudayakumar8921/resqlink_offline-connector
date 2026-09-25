import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, ShieldCheck, Globe, Activity, Network } from 'lucide-react';

export default function Login({ onLogin }) {
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

  useEffect(() => {
    generateCaptcha();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (captchaInput.toUpperCase() !== captchaText) {
      setError('Invalid Authentication Token.');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }
    
    // Offline fallback for demo
    if (password === 'admin123') {
      onLogin();
    } else {
      setError('Access Denied. Invalid Secretariat Passcode.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--bg-dark)' }}>
      
      {/* Left side: Luxurious Branding (Hidden on very small screens) */}
      <div style={{ 
        flex: 1, 
        background: 'var(--primary)', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        position: 'relative',
        overflow: 'hidden'
      }} className="hide-on-mobile">
        
        {/* Abstract Background Elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'rgba(0,0,0,0.2)', borderRadius: '50%', filter: 'blur(60px)' }} />
        
        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '400px' }}>
           <Globe size={84} color="rgba(255,255,255,0.8)" strokeWidth={1} style={{ marginBottom: '1rem' }} />
           
           <div>
             <h1 style={{ fontSize: '3rem', fontWeight: 300, letterSpacing: '-0.02em', margin: 0, color: 'white' }}>KSDMA</h1>
             <h2 style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0, color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
                Apex Command Center
             </h2>
           </div>
           
           <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontSize: '1rem', marginTop: '1rem' }}>
             Authorized personnel only. This terminal provides state-wide override capabilities, live GIS mesh tracking, and AI-driven triage protocols.
           </p>

           <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                 <Activity size={16} /> Secure Enclave
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                 <Network size={16} /> Encrypted Node
              </div>
           </div>
        </div>
      </div>

      {/* Right side: Login Panel */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '2rem'
      }}>
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Terminal Access</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Enter your Secretariat credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label flex items-center gap-2" style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <KeyRound size={14} /> Master Passcode
              </label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-light)',
                  padding: '1rem 1.25rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-glow)'
                }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label flex items-center gap-2" style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <ShieldCheck size={14} /> Identity Verification
              </label>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ 
                  background: 'var(--primary)', 
                  padding: '1rem', 
                  letterSpacing: '6px', 
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: 'white',
                  borderRadius: '8px',
                  userSelect: 'none',
                  boxShadow: 'var(--shadow-glow)'
                }}>
                  {captchaText}
                </div>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Enter Code"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  required
                  style={{ 
                    flex: 1,
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-light)',
                    padding: '1rem 1.25rem',
                    fontSize: '1rem',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: 'var(--danger)', 
                padding: '1rem', 
                borderRadius: '8px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <ShieldAlert size={16} /> {error}
              </div>
            )}

            <button type="submit" style={{ 
              background: 'var(--text-main)',
              color: 'white',
              border: 'none',
              padding: '1.25rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '1rem',
              boxShadow: '0 4px 14px rgba(45, 52, 54, 0.2)',
              transition: 'all 0.2s',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(45, 52, 54, 0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(45, 52, 54, 0.2)'; }}
            >
              AUTHENTICATE <Activity size={18} />
            </button>
            
          </form>

        </div>
      </div>
      
    </div>
  );
}
