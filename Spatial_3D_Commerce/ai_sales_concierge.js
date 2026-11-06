/**
 * ⚡ Nexus3D — AI Sales Concierge & Photorealistic CAD Event Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // Pricing State
    const basePrice = 385000;
    let selectedPaintPrice = 0;
    let selectedWheelsPrice = 0;
    let selectedInteriorPrice = 0;

    let paintName = "Rosso Corsa Red";
    let wheelsName = "Polished Silver";
    let interiorName = "Nappa Black Leather";

    const totalPriceEl = document.getElementById('current-total-price');
    const selectedPaintNameEl = document.getElementById('selected-paint-name');
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');

    function updatePrice() {
        const total = basePrice + selectedPaintPrice + selectedWheelsPrice + selectedInteriorPrice;
        const formatted = "$" + total.toLocaleString();
        totalPriceEl.innerText = formatted;
        document.getElementById('sum-total-price').innerText = formatted;
    }

    // --- Camera View Mode Buttons ---
    const btnExterior = document.getElementById('btn-camera-exterior');
    const btnInterior = document.getElementById('btn-camera-interior');
    const btnFront = document.getElementById('btn-camera-front');
    const btnRear = document.getElementById('btn-camera-rear');

    function setActiveCamBtn(activeBtn) {
        [btnExterior, btnInterior, btnFront, btnRear].forEach(b => {
            if (b) b.classList.remove('active');
        });
        if (activeBtn) activeBtn.classList.add('active');
    }

    if (btnExterior) {
        btnExterior.addEventListener('click', () => {
            setActiveCamBtn(btnExterior);
            if (window.spatialEngine) window.spatialEngine.setCameraViewMode('exterior');
        });
    }

    if (btnInterior) {
        btnInterior.addEventListener('click', () => {
            setActiveCamBtn(btnInterior);
            if (window.spatialEngine) window.spatialEngine.setCameraViewMode('interior');
        });
    }

    if (btnFront) {
        btnFront.addEventListener('click', () => {
            setActiveCamBtn(btnFront);
            if (window.spatialEngine) window.spatialEngine.setCameraViewMode('front');
        });
    }

    if (btnRear) {
        btnRear.addEventListener('click', () => {
            setActiveCamBtn(btnRear);
            if (window.spatialEngine) window.spatialEngine.setCameraViewMode('rear');
        });
    }

    // --- Paint Customizer ---
    const paintBtns = document.querySelectorAll('#paint-selector .color-btn');
    paintBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            paintBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const hex = parseInt(btn.dataset.color, 16);
            const finish = btn.dataset.finish;
            paintName = btn.dataset.name;
            selectedPaintNameEl.innerText = paintName;

            if (window.spatialEngine) {
                window.spatialEngine.setPaintColor(hex, finish);
            }
            updatePrice();
        });
    });

    // --- Wheels Customizer ---
    const wheelCards = document.querySelectorAll('#wheels-selector .option-card');
    wheelCards.forEach(card => {
        card.addEventListener('click', () => {
            wheelCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            selectedWheelsPrice = parseInt(card.dataset.price);
            const rimType = card.dataset.rim;
            wheelsName = card.querySelector('span').innerText;

            if (window.spatialEngine) {
                window.spatialEngine.setWheelPackage(rimType);
            }
            updatePrice();
        });
    });

    // --- Interior Customizer ---
    const interiorCards = document.querySelectorAll('#interior-selector .option-card');
    interiorCards.forEach(card => {
        card.addEventListener('click', () => {
            interiorCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            selectedInteriorPrice = parseInt(card.dataset.price);
            interiorName = card.querySelector('span').innerText;
            updatePrice();
        });
    });

    // --- Hotspot Modal Popup ---
    window.showHotspotModal = function(data) {
        const modal = document.getElementById('hotspot-modal');
        document.getElementById('hotspot-category').innerText = data.category;
        document.getElementById('hotspot-title').innerText = data.title;
        document.getElementById('hotspot-desc').innerText = data.desc;

        const specGrid = document.getElementById('hotspot-specs');
        specGrid.innerHTML = `
            <div class="spec-box"><small>Architecture</small><strong>High-Poly CAD Mesh</strong></div>
            <div class="spec-box"><small>PBR Lighting</small><strong>Studio HDRI Reflections</strong></div>
        `;
        modal.style.display = 'flex';
    };

    document.getElementById('btn-close-modal').addEventListener('click', () => {
        document.getElementById('hotspot-modal').style.display = 'none';
    });

    // --- Checkout Window ---
    const checkoutOverlay = document.getElementById('checkout-overlay');
    document.getElementById('btn-checkout').addEventListener('click', () => {
        document.getElementById('sum-paint-name').innerText = "Paintwork: " + paintName;
        document.getElementById('sum-wheels-name').innerText = "Rims: " + wheelsName;
        document.getElementById('sum-wheels-price').innerText = selectedWheelsPrice > 0 ? "+$" + selectedWheelsPrice.toLocaleString() : "Included";
        document.getElementById('sum-interior-name').innerText = "Interior: " + interiorName;
        document.getElementById('sum-interior-price').innerText = selectedInteriorPrice > 0 ? "+$" + selectedInteriorPrice.toLocaleString() : "Included";

        checkoutOverlay.style.display = 'flex';
    });

    document.getElementById('btn-close-checkout').addEventListener('click', () => {
        checkoutOverlay.style.display = 'none';
    });

    document.getElementById('btn-confirm-order').addEventListener('click', () => {
        alert("🎉 Congratulations! Your order for the photorealistic 3D supercar has been submitted!");
        checkoutOverlay.style.display = 'none';
    });

    // --- Conversational AI Sales Concierge ---
    function addMessage(text, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
        msgDiv.innerText = text;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function generateAIResponse(userText) {
        const query = userText.toLowerCase();
        let reply = "";

        if (query.includes("speed") || query.includes("acceleration") || query.includes("engine") || query.includes("v8")) {
            reply = "🏎️ This vehicle features a 3.9L Twin-Turbo V8 engine generating 710 horsepower, reaching 0-60 mph in 2.9 seconds with a top speed of 211 mph!";
        } else if (query.includes("interior") || query.includes("cockpit") || query.includes("inside")) {
            reply = "🛋️ Click the 'Interior Cockpit' button at the top! The camera will fly inside the driver's seat so you can explore the F1 steering wheel, telemetry displays, and carbon trim in 360°!";
        } else if (query.includes("finance") || query.includes("monthly") || query.includes("payment")) {
            const currentTotal = basePrice + selectedPaintPrice + selectedWheelsPrice + selectedInteriorPrice;
            const estMonthly = Math.round((currentTotal * 0.8) / 60);
            reply = `💳 Based on your total vehicle price of $${currentTotal.toLocaleString()}, with a 20% down payment over 60 months, your estimated monthly payment is $${estMonthly.toLocaleString()}/month.`;
        } else {
            reply = `🤖 Excellent selection! Your configuration with ${paintName} paint and ${wheelsName} rims looks stunning under the studio HDRI reflection lights. Would you like me to schedule a reservation?`;
        }

        setTimeout(() => {
            addMessage(reply, false);
        }, 600);
    }

    function handleChatSubmit() {
        const text = chatInput.value.trim();
        if (text) {
            addMessage(text, true);
            chatInput.value = "";
            generateAIResponse(text);
        }
    }

    document.getElementById('btn-send-chat').addEventListener('click', handleChatSubmit);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSubmit();
    });

    document.querySelectorAll('.prompt-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.dataset.prompt;
            addMessage(prompt, true);
            generateAIResponse(prompt);
        });
    });
});
