import React, { useState, useEffect } from "react";
// import DropdownButtons from './Filtering.js';
// import MyMapComponent from "./AlertsMap.js";
import axios from 'axios';
import RouteMap from "./Routes.js";
// import RouteMap from "./RoutesAll.js"; // ORGINIÄRE VERSION - KEINE BUGS - LADEGESCHWINDIGKEIT (PERFORMANCE!) - STOPID BUGS BEI NULL-EREIGNISSEN NOCH ZU KLÄREN!
import Papa from 'papaparse';
import csvData from './kantonsgrenzen.csv';
// import Performance from "./performance.js";

function Register1() {
  const [selectedEvent, setSelectedEvent] = useState(null); // Zustand für ausgewähltes Ereignis
  const [ShowMap, setShowMap] = useState(true);
  const [apiData, setApiData] = useState(null); // Zustand für die API-Daten
  const [nodeMeta, setNodeMeta] = useState(null); // Zustand Metadaten Nodes von Swisstopo
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [apiStatus, setApiStatus] = useState("idle"); // Zustand für den API-Status
  const [errorStatus, setErrorStatus] = useState(null);
  const [callOSM, setCallOSM] = useState(false);
  // const [uniqueWays, setUniqueWays] = useState([]);
  const [showDateTime, setShowDateTime] = useState(true); // Ereignis Header timestamp auf Eventbutton anzeigen

  // Listen für route_ids und stop_ids erstellen
  const [routeIds, setRouteIds] = useState([]);
  const [stopIds, setStopIds] = useState([]);
  // const [initializedMap, setInitializedMap] = useState(false); // Versuch, die Karte zu initialisieren, damit die Routen geladen bleiben
  // const [initialLoad, setInitialLoad] = useState(null); // Versuch, initiale Daten bei API Abfrage zwischenzuspeichern, um Filter zurückzusetzen

  const [selectedOptions, setSelectedOptions] = useState({
    Unternehmung: { id: '', name: '' },
    // ArtDesEreignisses: { id: '', name: '' },
    // DauerDesEreignisses: { id: '', name: '' },
    // Region: { id: '', name: '' }
  });

  const [selectedCompany, setSelectedCompany] = useState({ id: '', name: '' });

  const [textFilter, setTextFilter] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  const toggleFilterPopup = () => {
    setShowFilterPopup(!showFilterPopup);
  };


  const [filters, setFilters] = useState([]);

  // Funktion zum Hinzufügen oder Entfernen eines Filters
  const toggleFilter = (filter) => {
    if (filters.includes(filter)) {
      // Filter entfernen, falls bereits enthalten
      setFilters(filters.filter((f) => f !== filter));
    } else {
      // Filter hinzufügen, falls nicht enthalten
      setFilters([...filters, filter]);
    }
  };

  const [sortStart, setSortStart] = useState(null);
  const [sortEnd, setSortEnd] = useState(null);

  const handleSortStart = () => {
    if (sortStart === 'Start') {
      // Deaktiviere den Filter
      setSortStart(null);
    } else {
      // Aktiviere den Construction-Filter
      setSortStart('Start');
      setSortEnd(null);
    };
  }
  const handleSortStart2 = () => {
    if (sortStart === 'Start2') {
      // Deaktiviere den Filter
      setSortStart(null);
    } else {
      // Aktiviere den Construction-Filter
      setSortStart('Start2');
      setSortEnd(null);
    };
  }
  const handleSortEnd = () => {
    if (sortEnd === 'Ende') {
      // Deaktiviere den Filter
      setSortEnd(null);
    } else {
      // Aktiviere den Construction-Filter
      setSortEnd('Ende');
      setSortStart(null);
    };
  }
  const handleSortEnd2 = () => {
    if (sortEnd === 'Ende2') {
      // Deaktiviere den Filter
      setSortEnd(null);
    } else {
      // Aktiviere den Construction-Filter
      setSortEnd('Ende2');
      setSortStart(null);
    };
  }


  const sortEvents = (events) => {
    if (sortStart === 'Start') {
      return events.sort((a, b) => a.alert.activePeriod[0].start - b.alert.activePeriod[0].start);
    } else if (sortStart === 'Start2') {
      return events.sort((a, b) => b.alert.activePeriod[0].start - a.alert.activePeriod[0].start);
    } else if (sortEnd === 'Ende') {
      return events.sort((a, b) => a.alert.activePeriod[0].end - b.alert.activePeriod[0].end);
    } else if (sortEnd === 'Ende2') {
      return events.sort((a, b) => b.alert.activePeriod[0].end - a.alert.activePeriod[0].end);
    } else {
      return events;
    }
  };

  // Conditional Rendering für Map Komponente
  // const [Visualize, setVisualize] = useState('');

  // const toggleActuality = () => {
  //   setVisualize('Actuality');
  // };

  // const toggleAgency = () => {
  //   setVisualize('Agency');
  // };

  // const toggleCause = () => {
  //   setVisualize('Cause');
  // };



  const sortedEvents = sortEvents(apiData && apiData.entity ? apiData.entity : []);

  // Mittels Optionsname (angezeigt) kann Agency gewählt werden, die zugehörige Agency ID wird der Filterung als Parameter übergeben
  const handleOptionClick = (optionId, optionName, field) => {  // Filter auf eine Option setzen - FilterID als Parameter
    setSelectedOptions(prevState => ({
      ...prevState,
      [field]: { id: optionId, name: optionName }
    }));
    setSelectedCompany({ id: optionId, name: optionName }); // Ausgewählte Unternehmung als Filter speichern
  };

  // Agency ID Filter löschen / zurücksetzen 
  const handleClearOption = (field) => { // FilterID als Parameter löschen - Alle anzeigen
    setSelectedOptions(prevState => ({
      ...prevState,
      [field]: { id: '', name: '' }
    }));
  };

  // Suchtext Implementierung, Aufnahme der Textinformation
  const handleTextFilterChange = (event) => {
    setTextFilter(event.target.value);
  }

  // Auswahl eines Ereignisses über event zur Darstellung von Detailinformationen
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowDateTime(false);
  };

  // Im Listenverzeichnis kann der Detailtab, worin die genauen GTFS Informationen dargestellt werden geschlossen werden
  const closeDetail = () => {
    setSelectedEvent(null); // Setze ausgewähltes Ereignis auf null, um das Detail zu schließen
    setShowDateTime(true);
  };


  // zu definierende Statements zur Implementierung des Kantonfilters
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCantonData, setSelectedCantonData] = useState(null);
  const [suggestedKantons, setSuggestedKantons] = useState([]);
  // const dropdownRef = useRef(null);

  // useEffect Hook zur direkten Synchronisierung des CSV im Projektverzeichnis
  useEffect(() => {
    Papa.parse(csvData, {
      download: true,
      complete: (result) => {
        setData(result.data);
      },
      header: true, // Falls die CSV-Datei Header hat
    });
  }, []);

  // Funktion zum Erstellen eines Searchterms nach 2 Eingaben aus dem CSV KTNAME
  const handleSearchTermChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setSelectedCantonData(null);
    const suggestions = data
      .filter((row) => row.KTNAME && row.KTNAME.toLowerCase().includes(term.toLowerCase()) && term.length >= 2)
      .map((row) => row.KTNAME);
    setSuggestedKantons(suggestions);
  };

  // Auswahl eines Kantos über den Schlüssel KTNAME (Kantonsname) zur Filterung der Daten nach Kantonsgrenzen setzen
  const handleCantonSelect = (canton) => {
    setSearchTerm(canton);
    setSelectedCantonData(data.find((row) => row.KTNAME === canton));
    setSuggestedKantons([]);
    // console.log(selectedCantonData)
  };


  // Anzeigen der Kantonsinformationen aus der Kantonsgrenzen shp-Datei (konvertiert zu CSV)
  useEffect(() => {
    if (selectedCantonData) {
      console.log("Daten zum selektierten Kanton", selectedCantonData.KTNAME, ":", selectedCantonData);
    }
  }, [selectedCantonData]);

  // Funktion um die Eingabe zur Kantonsauswahl (Searchterm zu Filterung der Suggestions) zu resetten
  const resetSearch = () => {
    setSearchTerm('')
    setSuggestedKantons([]);
  }


  // Implementierung Liste - Karte Darstellung
  const [activeFilter, setActiveFilter] = useState(0); // State für den aktiven Filter
  const [sliderTranslate, setSliderTranslate] = useState(0); // State für die Position des Sliders

  const handleFilterClick = (index) => {
    setActiveFilter(index);
    setSliderTranslate(index * 100);
    setShowMap(!ShowMap);
    if (!ShowMap) {
      setCallOSM(false);
    }
    // setInitializedMap(true);
    // console.log("Show Map:", ShowMap);
  };

  // console.log('callOSM', callOSM)


  // Zurücksetzen aller States für einen neue Anfrage
  const resetState = () => {
    setSelectedEvent(null);
    setApiData(null);
    setCurrentTimestamp(null);
    setApiStatus("idle");
    setErrorStatus(null);
    // setInitializedMap(false);
    setSelectedOptions({
      Unternehmung: { id: '', name: '' },
      // weitere Zustände zurücksetzen, falls erforderlich
    });
    setTextFilter('');
  };

  useEffect(() => {
    setRouteIds([]);
    setStopIds([]);
  }, []);

  useEffect(() => {
    if (stopIds.length > 0) {
      sendStopIdsToBackend(stopIds);
    }
  }, [stopIds]);

  // API auf GTFS Daten Implementierung
  const handleApiRequest = async () => {
    resetState();
    // window.location.reload(false);

    console.log('handleApiRequest ausgeführt [...]')

    try {
      const response = await axios.get('http://localhost:8000/api/data');
      console.log(response)

      // Fehlermeldung, passiert häufig bei mehreren Nachfragen nacheinander - siehe auch auf localhost:8000/docs
      if (!response.data || !response.data.entity || !Array.isArray(response.data.entity)) {
        throw new Error("Invalid response data format");
      }

      let filteredData = response.data.entity;

      // Update filteredData mit den Antwortdaten und wende Filter an
      filteredData = filteredData.filter(item => {
        if (selectedOptions.Unternehmung.id) {
          return item.alert.informedEntity.some(entity => entity.agencyId === selectedOptions.Unternehmung.id);
        }
        return true; // Gib true zurück, wenn kein Filter angewendet wird
      });

      filteredData = filteredData.filter(item => {
        const headerText = item.alert.headerText.translation.find(text => text.language === 'de')?.text || '';
        const descriptionText = item.alert.descriptionText.translation.find(text => text.language === 'de')?.text || '';

        // Überprüfen, ob ein Wert im textFilter vorhanden ist
        const searchText = textFilter.toLowerCase();
        if (searchText !== "") {
          return headerText.toLowerCase().includes(searchText) || descriptionText.toLowerCase().includes(searchText);
        } else {
          return true;
        }
      });


      // Iteriere durch die gefilterten Daten und extrahiere IDs
      filteredData.forEach(item => {
        if (item.alert && item.alert.informedEntity) {
          item.alert.informedEntity.forEach(entity => {
            if (entity.routeId && !routeIds.includes(entity.routeId)) {
              setRouteIds(prevIds => [...prevIds, entity.routeId]); // Füge neue routeId hinzu
              // setRouteIds(routeIds => {
              //   const updatedIds = [...routeIds]; // Kopiere das aktuelle routeIds-Array
              //   updatedIds.push(entity.routeId); // Füge die neue routeId hinzu
              //   return updatedIds; // Gib das aktualisierte Array zurück
              // });
            }
            if (entity.stopId && !stopIds.includes(entity.stopId)) {
              setStopIds(prevIds => [...prevIds, entity.stopId]); // Füge neue stopId hinzu
            }
          });
        }
      });

      // setInitialLoad(filteredData)
      setApiData({ entity: filteredData });
      setCurrentTimestamp(response.data.header.timestamp)
      setCallOSM(true)
      setApiStatus("loaded");
      sendStopIdsToBackend(stopIds)


    } catch (error) {
      console.error('Error fetching data:', error);
      setApiStatus("error");
      setErrorStatus(error.message);
      console.log(errorStatus)
    }
  };


  const sendStopIdsToBackend = async (stopIds) => {
    console.log(stopIds);
    try {
      const response = await axios.post('http://localhost:8000/api/service_point_info', stopIds);
      console.log("Nodes Metadata:", response.data);
      setNodeMeta(response.data); // Setze nodeMeta mit den Daten aus der Antwort
    } catch (error) {
      console.error('Error fetching node metadata:', error);
    }
  }


  const handleEnterPress = (event) => {
    if (event.key === 'Enter') {
      handleApiRequest();
    }
  };

  const uniqueWays = [...new Set(routeIds)];


  const getNodeMetadata = async () => {
    try {
      const nodeMeta = await axios.post('http://localhost:8000/api/service_point_info', stopIds);
      console.log("Nodes Metadata:", nodeMeta.data);
    } catch (error) {
      console.error('Error fetching node metadata:', error);
    }
  }


  return (
    <div className="container-wrapper">
      <div className="container">
        <div className="title-box">
          <h1 style={{ fontFamily: "SBB Web Roman", color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>GTFS</span> <span style={{ fontSize: '0.8em' }}>Service-Alerts</span>
          </h1>
        </div>
        <div className="main-box">
          <div className='title'>
            <p style={{ fontFamily: "SBB Web Roman", letterSpacing: "inherit", fontSize: '25px' }}>Ereignisse filtern</p>
            <div className='horizontal-align'>
              {/* <DropdownButtons></DropdownButtons> */}
              <div className="dropdown-container">
                <div className="dropdown">
                  <div style={{ backgroundColor: 'white' }} className="dropdown-input" onClick={() => handleOptionClick('', '', 'Unternehmung')}>
                    {selectedCompany.name || 'Unternehmung auswählen'}
                    {selectedCompany.id && (
                      <button className="clear-button" onClick={() => handleClearOption('Unternehmung')}>X</button>
                    )}
                  </div>
                  <div className="dropdown-content">
                    <p onClick={() => handleOptionClick('11', 'SBB-CFF-FSS', 'Unternehmung')}>SBB-CFF-FSS</p>
                    <p onClick={() => handleOptionClick('801', 'PostAuto Schweiz', 'Unternehmung')}>PostAuto Schweiz</p>
                    <p onClick={() => handleOptionClick('840', 'Busbetrieb Aarau', 'Unternehmung')}>Busbetrieb Aarau</p>
                    <p onClick={() => handleOptionClick('31', 'BDWM Transport (bd)', 'Unternehmung')}>BDWM Transport (bd)</p>
                    <p onClick={() => handleOptionClick('899', 'BDWM Transport (wm Auto)', 'Unternehmung')}>BDWM Transport (wm Auto)</p>
                    <p onClick={() => handleOptionClick('886', 'Regionale Verkehrsbetriebe Baden-Wettingen', 'Unternehmung')}>Regionale Verkehrsbetriebe Baden-Wettingen</p>
                    <p onClick={() => handleOptionClick('839', 'Zugerland Verkehrsbetriebe', 'Unternehmung')}>Zugerland Verkehrsbetriebe</p>
                  </div>
                </div>
                
                {/* <div className="input-container" ref={dropdownRef}>
                  <input
                    className="kanton-input"
                    type="text"
                    placeholder="Kanton filtern"
                    value={searchTerm}
                    onChange={handleSearchTermChange}
                    // onKeyDown={handleEnterPress}
                  />
                  {suggestedKantons.length > 0 && (
                    <div className="suggestions-container">
                      {suggestedKantons.map((canton, index) => (
                        <div
                          key={index}
                          className="suggestion"
                          onClick={() => handleCantonSelect(canton)}
                        >
                          {canton}
                        </div>
                      ))}
                    </div>
                  )}
                  {searchTerm && (
                    <button
                      className="clear-button2"
                      onClick={() => resetSearch()}
                    >
                      X
                    </button>
                  )}
                </div> */}
                <div className="textfilter-wrapper">
                  <input
                    type="text"
                    value={textFilter}
                    className="textfilter-input"
                    onChange={handleTextFilterChange}
                    onKeyDown={handleEnterPress}
                    placeholder="Suchtext eingeben"
                    style={{ paddingRight: '30px' }} // Platz für den Button reservieren
                  />
                  {textFilter && (
                    <button
                      className="clear-button2"
                      onClick={() => setTextFilter('')}
                    >
                      X
                    </button>
                  )}
                </div>
                <button className="api" onClick={handleApiRequest}>Ereignisse laden</button> {/* Button zum Ausführen des API-Aufrufs */}

              </div>


            </div>
            <div style={{ text: 'center', marginBottom: '5%', marginLeft: '33.33%' }}>
              <nav className="amazing-tabs">
                <div className="filters-wrapper">
                  <ul className="filter-tabs">
                    <li>
                      <button
                        className={`filter-button ${activeFilter === 0 ? 'filter-active' : ''}`}
                        onClick={() => handleFilterClick(0)}
                      >
                        {activeFilter === 1 ? (<>auf Liste anzeigen...</>) : (<>Liste</>)}
                      </button>
                    </li>
                    <li>
                      <button
                        className={`filter-button ${activeFilter === 1 ? 'filter-active' : ''}`}
                        onClick={() => handleFilterClick(1)}
                      >
                        {activeFilter === 1 ? (<>Karte</>) : (<>auf Karte anzeigen...</>)}
                      </button>
                    </li>
                  </ul>
                  <div
                    className="filter-slider"
                    style={{ '--translate-filters-slider': `${sliderTranslate}%` }} // Setze den Wert der CSS-Variable
                    aria-hidden="true"
                  >
                    <div className="filter-slider-rect">&nbsp;</div>
                  </div>
                </div>
              </nav>
            </div>
          </div>



          <div style={{ backgroundColor: '#f0f0f0', marginLeft: '5px', marginRight: '5px', paddingLeft: '15px', paddingBottom: '15px', fontFamily: "SBB Web Roman", fontWeight: 'bold' }}>

            {apiData && ShowMap && (
              <>
                <button onClick={toggleFilterPopup} className="sortieren">
                  <img src={require('./icons/filter_black.png')} alt='filter' style={{ width: '30px', marginRight: '10px' }} />
                  Sortieren
                </button>

                {/* Zeige das Overlay und das Popup-Fenster, wenn showFilterPopup true ist */}
                {showFilterPopup && (
                  <div className='overlay'>
                    <div className='filterpopup' style={{ backgroundColor: '#ddd', width: '400px', minHeight: '40%', position: 'relative', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)', borderRadius: '10px', padding: '20px', paddingBottom: '50px' }}>  {/* Alternativ Responsive Width 30% setzen */}
                      {/* <button className="close-button" onClick={toggleFilterPopup} style={{ position: 'absolute', top: '10px', right: '10px' }}>X</button> */}
                      {/* Filteroptionen anzeigen */}
                      <div className='filter-container'>
                        <h2 className="filter-title">Sortiermechanismus wählen</h2>
                        <hr style={{ marginBottom: '20px', marginTop: '20px' }} />
                        <h3 className="filter-title">Sortieren nach Quelle</h3>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                          <button className={`sortbutton ${filters.includes('CONSTRUCTION') ? 'active-sortbutton' : ''}`} onClick={() => toggleFilter('CONSTRUCTION')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src={require('./icons/construction.jpg')} alt="construction" style={{ width: '20px', marginRight: '5px' }} />
                            <span>
                              Bauarbeiten
                            </span>
                          </button>
                          <button className={`sortbutton ${filters.includes('MAINTENANCE') ? 'active-sortbutton' : ''}`} onClick={() => toggleFilter('MAINTENANCE')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src={require('./icons/maintenance.jpg')} alt="maintenance" style={{ width: '20px', marginRight: '5px' }} />
                            <span>
                              Wartungsarbeiten
                            </span>
                          </button>
                          <button className={`sortbutton ${filters.includes('WEATHER') ? 'active-sortbutton' : ''}`} onClick={() => toggleFilter('WEATHER')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src={require('./icons/weather.jpg')} alt="weather" style={{ width: '20px', marginRight: '5px' }} />
                            <span>
                              Wetter
                            </span>
                          </button>
                          <button className={`sortbutton ${filters.includes('UNKNOWN_CAUSE') ? 'active-sortbutton' : ''}`} onClick={() => toggleFilter('UNKNOWN_CAUSE')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src={require('./icons/unknown.png')} alt="unknown" style={{ width: '20px', marginRight: '5px' }} />
                            <span>
                              Unbekannter Grund
                            </span>
                          </button>
                          <button className={`sortbutton ${filters.includes('OTHER_CAUSE') ? 'active-sortbutton' : ''}`} onClick={() => toggleFilter('OTHER_CAUSE')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src={require('./icons/other.webp')} alt="other" style={{ width: '18px', marginRight: '5px' }} />
                            <span>
                              Anderer Grund
                            </span>
                          </button>
                          {/* Weitere Filteroptionen hier hinzufügen */}
                        </div>
                        <hr style={{ marginBottom: '20px', marginTop: '20px' }} />
                        <h3 className="filter-title">Sortieren nach Aktualität</h3>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                          <button className={`sortbutton ${sortStart === 'Start' ? 'active-sortbutton' : ''}`} onClick={handleSortStart}>
                            <img src={require('./icons/time.webp')} alt="unknown" style={{ width: '20px', marginRight: '5px' }} />
                            <span>
                              Frühestes Startdatum zuerst
                            </span>
                          </button>
                          <button className={`sortbutton ${sortStart === 'Start2' ? 'active-sortbutton' : ''}`} onClick={handleSortStart2}>
                            <img src={require('./icons/time.webp')} alt="unknown" style={{ width: '20px', marginRight: '5px' }} />
                            <span>
                              Spätestes Startdatum zuerst
                            </span>
                          </button>
                          <button className={`sortbutton ${sortEnd === 'Ende' ? 'active-sortbutton' : ''}`} onClick={handleSortEnd}>
                            <img src={require('./icons/time.webp')} alt="unknown" style={{ width: '20px', marginRight: '5px' }} />
                            <span>
                              Frühestes Enddatum zuerst
                            </span>
                          </button>
                          <button className={`sortbutton ${sortEnd === 'Ende2' ? 'active-sortbutton' : ''}`} onClick={handleSortEnd2}>
                            <img src={require('./icons/time.webp')} alt="unknown" style={{ width: '20px', marginRight: '5px' }} />
                            <span>
                              Spätestes Enddatum zuerst
                            </span>
                          </button>
                        </div>
                        {/* <hr style={{ marginBottom: '20px', marginTop: '20px' }} />
                      <h3>Sortieren nach Art</h3>
                      <div>

                      </div> */}
                        <hr style={{ marginBottom: '20px', marginTop: '20px' }} />
                      </div>
                      <button className='Okay' onClick={toggleFilterPopup} style={{ position: 'absolute', right: '10px', bottom: '10px' }}>Ok</button>
                    </div>
                  </div>
                )}
              </>
            )}


            {/* Hier apiData && !showMap && Filterung für Farbdarstellung sortieren */}

          </div>


          {ShowMap ? (
            <>

              <div className='main'>
                <div className='flex-container'>
                  {apiData ? (<>
                    <div className={`links ${selectedEvent ? 'half-width' : ''}`}>
                      <ul className="event-list">
                        {/* Anwenden des Filters auf die Daten, wenn der Filter aktiv ist */}
                        {filters.length > 0 ? (
                          sortedEvents
                            .filter(item => filters.includes(item.alert.cause))
                            .map((item) => (
                              // <div style={{position: 'relative'}}>
                              <button
                                key={item.id}
                                onClick={() => handleEventClick(item)}
                                className={`event-button ${selectedEvent && selectedEvent.id === item.id ? 'selected-event-button' : ''}`}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', position: 'relative' }}
                              >
                                {/* Icons für verschiedene Ursachen */}
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  {item.alert.cause === 'CONSTRUCTION' && (
                                    <img src={require('./icons/construction.jpg')} alt="construction" style={{ width: '32px' }} />
                                  )}
                                  {item.alert.cause === 'MAINTENANCE' && (
                                    <img src={require('./icons/maintenance.jpg')} alt="maintenance" style={{ width: '32px' }} />
                                  )}
                                  {item.alert.cause === 'WEATHER' && (
                                    <img src={require('./icons/weather.jpg')} alt="weather" style={{ width: '32px' }} />
                                  )}
                                  {item.alert.cause === 'UNKNOWN_CAUSE' && (
                                    <img src={require('./icons/unknown.png')} alt="unknown_cause" style={{ width: '32px' }} />
                                  )}
                                  {item.alert.cause === 'OTHER_CAUSE' && (
                                    <img src={require('./icons/other.webp')} alt="other_cause" style={{ width: '32px' }} />
                                  )}
                                  <span style={{ marginLeft: '10px', textAlign: 'left', marginTop: '15px' }}>
                                    {item.alert.headerText.translation.find(text => text.language === 'de')?.text || item.id}
                                  </span>
                                </div>
                                {showDateTime && (
                                  <span style={{ position: 'absolute', top: '20px', right: '40px', fontSize: '14px', color: 'black' }}>
                                    Zuletzt aktualisiert am: {new Date(Number(currentTimestamp * 1000)).toLocaleDateString('de-DE')} um {new Date(Number(currentTimestamp * 1000)).toLocaleTimeString('de-DE')}
                                  </span>
                                )}
                              </button>
                              // </div>
                            ))
                        ) : (
                          // Zeige alle Ereignisse an, wenn der Filter deaktiviert ist
                          sortedEvents.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleEventClick(item)}
                              className={`event-button ${selectedEvent && selectedEvent.id === item.id ? 'selected-event-button' : ''}`}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', position: 'relative' }}
                            >
                              {/* Icons für verschiedene Ursachen */}
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {item.alert.cause === 'CONSTRUCTION' && (
                                  <img src={require('./icons/construction.jpg')} alt="construction" style={{ width: '32px' }} />
                                )}
                                {item.alert.cause === 'MAINTENANCE' && (
                                  <img src={require('./icons/maintenance.jpg')} alt="maintenance" style={{ width: '32px' }} />
                                )}
                                {item.alert.cause === 'WEATHER' && (
                                  <img src={require('./icons/weather.jpg')} alt="weather" style={{ width: '32px' }} />
                                )}
                                {item.alert.cause === 'UNKNOWN_CAUSE' && (
                                  <img src={require('./icons/unknown.png')} alt="unknown_cause" style={{ width: '32px' }} />
                                )}
                                {item.alert.cause === 'OTHER_CAUSE' && (
                                  <img src={require('./icons/other.webp')} alt="other_cause" style={{ width: '32px' }} />
                                )}
                                <span style={{ marginLeft: '10px', textAlign: 'left', marginTop: '15px' }}>
                                  {item.alert.headerText.translation.find(text => text.language === 'de')?.text || item.id}
                                </span>
                              </div>
                              {showDateTime && (
                                <span style={{ position: 'absolute', top: '20px', right: '40px', fontSize: '14px', color: 'black' }}>
                                  Zuletzt aktualisiert am: {new Date(Number(currentTimestamp * 1000)).toLocaleDateString('de-DE')} um {new Date(Number(currentTimestamp * 1000)).toLocaleTimeString('de-DE')}
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </ul>
                    </div>
                  </>) : (<>
                    {apiStatus === 'error' ? (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                      <div>
                        <p style={{ marginBottom: '20%', fontSize: '30px' }}>Daten konnten nicht geladen werden!</p>
                        Fehlermeldung(en):
                        <p style={{ color: 'coral', fontWeight: 'bold' }}>{errorStatus}</p>
                        <div className="image-container">
                        <img className='swing' src={require('./icons/sadtrain.png')} alt='test' style={{ width: '200px', position: 'absolute', bottom: '5%', right: '2%' }} />
                        <div className="emma">
                          <span>Hi, I'm Emma!<br/>Unfortunately we have no data 🙁</span>
                        </div>
                      </div>
                      </div>
                    </div>) : (<>
                      <div style={{ width: '100%', height: '100%', backgroundColor: 'inherit', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img src={require('../images/test.png')} alt="Tschutschubahn" style={{ width: '40%', height: 'auto' }} />
                      </div>
                    </>)}
                  </>)}
                  {selectedEvent && (
                    <div className='detail'>
                      <h4 className='titleDetail' style={{ padding: '10px', fontFamily: "SBB Web Roman", fontSize: '20px' }}>Ereignisinformationen GTFS</h4> {/* für {selectedEvent.id} */}
                      <br />
                      <div>
                        <p>{selectedEvent.alert.descriptionText.translation.find(text => text.language === 'de')?.text}</p>
                        <hr style={{ background: 'rgb(240, 240, 240)', height: '1px', border: 'none' }} />
                        <h4>Grund Kürzel</h4><p>{selectedEvent.alert.cause}</p>
                        {selectedEvent.alert.informedEntity[0].stopId && (
                          <>
                            <hr style={{ background: 'rgb(240, 240, 240)', height: '1px', border: 'none' }} />
                            <h4>
                              Betroffene Haltestellen nach GTFS stopId
                            </h4>
                            <table style={{ borderCollapse: 'collapse', marginBottom: '15px', width: '100%' }}>
                              <thead>
                                <tr>
                                  <th style={{ border: '1px solid rgb(240, 240, 240)', padding: '8px', textAlign: 'left' }}>Sloid</th>
                                  <th style={{ border: '1px solid rgb(240, 240, 240)', padding: '8px', textAlign: 'left' }}>Name</th>
                                  <th style={{ border: '1px solid rgb(240, 240, 240)', padding: '8px', textAlign: 'left' }}>Art</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...new Set(selectedEvent.alert.informedEntity.map(entity => entity.stopId))].map((stopId, index) => {
                                  if (nodeMeta[stopId]) { // Überprüfe, ob nodeMeta[stopId] definiert ist
                                    return (
                                      <tr key={index}>
                                        <td style={{ border: '1px solid rgb(240, 240, 240)', padding: '8px', textAlign: 'left', width: '30%' }}>{nodeMeta[stopId][0][3]}</td> {/* Name des 4. Eintrags */}
                                        <td style={{ border: '1px solid rgb(240, 240, 240)', padding: '8px', textAlign: 'left', width: '30%' }}>{nodeMeta[stopId][0][4]}</td> {/* Name des 5. Eintrags */}
                                        <td style={{ border: '1px solid rgb(240, 240, 240)', padding: '8px', textAlign: 'left', width: '30%' }}>{nodeMeta[stopId][0][0]}</td> {/* Name des 1. Eintrags */}
                                      </tr>
                                    );
                                  }
                                  return null;
                                })}
                              </tbody>
                            </table>

                          </>
                        )}
                        {/* HIER KANN DER CAUSE DARGESTELLT WERDEN */}
                      </div>

                      <button className='close-button' onClick={closeDetail}>X</button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="main2">
                {apiStatus === "loaded" && apiData ? (
                  <div className="flex-container">
                    {/* <Performance ways={uniqueWays} /> */}
                    <RouteMap callOSM={callOSM} apiData={apiData} Ways={uniqueWays} Nodes={nodeMeta} style={{ width: '100%', height: '100%' }} />
                    {/* {initializedMap && <RouteMap apiData={apiData} Ways={routeIds} Nodes={stopIds} style={{ width: '100%', height: '100%' }} />} */}
                  </div>
                ) : (<>
                  {apiStatus === 'error' ? (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ marginBottom: '20%', fontSize: '30px' }}>Daten konnten nicht geladen werden!</p>
                      Fehlermeldung(en):
                      <p style={{ color: 'coral', fontWeight: 'bold' }}>{errorStatus}</p>
                      <div className="image-container">
                        <img className='swing' src={require('./icons/sadtrain.png')} alt='test' style={{ width: '200px', position: 'absolute', bottom: '5%', right: '2%' }} />
                        <div className="emma">
                          <span>Hi, I'm Emma!<br/>Unfortunately we have no data 🙁</span>
                        </div>
                      </div>
                    </div>
                  </div>) : (<>
                    <div className='flex-container' style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}>
                      <div style={{ width: '100%', height: '100%', backgroundColor: 'inherit', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img src={require('../images/test.png')} alt="Tschutschubahn" style={{ width: '40%', height: 'auto' }} />
                      </div>
                    </div>
                  </>)}
                </>
                )}
              </div>
            </>
          )}
        </div>
        <p style={{ position: 'absolute', bottom: -5, right: '2.5%', fontFamily: "SBB Web Roman", letterSpacing: "inherit", fontSize: 'small', color: 'silver' }}>@Benjamin Guggisberg (Bachelor-Thesis) ©</p>
      </div>
    </div>
  );
}

export default Register1;








// LOGGS

// console.log(uniqueWays)
// console.log('currentTimestamp', currentTimestamp)




// IM USEEFFECT GELOGGT, DA OBJEKT SONST NULL GIBT, WEIL ES ASYNCHRON GELADEN WIRD (FILTEREDDATA -> INITIALLOAD)
// useEffect(() => {
//   console.log('initialLoad:', initialLoad);
// }, [initialLoad]);

// console.log(apiData)
// console.log(stopIds)o