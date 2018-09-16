(function () {
'use strict';

var app_id = "DemoAppId01082013GAL";
var app_code = "AJKnXv84fjrb0KIHawS0Tg";


// Initialize communication with the platform, to access your own data, change the values below
// https://developer.here.com/documentation/geovisualization/topics/getting-credentials.html

// We recommend you use the CIT environment. Find more details on our platforms below
// https://developer.here.com/documentation/map-tile/common/request-cit-environment-rest.html

const platform = new H.service.Platform({
    app_id,
    app_code,
    useCIT: true,
    useHTTPS: true
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}
function showPosition(position) {
    console.log("Latitude: " + position.coords.latitude +
    "Longitude: " + position.coords.longitude);
}

getLocation();

const pixelRatio = devicePixelRatio > 1 ? 2 : 1;
let defaultLayers = platform.createDefaultLayers({
    tileSize: 256 * pixelRatio
});
const layers = platform.createDefaultLayers({
  tileSize: 256 * pixelRatio,
  ppi: pixelRatio > 1 ? 320 : 72
});

// initialize a map  - not specifying a location will give a whole world view.
let map = new H.Map(
    document.getElementsByClassName('dl-map')[0],
    defaultLayers.normal.map,
    {
        pixelRatio,
        center: new H.geo.Point(34.62242, -78.60813),
        zoom:10
    }
);

// make the map interactive
const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
let ui = H.ui.UI.createDefault(map, layers);
ui.removeControl('mapsettings');

// resize map on window resize
window.addEventListener('resize', function() {
    map.getViewPort().resize();
});

// data from the Open Berlin Data
// https://www.berlin.de/sen/kultur/kulturpolitik/statistik-open-data/orte-geodaten/
// download link:
// https://www.berlin.de/sen/kultur/_assets/statistiken/kultureinrichtungen_alle.xlsx
let provider = new H.datalens.RawDataProvider({
    dataUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTemKctECs5NpkLiYrcxfJ1VhY8a-ScCUe2nTQVrI4SFu52qEv5YX4jO25tSS-5FnIulvHtXwHLuvxA/pub?gid=0&single=true&output=csv',
    dataToFeatures: (data) => {
        let parsed = helpers.parseCSV(data);
        let features = [];
        let row = null;
        let feature = null;

        for (let i = 1, l = parsed.length; i < l; i++) {
            row = parsed[i];
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [Number(row[1]), Number(row[0])]
                },
                'properties': {
                    'capacity': "Number of People: " + row[2] + "/" + row[6],
                    'name': row[4],
                    'address': row[5],
                    'type':  row[3],
                    'occupancy': parseInt(row[2]) / parseInt(row[6])
                }
            };
            features.push(feature);
        }
        return features;
    },
    featuresToRows: (features) => {
        let rows = [], feature;
        for (let i = 0, l = features.length; i < l; i++) {
            feature = features[i];
            rows.push([{
                    lat: feature.geometry.coordinates[1],
                    lng: feature.geometry.coordinates[0]
                },
                feature.properties.name,
                feature.properties.address,
                feature.properties.capacity,
                feature.properties.type,
                feature.properties.occupancy
            ]);
        }
        return rows;
    }
});

let layer = new H.datalens.ObjectLayer(provider, {
    pixelRatio: window.devicePixelRatio,

    // accepts data row and returns map object
    rowToMapObject: function (data) {
        let coordinates = data[0];
        let facility = data[1];
        return new H.map.Marker(coordinates);
    },

    //THIS IS THE SECTION THAT DEFINES THE ICON STYLE

     rowToStyle: function (data, zoom) {

       //Some bs from the API - Not really neccesary
       if (!venueIcons[data[4]]) { console.log("null"); return; }

       //Defines icon but gets Rewritten -- Dont worry about this
       let icon = H.datalens.ObjectLayer.createIcon(venueIcons[data[4]],
       {size: 50 * pixelRatio});

       // If the text in the google doc is Berliner Landesmuseen, do a certain icon
       // IMPORTANT: The name MUST be Berliner - It will not work otherwise!
       // ----- THIS REPRESENTS THE HOSPITAL -----
       if (data[4]=="Berliner Landesmuseen")
       {
         // Define a variable holding SVG mark-up that defines an icon image:
         var svgMarkup = '<svg width="67" height="67" ' +
           'xmlns="http://www.w3.org/2000/svg">' +
           '<circle stroke="white" fill="#000" cx="31.5 " cy="31.5" r="33" />' +
           '<circle stroke="white" fill="#fff" cx="31.5 " cy="31.5" r="30" />' +
           '<text x="31.5" y="60" font-size="60pt" ' +
           'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
           'fill="red">+</text></svg>';

         // Create an icon, an object holding the svg:
         icon = new H.map.Icon(svgMarkup)
       }

       //If the tag is not Berliner, use the secondary icon
       // ----- THIS REPRESENTS THE SHELTER -----
       else {
         // Define a variable holding SVG mark-up that defines an icon image:
         var svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 34.58 36.33" width="60" height="60"><defs><style>.cls-1{fill:url(#radial-gradient);}.cls-2{fill:#999b9e;}.cls-3{fill:#fff;}.cls-4{fill:none;stroke:#77797c;stroke-miterlimit:10;}</style><radialGradient id="radial-gradient" cx="-67.92" cy="31.51" r="8.34" gradientTransform="translate(121.25 20.69) scale(1.54 0.39)" gradientUnits="userSpaceOnUse"><stop offset="0"/><stop offset="1" stop-opacity="0"/></radialGradient></defs><title>museum-shadow</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><ellipse class="cls-1" cx="16.77" cy="33.06" rx="12.83" ry="3.27"/><circle class="cls-2" cx="17.29" cy="17.29" r="16.79"/><path class="cls-3" d="M6.7,30.31a16.77,16.77,0,0,0,21.15,0c-.51-.78-1-1.55-1.53-2.34a1.34,1.34,0,0,1-.21-.71c0-2.67,0-8.35,0-9.88a.5.5,0,0,0-.5-.49H23.34c0,3.51,0,7.28,0,10.76H21.12c0-3.51,0-7.28,0-10.76H18.38c0,3.5,0,7.26,0,10.76H16.14c0-3.51,0-7.28,0-10.76H13.4c0,3.5,0,7.26,0,10.76H11.16c0-3.51,0-7.28,0-10.76H8.92a.49.49,0,0,0-.5.49c0,1.5,0,7,0,9.59A2.31,2.31,0,0,1,8,28.32C7.57,29,7.14,29.65,6.7,30.31Z"/><path class="cls-3" d="M17.39,8.9c1.06.62,2.11,1.26,3.17,1.87l6.1,3.48a.55.55,0,0,1-.27,1H8.16a.55.55,0,0,1-.28-1C11.09,12.41,17.11,9,17.19,8.9Z"/><circle class="cls-4" cx="17.29" cy="17.29" r="16.79"/></g></g></svg>`;


         // Create an icon, an object holding the latitude and longitude, and a marker:
          icon = new H.map.Icon(svgMarkup)
       }
       return {icon};
     }
 });

// add layer to map
map.addLayer(layer);

// show info bubble on hover
const format = d3.format('.2f');
let hoveredObject;
let infoBubble = new H.ui.InfoBubble({lat: 0, lng: 0}, {});
infoBubble.addClass('info-bubble');
infoBubble.close();
ui.addBubble(infoBubble);

map.addEventListener('pointermove', (e) => {
    if (hoveredObject && hoveredObject !== e.target) {
        infoBubble.close();
    }

    hoveredObject = e.target;
    if (hoveredObject.icon) {
        let row = hoveredObject.getData();
        if (row) {
            let name = row[1];
            let address = row[2];
            let capacity = row[3];
            let occupancy = row[5];

            let pos = map.screenToGeo(
                e.currentPointer.viewportX,
                e.currentPointer.viewportY);
            infoBubble.setPosition(pos);
            infoBubble.setContent(`
                <div class="info-bubble-title">${name}</div>
                <br>
                <div class="info-bubble-label">
                    ${address}
                </div>
                <br>
                <div id="capacity" class="info-bubble-label">
                    ${capacity}
                </div>`);
            if (occupancy >= 1) {
              document.getElementById("capacity").style.color = "#ff0000";
            }
            infoBubble.open();

        }
    }
});

}());
