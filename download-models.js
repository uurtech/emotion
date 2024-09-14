const fs = require('fs');
const https = require('https');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(modelsDir)){
    fs.mkdirSync(modelsDir, { recursive: true });
}

const modelFiles = [
    'face_expression_model-shard1',
    'face_expression_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
    'face_recognition_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'tiny_face_detector_model-weights_manifest.json'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

modelFiles.forEach(file => {
    const url = baseUrl + file;
    const filePath = path.join(modelsDir, file);
    
    https.get(url, (response) => {
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`Downloaded: ${file}`);
        });
    }).on('error', (err) => {
        console.error(`Error downloading ${file}: ${err.message}`);
    });
});