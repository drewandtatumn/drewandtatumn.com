window.onload = function() {
    console.log("Mathis Global Industries: Online.");
    
    // 1. Initialize Animation
    initNetworkAnimation(); 

    // 2. Initialize Menu Toggle (Open & Close)
    const menuToggle = document.getElementById("menu-toggle");
    const menuClose = document.getElementById("menu-close");
    const wrapper = document.getElementById("wrapper");
    
    // Open Logic (Hamburger)
    if (menuToggle && wrapper) {
        menuToggle.addEventListener("click", function(e) {
            e.preventDefault();
            wrapper.classList.toggle("toggled");
        });
    }

    // Close Logic (The 'X' Button)
    if (menuClose && wrapper) {
        menuClose.addEventListener("click", function(e) {
            e.preventDefault();
            wrapper.classList.remove("toggled");
        });
    }
};

// --- Navigation Logic ---
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

    // 4. Auto-Close Sidebar on Mobile when a link is clicked
    if (window.innerWidth < 768) {
        document.getElementById("wrapper").classList.remove("toggled");
    }

    if (sectionId === 'weather') {
        initWeather();
    }
}

// --- The "Network" Background Animation ---
function initNetworkAnimation() {
    const canvas = document.getElementById('canvas-network');
    if (!canvas) return; // Safety check

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

/* ================= THE ORACLE (WORKER + MEMORY EDITION) ================= */

const WORKER_URL = "https://mathis-oracle.drewandtatumn.workers.dev"; 

// Global Variable to store conversation history
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

    // 2. Add to History Array
    conversationHistory.push({
        role: "user",
        parts: [{ text: userText }]
    });

    // 3. Show Loading
    const loadingId = "loading-" + Date.now();
    chatHistoryDiv.innerHTML += `
        <div class="ai-message" id="${loadingId}">
            <span class="badge bg-info text-dark mb-1">Oracle</span><br>
            <i class="fas fa-circle-notch fa-spin"></i> Thinking...
        </div>
    `;

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

/* ================= SKYNET (WEATHER) LOGIC ================= */

// Video Feed IDs (YouTube Live Streams)
const VIDEO_FEEDS = {
    dfw: "5_6wP_5rJjE", // WFAA Dallas Live
    slc: "gC4jD7J_yFw"  // KSL Salt Lake City Live
};

// 1. Initialize Weather when tab is clicked
function initWeather() {
    // Only fetch if we haven't already (prevents API spam)
    if (document.getElementById('weather-display-temp').innerText === "--°") {
        setVideo('dfw'); // Default to DFW
        fetchWeatherData();
    }
}

// 2. Video Toggle Logic
function setVideo(location) {
    const frame = document.getElementById('weather-video');
    const id = VIDEO_FEEDS[location] || VIDEO_FEEDS['dfw'];
    frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1`;
}

// 3. Fetch Data from Open-Meteo (No API Key needed for client-side)
async function fetchWeatherData() {
    // McKinney Coordinates
    const lat = 33.1972; 
    const lon = -96.6398;
    
    // Get temperature, wind, and rain probability
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const current = data.current;
        const currentHour = new Date().getHours();
        const rainChance = data.hourly.precipitation_probability[currentHour] || 0;

        // Update UI Numbers
        document.getElementById('weather-display-temp').innerText = Math.round(current.temperature_2m) + "°";
        document.getElementById('weather-display-wind').innerText = Math.round(current.wind_speed_10m);
        document.getElementById('weather-display-rain').innerText = rainChance;

        // 4. Send to YOUR Cloudflare Worker for AI Analysis
        getAiWeatherReport({
            temp: current.temperature_2m,
            wind: current.wind_speed_10m,
            rainChance: rainChance,
            condition: "WMO Code " + current.weather_code 
        });

    } catch (e) {
        console.error("Weather Data Error:", e);
        document.getElementById('weather-ai-analysis').innerText = "⚠ Telemetry Offline.";
    }
}

// 5. Ask The Oracle (via Worker) for the Analysis
async function getAiWeatherReport(weatherData) {
    const analysisBox = document.getElementById('weather-ai-analysis');
    
    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                type: "weather_report", // This tells the worker to use the NEW logic
                weather: weatherData 
            }) 
        });

        const json = await response.json();
        
        if (json.candidates && json.candidates[0].content) {
            const text = json.candidates[0].content.parts[0].text;
            analysisBox.innerText = text;
        } else {
            analysisBox.innerText = "Targeting system calibration error.";
        }

    } catch (e) {
        console.error("AI Error:", e);
        analysisBox.innerText = "AI Connection Severed.";
    }
}
