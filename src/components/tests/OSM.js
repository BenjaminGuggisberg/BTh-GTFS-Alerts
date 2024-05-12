import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
                const stopIds = [];

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
    );
};

export default App;
