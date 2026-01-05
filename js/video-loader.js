// js/video-loader.js
// Handles YouTube API, Sorting, and Auto-Hiding logic

const VIDEO_DB = [
    // --- MOWING BEST (Shorts) ---
    { id: "J2kJ4jLlEzQ", title: "Height of Grass", type: "short", company: "mb" },
    { id: "VRAuv6CJrg0", title: "Acorns Damage", type: "short", company: "mb" },
    { id: "_b0oLr8JfLo", title: "Insulate Shrubs", type: "short", company: "mb" },
    { id: "B5DtVrBl2ac", title: "Winter Prep", type: "short", company: "mb" },
    { id: "ViaRekkeW8g", title: "Winter Cut Height", type: "short", company: "mb" },
    { id: "pM663bP6Tq4", title: "Guilty as Charged", type: "short", company: "mb" },
    { id: "BCjeTEtKjKI", title: "Stop Mowing?", type: "short", company: "mb" },
    { id: "JKQMtOFXsfo", title: "Here I am", type: "short", company: "mb" },
    { id: "DV_ncaM0ZG8", title: "Being Chased", type: "short", company: "mb" },
    { id: "TXurptOweXM", title: "Winter Lookout", type: "short", company: "mb" },
    { id: "S_UKk1tkkbc", title: "Trust Fall", type: "short", company: "mb" },
    { id: "q329SYcpT44", title: "How much to mow?", type: "short", company: "mb" },
    { id: "yYPAfbejEho", title: "3 Fall Tips", type: "short", company: "mb" },
    { id: "6kdeifgIF00", title: "Types of Mulching", type: "short", company: "mb" },
    { id: "Lbqao5oVyrE", title: "Break it down", type: "short", company: "mb" },
    { id: "oQ7jtIBWT0k", title: "Avoid this in Winter", type: "short", company: "mb" },
    { id: "Ww3AVcrLFdA", title: "BAM!", type: "short", company: "mb" },
    { id: "B9JmhE0qMMU", title: "Whats Included", type: "short", company: "mb" },
    { id: "OEb7MsWu__Q", title: "Sharp Blades", type: "short", company: "mb" },

    // --- CHORBIE ---
    { id: "-O0zNzj9AXI", title: "Weed-aholic", type: "short", company: "chorbie" },
    { id: "sJ47yPIEjiY", title: "Fall Pre-emergent", type: "short", company: "chorbie" },
    { id: "mNNWjPbZXrM", title: "Bundling Services", type: "short", company: "chorbie" },
    { id: "m-AC2G7_Uck", title: "Biscuit the Cat", type: "short", company: "chorbie" },
    { id: "amXEHz7p2tY", title: "Here I am again", type: "short", company: "chorbie" },
    { id: "L_27cH4TQNw", title: "Weedeater Olympics", type: "short", company: "chorbie" },
    { id: "yE8Eo8g0iNA", title: "Excalibur", type: "short", company: "chorbie" },
    // Drew's Edits (Chorbie Shorts)
    { id: "346KBJvyywM", title: "The Art and Artist", type: "short", company: "chorbie", edit: true },
    { id: "YqkKm1M0Xaw", title: "Winter Mowing Serious", type: "short", company: "chorbie", edit: true },
    { id: "LKejMNVrSeg", title: "Irrigation Zones", type: "short", company: "chorbie", edit: true },
    { id: "0sg7mFYlR3k", title: "Grub Damage", type: "short", company: "chorbie", edit: true },
    { id: "KE1fzCxVoe4", title: "Weedeat a Fence", type: "short", company: "chorbie", edit: true },
    { id: "2hcPsAgf-R8", title: "Steel Blade Edger", type: "short", company: "chorbie", edit: true },
    { id: "WB2D9IlJz2I", title: "Spooky Mowing", type: "short", company: "chorbie", edit: true },
    { id: "qtgToukISB4", title: "6 Weeks Growth", type: "short", company: "chorbie", edit: true },
    { id: "Ahs5c7Qh3k0", title: "Edge Trimming", type: "short", company: "chorbie", edit: true },
    { id: "LdaAT5Nr_a4", title: "Tacoma Max", type: "short", company: "chorbie", edit: true },
    { id: "Bbe0VKTmm3A", title: "Where I started", type: "short", company: "chorbie", edit: true },
    { id: "c3xzHEKAHLw", title: "Slomo Scag", type: "short", company: "chorbie", edit: true },
    { id: "yGoA8_WVi9A", title: "Nonretracting Heads", type: "short", company: "chorbie", edit: true },
    // Drew's Edits (Chorbie Long)
    { id: "hikwcAI8818", title: "Change Edger Blade", type: "long", company: "chorbie", edit: false }, 
    { id: "dJF6gVAbqJ8", title: "Biweekly Cuts", type: "long", company: "chorbie", edit: true },
    { id: "3d-444_-pWk", title: "Andres is #1", type: "long", company: "chorbie", edit: true },
    { id: "7VqVLQ-dBOg", title: "Time to Start", type: "long", company: "chorbie", edit: true },
    { id: "0JxcT5HXsBg", title: "Winter Mowing Jose", type: "long", company: "chorbie", edit: true },
    { id: "nk8TyN2OJqE", title: "Truck Bed Tour", type: "long", company: "chorbie", edit: false },
    { id: "f3nHaGhCrx0", title: "I was Struggling", type: "long", company: "chorbie", edit: true },
    { id: "P49-AlOgnuM", title: "Spooky Elf", type: "long", company: "chorbie", edit: true },
    { id: "5N3lbFOUR_E", title: "Gate Picture", type: "long", company: "chorbie", edit: true },
    { id: "_DggFHLjmJg", title: "Anole Facts", type: "long", company: "chorbie", edit: false },
    { id: "woSENBKuzsA", title: "Check Quality", type: "long", company: "chorbie", edit: false },
    { id: "XiZ3Rogg2w4", title: "Weedeating Montage", type: "long", company: "chorbie", edit: true },
    { id: "XxQO7134Wo4", title: "Bucees", type: "long", company: "chorbie", edit: true },

    // --- WEED XTINGUISHERS (All Edits) ---
    { id: "jjf72Vc0YYg", title: "Butterfly House", type: "long", company: "wx", edit: true },
    { id: "jPOqcv3KdNo", title: "WX News Feb 18", type: "long", company: "wx", edit: true },
    { id: "C0oNR_ZZi5k", title: "Ins and Outs", type: "long", company: "wx", edit: true },
    { id: "vBdJnmrhFB4", title: "Pest Facts", type: "long", company: "wx", edit: true },
    { id: "vAY2TEF8zjY", title: "Merry Christmas", type: "long", company: "wx", edit: true },
];

document.addEventListener("DOMContentLoaded", () => {
    initGallery();
});

function initGallery() {
    const directorsContainer = document.getElementById('container-directors-cut');
    const mowingContainer = document.getElementById('carousel-mowingbest');
    const chorbieLongContainer = document.getElementById('container-chorbie-long');
    const chorbieShortsContainer = document.getElementById('carousel-chorbie-shorts');
    const wxContainer = document.getElementById('container-wx');

    VIDEO_DB.forEach(vid => {
        // LOGIC: Director's Cut
        // If it's an EDIT, it goes to Director's Cut
        if (vid.edit) {
            renderVideo(vid, directorsContainer, true); // true = allow grid format for DC
        }

        // LOGIC: Company Sorting
        // 1. Weed Xtinguishers (Duplicates: Goes to DC AND Legacy)
        if (vid.company === "wx") {
            renderVideo(vid, wxContainer, true);
        }
        // 2. Mowing Best (Moves: If Edit, ONLY DC. Else, MB Carousel)
        else if (vid.company === "mb" && !vid.edit) {
            renderVideo(vid, mowingContainer, false); // false = carousel item
        }
        // 3. Chorbie (Moves: If Edit, ONLY DC. Else, Chorbie section)
        else if (vid.company === "chorbie" && !vid.edit) {
            if (vid.type === "short") {
                renderVideo(vid, chorbieShortsContainer, false);
            } else {
                renderVideo(vid, chorbieLongContainer, true);
            }
        }
    });
}

function renderVideo(vid, container, isGrid) {
    const colDiv = document.createElement('div');
    
    // Determining CSS Classes based on container type
    if (isGrid) {
        // Grid Item: Made smaller!
        // Long form: col-lg-3 (4 per row) instead of col-lg-4 (3 per row)
        // Shorts: col-lg-2 (6 per row)
        const sizeClass = vid.type === 'short' ? 'col-6 col-md-3 col-lg-2' : 'col-12 col-md-6 col-lg-3';
        colDiv.className = sizeClass;
    } else {
        // Carousel Item
        colDiv.className = 'carousel-item-short';
    }

    // Aspect Ratio Logic
    const ratioClass = vid.type === 'short' ? 'ratio-9x16' : 'ratio-16x9';

    colDiv.innerHTML = `
        <div class="video-card">
            <div class="ratio ${ratioClass} bg-black">
                <iframe src="https://www.youtube.com/embed/${vid.id}?modestbranding=1&rel=0" 
                        title="${vid.title}" 
                        allowfullscreen 
                        loading="lazy"
                        onerror="this.closest('.video-card').style.display='none'">
                </iframe>
            </div>
            <div class="p-2 text-center bg-dark">
                <small class="text-white fw-bold text-truncate d-block" style="font-size: 0.7rem;">${vid.title}</small>
            </div>
        </div>
    `;

    container.appendChild(colDiv);
}

    container.appendChild(colDiv);
}