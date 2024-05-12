
// STOPID BUGS BEI NULL-EREIGNISSEN NOCH ZU KLÄREN!

// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import MarkerClusterGroup from 'react-leaflet-markercluster'; // Importiere die Marker-Cluster-Bibliothek
import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'react-leaflet-markercluster/dist/styles.min.css';

import { loadRoutes, loadStops } from './utils/functions.js'

// Erstellen einer lokalen Datenbank als Alternative zum LocalStorage 
// LocalStorage kann nicht alle Daten (RouteData) speichern und abrufen aufgrund von zuwenig Speicherkapazität auf dem Browser (Speicherplatz 5-10MB) 



function RouteMap({ Ways, Nodes, apiData, callOSM }) {
    // console.log(Nodes)
    const [loadingAnimation, setLoadingAnimation] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedEventType, setSelectedEventType] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [Trigger, setTrigger] = useState(true);

    const toggleLegendActive = () => {
        setIsVisible(true);
        setTrigger(false);
    }

    const toggleLegendPassiv = () => {
        setIsVisible(false)
        setTrigger(true);
    }

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        console.log('selectedEvent', event)

        const isNode = event.id.startsWith('ch:1:sloid');
        const eventType = isNode ? 'Haltestelle' : 'Strecke';
        setSelectedEventType(eventType);
    };


    const closeDetail = () => {
        setSelectedEvent(null);
    };

    useEffect(() => {
        // console.log('callOSM', callOSM)




        const position = [46.884, 8.1336]; // Koordinaten für Bern, Schweiz
        const map = L.map('map').setView(position, 8);

        // Hier wird die swissimage-Layer-Kachel hinzugefügt
        // const swissImageLayer = L.tileLayer('https://wms.geo.admin.ch/?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=ch.swisstopo.swissimage&FORMAT=image/jpeg&TRANSPARENT=false&CRS=EPSG:2056&BBOX=2420000,1300000,2900000,1350000&WIDTH=256&HEIGHT=256', {
        // });
        var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            // maxZoom: 17,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        });
        // var carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        //     attribution: '&copy; <a href="https://carto.com/">CARTO</a> | Tiles &copy; <a href="https://cartodb.com/attributions">CARTO</a>'
        // })
        // Standard-Kachel-Layer für OpenStreetMap
        const openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
        var GeoportailFrance_orthos = L.tileLayer('https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
            attribution: '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
            bounds: [[-75, -180], [81, 180]],
            minZoom: 2,
            // maxZoom: 19,
            apikey: 'choisirgeoportail',
            format: 'image/jpeg',
            style: 'normal'
        });
        const netzkarteLayer = L.tileLayer('https://tiles.stag.trafimage.geops.ch/wmts/netzkarte_relief_webmercator/webmercator/{z}/{x}/{y}.png', {
            tileSize: 256,
            attribution: 'Netzkarte Hintergrund ohne Strecken'
        });

        const swissImageLayer = L.tileLayer.wms('https://wms.geo.admin.ch/', {
            layers: 'ch.swisstopo.images-swissimage',
            format: 'image/png',
            transparent: true,
            attribution: '© swisstopo',
        });



        // Layer Control erstellen
        const baseMaps = {
            'Base-Map': openStreetMapLayer,
            // 'Satellite (Swissimage)': swissImageLayer,
            'Relief Hintergrund': OpenTopoMap,
            // 'Orthophoto': GeoportailFrance_orthos,
            // 'Carto': carto
            'SBB Hintergrund': netzkarteLayer,
            'SwissImage': swissImageLayer
        };

        // Erstelle eine Layer-Gruppe für die Nodes
        const nodeLayerGroup = L.layerGroup().addTo(map);

        // Erstelle eine Layer-Gruppe für die Routen
        const routeLayerGroup = L.layerGroup().addTo(map);

        // Erstelle ein Objekt mit den Layern, die im Layer-Control-Menü angezeigt werden sollen
        const overlayMaps = {
            "Haltestellen": nodeLayerGroup,
            "Strecken": routeLayerGroup
        };

        // Layer Control hinzufügen
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.control.layers(baseMaps, overlayMaps, { collapsed: true }).addTo(map);
        map.addLayer(netzkarteLayer); // SBB Hintergrund als Default Karte festlegen

        // Zuerst Routen laden, danach Stops
        loadRoutes(map, setLoadingAnimation, callOSM, Ways, apiData, handleEventClick, routeLayerGroup)
            .then(() => {
                // Load stops only after routes have been loaded
                if (Nodes && Object.keys(Nodes).length > 0 && apiData && apiData.entity) {
                    loadStops(map, Nodes, apiData, handleEventClick, nodeLayerGroup);
                }
            });

        return () => {
            map.remove();
        };
    }, [Ways, apiData, callOSM]); // useEffect Hook immer ausführen, wenn sich Ways oder Nodes ändern



    return (
        <>
            {/* Kartenzentrum ist immer auf Kartenzustand vor Detailfenster definiert, da dies zum Zeitpunkt der Initialisierung der Karte noch nicht gerendert ist */}
            {/* Das heisst, dass das Kartenzentrum für das Detailfenster verschoben werden muss - Negativmargin der Karte und Korrektur der Weite als einfachste Methode */}
            <div className={`links ${selectedEvent ? 'half-width' : ''}`} style={{ position: 'relative' }}>
                {loadingAnimation && ( // Zeige die Ladeanimation nur wenn `loading` true ist
                    <div className="loading-overlay">
                        <img src={require('../images/test.png')} alt="Loading" className="loading-icon" />
                    </div>
                )}
                <div id="map" style={{ height: '50vh', width: selectedEvent ? '150%' : '100%', zIndex: 1, marginLeft: selectedEvent ? '-50%' : 0 }} />
                {Trigger && (
                    <div className='legende' onMouseEnter={toggleLegendActive} style={{ backgroundColor: 'white', position: 'absolute', bottom: '20px', right: '10px', width: '44px', height: '44px', zIndex: '9990', borderRadius: '5px', border: '1px solid #ddd', boxShadow: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img src={require('./icons/legend.png')} alt='legende' style={{ width: '70%', padding: '8px' }} />
                    </div>
                )}
                {isVisible && (
                    <div onMouseLeave={toggleLegendPassiv} style={{ fontSize: 'small', fontFamily: "SBB Web Roman", position: 'absolute', bottom: '20px', right: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '5px', boxshadow: '0 8px 16px 0 rgba(0,0,0,0.2)', zIndex: '9998', paddingLeft: '15px', paddingBottom: '20px', border: '1px solid #ddd' }}>
                        <h4>Legende</h4>
                        <div>
                            <div className="legend-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                                <div className="legend-color" style={{ color: 'red', fontWeight: 'bold', marginRight: '5px' }}>■</div>
                                <div className="legend-text">Unbekannter Grund</div>
                            </div>
                            <div className="legend-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                                <div className="legend-color" style={{ color: 'brown', fontWeight: 'bold', marginRight: '5px' }}>■</div>
                                <div className="legend-text">Wartung</div>
                            </div>
                            <div className="legend-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                                <div className="legend-color" style={{ color: 'orange', fontWeight: 'bold', marginRight: '5px' }}>■</div>
                                <div className="legend-text">Bauarbeiten</div>
                            </div>
                            <div className="legend-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                                <div className="legend-color" style={{ color: 'blue', fontWeight: 'bold', marginRight: '5px' }}>■</div>
                                <div className="legend-text">Wetter</div>
                            </div>
                            <div className="legend-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                                <div className="legend-color" style={{ color: 'green', fontWeight: 'bold', marginRight: '5px' }}>■</div>
                                <div className="legend-text">Anderer Grund</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {selectedEvent && (
                <div className='detail'>
                    <h4 className='titleDetail' style={{ fontFamily: "SBB Web Roman", fontSize: '20px' }}>Objektinformationen {selectedEventType}</h4>
                    <h5>Metadaten {selectedEventType === 'Strecke' && <>OSM</>} | {selectedEventType === 'Haltestelle' && <>opentransportdata</>}</h5>
                    <div>
                        {selectedEventType === 'Strecke' && <><p>routeId: {selectedEvent.id}</p></>}
                        {selectedEventType === 'Haltestelle' && <><p>stopId: {selectedEvent.id}</p></>}
                        <p>{selectedEventType === 'Strecke' && <>Name: {selectedEvent.name}</>}
                        {selectedEventType === 'Haltestelle' && <>Haltestelle: {selectedEvent.name}</>}</p>
                    </div>
                    <br /><br />
                    <hr />
                    <h4 className='titleDetail' style={{ fontFamily: "SBB Web Roman", fontSize: '20px' }}>Ereignisinformationen GTFS</h4>  {/* für {selectedEvent.id} */}
                    <div>
                        <p>{selectedEvent.alert.descriptionText.translation.find(text => text.language === 'de')?.text}</p>
                        {selectedEvent.start && <p>Start: {selectedEvent.start}</p>}
                        {selectedEvent.end && <p>Ende: {selectedEvent.end}</p>}
                    </div>
                    <button className='close-button' onClick={closeDetail}>X</button>
                </div>
            )}
        </>
    );
};


export default RouteMap;
