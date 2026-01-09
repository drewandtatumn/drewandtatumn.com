// app/receipt-logic.js
// V2.0 - WITH COMPRESSION & DEBUGGING

const APP_WORKER_URL = "https://mgi-apps-core.drewandtatumn.workers.dev";

// Global State
let currentBase64Image = null;

// 1. HANDLE CAMERA INPUT & COMPRESS
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // DEBUG: Tell user we see the file
    // alert("DEBUG: Camera captured image. Processing..."); 

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // COMPRESSION LOGIC
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Resize to Max 800px width (Keep Aspect Ratio)
            const MAX_WIDTH = 800;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG at 70% Quality
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            // Update UI
            document.getElementById('imagePreview').src = compressedDataUrl;
            
            // Store the "Clean" Base64 (remove data:image/jpeg;base64, prefix)
            currentBase64Image = compressedDataUrl.split(',')[1];

            // Show Confirm Modal
            const modal = new bootstrap.Modal(document.getElementById('previewModal'));
            modal.show();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 2. SEND TO CLOUDFLARE
async function processScan() {
    if (!currentBase64Image) return alert("No image loaded!");

    // UI Updates
    const modalEl = document.getElementById('previewModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    const processingCard = document.getElementById('processing-card');
    processingCard.classList.remove('d-none');
    
    // DEBUG: Tell user we are trying to send
    // alert("DEBUG: Sending to Cloudflare...");

    try {
        const response = await fetch(APP_WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "receipt_scan",
                image: currentBase64Image
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // Success
        addReceiptToFeed(data);

    } catch (error) {
        console.error("Scan Failed:", error);
        alert("Assassin Error: " + error.message);
    } finally {
        processingCard.classList.add('d-none');
        currentBase64Image = null; 
    }
}

// 3. RENDER RESULT
function addReceiptToFeed(receipt) {
    const list = document.getElementById('scan-list');
    
    const newCard = document.createElement('div');
    newCard.className = "card bg-glass mb-2 scan-card fade-in border-success";
    
    let icon = "fa-receipt";
    if(receipt.category && receipt.category.includes("Fuel")) icon = "fa-gas-pump";
    if(receipt.category && receipt.category.includes("Food")) icon = "fa-utensils";
    if(receipt.category && receipt.category.includes("Material")) icon = "fa-tools";

    newCard.innerHTML = `
        <div class="card-body p-2 d-flex justify-content-between align-items-center">
            <div>
                <h6 class="text-white m-0 text-uppercase text-truncate" style="max-width: 150px;">
                    ${receipt.merchant || "Unknown Store"}
                </h6>
                <small class="text-secondary">${receipt.date || "Today"} &bull; ${receipt.summary || "Expense"}</small>
            </div>
            <div class="text-end">
                <div class="text-success fw-bold">$${receipt.total || "0.00"}</div>
                <small class="text-secondary"><i class="fas ${icon}"></i> ${receipt.category || "General"}</small>
            </div>
        </div>
    `;
    
    list.insertBefore(newCard, list.firstChild);
    updateTotal(receipt.total);
}

function updateTotal(amount) {
    const totalEl = document.getElementById('total-spent');
    let currentTotal = parseFloat(totalEl.innerText.replace('$', '')) || 0;
    let newTotal = currentTotal + (parseFloat(amount) || 0);
    totalEl.innerText = "$" + newTotal.toFixed(2);
}