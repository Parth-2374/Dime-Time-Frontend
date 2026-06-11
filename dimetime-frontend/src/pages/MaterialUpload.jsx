import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  Layers, 
  Zap, 
  Info,
  Lock,
  Activity,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Image,
  Cpu,
  ListOrdered,
  MoreVertical
} from 'lucide-react';

export default function MaterialUpload({ user }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // SCM PO & Reconciliation States
  const [pos, setPos] = useState([]);
  const [selectedPoNumber, setSelectedPoNumber] = useState('');
  const [poDetails, setPoDetails] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [latestMtc, setLatestMtc] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // SCM OCR Registry States
  const [uploads, setUploads] = useState([]);
  const [activeTab, setActiveTab] = useState('VERIFICATION');
  const [editingUpload, setEditingUpload] = useState(null);
  const [viewingUploadDetails, setViewingUploadDetails] = useState(null);
  const [editUploadFormData, setEditUploadFormData] = useState({
    grade: '',
    quantity: '',
    dimension: '',
    heatNumber: '',
    batchNumber: '',
    visualMaterial: ''
  });
  
  const navigate = useNavigate();
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      const response = await axios.get('https://dime-time-backend.onrender.com/api/material-uploads');
      if (response.data) {
        setUploads(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch SCM OCR uploads', err);
    }
  };

  const handleReprocessOcr = async (id) => {
    try {
      setSuccess('');
      setError('');
      const response = await axios.post(`https://dime-time-backend.onrender.com/api/material-uploads/${id}/reprocess?operator=${user.username}`);
      if (response.status === 200) {
        setSuccess('OCR analysis reprocessed successfully. Confidence levels updated.');
        fetchUploads();
      }
    } catch (err) {
      setError('Failed to reprocess OCR metadata.');
    }
  };

  const handleDeleteUpload = async (id, fileName) => {
    if (!window.confirm(`Are you sure you want to delete SCM OCR record for file ${fileName}?`)) return;
    try {
      setSuccess('');
      setError('');
      const response = await axios.delete(`https://dime-time-backend.onrender.com/api/material-uploads/${id}?operator=${user.username}`);
      if (response.status === 200) {
        setSuccess('Material upload record deleted successfully.');
        fetchUploads();
      }
    } catch (err) {
      setError('Failed to delete OCR record.');
    }
  };

  const handleEditUploadClick = (upload) => {
    setEditingUpload(upload);
    setEditUploadFormData({
      grade: upload.grade || '',
      quantity: upload.quantity || '',
      dimension: upload.dimension || '',
      heatNumber: upload.heatNumber || '',
      batchNumber: upload.batchNumber || '',
      visualMaterial: upload.visualMaterial || ''
    });
  };

  const handleEditUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`https://dime-time-backend.onrender.com/api/material-uploads/${editingUpload.id}?operator=${user.username}`, {
        ...editingUpload,
        grade: editUploadFormData.grade,
        quantity: editUploadFormData.quantity,
        dimension: editUploadFormData.dimension,
        heatNumber: editUploadFormData.heatNumber,
        batchNumber: editUploadFormData.batchNumber,
        visualMaterial: editUploadFormData.visualMaterial
      });
      if (response.status === 200) {
        setSuccess('OCR record updated successfully.');
        setEditingUpload(null);
        fetchUploads();
      }
    } catch (err) {
      setError('Failed to update OCR record.');
    }
  };

  useEffect(() => {
    const fetchMtc = async () => {
      if (selectedPoNumber) {
        try {
          const response = await axios.get(`https://dime-time-backend.onrender.com/api/mtc-documents?poNumber=${selectedPoNumber}`);
          if (response.data && response.data.length > 0) {
            setLatestMtc(response.data[0]);
          } else {
            setLatestMtc(null);
          }
        } catch (err) {
          console.error("Failed to load linked MTC details", err);
          setLatestMtc(null);
        }
      } else {
        setLatestMtc(null);
      }
    };
    fetchMtc();
  }, [selectedPoNumber]);

  useEffect(() => {
    if (user?.role === 'SUPPLIER' || user?.role === 'ADMIN') {
      fetchPurchaseOrders();
    }
  }, [user]);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get('https://dime-time-backend.onrender.com/api/purchase-orders');
      if (response.data) {
        const activePos = response.data.filter(po => 
          !['COMPLETED', 'CLOSED', 'GRN_GENERATED'].includes(po.status)
        );
        setPos(activePos);
      }
    } catch (err) {
      console.error('Failed to fetch SCM Purchase Orders', err);
    }
  };

  const handlePoChange = (e) => {
    const poNum = e.target.value;
    setSelectedPoNumber(poNum);
    const details = pos.find(p => p.poNumber === poNum);
    setPoDetails(details);
    setOcrData(null);
    setVerificationResult(null);
    setError('');
    setSuccess('');
  };

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid tag photo (PNG, JPG, JPEG)');
      return;
    }

    setError('');
    setFile(selectedFile);
    setOcrData(null);
    setVerificationResult(null);
    
    // Create browser preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(selectedFile);
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

  const cleanStr = (val) => String(val || '').trim().toLowerCase();

  const cleanGrade = (grade) => {
    if (!grade) return "";
    return cleanStr(grade).replace(/[^a-z0-9]/g, '').replace('grade', '').replace('gr', '').replace('ss', '');
  };

  const checkGradeMatch = (poGrade, ocrGrade, mtcGrade) => {
    if (!poGrade || !ocrGrade || !mtcGrade) return false;
    const cgPo = cleanGrade(poGrade);
    const cgOcr = cleanGrade(ocrGrade);
    const cgMtc = cleanGrade(mtcGrade);
    return cgPo === cgOcr && cgOcr === cgMtc;
  };

  const checkFuzzyDescMatch = (s1, s2) => {
    if (!s1 || !s2) return false;
    const clean1 = cleanStr(s1).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const clean2 = cleanStr(s2).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
    
    const w1 = new Set(clean1.split(' ').filter(w => w.length > 2));
    const w2 = new Set(clean2.split(' ').filter(w => w.length > 2));
    if (w1.size === 0 || w2.size === 0) return false;
    
    let common = 0;
    for (const w of w1) {
      if (w2.has(w)) common++;
    }
    const ratio = common / Math.min(w1.size, w2.size);
    return ratio >= 0.5;
  };

  const checkDescriptionMatch = (poDesc, ocrDesc, mtcDesc) => {
    if (!poDesc || !ocrDesc || !mtcDesc) return false;
    return checkFuzzyDescMatch(poDesc, ocrDesc) && checkFuzzyDescMatch(ocrDesc, mtcDesc);
  };

  const extractNums = (s) => {
    const matches = [...String(s || '').matchAll(/(\d+(?:\.\d+)?)/g)];
    return matches.map(m => parseFloat(m[1]));
  };

  const checkDimMatchSingle = (dim1, dim2) => {
    if (!dim1 || !dim2) return false;
    const nums1 = extractNums(dim1);
    const nums2 = extractNums(dim2);
    if (nums1.length > 0 && nums2.length > 0) {
      if (nums1.length === nums2.length) {
        const allMatch = nums1.every((val, idx) => Math.abs(val - nums2[idx]) < 0.1);
        if (allMatch) return true;
      }
      const larger = nums1.length >= nums2.length ? nums1 : nums2;
      const smaller = nums1.length < nums2.length ? nums1 : nums2;
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
      if (matchCount / smaller.length >= 0.9) return true;
    }
    const c1 = cleanStr(dim1).replace(/[^a-z0-9]/g, '').replace('mm', '').replace('inch', '').replace('in', '');
    const c2 = cleanStr(dim2).replace(/[^a-z0-9]/g, '').replace('mm', '').replace('inch', '').replace('in', '');
    return c1.includes(c2) || c2.includes(c1);
  };

  const checkDimensionMatch = (poDim, ocrDim, mtcDim) => {
    return checkDimMatchSingle(poDim, ocrDim) && checkDimMatchSingle(ocrDim, mtcDim);
  };

  const parseNum = (s) => {
    const m = String(s || '').match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  };

  const checkQtyMatchSingle = (qty1, qty2) => {
    if (!qty1 || !qty2) return false;
    const n1 = parseNum(qty1);
    const n2 = parseNum(qty2);
    if (n1 > 0 && n2 > 0) {
      if (Math.abs(n1 - n2) < 0.1) return true;
      const ratio = Math.min(n1, n2) / Math.max(n1, n2);
      return ratio >= 0.9;
    }
    const c1 = cleanStr(qty1).replace(/[^a-z0-9]/g, '').replace('pcs', '').replace('pieces', '').replace('kg', '').replace('ton', '').replace('tons', '');
    const c2 = cleanStr(qty2).replace(/[^a-z0-9]/g, '').replace('pcs', '').replace('pieces', '').replace('kg', '').replace('ton', '').replace('tons', '');
    return c1 === c2;
  };

  const checkQuantityMatch = (poQty, ocrQty, mtcQty) => {
    return checkQtyMatchSingle(poQty, ocrQty) && checkQtyMatchSingle(ocrQty, mtcQty);
  };

  const checkHeatMatch = (ocrHeat, mtcHeat) => {
    if (!ocrHeat || !mtcHeat) return false;
    const hOcr = cleanStr(ocrHeat).replace(/[^a-z0-9-]/g, '');
    const hMtc = cleanStr(mtcHeat).replace(/[^a-z0-9-]/g, '');
    return hOcr.includes(hMtc) || hMtc.includes(hOcr) || hOcr === hMtc;
  };

  const checkBatchMatch = (ocrBatch, mtcBatch) => {
    if (!ocrBatch || !mtcBatch) return false;
    const bOcr = cleanStr(ocrBatch).replace(/[^a-z0-9-]/g, '');
    const bMtc = cleanStr(mtcBatch).replace(/[^a-z0-9-]/g, '');
    return bOcr.includes(bMtc) || bMtc.includes(bOcr) || bOcr === bMtc;
  };

  const getMatchScoreDetails = () => {
    if (!ocrData || !poDetails) {
      return {
        score: 0,
        gradeMatch: false,
        dimMatch: false,
        qtyMatch: false,
        heatMatch: false,
        batchMatch: false,
        status: 'REVIEW_REQUIRED',
        mismatchReasons: []
      };
    }

    const ocrGrade = ocrData.grade;
    const ocrDim = ocrData.dimension;
    const ocrQty = ocrData.quantity;
    const ocrHeat = ocrData.heatNumber;
    const ocrBatch = ocrData.batchNumber;

    const poGrade = poDetails.grade;
    const poDim = poDetails.dimension;
    const poQty = poDetails.quantity;

    const mtcGrade = latestMtc?.grade;
    const mtcDim = latestMtc?.dimension;
    const mtcQty = latestMtc?.quantity;
    const mtcHeat = latestMtc?.heatNumber;
    const mtcBatch = latestMtc?.batchNumber;

    const gradeMatch = checkGradeMatch(poGrade, ocrGrade, mtcGrade);
    const dimMatch = checkDimensionMatch(poDim, ocrDim, mtcDim);
    const qtyMatch = checkQuantityMatch(poQty, ocrQty, mtcQty);
    const heatMatch = checkHeatMatch(ocrHeat, mtcHeat);
    const batchMatch = checkBatchMatch(ocrBatch, mtcBatch);

    let score = 0;
    const mismatchReasons = [];

    if (gradeMatch) score += 25;
    else mismatchReasons.push("Grade mismatch");

    if (dimMatch) score += 25;
    else mismatchReasons.push("Dimension mismatch");

    if (qtyMatch) score += 25;
    else mismatchReasons.push("Quantity mismatch");

    if (heatMatch) score += 15;
    else {
      if (!latestMtc) mismatchReasons.push("MTC certificate missing");
      else if (!ocrHeat) mismatchReasons.push("Heat number missing");
      else mismatchReasons.push("Heat number mismatch");
    }

    if (batchMatch) score += 10;
    else {
      if (!latestMtc) mismatchReasons.push("MTC certificate missing");
      else if (!ocrBatch) mismatchReasons.push("Batch number missing");
      else mismatchReasons.push("Batch number mismatch");
    }

    let status = 'REVIEW_REQUIRED';
    if (gradeMatch && dimMatch && qtyMatch && heatMatch && batchMatch) {
      status = 'APPROVED';
      score = 100;
    }

    return {
      score,
      gradeMatch,
      dimMatch,
      qtyMatch,
      heatMatch,
      batchMatch,
      status,
      mismatchReasons
    };
  };

  const handleRunOcr = async () => {
    if (!file) {
      setError('Please choose a physical material label photo to scan');
      return;
    }
    if (!selectedPoNumber) {
      setError('Please select the corresponding Purchase Order for reconciliation');
      return;
    }

    setOcrLoading(true);
    setError('');
    setSuccess('');
    setOcrData(null);
    setVerificationResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', user?.username || 'supplier');
    formData.append('poNumber', selectedPoNumber);

    try {
      const ocrResponse = await axios.post('https://dime-time-backend.onrender.com/api/material-uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (ocrResponse.status === 200 && ocrResponse.data) {
        setOcrData(ocrResponse.data);
        setSuccess('AI OCR Material Label scanned successfully. Review validation match below.');
      }
    } catch (err) {
      console.error(err);
      setError('OCR extraction failed. Verify if EasyOCR/PyTorch services are online.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleExecuteReconciliation = async () => {
    if (!selectedPoNumber) return;
    setReconciling(true);
    setError('');
    setSuccess('');
    try {
      const recResponse = await axios.post(
        `https://dime-time-backend.onrender.com/api/verification?poNumber=${selectedPoNumber}&verifiedBy=${user?.username || 'supplier'}`
      );
      if (recResponse.status === 200 && recResponse.data) {
        setVerificationResult(recResponse.data);
        setSuccess('AI Reconciliation Complete. Goods Receipt Note (GRN) Auto-Generated!');
        fetchPurchaseOrders();
      }
    } catch (recErr) {
      console.error('AI Reconciliation failed', recErr);
      const msg = recErr.response?.data?.message || recErr.response?.data || recErr.message;
      setError(`AI Reconciliation failed: ${msg}`);
    } finally {
      setReconciling(false);
    }
  };

  // Enforce Supplier Role Based Access
  if (user?.role !== 'SUPPLIER' && user?.role !== 'ADMIN') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="premium-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px' }}>
          <Lock size={48} style={{ color: '#ef4444', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700 }}>Access Denied</h2>
          <p style={{ color: '#94a3b8', marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Only **Suppliers** are authorized to access the Material Receipt OCR portal and perform AI-driven physical label reconciliation.
          </p>
        </div>
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
    position: 'relative'
  };

  const getActiveStep = () => {
    if (verificationResult) return 3;
    if (ocrData) return 2;
    return 1;
  };

  const activeStep = getActiveStep();

  const renderAIComplianceMatchStatus = () => {
    if (!ocrData || !poDetails) return null;

    const {
      score,
      gradeMatch,
      dimMatch,
      qtyMatch,
      heatMatch,
      batchMatch,
      status,
      mismatchReasons
    } = getMatchScoreDetails();

    const ocrConfidence = ocrData.confidence ? ocrData.confidence * 100 : 90;

    const fields = [
      {
        name: 'Grade',
        label1: 'PO Value:',
        val1: poDetails.grade,
        label2: 'OCR Value:',
        val2: ocrData.grade || 'N/A',
        isMatch: gradeMatch
      },
      {
        name: 'Dimension',
        label1: 'PO Value:',
        val1: poDetails.dimension,
        label2: 'OCR Value:',
        val2: ocrData.dimension || 'N/A',
        isMatch: dimMatch
      },
      {
        name: 'Quantity',
        label1: 'PO Value:',
        val1: poDetails.quantity,
        label2: 'OCR Value:',
        val2: ocrData.quantity || 'N/A',
        isMatch: qtyMatch
      },
      {
        name: 'Heat Number',
        label1: 'MTC Value:',
        val1: latestMtc ? latestMtc.heatNumber : 'N/A',
        label2: 'OCR Value:',
        val2: ocrData.heatNumber || 'N/A',
        isMatch: heatMatch
      },
      {
        name: 'Batch Number',
        label1: 'MTC Value:',
        val1: latestMtc ? latestMtc.batchNumber : 'N/A',
        label2: 'OCR Value:',
        val2: ocrData.batchNumber || 'N/A',
        isMatch: batchMatch
      }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Decision Banner */}
        {status === 'REJECTED' ? (
          <div style={{ padding: '1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ❌ REJECTED
            </h4>
            <p style={{ fontSize: '0.85rem', margin: '0.5rem 0 0 0', color: '#fca5a5' }}>
              Match score is too low ({score}%). AI Reconciliation is blocked.
            </p>
            {mismatchReasons.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#fca5a5' }}>
                <strong>Mismatch Reasons:</strong>
                <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem' }}>
                  {mismatchReasons.map((reason, idx) => <li key={idx}>{reason}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : status === 'REVIEW_REQUIRED' ? (
          <div style={{ padding: '1.25rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: '#f59e0b' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ REVIEW REQUIRED
            </h4>
            <p style={{ fontSize: '0.85rem', margin: '0.5rem 0 0 0', color: '#fcd34d' }}>
              Match score is {score}%. Review mismatched fields. Reconciliation cannot be executed until score is 90%+.
            </p>
            {mismatchReasons.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#fcd34d' }}>
                <strong>Mismatch Reasons:</strong>
                <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem' }}>
                  {mismatchReasons.map((reason, idx) => <li key={idx}>{reason}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '1.25rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', color: '#22c55e' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✅ APPROVED
            </h4>
            <p style={{ fontSize: '0.85rem', margin: '0.5rem 0 0 0', color: '#86efac' }}>
              Perfect match ({score}%). Ready to execute AI Reconciliation to automatically generate the GRN.
            </p>
          </div>
        )}

        {/* Score & Confidence */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Weighted Match Score</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444' }}>
              {score}%
            </span>
          </div>
          <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>OCR Confidence</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
              {ocrConfidence ? `${Math.round(ocrConfidence)}%` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Comparison Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {fields.map((field) => {
            const highlightRed = !field.isMatch;
            return (
              <div 
                key={field.name}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  border: highlightRed ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #334155',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: highlightRed ? '#fca5a5' : '#ffffff' }}>
                    {field.name}
                  </span>
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
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: '#94a3b8', width: '90px' }}>{field.label1}</span>
                    <span style={{ color: '#f8fafc' }}>{field.val1}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: '#94a3b8', width: '90px' }}>{field.label2}</span>
                    <span style={{ color: highlightRed ? '#fca5a5' : '#f8fafc', fontWeight: highlightRed ? 600 : 400 }}>
                      {field.val2}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Material Receipt OCR</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          SCM incoming material inspection registry. Scan physical tag images, run OCR extraction, and verify specifications against purchase orders and MTCs.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #1e293b', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('VERIFICATION')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: activeTab === 'VERIFICATION' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
            border: activeTab === 'VERIFICATION' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid transparent',
            color: activeTab === 'VERIFICATION' ? '#22c55e' : '#94a3b8',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
            transition: 'all 0.2s ease'
          }}
        >
          Verify Incoming Material
        </button>
        <button 
          onClick={() => {
            setActiveTab('REGISTRY');
            fetchUploads();
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: activeTab === 'REGISTRY' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
            border: activeTab === 'REGISTRY' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid transparent',
            color: activeTab === 'REGISTRY' ? '#22c55e' : '#94a3b8',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
            transition: 'all 0.2s ease'
          }}
        >
          SCM OCR Registry
        </button>
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

      {activeTab === 'VERIFICATION' ? (
        <>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem', alignItems: 'start', marginBottom: '2rem' }}>
            {/* Upload & Setup Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="premium-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ListOrdered size={18} style={{ color: '#22c55e' }} />
                  <span>Material Tag Verification Setup</span>
                </h3>

                {/* Select Purchase Order */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Incoming Purchase Order (PO)</label>
                  <select
                    className="form-input"
                    value={selectedPoNumber}
                    onChange={handlePoChange}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.65rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    <option value="">-- Select Incoming Purchase Order --</option>
                    {pos.map((po) => (
                      <option key={po.id} value={po.poNumber}>
                        {po.poNumber} — {po.supplier} ({po.material})
                      </option>
                    ))}
                  </select>
                </div>

                {poDetails && (
                  <div style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(15,23,42,0.4)', border: '1px solid #334155', borderRadius: '8px', padding: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600 }}>Target Purchase Order Specs</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      <div><span style={{ color: '#94a3b8' }}>Material:</span> <span style={{ color: '#fff', fontWeight: 500 }}>{poDetails.material}</span></div>
                      <div><span style={{ color: '#94a3b8' }}>Client:</span> <span style={{ color: '#fff', fontWeight: 500 }}>{poDetails.supplier}</span></div>
                      <div><span style={{ color: '#94a3b8' }}>Req Grade:</span> <span style={{ color: '#22c55e', fontWeight: 600 }}>{poDetails.grade}</span></div>
                      <div><span style={{ color: '#94a3b8' }}>Req Qty:</span> <span style={{ color: '#fff', fontWeight: 500 }}>{poDetails.quantity}</span></div>
                      <div><span style={{ color: '#94a3b8' }}>Req Dim:</span> <span style={{ color: '#fff', fontWeight: 500 }}>{poDetails.dimension}</span></div>
                      <div><span style={{ color: '#94a3b8' }}>PO Status:</span> <span className="badge badge-info">{poDetails.status}</span></div>
                    </div>
                  </div>
                )}

                {/* Drag & Drop Tag Area */}
                <div
                  style={uploaderStyle}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-picker').click()}
                >
                  <input
                    id="file-picker"
                    type="file"
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                  />
                  <UploadCloud size={40} style={{ color: dragActive ? '#22c55e' : '#94a3b8' }} />
                  <div>
                    <span style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 500 }}>
                      Drag & drop physical label photo here
                    </span>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      Supports PNG, JPG, JPEG up to 10MB
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

                {/* Image Preview */}
                {previewUrl && (
                  <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Uploaded Physical Tag Photo</span>
                    <img 
                      src={previewUrl} 
                      alt="Tag OCR Preview" 
                      style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', border: '1px solid #334155', objectFit: 'contain' }}
                    />
                  </div>
                )}

                {/* Scan Action */}
                {file && selectedPoNumber && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1.5rem', height: '46px' }}
                    onClick={handleRunOcr}
                    disabled={ocrLoading}
                  >
                    {ocrLoading ? (
                      <>
                        <RefreshCw size={16} className="spinning" />
                        <span>Extracting Tag OCR Specs...</span>
                      </>
                    ) : (
                      <>
                        <Cpu size={16} />
                        <span>Scan Tag & Match Reconciliation</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic AI Verification & Review Columns */}
            {ocrData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Reconciliation Success Banner */}
                {verificationResult && (
                  <div style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)', padding: '1.25rem', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                      <ShieldCheck size={18} />
                      <span>AI Reconciliation Executed Successfully</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: '1.4' }}>
                      The 3-Way Reconciliation has been completed with a match percentage of {Math.round(verificationResult.matchPercentage)}%. 
                      Goods Receipt Note (GRN) has been automatically created and the Purchase Order marked as GRN_GENERATED.
                    </p>
                    <div style={{ marginTop: '1rem' }}>
                      <button
                        onClick={() => navigate('/grn')}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        View Goods Receipt Notes (GRN)
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Compliance Match Status Card */}
                <div className="premium-card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} style={{ color: '#3b82f6' }} />
                    <span>AI Compliance Match Status</span>
                  </h3>
                  {renderAIComplianceMatchStatus()}
                </div>

                {/* OCR Extracted Values Panel */}
                <div className="premium-card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
                    OCR Extracted Values Panel
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Material Grade</span>
                      <span style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600 }}>{ocrData.grade || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Quantity</span>
                      <span style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600 }}>{ocrData.quantity || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Dimension</span>
                      <span style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600 }}>{ocrData.dimension || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Heat Number</span>
                      <span style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600 }}>{ocrData.heatNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Batch Number</span>
                      <span style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600 }}>{ocrData.batchNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Latest Linked MTC Certificate Information */}
                {latestMtc ? (
                  <div className="premium-card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={18} style={{ color: '#3b82f6' }} />
                      <span>Latest Linked MTC Certificate Information</span>
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', fontSize: '0.85rem' }}>
                      <div><span style={{ color: '#94a3b8' }}>Certificate Ref:</span> <span style={{ color: '#fff', fontWeight: 600 }}>{latestMtc.certificateNumber || `MTC-${latestMtc.id}`}</span></div>
                      <div><span style={{ color: '#94a3b8' }}>Version:</span> <span style={{ color: '#fff', fontWeight: 600 }}>v{latestMtc.versionNumber || 1}</span></div>
                      <div><span style={{ color: '#94a3b8' }}>Grade:</span> <span style={{ color: '#fff', fontWeight: 600 }}>{latestMtc.grade || 'N/A'}</span></div>
                      <div><span style={{ color: '#94a3b8' }}>Heat Number:</span> <span style={{ color: '#22c55e', fontWeight: 600 }}>{latestMtc.heatNumber || 'N/A'}</span></div>
                      <div><span style={{ color: '#94a3b8' }}>Dimension:</span> <span style={{ color: '#fff', fontWeight: 600 }}>{latestMtc.dimension || 'N/A'}</span></div>
                      <div><span style={{ color: '#94a3b8' }}>Quantity:</span> <span style={{ color: '#fff', fontWeight: 600 }}>{latestMtc.quantity || 'N/A'}</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="premium-card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertTriangle size={18} />
                      <span>No Linked MTC Certificate Found</span>
                    </span>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0 }}>
                      ⚠️ There is no MTC certificate generated for this Purchase Order yet. The manufacturer must generate the MTC first.
                    </p>
                  </div>
                )}

                {/* Comparison: PO ↔ OCR ↔ MTC */}
                <div className="premium-card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
                    Comparison: PO ↔ OCR ↔ MTC
                  </h3>
                  <div className="table-container" style={{ margin: 0, border: 'none' }}>
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Specification Field</th>
                          <th>PO Value</th>
                          <th>Receipt OCR Value</th>
                          <th>MTC Value</th>
                          <th style={{ textAlign: 'right' }}>Reconciliation Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { field: 'Material Grade', po: poDetails.grade, ocr: ocrData.grade, mtc: latestMtc?.grade || 'N/A', match: checkGradeMatch(poDetails.grade, ocrData.grade, latestMtc?.grade) },
                          { field: 'Dimension', po: poDetails.dimension, ocr: ocrData.dimension, mtc: latestMtc?.dimension || 'N/A', match: checkDimensionMatch(poDetails.dimension, ocrData.dimension, latestMtc?.dimension) },
                          { field: 'Quantity', po: poDetails.quantity, ocr: ocrData.quantity, mtc: latestMtc?.quantity || 'N/A', match: checkQuantityMatch(poDetails.quantity, ocrData.quantity, latestMtc?.quantity) },
                          { field: 'Heat Number', po: 'N/A', ocr: ocrData.heatNumber, mtc: latestMtc?.heatNumber || 'N/A', match: checkHeatMatch(ocrData.heatNumber, latestMtc?.heatNumber) },
                          { field: 'Batch Number', po: 'N/A', ocr: ocrData.batchNumber, mtc: latestMtc?.batchNumber || 'N/A', match: checkBatchMatch(ocrData.batchNumber, latestMtc?.batchNumber) }
                        ].map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: '#ffffff' }}>{row.field}</td>
                            <td>{row.po}</td>
                            <td style={{ color: !row.match ? '#ef4444' : 'inherit', fontWeight: !row.match ? 600 : 'normal' }}>{row.ocr || '—'}</td>
                            <td>{row.mtc || '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <span className="badge" style={row.match ? { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.25)' } : { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                                {row.match ? 'MATCH' : 'MISMATCH'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Execute AI Reconciliation Action */}
                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setOcrData(null);
                        setFile(null);
                        setPreviewUrl(null);
                        setVerificationResult(null);
                      }}
                    >
                      Clear Preview
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={handleExecuteReconciliation}
                      disabled={reconciling || getMatchScoreDetails().score < 100 || !!verificationResult}
                    >
                      {reconciling ? (
                        <>
                          <RefreshCw size={14} className="spinning" />
                          <span>Reconciling & Generating GRN...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} />
                          <span>Execute AI Reconciliation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* SCM OCR Registry Tab */
        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
          {uploads.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <UploadCloud size={40} style={{ color: '#334155', marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
              <h3>No SCM OCR Uploads Found</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                Upload and verify incoming material label images to populate the SCM Control Tower database.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0, border: 'none' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>OCR Image / File</th>
                    <th>Extracted Grade</th>
                    <th>Extracted Quantity</th>
                    <th>Extracted Dimension</th>
                    <th>Extracted Heat #</th>
                    <th>Confidence</th>
                    <th>Upload Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((upload) => (
                    <tr key={upload.id}>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Image size={16} style={{ color: '#3b82f6' }} />
                          <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>{upload.fileName}</span>
                        </span>
                      </td>
                      <td><span style={{ color: '#3b82f6', fontWeight: 600 }}>{upload.grade || '—'}</span></td>
                      <td>{upload.quantity || '—'}</td>
                      <td>{upload.dimension || '—'}</td>
                      <td><span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{upload.heatNumber || '—'}</span></td>
                      <td>
                        <span style={{ color: (upload.confidence || 0) >= 0.85 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                          {upload.confidence ? `${Math.round(upload.confidence * 100)}%` : '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {new Date(upload.uploadedAt).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', width: '130px', minWidth: '130px', position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => setViewingUploadDetails(upload)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                            title="View OCR Details"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleReprocessOcr(upload.id)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' }}
                            title="Reprocess OCR Scan"
                          >
                            <RefreshCw size={12} />
                          </button>

                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === upload.id ? null : upload.id);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                              title="More Actions"
                            >
                              <MoreVertical size={12} />
                            </button>

                            {openDropdownId === upload.id && (
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
                                  onClick={() => { handleEditUploadClick(upload); setOpenDropdownId(null); }}
                                  className="dropdown-item"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                  title="Edit SCM OCR Metadata"
                                >
                                  <Edit2 size={12} style={{ display: 'none' }} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => { handleDeleteUpload(upload.id, upload.fileName); setOpenDropdownId(null); }}
                                  className="dropdown-item"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                  title="Delete Permanent"
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
      )}

      {/* View OCR Details Modal */}
      {viewingUploadDetails && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1050, padding: '2rem'
        }}>
          <div className="premium-card" style={{
            width: '100%', maxWidth: '600px',
            backgroundColor: '#111827', border: '1px solid #334155',
            padding: '2rem', borderRadius: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 600 }}>OCR Record Details: {viewingUploadDetails.fileName}</h3>
              <button onClick={() => setViewingUploadDetails(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              <div><strong>PO Number:</strong> <span style={{ color: '#fff' }}>{viewingUploadDetails.poNumber || 'N/A'}</span></div>
              <div><strong>Uploaded By:</strong> <span style={{ color: '#fff' }}>{viewingUploadDetails.uploadedBy}</span></div>
              <div><strong>Extracted Grade:</strong> <span style={{ color: '#3b82f6', fontWeight: 600 }}>{viewingUploadDetails.grade || 'N/A'}</span></div>
              <div><strong>Extracted Quantity:</strong> <span style={{ color: '#fff' }}>{viewingUploadDetails.quantity || 'N/A'}</span></div>
              <div><strong>Extracted Dimension:</strong> <span style={{ color: '#fff' }}>{viewingUploadDetails.dimension || 'N/A'}</span></div>
              <div><strong>Heat Number:</strong> <span style={{ color: '#22c55e', fontWeight: 600 }}>{viewingUploadDetails.heatNumber || 'N/A'}</span></div>
              <div><strong>Batch Number:</strong> <span style={{ color: '#fff' }}>{viewingUploadDetails.batchNumber || 'N/A'}</span></div>
              <div><strong>Confidence:</strong> <span style={{ color: '#fff' }}>{viewingUploadDetails.confidence ? `${Math.round(viewingUploadDetails.confidence * 100)}%` : 'N/A'}</span></div>
              <div><strong>Visual Material Estimation:</strong> <span style={{ color: '#fff' }}>{viewingUploadDetails.visualMaterial || 'N/A'}</span></div>
              <div><strong>Estimated Weight:</strong> <span style={{ color: '#fff' }}>{viewingUploadDetails.estimatedWeight ? `${viewingUploadDetails.estimatedWeight} TON` : 'N/A'}</span></div>
              <div><strong>Validation Message:</strong> <span style={{ color: '#fff' }}>{viewingUploadDetails.validationMessage || 'N/A'}</span></div>
              <div><strong>Upload Date:</strong> <span style={{ color: '#fff' }}>{new Date(viewingUploadDetails.uploadedAt).toLocaleString()}</span></div>
              
              <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                <strong>Raw OCR Extracted Text:</strong>
                <pre style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  marginTop: '0.4rem',
                  fontFamily: 'monospace'
                }}>
                  {viewingUploadDetails.rawText || 'No raw text extracted.'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit OCR Metadata Modal */}
      {editingUpload && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1050, padding: '2rem'
        }}>
          <div className="premium-card" style={{
            width: '100%', maxWidth: '550px',
            backgroundColor: '#111827', border: '1px solid #334155',
            padding: '2.5rem', borderRadius: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 600 }}>Edit SCM OCR Metadata</h3>
              <button onClick={() => setEditingUpload(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Cancel</button>
            </div>
            <form onSubmit={handleEditUploadSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Grade</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editUploadFormData.grade} 
                  onChange={(e) => setEditUploadFormData({ ...editUploadFormData, grade: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editUploadFormData.quantity} 
                  onChange={(e) => setEditUploadFormData({ ...editUploadFormData, quantity: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dimension</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editUploadFormData.dimension} 
                  onChange={(e) => setEditUploadFormData({ ...editUploadFormData, dimension: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Heat Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editUploadFormData.heatNumber} 
                  onChange={(e) => setEditUploadFormData({ ...editUploadFormData, heatNumber: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Batch Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editUploadFormData.batchNumber} 
                  onChange={(e) => setEditUploadFormData({ ...editUploadFormData, batchNumber: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Visual Material Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editUploadFormData.visualMaterial} 
                  onChange={(e) => setEditUploadFormData({ ...editUploadFormData, visualMaterial: e.target.value })} 
                />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #1e293b', paddingTop: '1.25rem' }}>
                <button type="button" onClick={() => setEditingUpload(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
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
      {openDropdownId && (
        <div 
          onClick={() => setOpenDropdownId(null)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, background: 'transparent' }} 
        />
      )}
    </div>
  );
}
