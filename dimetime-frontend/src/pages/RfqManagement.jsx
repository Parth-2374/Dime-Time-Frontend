import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  DollarSign, 
  Clock,
  Layers,
  MapPin,
  Settings,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';

export default function RfqManagement({ user }) {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedRfq, setExpandedRfq] = useState(null);
  
  // Create RFQ form state
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    materialName: 'Stainless Steel Plate',
    materialDescription: 'Industrial grade structural plate with smooth oxide finish.',
    materialGrade: 'SS304',
    materialType: 'Plate',
    thickness: 10,
    width: 1500,
    length: 6000,
    diameter: '',
    requiredDimension: '10 mm x 1500 mm x 6000 mm',
    quantityValue: 5,
    quantityUnit: 'TON',
    requiredDeliveryDate: '2026-06-20',
    deliveryLocation: 'Ahmedabad, Gujarat',
    remarks: 'Material must include EN 10204 3.1 MTC certificate.',
    specialInstructions: 'Must be flat and packed on pallets.',
    drawingUrl: 'drawing_sheet_1029.pdf',
    techSpecUrl: 'tech_specs_plate_304.pdf',
    mtcRequired: true,
    thirdPartyInspectionRequired: false
  });

  // Submit quote state (for Manufacturer)
  const [activeRfqForQuote, setActiveRfqForQuote] = useState(null);
  const [quoteData, setQuoteData] = useState({
    unitPrice: '',
    totalPrice: '',
    leadTimeDays: '',
    deliveryTerms: 'Ex-Works (EXW)',
    remarks: ''
  });

  const role = user?.role || 'SUPPLIER';
  const username = user?.username || '';

  useEffect(() => {
    fetchRfqs();
  }, [username]);

  const fetchRfqs = async () => {
    if (!username) return;
    setLoading(true);
    try {
      let response;
      if (role === 'SUPPLIER') {
        // Suppliers see their own created RFQs
        response = await axios.get(`http://localhost:8080/api/rfqs/creator/${username}`);
      } else {
        // Manufacturers see only RFQs assigned to them
        response = await axios.get(`http://localhost:8080/api/rfqs/assigned/${username}`);
      }
      if (response.data) {
        setRfqs(response.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load RFQ registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      // Auto-compute dimensions text
      if (name === 'thickness' || name === 'width' || name === 'length') {
        const t = name === 'thickness' ? value : prev.thickness;
        const w = name === 'width' ? value : prev.width;
        const l = name === 'length' ? value : prev.length;
        updated.requiredDimension = `${t} mm x ${w} mm x ${l} mm`;
      }
      return updated;
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await axios.post('http://localhost:8080/api/rfqs', {
        ...formData,
        thickness: formData.thickness ? parseFloat(formData.thickness) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        diameter: formData.diameter ? parseFloat(formData.diameter) : null,
        quantityValue: parseFloat(formData.quantityValue),
        createdBy: username
      });
      if (response.status === 200) {
        setSuccess(`RFQ ${response.data.rfqNumber} draft created successfully!`);
        setShowCreate(false);
        fetchRfqs();
      }
    } catch (err) {
      setError('Failed to save RFQ draft');
    }
  };

  const handleBroadcastRfq = async (rfqNumber) => {
    setError('');
    setSuccess('');
    try {
      const response = await axios.put(`http://localhost:8080/api/rfqs/${rfqNumber}/broadcast?operator=${username}`);
      if (response.status === 200) {
        setSuccess(`RFQ ${rfqNumber} successfully broadcasted to all manufacturers!`);
        fetchRfqs();
      }
    } catch (err) {
      setError('Failed to broadcast RFQ');
    }
  };

  const handleCancelRfq = async (rfqNumber) => {
    if (!window.confirm('Are you sure you want to cancel this RFQ?')) return;
    try {
      await axios.put(`http://localhost:8080/api/rfqs/${rfqNumber}/cancel?operator=${username}`);
      setSuccess(`RFQ ${rfqNumber} cancelled.`);
      fetchRfqs();
    } catch (err) {
      setError('Failed to cancel RFQ');
    }
  };

  const handleQuoteChange = (e) => {
    const { name, value } = e.target;
    setQuoteData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      // Auto-compute total price if unit price is entered
      if (name === 'unitPrice' && activeRfqForQuote) {
        const qty = activeRfqForQuote.quantityValue || 1;
        updated.totalPrice = (parseFloat(value) * qty).toFixed(2);
      }
      return updated;
    });
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!quoteData.unitPrice || !quoteData.leadTimeDays) {
      setError('Please fill in all bidding fields.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:8080/api/quotations', {
        rfqNumber: activeRfqForQuote.rfqNumber,
        manufacturer: username,
        unitPrice: parseFloat(quoteData.unitPrice),
        price: parseFloat(quoteData.totalPrice), // maps to total price in DB
        leadTimeDays: parseInt(quoteData.leadTimeDays),
        deliveryTerms: quoteData.deliveryTerms,
        remarks: quoteData.remarks
      });
      if (response.status === 200) {
        setSuccess(`Bidding quotation submitted for ${activeRfqForQuote.rfqNumber}!`);
        setActiveRfqForQuote(null);
        setQuoteData({ unitPrice: '', totalPrice: '', leadTimeDays: '', deliveryTerms: 'Ex-Works (EXW)', remarks: '' });
        fetchRfqs();
      }
    } catch (err) {
      setError('Failed to submit bidding quote');
    }
  };

  const toggleExpand = (rfqId) => {
    if (expandedRfq === rfqId) {
      setExpandedRfq(null);
    } else {
      setExpandedRfq(rfqId);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CREATED':
        return <span className="badge badge-info">Draft Created</span>;
      case 'BROADCASTED':
        return <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.25)' }}>Broadcasted</span>;
      case 'QUOTED':
        return <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>Quoted</span>;
      case 'QUOTATION_SELECTED':
        return <span className="badge badge-success">Bid Accepted</span>;
      case 'PO_GENERATED':
        return <span className="badge badge-success">PO Released</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
            {role === 'SUPPLIER' ? 'Procurement RFQ Management' : 'RFQ Requests Board'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {role === 'SUPPLIER' 
              ? 'Draft detailed material specifications, broadcast contracts, and track manufacturer bids' 
              : 'Audit open requests assigned to your plant and submit competitive quotations'}
          </p>
        </div>

        {role === 'SUPPLIER' && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={18} />
            <span>Create Procurement RFQ</span>
          </button>
        )}
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

      {/* Industrial RFQ Creation Form */}
      {showCreate && (
        <div className="premium-card" style={{ marginBottom: '2.5rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} style={{ color: '#22c55e' }} />
            <span>Draft Procurement Specifications (EN 10204 Standard)</span>
          </h3>
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Row 1: Material Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Material Name</label>
                <select name="materialName" className="form-input" value={formData.materialName} onChange={handleChange}>
                  <option value="Stainless Steel Plate">Stainless Steel Plate</option>
                  <option value="SS Round Bar">SS Round Bar</option>
                  <option value="Carbon Steel Plate">Carbon Steel Plate</option>
                  <option value="Aluminum Plate">Aluminum Plate</option>
                  <option value="Copper Coil">Copper Coil</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Material Grade</label>
                <input type="text" name="materialGrade" className="form-input" value={formData.materialGrade} onChange={handleChange} placeholder="e.g. SS304, SS316L, A36" required />
              </div>
              <div className="form-group">
                <label className="form-label">Material Type</label>
                <input type="text" name="materialType" className="form-input" value={formData.materialType} onChange={handleChange} placeholder="e.g. Plate, Sheet, Coil" required />
              </div>
              <div className="form-group">
                <label className="form-label">Material Description</label>
                <input type="text" name="materialDescription" className="form-input" value={formData.materialDescription} onChange={handleChange} placeholder="Surface specifications..." />
              </div>
            </div>

            {/* Row 2: Dimensions Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Thickness (mm)</label>
                <input type="number" step="any" name="thickness" className="form-input" value={formData.thickness} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Width (mm)</label>
                <input type="number" step="any" name="width" className="form-input" value={formData.width} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Length (mm)</label>
                <input type="number" step="any" name="length" className="form-input" value={formData.length} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Diameter (mm, Optional)</label>
                <input type="number" step="any" name="diameter" className="form-input" value={formData.diameter} onChange={handleChange} placeholder="e.g. 50" />
              </div>
              <div className="form-group">
                <label className="form-label">Required Dimension (Summary)</label>
                <input type="text" name="requiredDimension" className="form-input" value={formData.requiredDimension} readOnly style={{ backgroundColor: '#1e293b', color: '#94a3b8' }} />
              </div>
            </div>

            {/* Row 3: Quantity & Delivery */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 2fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Required Quantity</label>
                <input type="number" step="any" name="quantityValue" className="form-input" value={formData.quantityValue} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select name="quantityUnit" className="form-input" value={formData.quantityUnit} onChange={handleChange}>
                  <option value="KG">KG</option>
                  <option value="TON">TON</option>
                  <option value="PCS">PCS</option>
                  <option value="METER">METER</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Required Delivery Date</label>
                <input type="date" name="requiredDeliveryDate" className="form-input" value={formData.requiredDeliveryDate} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Destination</label>
                <input type="text" name="deliveryLocation" className="form-input" value={formData.deliveryLocation} onChange={handleChange} placeholder="Destination warehouse city" required />
              </div>
            </div>

            {/* Row 4: Quality & Compliance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 2fr', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input type="checkbox" name="mtcRequired" id="mtcRequired" checked={formData.mtcRequired} onChange={handleChange} style={{ width: '16px', height: '16px', accentColor: '#22c55e' }} />
                <label htmlFor="mtcRequired" style={{ fontSize: '0.85rem', color: '#f8fafc', cursor: 'pointer' }}>MTC Required (EN 10204 3.1)</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input type="checkbox" name="thirdPartyInspectionRequired" id="thirdPartyInspectionRequired" checked={formData.thirdPartyInspectionRequired} onChange={handleChange} style={{ width: '16px', height: '16px', accentColor: '#22c55e' }} />
                <label htmlFor="thirdPartyInspectionRequired" style={{ fontSize: '0.85rem', color: '#f8fafc', cursor: 'pointer' }}>Third Party Inspection</label>
              </div>
              <div className="form-group">
                <label className="form-label">Drawing Sheet (CAD / PDF)</label>
                <input type="text" name="drawingUrl" className="form-input" value={formData.drawingUrl} onChange={handleChange} placeholder="drawing_cad_ref.pdf" />
              </div>
              <div className="form-group">
                <label className="form-label">Technical Specifications Document</label>
                <input type="text" name="techSpecUrl" className="form-input" value={formData.techSpecUrl} onChange={handleChange} placeholder="spec_compliance.pdf" />
              </div>
            </div>

            {/* Row 5: Remarks & Instructions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Special Remarks</label>
                <textarea name="remarks" className="form-input" style={{ height: '60px', resize: 'none' }} value={formData.remarks} onChange={handleChange} placeholder="Specify tolerances or test properties..." />
              </div>
              <div className="form-group">
                <label className="form-label">Packaging & Special Instructions</label>
                <textarea name="specialInstructions" className="form-input" style={{ height: '60px', resize: 'none' }} value={formData.specialInstructions} onChange={handleChange} placeholder="Packaging type, oxidation controls..." />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Save RFQ Draft</button>
            </div>
          </form>
        </div>
      )}

      {/* Quotation Submission Modal (For Manufacturer) */}
      {activeRfqForQuote && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', zIndex: 999, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', width: '100vw', height: '100vh' }}>
          <div className="premium-card" style={{ width: '480px', backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Submit Quotation Bid</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              Bidding for {activeRfqForQuote.rfqNumber} ({activeRfqForQuote.materialName} - {activeRfqForQuote.quantityValue} {activeRfqForQuote.quantityUnit})
            </p>
            <form onSubmit={handleQuoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Unit Price ($ USD)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                    <input type="number" step="any" name="unitPrice" className="form-input" style={{ paddingLeft: '2.2rem' }} value={quoteData.unitPrice} onChange={handleQuoteChange} placeholder="Per Unit" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Total Price</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                    <input type="text" name="totalPrice" className="form-input" style={{ paddingLeft: '2.2rem', backgroundColor: '#1e293b', color: '#94a3b8' }} value={quoteData.totalPrice} readOnly />
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Lead Time (Days)</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                    <input type="number" name="leadTimeDays" className="form-input" style={{ paddingLeft: '2.2rem' }} value={quoteData.leadTimeDays} onChange={handleQuoteChange} placeholder="e.g. 15" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Terms</label>
                  <select name="deliveryTerms" className="form-input" value={quoteData.deliveryTerms} onChange={handleQuoteChange}>
                    <option value="Ex-Works (EXW)">Ex-Works (EXW)</option>
                    <option value="Free On Board (FOB)">Free On Board (FOB)</option>
                    <option value="CIF Destination">Cost, Insurance & Freight (CIF)</option>
                    <option value="DDP Destination">Delivered Duty Paid (DDP)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Manufacturer Remarks / Exclusions</label>
                <textarea name="remarks" className="form-input" style={{ height: '70px', resize: 'none' }} value={quoteData.remarks} onChange={handleQuoteChange} placeholder="Specify deviation details or packaging allowances..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setActiveRfqForQuote(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Quotation Bid</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RFQ Registry Table */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading RFQ Board...</div>
        ) : rfqs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={40} style={{ color: '#334155', marginBottom: '1rem' }} />
            <h3>No SCM RFQ Records</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              {role === 'SUPPLIER' 
                ? 'Begin your industrial procurement process by releasing a new RFQ.' 
                : 'No procurement RFQ assignments are currently pending for your factory.'}
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th></th>
                  <th>RFQ Reference</th>
                  <th>Material Specs</th>
                  <th>Grade</th>
                  <th>Quantity</th>
                  <th>Delivery Date</th>
                  <th>Delivery Location</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((rfq) => {
                  const isExpanded = expandedRfq === rfq.id;
                  return (
                    <React.Fragment key={rfq.id}>
                      <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #1e293b' }}>
                        <td style={{ paddingRight: 0 }}>
                          <button onClick={() => toggleExpand(rfq.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>{rfq.rfqNumber}</td>
                        <td>{rfq.materialName || rfq.material}</td>
                        <td><span style={{ color: '#3b82f6', fontWeight: 500 }}>{rfq.materialGrade || rfq.grade}</span></td>
                        <td style={{ fontWeight: 500 }}>{rfq.quantityValue ? `${rfq.quantityValue} ${rfq.quantityUnit}` : rfq.quantity}</td>
                        <td style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                          {rfq.requiredDeliveryDate ? new Date(rfq.requiredDeliveryDate).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                            <MapPin size={12} style={{ color: '#94a3b8' }} />
                            <span>{rfq.deliveryLocation || 'Warehouse'}</span>
                          </span>
                        </td>
                        <td>{getStatusBadge(rfq.status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {role === 'SUPPLIER' && rfq.status === 'CREATED' && (
                              <>
                                <button onClick={() => handleBroadcastRfq(rfq.rfqNumber)} className="btn btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', backgroundColor: '#22c55e', borderColor: '#22c55e' }}>
                                  <span>Broadcast RFQ</span>
                                </button>
                                <button onClick={() => handleCancelRfq(rfq.rfqNumber)} className="btn" style={{ padding: '0.35rem 0.7rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.15)', fontSize: '0.8rem' }}>
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                            {role === 'MANUFACTURER' && (rfq.status === 'BROADCASTED' || rfq.status === 'QUOTED') && (
                              <button onClick={() => setActiveRfqForQuote(rfq)} className="btn btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
                                <span>Submit Quotation</span>
                                <ArrowRight size={12} />
                              </button>
                            )}
                            {rfq.status !== 'CREATED' && (
                              <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', paddingRight: '0.5rem' }}>Managed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Section */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', padding: '1.25rem 2rem', borderBottom: '1px solid #1e293b' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', fontSize: '0.85rem' }}>
                              <div>
                                <h4 style={{ color: '#22c55e', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Layers size={14} />
                                  <span>Material & Description</span>
                                </h4>
                                <div style={{ color: '#94a3b8', lineHeight: '1.5' }}>
                                  <div><strong>Type:</strong> {rfq.materialType || '—'}</div>
                                  <div style={{ marginTop: '0.25rem' }}><strong>Description:</strong> {rfq.materialDescription || '—'}</div>
                                  <div style={{ marginTop: '0.25rem' }}><strong>Special Instructions:</strong> {rfq.specialInstructions || '—'}</div>
                                </div>
                              </div>
                              <div>
                                <h4 style={{ color: '#3b82f6', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Settings size={14} />
                                  <span>Detailed Dimensions</span>
                                </h4>
                                <div style={{ color: '#94a3b8', lineHeight: '1.5' }}>
                                  <div><strong>Thickness:</strong> {rfq.thickness ? `${rfq.thickness} mm` : '—'}</div>
                                  <div style={{ marginTop: '0.25rem' }}><strong>Width:</strong> {rfq.width ? `${rfq.width} mm` : '—'}</div>
                                  <div style={{ marginTop: '0.25rem' }}><strong>Length:</strong> {rfq.length ? `${rfq.length} mm` : '—'}</div>
                                  <div style={{ marginTop: '0.25rem' }}><strong>Diameter:</strong> {rfq.diameter ? `${rfq.diameter} mm` : '—'}</div>
                                </div>
                              </div>
                              <div>
                                <h4 style={{ color: '#f59e0b', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <ShieldCheck size={14} />
                                  <span>Compliance & Documents</span>
                                </h4>
                                <div style={{ color: '#94a3b8', lineHeight: '1.5' }}>
                                  <div><strong>MTC Required:</strong> {rfq.mtcRequired ? 'Yes (EN 10204 3.1)' : 'No'}</div>
                                  <div style={{ marginTop: '0.25rem' }}><strong>Third Party Inspection:</strong> {rfq.thirdPartyInspectionRequired ? 'Yes' : 'No'}</div>
                                  <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <strong>Drawing:</strong> <span style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>{rfq.drawingUrl || '—'}</span>
                                  </div>
                                  <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <strong>Tech Spec:</strong> <span style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>{rfq.techSpecUrl || '—'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
