import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './components/Login';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import DistrictAdminDashboard from './components/DistrictAdminDashboard';
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
        {/* 1. KSDMA State Superadmin Portal */}
        <Route 
          path="/superadmin" 
          element={<SuperAdminDashboard onLogout={handleLogout} />} 
        />
        
        {/* 2. District Collectorate (DDMA) Admin Portal */}
        <Route 
          path="/admin" 
          element={<DistrictAdminDashboard onLogout={handleLogout} />} 
        />
        <Route 
          path="/district-admin" 
          element={<DistrictAdminDashboard onLogout={handleLogout} />} 
        />
        
        {/* 3. Sub-Admin (Station Hub Server & Live Excel Logs) */}
        <Route 
          path="/subadmin" 
          element={<Dashboard role="SUBADMIN" onLogout={handleLogout} />} 
        />
        <Route 
          path="/hub" 
          element={<Dashboard role="SUBADMIN" onLogout={handleLogout} />} 
        />
        
        {/* Standard Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={<SuperAdminDashboard onLogout={handleLogout} />} 
        />
        
        {/* Login Page */}
        <Route 
          path="/login" 
          element={<Login onLogin={handleLogin} />} 
        />

        {/* Default Landing */}
        <Route path="/" element={<SuperAdminDashboard onLogout={handleLogout} />} />
        <Route path="*" element={<SuperAdminDashboard onLogout={handleLogout} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
