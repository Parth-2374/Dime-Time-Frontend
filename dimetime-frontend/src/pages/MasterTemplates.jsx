import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sliders, Plus, Edit2, Trash2 } from 'lucide-react';

export default function MasterTemplates({ user }) {
  const [subTabMaster, setSubTabMaster] = useState('grades');
  const [masterData, setMasterData] = useState({ grades: [], categories: [], chemical: [], mechanical: [], dimensions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showMasterModal, setShowMasterModal] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState(null);
  const [masterForm, setMasterForm] = useState({ name: '', description: '', status: 'Active' });

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    setLoading(true);
    setError('');
    try {
      const mdRes = await axios.get('http://localhost:8080/api/master-data');
      if (mdRes.data) {
        setMasterData(mdRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not sync Master Templates.');
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

  const handleMasterSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMasterItem) {
        await axios.put(`http://localhost:8080/api/master-data/${subTabMaster}/${editingMasterItem.id}`, masterForm);
        showToastSuccess('Master Data template updated successfully.');
      } else {
        await axios.post(`http://localhost:8080/api/master-data/${subTabMaster}`, masterForm);
        showToastSuccess('New Master Data template registered.');
      }
      setShowMasterModal(false);
      setEditingMasterItem(null);
      fetchMasterData();
    } catch (err) {
      console.error(err);
      showToastError('Failed to save master template.');
    }
  };

  const deleteMasterItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this master data template?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/master-data/${subTabMaster}/${id}`);
      showToastSuccess('Master template deleted.');
      fetchMasterData();
    } catch (err) {
      console.error(err);
      showToastError('Failed to delete master template.');
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      {/* Toast alerts */}
      <div className="toast-container">
        {error && <div className="toast toast-error"><span>{error}</span></div>}
        {success && <div className="toast"><span>{success}</span></div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={24} style={{ color: 'var(--accent-color)' }} /> Master Standards Templates
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Configure chemical and mechanical thresholds, material grades, categories, and dimension templates.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingMasterItem(null);
          setMasterForm({ name: '', description: '', status: 'Active' });
          setShowMasterModal(true);
        }}>
          <Plus size={16} /> Add Master Template
        </button>
      </div>

      {/* Sub-tabs master categories */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
        {[
          { id: 'grades', label: 'Material Grades' },
          { id: 'categories', label: 'Material Categories' },
          { id: 'chemical', label: 'Chemical Standards' },
          { id: 'mechanical', label: 'Mechanical Standards' },
          { id: 'dimensions', label: 'Dimension Templates' }
        ].map(sub => (
          <button
            key={sub.id}
            className={`btn ${subTabMaster === sub.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubTabMaster(sub.id)}
            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '20px' }}
          >
            {sub.label}
          </button>
        ))}
      </div>

      <div className="premium-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading templates data...</div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Name / Code</th>
                  <th>Standard Description / Formula</th>
                  <th>Status</th>
                  <th>Last Modified</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(masterData[subTabMaster] || []).map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: '#fff' }}>{item.name}</td>
                    <td>{item.description}</td>
                    <td>
                      <span className="badge badge-success">{item.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => {
                          setEditingMasterItem(item);
                          setMasterForm({ name: item.name, description: item.description, status: item.status });
                          setShowMasterModal(true);
                        }}>
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }} onClick={() => deleteMasterItem(item.id)}>
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

      {/* Master Data Add/Edit Modal */}
      {showMasterModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="premium-card" style={{ width: '450px' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              {editingMasterItem ? 'Edit Master Template Data' : 'Add Master Template Data'}
            </h3>
            <form onSubmit={handleMasterSubmit}>
              <div className="form-group">
                <label className="form-label">Name / Code Value</label>
                <input type="text" required className="form-input" value={masterForm.name} onChange={(e) => setMasterForm({ ...masterForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description / Parameters</label>
                <textarea required className="form-input" style={{ height: '80px' }} value={masterForm.description} onChange={(e) => setMasterForm({ ...masterForm, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={masterForm.status} onChange={(e) => setMasterForm({ ...masterForm, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMasterModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
