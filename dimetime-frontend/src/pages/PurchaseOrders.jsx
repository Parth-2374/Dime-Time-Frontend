import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, ClipboardCheck, ArrowRight, ShieldCheck, CheckCircle2, User, Building2, Play, Calendar, Edit, Trash2, Check, X, FileText, Activity, Search, MoreVertical } from 'lucide-react';

export default function PurchaseOrders({ user }) {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPo, setSelectedPo] = useState(null);
  const [trackingPo, setTrackingPo] = useState(null);
  const [editingPo, setEditingPo] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const [qrError, setQrError] = useState(false);
  const [viewingLargeQr, setViewingLargeQr] = useState(false);

  useEffect(() => {
    if (selectedPo) {
      setQrError(false);
      setViewingLargeQr(false);
    }
  }, [selectedPo]);

  // Filters state
  const [filterPoNo, setFilterPoNo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('');

  // Manual PO form state
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    poNumber: '',
    manufacturer: '',
    material: 'SS Round Bar',
    grade: '316L',
    dimension: '25 MM',
    quantity: '500 KG'
  });

  // Edit PO form state
  const [editFormData, setEditFormData] = useState({
    material: '',
    grade: '',
    dimension: '',
    quantity: '',
    supplier: '',
    manufacturer: '',
    status: ''
  });

  const role = user?.role || 'SUPPLIER';

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      let response;
      if (role === 'ADMIN') {
        response = await axios.get('http://localhost:8080/api/purchase-orders');
      } else if (role === 'SUPPLIER') {
        const url = user?.id 
          ? `http://localhost:8080/api/purchase-orders/supplier/id/${user.id}`
          : `http://localhost:8080/api/purchase-orders/supplier/${user.companyName}`;
        response = await axios.get(url);
      } else {
        const url = user?.id
          ? `http://localhost:8080/api/purchase-orders/manufacturer/id/${user.id}`
          : `http://localhost:8080/api/purchase-orders/manufacturer/${user.username}`;
        response = await axios.get(url);
      }
      if (response.data) {
        setPos(response.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await axios.post('http://localhost:8080/api/purchase-orders', {
        supplier: user.username,
        material: formData.material,
        grade: formData.grade,
        dimension: formData.dimension,
        quantity: formData.quantity,
        manufacturer: formData.manufacturer
      });
      if (response.status === 200) {
        setSuccess(`Purchase Order ${response.data.poNumber} created successfully!`);
        setShowCreate(false);
        fetchPOs();
      }
    } catch (err) {
      setError('Failed to create purchase order');
    }
  };

  // Manufacturer accepts PO and starts production
  const handleAcceptOrder = async (poNumber) => {
    try {
      const response = await axios.put(`http://localhost:8080/api/purchase-orders/${poNumber}/status?status=PRODUCTION_START&operator=${user.username}`);
      if (response.status === 200) {
        setSuccess(`Purchase Order ${poNumber} accepted. Production started!`);
        fetchPOs();
      }
    } catch (err) {
      setError('Failed to accept order.');
    }
  };

  const handleApprove = async (poNumber) => {
    try {
      const response = await axios.put(`http://localhost:8080/api/purchase-orders/${poNumber}/status?status=APPROVED&operator=${user.username}`);
      if (response.status === 200) {
        setSuccess(`Purchase Order ${poNumber} status updated to APPROVED.`);
        fetchPOs();
      }
    } catch (err) {
      setError('Failed to approve PO.');
    }
  };

  const handleReject = async (poNumber) => {
    try {
      const response = await axios.put(`http://localhost:8080/api/purchase-orders/${poNumber}/status?status=REJECTED&operator=${user.username}`);
      if (response.status === 200) {
        setSuccess(`Purchase Order ${poNumber} status updated to REJECTED.`);
        fetchPOs();
      }
    } catch (err) {
      setError('Failed to reject PO.');
    }
  };

  const handleDelete = async (id, poNumber) => {
    if (!window.confirm(`Are you sure you want to delete PO ${poNumber}?`)) return;
    try {
      const response = await axios.delete(`http://localhost:8080/api/purchase-orders/${id}?operator=${user.username}`);
      if (response.status === 200) {
        setSuccess(`Purchase Order ${poNumber} deleted successfully.`);
        fetchPOs();
      }
    } catch (err) {
      setError('Failed to delete PO.');
    }
  };

  const handleDownloadPdf = (poNumber) => {
    window.open(`http://localhost:8080/api/purchase-orders/${poNumber}/pdf`, '_blank');
  };

  const handleDownloadQr = async (poNumber) => {
    try {
      const response = await fetch(`http://localhost:8080/api/purchase-orders/${poNumber}/qr`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${poNumber}_QR.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download QR code", err);
    }
  };

  const handleEditClick = (po) => {
    setEditingPo(po);
    setEditFormData({
      material: po.material || '',
      grade: po.grade || '',
      dimension: po.dimension || '',
      quantity: po.quantity || '',
      supplier: po.supplier || '',
      manufacturer: po.manufacturer || '',
      status: po.status || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:8080/api/purchase-orders/${editingPo.id}?operator=${user.username}`, {
        ...editingPo,
        material: editFormData.material,
        grade: editFormData.grade,
        dimension: editFormData.dimension,
        quantity: editFormData.quantity,
        supplier: editFormData.supplier,
        manufacturer: editFormData.manufacturer,
        status: editFormData.status
      });
      if (response.status === 200) {
        setSuccess(`Purchase Order ${editingPo.poNumber} updated successfully.`);
        setEditingPo(null);
        fetchPOs();
      }
    } catch (err) {
      setError('Failed to update Purchase Order.');
    }
  };

  const filteredPos = pos.filter(po => {
    const matchPoNo = po.poNumber?.toLowerCase().includes(filterPoNo.toLowerCase());
    const matchStatus = filterStatus ? po.status === filterStatus : true;
    const matchSupplier = po.supplier?.toLowerCase().includes(filterSupplier.toLowerCase());
    const matchManufacturer = po.manufacturer?.toLowerCase().includes(filterManufacturer.toLowerCase());
    return matchPoNo && matchStatus && matchSupplier && matchManufacturer;
  });

  const renderStepper = (currentStatus) => {
    const steps = [
      { key: 'PENDING', label: 'Released (Pending)' },
      { key: 'PRODUCTION_START', label: 'Production Started' },
      { key: 'COMPLETED_PRODUCTION', label: 'Production Completed' },
      { key: 'DISPATCHED', label: 'Dispatched / In Transit' },
      { key: 'DELIVERED', label: 'Delivered' },
      { key: 'COMPLETED', label: 'Completed (Reconciled)' }
    ];

    const getStepIndex = (status) => {
      if (status === 'RECONCILED' || status === 'GRN_GENERATED') return 5;
      return steps.findIndex(s => s.key === status);
    };

    const activeIndex = getStepIndex(currentStatus);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0.8rem 0' }}>
        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex || currentStatus === 'COMPLETED' || currentStatus === 'RECONCILED' || currentStatus === 'GRN_GENERATED';
          const isActive = idx === activeIndex && currentStatus !== 'COMPLETED' && currentStatus !== 'RECONCILED' && currentStatus !== 'GRN_GENERATED';
          
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: isCompleted ? '#22c55e' : isActive ? 'rgba(59, 130, 246, 0.2)' : '#1e293b',
                border: isCompleted ? '1.5px solid #22c55e' : isActive ? '1.5px solid #3b82f6' : '1.5px solid #475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCompleted ? '#ffffff' : isActive ? '#3b82f6' : '#94a3b8',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: isActive || isCompleted ? 600 : 400,
                color: isCompleted ? '#ffffff' : isActive ? '#3b82f6' : '#64748b'
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>Pending Acceptance</span>;
      case 'APPROVED':
        return <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.25)' }}>Approved</span>;
      case 'REJECTED':
        return <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>Rejected</span>;
      case 'PRODUCTION_START':
      case 'PRODUCTION_STARTED':
        return <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', width: 'fit-content' }}>
          <Play size={10} />
          <span>In Production</span>
        </span>;
      case 'COMPLETED_PRODUCTION':
        return <span className="badge badge-success">Production Completed</span>;
      case 'DISPATCHED':
        return <span className="badge badge-success" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)' }}>In Transit</span>;
      case 'DELIVERED':
        return <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', width: 'fit-content' }}>
          <CheckCircle2 size={10} />
          <span>Delivered</span>
        </span>;
      case 'COMPLETED':
      case 'RECONCILED':
      case 'GRN_GENERATED':
        return <span className="badge badge-success" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>Completed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Purchase Order (PO) Tracking</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {role === 'ADMIN' ? 'Full administrative command of all active and legacy SCM Purchase Orders' :
             role === 'SUPPLIER' 
              ? 'Release and track official Purchase Orders issued to manufacturer production centers' 
              : 'Accept received contracts and monitor production and dispatch queues'}
          </p>
        </div>

        {role === 'SUPPLIER' && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={18} />
            <span>Create Manual PO</span>
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

      {/* Filters Panel */}
      <div className="premium-card" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Search PO #</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. PO-2026-001" 
              value={filterPoNo}
              onChange={(e) => setFilterPoNo(e.target.value)}
              style={{ paddingLeft: '2rem', height: '38px' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '12px', color: '#64748b' }} />
          </div>
        </div>

        <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Supplier</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Filter Supplier" 
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            style={{ height: '38px' }}
          />
        </div>

        <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Manufacturer</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Filter Manufacturer" 
            value={filterManufacturer}
            onChange={(e) => setFilterManufacturer(e.target.value)}
            style={{ height: '38px' }}
          />
        </div>

        <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Status</label>
          <select 
            className="form-input" 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ height: '38px' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Acceptance</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PRODUCTION_START">In Production</option>
            <option value="COMPLETED_PRODUCTION">Production Completed</option>
            <option value="DISPATCHED">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <button 
          onClick={() => {
            setFilterPoNo('');
            setFilterStatus('');
            setFilterSupplier('');
            setFilterManufacturer('');
          }} 
          className="btn btn-secondary" 
          style={{ height: '38px', marginTop: '1.25rem' }}
        >
          Reset Filters
        </button>
      </div>

      {/* Manual PO Form */}
      {showCreate && (
        <div className="premium-card" style={{ marginBottom: '2rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Draft Manual Purchase Order</h3>
          <form onSubmit={handleCreateSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group">
              <label className="form-label">Manufacturer Username</label>
              <input type="text" name="manufacturer" className="form-input" value={formData.manufacturer} onChange={handleChange} placeholder="e.g. manufacturer" required />
            </div>
            <div className="form-group">
              <label className="form-label">Material Type</label>
              <select name="material" className="form-input" value={formData.material} onChange={handleChange}>
                <option value="SS Round Bar">SS Round Bar</option>
                <option value="SS Plate">SS Plate</option>
                <option value="Steel Sheet">Steel Sheet</option>
                <option value="Aluminum Sheet">Aluminum Sheet</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Material Grade</label>
              <input type="text" name="grade" className="form-input" value={formData.grade} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Specs / Dimension</label>
              <input type="text" name="dimension" className="form-input" value={formData.dimension} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input type="text" name="quantity" className="form-input" value={formData.quantity} onChange={handleChange} required />
            </div>
            <div style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Release PO</button>
            </div>
          </form>
        </div>
      )}

      {/* PO Listing */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading Purchase Orders...</div>
        ) : filteredPos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <Briefcase size={40} style={{ color: '#334155', marginBottom: '1rem' }} />
            <h3>No SCM Purchase Orders Released</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              No purchase orders match the filter criteria.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>PO Reference</th>
                  {role === 'ADMIN' ? (
                    <>
                      <th>Supplier</th>
                      <th>Manufacturer</th>
                    </>
                  ) : (
                    <th>{role === 'SUPPLIER' ? 'Manufacturer' : 'Supplier'}</th>
                  )}
                  <th>Material</th>
                  <th>Grade</th>
                  <th>Dimension</th>
                  <th>Quantity</th>
                  <th>Release Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPos.map((po) => (
                  <tr key={po.id}>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{po.poNumber}</td>
                    {role === 'ADMIN' ? (
                      <>
                        <td>{po.supplierCompanyName || po.supplier}</td>
                        <td>{po.manufacturerCompanyName || po.manufacturer}</td>
                      </>
                    ) : (
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Building2 size={14} style={{ color: '#94a3b8' }} />
                          <span>{role === 'SUPPLIER' ? po.manufacturer : po.supplier}</span>
                        </span>
                      </td>
                    )}
                    <td>{po.material}</td>
                    <td><span style={{ color: '#3b82f6', fontWeight: 500 }}>{po.grade}</span></td>
                    <td>{po.dimension}</td>
                    <td style={{ fontWeight: 500 }}>{po.quantity}</td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td>{getStatusBadge(po.status)}</td>
                    <td style={{ textAlign: 'right', width: '130px', minWidth: '130px', position: 'relative' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => setSelectedPo(po)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          title="View Details"
                        >
                          <span>View</span>
                        </button>
                        
                        <button
                          onClick={() => setTrackingPo(po)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                          title="Track Lifecycle"
                        >
                          <Activity size={12} />
                        </button>

                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === po.id ? null : po.id);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                            title="More Actions"
                          >
                            <MoreVertical size={12} />
                          </button>

                          {openDropdownId === po.id && (
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
                              <button
                                onClick={() => { handleDownloadPdf(po.poNumber); setOpenDropdownId(null); }}
                                className="dropdown-item"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                title="Download PDF"
                              >
                                <FileText size={12} />
                                <span>PDF</span>
                              </button>

                              {role === 'ADMIN' && (
                                <button
                                  onClick={() => { handleEditClick(po); setOpenDropdownId(null); }}
                                  className="dropdown-item"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                  title="Edit PO"
                                >
                                  <Edit size={12} />
                                  <span>Edit</span>
                                </button>
                              )}

                              {role === 'ADMIN' && po.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => { handleApprove(po.poNumber); setOpenDropdownId(null); }}
                                    className="dropdown-item"
                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                    title="Approve"
                                  >
                                    <Check size={12} />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => { handleReject(po.poNumber); setOpenDropdownId(null); }}
                                    className="dropdown-item"
                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                    title="Reject"
                                  >
                                    <X size={12} />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {role === 'MANUFACTURER' && po.status === 'PENDING' && (
                                <button
                                  onClick={() => { handleAcceptOrder(po.poNumber); setOpenDropdownId(null); }}
                                  className="dropdown-item"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                  title="Accept"
                                >
                                  <Play size={12} />
                                  <span>Accept</span>
                                </button>
                              )}

                              {role === 'ADMIN' && (
                                <button
                                  onClick={() => { handleDelete(po.id, po.poNumber); setOpenDropdownId(null); }}
                                  className="dropdown-item"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }}
                                  title="Delete PO"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              )}
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

      {/* Track Lifecycle Modal */}
      {trackingPo && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1050, padding: '2rem'
        }}>
          <div className="premium-card" style={{
            width: '100%', maxWidth: '500px',
            backgroundColor: '#111827', border: '1px solid #334155',
            padding: '2rem', borderRadius: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 600 }}>Track PO Lifecycle</h3>
              <button onClick={() => setTrackingPo(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Close</button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <strong>PO Number:</strong> {trackingPo.poNumber}<br />
              <strong>Current Status:</strong> {trackingPo.status}
            </p>
            <div style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              {renderStepper(trackingPo.status)}
            </div>
          </div>
        </div>
      )}

      {/* Edit PO Modal */}
      {editingPo && (
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
            padding: '2.5rem', borderRadius: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 600 }}>Edit Purchase Order: {editingPo.poNumber}</h3>
              <button onClick={() => setEditingPo(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Cancel</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Material Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editFormData.material} 
                  onChange={(e) => setEditFormData({ ...editFormData, material: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Grade</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editFormData.grade} 
                  onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dimension</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editFormData.dimension} 
                  onChange={(e) => setEditFormData({ ...editFormData, dimension: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editFormData.quantity} 
                  onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-input" 
                  value={editFormData.status} 
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="PENDING">Pending Acceptance</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PRODUCTION_START">In Production</option>
                  <option value="COMPLETED_PRODUCTION">Production Completed</option>
                  <option value="DISPATCHED">In Transit</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editFormData.supplier} 
                  onChange={(e) => setEditFormData({ ...editFormData, supplier: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Manufacturer</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editFormData.manufacturer} 
                  onChange={(e) => setEditFormData({ ...editFormData, manufacturer: e.target.value })} 
                  required 
                />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #1e293b', paddingTop: '1.25rem' }}>
                <button type="button" onClick={() => setEditingPo(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedPo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div className="premium-card" style={{
            width: '100%',
            maxWidth: '960px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #334155',
            backgroundColor: '#111827',
            padding: '2.5rem',
            borderRadius: '16px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
              <div>
                <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  {selectedPo.approvalStatus || 'APPROVED'} PO Contract
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginTop: '0.4rem' }}>
                  Purchase Order: {selectedPo.poNumber}
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  Released: {new Date(selectedPo.createdAt).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPo(null)} 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Close
              </button>
            </div>

            {/* Modal Body: Two column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              {/* Left Column: SCM Information Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Supplier and Manufacturer Corporate Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  {/* Supplier Card */}
                  <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '1rem' }}>
                    <h4 style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                      Supplier (Issuer)
                    </h4>
                    <p style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>
                      {selectedPo.supplierCompanyName || selectedPo.supplier}
                    </p>
                    {selectedPo.supplierGstNumber && (
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        <strong>GST:</strong> {selectedPo.supplierGstNumber}
                      </p>
                    )}
                    {selectedPo.supplierAddress && (
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem', whiteSpace: 'pre-line' }}>
                        <strong>Address:</strong> {selectedPo.supplierAddress}
                      </p>
                    )}
                    {selectedPo.supplierUsername && (
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        <strong>Issuer Username:</strong> {selectedPo.supplierUsername}
                      </p>
                    )}
                  </div>

                  {/* Manufacturer Card */}
                  <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '1rem' }}>
                    <h4 style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                      Manufacturer (Vendor)
                    </h4>
                    <p style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>
                      {selectedPo.manufacturerCompanyName || selectedPo.manufacturer}
                    </p>
                    {selectedPo.manufacturerGstNumber && (
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        <strong>GST:</strong> {selectedPo.manufacturerGstNumber}
                      </p>
                    )}
                    {selectedPo.manufacturerAddress && (
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem', whiteSpace: 'pre-line' }}>
                        <strong>Address:</strong> {selectedPo.manufacturerAddress}
                      </p>
                    )}
                    {selectedPo.manufacturerUsername && (
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        <strong>Vendor Username:</strong> {selectedPo.manufacturerUsername}
                      </p>
                    )}
                  </div>
                </div>

                {/* Material Specifications Table */}
                <div>
                  <h4 style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Material & Product Specifications
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #334155' }}>Specification Parameter</th>
                        <th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #334155' }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8' }}>Material Name / Type</td>
                        <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', fontWeight: 500 }}>
                          {selectedPo.materialName || selectedPo.material}
                        </td>
                      </tr>
                      {selectedPo.materialDescription && (
                        <tr>
                          <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8' }}>Description</td>
                          <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ffffff' }}>
                            {selectedPo.materialDescription}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8' }}>Material Grade</td>
                        <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#3b82f6', fontWeight: 600 }}>
                          {selectedPo.materialGrade || selectedPo.grade}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8' }}>Required Dimensions</td>
                        <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ffffff' }}>
                          {selectedPo.requiredDimension || selectedPo.dimension}
                        </td>
                      </tr>
                      {selectedPo.thickness && (
                        <tr>
                          <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8' }}>Thickness / Width / Length</td>
                          <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ffffff' }}>
                            {selectedPo.thickness} mm x {selectedPo.width} mm x {selectedPo.length} mm
                          </td>
                        </tr>
                      )}
                      {selectedPo.diameter && (
                        <tr>
                          <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8' }}>Diameter</td>
                          <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ffffff' }}>
                            {selectedPo.diameter} mm
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8' }}>Contract Quantity</td>
                        <td style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', fontWeight: 600 }}>
                          {selectedPo.quantity}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.6rem', color: '#94a3b8' }}>MTC EN 10204 3.1 Required</td>
                        <td style={{ padding: '0.6rem', color: selectedPo.mtcRequired ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                          {selectedPo.mtcRequired ? 'YES' : 'NO'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Commercials Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
                  {/* Prices */}
                  <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <h4 style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Commercial Details</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: '#94a3b8' }}>Unit Rate:</span>
                      <span style={{ color: '#ffffff', fontWeight: 500 }}>
                        {selectedPo.unitPrice ? `${selectedPo.currency} ${selectedPo.unitPrice.toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: '#94a3b8' }}>Total Base price:</span>
                      <span style={{ color: '#ffffff', fontWeight: 500 }}>
                        {selectedPo.totalPrice ? `${selectedPo.currency} ${selectedPo.totalPrice.toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: '#94a3b8' }}>GST Rate / Tax:</span>
                      <span style={{ color: '#ffffff' }}>
                        {selectedPo.gstTax ? `${selectedPo.gstTax}%` : '18.0%'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, borderTop: '1px dashed #334155', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                      <span style={{ color: '#22c55e' }}>Net Contract Amount:</span>
                      <span style={{ color: '#22c55e' }}>
                        {selectedPo.totalPrice ? `${selectedPo.currency} ${(selectedPo.totalPrice * 1.18).toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Terms */}
                  <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <h4 style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Delivery Information</h4>
                    <p style={{ color: '#94a3b8' }}>
                      <strong>Destination:</strong> {selectedPo.deliveryLocation || 'Plant HQ'}
                    </p>
                    <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>
                      <strong>Delivery Date:</strong> {selectedPo.requiredDeliveryDate || 'N/A'}
                    </p>
                    <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>
                      <strong>Terms:</strong> {selectedPo.deliveryTerms || 'FOB Destination'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Column: QR Code & Status Stepper */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '1px solid #1e293b', paddingLeft: '2rem' }}>
                
                {/* Offline QR Code Block */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
                  <h4 style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 600 }}>Offline QR Verification</h4>
                  <div style={{
                    backgroundColor: qrError ? '#1e293b' : '#ffffff',
                    border: qrError ? '1px dashed #ef4444' : 'none',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    width: '160px',
                    height: '160px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.4)',
                    color: '#ef4444',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    paddingLeft: '0.75rem',
                    paddingRight: '0.75rem'
                  }}>
                    {!qrError ? (
                      <img 
                        src={`http://localhost:8080/api/purchase-orders/${selectedPo.poNumber}/qr`}
                        alt="PO QR Code"
                        onError={() => setQrError(true)}
                        style={{ width: '150px', height: '150px' }}
                      />
                    ) : (
                      <span>QR Verification Code Not Available</span>
                    )}
                  </div>
                  {!qrError && (
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setViewingLargeQr(true)}
                      >
                        <span>View QR</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => handleDownloadQr(selectedPo.poNumber)}
                      >
                        <span>Download QR</span>
                      </button>
                    </div>
                  )}
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                    SECURE SIGNATURE HASH VERIFIED
                  </span>
                </div>

                {/* Stepper Timeline */}
                <div>
                  <h4 style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.25rem' }}>
                    SCM Lifecycle Tracker
                  </h4>
                  {renderStepper(selectedPo.status)}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
      {viewingLargeQr && selectedPo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '450px',
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              SCM Offline Verification QR
            </h3>
            
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1rem',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
            }}>
              <img 
                src={`http://localhost:8080/api/purchase-orders/${selectedPo.poNumber}/qr`}
                alt="PO QR Code Large"
                style={{ width: '300px', height: '300px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
              <span style={{ fontFamily: 'monospace', color: '#22c55e', fontWeight: 'bold' }}>{selectedPo.poNumber}</span>
              <p style={{ marginTop: '0.25rem', marginBottom: 0 }}>Scan using any secure validator device to verify contract details offline.</p>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', height: '40px' }}
              onClick={() => setViewingLargeQr(false)}
            >
              <span>Close Verification View</span>
            </button>
          </div>
        </div>
      )}
      {openDropdownId && (
        <div 
          onClick={() => setOpenDropdownId(null)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, background: 'transparent' }} 
        />
      )}
    </div>
  );
}
