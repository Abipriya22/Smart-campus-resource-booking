import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000';

function Receipt({ booking, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="receipt-header">
          <div className="receipt-logo">🏛️ Smart Hall Booking — PSG Tech</div>
          <div className="receipt-title">✅ Booking Confirmed</div>
          <div className="receipt-subtitle">Official Confirmation Receipt</div>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          {[
            ['Booking ID', booking.Booking_id],
            ['Roll Number', booking.User_id],
            ['Hall', `${booking.Hall_no} — Block ${booking.Block}`],
            ['Hall Type', booking.Hall_Type],
            ['Date', booking.Booking_Date],
            ['Time', `${booking.Start_Time} – ${booking.End_Time}`],
            ['Purpose', booking.Purpose || '—'],
            ['Status', '✅ Approved'],
          ].map(([label, value]) => (
            <div className="receipt-row" key={label}>
              <span className="label">{label}</span>
              <span className="value">{value}</span>
            </div>
          ))}
        </div>
        <div className="receipt-stamp">
          <p>✅ APPROVED — Please carry this receipt</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => window.print()}>🖨️ Print</button>
          <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AllBookings() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [filter, setFilter] = useState('All');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/bookings/user/${user.User_id}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      console.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user.User_id]);

  useEffect(() => {
    loadBookings();
    // Auto refresh every 30 seconds
    const interval = setInterval(loadBookings, 30000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  async function cancelBooking(id) {
    if (!window.confirm('Cancel this booking?')) return;
    await fetch(`${API}/bookings/${id}`, { method: 'DELETE' });
    setBookings(bookings.filter(b => b.Booking_id !== id));
  }

  const filtered = filter === 'All' ? bookings : bookings.filter(b => b.Status === filter);

  const counts = {
    All: bookings.length,
    Pending: bookings.filter(b => b.Status === 'Pending').length,
    Approved: bookings.filter(b => b.Status === 'Approved').length,
    Rejected: bookings.filter(b => b.Status === 'Rejected').length,
  };

  return (
    <div>
      <nav className="nav">
        <span className="nav-logo">🏛️ Smart Hall Booking</span>
        <div className="nav-links">
          <Link to="/home" className="nav-link">Home</Link>
          <Link to="/new-booking" className="nav-link">New Booking</Link>
          <Link to="/my-bookings" className="nav-link active">My Bookings</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
        </div>
        <div className="nav-user">
          <div className="nav-avatar">{user.Name?.[0] || 'U'}</div>
          <span>{user.Name}</span>
          <button
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem', marginLeft: '8px' }}
            onClick={loadBookings}
          >🔄 Refresh</button>
          <button className="logout-btn" onClick={() => { localStorage.removeItem('user'); navigate('/'); }}>Logout</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>My Bookings</h1>
          <p>Track all your hall booking requests</p>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          <div className="stat-card cyan"><div className="stat-label">Total</div><div className="stat-value">{counts.All}</div></div>
          <div className="stat-card amber"><div className="stat-label">Pending</div><div className="stat-value">{counts.Pending}</div></div>
          <div className="stat-card green"><div className="stat-label">Approved</div><div className="stat-value">{counts.Approved}</div></div>
          <div className="stat-card blue"><div className="stat-label">Rejected</div><div className="stat-value">{counts.Rejected}</div></div>
        </div>

        {/* Filter Tabs */}
        <div className="tabs">
          {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
            <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s} ({counts[s]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading"><span className="spinner" />Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <h3>No bookings found</h3>
              <p>{filter !== 'All' ? `No ${filter.toLowerCase()} bookings` : 'No bookings yet'}</p>
              <Link to="/new-booking"><button className="btn btn-primary" style={{ marginTop: '16px' }}>+ New Booking</button></Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Hall</th>
                    <th>Block</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.Booking_id}>
                      <td style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent)' }}>{b.Booking_id}</td>
                      <td style={{ fontWeight: 500 }}>{b.Hall_no}</td>
                      <td>Block {b.Block}</td>
                      <td>{b.Booking_Date}</td>
                      <td style={{ fontSize: '0.82rem' }}>{b.Start_Time} – {b.End_Time}</td>
                      <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{b.Purpose || '—'}</td>
                      <td>
                        <span className={`badge badge-${b.Status.toLowerCase()}`}>
                          {b.Status === 'Approved' ? '✅' : b.Status === 'Pending' ? '⏳' : '❌'} {b.Status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {b.Status === 'Approved' && (
                            <button
                              className="btn btn-success"
                              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                              onClick={() => setReceipt(b)}
                            >🧾 Receipt</button>
                          )}
                          {b.Status === 'Pending' && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                              onClick={() => cancelBooking(b.Booking_id)}
                            >Cancel</button>
                          )}
                          {b.Status === 'Rejected' && (
                            <div style={{
                              fontSize: '0.8rem',
                              color: 'var(--danger)',
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.25)',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              maxWidth: '200px'
                            }}>
                              ❌ <strong>Reason:</strong><br />
                              {b.Reject_Reason || 'No reason provided'}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {receipt && <Receipt booking={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
