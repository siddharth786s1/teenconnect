import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ResourcesPage.css'; // We will create this for styling

// Sample resources data (in a real app, this would likely come from an API)
const sampleResources = [
  {
    id: 1,
    title: "Understanding Anxiety: A Guide for Teens",
    category: "Anxiety",
    type: "Article",
    summary: "Learn about what anxiety is, common triggers, and healthy coping mechanisms.",
    link: "#", // Replace with actual link or internal route
    tags: ["anxiety", "stress", "coping"]
  },
  {
    id: 2,
    title: "Mindfulness Meditation for Beginners",
    category: "Mindfulness",
    type: "Audio Guide",
    summary: "A 10-minute guided meditation to help you relax and stay present.",
    link: "#",
    tags: ["meditation", "relaxation", "mindfulness"]
  },
  {
    id: 3,
    title: "How to Talk to Your Parents About Mental Health",
    category: "Communication",
    type: "Video",
    summary: "Tips and advice on how to open up to your parents or guardians about what you're going through.",
    link: "#",
    tags: ["communication", "family", "support"]
  },
  {
    id: 4,
    title: "The Importance of Sleep for Teenagers",
    category: "Wellness",
    type: "Article",
    summary: "Discover why sleep is crucial for your mental and physical health, and how to improve your sleep habits.",
    link: "#",
    tags: ["sleep", "health", "wellness"]
  },
  {
    id: 5,
    title: "Crisis Hotlines and Support Networks",
    category: "Crisis Support",
    type: "List",
    summary: "A list of important hotlines and organizations you can contact if you need immediate help.",
    link: "/crisis-support", // Example internal link
    tags: ["crisis", "help", "support lines"]
  }
];

function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    // In a real app, fetch resources from an API
    setResources(sampleResources);
  }, []);

  const categories = ['All', ...new Set(sampleResources.map(r => r.category))];

  const filteredResources = resources
    .filter(resource => 
      selectedCategory === 'All' || resource.category === selectedCategory
    )
    .filter(resource => 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="resources-page-container">
      <header className="resources-header">
        <h1>Mental Wellness Resources</h1>
        <p>Find helpful articles, guides, videos, and links to support your well-being.</p>
      </header>

      <div className="resources-filter-controls">
        <input 
          type="text" 
          placeholder="Search resources..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {filteredResources.length > 0 ? (
        <div className="resources-grid">
          {filteredResources.map(resource => (
            <div key={resource.id} className="resource-card">
              <h3>{resource.title}</h3>
              <p className="resource-category"><span className="badge">{resource.category}</span> <span className="badge type">{resource.type}</span></p>
              <p className="resource-summary">{resource.summary}</p>
              <div className="resource-tags">
                {resource.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
              </div>
              <a href={resource.link} target="_blank" rel="noopener noreferrer" className="resource-link">
                {resource.type === 'Audio Guide' || resource.type === 'Video' ? 'Access Media' : 'Read More'} &rarr;
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-resources-message">
          No resources found matching your criteria. Try adjusting your search or filter.
        </p>
      )}
    </div>
  );
}

export default ResourcesPage;