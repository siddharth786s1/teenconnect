import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // We'll create this file for styling

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} TeenConnect. All rights reserved.</p>
        <ul className="footer-links">
          <li><Link to="/privacy-policy">Privacy Policy</Link></li>
          <li><Link to="/terms-of-service">Terms of Service</Link></li>
          {/* Add other footer links if needed */}
        </ul>
      </div>
      <div className="footer-disclaimer">
        <p><strong>Important:</strong> TeenConnect is a supportive tool and NOT a replacement for professional medical or mental health services. If you are in crisis, please seek help from a trusted adult or contact a crisis hotline immediately.</p>
      </div>
    </footer>
  );
}

export default Footer;