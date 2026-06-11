import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Clock, 
  Building2, 
  Layers, 
  FileDown, 
  Lock,
  Eye,
  QrCode,
  Award,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function MtcReports({ user }) {
  const [mtcList, setMtcList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchPo, setSearchPo] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modal State for Certificate Details Viewer
  const [selectedMtc, setSelectedMtc] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(false);

  useEffect(() => {
    if (user?.role === 'SUPPLIER' || user?.role === 'ADMIN') {
      fetchMtcCertificates(true);
    }
  }, [user]);

  const fetchMtcCertificates = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const response = await axios.get('https://dime-time-backend.onrender.com/api/mtc-documents');
      if (response.data) {
        setMtcList(response.data);
      }
    } catch (err) {
      console.error('Failed to load MTC certificates', err);
      setError('Could not load MTC certificates. Make sure backend is active.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleUpdateStatus = async (mtcId, nextStatus) => {
    setProcessingStatus(true);
    setError('');
    setSuccess('');
    
    let commentUrlParam = '';
    if (nextStatus === 'REJECTED') {
      const comment = window.prompt("Please enter a mandatory rejection comment describing the issue (e.g. Heat Number mismatch):");
      if (!comment || comment.trim() === '') {
        alert("Rejection comment is mandatory. Action aborted.");
        setProcessingStatus(false);
        return;
      }
      commentUrlParam = `&comment=${encodeURIComponent(comment.trim())}`;
    }

    try {
      const response = await axios.put(
        `https://dime-time-backend.onrender.com/api/mtc-documents/${mtcId}/status?status=${nextStatus}&operator=${user?.username || 'supplier'}${commentUrlParam}`
      );
      if (response.status === 200) {
        setSuccess(`MTC Certificate successfully ${nextStatus.toLowerCase()}!`);
        fetchMtcCertificates();
        
        // Update local modal view if open
        if (selectedMtc && selectedMtc.id === mtcId) {
          setSelectedMtc(response.data);
        }
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to update certificate status to ${nextStatus}.`);
    } finally {
      setProcessingStatus(false);
    }
  };

  const downloadPdf = (mtcId) => {
    window.open(`https://dime-time-backend.onrender.com/api/mtc-documents/${mtcId}/pdf`, '_blank');
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'APPROVED':
        return { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.25)' };
      case 'REJECTED':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' };
      case 'SUPPLIER_REVIEW':
        return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' };
      default:
        return { backgroundColor: '#1e293b', color: '#94a3b8' };
    }
  };

  // Enforce Supplier Access
  if (user?.role !== 'SUPPLIER' && user?.role !== 'ADMIN') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="premium-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px' }}>
          <Lock size={48} style={{ color: '#ef4444', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700 }}>Access Denied</h2>
          <p style={{ color: '#94a3b8', marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Only **Suppliers** (or Administrators) are authorized to access MTC compliance reports, download PDFs, and approve digital stamps.
          </p>
        </div>
      </div>
    );
  }

  // Filters logic
  const filteredMtc = mtcList.filter(mtc => {
    const matchesPo = mtc.poNumber?.toLowerCase().includes(searchPo.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || mtc.status === statusFilter;
    return matchesPo && matchesStatus;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>MTC Reports</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Inspect Mill Test Certificates, review chemical & tensile matrices, download certified PDFs, and manage digital approvals.
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

      {/* Filter and Search Panel */}
      <div className="premium-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search by Purchase Order (e.g. PO-2026-001)" 
              value={searchPo}
              onChange={(e) => setSearchPo(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.5rem', backgroundColor: '#0f172a' }}
            />
          </div>
          <div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ backgroundColor: '#0f172a', cursor: 'pointer', paddingRight: '2rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUPPLIER_REVIEW">Awaiting Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
            Showing {filteredMtc.length} Certificates
          </span>
        </div>
      </div>

      {/* Certificates Registry List */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={24} className="spinning" style={{ display: 'block', margin: '0 auto 1rem auto' }} />
            <span>Syncing compliance documents...</span>
          </div>
        ) : filteredMtc.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={48} style={{ color: '#334155', marginBottom: '1rem' }} />
            <h3>No Certificates Found</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              No MTC records match the current PO search or status filter.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Certificate Reference</th>
                  <th>Purchase Order</th>
                  <th>Grade</th>
                  <th>Heat Trace</th>
                  <th>Batch Reference</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMtc.map(doc => (
                  <tr key={doc.id}>
                    <td style={{ color: '#ffffff', fontWeight: 600 }}>{doc.certificateNumber || `MTC-${doc.id}`}</td>
                    <td style={{ fontWeight: 500 }}>{doc.poNumber}</td>
                    <td><span style={{ color: '#3b82f6', fontWeight: 500 }}>{doc.grade}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{doc.heatNumber}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{doc.batchNumber || 'BT-77219'}</td>
                    <td>
                      <span className="badge" style={getStatusBadgeStyle(doc.status)}>
                        {doc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setSelectedMtc(doc)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => downloadPdf(doc.id)}
                          className="btn"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <FileDown size={12} />
                          <span>PDF</span>
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

      {/* Detailed Certificate Viewer Modal */}
      {selectedMtc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', zIndex: 999, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', width: '100vw', height: '100vh', overflowY: 'auto', padding: '2rem 0' }}>
          <div className="premium-card" style={{ width: '800px', maxWidth: '95%', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0 }}>Mill Test Certificate</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem', fontWeight: 500 }}>Compliance report EN 10204 3.1 specifications</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e', margin: 0 }}>DIMETIME SCM</h3>
                <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>AI Structured Certificate</span>
              </div>
            </div>

            {/* Content Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Certificate Reference</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.1rem' }}>{selectedMtc.certificateNumber || `MTC-${selectedMtc.id}`}</div>
                </div>
                <div style={{ marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Purchase Order No</span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.1rem' }}>{selectedMtc.poNumber}</div>
                </div>
                <div style={{ marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>RFQ Reference No</span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.1rem' }}>{selectedMtc.rfqNumber || 'RFQ-2026-001'}</div>
                </div>
              </div>
              <div>
                <div style={{ marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Heat Number</span>
                  <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '1rem', marginTop: '0.1rem' }}>{selectedMtc.heatNumber}</div>
                </div>
                <div style={{ marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Batch Number</span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.1rem' }}>{selectedMtc.batchNumber || 'BT-77219'}</div>
                </div>
                <div style={{ marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Date of Certification</span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.1rem' }}>
                    {new Date(selectedMtc.issueDate || selectedMtc.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Verification Authority</span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.1rem' }}>DimeTime AI Agent / Inspector ({selectedMtc.uploadedBy})</div>
                </div>
              </div>
            </div>

            {/* Manufacturer & Supplier Addresses Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.8rem', borderTop: '1px solid #cbd5e1', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Manufacturer Details</span>
                <div style={{ color: '#334155', marginTop: '0.2rem', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{selectedMtc.manufacturerDetails || 'Certified Manufacturer Portal'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Supplier details</span>
                <div style={{ color: '#334155', marginTop: '0.2rem', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{selectedMtc.supplierDetails || 'DimeTime Supplier Agent'}</div>
              </div>
            </div>

            {/* Chemical Matrix Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem', fontWeight: 700 }}>
                I. Chemical Composition matrix (Weight %)
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>C</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Cr</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Ni</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Mo</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Mn</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Si</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{selectedMtc.carbon ? selectedMtc.carbon.toFixed(3) : '0.021'}%</td>
                    <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{selectedMtc.chromium ? selectedMtc.chromium.toFixed(3) : '17.100'}%</td>
                    <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{selectedMtc.nickel ? selectedMtc.nickel.toFixed(3) : '10.200'}%</td>
                    <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{selectedMtc.molybdenum ? selectedMtc.molybdenum.toFixed(3) : '2.100'}%</td>
                    <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{selectedMtc.manganese ? selectedMtc.manganese.toFixed(3) : '1.500'}%</td>
                    <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{selectedMtc.silicon ? selectedMtc.silicon.toFixed(3) : '0.500'}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mechanical Matrix Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem', fontWeight: 700 }}>
                II. Mechanical & Tensile Testing
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Yield Strength (YS 0.2% Proof)</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Tensile Strength (UTS)</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Elongation (A5 %)</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Hardness (Brinell HB)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{selectedMtc.yieldStrength ? selectedMtc.yieldStrength.toFixed(1) : '285.0'} MPa</td>
                    <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{selectedMtc.tensileStrength ? selectedMtc.tensileStrength.toFixed(1) : '575.0'} MPa</td>
                    <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{selectedMtc.elongation ? selectedMtc.elongation.toFixed(1) : '45.0'}%</td>
                    <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{selectedMtc.hardness ? selectedMtc.hardness.toFixed(1) : '85.0'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Version History Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem', fontWeight: 700 }}>
                III. AI Verification History & MTC Versions
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Version</th>
                    <th style={{ textAlign: 'left', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Upload Date</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Match Score</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>OCR Confidence</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Validation Result</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '0.4rem', border: '1px solid #cbd5e1' }}>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {mtcList
                    .filter(m => m.poNumber === selectedMtc.poNumber)
                    .sort((a, b) => (b.versionNumber || 1) - (a.versionNumber || 1))
                    .map((ver) => (
                      <tr key={ver.id} style={{ backgroundColor: ver.id === selectedMtc.id ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>v{ver.versionNumber || 1} {ver.id === selectedMtc.id && '(Current)'}</td>
                        <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1' }}>{new Date(ver.uploadedAt).toLocaleDateString()} {new Date(ver.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{ver.ocrMatchScore != null ? `${ver.ocrMatchScore}%` : 'N/A'}</td>
                        <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1' }}>{ver.confidence != null ? `${Math.round(ver.confidence * 100)}%` : 'N/A'}</td>
                        <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600, color: ver.validationResult === 'APPROVED' ? '#16a34a' : ver.validationResult === 'REVIEW_REQUIRED' ? '#d97706' : '#dc2626' }}>{ver.validationResult || 'N/A'}</td>
                        <td style={{ textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{ver.status}</td>
                        <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', color: '#ef4444', fontStyle: 'italic' }}>{ver.rejectionComment || '—'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* Stamp, QR, and Signature */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #cbd5e1', paddingTop: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ border: '1.5px solid #0f172a', padding: '0.4rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
                  <QrCode size={52} style={{ color: '#0f172a' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>DIMETIME SCM SECURE</div>
                  <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.1rem', fontFamily: 'monospace' }}>MTC-{selectedMtc.heatNumber}-{selectedMtc.grade}</div>
                </div>
              </div>

              <div style={{ border: '3px double #22c55e', borderRadius: '50%', width: '84px', height: '84px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-8deg)', color: '#22c55e', fontWeight: 800, fontSize: '0.65rem', lineHeight: '1', textAlign: 'center', backgroundColor: 'rgba(34, 197, 94, 0.03)' }}>
                <Award size={16} style={{ marginBottom: '0.15rem' }} />
                <span>AI</span>
                <span>APPROVED</span>
              </div>

              <div style={{ textAlign: 'right', width: '150px' }}>
                <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: '1.5rem', color: '#1e3a8a', lineHeight: '1', marginBottom: '0.2rem' }}>Agent DimeTime</div>
                <div style={{ borderTop: '1px solid #94a3b8', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Inspector Sign</div>
              </div>
            </div>

            {/* Modal Controls / Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <button 
                type="button" 
                onClick={() => downloadPdf(selectedMtc.id)} 
                className="btn btn-primary" 
                style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              >
                <FileDown size={16} />
                <span>Download Certified PDF</span>
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedMtc(null)} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.6rem 1rem' }}
                >
                  Close
                </button>

                {selectedMtc.status === 'SUPPLIER_REVIEW' && (
                  <>
                    <button 
                      type="button" 
                      onClick={() => handleUpdateStatus(selectedMtc.id, 'REJECTED')} 
                      className="btn" 
                      style={{ padding: '0.6rem 1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      disabled={processingStatus}
                    >
                      <XCircle size={16} />
                      <span>Reject MTC</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleUpdateStatus(selectedMtc.id, 'APPROVED')} 
                      className="btn" 
                      style={{ padding: '0.6rem 1.25rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.25)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      disabled={processingStatus}
                    >
                      <CheckCircle2 size={16} />
                      <span>Approve MTC</span>
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

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
