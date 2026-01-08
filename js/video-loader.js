// js/video-loader.js
// Handles Smart Link Parsing, Auto-Detection, and Layout

// CONFIGURATION ZONE
// Format: "YouTube Link | Title | Company (mb/chorbie/wx) | Is Edit? (true/false)"
const RAW_VIDEOS = [
    // --- MOWING BEST (All Shorts) ---
    "https://www.youtube.com/shorts/J2kJ4jLlEzQ | Height of Grass | mb | false",
    "https://www.youtube.com/shorts/VRAuv6CJrg0 | Acorns Damage | mb | false",
    "https://www.youtube.com/shorts/_b0oLr8JfLo | Insulate Shrubs | mb | false",
    "https://www.youtube.com/shorts/B5DtVrBl2ac | Winter Prep | mb | false",
    "https://www.youtube.com/shorts/ViaRekkeW8g | Winter Cut Height | mb | false",
    "https://www.youtube.com/shorts/pM663bP6Tq4 | Guilty as Charged | mb | false",
    "https://www.youtube.com/shorts/BCjeTEtKjKI | Stop Mowing? | mb | false",
    "https://www.youtube.com/shorts/JKQMtOFXsfo | Here I am | mb | false",
    "https://www.youtube.com/shorts/DV_ncaM0ZG8 | Being Chased | mb | false",
    "https://www.youtube.com/shorts/TXurptOweXM | Winter Lookout | mb | false",
    "https://www.youtube.com/shorts/S_UKk1tkkbc | Trust Fall | mb | false",
    "https://www.youtube.com/shorts/q329SYcpT44 | How much to mow? | mb | false",
    "https://www.youtube.com/shorts/yYPAfbejEho | 3 Fall Tips | mb | false",
    "https://www.youtube.com/shorts/6kdeifgIF00 | Types of Mulching | mb | false",
    "https://www.youtube.com/shorts/Lbqao5oVyrE | Break it down | mb | false",
    "https://www.youtube.com/shorts/oQ7jtIBWT0k | Avoid this in Winter | mb | false",
    "https://www.youtube.com/shorts/Ww3AVcrLFdA | BAM! | mb | false",
    "https://www.youtube.com/shorts/B9JmhE0qMMU | Whats Included | mb | false",
    "https://www.youtube.com/shorts/OEb7MsWu__Q | Sharp Blades | mb | false",

    // --- CHORBIE SHORTS ---
    "https://www.youtube.com/shorts/-O0zNzj9AXI | Weed-aholic | chorbie | false",
    "https://www.youtube.com/shorts/sJ47yPIEjiY | Fall Pre-emergent | chorbie | false",
    "https://www.youtube.com/shorts/mNNWjPbZXrM | Bundling Services | chorbie | false",
    "https://www.youtube.com/shorts/m-AC2G7_Uck | Biscuit the Cat | chorbie | false",
    "https://www.youtube.com/shorts/amXEHz7p2tY | Here I am again | chorbie | false",
    "https://www.youtube.com/shorts/L_27cH4TQNw | Weedeater Olympics | chorbie | false",
    "https://www.youtube.com/shorts/yE8Eo8g0iNA | Excalibur | chorbie | false",

    // --- CHORBIE EDITS (Shorts) ---
    "https://www.youtube.com/shorts/346KBJvyywM | The Art and Artist | chorbie | true",
    "https://www.youtube.com/shorts/YqkKm1M0Xaw | Winter Mowing Serious | chorbie | true",
    "https://www.youtube.com/shorts/LKejMNVrSeg | Irrigation Zones | chorbie | true",
    "https://www.youtube.com/shorts/0sg7mFYlR3k | Grub Damage | chorbie | true",
    "https://www.youtube.com/shorts/KE1fzCxVoe4 | Weedeat a Fence | chorbie | true",
    "https://www.youtube.com/shorts/2hcPsAgf-R8 | Steel Blade Edger | chorbie | true",
    "https://www.youtube.com/shorts/WB2D9IlJz2I | Spooky Mowing | chorbie | true",
    "https://www.youtube.com/shorts/qtgToukISB4 | 6 Weeks Growth | chorbie | true",
    "https://www.youtube.com/shorts/Ahs5c7Qh3k0 | Edge Trimming | chorbie | true",
    "https://www.youtube.com/shorts/LdaAT5Nr_a4 | Tacoma Max | chorbie | true",
    "https://www.youtube.com/shorts/Bbe0VKTmm3A | Where I started | chorbie | true",
    "https://www.youtube.com/shorts/c3xzHEKAHLw | Slomo Scag | chorbie | true",
    "https://www.youtube.com/shorts/yGoA8_WVi9A | Nonretracting Heads | chorbie | true",

    // --- CHORBIE LONG FORM ---
    // User Manual Overrides applied here:
    "https://www.youtube.com/shorts/hikwcAI8818 | Change Edger Blade | chorbie | false",
    "https://www.youtube.com/watch?v=dJF6gVAbqJ8 | Biweekly Cuts | chorbie | true",
    "https://www.youtube.com/watch?v=3d-444_-pWk | Andres is #1 | chorbie | true",
    "https://www.youtube.com/watch?v=7VqVLQ-dBOg | Time to Start | chorbie | true",
    "https://www.youtube.com/watch?v=0JxcT5HXsBg | Winter Mowing Jose | chorbie | true",
    "https://www.youtube.com/shorts/nk8TyN2OJqE | Truck Bed Tour | chorbie | false",
    "https://www.youtube.com/shorts/f3nHaGhCrx0 | I was Struggling | chorbie | true", 
    "https://www.youtube.com/shorts/P49-AlOgnuM | Spooky Elf | chorbie | true",
    "https://www.youtube.com/shorts/5N3lbFOUR_E | Gate Picture | chorbie | true",
    "https://www.youtube.com/shorts/_DggFHLjmJg | Anole Facts | chorbie | false",
    "https://www.youtube.com/watch?v=woSENBKuzsA | Check Quality | chorbie | false",
    "https://www.youtube.com/shorts/XiZ3Rogg2w4 | Weedeating Montage | chorbie | true",
    "https://www.youtube.com/shorts/XxQO7134Wo4 | Bucees | chorbie | true",

    // --- WEED XTINGUISHERS (All Edits / Long) ---
    "https://www.youtube.com/watch?v=jjf72Vc0YYg | Butterfly House | wx | true",
    "https://www.youtube.com/watch?v=jPOqcv3KdNo | WX News Feb 18 | wx | true",
    "https://www.youtube.com/watch?v=C0oNR_ZZi5k | Ins and Outs | wx | true",
    "https://www.youtube.com/watch?v=vBdJnmrhFB4 | Pest Facts | wx | true",
    "https://www.youtube.com/watch?v=vAY2TEF8zjY | Merry Christmas | wx | true"
];

// --- LOGIC ENGINE ---

document.addEventListener("DOMContentLoaded", () => {
    initGallery();
});

function initGallery() {
    console.log("M.G.I. Smart Video Loader Initialized");
    
    // 1. Process Raw Data
    const videoData = parseRawVideos(RAW_VIDEOS);

    // 2. Get Containers
    const dirLongContainer = document.getElementById('container-directors-long');
    const dirShortsContainer = document.getElementById('container-directors-shorts');
    const mowingContainer = document.getElementById('carousel-mowingbest');
    const chorbieLongContainer = document.getElementById('container-chorbie-long');
    const chorbieShortsContainer = document.getElementById('carousel-chorbie-shorts');
    const wxContainer = document.getElementById('container-wx');

    // 3. Sort and Render
    videoData.forEach(vid => {
        // ... (Your existing sorting logic is fine, keeping it brief for the copy-paste) ...
        // Director's Cut
        if (vid.edit) {
            if (vid.type === "short") renderVideo(vid, dirShortsContainer, false); 
            else renderVideo(vid, dirLongContainer, true);
        }
        // WX
        if (vid.company === "wx") renderVideo(vid, wxContainer, true);
        // Mowing Best
        else if (vid.company === "mb" && !vid.edit) renderVideo(vid, mowingContainer, false); 
        // Chorbie
        else if (vid.company === "chorbie" && !vid.edit) {
            if (vid.type === "short") renderVideo(vid, chorbieShortsContainer, false);
            else renderVideo(vid, chorbieLongContainer, true);
        }
    });

    // 4. ACTIVATE ADVANCED UX (The Ghost Buttons & Wheel Logic)
    setupCarouselUX();
}

function setupCarouselUX() {
    // Find all carousels
    const carousels = document.querySelectorAll('.video-carousel');

    carousels.forEach(carousel => {
        // A. Wrap the carousel in a relative container
        const wrapper = document.createElement('div');
        wrapper.className = 'carousel-wrapper';
        carousel.parentNode.insertBefore(wrapper, carousel);
        wrapper.appendChild(carousel);

        // B. Create Ghost Buttons
        const btnLeft = document.createElement('button');
        btnLeft.className = 'scroll-btn scroll-btn-left hidden'; // Start hidden
        btnLeft.innerHTML = '<i class="fas fa-chevron-left"></i>';

        const btnRight = document.createElement('button');
        btnRight.className = 'scroll-btn scroll-btn-right';
        btnRight.innerHTML = '<i class="fas fa-chevron-right"></i>';

        wrapper.appendChild(btnLeft);
        wrapper.appendChild(btnRight);

        // C. Button Click Logic
        btnLeft.onclick = () => carousel.scrollBy({ left: -300, behavior: 'smooth' });
        btnRight.onclick = () => carousel.scrollBy({ left: 300, behavior: 'smooth' });

        // D. Visibility Logic (Hide buttons at start/end)
        const updateButtons = () => {
            const tolerance = 10; // Pixel buffer
            // At Start?
            if (carousel.scrollLeft <= tolerance) btnLeft.classList.add('hidden');
            else btnLeft.classList.remove('hidden');

            // At End?
            if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - tolerance) {
                btnRight.classList.add('hidden');
            } else {
                btnRight.classList.remove('hidden');
            }
        };

        // Listen for scroll events to update buttons
        carousel.addEventListener('scroll', updateButtons);

        // E. THE MOUSE WHEEL HACK (Vertical -> Horizontal)
        carousel.addEventListener('wheel', (evt) => {
            const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 10;
            const isAtStart = carousel.scrollLeft <= 0;
            
            // If Scrolling DOWN (Positive Y) and NOT at the end -> Go Right
            if (evt.deltaY > 0 && !isAtEnd) {
                evt.preventDefault();
                carousel.scrollLeft += evt.deltaY;
            }
            // If Scrolling UP (Negative Y) and NOT at the start -> Go Left
            else if (evt.deltaY < 0 && !isAtStart) {
                evt.preventDefault();
                carousel.scrollLeft += evt.deltaY;
            }
            // Otherwise, do nothing and let the page scroll vertically
        });
    });
}

function parseRawVideos(rawList) {
    return rawList.map(entry => {
        const parts = entry.split('|').map(s => s.trim());
        const url = parts[0];
        const title = parts[1];
        const company = parts[2];
        const isEdit = parts[3] === "true";

        let id = "";
        let type = "long"; 

        // Extract ID
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        
        if (url.includes("/shorts/")) {
            type = "short";
            id = url.split("/shorts/")[1].split("?")[0];
        } else if (match && match[2].length === 11) {
            id = match[2];
            type = "long";
        } else {
            console.error("Invalid Video Link:", url);
        }

        return { id, title, company, edit: isEdit, type };
    });
}

function renderVideo(vid, container, isGrid) {
    const colDiv = document.createElement('div');
    
    if (isGrid) {
        // Grid: 4 per row (col-lg-3)
        colDiv.className = 'col-12 col-md-6 col-lg-3';
    } else {
        // Carousel Item
        colDiv.className = 'carousel-item-short';
    }

    const ratioClass = vid.type === 'short' ? 'ratio-9x16' : 'ratio-16x9';

    colDiv.innerHTML = `
        <div class="video-card h-100">
            <div class="ratio ${ratioClass} bg-black">
                <iframe src="https://www.youtube.com/embed/${vid.id}?modestbranding=1&rel=0" 
                        title="${vid.title}" 
                        allowfullscreen 
                        loading="lazy">
                </iframe>
            </div>
            <div class="p-2 text-center bg-dark">
                <small class="text-white fw-bold text-truncate d-block" style="font-size: 0.7rem;">${vid.title}</small>
            </div>
        </div>
    `;

    container.appendChild(colDiv);
}