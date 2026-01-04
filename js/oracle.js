// js/oracle.js
// THE ORACLE: Chatbot Interaction Logic

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

    // 1. Show User Message
    chatHistoryDiv.innerHTML += `<div class="user-message"><span class="badge bg-secondary mb-1">You</span><br>${userText}</div>`;
    inputField.value = "";
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    
    // 2. Add to History
    conversationHistory.push({ role: "user", parts: [{ text: userText }] });

    // 3. Show Loading State
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
        
        // Remove Loading Spinner
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            // Format Bold Text
            const formattedText = aiText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
            
            chatHistoryDiv.innerHTML += `<div class="ai-message"><span class="badge bg-info text-dark mb-1">Oracle</span><br>${formattedText}</div>`;
            conversationHistory.push({ role: "model", parts: [{ text: aiText }] });
        }
    } catch (error) {
        console.error(error);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.innerHTML = `<span class="badge bg-danger text-white mb-1">Error</span><br>Connection Failed.`;
    }
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}