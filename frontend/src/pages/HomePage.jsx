import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // We will create this for styling

function HomePage() {
  return (
    <div className="home-page-container">
      <header className="home-hero">
        <h1>Welcome to TeenConnect</h1>
        <p className="home-subtitle">Your Safe Space for Mental Wellness & Support</p>
        <p>
          Navigating the ups and downs of teenage life can be challenging.
          TeenConnect is here to provide you with tools, resources, and a supportive
          community to help you manage stress, understand your emotions, and build resilience.
        </p>
        <div className="home-cta-buttons">
          <Link to="/register" className="btn btn-primary">Get Started</Link>
          <Link to="/login" className="btn btn-secondary">Login</Link>
        </div>
      </header>

      <section className="home-features">
        <h2>What We Offer</h2>
        <div className="features-grid">
          <div className="feature-item">
            <h3>ConnectBot</h3>
            <p>Chat with our friendly AI bot for immediate support, guidance, or just to talk.</p>
            <Link to="/chat" className="learn-more-link">Chat Now &rarr;</Link>
          </div>
          <div className="feature-item">
            <h3>Wellness Dashboard</h3>
            <p>Track your mood, stress levels, and sleep patterns to understand your mental wellness journey.</p>
            <Link to="/dashboard" className="learn-more-link">Go to Dashboard &rarr;</Link>
          </div>
          <div className="feature-item">
            <h3>Curated Resources</h3>
            <p>Access a library of articles, tips, and links to external resources for mental health support.</p>
            <Link to="/resources" className="learn-more-link">Explore Resources &rarr;</Link>
          </div>
        </div>
      </section>

      <section className="home-testimonial">
        <h2>You Are Not Alone</h2>
        <p className="quote">
          "TeenConnect helped me realize that it's okay to not be okay sometimes.
          The resources and the chatbot have been incredibly helpful." - A Teen User
        </p>
      </section>
    </div>
  );
}

export default HomePage;