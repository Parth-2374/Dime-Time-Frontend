import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  Layers, 
  Zap, 
  Info,
  Printer,
  QrCode,
  Award,
  History,
  FileDown,
  Lock,
  Activity,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Image,
  MoreVertical
} from 'lucide-react';

export default function MtcUpload({ user }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [pos, setPos] = useState([]);
  const [selectedPoNumber, setSelectedPoNumber] = useState('');
  const [mtcHistory, setMtcHistory] = useState([]);
  const [ocrResult, setOcrResult] = useState(null);
  const [previewForm, setPreviewForm] = useState({
    grade: '',
    materialDescription: '',
    heatNumber: '',
    batchNumber: '',
    quantity: '',
    dimension: '',
    carbon: 0.0,
    chromium: 0.0,
    nickel: 0.0,
    molybdenum: 0.0,
    manganese: 0.0,
    silicon: 0.0,
    yieldStrength: 0.0,
    tensileStrength: 0.0,
    elongation: 0.0,
    hardness: 0.0
  });

  // Admin SCM Verification State
  const [adminMtcs, setAdminMtcs] = useState([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [selectedMtcDetails, setSelectedMtcDetails] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    if (user?.role === 'MANUFACTURER') {
      fetchPurchaseOrders();
      fetchMtcHistory();
    } else if (user?.role === 'ADMIN') {
      fetchAdminMtcs();
    }
  }, [user]);

  const fetchAdminMtcs = async () => {
    setAdminLoading(true);
    try {
      const response = await axios.get('https://dime-time-backend.onrender.com/api/mtc-documents');
      if (response.data) {
        setAdminMtcs(response.data);
      }
    } catch (err) {
      console.error('Failed to load MTC documents', err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleApproveMtc = async (id) => {
    try {
      setError('');
      setSuccess('');
      const response = await axios.put(`https://dime-time-backend.onrender.com/api/mtc-documents/${id}/status?status=APPROVED&operator=${user.username}`);
      if (response.status === 200) {
        setSuccess('MTC Certificate approved successfully.');
        fetchAdminMtcs();
      }
    } catch (err) {
      setError('Failed to approve MTC.');
    }
  };

  const handleRejectMtc = async (id) => {
    const reason = window.prompt("Enter rejection reason/comment:");
    if (reason === null) return;
    try {
      setError('');
      setSuccess('');
      const response = await axios.put(`https://dime-time-backend.onrender.com/api/mtc-documents/${id}/status?status=REJECTED&operator=${user.username}&comment=${encodeURIComponent(reason)}`);
      if (response.status === 200) {
        setSuccess('MTC Certificate rejected.');
        fetchAdminMtcs();
      }
    } catch (err) {
      setError('Failed to reject MTC.');
    }
  };

  const handleDeleteMtc = async (id) => {
    if (!window.confirm("Are you sure you want to delete this MTC document?")) return;
    try {
      setError('');
      setSuccess('');
      const response = await axios.delete(`https://dime-time-backend.onrender.com/api/mtc-documents/${id}?operator=${user.username}`);
      if (response.status === 200) {
        setSuccess('MTC Certificate deleted successfully.');
        fetchAdminMtcs();
      }
    } catch (err) {
      setError('Failed to delete MTC.');
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const endpoint = `https://dime-time-backend.onrender.com/api/purchase-orders/manufacturer/${user?.username}`;
      const response = await axios.get(endpoint);
      if (response.data) {
        // Show all active POs, only hide when final workflow is completed (COMPLETED, CLOSED)
        const activePos = response.data.filter(po => 
          !['COMPLETED', 'CLOSED', 'GRN_GENERATED'].includes(po.status)
        );
        setPos(activePos);
      }
    } catch (err) {
      console.error('Failed to load purchase orders', err);
    }
  };

  const fetchMtcHistory = async () => {
    try {
      const response = await axios.get('https://dime-time-backend.onrender.com/api/mtc-documents');
      if (response.data) {
        // Filter history by current manufacturer username
        const history = response.data.filter(doc => doc.uploadedBy === user?.username);
        setMtcHistory(history);
      }
    } catch (err) {
      console.error('Failed to fetch MTC history', err);
    }
  };

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    const fileExt = selectedFile.name.split('.').pop().toLowerCase();
    if (fileExt !== 'pdf' && fileExt !== 'png' && fileExt !== 'jpg' && fileExt !== 'jpeg') {
      setError('Please select an MTC image (PNG, JPG, JPEG) or PDF file');
      return;
    }

    setError('');
    setFile(selectedFile);
    setOcrResult(null);

    if (fileExt !== 'pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setError('Please select an MTC document to parse');
      return;
    }
    if (!selectedPoNumber) {
      setError('Please select the target Purchase Order to link this MTC');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', user?.username || 'manufacturer');
    formData.append('poNumber', selectedPoNumber);

    const endpoint = 'https://dime-time-backend.onrender.com/api/mtc-documents/ocr-upload';

    try {
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        setOcrResult(data);
        if (data.autoGenerated) {
          setSuccess(data.message || 'AI MTC Certificate Auto-Generated & Sent to Supplier!');
          fetchPurchaseOrders();
          fetchMtcHistory();
          window.dispatchEvent(new CustomEvent('refresh-notifications'));
        } else {
          if (data.blocked) {
            setError(data.message || 'OCR data does not match Purchase Order requirements.');
          } else {
            setSuccess('OCR extraction completed. Review required.');
          }
          if (data.previewData) {
            setPreviewForm({
              grade: data.previewData.grade || '',
              materialDescription: data.previewData.materialDescription || '',
              materialName: data.previewData.materialName || '',
              heatNumber: data.previewData.heatNumber || '',
              batchNumber: data.previewData.batchNumber || '',
              quantity: data.previewData.quantity || '',
              dimension: data.previewData.dimension || '',
              carbon: data.previewData.carbon || 0.0,
              chromium: data.previewData.chromium || 0.0,
              nickel: data.previewData.nickel || 0.0,
              molybdenum: data.previewData.molybdenum || 0.0,
              manganese: data.previewData.manganese || 0.0,
              silicon: data.previewData.silicon || 0.0,
              yieldStrength: data.previewData.yieldStrength || 0.0,
              tensileStrength: data.previewData.tensileStrength || 0.0,
              elongation: data.previewData.elongation || 0.0,
              hardness: data.previewData.hardness || 0.0
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data || err.message || 'MTC parsing failed. Make sure the OCR backend service is running.';
      setError(`MTC parsing failed: ${typeof backendError === 'object' ? JSON.stringify(backendError) : backendError}`);
    } finally {
      setUploading(false);
    }
  };

  const handleManualGenerate = async () => {
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const { score: currentScore } = calculateScoreAndMatches();
      const payload = {
        ...previewForm,
        ocrMatchScore: currentScore,
        validationResult: currentScore >= 80 ? 'REVIEW_REQUIRED' : 'REJECTED'
      };
      const response = await axios.post(
        `https://dime-time-backend.onrender.com/api/mtc-documents/generate?poNumber=${selectedPoNumber}&uploadedBy=${user?.username}`,
        payload
      );
      if (response.status === 200 && response.data) {
        setSuccess('MTC Certificate manual generation successful and sent to Supplier!');
        fetchPurchaseOrders();
        fetchMtcHistory();
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
        setOcrResult(null);
        setFile(null);
        setPreviewUrl(null);
        setSelectedPoNumber('');
        setPreviewForm({
          grade: '',
          materialDescription: '',
          materialName: '',
          heatNumber: '',
          batchNumber: '',
          quantity: '',
          dimension: '',
          carbon: 0.0,
          chromium: 0.0,
          nickel: 0.0,
          molybdenum: 0.0,
          manganese: 0.0,
          silicon: 0.0,
          yieldStrength: 0.0,
          tensileStrength: 0.0,
          elongation: 0.0,
          hardness: 0.0
        });
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data || err.message || 'Failed to confirm and generate certificate.';
      setError(`Manual MTC generation failed: ${typeof backendError === 'object' ? JSON.stringify(backendError) : backendError}`);
    } finally {
      setUploading(false);
    }
  };

  const downloadMtcPdf = (mtcId) => {
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

  const isMismatched = (field, ocrVal, poVal) => {
    if (!ocrVal || !poVal) return false;
    const cleanStr = (val) => String(val).trim().toLowerCase();
    
    if (field === 'grade') {
      const cOcr = cleanStr(ocrVal).replace(/[^a-z0-9]/g, '').replace('grade', '');
      const cPo = cleanStr(poVal).replace(/[^a-z0-9]/g, '').replace('grade', '');
      return !cOcr.includes(cPo) && !cPo.includes(cOcr);
    }
    
    if (field === 'quantity') {
      const parseNum = (s) => {
        const m = String(s).match(/(\d+(?:\.\d+)?)/);
        return m ? parseFloat(m[1]) : 0;
      };
      const nOcr = parseNum(ocrVal);
      const nPo = parseNum(poVal);
      if (nOcr > 0 && nPo > 0) {
        if (Math.abs(nOcr - nPo) < 0.1) return false;
        const ratio = Math.min(nOcr, nPo) / Math.max(nOcr, nPo);
        return ratio < 0.9;
      }
      const cOcr = cleanStr(ocrVal).replace(/[^a-z0-9]/g, '').replace('pcs', '').replace('pieces', '').replace('kg', '');
      const cPo = cleanStr(poVal).replace(/[^a-z0-9]/g, '').replace('pcs', '').replace('pieces', '').replace('kg', '');
      return cOcr !== cPo;
    }
    
    if (field === 'dimension') {
      const extractNums = (s) => {
        const matches = [...String(s).matchAll(/(\d+(?:\.\d+)?)/g)];
        return matches.map(m => parseFloat(m[1]));
      };
      const ocrNums = extractNums(ocrVal);
      const poNums = extractNums(poVal);
      if (ocrNums.length > 0 && poNums.length > 0) {
        if (ocrNums.length === poNums.length) {
          const allMatch = ocrNums.every((val, idx) => Math.abs(val - poNums[idx]) < 0.1);
          if (allMatch) return false;
        }
        // Check subset/sequence match
        const larger = ocrNums.length >= poNums.length ? ocrNums : poNums;
        const smaller = ocrNums.length < poNums.length ? ocrNums : poNums;
        let matchCount = 0;
        let lastIdx = -1;
        for (const s of smaller) {
          for (let i = lastIdx + 1; i < larger.length; i++) {
            if (Math.abs(larger[i] - s) < 0.1) {
              matchCount++;
              lastIdx = i;
              break;
            }
          }
        }
        if (matchCount / smaller.length >= 0.9) return false;
      }
      const cOcr = cleanStr(ocrVal).replace(/[^a-z0-9]/g, '').replace('mm', '').replace('inch', '').replace('in', '');
      const cPo = cleanStr(poVal).replace(/[^a-z0-9]/g, '').replace('mm', '').replace('inch', '').replace('in', '');
      return !cOcr.includes(cPo) && !cPo.includes(cOcr);
    }
    
    if (field === 'materialDescription') {
      const cOcr = cleanStr(ocrVal).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const cPo = cleanStr(poVal).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cOcr.includes(cPo) || cPo.includes(cOcr)) return false;
      
      const wOcr = new Set(cOcr.split(' ').filter(w => w.length > 2));
      const wPo = new Set(cPo.split(' ').filter(w => w.length > 2));
      if (wOcr.size === 0 || wPo.size === 0) return true;
      
      let common = 0;
      for (const w of wOcr) {
        if (wPo.has(w)) common++;
      }
      const ratio = common / Math.min(wOcr.size, wPo.size);
      return ratio < 0.5;
    }
    
    const cOcr = cleanStr(ocrVal).replace(/[^a-z0-9]/g, '');
    const cPo = cleanStr(poVal).replace(/[^a-z0-9]/g, '');
    return !cOcr.includes(cPo) && !cPo.includes(cOcr);
  };

  // Enforce Role Based Access Control
  if (user?.role !== 'MANUFACTURER' && user?.role !== 'ADMIN') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="premium-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px' }}>
          <Lock size={48} style={{ color: '#ef4444', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700 }}>MTC Access Denied</h2>
          <p style={{ color: '#94a3b8', marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Only authorized **Manufacturers** or **Admins** are permitted to access SCM Mill Test Certificates verification pipelines.
          </p>
        </div>
      </div>
    );
  }

  if (user?.role === 'ADMIN') {
    return (
      <div className="page-container">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>MTC Verification Control Tower</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Review, audit, verify and manage Mill Test Certificates (MTC) uploaded by manufacturer centers across SCM pipelines.
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

        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
          {adminLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading SCM Certificates...</div>
          ) : adminMtcs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <FileText size={40} style={{ color: '#334155', marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
              <h3>No Mill Test Certificates Found</h3>
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0, border: 'none' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Manufacturer</th>
                    <th>Version</th>
                    <th>Match Score</th>
                    <th>Approval Status</th>
                    <th>Submitted Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminMtcs.map((mtc) => (
                    <tr key={mtc.id}>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>{mtc.poNumber}</td>
                      <td>{mtc.uploadedBy}</td>
                      <td>v{mtc.versionNumber || 1}</td>
                      <td>
                        <span style={{ color: (mtc.ocrMatchScore || 100) >= 90 ? '#22c55e' : (mtc.ocrMatchScore || 100) >= 70 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
                          {mtc.ocrMatchScore ? `${Math.round(mtc.ocrMatchScore)}%` : '100%'}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={getStatusBadgeStyle(mtc.validationResult || 'APPROVED')}>
                          {mtc.validationResult || 'APPROVED'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {new Date(mtc.uploadedAt).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', width: '130px', minWidth: '130px', position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedMtcDetails(mtc)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                            title="View MTC Details"
                          >
                            View
                          </button>
                          
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === mtc.id ? null : mtc.id);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                              title="More Actions"
                            >
                              <MoreVertical size={12} />
                            </button>

                            {openDropdownId === mtc.id && (
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
                                minWidth: '130px',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '0.25rem'
                              }}>
                                {(mtc.validationResult === 'SUPPLIER_REVIEW' || mtc.validationResult === 'PENDING') && (
                                  <>
                                    <button
                                      onClick={() => { handleApproveMtc(mtc.id); setOpenDropdownId(null); }}
                                      className="dropdown-item"
                                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                      title="Approve MTC"
                                    >
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      onClick={() => { handleRejectMtc(mtc.id); setOpenDropdownId(null); }}
                                      className="dropdown-item"
                                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                      title="Reject MTC"
                                    >
                                      <span>Reject</span>
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => { downloadMtcPdf(mtc.id); setOpenDropdownId(null); }}
                                  className="dropdown-item"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                  title="Download MTC PDF"
                                >
                                  <span>Download PDF</span>
                                </button>

                                <button
                                  onClick={() => { handleDeleteMtc(mtc.id); setOpenDropdownId(null); }}
                                  className="dropdown-item"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                  title="Delete MTC Certificate"
                                >
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MTC Details View Modal */}
        {selectedMtcDetails && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1050, padding: '2rem'
          }}>
            <div className="premium-card" style={{
              width: '100%', maxWidth: '650px',
              backgroundColor: '#111827', border: '1px solid #334155',
              padding: '2.5rem', borderRadius: '16px',
              maxHeight: '90vh', overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 600 }}>MTC Specification Audit</h3>
                <button onClick={() => setSelectedMtcDetails(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Close</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                <div><strong>PO Number:</strong> <span style={{ color: '#fff' }}>{selectedMtcDetails.poNumber}</span></div>
                <div><strong>Manufacturer:</strong> <span style={{ color: '#fff' }}>{selectedMtcDetails.uploadedBy}</span></div>
                <div><strong>Grade:</strong> <span style={{ color: '#3b82f6', fontWeight: 600 }}>{selectedMtcDetails.grade || 'N/A'}</span></div>
                <div><strong>Heat Number:</strong> <span style={{ color: '#22c55e', fontWeight: 600 }}>{selectedMtcDetails.heatNumber || 'N/A'}</span></div>
                <div><strong>Dimension:</strong> <span style={{ color: '#fff' }}>{selectedMtcDetails.dimension || 'N/A'}</span></div>
                <div><strong>Quantity:</strong> <span style={{ color: '#fff' }}>{selectedMtcDetails.quantity || 'N/A'}</span></div>
                
                <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', borderTop: '1px solid #1e293b', paddingTop: '0.75rem' }}>
                  <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Chemical Composition</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
                    <div style={{ backgroundColor: '#1e293b', padding: '0.25rem', borderRadius: '4px' }}>C: {selectedMtcDetails.carbon || 0}%</div>
                    <div style={{ backgroundColor: '#1e293b', padding: '0.25rem', borderRadius: '4px' }}>Cr: {selectedMtcDetails.chromium || 0}%</div>
                    <div style={{ backgroundColor: '#1e293b', padding: '0.25rem', borderRadius: '4px' }}>Ni: {selectedMtcDetails.nickel || 0}%</div>
                    <div style={{ backgroundColor: '#1e293b', padding: '0.25rem', borderRadius: '4px' }}>Mo: {selectedMtcDetails.molybdenum || 0}%</div>
                    <div style={{ backgroundColor: '#1e293b', padding: '0.25rem', borderRadius: '4px' }}>Mn: {selectedMtcDetails.manganese || 0}%</div>
                    <div style={{ backgroundColor: '#1e293b', padding: '0.25rem', borderRadius: '4px' }}>Si: {selectedMtcDetails.silicon || 0}%</div>
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', borderTop: '1px solid #1e293b', paddingTop: '0.75rem' }}>
                  <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Mechanical Properties</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
                    <div style={{ backgroundColor: '#1e293b', padding: '0.25rem', borderRadius: '4px' }}>Yield: {selectedMtcDetails.yieldStrength || 0} MPa</div>
                    <div style={{ backgroundColor: '#1e293b', padding: '0.25rem', borderRadius: '4px' }}>Tensile: {selectedMtcDetails.tensileStrength || 0} MPa</div>
                    <div style={{ backgroundColor: '#1e293b', padding: '0.25rem', borderRadius: '4px' }}>Elongation: {selectedMtcDetails.elongation || 0}%</div>
                    <div style={{ backgroundColor: '#1e293b', padding: '0.25rem', borderRadius: '4px' }}>Hardness: {selectedMtcDetails.hardness || 0} HB</div>
                  </div>
                </div>

                {selectedMtcDetails.rejectionComment && (
                  <div style={{ gridColumn: 'span 2', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px', color: '#ef4444', marginTop: '0.5rem' }}>
                    <strong>Rejection Comment:</strong> {selectedMtcDetails.rejectionComment}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const uploaderStyle = {
    border: dragActive ? '2px dashed #22c55e' : '2px dashed #334155',
    backgroundColor: dragActive ? 'rgba(34, 197, 94, 0.03)' : 'rgba(30, 41, 59, 0.2)',
    borderRadius: '12px',
    padding: '3rem 2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  };

  const selectedPo = pos.find(p => p.poNumber === selectedPoNumber);

  const getActiveStep = () => {
    if (!ocrResult) return 1;
    return 2;
  };

  const activeStep = getActiveStep();

  const calculateScoreAndMatches = () => {
    if (!ocrResult || !selectedPo) {
      // return { score: 0, fields: [], matches: { gradeMatch: true, dimMatch: true, qtyMatch: true, heatMatch: true, descMatch: true, batchMatch: true } };
      return {
        score: 0,
        fields: [],
        matches: {
          materialNameMatch: true,
          gradeMatch: true,
          dimMatch: true,
          qtyMatch: true,
          heatMatch: true,
          batchMatch: true,
          descMatch: true
        }
     };
    }

    // Helper to normalize grade
    const normalizeGrade = (g) => {
      if (!g) return "";
      let clean = g.toUpperCase().replace(/[^A-Z0-9]/g, "");
      while (clean.startsWith("GRADE") || clean.startsWith("GR") || clean.startsWith("SS")) {
        if (clean.startsWith("GRADE")) {
          clean = clean.substring(5);
        } else if (clean.startsWith("GR")) {
          clean = clean.substring(2);
        } else if (clean.startsWith("SS")) {
          clean = clean.substring(2);
        }
      }
      return clean;
    };

    // Helper to fuzzy match descriptions
    const checkFuzzyDescMatch = (s1, s2) => {
      if (!s1 && !s2) return true;
      if (!s1 || !s2) return false;
      const clean1 = s1.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      const clean2 = s2.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (clean1.includes(clean2) || clean2.includes(clean1)) {
        return true;
      }
      const w1 = clean1.split(" ").filter(w => w.trim().length > 2);
      const w2 = clean2.split(" ").filter(w => w.trim().length > 2);
      if (w1.length === 0 || w2.length === 0) return false;
      
      const set2 = new Set(w2);
      let common = 0;
      w1.forEach(w => {
        if (set2.has(w)) common++;
      });
      
      const unionSize = new Set([...w1, ...w2]).size;
      const jaccard = common / unionSize;
      const ratio = common / Math.min(w1.length, w2.length);
      return jaccard >= 0.3 || ratio >= 0.5;
    };

    // Helper to extract numbers
    const extractNumbers = (text) => {
      if (!text) return [];
      const matches = text.match(/(\d+(?:\.\d+)?)/g);
      return matches ? matches.map(Number) : [];
    };

    // Helper for dimension match
    const checkDimensionMatch = (poDim, ocrDim) => {
      if (!poDim && !ocrDim) return true;
      if (!poDim || !ocrDim) return false;
      const poNums = extractNumbers(poDim);
      const ocrNums = extractNumbers(ocrDim);
      if (poNums.length > 0 && ocrNums.length > 0) {
        if (poNums.length === ocrNums.length) {
          let allMatch = true;
          for (let i = 0; i < poNums.length; i++) {
            if (Math.abs(poNums[i] - ocrNums[i]) > 0.1) {
              allMatch = false;
              break;
            }
          }
          if (allMatch) return true;
        }
        
        const larger = poNums.length >= ocrNums.length ? poNums : ocrNums;
        const smaller = poNums.length < ocrNums.length ? poNums : ocrNums;
        let matchCount = 0;
        let lastIdx = -1;
        smaller.forEach(s => {
          for (let i = lastIdx + 1; i < larger.length; i++) {
            if (Math.abs(larger[i] - s) < 0.1) {
              matchCount++;
              lastIdx = i;
              break;
            }
          }
        });
        if (matchCount / smaller.length >= 0.9) return true;
      }
      
      const dPoClean = poDim.toLowerCase().replace(/\b(mm|inch|in|meter|m)\b/g, "").replace(/[\s\-x\*\.]/g, "");
      const dOcrClean = ocrDim.toLowerCase().replace(/\b(mm|inch|in|meter|m)\b/g, "").replace(/[\s\-x\*\.]/g, "");
      return dPoClean === dOcrClean || dPoClean.includes(dOcrClean) || dOcrClean.includes(dPoClean);
    };

    // Helper for quantity numeric parse
    const parseNumeric = (text) => {
      if (!text) return 0;
      const m = text.match(/(\d+(?:\.\d+)?)/);
      return m ? parseFloat(m[1]) : 0;
    };

    
    // const materialNameMatch = checkFuzzyDescMatch(selectedPo.material, ocrResult.previewData?.materialName) && checkFuzzyDescMatch(selectedPo.material, previewForm.materialName);
    
    const materialNameMatch = true;
    const normPoGrade = normalizeGrade(selectedPo.grade);
    const normOcrGrade = normalizeGrade(ocrResult.previewData?.grade);
    const normMtcGrade = normalizeGrade(previewForm.grade);
    const gradeMatch = !!(normPoGrade && normOcrGrade && (normPoGrade === normOcrGrade || normPoGrade.includes(normOcrGrade) || normOcrGrade.includes(normOcrGrade))) && 
                       !!(normPoGrade && normMtcGrade && (normPoGrade === normMtcGrade || normPoGrade.includes(normMtcGrade) || normMtcGrade.includes(normMtcGrade)));

    const dimMatch = checkDimensionMatch(selectedPo.dimension, ocrResult.previewData?.dimension) && checkDimensionMatch(selectedPo.dimension, previewForm.dimension);

    const checkQtyMatch = (poQty, otherQty) => {
      if (!poQty && !otherQty) return true;
      if (!poQty || !otherQty) return false;
      const numPo = parseNumeric(poQty);
      const numOther = parseNumeric(otherQty);
      if (numPo > 0 && numOther > 0) {
        if (Math.abs(numPo - numOther) < 0.1) return true;
        const ratio = Math.min(numPo, numOther) / Math.max(numPo, numOther);
        return ratio >= 0.9;
      }
      const qPoClean = poQty.toLowerCase().replace(/[\s\.\-]/g, "").replace(/(pcs|pieces|unit|kg|tons|ton)/g, "");
      const qOtherClean = otherQty.toLowerCase().replace(/[\s\.\-]/g, "").replace(/(pcs|pieces|unit|kg|tons|ton)/g, "");
      return qPoClean === qOtherClean || qPoClean.includes(qOtherClean) || qOtherClean.includes(qPoClean);
    };
    const qtyMatch = checkQtyMatch(selectedPo.quantity, ocrResult.previewData?.quantity) && checkQtyMatch(selectedPo.quantity, previewForm.quantity);

    const heatMatch = !!(ocrResult.previewData?.heatNumber?.trim()) && !!(previewForm.heatNumber?.trim());
    const batchMatch = !!(ocrResult.previewData?.batchNumber?.trim()) && !!(previewForm.batchNumber?.trim());

    // Compare PO Description, OCR Description, MTC Description Only
    // const poDesc = selectedPo.materialDescription || "";
    // const ocrDesc = ocrResult.previewData?.materialDescription || "";
    // const mtcDesc = previewForm.materialDescription || "";
    // const descMatch = checkFuzzyDescMatch(poDesc, ocrDesc) && checkFuzzyDescMatch(poDesc, mtcDesc);

    let score = 0;
    if (gradeMatch) score += 25;
    if (dimMatch) score += 25;
    if (qtyMatch) score += 25;
    if (heatMatch) score += 15;
    if (batchMatch) score += 10;

    const fields = [
      {
        name: 'Grade',
        poVal: selectedPo.grade || 'N/A',
        ocrVal: ocrResult.previewData?.grade || 'N/A',
        mtcVal: previewForm.grade || 'N/A',
        isMatch: gradeMatch,
        mismatchReason: `Grade mismatch:
OCR extracted "${ocrResult.previewData?.grade || 'N/A'}"
Expected:
"${selectedPo.grade || 'N/A'}"`
      },
      {
        name: 'Dimension',
        poVal: selectedPo.dimension || 'N/A',
        ocrVal: ocrResult.previewData?.dimension || 'N/A',
        mtcVal: previewForm.dimension || 'N/A',
        isMatch: dimMatch,
        mismatchReason: `Dimension mismatch:
OCR extracted "${ocrResult.previewData?.dimension || 'N/A'}"
Expected:
"${selectedPo.dimension || 'N/A'}"`
      },
      {
        name: 'Quantity',
        poVal: selectedPo.quantity || 'N/A',
        ocrVal: ocrResult.previewData?.quantity || 'N/A',
        mtcVal: previewForm.quantity || 'N/A',
        isMatch: qtyMatch,
        mismatchReason: `Quantity mismatch:
OCR extracted "${ocrResult.previewData?.quantity || 'N/A'}"
Expected:
"${selectedPo.quantity || 'N/A'}"`
      },
      {
        name: 'Heat Number',
        poVal: 'N/A',
        ocrVal: ocrResult.previewData?.heatNumber || 'N/A',
        mtcVal: previewForm.heatNumber || 'N/A',
        isMatch: heatMatch,
        mismatchReason: `Heat Number mismatch:
OCR extracted "${ocrResult.previewData?.heatNumber || 'N/A'}"
MTC has "${previewForm.heatNumber || 'N/A'}"`
      },
      {
        name: 'Batch Number',
        poVal: 'N/A',
        ocrVal: ocrResult.previewData?.batchNumber || 'N/A',
        mtcVal: previewForm.batchNumber || 'N/A',
        isMatch: batchMatch,
        mismatchReason: `Batch Number mismatch:
OCR extracted "${ocrResult.previewData?.batchNumber || 'N/A'}"
MTC has "${previewForm.batchNumber || 'N/A'}"`
      }
    ];

    return { score, fields, matches: { materialNameMatch: true, gradeMatch, dimMatch, qtyMatch, heatMatch, batchMatch, descMatch: true } };
  };

  const renderValidationPanel = () => {
    if (!ocrResult || !selectedPo) return null;

    const { score: displayScore, fields } = calculateScoreAndMatches();
    const ocrConfidence = ocrResult.ocrConfidence;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Decision Panel */}
        {displayScore < 80 ? (
          <div style={{ padding: '1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ❌ VALIDATION BLOCKED
            </h4>
            <p style={{ fontSize: '0.85rem', margin: '0.5rem 0 0 0', color: '#fca5a5' }}>
              Match score is too low ({displayScore}%). Certificate creation is blocked. Please upload a correct certificate or check OCR values.
            </p>
          </div>
        ) : (
          <div style={{ padding: '1.25rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: '#f59e0b' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ REVIEW REQUIRED
            </h4>
            <p style={{ fontSize: '0.85rem', margin: '0.5rem 0 0 0', color: '#fcd34d' }}>
              Match score is {displayScore}%. Review the mismatched fields below before clicking "Approve & Generate MTC".
            </p>
          </div>
        )}

        {/* Score & Confidence */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Weighted Match Score</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: displayScore >= 80 ? '#22c55e' : '#ef4444' }}>
              {displayScore}%
            </span>
          </div>
          <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>OCR Confidence</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
              {ocrConfidence ? `${Math.round(ocrConfidence)}%` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
          <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', backgroundColor: '#1e293b' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>Field</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>PO</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>OCR</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>MTC</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => {
                const highlightRed = !field.isMatch;
                return (
                  <React.Fragment key={field.name}>
                    <tr 
                      style={{ 
                        borderBottom: '1px solid #334155', 
                        backgroundColor: highlightRed ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: highlightRed ? '#fca5a5' : '#ffffff' }}>
                        {field.name}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                        {field.poVal}
                      </td>
                      <td style={{ padding: '0.75rem', color: highlightRed ? '#fca5a5' : '#cbd5e1' }}>
                        {field.ocrVal}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#cbd5e1', fontWeight: 500 }}>
                        {field.mtcVal}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span 
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: field.isMatch ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: field.isMatch ? '#22c55e' : '#ef4444'
                          }}
                        >
                          {field.isMatch ? 'MATCH' : 'MISMATCH'}
                        </span>
                      </td>
                    </tr>
                    {highlightRed && (
                      <tr style={{ backgroundColor: 'rgba(239, 68, 68, 0.03)' }}>
                        <td colSpan={5} style={{ padding: '0.5rem 0.75rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'pre-line', borderBottom: '1px solid #334155' }}>
                          ⚠️ {field.mismatchReason}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const { score: dynamicScore, matches: dynamicMatches } = calculateScoreAndMatches();

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>AI MTC Certificate Generator</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Upload Mill Test Certificates, auto-extract chemistry spec tables, and submit structured certificates for client approval.
        </p>
      </div>

      {/* Visual Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', backgroundColor: '#1e293b', padding: '1rem 2rem', borderRadius: '10px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: activeStep === 1 ? '#22c55e' : activeStep > 1 ? 'rgba(34, 197, 94, 0.15)' : '#334155', color: activeStep >= 1 ? '#22c55e' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, border: activeStep === 1 ? '2px solid #22c55e' : '1px solid #334155' }}>1</div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: activeStep === 1 ? '#ffffff' : '#94a3b8' }}>Upload Image</span>
        </div>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#334155', margin: '0 1.5rem' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: activeStep === 2 ? '#22c55e' : activeStep > 2 ? 'rgba(34, 197, 94, 0.15)' : '#334155', color: activeStep >= 2 ? '#22c55e' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, border: activeStep === 2 ? '2px solid #22c55e' : '1px solid #334155' }}>2</div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: activeStep === 2 ? '#ffffff' : '#94a3b8' }}>Review & Confirm</span>
        </div>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#334155', margin: '0 1.5rem' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: activeStep === 3 ? '#22c55e' : '#334155', color: activeStep === 3 ? '#22c55e' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, border: activeStep === 3 ? '2px solid #22c55e' : '1px solid #334155' }}>3</div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: activeStep === 3 ? '#ffffff' : '#94a3b8' }}>Result</span>
        </div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem', alignItems: 'start', marginBottom: '2rem' }}>
        {/* Upload Certificate Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UploadCloud size={18} style={{ color: '#22c55e' }} />
              <span>Upload Compliance Certificate</span>
            </h3>

            {/* Target Purchase Order (Awaiting MTC) */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Target Purchase Order (Awaiting MTC)</label>
              <select 
                value={selectedPoNumber} 
                onChange={(e) => {
                  setSelectedPoNumber(e.target.value);
                  setOcrResult(null);
                }}
                className="form-input"
                style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.65rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
              >
                <option value="">-- Select Awaiting Purchase Order --</option>
                {pos.map(po => (
                  <option key={po.id} value={po.poNumber}>
                    {po.poNumber} — {po.material} ({po.grade})
                  </option>
                ))}
              </select>
              {pos.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  💡 Accept orders and trigger "Start Production" on the Production Queue to list them here.
                </p>
              )}
            </div>

            {/* File Dropzone */}
            <div
              style={uploaderStyle}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('mtc-picker').click()}
            >
              <input
                id="mtc-picker"
                type="file"
                style={{ display: 'none' }}
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              <FileText size={40} style={{ color: dragActive ? '#22c55e' : '#94a3b8' }} />
              <div>
                <span style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 500 }}>
                  Drag & drop MTC file here
                </span>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Supports PDF, PNG, JPG, or JPEG formats
                </p>
              </div>
              {file && (
                <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.15)', padding: '0.4rem 0.8rem', borderRadius: '6px', color: '#22c55e', fontSize: '0.85rem' }}>
                  Selected: {file.name}
                </div>
              )}
              <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Browse Files
              </button>
            </div>

            {/* Image Preview inside left column */}
            {previewUrl && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Uploaded Label / Certificate Image</span>
                <img 
                  src={previewUrl} 
                  alt="MTC Upload Preview" 
                  style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', border: '1px solid #334155', objectFit: 'contain' }}
                />
              </div>
            )}

            {file && file.name.endsWith('.pdf') && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '8px', border: '1px solid #334155' }}>
                <FileText size={48} style={{ color: '#3b82f6', margin: '0 auto 0.5rem auto', display: 'block' }} />
                <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>{file.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '0.25rem' }}>PDF document uploaded for processing</span>
              </div>
            )}

            {file && selectedPoNumber && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.5rem', height: '46px' }}
                onClick={handleUploadSubmit}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    <span>Processing AI Extraction...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Run AI OCR & Generate MTC</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic AI Verification & Review Panel */}
        {ocrResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Validation Panel */}
            <div className="premium-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} style={{ color: '#3b82f6' }} />
                <span>AI Compliance Match Status</span>
              </h3>
              {renderValidationPanel()}
            </div>

            {/* Preview Form */}
            <div className="premium-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
                AI OCR Parameter Preview & Specifications
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
                
                {/* Material Name */}
                {/* <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Material Name</span>
                    {!dynamicMatches.materialNameMatch && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500 }}>
                        ⚠️ Mismatch (PO: {selectedPo?.material})
                      </span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={previewForm.materialName}
                    onChange={(e) => setPreviewForm({ ...previewForm, materialName: e.target.value })}
                    style={{ 
                      width: '100%', 
                      borderColor: !dynamicMatches.materialNameMatch ? '#ef4444' : '#334155',
                      color: !dynamicMatches.materialNameMatch ? '#ef4444' : '#ffffff'
                    }}
                  />
                </div> */}

                {/* Grade */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Material Grade</span>
                    {!dynamicMatches.gradeMatch && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500 }}>
                        ⚠️ Mismatch (PO: {selectedPo?.grade})
                      </span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={previewForm.grade}
                    onChange={(e) => setPreviewForm({ ...previewForm, grade: e.target.value })}
                    style={{ 
                      width: '100%', 
                      borderColor: !dynamicMatches.gradeMatch ? '#ef4444' : '#334155',
                      color: !dynamicMatches.gradeMatch ? '#ef4444' : '#ffffff'
                    }}
                  />
                </div>


                {/* Quantity */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Quantity</span>
                    {!dynamicMatches.qtyMatch && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500 }}>
                        ⚠️ Mismatch (PO: {selectedPo?.quantity})
                      </span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={previewForm.quantity}
                    onChange={(e) => setPreviewForm({ ...previewForm, quantity: e.target.value })}
                    style={{ 
                      width: '100%', 
                      borderColor: !dynamicMatches.qtyMatch ? '#ef4444' : '#334155',
                      color: !dynamicMatches.qtyMatch ? '#ef4444' : '#ffffff'
                    }}
                  />
                </div>

                {/* Dimension */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Dimension</span>
                    {!dynamicMatches.dimMatch && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500 }}>
                        ⚠️ Mismatch (PO: {selectedPo?.dimension})
                      </span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={previewForm.dimension}
                    onChange={(e) => setPreviewForm({ ...previewForm, dimension: e.target.value })}
                    style={{ 
                      width: '100%', 
                      borderColor: !dynamicMatches.dimMatch ? '#ef4444' : '#334155',
                      color: !dynamicMatches.dimMatch ? '#ef4444' : '#ffffff'
                    }}
                  />
                </div>

                {/* Heat Number */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Heat Number</span>
                    {!dynamicMatches.heatMatch && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500 }}>
                        ⚠️ Heat Number Missing / Invalid
                      </span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={previewForm.heatNumber}
                    onChange={(e) => setPreviewForm({ ...previewForm, heatNumber: e.target.value })}
                    style={{ 
                      width: '100%',
                      borderColor: !dynamicMatches.heatMatch ? '#ef4444' : '#334155',
                      color: !dynamicMatches.heatMatch ? '#ef4444' : '#ffffff'
                    }}
                  />
                </div>

                {/* Batch Number */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Batch Number</span>
                    {!dynamicMatches.batchMatch && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500 }}>
                        ⚠️ Batch Number Missing
                      </span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={previewForm.batchNumber}
                    onChange={(e) => setPreviewForm({ ...previewForm, batchNumber: e.target.value })}
                    style={{ 
                      width: '100%',
                      borderColor: !dynamicMatches.batchMatch ? '#ef4444' : '#334155',
                      color: !dynamicMatches.batchMatch ? '#ef4444' : '#ffffff'
                    }}
                  />
                </div>
              </div>

              {/* Chemical Matrix */}
              <h4 style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                Chemical Composition Matrix (Weight %)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {['carbon', 'chromium', 'nickel', 'molybdenum', 'manganese', 'silicon'].map(elem => (
                  <div key={elem} className="form-group">
                    <label className="form-label" style={{ textTransform: 'capitalize' }}>{elem}</label>
                    <input 
                      type="number" 
                      step="0.001"
                      className="form-input" 
                      value={previewForm[elem]}
                      onChange={(e) => setPreviewForm({ ...previewForm, [elem]: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', textAlign: 'center' }}
                    />
                  </div>
                ))}
              </div>

              {/* Mechanical Testing */}
              <h4 style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                Mechanical & Tensile Properties
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                {[
                  { key: 'yieldStrength', label: 'Yield Strength (MPa)' },
                  { key: 'tensileStrength', label: 'Tensile Strength (MPa)' },
                  { key: 'elongation', label: 'Elongation (%)' },
                  { key: 'hardness', label: 'Hardness (HB)' }
                ].map(prop => (
                  <div key={prop.key} className="form-group">
                    <label className="form-label">{prop.label}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={previewForm[prop.key]}
                      onChange={(e) => setPreviewForm({ ...previewForm, [prop.key]: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', textAlign: 'center' }}
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setOcrResult(null);
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  Clear Preview
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ 
                    backgroundColor: dynamicScore >= 80 ? '#22c55e' : '#475569', 
                    borderColor: dynamicScore >= 80 ? '#22c55e' : '#475569', 
                    color: dynamicScore >= 80 ? '#ffffff' : '#94a3b8', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.4rem',
                    cursor: dynamicScore >= 80 ? 'pointer' : 'not-allowed'
                  }}
                  onClick={handleManualGenerate}
                  disabled={uploading || dynamicScore < 80}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={14} className="spinning" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>Approve & Generate MTC</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MTC Registry Version Logs */}
      <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} style={{ color: '#3b82f6' }} />
          <span>MTC Version Logs & Verification History</span>
        </h3>

        {mtcHistory.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', border: '1px dashed #334155', borderRadius: '8px' }}>
            <FileText size={32} style={{ color: '#334155', marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.85rem' }}>No compliance certificates uploaded yet.</p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Certificate Reference</th>
                  <th>PO Linked</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Upload Date</th>
                  <th>Match Score</th>
                  <th>Supplier Comment</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mtcHistory.map(doc => (
                  <tr key={doc.id}>
                    <td style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.85rem' }}>
                      {doc.certificateNumber || `MTC-${doc.id}`}
                    </td>
                    <td>{doc.poNumber}</td>
                    <td style={{ fontWeight: 600 }}>v{doc.versionNumber || 1}</td>
                    <td>
                      <span className="badge" style={getStatusBadgeStyle(doc.status)}>
                        {doc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{new Date(doc.uploadedAt || doc.issueDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{doc.ocrMatchScore != null ? `${doc.ocrMatchScore}%` : 'N/A'}</td>
                    <td style={{ color: '#ef4444', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      {doc.rejectionComment || '—'}
                    </td>
                    <td style={{ textAlign: 'right', width: '130px', minWidth: '130px', position: 'relative' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => downloadMtcPdf(doc.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          title="Download MTC PDF"
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

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
