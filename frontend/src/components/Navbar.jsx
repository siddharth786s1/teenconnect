import React from 'react';
import { NavLink } from 'react-router-dom'; // Changed Link to NavLink for active styling
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-logo">TeenConnect</NavLink>
      <ul className="nav-links">
        <li><NavLink to="/" end>Home</NavLink></li>
        <li><NavLink to="/dashboard">Dashboard</NavLink></li>
        <li><NavLink to="/chat">Chat</NavLink></li>
        <li><NavLink to="/resources">Resources</NavLink></li>
        <li><NavLink to="/login">Login</NavLink></li>
        <li><NavLink to="/register">Register</NavLink></li>
        {/* Consider moving policy links to a footer */}
      </ul>
    </nav>
  );
}

export default Navbar;