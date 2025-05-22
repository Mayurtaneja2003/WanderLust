	
    mapboxgl.accessToken = mapToken;

    const map = new mapboxgl.Map({
        container: 'map', // container ID
        // style: 'mapbox://styles/mapbox/streets-v11', // style URL
        center: listing.geometry.coordinates, // starting position [lng, lat]. Note that lat must be set between -90 and 90
        // center: [77.209, 28.6139],
        zoom: 9 // starting zoom
    });
    // const marker = new mapboxgl.Marker({color:"red"})
    // .setLngLat(listing.geometry.coordinates)
    // .setPopup( new mapboxgl.Popup({offset:25})
    // .setHTML(`<h4>${listing.title}</h4><p>Exact Loaction will be provided after booking</p>`))

    // .addTo(map);
    // console.log("Mapbox Token:", mapboxgl.accessToken);
    // console.log("Listing Coordinates:", listing.geometry.coordinates);