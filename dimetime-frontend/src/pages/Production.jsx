import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ClipboardCheck, 
  Play, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Activity, 
  AlertCircle 
} from 'lucide-react';

export default function Production({ user }) {
  const [pos, setPos] = useState([]);
  const [mtcs, setMtcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const username = user?.username || 'manufacturer';

  useEffect(() => {
    fetchProductionOrders();
    fetchMtcs();
  }, []);

  const fetchMtcs = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/mtc-documents');
      if (response.data) {
        setMtcs(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getLatestMtcStatusForPo = (poNumber) => {
    const poMtcs = mtcs.filter(m => m.poNumber === poNumber);
    if (poMtcs.length === 0) return null;
    poMtcs.sort((a, b) => b.id - a.id);
    return poMtcs[0].status;
  };

  const fetchProductionOrders = async () => {
    setLoading(true);
    try {
      // Fetch POs assigned to this manufacturer
      const response = await axios.get(`http://localhost:8080/api/purchase-orders/manufacturer/${username}`);
      if (response.data) {
        // Filter only those that are in production phases
        setPos(response.data.filter(po => 
          ['PENDING', 'PRODUCTION_START', 'PRODUCTION_STARTED', 'REJECTED', 'MTC_UPLOADED', 'MTC_CERTIFICATE_GENERATED', 'SUPPLIER_REVIEW', 'APPROVED'].includes(po.status)
        ));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load production orders.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (poNumber, nextStatus) => {
    setError('');
    setSuccess('');
    try {
      const response = await axios.put(
        `http://localhost:8080/api/purchase-orders/${poNumber}/status?status=${nextStatus}&operator=${username}`
      );
      if (response.status === 200) {
        setSuccess(`Purchase Order ${poNumber} updated to ${nextStatus.replace('_', ' ')}!`);
        fetchProductionOrders();
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to update status for PO ${poNumber}.`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>Pending Acceptance</span>;
      case 'PRODUCTION_START':
      case 'PRODUCTION_STARTED':
        return <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', width: 'fit-content' }}>
          <Play size={10} />
          <span>In Production</span>
        </span>;
      case 'REJECTED':
        return <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>MTC Rejected</span>;
      case 'MTC_UPLOADED':
        return <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)' }}>MTC Uploaded</span>;
      case 'MTC_CERTIFICATE_GENERATED':
        return <span className="badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.25)' }}>Certificate Generated</span>;
      case 'SUPPLIER_REVIEW':
        return <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>Awaiting Supplier Review</span>;
      case 'APPROVED':
        return <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', width: 'fit-content' }}>
          <CheckCircle2 size={10} />
          <span>MTC Approved</span>
        </span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Production Queue</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Manage production scheduling and milestones for assigned supplier contracts.
        </p>
      </div>

      {error && (
        <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)', padding: '0.75rem 1rem', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {success}
        </div>
      )}

      {/* Production KPIs */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Awaiting Acceptance</span>
            <span className="stat-value">{pos.filter(po => po.status === 'PENDING').length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
            <Activity size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Currently Producing</span>
            <span className="stat-value">{pos.filter(po => po.status === 'PRODUCTION_START' || po.status === 'PRODUCTION_STARTED' || po.status === 'REJECTED').length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Completed (Un-Dispatched)</span>
            <span className="stat-value">{pos.filter(po => po.status === 'COMPLETED_PRODUCTION').length}</span>
          </div>
        </div>
      </div>

      {/* Production List */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading Production Queue...</div>
        ) : pos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <ClipboardCheck size={40} style={{ color: '#334155', marginBottom: '1rem' }} />
            <h3>No Production Orders</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              Your production lines are currently clear. Accepted orders will show up here.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>PO Reference</th>
                  <th>Supplier Client</th>
                  <th>Material Specification</th>
                  <th>Grade</th>
                  <th>Required Dimensions</th>
                  <th>Ordered Qty</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Production Controls</th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po) => (
                  <tr key={po.id}>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{po.poNumber}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={14} style={{ color: '#94a3b8' }} />
                        <span>{po.supplier}</span>
                      </span>
                    </td>
                    <td>{po.material}</td>
                    <td><span style={{ color: '#3b82f6', fontWeight: 500 }}>{po.grade}</span></td>
                    <td>{po.dimension}</td>
                    <td style={{ fontWeight: 500 }}>{po.quantity}</td>
                    <td>{getStatusBadge(po.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {po.status === 'PENDING' && (
                        <button
                          onClick={() => updateOrderStatus(po.poNumber, 'PRODUCTION_STARTED')}
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.35rem' }}
                        >
                          <Play size={12} />
                          <span>Accept & Produce</span>
                        </button>
                      )}
                      {(po.status === 'PRODUCTION_STARTED' || po.status === 'PRODUCTION_START' || po.status === 'REJECTED') && (
                        <div style={{ color: '#e2e8f0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end', fontWeight: 500 }}>
                          {getLatestMtcStatusForPo(po.poNumber) === 'REJECTED' ? (
                            <>
                              <AlertCircle size={12} style={{ color: '#ef4444' }} />
                              <span style={{ color: '#ef4444' }}>MTC Rejected. Re-upload MTC.</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} style={{ color: '#f59e0b' }} />
                              <span>Awaiting MTC Upload</span>
                            </>
                          )}
                        </div>
                      )}
                      {po.status === 'MTC_UPLOADED' && (
                        <div style={{ color: '#3b82f6', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end', fontWeight: 500 }}>
                          <Play size={12} className="spinning" />
                          <span>Processing OCR...</span>
                        </div>
                      )}
                      {po.status === 'MTC_CERTIFICATE_GENERATED' && (
                        <div style={{ color: '#a855f7', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end', fontWeight: 500 }}>
                          <CheckCircle2 size={12} />
                          <span>Certificate Generated</span>
                        </div>
                      )}
                      {po.status === 'SUPPLIER_REVIEW' && (
                        <div style={{ color: '#f59e0b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end', fontWeight: 500 }}>
                          <Clock size={12} />
                          <span>Under Supplier Review</span>
                        </div>
                      )}
                      {po.status === 'APPROVED' && (
                        <div style={{ color: '#22c55e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end', fontWeight: 500 }}>
                          <CheckCircle2 size={12} />
                          <span>Approved (Dispatch Board)</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
