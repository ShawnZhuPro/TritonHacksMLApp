document.getElementById('uploadButton').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput');
  if (fileInput.files.length === 0) {
    alert('Please select an image file first.');
    return;
  }

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  try {
    const response = await fetch('/detect', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();
    document.getElementById(
      'result'
    ).innerText = `Detected ${result.bottle_count} plastic bottles`;
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
});
