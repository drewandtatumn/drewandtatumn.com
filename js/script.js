window.onload = function() {
    console.log("Mathis Global Industries: Online.");
    initNetworkAnimation(); // Start the background effect
};

// --- Navigation Logic ---
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('d-none'));
    // Show target
    document.getElementById('section-' + sectionId).classList.remove('d-none');
    
    // Update sidebar active state
    document.querySelectorAll('.list-group-item').forEach(item => item.classList.remove('active-link'));
    event.currentTarget.classList.add('active-link');
}

// --- The "Network" Background Animation ---
function initNetworkAnimation() {
    const canvas = document.getElementById('canvas-network');
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    
    // Configuration
    const particleCount = 60; // How many dots
    const connectionDistance = 150; // How close to connect lines
    const moveSpeed = 0.5;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * moveSpeed;
            this.vy = (Math.random() - 0.5) * moveSpeed;
            this.size = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.fillStyle = 'rgba(13, 202, 240, 0.5)'; // Cyan dots
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function init() {
        resize();
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Update and draw particles
        particles.forEach((p, index) => {
            p.update();
            p.draw();

            // Connect lines
            for (let j = index + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < connectionDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(13, 202, 240, ${1 - dist/connectionDistance})`; // Fade out
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    init();
    animate();
}

/* ================= THE ORACLE (WORKER EDITION) ================= */

// The URL of your Cloudflare Worker
const WORKER_URL = "https://mathis-oracle.drewandtatumn.workers.dev";

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatHistory = document.getElementById('chat-history');
    const userText = inputField.value.trim();

    if (!userText) return;

    // A. Add User Message to Screen
    chatHistory.innerHTML += `
        <div class="user-message">
            <span class="badge bg-secondary mb-1">You</span><br>
            ${userText}
        </div>
    `;
    inputField.value = "";
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // B. Show Loading Indicator
    const loadingId = "loading-" + Date.now();
    chatHistory.innerHTML += `
        <div class="ai-message" id="${loadingId}">
            <span class="badge bg-info text-dark mb-1">Oracle</span><br>
            <i class="fas fa-circle-notch fa-spin"></i> Contacting Mainframe...
        </div>
    `;

    // C. Call YOUR Cloudflare Worker
    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userText })
        });

        if (!response.ok) {
            throw new Error(`Worker Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Remove loading spinner
        const loadingMsg = document.getElementById(loadingId);
        if (loadingMsg) loadingMsg.remove();

        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            const formattedText = aiText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

            chatHistory.innerHTML += `
                <div class="ai-message">
                    <span class="badge bg-info text-dark mb-1">Oracle</span><br>
                    ${formattedText}
                </div>
            `;
        } else {
            throw new Error("Invalid response from Oracle");
        }

    } catch (error) {
        const loadingMsg = document.getElementById(loadingId);
        if (loadingMsg) {
             loadingMsg.innerHTML = `
                <span class="badge bg-danger text-white mb-1">Error</span><br>
                Connection Failed. The Oracle is offline.
            `;
        }
        console.error(error);
    }
    
    chatHistory.scrollTop = chatHistory.scrollHeight;
}
