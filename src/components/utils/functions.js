import React, { useEffect, useState } from 'react';
import L from 'leaflet';


export const openDB = () => {
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

export const saveRouteData = async (routeId, data) => {
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

export const getRouteData = async (routeId) => {
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

export const fetchRouteData = async (routeId) => {
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

export const drawRoute = (map, routeGeometries, color, routeId, name, handleEventClick, apiData, routeLayerGroup) => {
    const polylines = []; // Array zum Speichern aller Polylinien
    // console.log(apiData)

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

        // Hinzufügen zur LayerControl
        polyline.addTo(routeLayerGroup)
    });
};

export const loadRoutes = async (map, setLoadingAnimation, callOSM, Ways, apiData, handleEventClick, routeLayerGroup) => {
    // localStorage.clear();

    const routeDataMap = new Map(); // Eine Map, um doppelte Routenabrufe zu vermeiden
    const fetchPromises = [];
    setLoadingAnimation(true);

    // const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Erstellen von Fetch-Promises für alle Routen
    for (const [index, routeId] of Ways.entries()) {
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

                const routeAlert = apiData && apiData.entity ? apiData.entity.find(item => {
                    const informedEntity = item.alert.informedEntity.find(entity => entity.routeId === routeId);
                    return informedEntity !== undefined;
                }) : null;


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
                    drawRoute(map, nonEmptyRoutes.flat(), color, routeId, routeName, handleEventClick, apiData, routeLayerGroup);
                }
            }
        }
        // await delay(1000);
    } catch (error) {
        console.error("Error loading routes:", error);
    }
    setLoadingAnimation(false);
};

export const loadStops = (map, Nodes, apiData, handleEventClick, nodeLayerGroup) => {
    const markers = []; // Array zum Speichern aller Marker
    // console.log('Knotenpunkte', Nodes);

    // Überprüfen, ob Nodes definiert und nicht leer ist
    if (Nodes && Object.keys(Nodes).length > 0) {
        // Iteriere über jedes Node-Objekt
        Object.values(Nodes).forEach(node => {
            // Iteriere über jedes Element im Node-Array
            node.forEach(element => {
                let nodeName = ''; // Aktueller Node-Name speichern
                let nodeID = ''; // Aktuelle Node-ID speichern
                let nodeType = ''; // Aktueller Node-Type speichern
                // Extrahiere die ID des Elements
                const id = element[3];
                // console.log('Node ID:', id); Protokollierung der Node-ID
                // Überprüfe, ob die ID in einem Objekt in apiData gefunden werden kann
                if (apiData && apiData.entity) {
                    apiData.entity.forEach(item => {
                        // console.log('API Data Item ID:', item.alert.informedEntity[0].stopId); Protokollierung der API-Daten-ID
                        if (
                            item.alert &&
                            item.alert.informedEntity &&
                            item.alert.informedEntity.some(entity => entity.stopId === id && entity.stopId !== null)
                        ) {
                            const cause = item.alert.cause
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
                            // Berechne den Radius basierend auf dem aktuellen Zoomlevel der Karte
                            const observedZoom = map.getZoom();
                            const radius = calculateRadius(observedZoom); // Funktion zum Berechnen des Radius abhängig vom Zoomlevel
                            // Extrahiere die Koordinaten des Elements
                            const [type, lon, lat, ID, name] = element;
                            nodeType = type;
                            nodeID = ID;
                            nodeName = name;
                            // console.log('Coordinates:', lon, lat); Protokollierung der Koordinaten
                            // Überprüfe, ob Längen- und Breitengrad gültige Zahlen sind
                            if (!isNaN(lon) && !isNaN(lat)) {
                                // Überprüfe, ob die Karte vollständig initialisiert ist
                                if (map && map.setView) {
                                    // console.log('Map initialized'); Protokollierung der initialisierten Karte
                                    // Erstelle einen Leaflet Marker anhand der Koordinaten und der festgelegten Farbe
                                    if (id !== undefined && id !== null) {
                                        if (lon !== null & lat !== null) {
                                        const marker = L.circle([lat, lon], {
                                            color: 'transparent',
                                            fillColor: color,
                                            fillOpacity: 0.5,
                                            radius: radius, // Radius des Circles
                                            weight: 1,
                                        }).addTo(nodeLayerGroup);
                                        // Vordergrund (vor Routes)
                                        marker.bringToFront();
                                        // Füge den Marker zum Array hinzu
                                        markers.push(marker);
                                        // Füge einen Eventlistener für das Klicken hinzu

                                        marker.on('click', (e) => {
                                            const gtfsInfo = apiData.entity.find(item => {
                                                const informedEntity = item.alert.informedEntity.find(entity => entity.stopId === id);
                                                return informedEntity !== undefined;
                                            });
                                            console.log(gtfsInfo);
                                            // console.log('Node-ID', nodeID)
                                            // console.log('nodeName', nodeName)
                                            // console.log('nodeType', nodeType)
    
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
                                            const clickedLocation = e.latlng;
                                            const zoomLevel = 12;
                                            const mapWidth = map.getSize().x; // Breite der Karte
                                            // Berechne die X-Verschiebung als halbe Breite der Karte
                                            const xOffset = mapWidth / 2;
                                            // Verschiebe die Karte um den berechneten Pixelbetrag nach links
                                            map.panBy(L.point(-xOffset, 0), { animate: true });
                                            // Zentriere die Karte auf die Koordinaten des Mausklicks und zoom ein
                                            map.setView(clickedLocation, zoomLevel);
    
                                            handleEventClick({ start: start, end: end, name: nodeName, id: id, alert: { descriptionText: { translation: [{ text: gtfsText, language: 'de' }] } } });
    
                                    
                                    
                                    
                                        // Rufe die handleEventClick-Funktion auf und übergebe relevante Daten
                                        // handleEventClick({ type, lon, lat, id, name });
                                        // console.log("Detailfenster für Haltestellen in Karte muss noch implementiert werden")
                                    });
                                
                                    // Füge einen Eventlistener für das Hovern hinzu
                                    marker.on('mouseover', function (e) {
                                        // Vergrößere den Radius des Kreises
                                        this.setRadius(this.getRadius() * 2); // Zum Beispiel um 50% vergrößern
                                        // Ändere die Farbe des Kreises in Grün
                                        this.setStyle({ color: 'black'});
                                    });

                                    // Füge einen Eventlistener für das Wegnehmen der Maus hinzu
                                    marker.on('mouseout', function (e) {
                                        // Setze den Radius des Kreises zurück
                                        this.setRadius(this.getRadius() / 2); // Zum Beispiel zurück auf den ursprünglichen Radius
                                        this.setStyle({ color: 'transparent'})
                                    });
                                }
                            }
                                } else {
                                    console.error('Die Karte ist nicht vollständig initialisiert.');
                                }
                            } else {
                                console.error(`Ungültige Koordinaten für Node mit ID ${id}`);
                            }
                        }
                    });
                }
            });
        });
    } else {
        console.error('Nodes sind nicht definiert oder leer.');
    }
    // Event-Listener für das zoomend-Ereignis der Karte hinzufügen
    map.on('zoomend', () => {
        // Beim Zoomen den Radius aller Marker basierend auf dem aktuellen Zoomlevel aktualisieren
        markers.forEach(marker => {
            const observedZoom = map.getZoom();
            const radius = calculateRadius(observedZoom); // Funktion zum Berechnen des Radius abhängig vom Zoomlevel
            marker.setRadius(radius);
        });
    });
};



// Funktion zum Berechnen des Radius basierend auf dem Zoomlevel
function calculateRadius(zoomLevel) {
    // Beispielhafte Berechnung des Radius basierend auf dem Zoomlevel
    // Du kannst diese Funktion entsprechend deinen Anforderungen anpassen
    return Math.pow(2, 20 - zoomLevel); // Hier wird der Radius mit zunehmendem Zoomlevel halbiert (angepasst an den gewünschten Effekt)
}