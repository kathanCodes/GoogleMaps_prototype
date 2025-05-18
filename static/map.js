const map = L.map('map').setView([26.2389, 73.0243], 13); // Jodhpur

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markers = [];
let polyline = null;

map.on('click', function (e) {
  if (markers.length >= 2) {
    alert("Only two points allowed. Refresh to reset.");
    return;
  }

  const marker = L.marker(e.latlng).addTo(map);
  markers.push(marker);
});

async function findPath() {
  if (markers.length < 2) {
    alert("Please click on two points first.");
    return;
  }

  const start = [markers[0].getLatLng().lng, markers[0].getLatLng().lat];
  const end = [markers[1].getLatLng().lng, markers[1].getLatLng().lat];

  const response = await fetch('/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start, end })
  });

  const data = await response.json();

  if (data.coordinates) {
    if (polyline) map.removeLayer(polyline);
    polyline = L.geoJSON({
      type: 'LineString',
      coordinates: data.coordinates
    }, {
      style: { color: 'blue', weight: 5 }
    }).addTo(map);
  } else {
    alert("No route found");
  }
}
