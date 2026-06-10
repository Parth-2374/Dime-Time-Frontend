import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Database, HardDrive, RefreshCcw, Download, AlertTriangle, CheckCircle, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

export default function SystemSettings({ user, onFeaturesChanged }) {
  const [features, setFeatures] = useState([]);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [featureForm, setFeatureForm] = useState({ name: '', module: 'AdminPanel', status: 'ENABLED' });

  const adminUsername = user?.username || 'admin';

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    setLoading(true);
    setError('');
    try {
      const [featRes, backupsRes] = await Promise.all([
        axios.get('http://localhost:8080/api/features'),
        axios.get('http://localhost:8080/api/backups')
      ]);
      if (featRes.data) setFeatures(featRes.data);
      if (backupsRes.data) setBackups(backupsRes.data);
    } catch (err) {
      console.error(err);
      setError('Could not establish synchronization with SCM configurations.');
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

  // --- FEATURE MANAGEMENT CRUD ---
  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFeature) {
        await axios.put(`http://localhost:8080/api/features/${editingFeature.id}`, featureForm);
        showToastSuccess(`Feature '${featureForm.name}' updated.`);
      } else {
        const payload = { ...featureForm, createdBy: adminUsername };
        await axios.post('http://localhost:8080/api/features', payload);
        showToastSuccess(`Feature '${featureForm.name}' added successfully.`);
      }
      setShowAddModal(false);
      setEditingFeature(null);
      fetchSystemData();
      triggerRefresh();
    } catch (err) {
      console.error(err);
      showToastError(err.response?.data || 'Failed to submit feature flag.');
    }
  };

  const toggleStatus = async (f, newStatus) => {
    try {
      const payload = { ...f, status: newStatus };
      await axios.put(`http://localhost:8080/api/features/${f.id}`, payload);
      showToastSuccess(`Feature '${f.name}' status set to ${newStatus}.`);
      fetchSystemData();
      triggerRefresh();
    } catch (err) {
      console.error(err);
      showToastError('Failed to alter status.');
    }
  };

  const deleteFeature = async (id) => {
    if (!window.confirm('Delete this feature flag?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/features/${id}`);
      showToastSuccess('Feature flag deleted.');
      fetchSystemData();
      triggerRefresh();
    } catch (err) {
      console.error(err);
      showToastError('Failed to delete feature flag.');
    }
  };

  // --- BACKUP CONTROLS ---
  const createBackup = async () => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:8080/api/backups/create?operator=${adminUsername}`);
      showToastSuccess('New database snapshot generated.');
      fetchSystemData();
    } catch (err) {
      showToastError('Backup generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const restoreSystem = async (filename) => {
    if (!window.confirm(`Restore database to checkpoint of ${filename}?`)) return;
    setLoading(true);
    try {
      await axios.post(`http://localhost:8080/api/backups/restore/${filename}?operator=${adminUsername}`);
      showToastSuccess('Ledger snapshot restored.');
      fetchSystemData();
    } catch (err) {
      showToastError('Restoration failed.');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupFile = (filename) => {
    window.open(`http://localhost:8080/api/backups/download/${filename}`);
    showToastSuccess('Backup package download started.');
  };

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '100%', width: '100%', margin: 0 }}>
      {/* Toast Alerts */}
      <div className="toast-container">
        {error && <div className="toast toast-error"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /><span>{error}</span></div></div>}
        {success && <div className="toast"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} /><span>{success}</span></div></div>}
      </div>

      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={24} style={{ color: 'var(--accent-color)' }} /> SCM Settings & Feature Toggles
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Manage global SCM modules, enable or disable features, and take database snapshots checkpoints.
        </p>
      </header>

      {/* Feature Management Panel */}
      <section className="premium-card" style={{ padding: 0, marginBottom: '2.5rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Feature Management Panel</h3>
          <button className="btn btn-primary" onClick={() => {
            setEditingFeature(null);
            setFeatureForm({ name: '', module: 'AdminPanel', status: 'ENABLED' });
            setShowAddModal(true);
          }} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
            <Plus size={14} /> Add Feature
          </button>
        </div>

        <div className="table-container" style={{ margin: 0, border: 'none' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Feature Name</th>
                <th>Module</th>
                <th>Status</th>
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
                      <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => toggleStatus(f, 'ENABLED')} title="Enable">
                        <Check size={12} style={{ color: 'var(--accent-color)' }} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => toggleStatus(f, 'DISABLED')} title="Disable">
                        <X size={12} style={{ color: '#ef4444' }} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => {
                        setEditingFeature(f);
                        setFeatureForm({ name: f.name, module: f.module, status: f.status });
                        setShowAddModal(true);
                      }} title="Edit feature">
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
      </section>

      {/* Database Backups Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <section className="premium-card" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Database Backups Checkpoints</h3>
            <button className="btn btn-secondary" onClick={createBackup} disabled={loading} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
              Create Backup
            </button>
          </div>

          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Backup Filename</th>
                  <th>Created At</th>
                  <th>Archive Size</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff' }}>{b.filename}</td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(b.createdAt).toLocaleString()}</td>
                    <td>{b.size}</td>
                    <td>
                      <span className={`badge ${b.status === 'SUCCESS' ? 'badge-success' : b.status === 'RESTORED' ? 'badge-info' : 'badge-warning'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.2rem' }} onClick={() => downloadBackupFile(b.filename)}>
                          <Download size={10} /> Download
                        </button>
                        <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.2rem' }} onClick={() => restoreSystem(b.filename)} disabled={loading}>
                          <RefreshCcw size={10} /> Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="premium-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardDrive size={18} style={{ color: 'var(--accent-color)' }} /> SCM Node Options
          </h3>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div><strong>Active Database:</strong> MySQL Localhost</div>
            <div><strong>Root Folder:</strong> D:/new dime time</div>
            <div><strong>Backup Path:</strong> C:/Users/Admin/.gemini/antigravity/backups</div>
            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <strong>Audit State:</strong> Transactional compliance check active.
            </div>
          </div>
        </section>
      </div>

      {/* Add/Edit Feature Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="premium-card" style={{ width: '450px' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              {editingFeature ? 'Edit SCM Feature' : 'Register New Feature Flag'}
            </h3>
            <form onSubmit={handleFeatureSubmit}>
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
