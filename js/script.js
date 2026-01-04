// js/script.js

const WORKER_URL = "https://mathis-oracle.drewandtatumn.workers.dev"; 
const SECTORS = {
    dfw: {
        name: "McKinney, TX",
        radarUrl: "https://embed.windy.com/embed2.html?lat=32.8998&lon=-97.0403&detailLat=32.8998&detailLon=-97.0403&width=650&height=450&zoom=9&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=°F&radarRange=-1",
        videoUrl: "https://www.youtube.com/embed/HkfKsRa9qnE?autoplay=1&mute=1&controls=0&rel=0"
    },
    slc: {
        name: "Salt Lake City, UT",
        radarUrl: "https://embed.windy.com/embed2.html?lat=40.7608&lon=-111.8910&detailLat=40.7608&detailLon=-111.8910&width=650&height=450&zoom=9&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=°F&radarRange=-1",
        videoUrl: "https://video.nest.com/embedded/live/qAupZ0qsW2?autoplay=1"
    }
};

let currentSector = 'dfw';
window.canvasThemeColor = "13, 202, 240"; // Default Cyan

window.onload = function() {
    console.log("Mathis Global Industries: Online.");
    initNetworkAnimation(); 
    // Load cached weather instantly if available
    loadFromCache(currentSector);

    const menuToggle = document.getElementById("menu-toggle");
    const menuClose = document.getElementById("menu-close");
    const wrapper = document.getElementById("wrapper");
    if (menuToggle && wrapper) {
        menuToggle.addEventListener("click", e => { e.preventDefault(); wrapper.classList.toggle("toggled"); });
    }
    if (menuClose && wrapper) {
        menuClose.addEventListener("click", e => { e.preventDefault(); wrapper.classList.remove("toggled"); });
    }
};

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('d-none'));
    const target = document.getElementById('section-' + sectionId);
    if (target) target.classList.remove('d-none');
    document.querySelectorAll('.list-group-item').forEach(item => item.classList.remove('active-link'));
    const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active-link');
    if (window.innerWidth < 768) document.getElementById("wrapper").classList.remove("toggled");
    if (sectionId === 'weather') initWeather();
}

/* ================= WEATHER LOGIC ================= */
function initWeather() { updateSector(currentSector); }

function updateSector(sectorKey) {
    currentSector = sectorKey;
    const sector = SECTORS[sectorKey];
    document.getElementById('btn-dfw').className = `btn btn-sm ${sectorKey === 'dfw' ? 'btn-info' : 'btn-outline-secondary'}`;
    document.getElementById('btn-slc').className = `btn btn-sm ${sectorKey === 'slc' ? 'btn-info' : 'btn-outline-secondary'}`;
    document.getElementById('sector-label').innerHTML = `<i class="fas fa-satellite me-2"></i> SECTOR: ${sectorKey.toUpperCase()}`;
    const videoFrame = document.getElementById('weather-video');
    if (videoFrame.src !== sector.videoUrl) videoFrame.src = sector.videoUrl;
    const radarFrame = document.getElementById('weather-radar');
    if (radarFrame && radarFrame.src !== sector.radarUrl) radarFrame.src = sector.radarUrl;
    fetchDashboardData(sectorKey);
}

// PERSISTENCE LAYER
function saveToCache(sector, data) {
    localStorage.setItem(`mgi_weather_${sector}`, JSON.stringify({ timestamp: Date.now(), data: data }));
}
function loadFromCache(sector) {
    const cached = localStorage.getItem(`mgi_weather_${sector}`);
    if (cached) {
        const parsed = JSON.parse(cached);
        console.log("Loaded cached data for " + sector);
        updateUI(parsed.data);
    }
}

async function fetchDashboardData(sectorKey) {
    document.getElementById('val-condition').innerText = "LINKING...";
    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "dashboard_update", sector: sectorKey }) 
        });

        const data = await response.json();
        if (!data || !data.weather) throw new Error("Invalid telemetry");
        
        saveToCache(sectorKey, data); // Backup success
        updateUI(data);

    } catch (e) {
        console.error("Dashboard Error:", e);
        // Fallback to cache if network fails completely
        loadFromCache(sectorKey); 
    }
}

function updateUI(data) {
    const w = data.weather;
    updateThemeColor(w.sunrise, w.sunset);

    document.getElementById('val-temp').innerText = w.temp + "°";
    document.getElementById('val-feels').innerText = w.feels_like + "°";
    document.getElementById('val-condition').innerText = w.condition;
    document.getElementById('val-wind').innerText = w.wind + " mph";
    document.getElementById('val-gust').innerText = w.wind_gust + " mph";
    document.getElementById('val-wind-dir').innerText = getCardinalDirection(w.wind_deg);
    document.getElementById('val-pressure').innerText = w.pressure;
    document.getElementById('val-humid').innerText = w.humidity;
    document.getElementById('val-dew').innerText = w.dew_point;
    document.getElementById('val-clouds').innerText = w.clouds;
    document.getElementById('val-vis').innerText = (w.visibility / 1609.34).toFixed(1);
    document.getElementById('val-sunrise').innerText = new Date(w.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('val-sunset').innerText = new Date(w.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    applyColorLogic(w);
    if (data.forecast && data.forecast.length > 0) renderForecast(data.forecast);
    
    // Funny Error Fallback
    if (data.briefing && data.briefing.includes("Failed") || data.briefing.includes("Unavailable")) {
        document.getElementById('weather-ai-analysis').innerHTML = getWittyError();
    } else {
        document.getElementById('weather-ai-analysis').innerHTML = data.briefing.replace(/\*\*(.*?)\*\*/g, '<strong class="text-info">$1</strong>');
    }
}

function getWittyError() {
    const errors = [
        "Satellites are currently on a coffee break.",
        "Atmospheric interference from user's massive aura.",
        "Gemini is currently calculating the meaning of life.",
        "Data packet intercepted by squirrels.",
        "Cloud layer too thick for WiFi."
    ];
    return `<span class="text-warning"><i class="fas fa-exclamation-triangle"></i> ${errors[Math.floor(Math.random() * errors.length)]}</span>`;
}

function renderForecast(forecastData) {
    const container = document.getElementById('forecast-row');
    container.innerHTML = ""; 
    forecastData.forEach(day => {
        const dateObj = new Date(day.date * 1000);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const iconUrl = `https://openweathermap.org/img/wn/${day.icon}.png`;
        const html = `
            <div class="col">
                <div class="card bg-glass text-center p-2 h-100 border-0" style="background: rgba(255,255,255,0.02);">
                    <div class="d-flex justify-content-between px-2 text-label">
                        <span>${dayName}</span>
                    </div>
                    <img src="${iconUrl}" alt="${day.condition}" style="width: 40px; height: 40px; margin: 0 auto;">
                    <div class="text-white fw-bold my-1">
                        <span class="text-danger">${day.high}°</span> <span class="text-secondary">/</span> <span class="text-info">${day.low}°</span>
                    </div>
                    <div class="d-flex justify-content-center gap-2 mt-1">
                        <small class="text-info"><i class="fas fa-umbrella"></i> ${day.pop}%</small>
                    </div>
                </div>
            </div>`;
        container.innerHTML += html;
    });
}

function getCardinalDirection(angle) {
    if (typeof angle !== 'number') return "";
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(angle / 45) % 8];
}

function applyColorLogic(w) {
    const tempEl = document.getElementById('val-temp');
    tempEl.className = `display-3 fw-bold me-3 ${w.temp > 95 ? 'text-danger' : (w.temp < 32 ? 'text-info' : 'text-white')}`;
}

// ... (Chatbot logic remains the same) ...

/* --- ZODIAC CONSTELLATION ENGINE --- */
function initNetworkAnimation() {
    const canvas = document.getElementById('canvas-network');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, particles = [];
    const particleCount = 60, connectionDistance = 150, moveSpeed = 0.5;
    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }

    // Simplified Constellation Maps (Normalized 0-1 coordinates)
    const constellations = {
        '♑': [[0.2,0.2],[0.8,0.2],[0.5,0.8],[0.2,0.2]], // Triangle for Capricorn
        '♒': [[0.1,0.3],[0.3,0.2],[0.5,0.3],[0.7,0.2],[0.9,0.3]], // Zigzag Aquarius
        // (Add simplified point arrays for others as needed)
        'default': [[0.2,0.8],[0.5,0.2],[0.8,0.8]] // Triangle
    };

    function drawConstellation() {
        // Draw lines connecting a set of fixed points relative to canvas size
        // This simulates the background "Network" connecting to form a star sign
        const points = constellations['default']; // For now, drawing a cool triangle
        ctx.strokeStyle = `rgba(${window.canvasThemeColor}, 0.1)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Scale normalized points to canvas bottom right corner
        const scale = 200; 
        const offsetX = width - 250;
        const offsetY = height - 250;
        
        points.forEach((p, i) => {
            const px = offsetX + (p[0] * scale);
            const py = offsetY + (p[1] * scale);
            if(i===0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
            // Draw "Star" at point
            ctx.fillStyle = `rgba(${window.canvasThemeColor}, 0.3)`;
            ctx.fillRect(px-2, py-2, 4, 4);
        });
        ctx.stroke();
    }

    class Particle {
        constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.vx = (Math.random() - 0.5) * moveSpeed; this.vy = (Math.random() - 0.5) * moveSpeed; this.size = Math.random() * 2 + 1; }
        update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > width) this.vx *= -1; if (this.y < 0 || this.y > height) this.vy *= -1; }
        draw() { ctx.fillStyle = `rgba(${window.canvasThemeColor}, 0.5)`; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }
    
    function init() { resize(); particles = []; for (let i = 0; i < particleCount; i++) particles.push(new Particle()); }
    function animate() {
        ctx.clearRect(0, 0, width, height);
        drawConstellation(); // Draw the zodiac lines
        particles.forEach((p, index) => {
            p.update(); p.draw();
            for (let j = index + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dist = Math.sqrt((p.x - p2.x)**2 + (p.y - p2.y)**2);
                if (dist < connectionDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${window.canvasThemeColor}, ${1 - dist/connectionDistance})`; 
                    ctx.lineWidth = 0.5; ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                }
            }
        });
        requestAnimationFrame(animate);
    }
    window.addEventListener('resize', resize); init(); animate();
}
