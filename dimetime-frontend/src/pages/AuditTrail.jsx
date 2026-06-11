import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Activity,
  User,
  Clock,
  ShieldCheck,
  Globe,
  Layers,
  FileDown,
  X,
  Search
} from 'lucide-react';

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://dime-time-backend.onrender.com/api/audit-logs');
      if (response.data) {
        setLogs(response.data);
      }
    } catch (err) {
      console.error('Error loading audit trail:', err);
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.user,
      log.role || 'ADMIN',
      log.activity,
      log.entityType || 'SCM_ENGINE',
      log.ipAddress || '127.0.0.1'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SCM_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.activity?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        log.user?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchModule = filterModule ? (log.entityType || 'SCM_ENGINE') === filterModule : true;
    return matchSearch && matchModule;
  });

  const getModuleBadgeColor = (module) => {
    const mod = String(module || '').toUpperCase();
    if (mod.includes('AUTH') || mod.includes('USER')) return { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
    if (mod.includes('PO') || mod.includes('PURCHASE')) return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
    if (mod.includes('MTC')) return { backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' };
    if (mod.includes('GRN')) return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    return { backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' };
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
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Mapping Timeline Operations...</span>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>System Audit Trail</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Immutably logged chronological verification pipeline history and user tracking operations.
          </p>
        </div>
        <button 
          onClick={exportToCsv} 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileDown size={18} />
          <span>Export Logs</span>
        </button>
      </div>

      {error && (
        <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="premium-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Search Actions / Users</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Filter by keyword..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2rem', height: '38px', width: '100%' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '12px', color: '#64748b' }} />
          </div>
        </div>

        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Module</label>
          <select 
            className="form-input" 
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            style={{ height: '38px' }}
          >
            <option value="">All Modules</option>
            <option value="SCM_ENGINE">SCM Engine</option>
            <option value="PO_MODULE">PO Module</option>
            <option value="OCR_SCANNER">OCR Scanner</option>
            <option value="MTC_VERIFIER">MTC Verifier</option>
            <option value="SECURITY">Security</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
            <Activity size={44} style={{ color: '#334155', marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>No SCM Audit Records Found</h3>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>IP Address</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={12} style={{ color: '#64748b' }} />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{log.user}</td>
                    <td><span className="badge" style={{ backgroundColor: '#1e293b', color: '#3b82f6' }}>{log.role || 'ADMIN'}</span></td>
                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.activity}</td>
                    <td>
                      <span className="badge" style={getModuleBadgeColor(log.entityType || 'SCM_ENGINE')}>
                        {log.entityType || 'SCM_ENGINE'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        <Globe size={12} style={{ color: '#64748b' }} />
                        <span>{log.ipAddress || '127.0.0.1'}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', width: '100px', minWidth: '100px' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                          title="View Incident details"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1050, padding: '2rem'
        }}>
          <div className="premium-card" style={{
            width: '100%', maxWidth: '500px',
            backgroundColor: '#111827', border: '1px solid #334155',
            padding: '2rem', borderRadius: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 600 }}>Audit Incident Log Sheet</h3>
              <button onClick={() => setSelectedLog(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Close</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              <div>
                <strong>Incident ID:</strong>
                <span style={{ color: '#f8fafc', display: 'block', fontFamily: 'monospace', marginTop: '0.2rem' }}>#AUD-LOG-{selectedLog.id}</span>
              </div>
              <div>
                <strong>Action / Incident Activity:</strong>
                <span style={{ color: '#f8fafc', display: 'block', marginTop: '0.2rem', lineHeight: '1.4' }}>{selectedLog.activity}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <strong>Authorized User:</strong>
                  <span style={{ color: '#f8fafc', display: 'block', marginTop: '0.2rem' }}>{selectedLog.user}</span>
                </div>
                <div>
                  <strong>Security Role:</strong>
                  <span style={{ color: '#3b82f6', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>{selectedLog.role || 'ADMIN'}</span>
                </div>
                <div>
                  <strong>Audit Module:</strong>
                  <span style={{ color: '#f8fafc', display: 'block', marginTop: '0.2rem' }}>{selectedLog.entityType || 'SCM_ENGINE'}</span>
                </div>
                <div>
                  <strong>Terminal IP Address:</strong>
                  <span style={{ color: '#f8fafc', display: 'block', marginTop: '0.2rem', fontFamily: 'monospace' }}>{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>
              <div>
                <strong>Timestamp:</strong>
                <span style={{ color: '#f8fafc', display: 'block', marginTop: '0.2rem' }}>{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
