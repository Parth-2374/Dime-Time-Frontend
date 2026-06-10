import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  Building2, 
  Eye, 
  FileText,
  Star,
  ChevronRight,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';

export default function QuotationManagement({ user }) {
  const [quotations, setQuotations] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [selectedRfqNumber, setSelectedRfqNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmQuote, setConfirmQuote] = useState(null);
  
  const role = user?.role || 'SUPPLIER';
  const username = user?.username || '';

  useEffect(() => {
    fetchInitialData();
  }, [username]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      if (role === 'SUPPLIER') {
        const rfqsRes = await axios.get('http://localhost:8080/api/rfqs');
        if (rfqsRes.data) {
          // Suppliers see all their created RFQs that are not cancelled
          const supplierRfqs = rfqsRes.data.filter(
            r => r.createdBy === username && r.status !== 'CANCELLED'
          );
          setRfqs(supplierRfqs);
          if (supplierRfqs.length > 0) {
            setSelectedRfqNumber(supplierRfqs[0].rfqNumber);
            fetchQuotesForRfq(supplierRfqs[0].rfqNumber);
          } else {
            setLoading(false);
          }
        }
      } else {
        // Manufacturer sees their submitted quotations
        const quotesRes = await axios.get(`http://localhost:8080/api/quotations/manufacturer/${username}`);
        if (quotesRes.data) {
          setQuotations(quotesRes.data);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch quotation records.');
      setLoading(false);
    }
  };

  const fetchQuotesForRfq = async (rfqNumber) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/quotations/rfq/${rfqNumber}`);
      if (response.data) {
        setQuotations(response.data);
      }
    } catch (err) {
      setError('Failed to load quotations for ' + rfqNumber);
    } finally {
      setLoading(false);
    }
  };

  const handleRfqSelectChange = (e) => {
    const rfqNum = e.target.value;
    setSelectedRfqNumber(rfqNum);
    setLoading(true);
    fetchQuotesForRfq(rfqNum);
  };

  const handleAcceptQuoteClick = (quote) => {
    setConfirmQuote(quote);
  };

  const handleConfirmAccept = async () => {
    if (!confirmQuote) return;
    setError('');
    setSuccess('');
    try {
      // Hits the accepted endpoint, which auto-generates the PO and updates RFQ status
      const response = await axios.put(
        `http://localhost:8080/api/quotations/${confirmQuote.id}/select?operator=${username}`
      );
      if (response.status === 200) {
        setSuccess(`Quotation approved successfully! SCM Purchase Order has been automatically generated and released to manufacturer: ${confirmQuote.manufacturer}`);
        setConfirmQuote(null);
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.message || err.response?.data || err.message || 'Failed to approve quotation and release PO.';
      setError(backendMsg);
    }
  };

  const getRating = (mName) => {
    // Simulated rating based on manufacturer username/name
    let hash = 0;
    for (let i = 0; i < mName.length; i++) {
      hash += mName.charCodeAt(i);
    }
    const score = 4.0 + (hash % 10) / 10;
    return score.toFixed(1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>Pending Acceptance</span>;
      case 'SUBMITTED':
        return <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)' }}>Bid Submitted</span>;
      case 'ACCEPTED':
        return <span className="badge badge-success">Accepted & Released</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Rejected</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
          {role === 'SUPPLIER' ? 'Procurement Bid Comparison' : 'My Submitted Quotations'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          {role === 'SUPPLIER' 
            ? 'Compare manufacturer unit pricing, total estimates, lead times, and release automatic PO contracts.'
            : 'Track the status and quality rating audits of your submitted bids.'}
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

      {role === 'SUPPLIER' && rfqs.length > 0 && (
        <div className="premium-card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Select RFQ to inspect bids</span>
            <select
              value={selectedRfqNumber}
              onChange={handleRfqSelectChange}
              className="form-input"
              style={{ width: '280px', backgroundColor: '#0f172a' }}
            >
              {rfqs.map(r => (
                <option key={r.id} value={r.rfqNumber}>{r.rfqNumber} - {r.materialName || r.material}</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#94a3b8', borderLeft: '1px solid #1e293b', paddingLeft: '1.5rem' }}>
            {selectedRfqNumber && rfqs.find(r => r.rfqNumber === selectedRfqNumber) && (
              <div>
                <strong>RFQ Specs: </strong> 
                {rfqs.find(r => r.rfqNumber === selectedRfqNumber).materialGrade || rfqs.find(r => r.rfqNumber === selectedRfqNumber).grade} • 
                {' '}{rfqs.find(r => r.rfqNumber === selectedRfqNumber).requiredDimension || rfqs.find(r => r.rfqNumber === selectedRfqNumber).dimension} • 
                {' '}{rfqs.find(r => r.rfqNumber === selectedRfqNumber).quantityValue ? `${rfqs.find(r => r.rfqNumber === selectedRfqNumber).quantityValue} ${rfqs.find(r => r.rfqNumber === selectedRfqNumber).quantityUnit}` : rfqs.find(r => r.rfqNumber === selectedRfqNumber).quantity}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmQuote && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', zIndex: 999, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', width: '100vw', height: '100vh' }}>
          <div className="premium-card" style={{ width: '460px', backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ThumbsUp size={18} style={{ color: '#22c55e' }} />
              <span>Approve Bidding Quotation</span>
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Are you sure you want to accept the quotation from <strong>{confirmQuote.manufacturer}</strong> for total value of <strong>${confirmQuote.price.toLocaleString()}</strong>? 
              <br/><br/>
              <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={12} />
                <span>This will automatically generate and release the Purchase Order.</span>
              </span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setConfirmQuote(null)} className="btn btn-secondary">Cancel</button>
              <button type="button" onClick={handleConfirmAccept} className="btn btn-primary">Confirm & Release PO</button>
            </div>
          </div>
        </div>
      )}

      {/* Quotes Listing */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading Quotations Board...</div>
        ) : quotations.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={40} style={{ color: '#334155', marginBottom: '1rem' }} />
            <h3>No Bids or Quotations Found</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              {role === 'SUPPLIER' 
                ? 'Manufacturers have not submitted bids for this RFQ yet.' 
                : 'You have not submitted any quotation bids yet.'}
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>RFQ Reference</th>
                  <th>{role === 'SUPPLIER' ? 'Manufacturer' : 'Submitted By'}</th>
                  <th>Quality Rating</th>
                  <th>Unit Price</th>
                  <th>Total Estimate</th>
                  <th>Lead Time</th>
                  <th>Delivery Terms</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  {role === 'SUPPLIER' && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {quotations.map((quote) => (
                  <tr key={quote.id}>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{quote.rfqNumber}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={14} style={{ color: '#94a3b8' }} />
                        <span>{quote.manufacturer}</span>
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Star size={12} fill="#f59e0b" />
                        <span>{getRating(quote.manufacturer)} / 5.0</span>
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>${(quote.unitPrice || (quote.price / 5)).toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: '#22c55e' }}>${quote.price.toLocaleString()}</td>
                    <td style={{ fontWeight: 500 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} style={{ color: '#94a3b8' }} />
                        <span>{quote.leadTimeDays} Days</span>
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#ffffff' }}>
                      {quote.deliveryTerms || 'FOB Shipping'}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {quote.remarks || '—'}
                    </td>
                    <td>{getStatusBadge(quote.status)}</td>
                    {role === 'SUPPLIER' && (
                      <td style={{ textAlign: 'right' }}>
                        {quote.status === 'SUBMITTED' && (
                          <button
                            onClick={() => handleAcceptQuoteClick(quote)}
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', backgroundColor: '#22c55e', borderColor: '#22c55e' }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Accept Bid</span>
                          </button>
                        )}
                        {quote.status === 'ACCEPTED' && (
                          <span style={{ fontSize: '0.8rem', color: '#22c55e', fontStyle: 'italic', fontWeight: 500 }}>Approved</span>
                        )}
                        {quote.status === 'REJECTED' && (
                          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontStyle: 'italic' }}>Closed</span>
                        )}
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
