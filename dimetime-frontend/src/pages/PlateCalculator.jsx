import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, Image, CheckCircle, RefreshCw, Cpu, Scale, Layers, HelpCircle, History, Box } from 'lucide-react';

export default function PlateCalculator({ user }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
  // OCR Data
  const [ocrData, setOcrData] = useState(null);
  const [ocrError, setOcrError] = useState('');
  const [ocrStatusText, setOcrStatusText] = useState('');
  
  // Inputs
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');
  const [material, setMaterial] = useState('SS316');
  const [manualEntryRequired, setManualEntryRequired] = useState(false);
  const [inferredDimensions, setInferredDimensions] = useState('');
  const [manualOverride, setManualOverride] = useState(false);

  // Result
  const [calcResult, setCalcResult] = useState(null);
  const [calcError, setCalcError] = useState('');

  // History
  const [history, setHistory] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/plate-calculations');
      if (response.data) {
        setHistory(response.data);
      }
    } catch (err) {
      console.error('Error fetching calculation history:', err);
    }
  };

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setOcrError('Please select an image file (PNG, JPG, JPEG)');
      return;
    }

    setOcrError('');
    setCalcError('');
    setFile(selectedFile);
    setOcrData(null);
    setCalcResult(null);
    setLength('');
    setWidth('');
    setThickness('');
    setManualEntryRequired(false);
    setManualOverride(false);
    
    // Create browser preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(selectedFile);

    // Auto trigger OCR on upload
    triggerOCR(selectedFile);
  };

  const autoCalculateWeight = async (mat, l, w, t, conf, fileObj, validationParams = {}) => {
    setCalculating(true);
    setCalcError('');
    setCalcResult(null);

    const formData = new FormData();
    if (fileObj) {
      formData.append('file', fileObj);
    }
    formData.append('material', mat);
    formData.append('length', parseFloat(l));
    formData.append('width', parseFloat(w));
    formData.append('thickness', parseFloat(t));
    formData.append('calculatedBy', user?.username || 'admin');
    if (conf) {
      formData.append('confidence', conf);
    }

    // Append visual classification & validation metrics
    if (validationParams.validationStatus) {
      formData.append('validationStatus', validationParams.validationStatus);
    }
    if (validationParams.inferredDimensions) {
      formData.append('inferredDimensions', validationParams.inferredDimensions);
    }
    if (validationParams.validationConfidence) {
      formData.append('validationConfidence', validationParams.validationConfidence);
    }
    if (validationParams.materialClass) {
      formData.append('materialClass', validationParams.materialClass);
    }
    if (validationParams.manualOverride !== undefined) {
      formData.append('manualOverride', validationParams.manualOverride);
    }

    try {
      const response = await axios.post('http://localhost:8080/api/plate-calculations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 && response.data) {
        setCalcResult(response.data);
        fetchHistory(); // refresh history log table
      }
    } catch (err) {
      console.error(err);
      setCalcError('AI Proportional calculation failed.');
    } finally {
      setCalculating(false);
    }
  };

  const triggerOCR = async (selectedFile) => {
    setScanning(true);
    setOcrStatusText('Scanning plate tags via deep learning...');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('uploadedBy', user?.username || 'admin');

    try {
      const response = await axios.post('http://localhost:8080/api/material-uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        setOcrData(data);
        
        // Handle visual validation failure immediately!
        if (data.validationStatus === 'INVALID_IMAGE') {
          if (data.validationConfidence < 0.40) {
            setOcrStatusText('Scan failed: No steel plate detected.');
            setOcrError('No steel plate detected. Weight estimation unavailable.');
            setLength('');
            setWidth('');
            setThickness('');
            setInferredDimensions('');
            setManualEntryRequired(false);
            setCalcResult(null);
            return;
          } else {
            // Borderline invalid plate (40% - 59%). Allow manual operator override.
            setOcrStatusText('Scan warning: Validation confidence below 60%.');
            setOcrError('No steel plate detected with high confidence. Confirm validity below to calculate.');
            
            const dims = parseDimensions(data.rawText);
            let currentInferred = '';
            if (dims) {
              setLength(dims.length.toString());
              setWidth(dims.width.toString());
              setThickness(dims.thickness.toString());
              currentInferred = `${dims.length}x${dims.width}x${dims.thickness} mm`;
              setInferredDimensions(currentInferred);
            } else {
              const ar = data.aspectRatio || 1.5;
              const estWidth = 1000;
              const estLength = Math.round(1000 * ar);
              const estThickness = 25;
              setLength(estLength.toString());
              setWidth(estWidth.toString());
              setThickness(estThickness.toString());
              currentInferred = `${estLength}x${estWidth}x${estThickness} mm`;
              setInferredDimensions(currentInferred);
            }
            setManualEntryRequired(true);
            setCalcResult(null);
            return;
          }
        }

        // 1. Extract Grade & Map Material
        const detectedMaterial = detectMaterial(data.rawText, data.grade);
        setMaterial(detectedMaterial);

        // 2. Extract Dimensions (L x W x T)
        const dims = parseDimensions(data.rawText);
        let currentInferred = '';
        if (dims) {
          setLength(dims.length.toString());
          setWidth(dims.width.toString());
          setThickness(dims.thickness.toString());
          currentInferred = `${dims.length}x${dims.width}x${dims.thickness} mm`;
          setInferredDimensions(currentInferred);
          setManualEntryRequired(false);
          setOcrStatusText('Plate scanned successfully. Dimensions pre-filled.');
          
          // Auto calculate weight directly!
          autoCalculateWeight(detectedMaterial, dims.length, dims.width, dims.thickness, data.confidence, selectedFile, {
            validationStatus: data.validationStatus,
            inferredDimensions: currentInferred,
            validationConfidence: data.validationConfidence,
            materialClass: data.visualMaterialClass
          });
        } else {
          // Auto-generate dimensions using OpenCV aspect ratio
          const ar = data.aspectRatio || 1.5;
          const estWidth = 1000;
          const estLength = Math.round(1000 * ar);
          const estThickness = 25; // standard fallback

          setLength(estLength.toString());
          setWidth(estWidth.toString());
          setThickness(estThickness.toString());
          currentInferred = `${estLength}x${estWidth}x${estThickness} mm`;
          setInferredDimensions(currentInferred);
          setManualEntryRequired(true); 
          setOcrStatusText('Dimensions not found. Generated AI estimations.');

          // Auto calculate weight directly!
          autoCalculateWeight(detectedMaterial, estLength, estWidth, estThickness, data.confidence, selectedFile, {
            validationStatus: data.validationStatus,
            inferredDimensions: currentInferred,
            validationConfidence: data.validationConfidence,
            materialClass: data.visualMaterialClass
          });
        }
      }
    } catch (err) {
      console.error(err);
      setOcrError('OCR analysis failed. Defaulting to manual entries.');
      setManualEntryRequired(true);
    } finally {
      setScanning(false);
    }
  };

  // Dimensions parser: 2000x1000x25 or 2000 x 1000 x 25 mm
  const parseDimensions = (text) => {
    if (!text) return null;
    const regex = /\b(\d+)\s*(?:mm|inch|in|m)?\s*[xX*]\s*(\d+)\s*(?:mm|inch|in|m)?\s*[xX*]\s*(\d+)\b/;
    const match = text.match(regex);
    if (match) {
      return {
        length: parseFloat(match[1]),
        width: parseFloat(match[2]),
        thickness: parseFloat(match[3])
      };
    }
    return null;
  };

  // Grade parser: maps 316L, 304, A36 etc to standard materials
  const detectMaterial = (text, grade) => {
    const fullText = ((text || "") + " " + (grade || "")).toUpperCase();
    if (fullText.includes("316L") || fullText.includes("316")) {
      return "SS316";
    } else if (fullText.includes("304")) {
      return "SS304";
    } else if (fullText.includes("A36") || fullText.includes("410") || fullText.includes("STEEL")) {
      return "Mild Steel";
    } else if (fullText.includes("AL") || fullText.includes("ALUMINUM")) {
      return "Aluminum";
    }
    return "Mild Steel"; // fallback default
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

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!length || !width || !thickness) {
      setCalcError('Please enter all dimension fields (Length, Width, Thickness)');
      return;
    }

    setCalculating(true);
    setCalcError('');
    setCalcResult(null);

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    formData.append('material', material);
    formData.append('length', parseFloat(length));
    formData.append('width', parseFloat(width));
    formData.append('thickness', parseFloat(thickness));
    formData.append('calculatedBy', user?.username || 'admin');
    if (ocrData?.confidence) {
      formData.append('confidence', ocrData.confidence);
    }

    // Append visual classification & validation metrics from OCR data if present
    if (ocrData) {
      formData.append('validationStatus', ocrData.validationStatus || 'VALID');
      formData.append('validationConfidence', ocrData.validationConfidence || 0.8);
      formData.append('materialClass', ocrData.visualMaterialClass || 'Steel Plate');
      formData.append('inferredDimensions', inferredDimensions || `${length}x${width}x${thickness} mm`);
      formData.append('manualOverride', manualOverride);
    } else {
      // Pure manual entry from scratch without image
      formData.append('validationStatus', 'VALID');
      formData.append('validationConfidence', 1.0);
      formData.append('materialClass', 'Steel Plate');
      formData.append('inferredDimensions', `${length}x${width}x${thickness} mm`);
      formData.append('manualOverride', false);
    }

    try {
      const response = await axios.post('http://localhost:8080/api/plate-calculations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 && response.data) {
        setCalcResult(response.data);
        fetchHistory(); // refresh history log table
      }
    } catch (err) {
      console.error(err);
      setCalcError('Weight calculation failed. Check backend connection.');
    } finally {
      setCalculating(false);
    }
  };

  const uploaderStyle = {
    border: dragActive ? '2px dashed #22c55e' : '2px dashed #334155',
    backgroundColor: dragActive ? 'rgba(34, 197, 94, 0.03)' : 'rgba(30, 41, 59, 0.2)',
    borderRadius: '12px',
    padding: '2.5rem 1.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    position: 'relative'
  };

  const densityMap = {
    'SS304': '7930 kg/m³',
    'SS316': '8000 kg/m³',
    'Mild Steel': '7850 kg/m³',
    'Aluminum': '2700 kg/m³'
  };

  const isFormLocked = ocrData?.validationStatus === 'INVALID_IMAGE' && !manualOverride;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>AI Steel Plate Weight Calculator</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Upload steel plate tag visuals to auto-detect dimensions and chemistry, or manually input metrics to calculate volume and weight.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Image Portal & Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* File Upload Zone */}
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UploadCloud size={18} style={{ color: '#22c55e' }} />
              <span>Plate Scanner Portal</span>
            </h3>

            {ocrError && (
              <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {ocrError}
              </div>
            )}

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
              <UploadCloud size={32} style={{ color: dragActive ? '#22c55e' : '#94a3b8' }} />
              <div>
                <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 500 }}>
                  Drag & drop plate image here to auto-fill
                </span>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Supports plate barcode, specs, or tag images
                </p>
              </div>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Browse Images
              </button>
            </div>

            {scanning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#3b82f6', fontSize: '0.85rem' }}>
                <RefreshCw size={14} className="spinning" />
                <span>{ocrStatusText}</span>
              </div>
            )}

            {!scanning && ocrStatusText && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#22c55e', fontSize: '0.85rem' }}>
                <CheckCircle size={14} />
                <span>{ocrStatusText}</span>
              </div>
            )}
          </div>

          {/* Calculator Form */}
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={18} style={{ color: '#22c55e' }} />
              <span>Material Configuration</span>
            </h3>

            {manualEntryRequired && (
              <div style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '0.75rem 1rem', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 500 }}>
                ⚠️ Manual Entry Required: Dimensions not detected in image.
              </div>
            )}

            {calcError && (
              <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {calcError}
              </div>
            )}

            <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Material Dropdown */}
              <div className="form-group">
                <label className="form-label" htmlFor="material-select">Target Material</label>
                <select
                  id="material-select"
                  className="form-input"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  disabled={isFormLocked}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', opacity: isFormLocked ? 0.5 : 1 }}
                >
                  <option value="SS304">SS304 (7930 kg/m³)</option>
                  <option value="SS316">SS316 (8000 kg/m³)</option>
                  <option value="Mild Steel">Mild Steel (7850 kg/m³)</option>
                  <option value="Aluminum">Aluminum (2700 kg/m³)</option>
                </select>
              </div>

              {/* Dimensions Input Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="length-input">Length (mm)</label>
                  <input
                    id="length-input"
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 2000"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    disabled={isFormLocked}
                    style={{ opacity: isFormLocked ? 0.5 : 1 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="width-input">Width (mm)</label>
                  <input
                    id="width-input"
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 1000"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    disabled={isFormLocked}
                    style={{ opacity: isFormLocked ? 0.5 : 1 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="thickness-input">Thickness (mm)</label>
                  <input
                    id="thickness-input"
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 25"
                    value={thickness}
                    onChange={(e) => setThickness(e.target.value)}
                    disabled={isFormLocked}
                    style={{ opacity: isFormLocked ? 0.5 : 1 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem', height: '44px' }}
                disabled={calculating || isFormLocked}
              >
                {calculating ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    <span>Calculating Weight...</span>
                  </>
                ) : (
                  <>
                    <Cpu size={16} />
                    <span>Compute Plate Weight</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Previews & Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Image & OCR Extracted Specs */}
          {previewUrl && (
            <div className="premium-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Image size={18} style={{ color: '#3b82f6' }} />
                <span>Visual Scan Preview</span>
              </h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                <img
                  src={previewUrl}
                  alt="Scanned Plate Preview"
                  style={{
                    width: '120px',
                    height: '90px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>OCR CONFIDENCE:</span>
                    {ocrData?.confidence ? (
                      <span className="badge badge-info">{(ocrData.confidence * 100).toFixed(1)}%</span>
                    ) : (
                      <span className="badge badge-secondary" style={{ color: '#94a3b8' }}>N/A</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    <strong>Detected Grade:</strong> {ocrData?.grade || '[Not Detected]'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    <strong>Detected Dimensions:</strong> {ocrData?.dimension || '[Not Detected]'}
                  </div>
                </div>
              </div>

              {ocrData?.rawText && (
                <div style={{ marginTop: '1rem', backgroundColor: 'rgba(15,23,42,0.4)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Extracted Raw Text</span>
                  <p style={{ fontSize: '0.75rem', color: '#cbd5e1', fontFamily: 'monospace', margin: '0.2rem 0 0 0', maxHeight: '50px', overflowY: 'auto' }}>
                    {ocrData.rawText}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Yellow Warning Card for Low-Confidence Scans */}
          {ocrData?.validationStatus === "LOW_CONFIDENCE" && (
            <div className="premium-card" style={{ borderLeft: '4px solid #eab308', backgroundColor: 'rgba(234, 179, 8, 0.03)', border: '1px solid rgba(234, 179, 8, 0.15)', animation: 'slideIn 0.3s ease', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.12)', color: '#eab308', fontSize: '0.9rem' }}>
                  ⚠️
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#eab308', margin: 0 }}>
                    Low-Confidence Plate Visual
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Validation Status: <strong style={{ color: '#eab308' }}>LOW_CONFIDENCE</strong> | Confidence: <strong>{((ocrData.validationConfidence || 0.7) * 100).toFixed(0)}%</strong>
                  </span>
                </div>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.8rem', margin: '0.25rem 0 0 0', lineHeight: '1.4' }}>
                {ocrData.validationMessage || "Low-confidence plate detected. Calculation is allowed, but results are marked as an AI approximation."}
              </p>
            </div>
          )}

          {/* Warning Card for Invalid Images (w/ manual override capability) */}
          {ocrData?.validationStatus === "INVALID_IMAGE" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
              {!manualOverride ? (
                <div className="premium-card" style={{ borderLeft: '4px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.15)', animation: 'slideIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                      ⚠️
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ef4444', margin: 0 }}>
                        Image Validation Failure
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Status: <strong style={{ color: '#ef4444' }}>INVALID_IMAGE</strong> | Confidence: <strong>{((ocrData.validationConfidence || 0.5) * 100).toFixed(0)}%</strong>
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                    <strong>Reason:</strong> {ocrData.validationMessage || "No steel plate detected. Weight estimation unavailable."}
                  </div>
                  
                  <div style={{ backgroundColor: 'rgba(15,23,42,0.4)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)', fontSize: '0.75rem', color: '#94a3b8' }}>
                    ⚠️ <strong>Safety Warning:</strong> Weight estimation and dimensional extraction are locked out for non-plate visuals to prevent database contamination.
                  </div>
                </div>
              ) : (
                <div className="premium-card" style={{ borderLeft: '4px solid #eab308', backgroundColor: 'rgba(234, 179, 8, 0.03)', border: '1px solid rgba(234, 179, 8, 0.15)', animation: 'slideIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
                      ⚙️
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#eab308', margin: 0 }}>
                        Manual Operator Override Active
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Validation Status: <strong style={{ color: '#eab308' }}>OVERRIDDEN</strong> | Confidence: <strong>{((ocrData.validationConfidence || 0.5) * 100).toFixed(0)}%</strong>
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                    <strong>Notice:</strong> Operator confirmed this visual represents a valid steel plate. Weight estimation has been unlocked.
                  </div>
                </div>
              )}

              {/* Show Confirmation Checkbox if validation confidence is between 40% and 79% */}
              {ocrData.validationConfidence >= 0.40 && ocrData.validationConfidence < 0.80 && (
                <div className="premium-card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid #334155', borderRadius: '8px' }}>
                  <input
                    type="checkbox"
                    id="manual-override-checkbox"
                    checked={manualOverride}
                    onChange={(e) => setManualOverride(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#eab308' }}
                  />
                  <label htmlFor="manual-override-checkbox" style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}>
                    I confirm this is a plate image
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Results Summary Box */}
          {calcResult && (
            <div className="premium-card" style={{ borderLeft: '4px solid #22c55e', animation: 'slideIn 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} style={{ color: '#22c55e' }} />
                  <span>Calculation Outputs</span>
                </h3>
                {calcResult?.validationStatus === "LOW_CONFIDENCE" ? (
                  <span className="badge badge-warning" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    LOW CONFIDENCE - AI Approximation
                  </span>
                ) : manualEntryRequired ? (
                  <span className="badge badge-warning" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    AI Estimated Weight (Approximation)
                  </span>
                ) : (
                  <span className="badge badge-success">COMPLETED</span>
                )}
              </div>

              {/* Big Estimated Weight Stat */}
              <div style={{ textAlign: 'center', padding: '1.25rem 1rem', backgroundColor: 'rgba(15,23,42,0.4)', border: '1px solid #334155', borderRadius: '10px', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Plate Weight</span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#22c55e', marginTop: '0.25rem', marginBottom: '0.1rem' }}>
                  {calcResult.aiEstimatedWeight || calcResult.estimatedWeight} kg
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Density: {calcResult.density} kg/m³ | Volume: {calcResult.volume} m³
                </p>
              </div>

              {/* Premium 7-Stat Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ backgroundColor: 'rgba(15,23,42,0.4)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Material Class</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', marginTop: '0.15rem' }}>
                    {calcResult.materialClass || ocrData?.visualMaterialClass || 'Steel Plate'}
                  </div>
                </div>
                
                <div style={{ backgroundColor: 'rgba(15,23,42,0.4)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Validation Confidence</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#22c55e', marginTop: '0.15rem' }}>
                    {((calcResult.validationConfidence || ocrData?.validationConfidence || 0.8) * 100).toFixed(0)}%
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(15,23,42,0.4)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Inferred Dimensions</span>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff', marginTop: '0.15rem', fontFamily: 'monospace' }}>
                    {calcResult.inferredDimensions || inferredDimensions || `${calcResult.length}x${calcResult.width}x${calcResult.thickness} mm`}
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(15,23,42,0.4)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Validation Status</span>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#22c55e', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                    {calcResult.validationStatus || 'VALID'}
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(15,23,42,0.4)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>AI Estimated Weight</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.15rem' }}>
                    {calcResult.aiEstimatedWeight || calcResult.estimatedWeight} kg
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(15,23,42,0.4)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Calculated Weight</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22c55e', marginTop: '0.15rem' }}>
                    {calcResult.calculatedWeight || calcResult.estimatedWeight} kg
                  </div>
                </div>
              </div>

              {/* Difference % Banner */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                border: '1px solid rgba(59, 130, 246, 0.2)', 
                padding: '0.6rem 1rem', 
                borderRadius: '8px', 
                marginBottom: '1.25rem' 
              }}>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 500 }}>Weight Consistency Variance:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {(calcResult.differencePercentage || 0.0).toFixed(1)}% Difference
                </span>
              </div>

              {/* Formula Panel */}
              <div style={{ backgroundColor: 'rgba(15,23,42,0.2)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Box size={14} style={{ color: '#3b82f6' }} />
                  <span>Formula & Maths Used</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                  <div>Volume (m³) = (Length * Width * Thickness) / 10⁹</div>
                  <div style={{ color: '#94a3b8', paddingLeft: '0.8rem' }}>
                    = ({calcResult.length} * {calcResult.width} * {calcResult.thickness}) / 1,000,000,000 = <strong>{calcResult.volume} m³</strong>
                  </div>
                  <div style={{ marginTop: '0.2rem' }}>Weight (kg) = Volume * Density</div>
                  <div style={{ color: '#22c55e', paddingLeft: '0.8rem' }}>
                    = {calcResult.volume} m³ * {calcResult.density} kg/m³ = <strong>{calcResult.calculatedWeight || calcResult.estimatedWeight} kg</strong>
                  </div>
                </div>
              </div>

              {/* Spec JSON Block */}
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Output Spec (JSON)</span>
                <pre style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: '#22c55e',
                  lineHeight: '1.4',
                  margin: '0.4rem 0 0 0',
                  overflowX: 'auto'
                }}>
{JSON.stringify({
  material: calcResult.material,
  density: calcResult.density + " kg/m3",
  length: calcResult.length + " mm",
  width: calcResult.width + " mm",
  thickness: calcResult.thickness + " mm",
  estimatedWeight: calcResult.estimatedWeight + " kg"
}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Log Section */}
      <div className="premium-card" style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} style={{ color: '#3b82f6' }} />
          <span>Plate Calculations Audit History</span>
        </h3>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            No calculations performed yet. Complete the form above to log your first calculation.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Calculated At</th>
                  <th>Material Class</th>
                  <th>Material</th>
                  <th>Calculated Dimensions</th>
                  <th>Inferred Dimensions</th>
                  <th>Calculated Weight</th>
                  <th>AI Est. Weight</th>
                  <th>Diff %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                      {new Date(item.calculatedAt).toLocaleString()}
                    </td>
                    <td style={{ color: '#ffffff', fontWeight: 500 }}>
                      {item.materialClass || 'Steel Plate'}
                    </td>
                    <td>
                      <span className={`badge ${item.material.startsWith('SS') ? 'badge-success' : 'badge-info'}`}>
                        {item.material}
                      </span>
                    </td>
                    <td style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>
                      {item.length} × {item.width} × {item.thickness} mm
                    </td>
                    <td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                      {item.inferredDimensions || 'N/A'}
                    </td>
                    <td style={{ fontWeight: 600, color: '#22c55e' }}>
                      {item.calculatedWeight || item.estimatedWeight} kg
                    </td>
                    <td style={{ fontWeight: 600, color: '#3b82f6' }}>
                      {item.aiEstimatedWeight || item.estimatedWeight} kg
                    </td>
                    <td style={{ color: '#f59e0b', fontWeight: 600 }}>
                      {(item.differencePercentage || 0.0).toFixed(1)}%
                    </td>
                    <td>
                      <span className={`badge ${item.validationStatus === 'INVALID_IMAGE' ? 'badge-danger' : 'badge-success'}`}>
                        {item.validationStatus || 'VALID'}
                      </span>
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
    </div>
  );
}
