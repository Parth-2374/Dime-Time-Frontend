import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MaterialUpload from './pages/MaterialUpload';
import MtcUpload from './pages/MtcUpload';
import MtcReports from './pages/MtcReports';
import Verification from './pages/Verification';
import Grn from './pages/Grn';
import AuditTrail from './pages/AuditTrail';
import Profile from './pages/Profile';
import PlateCalculator from './pages/PlateCalculator';
import RfqManagement from './pages/RfqManagement';
import QuotationManagement from './pages/QuotationManagement';
import PurchaseOrders from './pages/PurchaseOrders';
import Production from './pages/Production';
import Dispatches from './pages/Dispatches';
import AdminPanel from './pages/AdminPanel';
import MasterTemplates from './pages/MasterTemplates';
import SupplierPerformance from './pages/SupplierPerformance';
import ManufacturerPerformance from './pages/ManufacturerPerformance';
import ReportsCenter from './pages/ReportsCenter';
import SystemSettings from './pages/SystemSettings';
import FeatureRequests from './pages/FeatureRequests';
import FeatureManager from './pages/FeatureManager';
import InvoiceManagement from './pages/InvoiceManagement';
import PaymentManagement from './pages/PaymentManagement';


// Global Axios request interceptor for JWT Bearer Token
axios.interceptors.request.use(
  (config) => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.token) {
          config.headers['Authorization'] = `Bearer ${parsed.token}`;
        }
      } catch (e) {
        // Safe skip
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default function App() {
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [featuresList, setFeaturesList] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setSessionLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchFeaturesList();
    }
  }, [user]);

  const fetchFeaturesList = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/features');
      if (res.data) {
        setFeaturesList(res.data);
      }
    } catch (e) {
      console.error('Failed to sync SCM feature flags:', e);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (sessionLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        fontFamily: "'Outfit', sans-serif"
      }}>
        Initializing DimeTime Portal...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Register />
          }
        />

        {/* Dashboard Shell layout (requires Auth) */}
        <Route
          path="/*"
          element={
            user ? (
              <div className="app-container">
                <Sidebar user={user} onLogout={handleLogout} features={featuresList} />
                <div className="main-content">
                  <Navbar user={user} />
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard user={user} />} />
                    <Route path="/material-upload" element={<MaterialUpload user={user} />} />
                    <Route path="/mtc-upload" element={<MtcUpload user={user} />} />
                    <Route path="/mtc-reports" element={<MtcReports user={user} />} />
                    <Route path="/verification" element={<Verification user={user} />} />
                    <Route path="/grn" element={<Grn />} />
                    <Route path="/audit-trail" element={<AuditTrail />} />
                    <Route path="/plate-calculator" element={<PlateCalculator user={user} />} />
                    <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
                    <Route path="/rfqs" element={<RfqManagement user={user} />} />
                    <Route path="/quotations" element={<QuotationManagement user={user} />} />
                    <Route path="/purchase-orders" element={<PurchaseOrders user={user} />} />
                    <Route path="/production" element={<Production user={user} />} />
                    <Route path="/dispatches" element={<Dispatches user={user} />} />
                    <Route path="/admin-panel" element={<AdminPanel user={user} />} />
                    <Route path="/master-data" element={<MasterTemplates user={user} />} />
                    <Route path="/supplier-performance" element={<SupplierPerformance user={user} />} />
                    <Route path="/manufacturer-performance" element={<ManufacturerPerformance user={user} />} />
                    <Route path="/reports-center" element={<ReportsCenter />} />
                    <Route path="/system-settings" element={<SystemSettings user={user} onFeaturesChanged={fetchFeaturesList} />} />
                    <Route path="/feature-requests" element={<FeatureRequests user={user} />} />
                    <Route path="/feature-manager" element={<FeatureManager user={user} onFeaturesChanged={fetchFeaturesList} />} />
                    <Route path="/invoices" element={<InvoiceManagement user={user} />} />
                    <Route path="/payments" element={<PaymentManagement user={user} />} />
                    {/* Fallback inside portal */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}
