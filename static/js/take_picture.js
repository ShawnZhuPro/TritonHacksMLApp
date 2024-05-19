document.addEventListener('DOMContentLoaded', function () {
  const video = document.getElementById('video');
  const canvas = document.getElementById('snapshot');
  const cameraButton = document.getElementById('cameraButton');
  const captureButton = document.getElementById('captureButton');
  const submitButton = document.getElementById('submitButton');
  const resultDiv = document.getElementById('result');

  // Access the device camera and stream to video element
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((err) => {
      console.error('Error accessing webcam: ', err);
    });

  // Capture a picture from the video stream
  captureButton.addEventListener('click', () => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  });

  // Submit the picture for processing
  submitButton.addEventListener('click', () => {
    const dataUrl = canvas.toDataURL('image/jpeg');
    const blob = dataURLToBlob(dataUrl);
    const formData = new FormData();
    formData.append('image', blob);

    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      fetch('/process_image', {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === 'success') {
            resultDiv.innerHTML = `<p>Plastic bottle detected</p>`;
            updateHeatmap(lat, lng, data.count);
          } else {
            resultDiv.innerHTML = `<p>Not a plastic bottle</p>`;
          }
        })
        .catch((error) => console.error('Error:', error));
    });
  });

  function dataURLToBlob(dataURL) {
    const parts = dataURL.split(',');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  function updateHeatmap(lat, lng, count) {
    window.opener.updateHeatmap(lat, lng, count);
    window.close();
  }
});
