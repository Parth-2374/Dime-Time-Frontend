import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Search, 
  Filter, 
  Clock, 
  ArrowRight,
  TrendingUp,
  DollarSign,
  Activity
} from 'lucide-react';

export default function InvoiceManagement({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Simulated Razorpay Modal states
  const [showRazorpaySim, setShowRazorpaySim] = useState(false);
  const [simPaymentNumber, setSimPaymentNumber] = useState('');
  const [simAmount, setSimAmount] = useState(0);

  const username = user?.username || 'user';
  const role = user?.role || 'SUPPLIER';

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://dime-time-backend.onrender.com/api/invoices');
      if (res.data) {
        setInvoices(res.data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (id) => {
    window.open(`https://dime-time-backend.onrender.com/api/invoices/${id}/pdf`, '_blank');
  };

  const handleDelete = async (id, invoiceNumber) => {
    if (!window.confirm(`Are you sure you want to delete Invoice ${invoiceNumber}?`)) {
      return;
    }
    try {
      await axios.delete(`https://dime-time-backend.onrender.com/api/invoices/${id}?operator=${username}`);
      setSuccess(`Invoice ${invoiceNumber} deleted successfully.`);
      fetchInvoices();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Initiate Payment
  const handleInitiatePayment = async () => {
    if (!paymentModalInvoice) return;
    setPaymentLoading(true);
    setError('');

    try {
      const payload = {
        invoiceNumber: paymentModalInvoice.invoiceNumber,
        paymentMethod: paymentMethod,
        amount: paymentModalInvoice.totalAmount,
        operator: username
      };

      const res = await axios.post('https://dime-time-backend.onrender.com/api/payments/initiate', payload);
      const paymentData = res.data;

      if (paymentMethod === 'COD') {
        setSuccess(`COD Payment request created for ${paymentModalInvoice.invoiceNumber}. Status is PENDING.`);
        setPaymentModalInvoice(null);
        fetchInvoices();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        // UPI Payment
        setSimPaymentNumber(paymentData.paymentNumber);
        setSimAmount(paymentModalInvoice.totalAmount);
        setPaymentModalInvoice(null);
        setShowRazorpaySim(true);
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError(err.response?.data?.message || 'Failed to initiate payment.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Complete UPI simulated payment
  const handleSimulatePaymentSuccess = async () => {
    setShowRazorpaySim(false);
    setPaymentLoading(true);
    try {
      const txRef = 'pay_test_' + Math.random().toString(36).substring(2, 11).toUpperCase();
      await axios.post('https://dime-time-backend.onrender.com/api/payments/complete', {
        paymentNumber: simPaymentNumber,
        transactionReference: txRef,
        operator: username
      });
      setSuccess(`UPI Payment completed successfully! Tx Ref: ${txRef}`);
      fetchInvoices();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error completing payment:', err);
      setError('Payment success simulation failed to record.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSimulatePaymentFailure = async () => {
    setShowRazorpaySim(false);
    setPaymentLoading(true);
    try {
      await axios.post('https://dime-time-backend.onrender.com/api/payments/fail', {
        paymentNumber: simPaymentNumber,
        operator: username
      });
      setError('UPI Payment failed or cancelled.');
      fetchInvoices();
      setTimeout(() => setError(''), 5000);
    } catch (err) {
      console.error('Error failing payment:', err);
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
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
      case 'INVOICE_GENERATED':
        return <span className="badge badge-info">Generated</span>;
      case 'PAYMENT_PENDING':
        return <span className="badge badge-warning">Pending Payment</span>;
      case 'PAYMENT_COMPLETED':
        return <span className="badge badge-success">Paid</span>;
      case 'PAYMENT_FAILED':
        return <span className="badge badge-danger">Failed</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.poNumber.toLowerCase().includes(query) ||
      inv.grnNumber.toLowerCase().includes(query) ||
      inv.supplier.toLowerCase().includes(query) ||
      inv.manufacturer.toLowerCase().includes(query);

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && inv.status === statusFilter;
  });

  // Calculate Invoice KPI stats
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const outstandingAmount = invoices
    .filter(inv => inv.status !== 'PAYMENT_COMPLETED')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const completedAmount = invoices
    .filter(inv => inv.status === 'PAYMENT_COMPLETED')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="page-container">
      {/* Top Banner */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Invoice Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Review automatically generated SCM invoices, verify order amounts, and initiate secure payments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={fetchInvoices}>
            <Clock size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Mini KPIs */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
            <FileText size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Total Invoices</span>
            <span className="stat-value">{invoices.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Total Value</span>
            <span className="stat-value">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Outstanding</span>
            <span className="stat-value">₹{outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="premium-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by Invoice #, PO #, GRN #, Supplier..." 
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
            style={{ width: '180px', padding: '0.5rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="INVOICE_GENERATED">Generated</option>
            <option value="PAYMENT_PENDING">Pending Payment</option>
            <option value="PAYMENT_COMPLETED">Paid</option>
            <option value="PAYMENT_FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredInvoices.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={48} style={{ color: '#334155', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>No Invoices Found</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              We couldn't find any invoice matching your parameters.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>PO Number</th>
                  <th>GRN Number</th>
                  <th>Supplier</th>
                  <th>Manufacturer</th>
                  <th>Amount</th>
                  <th>GST</th>
                  <th>Grand Total</th>
                  <th>Invoice Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, color: '#3b82f6' }}>{inv.invoiceNumber}</td>
                    <td>{inv.poNumber}</td>
                    <td>{inv.grnNumber}</td>
                    <td style={{ fontSize: '0.85rem' }}>{inv.supplier}</td>
                    <td style={{ fontSize: '0.85rem' }}>{inv.manufacturer}</td>
                    <td>₹{inv.unitPrice * (parseFloat(inv.quantity) || 1)}</td>
                    <td>₹{inv.gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: 600 }}>₹{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{formatDate(inv.invoiceDate)}</td>
                    <td>{getStatusBadge(inv.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setSelectedInvoice(inv)} 
                          style={{
                            padding: '0.35rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer'
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleDownloadPdf(inv.id)} 
                          style={{
                            padding: '0.35rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59,130,246,0.15)',
                            cursor: 'pointer'
                          }}
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </button>
                        {role === 'MANUFACTURER' && (inv.status === 'INVOICE_GENERATED' || inv.status === 'PAYMENT_FAILED') && (
                          <button 
                            onClick={() => {
                              setPaymentModalInvoice(inv);
                              setPaymentMethod('COD');
                            }}
                            style={{
                              padding: '0.35rem 0.65rem',
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
                            <CreditCard size={12} /> Pay
                          </button>
                        )}
                        {(role === 'ADMIN' || role === 'SUPPLIER') && (
                          <button 
                            onClick={() => handleDelete(inv.id, inv.invoiceNumber)} 
                            style={{
                              padding: '0.35rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              border: '1px solid rgba(239,68,68,0.15)',
                              cursor: 'pointer'
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detailed Modal */}
      {selectedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            width: '100%',
            maxWidth: '700px',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            border: '1px solid #334155'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'between',
              width: '100%',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: '#22c55e' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>TAX INVOICE DETAIL</h3>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Invoice Number</span>
                  <p style={{ fontWeight: 600, color: '#3b82f6', fontSize: '1.1rem' }}>{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Status</span>
                  <div style={{ marginTop: '0.2rem' }}>{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>PO Number</span>
                  <p style={{ fontWeight: 500 }}>{selectedInvoice.poNumber}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>GRN Number</span>
                  <p style={{ fontWeight: 500 }}>{selectedInvoice.grnNumber}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Invoice Date</span>
                  <p style={{ fontSize: '0.9rem' }}>{formatDate(selectedInvoice.invoiceDate)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Currency</span>
                  <p style={{ fontSize: '0.9rem' }}>INR (₹)</p>
                </div>
              </div>

              <hr style={{ borderColor: '#334155' }} />

              {/* Parties */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '0.85rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Supplier Details</span>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>{selectedInvoice.supplier}</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.1rem' }}>Registered Supplier Partner</p>
                </div>
                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '0.85rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Manufacturer Details</span>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>{selectedInvoice.manufacturer}</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.1rem' }}>SCM Manufacturing Hub</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Line Items</span>
                <div className="table-container" style={{ marginTop: '0.4rem', border: '1px solid #334155' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th style={{ padding: '0.6rem 0.85rem', fontSize: '0.75rem' }}>Material</th>
                        <th style={{ padding: '0.6rem 0.85rem', fontSize: '0.75rem' }}>Grade</th>
                        <th style={{ padding: '0.6rem 0.85rem', fontSize: '0.75rem' }}>Qty</th>
                        <th style={{ padding: '0.6rem 0.85rem', fontSize: '0.75rem' }}>Rate</th>
                        <th style={{ padding: '0.6rem 0.85rem', fontSize: '0.75rem' }}>GST</th>
                        <th style={{ padding: '0.6rem 0.85rem', fontSize: '0.75rem' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}>{selectedInvoice.materialName}</td>
                        <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}>{selectedInvoice.materialGrade}</td>
                        <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}>{selectedInvoice.quantity}</td>
                        <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}>₹{selectedInvoice.unitPrice}</td>
                        <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}>₹{selectedInvoice.gst.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem', fontWeight: 600 }}>₹{selectedInvoice.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* QR Code and verification */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.05)', border: '1px dashed rgba(34, 197, 94, 0.2)', padding: '0.85rem', borderRadius: '8px' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&color=22c55e&bgcolor=1e293b&data=${encodeURIComponent(
                    `Invoice:${selectedInvoice.invoiceNumber}|PO:${selectedInvoice.poNumber}|Amount:INR${selectedInvoice.totalAmount}|Status:${selectedInvoice.status}`
                  )}`} 
                  alt="QR verification" 
                  style={{ width: '80px', height: '80px', borderRadius: '4px' }}
                />
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#22c55e', display: 'block' }}>QR Secure Verification Code</span>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', lineHeight: '1.25' }}>
                    Scan code with any mobile scanner to verify digital signatures, ledger metadata matching, and SCM audit authenticity.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { handleDownloadPdf(selectedInvoice.id); setSelectedInvoice(null); }}>
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proceed Payment Modal */}
      {paymentModalInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            width: '100%',
            maxWidth: '500px',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #334155'
          }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Select Payment Method</h3>
              <button onClick={() => setPaymentModalInvoice(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem', backgroundColor: 'rgba(15, 23, 42, 0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Invoice:</span>
                  <span style={{ fontWeight: 600, color: '#3b82f6' }}>{paymentModalInvoice.invoiceNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>PO Link:</span>
                  <span>{paymentModalInvoice.poNumber}</span>
                </div>
                <hr style={{ borderColor: '#334155', margin: '0.5rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>Grand Total:</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#22c55e' }}>₹{paymentModalInvoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* COD option */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: `1px solid ${paymentMethod === 'COD' ? '#22c55e' : '#334155'}`,
                  backgroundColor: paymentMethod === 'COD' ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="COD" 
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    style={{ marginTop: '3px', accentColor: '#22c55e' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block', color: paymentMethod === 'COD' ? '#22c55e' : '#f8fafc' }}>Cash On Delivery (COD)</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem', display: 'block' }}>
                      Generates a pending COD payment record. Hand over physical cash upon material arrival. Admin completes flow.
                    </span>
                  </div>
                </label>

                {/* UPI option */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: `1px solid ${paymentMethod === 'UPI' ? '#22c55e' : '#334155'}`,
                  backgroundColor: paymentMethod === 'UPI' ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="UPI" 
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    style={{ marginTop: '3px', accentColor: '#22c55e' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block', color: paymentMethod === 'UPI' ? '#22c55e' : '#f8fafc' }}>UPI Payment (Razorpay Sandbox)</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem', display: 'block' }}>
                      Process payment immediately using simulated Razorpay secure gateway checkout interface.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setPaymentModalInvoice(null)} disabled={paymentLoading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleInitiatePayment} disabled={paymentLoading}>
                {paymentLoading ? 'Processing...' : paymentMethod === 'COD' ? 'Select COD' : 'Proceed to Pay'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Razorpay Modal */}
      {showRazorpaySim && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.9)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            color: '#1e293b',
            width: '100%',
            maxWidth: '400px',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          }}>
            {/* Header */}
            <div style={{
              backgroundColor: '#0052e4',
              color: '#ffffff',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Razorpay Sandbox</span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>DimeTime SCM Portal</h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', display: 'block', opacity: 0.8 }}>Amount</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>₹{simAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Test alert banner */}
            <div style={{
              backgroundColor: '#fef3c7',
              color: '#92400e',
              padding: '0.75rem 1rem',
              fontSize: '0.75rem',
              borderBottom: '1px solid #fde68a',
              lineHeight: 1.4
            }}>
              <strong>TEST MODE ONLY.</strong> Do not enter real credit card or bank details. All transactions are simulated for verification.
            </div>

            {/* Methods */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Simulate Transaction Status</span>
                <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
                  Payment Ref: <strong>{simPaymentNumber}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  onClick={handleSimulatePaymentSuccess}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s',
                    width: '100%',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  Simulate SUCCESSFUL Payment
                </button>

                <button 
                  onClick={handleSimulatePaymentFailure}
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s',
                    width: '100%',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                >
                  Simulate FAILED / CANCELLED Payment
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              fontSize: '0.75rem',
              color: '#64748b'
            }}>
              <span>Powered by Razorpay</span>
              <button 
                onClick={handleSimulatePaymentFailure}
                style={{ background: 'none', border: 'none', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
