import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MyMapComponent({apiData, routeIds, test}) {
  const position = [46.9479, 7.4446]; // Koordinaten für Bern, Schweiz
  // console.log("Ich bin die Karte!")
  console.log("routeIds in MyMapComponent:", routeIds);

  console.log(test)
  return (
    <>
    <MapContainer center={position} zoom={13} style={{height: '50vh', width: '100%', zIndex: 1}}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        <Popup>
          Bern, Schweiz <br /> Eine wunderschöne Stadt.
        </Popup>
      </Marker>
    </MapContainer>
  </>
  );
}

export default MyMapComponent;
