let map;
let heatmap;
let geocoder;
let userLocation = null;
let bottlesDetected = 0;

function updateBottleCount(num) {
  bottlesDetected += num; // Increment by 1 for every capture, replace with actual detection count
  console.log('Updated count of bottles:', bottlesDetected);

  // Placeholder for backend API call to store the count
  // Example: axios.post('/api/updateCount', { location: userLocation, count: bottlesDetected })
}

function requestUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log('Location acquired:', userLocation);
      },
      () => {
        console.error('Error: The Geolocation service failed.');
      }
    );
  } else {
    console.error("Error: Your browser doesn't support geolocation.");
  }
}

function generateDummyData(callback) {
  const data = [];
  const baseLat = 32.7157; // San Diego latitude
  const baseLng = -117.1611; // San Diego longitude
  let placesProcessed = 0;

  for (let i = 0; i < 100; i++) {
    const lat = baseLat + (Math.random() - 0.5) * 0.1;
    const lng = baseLng + (Math.random() - 0.5) * 0.1;
    const count = Math.floor(10 + Math.random() * 4990);

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        data.push({
          lat,
          lng,
          count,
          placeName: results[0].formatted_address, // Using the full formatted address
        });
      } else {
        data.push({
          lat,
          lng,
          count,
          placeName: `Unidentified Location`, // Fallback name
        });
      }
      placesProcessed++;
      if (placesProcessed === 100) {
        callback(data);
      }
    });
  }
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center: { lat: 32.7157, lng: -117.1611 },
  });
  geocoder = new google.maps.Geocoder();

  generateDummyData(function (dummyData) {
    const heatmapData = dummyData.map((point) => ({
      location: new google.maps.LatLng(point.lat, point.lng),
      weight: point.count,
    }));

    heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: map,
    });

    google.maps.event.addListener(map, 'click', function (e) {
      const radius = 0.01; // Set a small radius for location accuracy
      const clickedLat = e.latLng.lat();
      const clickedLng = e.latLng.lng();

      dummyData.forEach((point) => {
        if (
          Math.abs(point.lat - clickedLat) < radius &&
          Math.abs(point.lng - clickedLng) < radius
        ) {
          showInfoBox(point.lat, point.lng, point.count, point.placeName);
        }
      });
    });
  });
}

function showInfoBox(lat, lng, count, placeName) {
  const infoBox = document.getElementById('infoBox');
  infoBox.style.display = 'block';
  infoBox.innerHTML = `<p>Location: ${placeName}</p>
                            <p>Coordinates: (${lat.toFixed(5)}, ${lng.toFixed(
    5
  )})</p>
                            <p>Plastic bottles detected: ${count}</p>`;
}
document.addEventListener('DOMContentLoaded', requestUserLocation);

document.getElementById('cameraButton').addEventListener('click', function () {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const captureButton = document.getElementById('captureButton');

  if (video.style.display === 'none') {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        video.srcObject = stream;
        video.play();
        video.style.display = 'block';
        canvas.style.display = 'none';
        captureButton.style.display = 'block';
      })
      .catch(function (err) {
        console.error('Error:', err);
      });
  } else {
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(function (track) {
      track.stop();
    });
    video.srcObject = null;
    video.style.display = 'none';
    canvas.style.display = 'none';
    captureButton.style.display = 'none';
  }
});

document.getElementById('captureButton').addEventListener('click', function () {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  canvas.style.display = 'block';
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, 640, 480);
  video.style.display = 'none'; // Hide video after taking picture

  // Dummy logic for detection - replace this with your ML detection
  const detected = Math.random() > 0.5; // Random detection status
  const message = detected
    ? 'Plastic bottle detected'
    : 'Plastic bottle not detected';
  if (detected) {
    updateBottleCount(1);
  }
  const detectionDisplay = document.createElement('div');
  detectionDisplay.textContent = message;
  detectionDisplay.style.position = 'absolute';
  detectionDisplay.style.top = '10px';
  detectionDisplay.style.left = '50%';
  detectionDisplay.style.transform = 'translateX(-50%)';
  detectionDisplay.style.backgroundColor = detected ? 'lightgreen' : 'red';
  detectionDisplay.style.color = 'white';
  detectionDisplay.style.padding = '10px';
  detectionDisplay.style.borderRadius = '5px';
  document.body.appendChild(detectionDisplay);

  // Close button for the canvas
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.onclick = function () {
    canvas.style.display = 'none';
    detectionDisplay.remove();
    closeButton.remove();
  };
  document.body.appendChild(closeButton);
});

initMap();
