import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, UserCheck, Shield, Building, Mail, Phone, Calendar, Clock,
  Search, Filter, Plus, Edit2, Trash2, Key, Download, FileSpreadsheet,
  FileText, Eye, AlertTriangle, CheckCircle, X, ChevronLeft, ChevronRight,
  UserX, ShieldAlert, MoreVertical
} from 'lucide-react';

export default function AdminPanel({ user: currentUser }) {
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Deactivated users state saved in localStorage for persistence
  const [deactivatedUsers, setDeactivatedUsers] = useState(() => {
    const saved = localStorage.getItem('dimetime_deactivated_users');
    return saved ? JSON.parse(saved) : [];
  });

  // Table filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sorting
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add/Edit User Dialog State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    fullName: '', email: '', mobile: '', companyName: '', username: '', password: '', role: 'SUPPLIER', gstNumber: '', address: '', contactPerson: ''
  });

  // Drawer details view State
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const adminUsername = currentUser?.username || 'admin';

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    localStorage.setItem('dimetime_deactivated_users', JSON.stringify(deactivatedUsers));
  }, [deactivatedUsers]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/users');
      if (response.data) {
        setUsersList(response.data);
      }
    } catch (err) {
      console.error(err);
      showToastError('Failed to synchronize user accounts registry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/audit-logs');
      if (response.data) {
        setAuditLogs(response.data);
      }
    } catch (err) {
      console.error('Failed to sync activities.', err);
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

  // --- CRUD METHODS ---
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Edit User
        const response = await axios.put(`http://localhost:8080/api/users/${editingUser.id}?operator=${adminUsername}`, userForm);
        showToastSuccess(`Profile for ${response.data.fullName} successfully updated!`);
      } else {
        // Create User
        await axios.post('http://localhost:8080/api/users', userForm);
        showToastSuccess(`Successfully created user @${userForm.username}!`);
      }
      setShowAddUserModal(false);
      setEditingUser(null);
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      showToastError(err.response?.data || 'Failed to submit User credentials.');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/users/${id}?operator=${adminUsername}`);
      showToastSuccess('User account deactivated and purged from registry.');
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      showToastError('Purge request denied.');
    }
  };

  const toggleDeactivate = (userId, username) => {
    const isDeactivated = deactivatedUsers.includes(userId);
    if (isDeactivated) {
      setDeactivatedUsers(deactivatedUsers.filter(id => id !== userId));
      showToastSuccess(`User @${username} account reactivated successfully.`);
    } else {
      setDeactivatedUsers([...deactivatedUsers, userId]);
      showToastSuccess(`User @${username} account deactivated.`);
    }
  };

  const resetPassword = async (id) => {
    const newPass = window.prompt('Enter new password for this user:');
    if (!newPass) return;
    try {
      await axios.put(`http://localhost:8080/api/users/${id}/reset-password?password=${newPass}&operator=${adminUsername}`);
      showToastSuccess('User password reset successfully.');
    } catch (err) {
      console.error(err);
      showToastError('Failed to reset password.');
    }
  };

  // --- EXPORT FUNCTIONS ---
  const exportUsers = (format) => {
    const headers = ['User ID,Name,Username,Email,Company,Role,Status,Created Date'];
    const rows = usersList.map(u => {
      const status = deactivatedUsers.includes(u.id) ? 'Deactivated' : 'Active';
      return `${u.id},${u.fullName},@${u.username},${u.email},${u.companyName},${u.role},${status},${new Date(u.createdAt).toLocaleDateString()}`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dimetime_user_management_${new Date().toISOString().slice(0,10)}.${format === 'csv' ? 'csv' : 'txt'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastSuccess(`Users exported as ${format.toUpperCase()}.`);
  };

  // --- FILTERS & SORTING & PAGINATION ---
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter(u => {
    const searchMatch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const roleMatch = roleFilter === 'ALL' || u.role === roleFilter;
    
    const isDeact = deactivatedUsers.includes(u.id);
    const statusMatch = statusFilter === 'ALL' || 
                        (statusFilter === 'ACTIVE' && !isDeact) || 
                        (statusFilter === 'DEACTIVATED' && isDeact);

    return searchMatch && roleMatch && statusMatch;
  });

  // Sorted Users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    if (sortField === 'status') {
      valA = deactivatedUsers.includes(a.id) ? 'Deactivated' : 'Active';
      valB = deactivatedUsers.includes(b.id) ? 'Deactivated' : 'Active';
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated Users
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(sortedUsers.length / pageSize);

  // --- KPI CARD COMPUTATIONS ---
  const totalUsersCount = usersList.length;
  const deactivatedCount = deactivatedUsers.filter(id => usersList.some(u => u.id === id)).length;
  const activeUsersCount = totalUsersCount - deactivatedCount;
  const suppliersCount = usersList.filter(u => u.role === 'SUPPLIER').length;
  const manufacturersCount = usersList.filter(u => u.role === 'MANUFACTURER').length;
  const auditorsCount = usersList.filter(u => u.role === 'AUDITOR').length;
  const adminsCount = usersList.filter(u => u.role === 'ADMIN').length;

  // Render role badges
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'badge-danger';
      case 'SUPPLIER': return 'badge-success';
      case 'MANUFACTURER': return 'badge-info';
      case 'AUDITOR': return 'badge-warning';
      default: return '';
    }
  };

  // Role permissions detail generator
  const getRolePermissions = (role) => {
    switch (role) {
      case 'ADMIN':
        return [
          'Full administrative system privileges',
          'Provision, update, de-activate user accounts',
          'Perform database dumps, backups, and restores',
          'Inspect full audit ledger trails'
        ];
      case 'SUPPLIER':
        return [
          'Create & broadcast RFQs to manufacturers',
          'Review bids, select quotations, and auto-generate POs',
          'Upload receipt label images for AI verification',
          'Manage GRN registry'
        ];
      case 'MANUFACTURER':
        return [
          'Review broadcasted RFQs and submit quotation bids',
          'Manage production queue status',
          'Upload MTC label files & generate certificates',
          'Configure material dispatches'
        ];
      case 'AUDITOR':
        return [
          'Read-only access to dispatches, GRNs, and reconciliation match logs',
          'Read-only access to system audit logs'
        ];
      default:
        return [];
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '100%', width: '100%', margin: 0 }}>
      {/* Toast notifications */}
      <div className="toast-container">
        {error && <div className="toast toast-error"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /><span>{error}</span></div></div>}
        {success && <div className="toast"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} /><span>{success}</span></div></div>}
      </div>

      {/* Header section */}
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>System User Management</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Manage suppliers, manufacturers, auditors and administrators.
        </p>
      </header>

      {/* KPI Cards Row */}
      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '2rem' }}>
        {[
          { title: 'Total Users', value: totalUsersCount, icon: Users, color: '#3b82f6' },
          { title: 'Active Users', value: activeUsersCount, icon: UserCheck, color: '#10b981' },
          { title: 'Suppliers', value: suppliersCount, icon: Building, color: '#f59e0b' },
          { title: 'Manufacturers', value: manufacturersCount, icon: Building, color: '#8b5cf6' },
          { title: 'Auditors', value: auditorsCount, icon: ShieldAlert, color: '#06b6d4' },
          { title: 'Admins', value: adminsCount, icon: Shield, color: '#ef4444' }
        ].map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="stat-card" style={{ borderLeft: `4px solid ${c.color}` }}>
              <div className="stat-icon-wrapper" style={{ color: c.color, backgroundColor: `${c.color}0d` }}>
                <Icon size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-title">{c.title}</span>
                <span className="stat-value">{c.value}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Action Bar */}
      <section className="premium-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 2 }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search Users by name, username, email, company..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="form-input"
              style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Role Filter */}
          <div style={{ flex: 1 }}>
            <select className="form-input" style={{ fontSize: '0.85rem', padding: '0.65rem' }} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}>
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPPLIER">SUPPLIER</option>
              <option value="MANUFACTURER">MANUFACTURER</option>
              <option value="AUDITOR">AUDITOR</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ flex: 1 }}>
            <select className="form-input" style={{ fontSize: '0.85rem', padding: '0.65rem' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DEACTIVATED">DEACTIVATED</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => exportUsers('csv')} style={{ gap: '0.3rem', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button className="btn btn-secondary" onClick={() => exportUsers('pdf')} style={{ gap: '0.3rem', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            <FileText size={14} /> Export PDF
          </button>
          <button className="btn btn-primary" onClick={() => {
            setEditingUser(null);
            setUserForm({ fullName: '', email: '', mobile: '', companyName: '', username: '', password: '', role: 'SUPPLIER', gstNumber: '', address: '', contactPerson: '' });
            setShowAddUserModal(true);
          }} style={{ gap: '0.3rem', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            <Plus size={14} /> Add User
          </button>
        </div>
      </section>

      {/* Main Table */}
      <section className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ margin: 0, border: 'none' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>User ID</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('fullName')}>Name</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('email')}>Email</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('companyName')}>Company</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('role')}>Role</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>Created Date</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => {
                const isDeactivated = deactivatedUsers.includes(u.id);
                return (
                  <tr key={u.id} style={{ opacity: isDeactivated ? 0.6 : 1 }}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-color)', fontWeight: 600 }}>#{u.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{u.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>@{u.username}</div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.companyName}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isDeactivated ? 'badge-danger' : 'badge-success'}`}>
                        {isDeactivated ? 'Deactivated' : 'Active'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Today, 10:15 AM
                    </td>
                     <td style={{ textAlign: 'right', width: '130px', minWidth: '130px', position: 'relative' }}>
                       <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                         <button 
                           className="btn btn-secondary" 
                           style={{ padding: '0.35rem' }} 
                           onClick={() => {
                             setSelectedUser(u);
                             setShowDrawer(true);
                           }} 
                           title="View user details drawer"
                         >
                           <Eye size={12} />
                         </button>
                         
                         <div style={{ position: 'relative' }}>
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setOpenDropdownId(openDropdownId === u.id ? null : u.id);
                             }}
                             className="btn btn-secondary"
                             style={{ padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                             title="More Actions"
                           >
                             <MoreVertical size={12} />
                           </button>

                           {openDropdownId === u.id && (
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
                                 className="dropdown-item" 
                                 style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }} 
                                 onClick={() => {
                                   setEditingUser(u);
                                   setUserForm({ ...u, password: '' });
                                   setShowAddUserModal(true);
                                   setOpenDropdownId(null);
                                 }} 
                                 title="Edit user profile"
                               >
                                 <Edit2 size={12} />
                                 <span>Edit</span>
                               </button>

                               <button 
                                 className="dropdown-item" 
                                 style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }} 
                                 onClick={() => { resetPassword(u.id); setOpenDropdownId(null); }} 
                                 title="Reset account password"
                               >
                                 <Key size={12} />
                                 <span>Reset Pass</span>
                               </button>

                               <button 
                                 className="dropdown-item" 
                                 style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: isDeactivated ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }} 
                                 onClick={() => { toggleDeactivate(u.id, u.username); setOpenDropdownId(null); }} 
                                 title={isDeactivated ? "Reactivate account" : "Deactivate account"}
                               >
                                 {isDeactivated ? <UserCheck size={12} /> : <UserX size={12} />}
                                 <span>{isDeactivated ? 'Activate' : 'Deactivate'}</span>
                               </button>

                               {u.username !== 'admin' && (
                                 <button 
                                   className="dropdown-item" 
                                   style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textAlign: 'left', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px' }} 
                                   onClick={() => { deleteUser(u.id); setOpenDropdownId(null); }} 
                                   title="Delete account permanent"
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
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination row */}
      {totalPages > 1 && (
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0 0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Showing Page {currentPage} of {totalPages} ({filteredUsers.length} total matched users)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              <ChevronLeft size={14} /> Prev
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* Add/Edit User Modal Dialog */}
      {showAddUserModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="premium-card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              {editingUser ? 'Modify User Profile' : 'Register Enterprise Account'}
            </h3>
            <form onSubmit={handleUserSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" required className="form-input" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input type="text" required disabled={!!editingUser} className="form-input" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email ID</label>
                  <input type="email" required className="form-input" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input type="text" required className="form-input" value={userForm.mobile} onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input type="text" required className="form-input" value={userForm.companyName} onChange={(e) => setUserForm({ ...userForm, companyName: e.target.value })} />
                </div>
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label className="form-label">Secure Password</label>
                  <input type="password" required className="form-input" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">System Role Type</label>
                <select className="form-input" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="SUPPLIER">SUPPLIER</option>
                  <option value="MANUFACTURER">MANUFACTURER</option>
                  <option value="AUDITOR">AUDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input type="text" className="form-input" value={userForm.gstNumber || ''} onChange={(e) => setUserForm({ ...userForm, gstNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Address Description</label>
                <textarea className="form-input" style={{ height: '60px' }} value={userForm.address || ''} onChange={(e) => setUserForm({ ...userForm, address: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SIDE DRAWER --- */}
      {showDrawer && selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '460px', 
            backgroundColor: '#1e293b', borderLeft: '1px solid #334155', 
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', zIndex: 1001, 
            padding: '2rem', display: 'flex', flexDirection: 'column',
            overflowY: 'auto'
          }}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>User Audit Profile Drawer</h3>
              <button onClick={() => setShowDrawer(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Profile details */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Profile Details</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#0b0f19', padding: '1rem', borderRadius: '8px' }}>
                <div><strong>Full Name:</strong> {selectedUser.fullName}</div>
                <div><strong>Username:</strong> @{selectedUser.username}</div>
                <div><strong>Email Address:</strong> {selectedUser.email}</div>
                <div><strong>Contact Number:</strong> {selectedUser.mobile}</div>
                <div><strong>Created Date:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Company details */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Company Details</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#0b0f19', padding: '1rem', borderRadius: '8px' }}>
                <div><strong>Company Name:</strong> {selectedUser.companyName}</div>
                <div><strong>GST Number:</strong> {selectedUser.gstNumber || 'N/A'}</div>
                <div><strong>Company Address:</strong> {selectedUser.address || 'N/A'}</div>
                <div><strong>Contact Person:</strong> {selectedUser.contactPerson || 'N/A'}</div>
              </div>
            </div>

            {/* Role permissions */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Role Permission Matrices</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: '#0b0f19', padding: '1rem', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--accent-color)', fontSize: '0.85rem' }}>Permissions for {selectedUser.role}:</strong>
                {getRolePermissions(selectedUser.role).map((perm, index) => (
                  <div key={index} style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.3rem' }}>
                    <span>•</span>
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity log */}
            <div>
              <span className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Live Activity Logs</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', background: '#0b0f19', padding: '1rem', borderRadius: '8px' }}>
                {auditLogs.filter(log => log.performedBy === selectedUser.username).length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>No activity logged by this user.</span>
                ) : (
                  auditLogs
                    .filter(log => log.performedBy === selectedUser.username)
                    .map((log) => (
                      <div key={log.id} style={{ fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.25rem' }}>
                        <span style={{ color: '#fff' }}>{log.activity}</span>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                    ))
                )}
              </div>
            </div>
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
