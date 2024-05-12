import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';

const downloadOSMData = async (featureType, featureIds) => {
  try {
    const query = `[out:json];
          (
            ${featureType}
            (
              id:${featureIds.join(",")}
            );
          );
          out;`;

    const response = await axios.post('https://overpass-api.de/api/interpreter', query);
    return response.data;
  } catch (error) {
    console.error('Error fetching OSM data:', error);
    return null;
  }
};

const App = () => {
  const [wayData, setWayData] = useState(null);
  const [stopData, setStopData] = useState(null);
  const [wayNodes, setWayNodes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wayIds = [602, 603];
        const stopIds = [602, 603];

        const wayData = await downloadOSMData('way', wayIds);
        setWayData(wayData);

        // Extrahiere die Node-IDs aus den Wegdaten
        const nodeIds = wayData.elements.reduce((accumulator, way) => {
          accumulator.push(...way.nodes);
          return accumulator;
        }, []);

        // Lade die Nodes anhand ihrer IDs
        const nodeData = await downloadOSMData('node', nodeIds);
        setWayNodes(nodeData.elements);

        // Hole Haltestellendaten für die Liste der IDs
        const stopData = await downloadOSMData('node', stopIds);
        setStopData(stopData);
      } catch (error) {
        console.error('Error fetching OSM data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div>
        <div>
          <h2>Strecken-Daten</h2>
          <pre>{JSON.stringify(wayData, null, 2)}</pre>
        </div>
        <div>
          <h2>Linien-Nodes</h2>
          <pre>{JSON.stringify(wayNodes, null, 2)}</pre>
        </div>
        <div>
          <h2>Haltestellen-Daten</h2>
          <pre>{JSON.stringify(stopData, null, 2)}</pre>
        </div>
      </div>
      <div>
        <MapContainer center={[50.9275999, -0.7924287]} zoom={15} style={{ height: '100vh', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Rendering Haltestellen */}
          {stopData && stopData.elements && Array.isArray(stopData.elements) && stopData.elements.map((stop) => (
            <CircleMarker key={stop.id} center={[stop.lat, stop.lon]} radius={15} color="red">
              <Popup>ID: {stop.id}</Popup>
            </CircleMarker>
          ))}

          {/* Rendering Nodes */}
          {wayNodes.map((node) => (
            <CircleMarker key={node.id} center={[node.lat, node.lon]} radius={10} color="blue">
              <Popup>ID: {node.id}</Popup>
            </CircleMarker>
          ))}

          {/* Rendering Verbindungslinien für jeden Weg */}
          {wayData && wayData.elements && Array.isArray(wayData.elements) && wayNodes.length > 0 && wayData.elements.map(way => (
            <Polyline
              key={way.id}
              positions={way.nodes.map(nodeId => {
                const node = wayNodes.find(node => node.id === nodeId);
                return [node.lat, node.lon];
              })}
              color="red"
              weight={5}
            >
              <Popup>
                <div>
                  <h3>Way ID: {way.id}</h3>
                  <p>Bicycle: {way.tags.bicycle}</p>
                  <p>Designation: {way.tags.designation}</p>
                  <p>Foot: {way.tags.foot}</p>
                  <p>Highway: {way.tags.highway}</p>
                  <p>Horse: {way.tags.horse}</p>
                  <p>Surface: {way.tags.surface}</p>
                </div>
              </Popup>
            </Polyline>
          ))}

        </MapContainer>

      </div>
    </>
  );
};

export default App;
