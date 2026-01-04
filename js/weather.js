// js/weather.js
// SKYNET: Atmospheric Monitoring & Dashboard Logic

// CONFIGURATION
// Note: WORKER_URL is already defined in common.js, but we redeclare it here 
// for safety in case common.js fails or load order is weird. 
// const WORKER_URL = "https://mathis-oracle.drewandtatumn.workers.dev"; 

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

// --- INITIALIZATION ---
// Automatically start up when this script loads
initWeather();

function initWeather() {
    updateSector(currentSector);
}

function updateSector(sectorKey) {
    currentSector = sectorKey;
    const sector = SECTORS[sectorKey];

    // Update Buttons
    const btnDfw = document.getElementById('btn-dfw');
    const btnSlc = document.getElementById('btn-slc');
    
    if(btnDfw && btnSlc) {
        btnDfw.className = `btn btn-sm ${sectorKey === 'dfw' ? 'btn-info' : 'btn-outline-secondary'}`;
        btnSlc.className = `btn btn-sm ${sectorKey === 'slc' ? 'btn-info' : 'btn-outline-secondary'}`;
    }

    // Update Label
    const label = document.getElementById('sector-label');
    if(label) label.innerHTML = `<i class="fas fa-satellite me-2"></i> SECTOR: ${sectorKey.toUpperCase()}`;

    // Update Feeds
    const videoFrame = document.getElementById('weather-video');
    if (videoFrame && videoFrame.src !== sector.videoUrl) videoFrame.src = sector.videoUrl;

    const radarFrame = document.getElementById('weather-radar');
    if (radarFrame && radarFrame.src !== sector.radarUrl) radarFrame.src = sector.radarUrl;

    // Fetch Data
    fetchDashboardData(sectorKey);
}

async function fetchDashboardData(sectorKey) {
    // UI Loading State
    const condEl = document.getElementById('val-condition');
    const aiEl = document.getElementById('weather-ai-analysis');
    
    if(condEl) condEl.innerText = "ESTABLISHING LINK...";
    if(aiEl) aiEl.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Decrypting Atmospheric Data...`;
    
    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "dashboard_update", sector: sectorKey }) 
        });

        const data = await response.json();
        if (!data || !data.weather) throw new Error("Invalid telemetry received");
        
        const w = data.weather;

        // 1. UPDATE VISUAL THEME based on sun position
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

        // 3. Apply Text Colors
        applyColorLogic(w);

        // 4. Forecast with Moon Phase
        if (data.forecast && data.forecast.length > 0) {
            renderForecast(data.forecast);
        }

        // 5. Briefing
        if (data.briefing && aiEl) {
            aiEl.innerHTML = data.briefing.replace(/\*\*(.*?)\*\*/g, '<strong class="text-info">$1</strong>');
        }

    } catch (e) {
        console.error("Dashboard Error:", e);
        if(aiEl) aiEl.innerHTML = "<span class='text-danger'>⚠ UPLINK FAILED.</span>";
        if(condEl) condEl.innerText = "OFFLINE";
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
    if(!container) return;
    
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
    if(tempEl) tempEl.className = `display-3 fw-bold me-3 ${w.temp > 95 ? 'text-danger' : (w.temp < 32 ? 'text-info' : 'text-white')}`;

    const windEl = document.getElementById('val-wind');
    if(windEl) windEl.className = `fw-bold ${w.wind > 20 ? 'text-danger' : (w.wind > 12 ? 'text-warning' : 'text-white')}`;

    const condEl = document.getElementById('val-condition');
    if(condEl) {
        if (w.condition.includes("RAIN") || w.condition.includes("STORM")) {
            condEl.className = "small fw-bold text-info"; 
        } else if (w.condition.includes("CLEAR")) {
            condEl.className = "small fw-bold text-success"; 
        } else {
            condEl.className = "small fw-bold text-light"; 
        }
    }
}

function getCardinalDirection(angle) {
    if (typeof angle !== 'number') return "";
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(angle / 45) % 8];
}