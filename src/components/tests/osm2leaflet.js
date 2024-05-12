import React from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

const stopData = {
  "version": 0.6,
  "generator": "Overpass API 0.7.61.5 4133829e",
  "osm3s": {
    "timestamp_osm_base": "2024-03-14T15:30:15Z",
    "copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."
  },
  "elements": [
    {
      "type": "node",
      "id": 602,
      "lat": 68.3275999,
      "lon": 16.5924287
    },
    {
      "type": "node",
      "id": 603,
      "lat": 68.3274255,
      "lon": 16.5930697
    },
    {
      "type": "node",
      "id": 604,
      "lat": 68.3264281,
      "lon": 16.5966836
    }
  ]
};

const App = () => {
  return (
    <MapContainer center={[68.3275999, 16.5924287]} zoom={15} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {stopData.elements.map((stop) => (
        <CircleMarker key={stop.id} center={[stop.lat, stop.lon]} radius={15} color="red">
          <Popup>ID: {stop.id}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default App;

