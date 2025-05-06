import React, { useState, useEffect, useRef } from 'react';
import './ChatbotPage.css'; // We will create this for styling

function ChatbotPage() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);

  // Function to scroll to the bottom of the chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { sender: 'user', text: message };
    setChatHistory(prevHistory => [...prevHistory, userMessage]);
    setMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken'); // Assuming token is stored in localStorage
      if (!token) {
        setError('You must be logged in to chat.');
        setIsLoading(false);
        setChatHistory(prevHistory => [...prevHistory, { sender: 'bot', text: "Error: You must be logged in to chat. Please login." }]);
        return;
      }

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = { sender: 'bot', text: data.response };
      setChatHistory(prevHistory => [...prevHistory, botMessage]);

    } catch (err) {
      console.error("Chatbot API error:", err);
      const errorMessageText = err.message || "Sorry, I'm having trouble connecting. Please try again later.";
      setError(errorMessageText);
      setChatHistory(prevHistory => [...prevHistory, { sender: 'bot', text: errorMessageText }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial greeting from the bot
    setChatHistory([{ sender: 'bot', text: "Hello! I'm ConnectBot. How can I help you today?" }]);
  }, []);

  return (
    <div className="chatbot-page-container">
      <div className="chatbot-header">
        <h1>ConnectBot</h1>
        <p>Chat with ConnectBot for support. Type your message below.</p>
      </div>
      <div className="chat-history-container" ref={chatContainerRef}>
        {chatHistory.map((chat, index) => (
          <div key={index} className={`chat-message ${chat.sender}`}>
            <p><strong>{chat.sender === 'user' ? 'You' : 'ConnectBot'}:</strong> {chat.text}</p>
          </div>
        ))}
        {isLoading && <div className="chat-message bot"><p>ConnectBot is typing...</p></div>}
      </div>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          aria-label="Chat message"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default ChatbotPage;