// js/weather.js
// SKYNET V2.5 - EXPONENTIAL BACKOFF PROTOCOL

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

const SAFE_MODE_DATA = {
    weather: {
        temp: 72, feels_like: 70, condition: "SIMULATION", 
        wind: 5, wind_gust: 8, wind_deg: 180, 
        pressure: 1015, humidity: 45, dew_point: 50, 
        clouds: 10, visibility: 16093, 
        sunrise: Math.floor(Date.now()/1000) - 20000, 
        sunset: Math.floor(Date.now()/1000) + 20000
    },
    forecast: [
        { date: Math.floor(Date.now()/1000) + 86400, high: 75, low: 60, pop: 10, wind: 8, condition: "Clear", icon: "01d" },
        { date: Math.floor(Date.now()/1000) + 172800, high: 78, low: 62, pop: 0, wind: 10, condition: "Clouds", icon: "02d" },
        { date: Math.floor(Date.now()/1000) + 259200, high: 74, low: 58, pop: 20, wind: 12, condition: "Rain", icon: "10d" },
        { date: Math.floor(Date.now()/1000) + 345600, high: 70, low: 55, pop: 40, wind: 15, condition: "Storm", icon: "11d" },
        { date: Math.floor(Date.now()/1000) + 432000, high: 72, low: 57, pop: 10, wind: 5, condition: "Clear", icon: "01d" }
    ],
    briefing: "**SYSTEM ALERT:** Connection to Satellite Lost. Displaying Simulation Data. Have a nice day."
};

let currentSector = 'dfw';
let retryCount = 0;
// Backoff strategy: Wait 5s, then 15s, then 30s before giving up
const retryDelays = [5000, 15000, 30000]; 

// --- INITIALIZATION ---
initWeather();

function initWeather() {
    retryCount = 0; // Reset retries on manual refresh
    updateSector(currentSector);
}

function updateSector(sectorKey) {
    currentSector = sectorKey;
    const sector = SECTORS[sectorKey];
    
    // UI Updates
    const btnDfw = document.getElementById('btn-dfw');
    const btnSlc = document.getElementById('btn-slc');
    if(btnDfw && btnSlc) {
        btnDfw.className = `btn btn-sm ${sectorKey === 'dfw' ? 'btn-info' : 'btn-outline-secondary'}`;
        btnSlc.className = `btn btn-sm ${sectorKey === 'slc' ? 'btn-info' : 'btn-outline-secondary'}`;
    }

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
    const condEl = document.getElementById('val-condition');
    const aiEl = document.getElementById('weather-ai-analysis');
    
    // Only show "PINGING" on the first try, not on automatic retries
    if(retryCount === 0) {
        if(condEl) condEl.innerText = "PINGING...";
        if(aiEl) aiEl.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Establishing Uplink...`;
    }

    try {
        // ATTEMPT LIVE CONNECTION
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "dashboard_update", sector: sectorKey }) 
        });

        if (!response.ok) throw new Error("Worker Response Invalid");

        const data = await response.json();
        if (!data || !data.weather) throw new Error("Invalid telemetry received");
        
        // SUCCESS: Render Real Data
        retryCount = 0; // Reset counter on success
        renderDashboard(data, false);

    } catch (e) {
        console.warn(`Attempt Failed. Retry Level: ${retryCount}`, e);
        
        if (retryCount < retryDelays.length) {
            // RETRY LOGIC (Exponential Backoff)
            const delay = retryDelays[retryCount];
            if(aiEl) aiEl.innerHTML = `<span class="text-warning"><i class="fas fa-satellite-dish"></i> Uplink Weak. Retrying in ${delay/1000}s...</span>`;
            
            setTimeout(() => {
                retryCount++;
                fetchDashboardData(sectorKey);
            }, delay);
        } else {
            // GIVE UP -> RENDER SAFE MODE
            renderDashboard(SAFE_MODE_DATA, true);
        }
    }
}

function renderDashboard(data, isSimulation) {
    const w = data.weather;
    const aiEl = document.getElementById('weather-ai-analysis');

    // 1. Theme Engine (Safe Wrapped)
    try { updateThemeColor(w.sunrise, w.sunset); } catch(e) { console.error("Theme Error", e); }

    // 2. Telemetry (Wrap in try/catch so partial failures don't stop the rest)
    try {
        document.getElementById('val-temp').innerText = w.temp + "°";
        document.getElementById('val-feels').innerText = w.feels_like + "°";
        document.getElementById('val-condition').innerText = w.condition.toUpperCase();
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
    } catch (e) { console.error("Telemetry Error", e); }

    // 3. Forecast
    try {
        if(data.forecast) renderForecast(data.forecast);
    } catch (e) { console.error("Forecast Error", e); }

    // 4. Briefing & Simulation Warning
    if (aiEl) {
        if (isSimulation) {
            aiEl.innerHTML = `<span class="text-danger">⚠ UPLINK FAILED.</span><br>Problem with weather API - try going outside if you want to see the weather :)`;
            document.getElementById('val-condition').innerText = "OFFLINE";
            document.getElementById('val-condition').className = "small fw-bold text-danger";
        } else {
            aiEl.innerHTML = data.briefing ? data.briefing.replace(/\*\*(.*?)\*\*/g, '<strong class="text-info">$1</strong>') : "Briefing Unavailable.";
        }
    }
}

// --- HELPERS ---

function getMoonPhase(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let c = e = jd = b = 0;
    if (month < 3) { year--; month += 12; }
    ++month;
    c = 365.25 * year;
    e = 30.6 * month;
    jd = c + e + day - 694039.09; jd /= 29.5305882; b = parseInt(jd); jd -= b; b = Math.round(jd * 8); 
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
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

function updateThemeColor(sunrise, sunset) {
    const now = Math.floor(Date.now() / 1000); 
    const thirtyMins = 1800;
    const fortyFiveMins = 2700;
    let newColor = "13, 202, 240"; 
    if (now < sunrise - thirtyMins) newColor = "0, 255, 0"; 
    else if (now >= sunrise - thirtyMins && now < sunrise + thirtyMins) newColor = "255, 193, 7"; 
    else if (now >= sunrise + thirtyMins && now < sunset - thirtyMins) newColor = "13, 202, 240"; 
    else if (now >= sunset - thirtyMins && now < sunset + fortyFiveMins) newColor = "111, 66, 193"; 
    else newColor = "0, 255, 0"; 
    window.canvasThemeColor = newColor;
}

function applyColorLogic(w) {
    const tempEl = document.getElementById('val-temp');
    if(tempEl) tempEl.className = `display-3 fw-bold me-3 ${w.temp > 95 ? 'text-danger' : (w.temp < 32 ? 'text-info' : 'text-white')}`;
    const windEl = document.getElementById('val-wind');
    if(windEl) windEl.className = `fw-bold ${w.wind > 20 ? 'text-danger' : (w.wind > 12 ? 'text-warning' : 'text-white')}`;
    const condEl = document.getElementById('val-condition');
    if(condEl && w.condition !== "SIMULATION") {
        if (w.condition.includes("RAIN") || w.condition.includes("STORM")) condEl.className = "small fw-bold text-info"; 
        else if (w.condition.includes("CLEAR")) condEl.className = "small fw-bold text-success"; 
        else condEl.className = "small fw-bold text-light"; 
    }
}

function getCardinalDirection(angle) {
    if (typeof angle !== 'number') return "";
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(angle / 45) % 8];
}