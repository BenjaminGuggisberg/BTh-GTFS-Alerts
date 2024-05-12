

        // Alte loadRoutes Funktion ohne Promis.all()

        // const loadRoutes = async () => {
        //     const routeDataMap = new Map(); // Eine Map, um doppelte Routenabrufe zu vermeiden

        //     for (const routeId of Ways) {
        //         // Überprüfen, ob die Route bereits abgerufen wurde
        //         if (!routeDataMap.has(routeId)) {
        //             const routeData = await fetchRouteData(routeId);
        //             routeDataMap.set(routeId, routeData); // Die Routendaten in der Map speichern
        //         }

        //         const routeData = routeDataMap.get(routeId); // Die Routendaten aus der Map abrufen
        //         if (routeData && routeData.elements) {
        //             let routeName = "Unnamed Route";
        //             if (routeData.elements.length > 0 && routeData.elements[0].tags.name) {
        //                 routeName = routeData.elements[0].tags.name;
        //             }

        //             const routes = [];
        //             routeData.elements.forEach(element => {
        //                 const wayGeometries = [];
        //                 if (element.type === "relation") {
        //                     element.members.forEach(member => {
        //                         if (member.type === "way" && member.role === "") {
        //                             let geometry = member.geometry;
        //                             if (!Array.isArray(geometry)) {
        //                                 geometry = [geometry];
        //                             }
        //                             if (geometry) {
        //                                 const points = geometry.map(coord => [coord.lat, coord.lon]);
        //                                 wayGeometries.push(points);
        //                             }
        //                         }
        //                     });
        //                 }
        //                 if (wayGeometries.length > 0) {
        //                     routes.push(wayGeometries);
        //                 }
        //             });

        //             // Filtere leere Elemente aus
        //             const nonEmptyRoutes = routes.filter(route => route.length > 0);

        //             // Überprüfen, ob die Routen nicht leer sind, bevor sie gezeichnet werden
        //             if (nonEmptyRoutes.length > 0) {
        //                 drawRoute(map, nonEmptyRoutes.flat(), 'red', routeId, routeName);
        //             }
        //         }
        //     }
        // };