import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Plus,
  Info,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Verification({ user }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPoNumber, setSelectedPoNumber] = useState('');
  const [poDetails, setPoDetails] = useState(null);
  
  const [latestUpload, setLatestUpload] = useState(null);
  const [latestMtc, setLatestMtc] = useState(null);

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [verificationResult, setVerificationResult] = useState(null);
  const [grnLoading, setGrnLoading] = useState(false);
  const navigate = useNavigate();

  const fetchLatestDetailsForPo = async (poNumber) => {
    try {
      const [uploadRes, mtcRes] = await Promise.all([
        axios.get(`https://dime-time-backend.onrender.com/api/material-uploads/po/${poNumber}`).catch(() => ({ data: null })),
        axios.get(`https://dime-time-backend.onrender.com/api/mtc-documents?poNumber=${poNumber}`).catch(() => ({ data: null }))
      ]);
      if (uploadRes && uploadRes.data) {
        setLatestUpload(uploadRes.data);
      } else {
        setLatestUpload(null);
      }
      if (mtcRes && mtcRes.data && mtcRes.data.length > 0) {
        setLatestMtc(mtcRes.data[0]);
      } else {
        setLatestMtc(null);
      }
    } catch (err) {
      console.error("Failed to fetch details for PO:", poNumber, err);
      setLatestUpload(null);
      setLatestMtc(null);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [posResponse, uploadResponse, mtcResponse] = await Promise.all([
          axios.get('https://dime-time-backend.onrender.com/api/purchase-orders'),
          axios.get('https://dime-time-backend.onrender.com/api/material-uploads/latest'),
          axios.get('https://dime-time-backend.onrender.com/api/mtc-documents/latest')
        ]);

        if (posResponse.data) {
          // Show all active POs, only hide when final workflow is completed (COMPLETED, CLOSED)
          const activePos = posResponse.data.filter(po => 
            !['COMPLETED', 'CLOSED', 'GRN_GENERATED'].includes(po.status)
          );
          setPurchaseOrders(activePos);
          if (activePos.length > 0) {
            setSelectedPoNumber(activePos[0].poNumber);
            setPoDetails(activePos[0]);
            fetchLatestDetailsForPo(activePos[0].poNumber);
          } else {
            if (uploadResponse.data) setLatestUpload(uploadResponse.data);
            if (mtcResponse.data) setLatestMtc(mtcResponse.data);
          }
        } else {
          if (uploadResponse.data) setLatestUpload(uploadResponse.data);
          if (mtcResponse.data) setLatestMtc(mtcResponse.data);
        }
      } catch (err) {
        console.error('Error loading verification sources:', err);
        setError('Verification sources are offline. Verify if Spring Boot backend is active.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handlePoChange = (e) => {
    const poNum = e.target.value;
    setSelectedPoNumber(poNum);
    const po = purchaseOrders.find((p) => p.poNumber === poNum);
    setPoDetails(po);
    setVerificationResult(null); // Clear previous results
    setSuccess('');
    setError('');
    if (poNum) {
      fetchLatestDetailsForPo(poNum);
    } else {
      setLatestUpload(null);
      setLatestMtc(null);
    }
  };

  const handleVerifySubmit = async () => {
    if (!selectedPoNumber) {
      setError('Please select a Purchase Order to verify');
      return;
    }
    if (!latestUpload) {
      setError('No material image upload found in system. Please upload a material image first.');
      return;
    }
    if (!latestMtc) {
      setError('No MTC document found in system. Please upload an MTC certificate first.');
      return;
    }

    setVerifying(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `https://dime-time-backend.onrender.com/api/verification?poNumber=${selectedPoNumber}&verifiedBy=${user?.username || 'admin'}`
      );

      if (response.status === 200 && response.data) {
        setVerificationResult(response.data);
        setSuccess('AI Reconciliation Complete');
        fetchLatestDetailsForPo(selectedPoNumber);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(err.response.data.message || err.response.data);
      } else {
        setError('Verification algorithm encountered an error.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleGenerateGrn = async () => {
    if (!selectedPoNumber) return;
    setGrnLoading(true);
    try {
      const response = await axios.post(
        `https://dime-time-backend.onrender.com/api/grns?poNumber=${selectedPoNumber}&generatedBy=${user?.username || 'admin'}`
      );

      if (response.status === 200) {
        navigate('/grn');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate Goods Receipt Note.');
    } finally {
      setGrnLoading(false);
    }
  };

  const columnGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    alignItems: 'start',
  };

  const getCellBadgeStyle = (isMatch) => {
    if (isMatch) {
      return {
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: 'rgba(34, 197, 94, 0.12)',
        color: '#22c55e',
        border: '1px solid rgba(34, 197, 94, 0.2)'
      };
    } else {
      return {
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      };
    }
  };

  const getStatusColor = (status) => {
    if (status === 'APPROVED') return '#22c55e';
    if (status === 'REVIEW_REQUIRED') return '#f59e0b';
    return '#ef4444';
  };

  const getStatusLabel = (status) => {
    if (status === 'APPROVED') return 'MATCH';
    if (status === 'REVIEW_REQUIRED') return 'PARTIAL MATCH';
    return 'MISMATCH';
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
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Aligning Verification Matrices...</span>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>AI 3-Way Reconciliation</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Execute triple cross-checks (PO Specifications ↔ OCR Physical Labeling ↔ MTC Certified Chemistry) to approve receipt.
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

      <div style={columnGridStyle}>
        {/* Left Column - Setup and Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={18} style={{ color: '#22c55e' }} />
              <span>Select Purchase Order</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Purchase Order (PO)</label>
              <select
                className="form-input"
                value={selectedPoNumber}
                onChange={handlePoChange}
                style={{ backgroundColor: '#0f172a', cursor: 'pointer' }}
              >
                {purchaseOrders.length === 0 ? (
                  <option value="">No POs Available</option>
                ) : (
                  purchaseOrders.map((po) => (
                    <option key={po.id} value={po.poNumber}>
                      {po.poNumber} — {po.supplier} ({po.material})
                    </option>
                  ))
                )}
              </select>
            </div>

            {poDetails && (
              <div style={{ marginTop: '1rem', backgroundColor: 'rgba(15,23,42,0.4)', border: '1px solid #334155', borderRadius: '8px', padding: '1rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Seeded PO Details</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  <div><span style={{ color: '#94a3b8' }}>Material:</span> <span style={{ color: '#fff', fontWeight: 500 }}>{poDetails.material}</span></div>
                  <div><span style={{ color: '#94a3b8' }}>Supplier:</span> <span style={{ color: '#fff', fontWeight: 500 }}>{poDetails.supplier}</span></div>
                  <div><span style={{ color: '#94a3b8' }}>Grade:</span> <span style={{ color: '#22c55e', fontWeight: 600 }}>{poDetails.grade}</span></div>
                  <div><span style={{ color: '#94a3b8' }}>Quantity:</span> <span style={{ color: '#fff', fontWeight: 500 }}>{poDetails.quantity}</span></div>
                </div>
              </div>
            )}

            {/* Run Verification Button */}
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', height: '46px' }}
              onClick={handleVerifySubmit}
              disabled={verifying || !poDetails || !latestUpload || !latestMtc}
            >
              {verifying ? (
                <>
                  <RotateCcw size={16} className="spinning" />
                  <span>Computing AI Match Matrix...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Execute AI Reconciliation</span>
                </>
              )}
            </button>
          </div>

          {/* Active upload status check cards */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={16} style={{ color: '#3b82f6' }} />
              <span>Active Traceability Sources</span>
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid #334155' }}>
              <div>
                <span style={{ fontWeight: 500, color: '#f8fafc' }}>Latest Label OCR:</span>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>{latestUpload ? `Heat: ${latestUpload.heatNumber} (${latestUpload.fileName})` : 'No Image Uploaded'}</p>
              </div>
              <span className={`badge ${latestUpload ? 'badge-success' : 'badge-danger'}`}>{latestUpload ? 'Active' : 'Missing'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid #334155' }}>
              <div>
                <span style={{ fontWeight: 500, color: '#f8fafc' }}>Latest Parsed MTC:</span>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>{latestMtc ? `Heat: ${latestMtc.heatNumber} (${latestMtc.fileName})` : 'No MTC Uploaded'}</p>
              </div>
              <span className={`badge ${latestMtc ? 'badge-success' : 'badge-danger'}`}>{latestMtc ? 'Active' : 'Missing'}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Reconciliation Matrix Output */}
        <div>
          {verificationResult ? (
            <div className="premium-card" style={{ borderLeft: '4px solid ' + getStatusColor(verificationResult.status), animation: 'slideIn 0.3s ease' }}>
              
              {/* Circular Gauge and status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>AI Audit Status</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: getStatusColor(verificationResult.status), display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                    {verificationResult.status === 'APPROVED' ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                    {getStatusLabel(verificationResult.status)}
                  </span>
                </div>

                {/* Score Indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: getStatusColor(verificationResult.status),
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    border: '2px solid ' + getStatusColor(verificationResult.status),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px ' + getStatusColor(verificationResult.status) + '20'
                  }}>
                    {Math.round(verificationResult.matchPercentage)}%
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.35rem', fontWeight: 500 }}>MATCH RATING</span>
                </div>
              </div>

              {/* Premium Comparison Table */}
              <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>AI 3-Way Specification Matrix</h4>
              
              <div className="table-container" style={{ margin: '0 0 1.5rem 0', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', fontWeight: 600 }}>
                      <th style={{ padding: '0.65rem 0.8rem' }}>FIELD</th>
                      <th style={{ padding: '0.65rem 0.8rem' }}>PO</th>
                      <th style={{ padding: '0.65rem 0.8rem' }}>OCR</th>
                      <th style={{ padding: '0.65rem 0.8rem' }}>MTC</th>
                      <th style={{ padding: '0.65rem 0.8rem' }}>RESULT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Grade Row */}
                    <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(30, 41, 59, 0.2)' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600, color: '#f8fafc' }}>Grade</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{poDetails.grade}</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{latestUpload?.grade || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{latestMtc?.grade || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>
                        <span style={getCellBadgeStyle(verificationResult.gradeMatch)}>
                          {verificationResult.gradeMatch ? 'MATCH' : 'MISMATCH'}
                        </span>
                      </td>
                    </tr>

                    {/* Dimension Row */}
                    <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(30, 41, 59, 0.2)' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600, color: '#f8fafc' }}>Dimension</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{poDetails.dimension}</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{latestUpload?.dimension || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{latestMtc?.dimension || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>
                        <span style={getCellBadgeStyle(verificationResult.dimensionMatch)}>
                          {verificationResult.dimensionMatch ? 'MATCH' : 'MISMATCH'}
                        </span>
                      </td>
                    </tr>

                    {/* Quantity Row */}
                    <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(30, 41, 59, 0.2)' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600, color: '#f8fafc' }}>Quantity</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{poDetails.quantity}</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{latestUpload?.quantity || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{latestMtc?.quantity || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>
                        <span style={getCellBadgeStyle(verificationResult.quantityMatch)}>
                          {verificationResult.quantityMatch ? 'MATCH' : 'MISMATCH'}
                        </span>
                      </td>
                    </tr>

                    {/* Heat Number Row */}
                    <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(30, 41, 59, 0.2)' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600, color: '#f8fafc' }}>Heat Number</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#94a3b8' }}>N/A</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{latestUpload?.heatNumber || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{latestMtc?.heatNumber || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>
                        <span style={getCellBadgeStyle(verificationResult.heatNumberMatch)}>
                          {verificationResult.heatNumberMatch ? 'MATCH' : 'MISMATCH'}
                        </span>
                      </td>
                    </tr>

                    {/* Batch Number Row */}
                    <tr style={{ borderBottom: '1px solid #334155', backgroundColor: 'rgba(30, 41, 59, 0.2)' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600, color: '#f8fafc' }}>Batch Number</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#94a3b8' }}>N/A</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{latestUpload?.batchNumber || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#e2e8f0' }}>{latestMtc?.batchNumber || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>
                        <span style={getCellBadgeStyle(verificationResult.batchNumberMatch)}>
                          {verificationResult.batchNumberMatch ? 'MATCH' : 'MISMATCH'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Score Calculation Break Down */}
              <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Weighted Match Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Grade (25%):</span>
                    <span style={{ fontWeight: 600, color: verificationResult.gradeMatch ? '#22c55e' : '#ef4444' }}>{verificationResult.gradeMatch ? '25% (MATCH)' : '0% (MISMATCH)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Dimension (25%):</span>
                    <span style={{ fontWeight: 600, color: verificationResult.dimensionMatch ? '#22c55e' : '#ef4444' }}>{verificationResult.dimensionMatch ? '25% (MATCH)' : '0% (MISMATCH)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Quantity (25%):</span>
                    <span style={{ fontWeight: 600, color: verificationResult.quantityMatch ? '#22c55e' : '#ef4444' }}>{verificationResult.quantityMatch ? '25% (MATCH)' : '0% (MISMATCH)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Heat Number (15%):</span>
                    <span style={{ fontWeight: 600, color: verificationResult.heatNumberMatch ? '#22c55e' : '#ef4444' }}>{verificationResult.heatNumberMatch ? '15% (MATCH)' : '0% (MISMATCH)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Batch Number (10%):</span>
                    <span style={{ fontWeight: 600, color: verificationResult.batchNumberMatch ? '#22c55e' : '#ef4444' }}>{verificationResult.batchNumberMatch ? '10% (MATCH)' : '0% (MISMATCH)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontWeight: 700, borderTop: '1px solid #334155', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <span>Total Match Score:</span>
                    <span style={{ color: getStatusColor(verificationResult.status) }}>{Math.round(verificationResult.matchPercentage)}%</span>
                  </div>
                </div>
              </div>

              {/* Why Failed? Section */}
              {verificationResult.matchPercentage < 95.0 && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={16} />
                    <span>Why Failed?</span>
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Failures List */}
                    <div>
                      <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: '0.3rem' }}>Failures:</div>
                      <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {!verificationResult.heatNumberMatch && (
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>❌</span>
                            <span style={{ color: '#f8fafc' }}>{(!latestUpload?.heatNumber || !latestMtc?.heatNumber) ? 'Heat Number Missing' : 'Heat Number Mismatch'}</span>
                          </li>
                        )}
                        {!verificationResult.gradeMatch && (
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>❌</span>
                            <span style={{ color: '#f8fafc' }}>Grade Mismatch</span>
                          </li>
                        )}
                        {!verificationResult.dimensionMatch && (
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>❌</span>
                            <span style={{ color: '#f8fafc' }}>Dimension Mismatch</span>
                          </li>
                        )}
                        {!verificationResult.quantityMatch && (
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>❌</span>
                            <span style={{ color: '#f8fafc' }}>Quantity Mismatch</span>
                          </li>
                        )}
                        {!verificationResult.batchNumberMatch && (
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>❌</span>
                            <span style={{ color: '#f8fafc' }}>{(!latestUpload?.batchNumber || !latestMtc?.batchNumber) ? 'Batch Number Missing' : 'Batch Number Mismatch'}</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Matches List */}
                    <div>
                      <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: '0.3rem' }}>Matches:</div>
                      <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {verificationResult.heatNumberMatch && (
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>✅</span>
                            <span style={{ color: '#94a3b8' }}>Heat Number Match</span>
                          </li>
                        )}
                        {verificationResult.gradeMatch && (
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>✅</span>
                            <span style={{ color: '#94a3b8' }}>Grade Match</span>
                          </li>
                        )}
                        {verificationResult.dimensionMatch && (
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>✅</span>
                            <span style={{ color: '#94a3b8' }}>Dimension Match</span>
                          </li>
                        )}
                        {verificationResult.quantityMatch && (
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>✅</span>
                            <span style={{ color: '#94a3b8' }}>Quantity Match</span>
                          </li>
                        )}
                        {verificationResult.batchNumberMatch && (
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>✅</span>
                            <span style={{ color: '#94a3b8' }}>Batch Number Match</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons if approved */}
              {verificationResult.status === 'APPROVED' && (
                <div style={{ marginTop: '1.75rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', height: '46px' }}
                    onClick={handleGenerateGrn}
                    disabled={grnLoading}
                  >
                    {grnLoading ? (
                      <>
                        <RotateCcw size={16} className="spinning" />
                        <span>Generating Goods Receipt Note...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Generate Goods Receipt Note (GRN)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', borderStyle: 'dashed', backgroundColor: 'transparent' }}>
              <ShieldCheck size={48} style={{ color: '#334155', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>Reconciliation Report Awaiting Trigger</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', maxWidth: '300px', marginTop: '0.25rem' }}>
                Select a Purchase Order and click "Execute Reconciliation" to run the three-way AI audit.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
