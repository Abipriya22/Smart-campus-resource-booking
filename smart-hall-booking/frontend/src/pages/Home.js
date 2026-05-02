import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  function logout() {
    localStorage.removeItem('user');
    navigate('/');
  }

  return (
    <div>
      {/* NAV */}
      <nav className="nav">
        <span className="nav-logo">🏛️ Smart Hall Booking</span>
        <div className="nav-links">
          <Link to="/home" className="nav-link active">Home</Link>
          <Link to="/new-booking" className="nav-link">New Booking</Link>
          <Link to="/my-bookings" className="nav-link">My Bookings</Link>
        </div>
        <div className="nav-user">
          <div className="nav-avatar">{user.Name?.[0] || 'U'}</div>
          <span>{user.Name}</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="page">
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(6,182,212,0.08) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '48px 40px',
          marginBottom: '36px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '220px', height: '220px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />
          <p style={{ color: 'var(--accent)', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Welcome back
          </p>
          <h1 style={{ fontFamily: 'Syne', fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '10px' }}>
            {user.Name} 👋
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.95rem', marginBottom: '28px' }}>
            {user.Department} · {user.User_id} · {user.User_type}
          </p>
          <Link to="/new-booking">
            <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 28px' }}>
              + Book a Hall
            </button>
          </Link>
        </div>

        {/* Quick Links */}
        <h2 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '20px' }}>Quick Actions</h2>
        <div className="grid-3">
          <Link to="/new-booking" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>📅</div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '6px' }}>New Booking</h3>
              <p style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Pick a date & book available halls</p>
            </div>
          </Link>
          <Link to="/my-bookings" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>📋</div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '6px' }}>My Bookings</h3>
              <p style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Track status of your requests</p>
            </div>
          </Link>
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>ℹ️</div>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '6px' }}>How it Works</h3>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Book → Admin reviews → Get confirmation</p>
          </div>
        </div>

        {/* Info */}
        <div className="divider" />
        <div className="alert alert-info">
          📌 Bookings are reviewed by the respective block admin. You'll see status updates in <strong>My Bookings</strong>.
        </div>
      </div>
    </div>
  );
}