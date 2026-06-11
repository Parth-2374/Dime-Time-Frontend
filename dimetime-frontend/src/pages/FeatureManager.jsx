import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Edit2, Trash2, Check, X, EyeOff } from 'lucide-react';

export default function FeatureManager({ user, onFeaturesChanged }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [featureForm, setFeatureForm] = useState({ name: '', module: 'AdminPanel', status: 'ENABLED' });

  const adminUsername = user?.username || 'admin';

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('https://dime-time-backend.onrender.com/api/features');
      if (res.data) {
        setFeatures(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not establish connection with SCM feature flags registry.');
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

  const triggerRefresh = () => {
    if (onFeaturesChanged) {
      onFeaturesChanged();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFeature) {
        await axios.put(`https://dime-time-backend.onrender.com/api/features/${editingFeature.id}`, featureForm);
        showToastSuccess(`Feature config for '${featureForm.name}' updated.`);
      } else {
        const payload = { ...featureForm, createdBy: adminUsername };
        await axios.post('https://dime-time-backend.onrender.com/api/features', payload);
        showToastSuccess(`New Feature Flag '${featureForm.name}' registered.`);
      }
      setShowAddModal(false);
      setEditingFeature(null);
      fetchFeatures();
      triggerRefresh();
    } catch (err) {
      console.error(err);
      showToastError(err.response?.data || 'Failed to submit feature flag.');
    }
  };

  const toggleStatus = async (f, newStatus) => {
    try {
      const payload = { ...f, status: newStatus };
      await axios.put(`https://dime-time-backend.onrender.com/api/features/${f.id}`, payload);
      showToastSuccess(`Feature '${f.name}' status set to ${newStatus}.`);
      fetchFeatures();
      triggerRefresh();
    } catch (err) {
      console.error(err);
      showToastError('Failed to alter status.');
    }
  };

  const deleteFeature = async (id) => {
    if (!window.confirm('Terminate this feature flag permanent?')) return;
    try {
      await axios.delete(`https://dime-time-backend.onrender.com/api/features/${id}`);
      showToastSuccess('Feature flag deleted.');
      fetchFeatures();
      triggerRefresh();
    } catch (err) {
      console.error(err);
      showToastError('Purge failed.');
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      {/* Toast alert */}
      <div className="toast-container">
        {error && <div className="toast toast-error"><span>{error}</span></div>}
        {success && <div className="toast"><span>{success}</span></div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>Super Admin Feature Manager</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Enable, disable, or hide SCM modules globally. UI menus automatically recalculate visibility based on status changes.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingFeature(null);
          setFeatureForm({ name: '', module: 'AdminPanel', status: 'ENABLED' });
          setShowAddModal(true);
        }}>
          <Plus size={16} /> Create Feature Flag
        </button>
      </div>

      <div className="premium-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading feature flags status registry...</div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Feature Name</th>
                  <th>Module Category</th>
                  <th>Configured Status</th>
                  <th>Created By</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 700, color: '#fff' }}>{f.name}</td>
                    <td>{f.module}</td>
                    <td>
                      <span className={`badge ${f.status === 'ENABLED' ? 'badge-success' : f.status === 'DISABLED' ? 'badge-danger' : 'badge-warning'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>@{f.createdBy}</td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(f.createdDate).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => toggleStatus(f, 'ENABLED')} title="Enable globally">
                          <Check size={12} style={{ color: 'var(--accent-color)' }} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => toggleStatus(f, 'DISABLED')} title="Disable globally">
                          <X size={12} style={{ color: '#ef4444' }} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => toggleStatus(f, 'HIDDEN')} title="Hide menu link">
                          <EyeOff size={12} style={{ color: '#f59e0b' }} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => {
                          setEditingFeature(f);
                          setFeatureForm({ name: f.name, module: f.module, status: f.status });
                          setShowAddModal(true);
                        }}>
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }} onClick={() => deleteFeature(f.id)}>
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

      {/* Modal Add Feature */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="premium-card" style={{ width: '450px' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              {editingFeature ? 'Edit SCM Feature Configuration' : 'Register New Feature Flag'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Feature Name</label>
                <input type="text" required className="form-input" value={featureForm.name} onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Module Category</label>
                <input type="text" required className="form-input" value={featureForm.module} onChange={(e) => setFeatureForm({ ...featureForm, module: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Default Status</label>
                <select className="form-input" value={featureForm.status} onChange={(e) => setFeatureForm({ ...featureForm, status: e.target.value })}>
                  <option value="ENABLED">ENABLED</option>
                  <option value="DISABLED">DISABLED</option>
                  <option value="HIDDEN">HIDDEN</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Flag</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
