const video = document.getElementById('video');
const detectionCanvas = document.getElementById('detectionCanvas');
const chartCanvas = document.getElementById('emotionChart');

console.log('Script started');

let emotionChart;
const emotionCounts = {
  angry: 0,
  disgusted: 0,
  fearful: 0,
  happy: 0,
  neutral: 0,
  sad: 0,
  surprised: 0
};

const modernColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE'
];

function initializeChart() {
  emotionChart = new Chart(chartCanvas, {
    type: 'radar',
    data: {
      labels: Object.keys(emotionCounts),
      datasets: [{
        label: 'Emotion Counts',
        data: Object.values(emotionCounts),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: modernColors[0],
        pointBackgroundColor: modernColors,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: modernColors[0]
      }]
    },
    options: {
      scales: {
        r: {
          angleLines: { display: false },
          suggestedMin: 0,
          suggestedMax: 10,
          ticks: { stepSize: 1 }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo).catch(err => console.error('Error loading models:', err));

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      console.log('Webcam access granted');
      video.srcObject = stream;
      video.play();
    })
    .catch(err => console.error('Error accessing webcam:', err));
}

function updateCanvasDimensions() {
  const sidebarWidth = 300;
  const aspectRatio = video.videoWidth / video.videoHeight;
  const canvasHeight = Math.min(180, sidebarWidth / aspectRatio);
  
  detectionCanvas.width = sidebarWidth - 40;
  detectionCanvas.height = canvasHeight;
  
  chartCanvas.width = sidebarWidth - 40;
  chartCanvas.height = canvasHeight;
}

video.addEventListener('loadedmetadata', () => {
  console.log('Video metadata loaded');
  updateCanvasDimensions();
  initializeChart();
});

video.addEventListener('play', () => {
  console.log('Video playback started');
  
  const displaySize = { width: detectionCanvas.width, height: detectionCanvas.height };
  faceapi.matchDimensions(detectionCanvas, displaySize);
  
  setInterval(async () => {
    if (video.paused || video.ended || !video.videoWidth) return;

    try {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      const ctx = detectionCanvas.getContext('2d');
      ctx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
      
      faceapi.draw.drawDetections(detectionCanvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(detectionCanvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(detectionCanvas, resizedDetections);
      
      if (resizedDetections.length > 0) {
        const { expressions } = resizedDetections[0];
        const emotion = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        emotionCounts[emotion]++;
        
        if (emotionChart) {
          emotionChart.data.datasets[0].data = Object.values(emotionCounts);
          emotionChart.update();
        }
        
        console.log('Detected emotion:', emotion);
      }
    } catch (error) {
      console.error('Error during face detection:', error);
    }
  }, 500);
});

window.addEventListener('resize', updateCanvasDimensions);