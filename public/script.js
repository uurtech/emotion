const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const overlayCtx = overlay.getContext('2d');

// Debug logging
console.log('Script started');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo).catch(err => console.error('Error loading models:', err));

function startVideo() {
  console.log('Starting video');
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      console.log('Got media stream');
      video.srcObject = stream;
      video.play();
    })
    .catch(err => console.error('Error accessing webcam:', err));
}

// Wait for video to be fully loaded before starting face detection
video.addEventListener('loadeddata', () => {
  console.log('Video data loaded');
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  
  setInterval(async () => {
    console.log('Detecting faces');
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
    console.log('Detections:', detections);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    
    // Draw emotions on face
    resizedDetections.forEach(detection => {
      const { expressions, detection: { box } } = detection;
      const emotion = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      
      const drawBox = new faceapi.draw.DrawBox(box, { label: emotion });
      drawBox.draw(canvas);
      
      // Add text above the face
      const ctx = canvas.getContext('2d');
      ctx.font = '24px Arial';
      ctx.fillStyle = 'red';
      ctx.fillText(emotion, box.x, box.y - 10);
    });
  }, 100);
});

// Make sure video is visible
video.style.display = 'block';