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
