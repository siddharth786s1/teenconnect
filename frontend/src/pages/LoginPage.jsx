import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function LoginPage() {
  const [identifier, setIdentifier] = useState(''); // Can be email or username
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // For displaying messages
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('accessToken', data.access_token); // Store the token
        localStorage.setItem('username', data.username); // Store username
        setMessage('Login successful! Redirecting to dashboard...');
        // TODO: Update auth state in a global context if using one
        setTimeout(() => {
          navigate('/dashboard'); // Redirect to dashboard or home page
        }, 1500);
      } else {
        setMessage(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('An error occurred during login. Please try again later.');
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="identifier">Email or Username:</label>
          <input 
            type="text" 
            id="identifier" 
            value={identifier} 
            onChange={(e) => setIdentifier(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default LoginPage;