import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Truck, 
  Send, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  AlertCircle, 
  ExternalLink,
  Search
} from 'lucide-react';

export default function Dispatches({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dispatch Form State
  const [activePoForDispatch, setActivePoForDispatch] = useState(null);
  const [dispatchData, setDispatchData] = useState({
    carrier: 'FedEx Freight',
    trackingNumber: ''
  });

  const role = user?.role || 'SUPPLIER';
  const username = user?.username || '';
  const companyName = user?.companyName || '';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let response;
      if (role === 'SUPPLIER') {
        response = await axios.get(`https://dime-time-backend.onrender.com/api/purchase-orders/supplier/${companyName}`);
      } else {
        response = await axios.get(`https://dime-time-backend.onrender.com/api/purchase-orders/manufacturer/${username}`);
      }

      if (response.data) {
        if (role === 'SUPPLIER') {
          // Suppliers track items that are in transit (DISPATCHED) or already DELIVERED
          setOrders(response.data.filter(po => ['APPROVED_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'RECONCILED', 'COMPLETED', 'GRN_GENERATED'].includes(po.status)));
        } else {
          // Manufacturers manage items from approved for dispatch through completed deliveries
          setOrders(response.data.filter(po => [
            'PRODUCTION_START', 'PRODUCTION_STARTED', 'REJECTED', 'MTC_UPLOADED', 'MTC_CERTIFICATE_GENERATED', 'SUPPLIER_REVIEW', 'APPROVED_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'RECONCILED', 'COMPLETED', 'GRN_GENERATED'
          ].includes(po.status)));
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dispatch records.');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchChange = (e) => {
    setDispatchData({
      ...dispatchData,
      [e.target.name]: e.target.value
    });
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!dispatchData.trackingNumber.trim()) {
      setError('Please input a valid tracking number.');
      return;
    }

    try {
      const response = await axios.put(
        `https://dime-time-backend.onrender.com/api/purchase-orders/${activePoForDispatch.poNumber}/dispatch?carrier=${dispatchData.carrier}&trackingNumber=${dispatchData.trackingNumber}&operator=${username}`
      );

      if (response.status === 200) {
        setSuccess(`Material for ${activePoForDispatch.poNumber} successfully dispatched via ${dispatchData.carrier}!`);
        setActivePoForDispatch(null);
        setDispatchData({ carrier: 'FedEx Freight', trackingNumber: '' });
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to log material dispatch.');
    }
  };

  const confirmDeliveryReceipt = async (poNumber) => {
    setError('');
    setSuccess('');
    try {
      const response = await axios.put(
        `https://dime-time-backend.onrender.com/api/purchase-orders/${poNumber}/status?status=DELIVERED&operator=${username}`
      );
      if (response.status === 200) {
        setSuccess(`Delivery confirmed for Purchase Order ${poNumber}. Updated to DELIVERED status.`);
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to confirm delivery for PO ${poNumber}.`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'APPROVED_FOR_DISPATCH':
        return <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.25)' }}>Ready to Ship</span>;
      case 'DISPATCHED':
        return <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)' }}>In Transit</span>;
      case 'DELIVERED':
      case 'GRN_GENERATED':
      case 'RECONCILED':
      case 'COMPLETED':
        return <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', width: 'fit-content' }}>
          <CheckCircle2 size={10} />
          <span>Delivered</span>
        </span>;
      default:
        return <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>Awaiting Approval</span>;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
          {role === 'SUPPLIER' ? 'Shipment & Order Tracking' : 'Dispatch Management'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          {role === 'SUPPLIER' 
            ? 'Track active carrier shipments, transit history, and confirm arrival receipt.' 
            : 'Register carrier assignments, tracking IDs, and dispatch completed production orders.'}
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

      {/* Dispatch Modal (Manufacturers only) */}
      {activePoForDispatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', zIndex: 999, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', width: '100vw', height: '100vh' }}>
          <div className="premium-card" style={{ width: '450px', backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={18} style={{ color: '#3b82f6' }} />
              <span>Shipment Details Registration</span>
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Assign logistics carrier for contract {activePoForDispatch.poNumber}</p>
            <form onSubmit={handleDispatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Carrier Name</label>
                <select name="carrier" className="form-input" value={dispatchData.carrier} onChange={handleDispatchChange}>
                  <option value="FedEx Freight">FedEx Freight</option>
                  <option value="DHL Express">DHL Express</option>
                  <option value="UPS Supply Chain">UPS Supply Chain</option>
                  <option value="Maersk Line">Maersk Line</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tracking Number (AWB / BL)</label>
                <input type="text" name="trackingNumber" className="form-input" value={dispatchData.trackingNumber} onChange={handleDispatchChange} placeholder="e.g. TRK-984210984" required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setActivePoForDispatch(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Send size={12} />
                  <span>Ship Goods</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipments List */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading Dispatches Board...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <Truck size={40} style={{ color: '#334155', marginBottom: '1rem' }} />
            <h3>No Shipments Recorded</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              {role === 'SUPPLIER' 
                ? 'No shipments are currently in transit to your warehouse.' 
                : 'Complete production runs on assigned orders to trigger dispatches.'}
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>PO Reference</th>
                  <th>{role === 'SUPPLIER' ? 'Manufacturer' : 'Supplier Client'}</th>
                  <th>Material Specs</th>
                  <th>Quantity</th>
                  <th>Logistics Carrier</th>
                  <th>Tracking Number</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((po) => (
                  <tr key={po.id}>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{po.poNumber}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={14} style={{ color: '#94a3b8' }} />
                        <span>{role === 'SUPPLIER' ? po.manufacturer : po.supplier}</span>
                      </span>
                    </td>
                    <td>{po.material} ({po.grade})</td>
                    <td style={{ fontWeight: 500 }}>{po.quantity}</td>
                    <td style={{ color: po.dispatchCarrier ? '#ffffff' : '#64748b' }}>
                      {po.dispatchCarrier || '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: po.dispatchTrackingNumber ? '#22c55e' : '#64748b' }}>
                      {po.dispatchTrackingNumber || '—'}
                    </td>
                    <td>{getStatusBadge(po.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {role === 'MANUFACTURER' && (
                        po.status === 'APPROVED_FOR_DISPATCH' ? (
                          <button
                            onClick={() => setActivePoForDispatch(po)}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.35rem' }}
                          >
                            <Truck size={12} />
                            <span>Dispatch Goods</span>
                          </button>
                        ) : po.status === 'DISPATCHED' ? (
                          <div style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 500 }}>
                            Dispatched
                          </div>
                        ) : ['DELIVERED', 'RECONCILED', 'COMPLETED', 'GRN_GENERATED'].includes(po.status) ? (
                          <div style={{ color: '#22c55e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end', fontWeight: 500 }}>
                            <CheckCircle2 size={12} />
                            <span>Received</span>
                          </div>
                        ) : (
                          <button
                            disabled={true}
                            className="btn"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.35rem', backgroundColor: '#1e293b', color: '#64748b', border: '1px solid #334155', cursor: 'not-allowed' }}
                          >
                            <Truck size={12} style={{ opacity: 0.5 }} />
                            <span>Awaiting Supplier Approval</span>
                          </button>
                        )
                      )}
                      {role === 'SUPPLIER' && po.status === 'DISPATCHED' && (
                        <button
                          onClick={() => confirmDeliveryReceipt(po.poNumber)}
                          className="btn"
                          style={{ 
                            padding: '0.4rem 0.8rem', 
                            fontSize: '0.8rem', 
                            gap: '0.35rem', 
                            backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                            color: '#22c55e', 
                            border: '1px solid rgba(34, 197, 94, 0.25)' 
                          }}
                        >
                          <CheckCircle2 size={12} />
                          <span>Confirm Delivery</span>
                        </button>
                      )}
                      {role === 'SUPPLIER' && ['DELIVERED', 'RECONCILED', 'COMPLETED', 'GRN_GENERATED'].includes(po.status) && (
                        <div style={{ color: '#22c55e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end', fontWeight: 500 }}>
                          <CheckCircle2 size={12} />
                          <span>Received</span>
                        </div>
                      )}
                      {role === 'MANUFACTURER' && po.status === 'DISPATCHED' && (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Shipped</span>
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
