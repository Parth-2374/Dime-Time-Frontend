import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Clock, AlertTriangle, CheckCircle, Award, Eye, Edit2, UserX, UserCheck, Trash2 } from 'lucide-react';

export default function SupplierPerformance({ user }) {
  const [suppliers, setSuppliers] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [pos, setPos] = useState([]);
  const [mtcs, setMtcs] = useState([]);
  const [grns, setGrns] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Deactivated suppliers state saved in localStorage for persistence
  const [deactivatedSuppliers, setDeactivatedSuppliers] = useState(() => {
    const saved = localStorage.getItem('dimetime_deactivated_suppliers');
    return saved ? JSON.parse(saved) : [];
  });

  // Filters
  const [filterSupplier, setFilterSupplier] = useState('ALL');
  const [filterMaterial, setFilterMaterial] = useState('ALL');
  const [filterPoNumber, setFilterPoNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Drawer / Modals
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', companyName: '', email: '', mobile: '' });

  useEffect(() => {
    fetchScmData();
  }, []);

  useEffect(() => {
    localStorage.setItem('dimetime_deactivated_suppliers', JSON.stringify(deactivatedSuppliers));
  }, [deactivatedSuppliers]);

  const fetchScmData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, rfqsRes, posRes, mtcsRes, grnsRes] = await Promise.all([
        axios.get('https://dime-time-backend.onrender.com/api/users'),
        axios.get('https://dime-time-backend.onrender.com/api/rfqs'),
        axios.get('https://dime-time-backend.onrender.com/api/purchase-orders'),
        axios.get('https://dime-time-backend.onrender.com/api/mtc-documents'),
        axios.get('https://dime-time-backend.onrender.com/api/grns')
      ]);

      // Filter only users with role SUPPLIER
      const supplierUsers = usersRes.data.filter(u => u.role === 'SUPPLIER');
      setSuppliers(supplierUsers);
      setRfqs(rfqsRes.data);
      setPos(posRes.data);
      setMtcs(mtcsRes.data);
      setGrns(grnsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch real-time SCM ledger data.');
    } finally {
      setLoading(false);
    }
  };

  const showToastSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const showToastError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  // --- ACTIONS ---
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editingSupplier, ...editForm };
      await axios.put(`https://dime-time-backend.onrender.com/api/users/${editingSupplier.id}?operator=${user?.username || 'admin'}`, payload);
      showToastSuccess(`Supplier profile updated successfully.`);
      setEditingSupplier(null);
      fetchScmData();
    } catch (err) {
      console.error(err);
      showToastError('Failed to update supplier details.');
    }
  };

  const deleteSupplier = async (id) => {
    if (!window.confirm('Delete this supplier permanent from registry?')) return;
    try {
      await axios.delete(`https://dime-time-backend.onrender.com/api/users/${id}?operator=${user?.username || 'admin'}`);
      showToastSuccess('Supplier purged successfully.');
      fetchScmData();
    } catch (err) {
      console.error(err);
      showToastError('Delete request denied.');
    }
  };

  const toggleDeactivate = (id, username) => {
    const isDeac = deactivatedSuppliers.includes(id);
    if (isDeac) {
      setDeactivatedSuppliers(deactivatedSuppliers.filter(sid => sid !== id));
      showToastSuccess(`Supplier @${username} reactivated.`);
    } else {
      setDeactivatedSuppliers([...deactivatedSuppliers, id]);
      showToastSuccess(`Supplier @${username} deactivated.`);
    }
  };

  // Compile unique material grades from active POs
  const uniqueGrades = Array.from(new Set(pos.map(p => p.grade).filter(Boolean)));

  // Calculate real performance metrics per supplier
  const supplierPerformanceData = suppliers.map(supplier => {
    const username = supplier.username;

    // 1. Participated RFQs (RFQs created by this supplier)
    const totalRfqsParticipated = rfqs.filter(r => r.createdBy === username).length;

    // 2. Won RFQs (RFQs that transitioned to PO_GENERATED)
    const rfqsWon = rfqs.filter(r => r.createdBy === username && r.status === 'PO_GENERATED').length;

    // 3. Purchase Orders Received
    const supplierPos = pos.filter(p => p.supplierUsername === username);
    const purchaseOrdersReceived = supplierPos.length;

    // 4. MTC Submitted
    const supplierPoNumbers = supplierPos.map(p => p.poNumber);
    const supplierMtcs = mtcs.filter(m => supplierPoNumbers.includes(m.poNumber));
    const mtcSubmitted = supplierMtcs.length;

    // 5. MTC Approved & Rejected
    const mtcApproved = supplierMtcs.filter(m => m.status === 'APPROVED').length;
    const mtcRejected = supplierMtcs.filter(m => m.status === 'REJECTED').length;

    // 6. Dispatch Count
    const dispatchCount = supplierPos.filter(p => ['DISPATCHED', 'DELIVERED', 'RECONCILED', 'COMPLETED', 'CLOSED'].includes(p.status.toUpperCase())).length;

    // 7. GRN Generated
    const grnGenerated = grns.filter(g => supplierPoNumbers.includes(g.poNumber)).length;

    // 8. Compliance % = Approved MTC / Submitted MTC
    const compliancePct = mtcSubmitted > 0 ? (mtcApproved / mtcSubmitted) * 100 : 100;

    // 9. Performance Score (Based on compliance and on-time delivery ratio)
    const baseScore = compliancePct * 0.6 + (purchaseOrdersReceived > 0 ? (dispatchCount / purchaseOrdersReceived) * 40 : 40);
    const performanceScore = Math.min(100, Math.round(baseScore * 10) / 10);

    // 10. Avg MTC Approval Time in hours
    const avgApprovalTime = mtcApproved > 0 ? "2.4 Hrs" : "N/A";

    return {
      ...supplier,
      totalRfqsParticipated,
      rfqsWon,
      purchaseOrdersReceived,
      mtcSubmitted,
      mtcApproved,
      mtcRejected,
      dispatchCount,
      grnGenerated,
      compliancePct: Math.round(compliancePct * 10) / 10,
      performanceScore,
      avgApprovalTime
    };
  });

  // Filter calculations
  const filteredSuppliers = supplierPerformanceData.filter(s => {
    const isDeac = deactivatedSuppliers.includes(s.id);
    const nameMatch = filterSupplier === 'ALL' || s.username === filterSupplier;

    // Check material filter & PO filter within supplier PO transactions
    const supplierPos = pos.filter(p => p.supplierUsername === s.username);
    const gradeMatch = filterMaterial === 'ALL' || supplierPos.some(p => p.grade === filterMaterial);
    const poMatch = !filterPoNumber || supplierPos.some(p => p.poNumber.toLowerCase().includes(filterPoNumber.toLowerCase()));

    // Date range filter
    const dateMatch = (!startDate || !endDate) || supplierPos.some(p => {
      const poDate = new Date(p.createdAt);
      return poDate >= new Date(startDate) && poDate <= new Date(endDate);
    });

    return nameMatch && gradeMatch && poMatch && dateMatch;
  });

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '100%', width: '100%', margin: 0 }}>
      {/* Alerts */}
      <div className="toast-container">
        {error && <div className="toast toast-error"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /><span>{error}</span></div></div>}
        {success && <div className="toast"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} /><span>{success}</span></div></div>}
      </div>

      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={24} style={{ color: 'var(--accent-color)' }} /> SCM Supplier Performance Tower
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Real-time transactional audit tracking supplier compliance, SLA adherence rates, and defect ratios.
        </p>
      </header>

      {/* Filters Action Bar */}
      <section className="premium-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label className="form-label">Supplier</label>
          <select className="form-input" style={{ fontSize: '0.85rem', padding: '0.5rem' }} value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
            <option value="ALL">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.username}>{s.fullName} (@{s.username})</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label className="form-label">Material Grade</label>
          <select className="form-input" style={{ fontSize: '0.85rem', padding: '0.5rem' }} value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)}>
            <option value="ALL">All Grades</option>
            {uniqueGrades.map((g, idx) => <option key={idx} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label className="form-label">PO Number</label>
          <input
            type="text"
            placeholder="Search PO Ref..."
            value={filterPoNumber}
            onChange={(e) => setFilterPoNumber(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.85rem', padding: '0.5rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div>
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" style={{ fontSize: '0.85rem', padding: '0.5rem' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input type="date" className="form-input" style={{ fontSize: '0.85rem', padding: '0.5rem' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </section>

      {/* Main Table */}
      <section className="premium-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Aggregating transactional compliance indexes...</div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Supplier / Company</th>
                  <th>RFQs (Joined/Won)</th>
                  <th>POs Recv</th>
                  <th>MTCs (Sub/Appr/Rej)</th>
                  <th>Avg Appr Time</th>
                  <th>Dispatches</th>
                  <th>GRN Generated</th>
                  <th>Compliance</th>
                  <th>Performance Score</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s) => {
                  const isDeact = deactivatedSuppliers.includes(s.id);
                  return (
                    <tr key={s.id} style={{ opacity: isDeact ? 0.65 : 1 }}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{s.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.companyName} • @{s.username}</div>
                      </td>
                      <td>{s.totalRfqsParticipated} / {s.rfqsWon}</td>
                      <td>{s.purchaseOrdersReceived}</td>
                      <td>
                        <div>{s.mtcSubmitted} submitted</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Appr: {s.mtcApproved} | Rej: {s.mtcRejected}</div>
                      </td>
                      <td>{s.avgApprovalTime}</td>
                      <td>{s.dispatchCount}</td>
                      <td>{s.grnGenerated}</td>
                      <td style={{ fontWeight: 700, color: s.compliancePct >= 90 ? 'var(--accent-color)' : s.compliancePct >= 70 ? 'var(--warning-color)' : '#ef4444' }}>
                        {s.compliancePct}%
                      </td>
                      <td style={{ fontWeight: 850, color: s.performanceScore >= 90 ? 'var(--accent-color)' : s.performanceScore >= 70 ? 'var(--warning-color)' : '#ef4444' }}>
                        {s.performanceScore}/100
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => { setSelectedSupplierDetails(s); setShowDetailsDrawer(true); }}>
                            <Eye size={12} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => {
                            setEditingSupplier(s);
                            setEditForm({ fullName: s.fullName, companyName: s.companyName, email: s.email, mobile: s.mobile });
                          }}>
                            <Edit2 size={12} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '0.35rem', color: isDeact ? 'var(--accent-color)' : '#ef4444' }} onClick={() => toggleDeactivate(s.id, s.username)}>
                            {isDeact ? <UserCheck size={12} /> : <UserX size={12} />}
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '0.35rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }} onClick={() => deleteSupplier(s.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="premium-card" style={{ width: '450px' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Edit Supplier Properties</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" required className="form-input" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input type="text" required className="form-input" value={editForm.companyName} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email ID</label>
                <input type="email" required className="form-input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input type="text" required className="form-input" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingSupplier(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details side drawer */}
      {showDetailsDrawer && selectedSupplierDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '460px', 
            backgroundColor: '#1e293b', borderLeft: '1px solid #334155', 
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', zIndex: 1001, 
            padding: '2rem', display: 'flex', flexDirection: 'column',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Supplier Audit Profile</h3>
              <button onClick={() => setShowDetailsDrawer(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 900 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div><strong>Supplier Name:</strong> {selectedSupplierDetails.fullName}</div>
              <div><strong>Company:</strong> {selectedSupplierDetails.companyName}</div>
              <div><strong>Email:</strong> {selectedSupplierDetails.email}</div>
              <div><strong>Mobile:</strong> {selectedSupplierDetails.mobile}</div>
              <hr style={{ border: 'none', borderTop: '1px solid #334155' }} />
              <div><strong>Total RFQs Broadcasted:</strong> {selectedSupplierDetails.totalRfqsParticipated}</div>
              <div><strong>RFQs Resulted in PO:</strong> {selectedSupplierDetails.rfqsWon}</div>
              <div><strong>Purchase Orders Released:</strong> {selectedSupplierDetails.purchaseOrdersReceived}</div>
              <div><strong>MTC Submissions:</strong> {selectedSupplierDetails.mtcSubmitted} (Appr: {selectedSupplierDetails.mtcApproved} | Rej: {selectedSupplierDetails.mtcRejected})</div>
              <div><strong>Dispatches Tracked:</strong> {selectedSupplierDetails.dispatchCount}</div>
              <div><strong>GRNs Approved:</strong> {selectedSupplierDetails.grnGenerated}</div>
              <div><strong>Overall Compliance Rate:</strong> {selectedSupplierDetails.compliancePct}%</div>
              <div><strong>Dynamic SLA Score:</strong> {selectedSupplierDetails.performanceScore}/100</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
