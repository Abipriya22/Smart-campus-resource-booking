import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API = 'http://localhost:8000';

function Receipt({ booking, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="receipt-header">
          <div className="receipt-logo">🏛️ Smart Hall Booking — PSG Tech</div>
          <div className="receipt-title">✅ Approved Receipt</div>
          <div className="receipt-subtitle">Admin Approved Confirmation</div>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          {[
            ['Booking ID', booking.Booking_id],
            ['Student', booking.User_Name],
            ['Roll No', booking.User_id],
            ['Department', booking.Department],
            ['Hall', `${booking.Hall_no} — Block ${booking.Block}`],
            ['Hall Type', booking.Hall_Type],
            ['Date', booking.Booking_Date],
            ['Time', `${booking.Start_Time} – ${booking.End_Time}`],
            ['Purpose', booking.Purpose || '—'],
            ['Approved by', `Block ${booking.Block} Admin`],
          ].map(([label, value]) => (
            <div className="receipt-row" key={label}>
              <span className="label">{label}</span>
              <span className="value">{value}</span>
            </div>
          ))}
        </div>
        <div className="receipt-stamp"><p>✅ APPROVED — BLOCK {booking.Block} ADMIN</p></div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => window.print()}>🖨️ Print</button>
          <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Reject reason modal
function RejectModal({ booking, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '420px' }}>
        <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '8px', color: 'var(--danger)' }}>
          ❌ Reject Booking
        </h3>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Booking <strong style={{ color: 'var(--text)' }}>{booking.Booking_id}</strong> — {booking.Hall_no} ({booking.User_Name})
        </p>
        <div className="form-group">
          <label>Rejection Reason *</label>
          <textarea
            rows={3}
            placeholder="e.g. Hall under maintenance, Clashes with department event..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: '10px', color: 'var(--text)', fontFamily: 'DM Sans',
              fontSize: '0.95rem', outline: 'none', resize: 'vertical'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button
            className="btn btn-danger"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => reason.trim() ? onConfirm(reason) : alert('Please enter a reason')}
          >❌ Confirm Reject</button>
          <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('user') || '{}');

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [receipt, setReceipt] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/bookings`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      // Filter for THIS admin's block only
      setBookings(Array.isArray(data) ? data.filter(b => b.Block === admin.Block) : []);
    } catch {
      console.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [admin.Block]);

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 30000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  async function approveBooking(booking_id) {
    setActionLoading(booking_id + 'Approved');
    try {
      const res = await fetch(`${API}/bookings/${booking_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved', Reject_Reason: '' })
      });
      if (!res.ok) throw new Error('Failed');
      // Update local state immediately
      setBookings(prev => prev.map(b =>
        b.Booking_id === booking_id ? { ...b, Status: 'Approved', Reject_Reason: '' } : b
      ));
      // Show receipt
      const approved = bookings.find(b => b.Booking_id === booking_id);
      if (approved) setReceipt({ ...approved, Status: 'Approved' });
    } catch {
      alert('Action failed. Try again.');
    } finally {
      setActionLoading('');
    }
  }

  async function rejectBooking(booking_id, reason) {
    setRejectModal(null);
    setActionLoading(booking_id + 'Rejected');
    try {
      const res = await fetch(`${API}/bookings/${booking_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected', Reject_Reason: reason })
      });
      if (!res.ok) throw new Error('Failed');
      setBookings(prev => prev.map(b =>
        b.Booking_id === booking_id ? { ...b, Status: 'Rejected', Reject_Reason: reason } : b
      ));
    } catch {
      alert('Action failed. Try again.');
    } finally {
      setActionLoading('');
    }
  }

  const pending  = bookings.filter(b => b.Status === 'Pending');
  const approved = bookings.filter(b => b.Status === 'Approved');
  const rejected = bookings.filter(b => b.Status === 'Rejected');

  // Summary by hall
  const hallSummary = approved.reduce((acc, b) => {
    const key = b.Hall_no;
    if (!acc[key]) acc[key] = { hall: b.Hall_no, type: b.Hall_Type, count: 0 };
    acc[key].count++;
    return acc;
  }, {});

  const displayList = activeTab === 'pending' ? pending : activeTab === 'approved' ? approved : activeTab === 'rejected' ? rejected : [];

  return (
    <div>
      <nav className="nav">
        <span className="nav-logo">🏛️ Smart Hall Booking</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            padding: '6px 14px', background: 'rgba(59,130,246,0.15)', color: 'var(--accent)',
            borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'Syne', fontWeight: 700
          }}>🛡️ Admin — Block {admin.Block}</span>
        </div>
        <div className="nav-user">
          <div className="nav-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
            {admin.Name?.[0] || 'A'}
          </div>
          <span>{admin.Name}</span>
          <Link to="/admin-profile" className="nav-link" style={{ fontSize: '0.85rem' }}>Profile</Link>
          <button
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={loadBookings}
          >🔄 Refresh</button>
          <button className="logout-btn" onClick={() => { localStorage.removeItem('user'); navigate('/'); }}>Logout</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Block {admin.Block} · Managing all hall booking requests</p>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '36px' }}>
          <div className="stat-card cyan"><div className="stat-label">Total</div><div className="stat-value">{bookings.length}</div></div>
          <div className="stat-card amber"><div className="stat-label">Pending</div><div className="stat-value">{pending.length}</div></div>
          <div className="stat-card green"><div className="stat-label">Approved</div><div className="stat-value">{approved.length}</div></div>
          <div className="stat-card blue"><div className="stat-label">Rejected</div><div className="stat-value">{rejected.length}</div></div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>⏳ Pending ({pending.length})</button>
          <button className={`tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>✅ Approved ({approved.length})</button>
          <button className={`tab ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>❌ Rejected ({rejected.length})</button>
          <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>📊 Summary</button>
        </div>

        {/* SUMMARY */}
        {activeTab === 'summary' && (
          <div>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '20px' }}>Past Approvals — Block {admin.Block}</h3>
            {Object.keys(hallSummary).length === 0 ? (
              <div className="card"><div className="empty-state"><h3>No approved bookings yet</h3></div></div>
            ) : (
              <div className="card" style={{ marginBottom: '20px' }}>
                <h4 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '20px', fontSize: '0.95rem' }}>Bookings per Hall</h4>
                {Object.values(hallSummary).sort((a, b) => b.count - a.count).map(h => {
                  const max = Math.max(...Object.values(hallSummary).map(x => x.count));
                  return (
                    <div key={h.hall} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                        <span>{h.hall} <span style={{ color: 'var(--text2)', fontSize: '0.78rem' }}>({h.type})</span></span>
                        <span style={{ color: 'var(--accent)', fontFamily: 'Syne', fontWeight: 700 }}>{h.count}</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(h.count / max) * 100}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS TABLE */}
        {activeTab !== 'summary' && (
          loading ? (
            <div className="loading"><span className="spinner" />Loading...</div>
          ) : displayList.length === 0 ? (
            <div className="card"><div className="empty-state"><h3>No {activeTab} bookings for Block {admin.Block}</h3></div></div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Student</th>
                      <th>Hall</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Purpose</th>
                      <th>Status</th>
                      {activeTab === 'pending' && <th>Actions</th>}
                      {activeTab === 'approved' && <th>Receipt</th>}
                      {activeTab === 'rejected' && <th>Reason</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map(b => (
                      <tr key={b.Booking_id}>
                        <td style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent)' }}>{b.Booking_id}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{b.User_Name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{b.User_id} · {b.Department}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.Hall_no}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{b.Hall_Type}</div>
                        </td>
                        <td>{b.Booking_Date}</td>
                        <td style={{ fontSize: '0.82rem' }}>{b.Start_Time} – {b.End_Time}</td>
                        <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{b.Purpose || '—'}</td>
                        <td>
                          <span className={`badge badge-${b.Status.toLowerCase()}`}>
                            {b.Status === 'Approved' ? '✅' : b.Status === 'Pending' ? '⏳' : '❌'} {b.Status}
                          </span>
                        </td>

                        {/* PENDING - Approve / Reject buttons */}
                        {activeTab === 'pending' && (
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn btn-success"
                                style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                                disabled={actionLoading === b.Booking_id + 'Approved'}
                                onClick={() => approveBooking(b.Booking_id)}
                              >
                                {actionLoading === b.Booking_id + 'Approved' ? '...' : '✅ Approve'}
                              </button>
                              <button
                                className="btn btn-danger"
                                style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                                disabled={actionLoading === b.Booking_id + 'Rejected'}
                                onClick={() => setRejectModal(b)}
                              >
                                {actionLoading === b.Booking_id + 'Rejected' ? '...' : '❌ Reject'}
                              </button>
                            </div>
                          </td>
                        )}

                        {/* APPROVED - Receipt */}
                        {activeTab === 'approved' && (
                          <td>
                            <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => setReceipt(b)}>
                              🧾 Receipt
                            </button>
                          </td>
                        )}

                        {/* REJECTED - Show reason */}
                        {activeTab === 'rejected' && (
                          <td>
                            <div style={{
                              fontSize: '0.82rem', color: 'var(--danger)',
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.2)',
                              borderRadius: '8px', padding: '6px 10px',
                              maxWidth: '200px'
                            }}>
                              {b.Reject_Reason || 'No reason provided'}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {receipt && <Receipt booking={receipt} onClose={() => setReceipt(null)} />}
      {rejectModal && (
        <RejectModal
          booking={rejectModal}
          onConfirm={(reason) => rejectBooking(rejectModal.Booking_id, reason)}
          onCancel={() => setRejectModal(null)}
        />
      )}
    </div>
  );
}
