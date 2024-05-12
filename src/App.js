import React, { useState } from 'react';
import './App.css';
import './styles.css';
import Register1 from './components/Alerts.js';
import Register2 from './components/Settings.js';

function App() {
  const [activeTab, setActiveTab] = useState('register1');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };
  

  return (
    <div className="app-container">
      {activeTab === 'register1' && <Register1 />}
      {activeTab === 'register2' && <Register2 />}
      <div className="register-tabs">
        <button id="alerts" className={activeTab === 'register1' ? 'active' : ''} onClick={() => handleTabClick('register1')}>
          Ereignis-Übersicht
        </button>
        <button id="settings" className={activeTab === 'register2' ? 'active' : ''} onClick={() => handleTabClick('register2')}>
          Einstellungen
        </button>
      </div>
    </div>
  );
}

export default App;

