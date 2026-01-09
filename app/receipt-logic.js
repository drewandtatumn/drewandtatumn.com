// app/receipt-logic.js
// CORE LOGIC FOR RECEIPT ASSASSIN

const WORKER_URL = "https://mgi-apps-core.drewandtatumn.workers.dev";

// Global State
let currentBase64Image = null; // Stores the raw image data

// 1. HANDLE CAMERA INPUT
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Display Preview
            document.getElementById('imagePreview').src = e.target.result;
            
            // Store Base64 (Stripping the "data:image/jpeg;base64," prefix for the API)
            const rawBase64 = e.target.result.split(',')[1];
            currentBase64Image = rawBase64;
            
            // Show Confirm Modal
            const modal = new bootstrap.Modal(document.getElementById('previewModal'));
            modal.show();
        }
        
        reader.readAsDataURL(file);
    }
}

// 2. SEND TO CLOUDFLARE (The "Assassin" Strike)
async function processScan() {
    if (!currentBase64Image) return alert("No image loaded!");

    // A. UI Updates (Hide Modal, Show Spinner)
    const modalEl = document.getElementById('previewModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    const processingCard = document.getElementById('processing-card');
    processingCard.classList.remove('d-none'); // Show "Analyzing..."
    
    // B. The API Call
    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "receipt_scan",
                image: currentBase64Image
            })
        });

        if (!response.ok) throw new Error(`Server Error: ${response.status}`);

        const data = await response.json();
        
        // C. Success! Render the Receipt
        addReceiptToFeed(data);

    } catch (error) {
        console.error("Scan Failed:", error);
        alert("Assassin Misfired: " + error.message);
    } finally {
        // D. Cleanup (Hide Spinner)
        processingCard.classList.add('d-none');
        currentBase64Image = null; // Reset
    }
}

// 3. RENDER RESULT TO SCREEN
function addReceiptToFeed(receipt) {
    const list = document.getElementById('scan-list');
    
    // Create the Card HTML
    const newCard = document.createElement('div');
    newCard.className = "card bg-glass mb-2 scan-card fade-in border-success";
    
    // Choose Icon based on Category
    let icon = "fa-receipt";
    if(receipt.category === "Fuel") icon = "fa-gas-pump";
    if(receipt.category === "Food") icon = "fa-utensils";
    if(receipt.category === "Materials") icon = "fa-tools";

    newCard.innerHTML = `
        <div class="card-body p-2 d-flex justify-content-between align-items-center">
            <div>
                <h6 class="text-white m-0 text-uppercase">${receipt.merchant || "Unknown Store"}</h6>
                <small class="text-secondary">${receipt.date || "Today"} &bull; ${receipt.summary || "Expense"}</small>
            </div>
            <div class="text-end">
                <div class="text-success fw-bold">$${receipt.total || "0.00"}</div>
                <small class="text-secondary"><i class="fas ${icon}"></i> ${receipt.category || "General"}</small>
            </div>
        </div>
    `;
    
    // Insert at the top of the list
    list.insertBefore(newCard, list.firstChild);
    
    // Update Total (Simple Math for Demo)
    updateTotal(receipt.total);
}

function updateTotal(amount) {
    const totalEl = document.getElementById('total-spent');
    let currentTotal = parseFloat(totalEl.innerText.replace('$', '')) || 0;
    let newTotal = currentTotal + (parseFloat(amount) || 0);
    totalEl.innerText = "$" + newTotal.toFixed(2);
}