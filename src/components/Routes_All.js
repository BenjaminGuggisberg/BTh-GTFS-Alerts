
// ORGINIÄRE VERSION - KEINE BUGS - LADEGESCHWINDIGKEIT (PERFORMANCE!)

// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import MarkerClusterGroup from 'react-leaflet-markercluster'; // Importiere die Marker-Cluster-Bibliothek
import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'react-leaflet-markercluster/dist/styles.min.css';

// Erstellen einer lokalen Datenbank als Alternative zum LocalStorage 
// LocalStorage kann nicht alle Daten (RouteData) speichern und abrufen aufgrund von zuwenig Speicherkapazität auf dem Browser (Speicherplatz 5-10MB) 

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MeineDatenbank', 1);

        request.onerror = (event) => {
            reject('Fehler beim Öffnen der Datenbank');
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('routen')) {
                db.createObjectStore('routen', { keyPath: 'routeId' });
            }
        };
    });
};

const saveRouteData = async (routeId, data) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['routen'], 'readwrite');
        const store = transaction.objectStore('routen');
        const request = store.put({ routeId: routeId, data: data });

        request.onsuccess = () => {
            resolve('Daten erfolgreich gespeichert');
        };

        request.onerror = () => {
            reject('Fehler beim Speichern der Daten');
        };
    });
};

const getRouteData = async (routeId) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['routen'], 'readonly');
        const store = transaction.objectStore('routen');
        const request = store.get(routeId);

        request.onsuccess = (event) => {
            const data = event.target.result;
            resolve(data ? data.data : null);
        };

        request.onerror = () => {
            reject('Fehler beim Abrufen der Daten');
        };
    });
};

function RouteMap({ Ways, Nodes, apiData, callOSM }) {
    // console.log("apiData:", apiData)
    // console.log("Ways:", Ways)
    console.log("Nodes:", Nodes)
    const [loadingAnimation, setLoadingAnimation] = useState(true);
    // const [clusteredRoutes, setClusteredRoutes] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
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
    };

    const closeDetail = () => {
        setSelectedEvent(null);
    };

    useEffect(() => {
        // console.log('callOSM', callOSM)
        const fetchRouteData = async (routeId) => {
            const overpassUrl = "http://overpass-api.de/api/interpreter";
            const queryTemplate = `
            [out:json];
            (
            relation["gtfs:route_id"="${routeId}"];
            );
            out geom;
            `;

            const response = await fetch(overpassUrl, { method: 'POST', body: queryTemplate });
            const routeData = await response.json();
            return routeData;
        };

        const drawRoute = (map, routeGeometries, color, routeId, name) => {
            const polylines = []; // Array zum Speichern aller Polylinien

            routeGeometries.forEach(routeGeometry => {
                const polyline = L.polyline(routeGeometry, { color, weight: 7 }).addTo(map);
                polylines.push(polyline); // Füge die Polylinie zum Array hinzu

                // Eventlistener für das Klicken
                polyline.on('click', (e) => {
                    const gtfsInfo = apiData.entity.find(item => {
                        const informedEntity = item.alert.informedEntity.find(entity => entity.routeId === routeId);
                        return informedEntity !== undefined;
                    });

                    console.log(gtfsInfo);

                    let gtfsText = "GTFS-Informationen nicht verfügbar."; // Standardtext, falls GTFS-Informationen nicht gefunden werden

                    // Überprüfe, ob GTFS-Informationen gefunden wurden
                    if (gtfsInfo && Array.isArray(gtfsInfo.alert.descriptionText.translation)) {
                        // Finde die deutsche Übersetzung und setze sie als GTFS-Text
                        const germanTranslation = gtfsInfo.alert.descriptionText.translation.find(translation => translation.language === 'de');
                        if (germanTranslation) {
                            gtfsText = germanTranslation.text;
                        }
                    }
                    let start = null;
                    let end = null;
                    if (gtfsInfo && gtfsInfo.alert.activePeriod && gtfsInfo.alert.activePeriod[0]) {
                        if (gtfsInfo.alert.activePeriod[0].start !== undefined) {
                            // console.log("Starttime exists");
                            // start = gtfsInfo.alert.activePeriod[0].start;
                            start = new Date(gtfsInfo.alert.activePeriod[0].start * 1000).toLocaleString();
                        }
                        if (gtfsInfo.alert.activePeriod[0].end !== undefined) {
                            // console.log("Endtime exists");
                            end = new Date(gtfsInfo.alert.activePeriod[0].end * 1000).toLocaleString();
                        }
                    }
                    // Zeige Popup beim Klicken an
                    // const popupContent = `<strong>OSM-Informationen</strong><br> Route ID: ${routeId}<br>Name: ${name}<br><strong>GTFS-Informationen</strong><br>${gtfsText}`;
                    // L.popup()
                    //     .setLatLng(e.latlng)
                    //     .setContent(popupContent)
                    //     .openOn(map);

                    const clickedLocation = e.latlng;
                    const zoomLevel = 12;
                    const mapWidth = map.getSize().x; // Breite der Karte
                    // Berechne die X-Verschiebung als halbe Breite der Karte
                    const xOffset = mapWidth / 2;
                    // Verschiebe die Karte um den berechneten Pixelbetrag nach links
                    map.panBy(L.point(-xOffset, 0), { animate: true });
                    // Zentriere die Karte auf die Koordinaten des Mausklicks und zoom ein
                    map.setView(clickedLocation, zoomLevel);


                    handleEventClick({ start: start, end: end, name: name, id: routeId, alert: { descriptionText: { translation: [{ text: gtfsText, language: 'de' }] } } });
                });
            });

            // Funktion zum Ändern des Stils aller Polylinien mit derselben Route-ID
            const changeRouteStyle = (routeId, weight) => {
                polylines.forEach(polyline => {
                    if (polyline.options.routeId === routeId) {
                        polyline.setStyle({ weight });
                    }
                });
            };

            // Eventlistener für das Hovern
            polylines.forEach(polyline => {
                polyline.on('mouseover', (e) => {
                    const routeId = polyline.options.routeId;
                    // Mache alle Polylinien dieser Route dicker
                    changeRouteStyle(routeId, 12); // Anpassen der Linienbreite nach Bedarf
                });

                // Eventlistener für das Verlassen des Hovern
                polyline.on('mouseout', (e) => {
                    const routeId = polyline.options.routeId;
                    // Setze alle Polylinien dieser Route auf normale Linienbreite zurück
                    changeRouteStyle(routeId, 7); // Zurücksetzen auf die normale Linienbreite
                });
            });
        };
        
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
        // Layer Control erstellen
        const baseMaps = {
            'Base-Map': openStreetMapLayer,
            // 'Satellite (Swissimage)': swissImageLayer,
            'OpenTopoMap': OpenTopoMap,
            'Orthophoto': GeoportailFrance_orthos,
            // 'Carto': carto
        };

        // Layer Control hinzufügen
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.control.layers(baseMaps, null, { collapsed: true }).addTo(map);


        const loadRoutes = async () => {
            // localStorage.clear();

            const routeDataMap = new Map(); // Eine Map, um doppelte Routenabrufe zu vermeiden
            const fetchPromises = [];
            setLoadingAnimation(true);

            // Erstellen von Fetch-Promises für alle Routen
            for (const routeId of Ways) {
                // Überprüfen, ob die Route bereits abgerufen wurde
                if (!routeDataMap.has(routeId)) {
                    if (callOSM) {
                        // API-Anfrage durchführen
                        const fetchPromise = fetchRouteData(routeId)
                            .then(data => {
                                // Daten in localStorage speichern
                                // localStorage.setItem(`routeData_${routeId}`, JSON.stringify(data));
                                saveRouteData(routeId, data);
                                return data;
                            })
                            .catch(error => {
                                console.error(`Fehler beim Abrufen von Routendaten für Route ${routeId}:`, error);
                                // Hier kannst du eine Fehlerbehandlung durchführen, wenn das Laden der Daten fehlschlägt
                                throw error;
                            });

                        fetchPromises.push(fetchPromise);

                        // Die Fetch-Promise in der Map speichern, um doppelte Abfragen zu vermeiden
                        routeDataMap.set(routeId, fetchPromise);
                    } else {
                        // Daten aus localStorage abrufen, falls callOSM false ist
                        // const cachedData = localStorage.getItem(`routeData_${routeId}`);
                        const cachedData = await getRouteData(routeId);
                        if (cachedData) {
                            // fetchPromises.push(Promise.resolve(JSON.parse(cachedData)));
                            fetchPromises.push(Promise.resolve(cachedData));
                        }
                    }

                }
            }

            try {
                // Alle Fetch-Promises parallel ausführen und auf Ergebnisse warten
                const routeResponses = await Promise.all(fetchPromises);

                // Verarbeiten der Routenantworten
                for (let i = 0; i < routeResponses.length; i++) {
                    const routeId = Ways[i];
                    const routeResponse = routeResponses[i];

                    // const routeData = routeDataMap.get(routeId); // Die Routendaten aus der Map abrufen
                    if (routeResponse && routeResponse.elements) {
                        let routeName = "Unnamed Route";
                        if (routeResponse.elements.length > 0 && routeResponse.elements[0].tags.name) {
                            routeName = routeResponse.elements[0].tags.name;
                        }

                        const routes = [];
                        routeResponse.elements.forEach(element => {
                            const wayGeometries = [];
                            if (element.type === "relation") {
                                element.members.forEach(member => {
                                    if (member.type === "way" && member.role === "") {
                                        let geometry = member.geometry;
                                        if (!Array.isArray(geometry)) {
                                            geometry = [geometry];
                                        }
                                        if (geometry) {
                                            const points = geometry.map(coord => [coord.lat, coord.lon]);
                                            wayGeometries.push(points);
                                        }
                                    }
                                });
                            }
                            if (wayGeometries.length > 0) {
                                routes.push(wayGeometries);
                            }
                        });

                        // Filtere leere Elemente aus
                        const nonEmptyRoutes = routes.filter(route => route.length > 0);

                        let cause = 'UNKNOWN_CAUSE'; // Initialize cause with a default value

                        const routeAlert = apiData.entity.find(item => {
                            const informedEntity = item.alert.informedEntity.find(entity => entity.routeId === routeId);
                            return informedEntity !== undefined;
                        });

                        if (routeAlert) {
                            cause = routeAlert.alert.cause;
                        }

                        let color = 'red';
                        switch (cause) {
                            case 'UNKNOWN_CAUSE':
                                color = 'red';
                                break;
                            case 'MAINTENANCE':
                                color = 'brown';
                                break;
                            case 'CONSTRUCTION':
                                color = 'orange';
                                break;
                            case 'WEATHER':
                                color = 'blue';
                                break;
                            case 'OTHER_CAUSE':
                                color = 'green';
                                break;
                            default:
                                color = 'red';
                                break;
                        }
                        // Überprüfen, ob die Routen nicht leer sind, bevor sie gezeichnet werden
                        if (nonEmptyRoutes.length > 0) {
                            drawRoute(map, nonEmptyRoutes.flat(), color, routeId, routeName);
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading routes:", error);
            }
            setLoadingAnimation(false);
        };


        loadRoutes();


        return () => {
            map.remove();
        };
    }, []); // useEffect Hook immer ausführen, wenn sich Ways oder Nodes ändern





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
                            <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="legend-color" style={{ color: 'red', fontWeight: 'bold', marginRight: '5px' }}>■</div>
                                <div className="legend-text">Unknown Cause</div>
                            </div>
                            <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="legend-color" style={{ color: 'brown', fontWeight: 'bold', marginRight: '5px' }}>■</div>
                                <div className="legend-text">Maintenance</div>
                            </div>
                            <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="legend-color" style={{ color: 'orange', fontWeight: 'bold', marginRight: '5px' }}>■</div>
                                <div className="legend-text">Construction</div>
                            </div>
                            <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="legend-color" style={{ color: 'blue', fontWeight: 'bold', marginRight: '5px' }}>■</div>
                                <div className="legend-text">Weather</div>
                            </div>
                            <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="legend-color" style={{ color: 'green', fontWeight: 'bold', marginRight: '5px' }}>■</div>
                                <div className="legend-text">Other Cause</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {selectedEvent && (
                <div className='detail'>
                    <h4 className='titleDetail' style={{ fontFamily: "SBB Web Roman", fontSize: '20px'  }}>Objektinformationen OSM</h4>
                    <div>
                        <p>Route ID: {selectedEvent.id}</p>
                        <p>Route Name: {selectedEvent.name}</p>
                    </div>
                    <br /><br />
                    <hr/>
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
