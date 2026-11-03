import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('resqlink_auth') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('resqlink_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('resqlink_auth');
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Direct Dedicated Portals for Superadmin, Admin, and Subadmin */}
        <Route 
          path="/superadmin" 
          element={<Dashboard role="SUPERADMIN" onLogout={handleLogout} />} 
        />
        <Route 
          path="/admin" 
          element={<Dashboard role="ADMIN" onLogout={handleLogout} />} 
        />
        <Route 
          path="/subadmin" 
          element={<Dashboard role="SUBADMIN" onLogout={handleLogout} />} 
        />
        
        {/* Standard Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={<Dashboard role="SUPERADMIN" onLogout={handleLogout} />} 
        />
        
        {/* Login Page */}
        <Route 
          path="/login" 
          element={<Login onLogin={handleLogin} />} 
        />

        {/* Default Landing: Direct to Superadmin Master Portal */}
        <Route path="/" element={<Navigate to="/superadmin" replace />} />
        <Route path="*" element={<Navigate to="/superadmin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
