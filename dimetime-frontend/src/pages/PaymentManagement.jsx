import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Search, 
  Filter, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Layers,
  UserCheck,
  CheckSquare
} from 'lucide-react';

export default function PaymentManagement({ user }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const username = user?.username || 'user';
  const role = user?.role || 'SUPPLIER';

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8080/api/payments');
      if (res.data) {
        setPayments(res.data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments database. Verify backend service.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCOD = async (paymentNumber, type) => {
    const actionLabel = type === 'RECEIVED' ? 'Mark Received' : 'Mark Completed';
    if (!window.confirm(`Are you sure you want to perform "${actionLabel}" for COD payment ${paymentNumber}?`)) {
      return;
    }
    try {
      const payload = {
        paymentNumber: paymentNumber,
        transactionReference: `COD_${type.toUpperCase()}`,
        operator: username
      };

      const res = await axios.post('http://localhost:8080/api/payments/complete', payload);
      setSuccess(`COD Payment ${paymentNumber} updated successfully via ${actionLabel}. Status is COMPLETED.`);
      fetchPayments();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error completing COD payment:', err);
      setError(err.response?.data?.message || 'Failed to update COD payment.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pending';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAYMENT_PENDING':
        return <span className="badge badge-warning">Pending</span>;
      case 'PAYMENT_IN_PROGRESS':
        return <span className="badge badge-info">In Progress</span>;
      case 'PAYMENT_COMPLETED':
        return <span className="badge badge-success">Completed</span>;
      case 'PAYMENT_FAILED':
        return <span className="badge badge-danger">Failed</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  // Filter payments list
  const filteredPayments = payments.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      p.paymentNumber.toLowerCase().includes(query) ||
      p.invoiceNumber.toLowerCase().includes(query) ||
      p.poNumber.toLowerCase().includes(query) ||
      p.grnNumber.toLowerCase().includes(query) ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'ALL' ? true : p.paymentStatus === statusFilter;
    const matchesMethod = methodFilter === 'ALL' ? true : p.paymentMethod === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Calculate payment KPI stats
  const totalCompletedVal = payments
    .filter(p => p.paymentStatus === 'PAYMENT_COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingCodCount = payments
    .filter(p => p.paymentMethod === 'COD' && p.paymentStatus === 'PAYMENT_PENDING')
    .length;

  const successfulCount = payments.filter(p => p.paymentStatus === 'PAYMENT_COMPLETED').length;
  const failedCount = payments.filter(p => p.paymentStatus === 'PAYMENT_FAILED').length;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Payment Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Monitor financial transactions, clear Cash-on-Delivery collections, and track SCM order closures.
          </p>
        </div>
        <div>
          <button className="btn btn-secondary" onClick={fetchPayments}>
            <Clock size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Alert status banner */}
      {success && (
        <div style={{ 
          color: '#22c55e', 
          backgroundColor: 'rgba(34, 197, 94, 0.08)', 
          padding: '0.75rem 1rem', 
          border: '1px solid rgba(34, 197, 94, 0.2)', 
          borderRadius: '8px', 
          fontSize: '0.85rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {error && (
        <div style={{ 
          color: '#ef4444', 
          backgroundColor: 'rgba(239, 68, 68, 0.08)', 
          padding: '0.75rem 1rem', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: '8px', 
          fontSize: '0.85rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Dashboard KPI cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Successful Collections</span>
            <span className="stat-value">₹{totalCompletedVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Transactions Successful</span>
            <span className="stat-value">{successfulCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Pending COD Payments</span>
            <span className="stat-value">{pendingCodCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Failed Attempts</span>
            <span className="stat-value">{failedCount}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="premium-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by Payment #, Invoice #, PO #, Ref..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Filter size={16} style={{ color: '#64748b' }} />
          
          <select 
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px', padding: '0.5rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PAYMENT_PENDING">Pending</option>
            <option value="PAYMENT_IN_PROGRESS">In Progress</option>
            <option value="PAYMENT_COMPLETED">Completed</option>
            <option value="PAYMENT_FAILED">Failed</option>
          </select>

          <select 
            className="form-input"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{ width: '140px', padding: '0.5rem' }}
          >
            <option value="ALL">All Methods</option>
            <option value="COD">Cash On Delivery</option>
            <option value="UPI">UPI/Razorpay</option>
          </select>
        </div>
      </div>

      {/* Payments Registry table */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredPayments.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
            <CreditCard size={48} style={{ color: '#334155', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>No Payments Registered</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              We couldn't find any financial transactions matching your filter settings.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Payment Number</th>
                  <th>Invoice Number</th>
                  <th>PO Number</th>
                  <th>GRN Number</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Transaction Reference</th>
                  <th>Payment Date</th>
                  <th>Date Created</th>
                  {role === 'ADMIN' && <th style={{ textAlign: 'right' }}>Admin Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: '#10b981' }}>{p.paymentNumber}</td>
                    <td>{p.invoiceNumber}</td>
                    <td>{p.poNumber}</td>
                    <td>{p.grnNumber}</td>
                    <td style={{ fontWeight: 600 }}>₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 600, 
                        color: p.paymentMethod === 'UPI' ? '#3b82f6' : '#f59e0b'
                      }}>
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td>{getStatusBadge(p.paymentStatus)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.transactionReference ? p.transactionReference : <span style={{ color: '#64748b' }}>N/A</span>}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{formatDate(p.paymentDate)}</td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{formatDate(p.createdAt)}</td>
                    {role === 'ADMIN' && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          {p.paymentMethod === 'COD' && p.paymentStatus === 'PAYMENT_PENDING' ? (
                            <>
                              <button 
                                onClick={() => handleCompleteCOD(p.paymentNumber, 'RECEIVED')} 
                                style={{
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                  color: '#f59e0b',
                                  border: '1px solid rgba(245,158,11,0.2)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <UserCheck size={12} /> Mark Received
                              </button>
                              <button 
                                onClick={() => handleCompleteCOD(p.paymentNumber, 'COMPLETED')} 
                                style={{
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                  color: '#22c55e',
                                  border: '1px solid rgba(34,197,94,0.2)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <CheckSquare size={12} /> Mark Completed
                              </button>
                            </>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No Action</span>
                          )}
                        </div>
                      </td>
                    )}
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
