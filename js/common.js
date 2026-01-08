// js/common.js
// CORE SYSTEMS: Sidebar, Animation, and Theme ONLY

// CONFIGURATION
const WORKER_URL = "https://mathis-oracle.drewandtatumn.workers.dev"; 

// Global State
window.canvasThemeColor = "13, 202, 240"; // Default Cyan

// --- INITIALIZATION ---
window.onload = function() {
    console.log("Mathis Global Industries: Online.");
    
    // 1. Start Background Animation
    initNetworkAnimation(); 
    
    // 2. Set Theme based on time
    const hour = new Date().getHours();
    if(hour < 6 || hour > 20) window.canvasThemeColor = "13, 202, 240"; // Night
    else window.canvasThemeColor = "13, 202, 240"; // Day

    // 3. Sidebar Logic
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

// --- NETWORK BACKGROUND ANIMATION ---
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
        if((m==1 && d<=19) || (m==12 && d>=22)) return '♑'; 
        if((m==1 && d>=20) || (m==2 && d<=18)) return '♒'; 
        if((m==2 && d>=19) || (m==3 && d<=20)) return '♓'; 
        if((m==3 && d>=21) || (m==4 && d<=19)) return '♈'; 
        if((m==4 && d>=20) || (m==5 && d<=20)) return '♉'; 
        if((m==5 && d>=21) || (m==6 && d<=20)) return '♊'; 
        if((m==6 && d>=21) || (m==7 && d<=22)) return '♋'; 
        if((m==7 && d>=23) || (m==8 && d<=22)) return '♌'; 
        if((m==8 && d>=23) || (m==9 && d<=22)) return '♍'; 
        if((m==9 && d>=23) || (m==10 && d<=22)) return '♎'; 
        if((m==10 && d>=23) || (m==11 && d<=21)) return '♏'; 
        if((m==11 && d>=22) || (m==12 && d<=21)) return '♐'; 
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
        ctx.font = "200px serif";
        ctx.fillStyle = `rgba(${window.canvasThemeColor}, 0.05)`; 
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