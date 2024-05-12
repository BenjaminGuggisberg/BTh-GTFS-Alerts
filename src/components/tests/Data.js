import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiComponent = () => {
  const [data, setData] = useState(null);
  const [selectedEv, setSelectedEv] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/data');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleButtonClick = (evId) => {
    const ev = data.entity.find((item) => item.id === evId);
    setSelectedEv(ev);
  };

  return (
    <div style={{ display: 'flex' }}>
      <div>
        <h1>API Data:</h1>
        {data && data.entity && data.entity.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {data.entity.map((item) => (
              <li key={item.id} style={{ margin: '5px', display: 'block' }}>
                <button onClick={() => handleButtonClick(item.id)}>{item.id}</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading...</p>
        )}
      </div>
      <div>
        {selectedEv && (
          <div>
            <h2>Selected Event Information:</h2>
            <div>
              <h3>Header Text:</h3>
              {selectedEv.alert.headerText.translation.map((text) => (
                <p key={text.language}>{text.language}: {text.text}</p>
              ))}
            </div>
            <div>
              <h3>Description Text:</h3>
              {selectedEv.alert.descriptionText.translation.map((text) => (
                <p key={text.language}>{text.language}: {text.text}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiComponent;
