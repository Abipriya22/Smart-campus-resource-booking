import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000';

export default function AdminProfile() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('user') || '{}');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/profile/admin/${admin.Admin_id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [admin.Admin_id]);

  function logout() { localStorage.removeItem('user'); navigate('/'); }

  return (
    <div>
      <nav className="nav">
        <span className="nav-logo">🏛️ Smart Hall Booking</span>
        <div className="nav-links">
          <Link to="/admin" className="nav-link">Dashboard</Link>
          <Link to="/admin-profile" className="nav-link active">Profile</Link>
        </div>
        <div className="nav-user">
          <div className="nav-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
            {admin.Name?.[0] || 'A'}
          </div>
          <span>{admin.Name}</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>Admin Profile</h1>
          <p>Your account details and block statistics</p>
        </div>

        {loading ? (
          <div className="loading"><span className="spinner" />Loading...</div>
        ) : profile ? (
          <div>
            {/* Profile Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontFamily: 'Syne', fontWeight: 800, color: 'white',
                  flexShrink: 0
                }}>
                  {profile.Name?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem', marginBottom: '4px' }}>{profile.Name}</h2>
                  <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Block {profile.Block} Administrator</p>
                </div>
                <div style={{
                  padding: '8px 16px', background: 'rgba(245,158,11,0.15)',
                  borderRadius: '8px', color: 'var(--warn)',
                  fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem'
                }}>
                  🛡️ Admin
                </div>
              </div>

              <div className="divider" />

              <div className="grid-2">
                {[
                  ['Admin ID', profile.Admin_id, '🪪'],
                  ['Block', `Block ${profile.Block}`, '🏢'],
                  ['Role', 'Block Administrator', '🛡️'],
                  ['Managed Block', profile.Block, '🗝️'],
                ].map(([label, value, icon]) => (
                  <div key={label} style={{
                    padding: '16px', background: 'var(--surface2)',
                    borderRadius: '10px', border: '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {icon} {label}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Block Stats */}
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '16px' }}>Block {profile.Block} Statistics</h3>
            <div className="grid-4" style={{ marginBottom: '24px' }}>
              <div className="stat-card cyan"><div className="stat-label">Total Requests</div><div className="stat-value">{profile.total_bookings || 0}</div></div>
              <div className="stat-card green"><div className="stat-label">Approved</div><div className="stat-value">{profile.approved || 0}</div></div>
              <div className="stat-card amber"><div className="stat-label">Pending</div><div className="stat-value">{profile.pending || 0}</div></div>
              <div className="stat-card blue"><div className="stat-label">Rejected</div><div className="stat-value">{profile.rejected || 0}</div></div>
            </div>

            <Link to="/admin"><button className="btn btn-primary">← Back to Dashboard</button></Link>
          </div>
        ) : (
          <div className="card"><div className="empty-state"><h3>Profile not found</h3></div></div>
        )}
      </div>
    </div>
  );
}
