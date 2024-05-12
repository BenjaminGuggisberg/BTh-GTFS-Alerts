import React, { useState, useEffect } from 'react';

const Performance = ({ ways }) => {
    const [routeData, setRouteData] = useState(null);
    const [error, setError] = useState(null);
    console.log(ways)
  
    const fetchRouteData = async () => {
        try {
          const response = await fetch('http://localhost:8000/get_route_data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ways: ways }) // Hier werden die Daten als Objekt mit dem Schlüssel "ways" verschickt
          });
          const data = await response.json();
          setRouteData(data);
          console.log('hallo welt');
        } catch (error) {
          setError('Fehler beim Abrufen der Routendaten.');
          console.error('Fehler beim Abrufen der Routendaten:', error);
        }
      };
      
  
    useEffect(() => {
      fetchRouteData();
    }, []); // Leeres Array als Abhängigkeit bedeutet, dass dieser Effekt nur einmal beim ersten Rendern ausgeführt wird
  
    useEffect(() => {
      if (routeData) {
        console.log(routeData);
      }
    }, [routeData]);
  
    return (
      <div className="App">
        {routeData && (
          <div>
            {/* Hier kannst du die RouteData anzeigen */}
            <pre>{JSON.stringify(routeData, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  };

  export default Performance;