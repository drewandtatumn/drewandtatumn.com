// js/script.js

// --- CONFIGURATION ---
const WORKER_URL = "https://mathis-oracle.drewandtatumn.workers.dev"; 

// 24/7 Live News Streams (YouTube IDs)
const SECTORS = {
    dfw: {
        name: "McKinney, TX",
        // DFW Radar (Windy)
        radarUrl: "https://embed.windy.com/embed2.html?lat=32.8998&lon=-97.0403&detailLat=32.8998&detailLon=-97.0403&width=650&height=450&zoom=9&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=°F&radarRange=-1",
        // YouTube Embed (Standard)
        videoUrl: "https://www.youtube.com/embed/HkfKsRa9qnE?autoplay=1&mute=1&controls=0&rel=0"
    },
    slc: {
        name: "Salt Lake City, UT",
        // SLC Radar (Calculated Lat/Lon 40.7608, -111.8910)
        radarUrl: "https://embed.windy.com/embed2.html?lat=40.7608&lon=-111.8910&detailLat=40.7608&detailLon=-111.8910&width=650&height=450&zoom=9&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=°F&radarRange=-1",
        // Nest Cam Embed
        videoUrl: "https://video.nest.com/embedded/live/qAupZ0qsW2?autoplay=1"
    }
};

let currentSector = 'dfw';

// --- SYSTEM INITIALIZATION ---
window.onload = function() {
    console.log("Mathis Global Industries: Online.");
    
    // 1. Initialize Animation
    initNetworkAnimation(); 

    // 2. Initialize Menu Toggle
    const menuToggle = document.getElementById("menu-toggle");
    const menuClose = document.getElementById("menu-close");
    const wrapper = document.getElementById("wrapper");
    
    if (menuToggle && wrapper) {
        menuToggle.addEventListener("click", function(e) {
            e.preventDefault();
            wrapper.classList.toggle("toggled");
        });
    }

    if (menuClose && wrapper) {
        menuClose.addEventListener("click", function(e) {
            e.preventDefault();
            wrapper.classList.remove("toggled");
        });
    }
};

// --- NAVIGATION LOGIC ---
function showSection(sectionId) {
    // 1. Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('d-none'));
    
    // 2. Show the target section
    const target = document.getElementById('section-' + sectionId);
    if (target) {
        target.classList.remove('d-none');
    }

    // 3. Highlight the Sidebar Link
    document.querySelectorAll('.list-group-item').forEach(item => item.classList.remove('active-link'));
    const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active-link');
    }

    // 4. Auto-Close Sidebar on Mobile
    if (window.innerWidth < 768) {
        document.getElementById("wrapper").classList.remove("toggled");
    }

    // 5. Trigger Weather Load ONLY when clicking the tab
    if (sectionId === 'weather') {
        initWeather();
    }
}

/* ================= SKYNET (WEATHER) COMMAND CENTER ================= */

function initWeather() {
    updateSector(currentSector);
}

function updateSector(sectorKey) {
    currentSector = sectorKey;
    const sector = SECTORS[sectorKey];

    // 1. Update Buttons
    document.getElementById('btn-dfw').className = `btn btn-sm ${sectorKey === 'dfw' ? 'btn-info' : 'btn-outline-secondary'}`;
    document.getElementById('btn-slc').className = `btn btn-sm ${sectorKey === 'slc' ? 'btn-info' : 'btn-outline-secondary'}`;
    document.getElementById('sector-label').innerHTML = `<i class="fas fa-satellite me-2"></i> SECTOR: ${sectorKey.toUpperCase()}`;

    // 2. Update Video Feed (Dynamic Source: YouTube or Nest)
    const videoFrame = document.getElementById('weather-video');
    if (videoFrame.src !== sector.videoUrl) {
        videoFrame.src = sector.videoUrl;
    }

    // 3. Update Radar Feed
    const radarFrame = document.getElementById('weather-radar');
    if (radarFrame && radarFrame.src !== sector.radarUrl) {
        radarFrame.src = sector.radarUrl;
    }

    // 4. Fetch Telemetry
    fetchDashboardData(sectorKey);
}

async function fetchDashboardData(sectorKey) {
    // UI Loading States
    document.getElementById('val-condition').innerText = "ESTABLISHING LINK...";
    document.getElementById('weather-ai-analysis').innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Decrypting Atmospheric Data...`;
    
    // Reset values to dashes
    document.getElementById('val-temp').innerText = "--°";
    document.getElementById('val-wind').innerText = "--";

    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                type: "dashboard_update", 
                sector: sectorKey 
            }) 
        });

        const data = await response.json();
        
        // Safety check for valid data
        if (!data || !data.weather) throw new Error("Invalid telemetry received");

        const w = data.weather;

        // 4. Update DOM with Real Data
        document.getElementById('val-temp').innerText = w.temp + "°";
        document.getElementById('val-feels').innerText = w.feels_like + "°";
        document.getElementById('val-condition').innerText = w.condition;
        
        document.getElementById('val-wind').innerText = w.wind;
        document.getElementById('val-pressure').innerText = w.pressure;
        
        // Soil Moisture & Rain are not provided by standard OWM, setting to N/A/Default to avoid "Scanning..." loop
        document.getElementById('val-soil').innerText = "N/A"; 
        document.getElementById('val-soil-color').className = "fw-bold text-secondary";
        document.getElementById('val-rain').innerText = "--";

        // 5. Update AI Briefing
        if (data.briefing) {
            document.getElementById('weather-ai-analysis').innerHTML = data.briefing.replace(/\*\*(.*?)\*\*/g, '<strong class="text-info">$1</strong>');
        }

    } catch (e) {
        console.error("Dashboard Error:", e);
        document.getElementById('weather-ai-analysis').innerText = "⚠ CONNECTION FAILURE. ORACLE OFFLINE.";
        document.getElementById('val-condition').innerText = "OFFLINE";
    }
}

/* ================= THE ORACLE (CHATBOT) ================= */

// Global History
let conversationHistory = [];

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatHistoryDiv = document.getElementById('chat-history');
    
    if (!inputField || !chatHistoryDiv) return;
    
    const userText = inputField.value.trim();
    if (!userText) return;

    // 1. Display User Message
    chatHistoryDiv.innerHTML += `
        <div class="user-message">
            <span class="badge bg-secondary mb-1">You</span><br>
            ${userText}
        </div>
    `;
    inputField.value = "";
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

    // 2. Add to History
    conversationHistory.push({
        role: "user",
        parts: [{ text: userText }]
    });

    // 3. Show Loading
    const loadingId = "loading-" + Date.now();
    chatHistoryDiv.innerHTML += `
        <div class="ai-message" id="${loadingId}">
            <span class="badge bg-info text-dark mb-1">Oracle</span><br>
            <i class="fas fa-circle-notch fa-spin"></i> Computing...
        </div>
    `;
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

    try {
        // 4. Send History to Worker
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history: conversationHistory }) 
        });

        if (!response.ok) {
            throw new Error(`Worker Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Remove loading
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            
            // 5. Display AI Message
            const formattedText = aiText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
            chatHistoryDiv.innerHTML += `
                <div class="ai-message">
                    <span class="badge bg-info text-dark mb-1">Oracle</span><br>
                    ${formattedText}
                </div>
            `;

            // 6. Save AI Response
            conversationHistory.push({
                role: "model",
                parts: [{ text: aiText }]
            });

        } else {
            throw new Error("No valid text in response");
        }

    } catch (error) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
             loadingEl.innerHTML = `
                <span class="badge bg-danger text-white mb-1">Error</span><br>
                Connection Failed. The Oracle is offline.
            `;
        }
        console.error(error);
    }
    
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

// --- NETWORK BACKGROUND ANIMATION ---
function initNetworkAnimation() {
    const canvas = document.getElementById('canvas-network');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    const particleCount = 60; 
    const connectionDistance = 150; 
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
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.fillStyle = 'rgba(13, 202, 240, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach((p, index) => {
            p.update();
            p.draw();
            for (let j = index + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < connectionDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(13, 202, 240, ${1 - dist/connectionDistance})`; 
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
