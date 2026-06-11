import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FileText,
  PlusCircle,
  TrendingUp,
  Activity,
  ArrowRight,
  ClipboardCheck,
  Briefcase,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building,
  UploadCloud,
  FileCheck,
  FileX,
  Clock,
  Zap,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard({ user: propUser }) {
  const [user, setUser] = useState(propUser || null);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          // ignore
        }
      }
    }
  }, [propUser]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const role = user?.role || 'SUPPLIER';
      let statsUrl = 'https://dime-time-backend.onrender.com/api/dashboard/stats';

      if (role === 'SUPPLIER') {
        statsUrl = `https://dime-time-backend.onrender.com/api/dashboard/supplier/stats?username=${user.username}`;
      } else if (role === 'MANUFACTURER') {
        statsUrl = `https://dime-time-backend.onrender.com/api/dashboard/manufacturer/stats?username=${user.username}`;
      } else if (role === 'ADMIN') {
        statsUrl = 'https://dime-time-backend.onrender.com/api/dashboard/admin/stats';
      }

      const [statsRes, logsRes] = await Promise.all([
        axios.get(statsUrl),
        axios.get('https://dime-time-backend.onrender.com/api/audit-logs')
      ]);

      if (statsRes.data) {
        setStats(statsRes.data);
      }
      if (logsRes.data) {
        setLogs(logsRes.data.slice(0, 6)); // Top 6 logs
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Could not fetch real-time analytics.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.05)',
            borderTop: '3px solid #22c55e',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}></div>
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Synchronizing Analytics...</span>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const role = user?.role || 'SUPPLIER';

  // --- 1. SUPPLIER DASHBOARD RENDERING ---
  if (role === 'SUPPLIER') {
    return (
      <div className="page-container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Supplier Dashboard</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Enterprise Portal • Managing procurement RFQs, PO confirmations, and AI-Powered 5-Way Reconciliation
          </p>
        </div>

        {/* KPIs */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
              <FileText size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">RFQs Broadcasted</span>
              <span className="stat-value">{stats?.totalRfqs || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
              <Zap size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Quotations Received</span>
              <span className="stat-value">{stats?.quotationsReceived || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <Briefcase size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Active POs</span>
              <span className="stat-value">{stats?.activePurchaseOrders || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.08)' }}>
              <Truck size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">In Transit</span>
              <span className="stat-value">{stats?.ordersInTransit || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.08)' }}>
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Pending Deliveries</span>
              <span className="stat-value">{stats?.pendingDeliveries || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <ClipboardCheck size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Approved GRNs</span>
              <span className="stat-value">{stats?.approvedGrns || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Pending MTC Reviews</span>
              <span className="stat-value">{stats?.pendingMtcReviews || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <FileCheck size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Approved MTCs</span>
              <span className="stat-value">{stats?.approvedMtcCertificates || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
              <FileX size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Rejected MTCs</span>
              <span className="stat-value">{stats?.rejectedMtcCertificates || 0}</span>
            </div>
          </div>

          <div className="stat-card" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <div className="stat-icon-wrapper" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
              <ShieldCheck size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-title">AI Reconciliation Accuracy</span>
              <span className="stat-value" style={{ color: '#22c55e' }}>{stats?.reconciliationSuccessRate || 100}%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Pending Payments</span>
              <span className="stat-value">{stats?.pendingPayments || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Completed Payments</span>
              <span className="stat-value">{stats?.completedPayments || 0}</span>
            </div>
          </div>

          <div className="stat-card" style={{ gridColumn: 'span 2' }}>
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <DollarSign size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Total Amount Received</span>
              <span className="stat-value">₹{(stats?.totalAmountReceived || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Charts & Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* Visual Trend Chart */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} style={{ color: '#22c55e' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>Procurement & Bidding Flow</h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                Active Procurements
              </span>
            </div>
            
            {/* SVG graph */}
            <div style={{ height: '220px', width: '100%', marginTop: '0.5rem' }}>
              <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="glowGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                
                <path d="M 0 170 C 80 140, 160 120, 240 60 C 320 80, 400 40, 500 20 L 500 200 L 0 200 Z" fill="url(#glowGreen)" />
                <path d="M 0 170 C 80 140, 160 120, 240 60 C 320 80, 400 40, 500 20" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                
                <circle cx="240" cy="60" r="4.5" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
                <circle cx="400" cy="40" r="4.5" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
                <circle cx="500" cy="20" r="5" fill="#22c55e" />
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>Draft RFQ</span>
              <span>Bids Submitted</span>
              <span>Accept Quotation</span>
              <span>Release PO</span>
              <span>MTC Verify & GRN</span>
            </div>
          </div>

          {/* SCM Quick Actions panel */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>SCM Workflows</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Jump directly to key supply chain modules:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
              <Link to="/rfqs" className="btn btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                <span>Release RFQ Request</span>
                <PlusCircle size={14} />
              </Link>
              
              <Link to="/quotations" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                <span>Compare Bid Quotes</span>
                <ArrowRight size={14} />
              </Link>
              
              <Link to="/verification" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                <span>Run 5-Way Reconciliation</span>
                <ShieldCheck size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. MANUFACTURER DASHBOARD RENDERING ---
  if (role === 'MANUFACTURER') {
    return (
      <div className="page-container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Manufacturer Portal</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Production Dashboard • Track assigned supplier orders, log dispatches, and verify chemical/mechanical specifications via AI OCR MTC.
          </p>
        </div>

        {/* KPIs */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
              <FileText size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">RFQ Requests Received</span>
              <span className="stat-value">{stats?.rfqsReceived || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
              <Zap size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Quotations Submitted</span>
              <span className="stat-value">{stats?.quotationsSubmitted || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <Briefcase size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Contracts Received</span>
              <span className="stat-value">{stats?.purchaseOrdersReceived || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.08)' }}>
              <Activity size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Pending Production</span>
              <span className="stat-value">{stats?.pendingProductionOrders || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
              <UploadCloud size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Pending MTC Uploads</span>
              <span className="stat-value">{stats?.pendingMtcGeneration || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Pending Supplier Review</span>
              <span className="stat-value">{stats?.pendingSupplierReviews || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <FileCheck size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Approved MTCs</span>
              <span className="stat-value">{stats?.approvedCertificates || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
              <FileX size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Rejected MTCs</span>
              <span className="stat-value">{stats?.rejectedCertificates || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Ready for Dispatch</span>
              <span className="stat-value">{stats?.readyForDispatch || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.08)' }}>
              <Truck size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Completed Deliveries</span>
              <span className="stat-value">{stats?.completedDeliveries || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Pending Payments</span>
              <span className="stat-value">{stats?.pendingPayments || 0}</span>
            </div>
          </div>

          <div className="stat-card" style={{ gridColumn: 'span 2' }}>
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <DollarSign size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Paid Amount</span>
              <span className="stat-value">₹{(stats?.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="stat-card" style={{ gridColumn: 'span 2' }}>
            <div className="stat-icon-wrapper" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
              <DollarSign size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Outstanding Amount</span>
              <span className="stat-value">₹{(stats?.outstandingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Charts & Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* Production Output Efficiency */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} style={{ color: '#8b5cf6' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>Production Completion Rate</h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                Monthly Efficiency
              </span>
            </div>

            {/* Production SVG */}
            <div style={{ height: '220px', width: '100%', marginTop: '0.5rem' }}>
              <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="glowPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />

                <path d="M 0 150 C 70 170, 140 120, 210 110 C 280 80, 350 140, 420 50 C 470 40, 480 30, 500 30 L 500 200 L 0 200 Z" fill="url(#glowPurple)" />
                <path d="M 0 150 C 70 170, 140 120, 210 110 C 280 80, 350 140, 420 50 C 470 40, 480 30, 500 30" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />

                <circle cx="210" cy="110" r="4" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
                <circle cx="420" cy="50" r="4" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
                <circle cx="500" cy="30" r="5" fill="#a855f7" />
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>Setup Run</span>
              <span>Material Prep</span>
              <span>Casting & Rolling</span>
              <span>Visual QA Check</span>
              <span>Completed & Mapped</span>
            </div>
          </div>

          {/* Quick Production Links */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>Production Links</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Access plant floor logistics:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
              <Link to="/production" className="btn btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                <span>Open Production Queue</span>
                <Activity size={14} />
              </Link>

              <Link to="/mtc-upload" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                <span>Upload & AI OCR MTC</span>
                <UploadCloud size={14} />
              </Link>

              <Link to="/dispatches" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                <span>Dispatch Shipments</span>
                <Truck size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. ADMIN DASHBOARD RENDERING ---
  if (role === 'ADMIN') {
    return (
      <div className="page-container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Global Administration Dashboard</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            DimeTime Control Center • Core registries audit, AI validation precision tracking, and network activity monitor
          </p>
        </div>

        {/* Control Tower 17 KPI Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          {/* Card 1: Total RFQs */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
              <FileText size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Total RFQs</span>
              <span className="stat-value">{stats?.totalRfqs || 0}</span>
            </div>
          </div>

          {/* Card 2: Total Quotations */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
              <Zap size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Total Quotations</span>
              <span className="stat-value">{stats?.totalQuotations || 0}</span>
            </div>
          </div>

          {/* Card 3: Total Purchase Orders */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <Briefcase size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Total Purchase Orders</span>
              <span className="stat-value">{stats?.totalPurchaseOrders || 0}</span>
            </div>
          </div>

          {/* Card 4: Active Production Orders */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.08)' }}>
              <Activity size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Active Production Orders</span>
              <span className="stat-value">{stats?.activeProductionOrders || 0}</span>
            </div>
          </div>

          {/* Card 5: Pending MTC Reviews */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Pending MTC Reviews</span>
              <span className="stat-value">{stats?.pendingMtcReviews || 0}</span>
            </div>
          </div>

          {/* Card 6: Approved MTC Certificates */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <ShieldCheck size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Approved MTC Certificates</span>
              <span className="stat-value">{stats?.approvedMtcCertificates || 0}</span>
            </div>
          </div>

          {/* Card 7: Rejected MTC Certificates */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
              <FileX size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Rejected MTC Certificates</span>
              <span className="stat-value">{stats?.rejectedMtcCertificates || 0}</span>
            </div>
          </div>

          {/* Card 8: Materials In Transit */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.08)' }}>
              <Truck size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Materials In Transit</span>
              <span className="stat-value">{stats?.materialsInTransit || 0}</span>
            </div>
          </div>

          {/* Card 9: Delivered Orders */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Delivered Orders</span>
              <span className="stat-value">{stats?.deliveredOrders || 0}</span>
            </div>
          </div>

          {/* Card 10: Pending GRN */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Pending GRN</span>
              <span className="stat-value">{stats?.pendingGrn || 0}</span>
            </div>
          </div>

          {/* Card 11: Generated GRN */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <ClipboardCheck size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Generated GRN</span>
              <span className="stat-value">{stats?.generatedGrn || 0}</span>
            </div>
          </div>

          {/* Card 12: Reconciled Orders */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.08)' }}>
              <ShieldCheck size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Reconciled Orders</span>
              <span className="stat-value">{stats?.reconciledOrders || 0}</span>
            </div>
          </div>

          {/* Card 13: Completed Orders */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Completed Orders</span>
              <span className="stat-value">{stats?.completedOrders || 0}</span>
            </div>
          </div>

          {/* Card 14: Total Suppliers */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
              <Users size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Total Suppliers</span>
              <span className="stat-value">{stats?.totalSuppliers || 0}</span>
            </div>
          </div>

          {/* Card 15: Total Manufacturers */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.08)' }}>
              <Building size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Total Manufacturers</span>
              <span className="stat-value">{stats?.totalManufacturers || 0}</span>
            </div>
          </div>

          {/* Card 16: Total Users */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
              <Users size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Total Users</span>
              <span className="stat-value">{stats?.totalUsers || 0}</span>
            </div>
          </div>

          {/* Card 17: Total Audit Logs */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.08)' }}>
              <Activity size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Total Audit Logs</span>
              <span className="stat-value">{stats?.totalAuditLogs || 0}</span>
            </div>
          </div>

          {/* Card 18: Total Payments */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
              <DollarSign size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Total Payments</span>
              <span className="stat-value">{stats?.totalPayments || 0}</span>
            </div>
          </div>

          {/* Card 19: Successful Payments */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Successful Payments</span>
              <span className="stat-value">{stats?.successfulPayments || 0}</span>
            </div>
          </div>

          {/* Card 20: Failed Payments */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
              <FileX size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Failed Payments</span>
              <span className="stat-value">{stats?.failedPayments || 0}</span>
            </div>
          </div>

          {/* Card 21: Pending COD Payments */}
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">Pending COD Payments</span>
              <span className="stat-value">{stats?.pendingCodPayments || 0}</span>
            </div>
          </div>
        </div>

        {/* Audit timeline & admin links */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* Recent Operations Timeline */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>System Audit Stream</h3>
              </div>
              <Link to="/audit-trail" style={{ color: '#22c55e', textDecoration: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <span>View All</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              {logs.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', fontSize: '0.85rem' }}>
                  No system logs available.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: log.activity.includes('GRN') ? '#22c55e' : log.activity.includes('Verification') ? '#f59e0b' : '#3b82f6',
                        marginTop: '0.35rem'
                      }} />
                      <div style={{ flex: 1, width: '1px', backgroundColor: '#334155', margin: '0.25rem 0' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ color: '#f8fafc', fontWeight: 500 }}>{log.activity}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {formatTime(log.timestamp)} • User: {log.user}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>Admin Actions</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Manage users and global audits:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
              <Link to="/admin-panel" className="btn btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                <span>User Account Administration</span>
                <Users size={14} />
              </Link>
              <Link to="/audit-trail" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                <span>Review Complete Audit Logs</span>
                <Activity size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
