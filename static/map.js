const map = L.map('map', {
  center: [26.2389, 73.0243],
  zoom: 10,
  maxZoom: 17,
  minZoom: 5 // 🔒 Restrict zoom
});
// Jodhpur

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

    const distance = computeRouteDistance(data.coordinates).toFixed(2);
    alert(`Route distance: ${distance} km`);

    // Show distance on map
    showDistanceOnMap(distance);
  } else {
    alert("No route found");
  }
}


async function searchByName() {
  const startName = document.getElementById("start-input").value;
  const endName = document.getElementById("end-input").value;

  if (!startName || !endName) {
    alert("Please enter both start and end locations.");
    return;
  }

  const geocode = async (place) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`);
    const data = await res.json();
    if (data.length === 0) throw new Error(`Location not found: ${place}`);
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  };

  try {
    const startLatLng = await geocode(startName);
    const endLatLng = await geocode(endName);

    resetSelection(); // Remove any previous markers

    const marker1 = L.marker(startLatLng).addTo(map);
    const marker2 = L.marker(endLatLng).addTo(map);
    markers.push(marker1, marker2);

    map.setView(startLatLng, 13);
  } catch (error) {
    alert(error.message);
  }
}

function resetSelection() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  if (polyline) {
    map.removeLayer(polyline);
    polyline = null;
  }

  document.getElementById("start-input").value = "";
  document.getElementById("end-input").value = "";
}

function useMyLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;

    if (markers.length >= 2) {
      alert("Only two points allowed. Reset to try again.");
      return;
    }

    const marker = L.marker([latitude, longitude]).addTo(map);
    markers.push(marker);
    map.setView([latitude, longitude], 13);
  }, () => {
    alert("Unable to retrieve your location.");
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c / 1000; // in km
}

function computeRouteDistance(coords) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lon1, lat1] = coords[i - 1];
    const [lon2, lat2] = coords[i];
    total += haversine(lat1, lon1, lat2, lon2);
  }
  return total;
}

function showDistanceOnMap(km) {
  const div = document.getElementById('distance-display');
  div.innerText = `📏 Route Distance: ${km} km`;
  div.style.display = 'block';
}
