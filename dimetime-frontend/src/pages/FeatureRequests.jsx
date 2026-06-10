import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sliders, Plus, Edit2, Trash2, CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';

export default function FeatureRequests({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRequest, setNewRequest] = useState({ priority: 'MEDIUM', description: '' });
  const [selectedRequest, setSelectedRequest] = useState(null);

  const adminUsername = user?.username || 'admin';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:8080/api/feature-requests');
      if (res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not sync Feature Requests registry.');
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

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        requestedBy: adminUsername,
        priority: newRequest.priority,
        description: newRequest.description,
        status: 'PENDING'
      };
      await axios.post('http://localhost:8080/api/feature-requests', payload);
      showToastSuccess('Feature request submitted successfully.');
      setShowAddModal(false);
      setNewRequest({ priority: 'MEDIUM', description: '' });
      fetchRequests();
    } catch (err) {
      console.error(err);
      showToastError('Failed to submit suggestion.');
    }
  };

  const handleDecision = async (id, status) => {
    try {
      const req = requests.find(r => r.id === id);
      const payload = { ...req, status };
      await axios.put(`http://localhost:8080/api/feature-requests/${id}`, payload);
      showToastSuccess(`Request status updated to ${status}.`);
      fetchRequests();
    } catch (err) {
      console.error(err);
      showToastError('Decision execution failed.');
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm('Purge this request?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/feature-requests/${id}`);
      showToastSuccess('Request deleted.');
      fetchRequests();
    } catch (err) {
      console.error(err);
      showToastError('Purge request failed.');
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      {/* Toast Alert */}
      <div className="toast-container">
        {error && <div className="toast toast-error"><span>{error}</span></div>}
        {success && <div className="toast"><span>{success}</span></div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>New Feature Requests Center</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Submit SCM tool enhancements, vote on upgrades, and track developers review status.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Submit Suggestion
        </button>
      </div>

      <div className="premium-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading suggestions data...</div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Requested By</th>
                  <th>Priority</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-color)' }}>#REQ-{r.id}</td>
                    <td style={{ fontFamily: 'monospace' }}>@{r.requestedBy}</td>
                    <td>
                      <span className={`badge ${r.priority === 'HIGH' ? 'badge-danger' : r.priority === 'MEDIUM' ? 'badge-warning' : 'badge-info'}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td style={{ maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</td>
                    <td>
                      <span className={`badge ${r.status === 'IMPLEMENTED' || r.status === 'APPROVED' ? 'badge-success' : r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(r.createdDate).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => setSelectedRequest(r)}>
                          <Eye size={12} />
                        </button>
                        {user?.role === 'ADMIN' && (
                          <>
                            <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => handleDecision(r.id, 'APPROVED')} title="Approve Request">
                              <CheckCircle size={12} style={{ color: 'var(--accent-color)' }} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => handleDecision(r.id, 'REJECTED')} title="Reject Request">
                              <XCircle size={12} style={{ color: '#ef4444' }} />
                            </button>
                          </>
                        )}
                        <button className="btn btn-secondary" style={{ padding: '0.35rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }} onClick={() => deleteRequest(r.id)}>
                          <Trash2 size={12} />
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

      {/* Suggestion Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="premium-card" style={{ width: '450px' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Submit SCM Feature Request</h3>
            <form onSubmit={handleSubmitRequest}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={newRequest.priority} onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Enhancement Description</label>
                <textarea required className="form-input" style={{ height: '100px' }} value={newRequest.description} onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suggestion Details Modal */}
      {selectedRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="premium-card" style={{ width: '500px' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Feature Request Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div><strong>Request ID:</strong> #REQ-{selectedRequest.id}</div>
              <div><strong>Requested By:</strong> @{selectedRequest.requestedBy}</div>
              <div><strong>Priority:</strong> <span className="badge badge-info">{selectedRequest.priority}</span></div>
              <div><strong>Review Status:</strong> <span className={`badge ${selectedRequest.status === 'IMPLEMENTED' || selectedRequest.status === 'APPROVED' ? 'badge-success' : selectedRequest.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{selectedRequest.status}</span></div>
              <div><strong>Created Date:</strong> {new Date(selectedRequest.createdDate).toLocaleString()}</div>
              {user?.role === 'ADMIN' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <strong>Action Transition:</strong>
                  <select 
                    className="form-input" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '150px' }} 
                    value={selectedRequest.status} 
                    onChange={(e) => {
                      handleDecision(selectedRequest.id, e.target.value);
                      setSelectedRequest({ ...selectedRequest, status: e.target.value });
                    }}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="IMPLEMENTED">IMPLEMENTED</option>
                  </select>
                </div>
              )}
              <div><strong>Description:</strong></div>
              <div style={{ background: '#0b0f19', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>{selectedRequest.description}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
