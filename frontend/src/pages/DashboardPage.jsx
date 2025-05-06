import React, { useState, useEffect } from 'react';
import './DashboardPage.css'; // We will create this for styling

// Mock API call function (replace with actual API call)
const fetchWellnessData = async (token) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { date: '2024-05-01', stress_level: 7, mood: 'Anxious', sleep_quality: 'Poor' },
        { date: '2024-05-02', stress_level: 5, mood: 'Okay', sleep_quality: 'Average' },
        { date: '2024-05-03', stress_level: 3, mood: 'Good', sleep_quality: 'Good' },
        { date: '2024-05-04', stress_level: 6, mood: 'Stressed', sleep_quality: 'Average' },
        { date: '2024-05-05', stress_level: 4, mood: 'Calm', sleep_quality: 'Good' },
      ]);
    }, 1000);
  });
};

const submitWellnessEntry = async (token, entry) => {
  console.log("Submitting entry:", entry, "with token:", token);
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: "Entry saved successfully!" });
    }, 500);
  });
};

function DashboardPage() {
  const [wellnessData, setWellnessData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for new wellness entry
  const [stressLevel, setStressLevel] = useState(5);
  const [mood, setMood] = useState('Okay');
  const [sleepQuality, setSleepQuality] = useState('Average');
  const [entryMessage, setEntryMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please login to view your dashboard.');
        setIsLoading(false);
        return;
      }
      try {
        const data = await fetchWellnessData(token);
        setWellnessData(data.sort((a, b) => new Date(b.date) - new Date(a.date))); // Sort by date descending
      } catch (err) {
        setError('Failed to load wellness data. Please try again later.');
        console.error(err);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleWellnessSubmit = async (e) => {
    e.preventDefault();
    setEntryMessage('');
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setEntryMessage('Error: You must be logged in to save data.');
      return;
    }
    const newEntry = {
      date: new Date().toISOString().split('T')[0], // Today's date
      stress_level: parseInt(stressLevel),
      mood,
      sleep_quality: sleepQuality,
    };

    try {
      const response = await submitWellnessEntry(token, newEntry);
      setWellnessData([newEntry, ...wellnessData].sort((a, b) => new Date(b.date) - new Date(a.date)));
      setEntryMessage(response.message || 'Entry saved!');
      // Reset form (optional)
      // setStressLevel(5);
      // setMood('Okay');
      // setSleepQuality('Average');
      setTimeout(() => setEntryMessage(''), 3000); // Clear message after 3s
    } catch (err) {
      setEntryMessage('Failed to save entry. Please try again.');
      console.error(err);
    }
  };

  if (isLoading) return <p className="loading-message">Loading dashboard...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="dashboard-page-container">
      <header className="dashboard-header">
        <h1>Your Wellness Dashboard</h1>
        <p>Track your well-being and gain insights over time.</p>
      </header>

      <section className="wellness-entry-section">
        <h2>Log Today's Wellness</h2>
        <form onSubmit={handleWellnessSubmit} className="wellness-form">
          <div className="form-group">
            <label htmlFor="stressLevel">Stress Level (1-10): {stressLevel}</label>
            <input 
              type="range" 
              id="stressLevel" 
              min="1" 
              max="10" 
              value={stressLevel} 
              onChange={(e) => setStressLevel(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="mood">Current Mood:</label>
            <select id="mood" value={mood} onChange={(e) => setMood(e.target.value)} required>
              {['Happy', 'Good', 'Okay', 'Calm', 'Sad', 'Anxious', 'Stressed', 'Overwhelmed', 'Tired'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="sleepQuality">Sleep Quality Last Night:</label>
            <select id="sleepQuality" value={sleepQuality} onChange={(e) => setSleepQuality(e.target.value)} required>
              {['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'].map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <button type="submit" className="submit-btn">Save Entry</button>
          {entryMessage && <p className="entry-feedback">{entryMessage}</p>}
        </form>
      </section>

      <section className="wellness-history-section">
        <h2>Your Wellness History</h2>
        {wellnessData.length > 0 ? (
          <div className="wellness-log-table-container">
            <table className="wellness-log-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Stress Level</th>
                  <th>Mood</th>
                  <th>Sleep Quality</th>
                </tr>
              </thead>
              <tbody>
                {wellnessData.map((entry, index) => (
                  <tr key={index}>
                    <td>{new Date(entry.date).toLocaleDateString()}</td>
                    <td>{entry.stress_level}/10</td>
                    <td>{entry.mood}</td>
                    <td>{entry.sleep_quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No wellness data logged yet. Use the form above to add your first entry!</p>
        )}
      </section>
      
      {/* TODO: Add charts/visualizations of wellness data */}
    </div>
  );
}

export default DashboardPage;