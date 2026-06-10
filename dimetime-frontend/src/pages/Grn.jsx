import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardCheck, FileText, CheckCircle2, ShieldCheck, Printer, X, Download, Trash2, MoreVertical } from 'lucide-react';

export default function Grn() {
  const [grns, setGrns] = useState([]);
  const [pos, setPos] = useState([]);
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [grnsRes, posRes] = await Promise.all([
          axios.get('http://localhost:8080/api/grns'),
          axios.get('http://localhost:8080/api/purchase-orders')
        ]);
        if (grnsRes.data) setGrns(grnsRes.data);
        if (posRes.data) setPos(posRes.data);
      } catch (err) {
        console.error('Error fetching SCM GRN data:', err);
        setError('Failed to fetch GRN or Purchase Order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPoDetails = (poNumber) => {
    return pos.find(po => po.poNumber === poNumber) || {};
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = (id) => {
    window.open(`http://localhost:8080/api/grns/${id}/pdf`, '_blank');
  };

  const handleDeleteGrn = async (id, grnNumber) => {
    if (!window.confirm(`Are you sure you want to delete GRN ${grnNumber}?`)) return;
    try {
      const savedUser = localStorage.getItem('user');
      const operator = savedUser ? JSON.parse(savedUser).username : 'admin';
      const response = await axios.delete(`http://localhost:8080/api/grns/${id}?operator=${operator}`);
      if (response.status === 200) {
        setGrns(grns.filter(g => g.id !== id));
      }
    } catch (err) {
      console.error('Error deleting GRN:', err);
      setError('Failed to delete GRN.');
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

  const modalOverlayStyle = {
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
  };

  const modalContentStyle = {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    width: '100%',
    maxWidth: '720px',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    animation: 'scaleUp 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards'
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
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Retrieving Goods Receipt Notes...</span>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Goods Receipt Notes (GRN)</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Explore, inspect, and sign official generated Goods Receipt Note sheets cataloging verified SCM materials.
        </p>
      </div>

      {error && (
        <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* GRN Table list */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {grns.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
            <ClipboardCheck size={44} style={{ color: '#334155', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>No GRNs Generated Yet</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              Run and approve triple reconciliations under the "Verification" panel to generate official receipt notes.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>GRN Reference</th>
                  <th>PO Reference</th>
                  <th>Supplier</th>
                  <th>Manufacturer</th>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th>Generated Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((grn) => {
                  const poInfo = getPoDetails(grn.poNumber);
                  return (
                    <tr key={grn.id}>
                      <td style={{ fontWeight: 600, color: '#22c55e' }}>{grn.grnNumber}</td>
                      <td style={{ fontWeight: 500 }}>{grn.poNumber}</td>
                      <td>{grn.supplier}</td>
                      <td>{poInfo.manufacturerCompanyName || poInfo.manufacturer || '—'}</td>
                      <td>{grn.material}</td>
                      <td>{poInfo.quantity || '—'}</td>
                      <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{formatDate(grn.generatedAt)}</td>
                      <td>
                        <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', width: 'fit-content', gap: '0.25rem' }}>
                          <CheckCircle2 size={10} />
                          <span>{grn.status}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', width: '130px', minWidth: '130px', position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            onClick={() => setSelectedGrn(grn)}
                            title="View Goods Receipt Note"
                          >
                            <span>View</span>
                          </button>
                          
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === grn.id ? null : grn.id);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                              title="More Actions"
                            >
                              <MoreVertical size={12} />
                            </button>

                            {openDropdownId === grn.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: '0.25rem',
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                zIndex: 50,
                                minWidth: '120px',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '0.25rem'
                              }}>
                                <button
                                  type="button"
                                  onClick={() => { handleDownloadPdf(grn.id); setOpenDropdownId(null); }}
                                  className="dropdown-item"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                  title="Download GRN PDF"
                                >
                                  <span>Download PDF</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { handleDeleteGrn(grn.id, grn.grnNumber); setOpenDropdownId(null); }}
                                  className="dropdown-item"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                  title="Delete Goods Receipt Note"
                                >
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Official printable document */}
      {selectedGrn && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {/* Modal Actions Header */}
            <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardCheck size={18} style={{ color: '#22c55e' }} />
                <span>Inspection Sheet: {selectedGrn.grnNumber}</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={handlePrint} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }} title="Print / Download PDF">
                  <Printer size={18} style={{ color: '#ffffff' }} />
                </button>
                <button onClick={() => setSelectedGrn(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}>
                  <X size={18} style={{ color: '#ffffff' }} />
                </button>
              </div>
            </div>

            {/* Document Body (Classic Clean Paper Certificate) */}
            <div style={{ padding: '3rem 2.5rem', overflowY: 'auto', flex: 1, position: 'relative' }}>
              {/* Fake Watermark */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-25deg)', fontSize: '5rem', fontWeight: 900, color: 'rgba(34, 197, 94, 0.05)', pointerEvents: 'none', zIndex: 0 }}>
                VERIFIED
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '1.5rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>DimeTime Logistics</h2>
                  <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.1rem' }}>Material Traceability and Automation Verification Sheet</p>
                </div>
                
                {/* Fake Barcode */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', gap: '1px', height: '30px' }}>
                    {[2,1,3,1,2,4,1,2,3,1,4,2,1,3].map((w, i) => (
                      <div key={i} style={{ width: `${w}px`, height: '100%', backgroundColor: '#0f172a' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#475569' }}>*{selectedGrn.grnNumber}*</span>
                </div>
              </div>

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goods Receipt Note</h3>
              </div>

              {/* Grid Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div><strong style={{ color: '#475569' }}>GRN Reference:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedGrn.grnNumber}</span></div>
                  <div><strong style={{ color: '#475569' }}>PO Reference:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedGrn.poNumber}</span></div>
                  <div><strong style={{ color: '#475569' }}>Receipt Date:</strong> <span style={{ color: '#0f172a' }}>{formatDate(selectedGrn.generatedAt)}</span></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div><strong style={{ color: '#475569' }}>Supplier Name:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedGrn.supplier}</span></div>
                  <div><strong style={{ color: '#475569' }}>Material Details:</strong> <span style={{ color: '#0f172a' }}>{selectedGrn.material}</span></div>
                  <div><strong style={{ color: '#475569' }}>Operator Username:</strong> <span style={{ color: '#0f172a' }}>{selectedGrn.generatedBy}</span></div>
                </div>
              </div>

              {/* Summary table */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Description</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Inspection Type</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569', textAlign: 'right' }}>Audit Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{selectedGrn.material}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>AI 3-Way Reconciliation</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#22c55e' }}>PASSED</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
                  <div style={{ width: '100%', borderBottom: '1px solid #475569', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.9rem', color: '#64748b' }}>{selectedGrn.generatedBy}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.4rem', fontWeight: 600, textTransform: 'uppercase' }}>Verified Operator</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
                  {/* Digital Signature stamp overlay */}
                  <div style={{ width: '100%', borderBottom: '1px solid #475569', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      top: '-15px',
                      border: '1.5px double #22c55e',
                      color: '#22c55e',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      transform: 'rotate(-5deg)',
                      textTransform: 'uppercase',
                      backgroundColor: '#ffffff'
                    }}>
                      Digitally Approved
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.4rem', fontWeight: 600, textTransform: 'uppercase' }}>AI Audit System</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #cbd5e1' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ color: '#0f172a', border: '1px solid #cbd5e1' }}
                onClick={() => setSelectedGrn(null)}
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      {openDropdownId && (
        <div 
          onClick={() => setOpenDropdownId(null)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, background: 'transparent' }} 
        />
      )}
    </div>
  );
}
