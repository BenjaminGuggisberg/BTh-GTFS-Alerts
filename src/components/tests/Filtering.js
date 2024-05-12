import React, { useState } from 'react';


function DropdownButtons() {
  const [selectedOptions, setSelectedOptions] = useState({
    Unternehmung: '',
    ArtDesEreignisses: '',
    DauerDesEreignisses: '',
    Region: ''
  });

  const handleOptionClick = (option, field) => {
    setSelectedOptions(prevState => ({
      ...prevState,
      [field]: option
    }));
  };

  const handleInputChange = (e, field) => {
    const { value } = e.target;
    setSelectedOptions(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  // Mock API request function
  const makeAPIRequest = () => {
    console.log(selectedOptions);
    // Make API request using selectedOptions state
  };

  return (
    <div className="dropdown-container">
      <div className="dropdown">
        <input
          className="dropdown-input"
          type="text"
          placeholder="Unternehmung"
          value={selectedOptions.Unternehmung}
          onChange={(e) => handleInputChange(e, 'Unternehmung')}
        />
        <div className="dropdown-content">
          <p onClick={() => handleOptionClick('SBB-CFF-FSS', 'Unternehmung')}>SBB-CFF-FSS</p>
          <p onClick={() => handleOptionClick('bls', 'Unternehmung')}>bls</p>
          <p onClick={() => handleOptionClick('Bernmobil', 'Unternehmung')}>Bernmobil</p>
        </div>
      </div>
      <div className="dropdown">
        <input
          className="dropdown-input"
          type="text"
          placeholder="Art des Ereignisses"
          value={selectedOptions.ArtDesEreignisses}
          onChange={(e) => handleInputChange(e, 'ArtDesEreignisses')}
        />
        <div className="dropdown-content">
          <p onClick={() => handleOptionClick('Fahrzeugstörung', 'ArtDesEreignisses')}>Fahrzeugstörung</p>
          <p onClick={() => handleOptionClick('StörungFahrbahn', 'ArtDesEreignisses')}>Störung Fahrbahn</p>
          <p onClick={() => handleOptionClick('SonstigeStörung', 'ArtDesEreignisses')}>Sonstige Störung</p>
        </div>
      </div>
      <div className="dropdown">
        <input
          className="dropdown-input"
          type="text"
          placeholder="Dauer des Ereignisses"
          value={selectedOptions.DauerDesEreignisses}
          onChange={(e) => handleInputChange(e, 'DauerDesEreignisses')}
        />
        <div className="dropdown-content">
          <p onClick={() => handleOptionClick('<1Tag', 'DauerDesEreignisses')}>1 Tag</p>
          <p onClick={() => handleOptionClick('<1Woche', 'DauerDesEreignisses')}>1 Woche</p>
          <p onClick={() => handleOptionClick('<1Monat', 'DauerDesEreignisses')}>1 Monat</p>
        </div>
      </div>
      <div className="dropdown">
        <input
          className="dropdown-input"
          type="text"
          placeholder="Region"
          value={selectedOptions.Region}
          onChange={(e) => handleInputChange(e, 'Region')}
        />
        <div className="dropdown-content">
          <p onClick={() => handleOptionClick('AgglomerationBern', 'Region')}>Agglomeration Bern</p>
          <p onClick={() => handleOptionClick('EmmentalBE', 'Region')}>Emmental BE</p>
          <p onClick={() => handleOptionClick('SeelandBE', 'Region')}>Seeland BE</p>
        </div>
      </div>
      <button className='api' onClick={makeAPIRequest}>Make API Request</button>
    </div>
  );
}

export default DropdownButtons;
