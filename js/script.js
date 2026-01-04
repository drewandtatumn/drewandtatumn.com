// js/script.js

// CONFIGURATION
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

// --- INITIALIZATION ---
window.onload = function() {
    console.log("Mathis Global Industries: Online.");
    initNetworkAnimation(); 

    // Menu Logic
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

// --- NAVIGATION ---
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

function initWeather() {
    updateSector(currentSector);
}

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

async function fetchDashboardData(sectorKey) {
    document.getElementById('val-condition').innerText = "ESTABLISHING LINK...";
    document.getElementById('weather-ai-analysis').innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Decrypting Atmospheric Data...`;
    
    // Brief loading state for forecast
    const forecastRow = document.getElementById('forecast-row');
    if(forecastRow.innerHTML.includes("Loading")) {
        // Keep loading msg
    } else {
        // Only clear if empty
    }

    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "dashboard_update", sector: sectorKey }) 
        });

        const data = await response.json();
        if (!data || !data.weather) throw new Error("Invalid telemetry received");
        
        const w = data.weather;

        // 1. UPDATE VISUAL THEME
        updateThemeColor(w.sunrise, w.sunset);

        // 2. Update Telemetry
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

        // 3. Apply Colors
        applyColorLogic(w);

        // 4. Forecast with Moon Phase
        if (data.forecast && data.forecast.length > 0) {
            renderForecast(data.forecast);
        }

        // 5. Briefing
        if (data.briefing) {
            document.getElementById('weather-ai-analysis').innerHTML = data.briefing.replace(/\*\*(.*?)\*\*/g, '<strong class="text-info">$1</strong>');
        }

    } catch (e) {
        console.error("Dashboard Error:", e);
        document.getElementById('weather-ai-analysis').innerHTML = "<span class='text-danger'>⚠ UPLINK FAILED.</span>";
        document.getElementById('val-condition').innerText = "OFFLINE";
    }
}

// --- MOON & FORECAST LOGIC ---
function getMoonPhase(date) {
    // Simple Synodic Month Calculation
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    let c = e = jd = b = 0;
    if (month < 3) { year--; month += 12; }
    ++month;
    c = 365.25 * year;
    e = 30.6 * month;
    jd = c + e + day - 694039.09; // jd is total days elapsed
    jd /= 29.5305882; // Divide by lunar cycle
    b = parseInt(jd); // Integer part
    jd -= b; // Fractional part is phase
    b = Math.round(jd * 8); // 8 Phases
    
    if (b >= 8 ) b = 0;
    
    const phases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
    return phases[b];
}

function renderForecast(forecastData) {
    const container = document.getElementById('forecast-row');
    container.innerHTML = ""; 

    forecastData.forEach(day => {
        const dateObj = new Date(day.date * 1000);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const moon = getMoonPhase(dateObj);
        const iconUrl = `https://openweathermap.org/img/wn/${day.icon}.png`;

        const html = `
            <div class="col">
                <div class="card bg-glass text-center p-2 h-100 border-0" style="background: rgba(255,255,255,0.02);">
                    <div class="d-flex justify-content-between px-2 text-label">
                        <span>${dayName}</span>
                        <span>${moon}</span>
                    </div>
                    <img src="${iconUrl}" alt="${day.condition}" style="width: 40px; height: 40px; margin: 0 auto;">
                    <div class="text-white fw-bold my-1">
                        <span class="text-danger">${day.high}°</span> <span class="text-secondary">/</span> <span class="text-info">${day.low}°</span>
                    </div>
                    <div class="d-flex justify-content-center gap-2 mt-1">
                        <small class="text-info" title="Rain Chance"><i class="fas fa-umbrella"></i> ${day.pop}%</small>
                        <small class="text-secondary" title="Wind"><i class="fas fa-wind"></i> ${day.wind}</small>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// --- VISUAL THEME ENGINE ---
function updateThemeColor(sunrise, sunset) {
    const now = Math.floor(Date.now() / 1000); 
    const thirtyMins = 1800;
    const fortyFiveMins = 2700;

    let newColor = "13, 202, 240"; // Cyan (Default)

    if (now < sunrise - thirtyMins) {
        newColor = "0, 255, 0"; // Matrix Green (Night)
    } else if (now >= sunrise - thirtyMins && now < sunrise + thirtyMins) {
        newColor = "255, 193, 7"; // Orange (Dawn)
    } else if (now >= sunrise + thirtyMins && now < sunset - thirtyMins) {
        newColor = "13, 202, 240"; // Cyan (Day)
    } else if (now >= sunset - thirtyMins && now < sunset + fortyFiveMins) {
        newColor = "111, 66, 193"; // Purple (Dusk)
    } else {
        newColor = "0, 255, 0"; // Matrix Green (Night)
    }

    window.canvasThemeColor = newColor;
}

function applyColorLogic(w) {
    const tempEl = document.getElementById('val-temp');
    tempEl.className = `display-3 fw-bold me-3 ${w.temp > 95 ? 'text-danger' : (w.temp < 32 ? 'text-info' : 'text-white')}`;

    const windEl = document.getElementById('val-wind');
    windEl.className = `fw-bold ${w.wind > 20 ? 'text-danger' : (w.wind > 12 ? 'text-warning' : 'text-white')}`;

    const condEl = document.getElementById('val-condition');
    if (w.condition.includes("RAIN") || w.condition.includes("STORM")) {
        condEl.className = "small fw-bold text-info"; 
    } else if (w.condition.includes("CLEAR")) {
        condEl.className = "small fw-bold text-success"; 
    } else {
        condEl.className = "small fw-bold text-light"; 
    }
}

function getCardinalDirection(angle) {
    if (typeof angle !== 'number') return "";
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(angle / 45) % 8];
}

/* ================= CHATBOT LOGIC ================= */
// (Same as before)
let conversationHistory = [];
function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }
async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatHistoryDiv = document.getElementById('chat-history');
    if (!inputField || !chatHistoryDiv) return;
    const userText = inputField.value.trim();
    if (!userText) return;

    chatHistoryDiv.innerHTML += `<div class="user-message"><span class="badge bg-secondary mb-1">You</span><br>${userText}</div>`;
    inputField.value = "";
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    conversationHistory.push({ role: "user", parts: [{ text: userText }] });

    const loadingId = "loading-" + Date.now();
    chatHistoryDiv.innerHTML += `<div class="ai-message" id="${loadingId}"><span class="badge bg-info text-dark mb-1">Oracle</span><br><i class="fas fa-circle-notch fa-spin"></i> Computing...</div>`;
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history: conversationHistory }) 
        });
        if (!response.ok) throw new Error(`Worker Error: ${response.status}`);
        const data = await response.json();
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            const formattedText = aiText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
            chatHistoryDiv.innerHTML += `<div class="ai-message"><span class="badge bg-info text-dark mb-1">Oracle</span><br>${formattedText}</div>`;
            conversationHistory.push({ role: "model", parts: [{ text: aiText }] });
        }
    } catch (error) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.innerHTML = `<span class="badge bg-danger text-white mb-1">Error</span><br>Connection Failed.`;
    }
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

// --- NETWORK BACKGROUND ANIMATION (ZODIAC + THEME) ---
function initNetworkAnimation() {
    const canvas = document.getElementById('canvas-network');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, particles = [];
    const particleCount = 60, connectionDistance = 150, moveSpeed = 0.5;

    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
    
    function getZodiacSymbol() {
        const date = new Date();
        const d = date.getDate();
        const m = date.getMonth() + 1; 
        // Simple Zodiac Logic
        if((m==1 && d<=19) || (m==12 && d>=22)) return '♑'; // Capricorn
        if((m==1 && d>=20) || (m==2 && d<=18)) return '♒'; // Aquarius
        if((m==2 && d>=19) || (m==3 && d<=20)) return '♓'; // Pisces
        if((m==3 && d>=21) || (m==4 && d<=19)) return '♈'; // Aries
        if((m==4 && d>=20) || (m==5 && d<=20)) return '♉'; // Taurus
        if((m==5 && d>=21) || (m==6 && d<=20)) return '♊'; // Gemini
        if((m==6 && d>=21) || (m==7 && d<=22)) return '♋'; // Cancer
        if((m==7 && d>=23) || (m==8 && d<=22)) return '♌'; // Leo
        if((m==8 && d>=23) || (m==9 && d<=22)) return '♍'; // Virgo
        if((m==9 && d>=23) || (m==10 && d<=22)) return '♎'; // Libra
        if((m==10 && d>=23) || (m==11 && d<=21)) return '♏'; // Scorpio
        if((m==11 && d>=22) || (m==12 && d<=21)) return '♐'; // Sagittarius
        return '';
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width; this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * moveSpeed; this.vy = (Math.random() - 0.5) * moveSpeed;
            this.size = Math.random() * 2 + 1;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() { 
            ctx.fillStyle = `rgba(${window.canvasThemeColor}, 0.5)`; 
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); 
        }
    }
    
    function init() { resize(); particles = []; for (let i = 0; i < particleCount; i++) particles.push(new Particle()); }
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Draw Zodiac Watermark
        ctx.font = "200px serif";
        ctx.fillStyle = `rgba(${window.canvasThemeColor}, 0.05)`; // Very subtle watermark
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText(getZodiacSymbol(), width - 20, height - 20);

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
