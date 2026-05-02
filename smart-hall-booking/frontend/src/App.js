import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import NewBooking from './pages/NewBooking';
import AllBookings from './pages/AllBookings';
import AdminDashboard from './pages/AdminDashboard';
import StudentProfile from './pages/StudentProfile';
import AdminProfile from './pages/AdminProfile';
import './App.css';

function App() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isStudent = user && user.type === 'student';
  const isAdmin   = user && user.type === 'admin';

  return (
    <Router>
      <Routes>
        <Route path="/"             element={<Login />} />
        <Route path="/home"         element={isStudent ? <Home />           : <Navigate to="/" />} />
        <Route path="/new-booking"  element={isStudent ? <NewBooking />     : <Navigate to="/" />} />
        <Route path="/my-bookings"  element={isStudent ? <AllBookings />    : <Navigate to="/" />} />
        <Route path="/profile"      element={isStudent ? <StudentProfile /> : <Navigate to="/" />} />
        <Route path="/admin"        element={isAdmin   ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="/admin-profile" element={isAdmin  ? <AdminProfile />   : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
