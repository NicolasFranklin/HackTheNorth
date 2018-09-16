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
        center: new H.geo.Point(43.46, -80.50),
        zoom:12
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

       //Logs data
       console.log(data);

       // If the text in the google doc is Berliner Landesmuseen, do a certain icon
       // IMPORTANT: The name MUST be Berliner - It will not work otherwise!
       // ----- THIS REPRESENTS THE HOSPITAL -----
       if (data[4]=="Berliner Landesmuseen")
       {
         // Define a variable holding SVG mark-up that defines an icon image:
         var svgMarkup = '<svg width="40" height="40" ' +
           'xmlns="http://www.w3.org/2000/svg">' +
           '<rect stroke="white" fill="#000000" x="1" y="1" width="1000" ' +
           'height="1000" /><text x="21" y="43.5" font-size="50pt" ' +
           'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
           'fill="red">+</text></svg>';

         // Create an icon, an object holding the svg:
         icon = new H.map.Icon(svgMarkup)
       }

       //If the tag is not Berliner, use the secondary icon
       // ----- THIS REPRESENTS THE SHELTER -----
       else {
         // Define a variable holding SVG mark-up that defines an icon image:
         var svgMarkup = '<svg width="40" height="40" ' +
           'xmlns="http://www.w3.org/2000/svg">' +
           '<rect stroke="white" fill="#ffffff" x="1" y="1" width="1000" ' +
           'height="1000" /><text x="21" y="43.5" font-size="50pt" ' +
           'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
           'fill="red">+</text></svg>';

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
        console.log(row);
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
