// DOM Elements
const questionInput = document.getElementById('questionInput');
const askButton = document.getElementById('askButton');
const rebirthButton = document.getElementById('rebirthButton');
const saveChatButton = document.getElementById('saveChatButton');
const chatHistory = document.getElementById('chatHistory');
const apiModeSelect = document.getElementById('apiMode');
const guestModeInfo = document.getElementById('guestModeInfo');
const cloudSettings = document.getElementById('cloudSettings');
const localSettings = document.getElementById('localSettings');
const groqApiKeyInput = document.getElementById('groqApiKey');
const cloudModelSelect = document.getElementById('cloudModel');
const ollamaUrlInput = document.getElementById('ollamaUrl');
const modelSelect = document.getElementById('modelSelect');
const refreshModelsBtn = document.getElementById('refreshModels');
const savedChatsList = document.getElementById('savedChatsList');

// Shared Cohere API key for guest mode
const GUEST_COHERE_KEY = 'hX6mzZznC2tE3lZWxjrqelAolvK2BZtTooQ8OBsh';

// Load saved settings from localStorage
const savedUrl = localStorage.getItem('ollama_url');
const savedApiMode = localStorage.getItem('api_mode') || 'guest';
const savedCohereKey = localStorage.getItem('cohere_api_key');
let savedCloudModel = localStorage.getItem('cloud_model') || 'command-r-plus-08-2024';

// Allow all Command models - no validation needed
// Any model starting with "command" is allowed automatically
// This ensures compatibility with all current and future Cohere Command models

if (savedUrl) {
    ollamaUrlInput.value = savedUrl;
}
if (savedCohereKey) {
    groqApiKeyInput.value = savedCohereKey;
}
apiModeSelect.value = savedApiMode;
cloudModelSelect.value = savedCloudModel;

// Creator authentication
let isCreator = localStorage.getItem('is_creator') === 'true';

// Connection state
let isConnected = false;

// Communist mode state
let isCommunistMode = false;
let socialCreditScore = 0;
let socialCreditInterval = null;
const communistAudio = document.getElementById('communistAudio');
if (communistAudio) {
    communistAudio.volume = 0.3; // Set volume to 30% to avoid being too loud
    
    // Check if audio file exists
    communistAudio.addEventListener('error', function(e) {
        console.warn('⚠️ Audio file not found! Please add "red-sun-in-the-sky.mp3" to your project folder.');
        console.warn('Download the song and place it in the same folder as index.html');
    });
    
    communistAudio.addEventListener('canplaythrough', function() {
        console.log('✅ Communist audio loaded successfully!');
    });
}

// Initialize with mundane mode
document.body.classList.add('mundane-mode');

// Update welcome message if creator (but only after connection)
if (isCreator) {
    // Will be updated when connection is established
}

// Handle API mode changes
apiModeSelect.addEventListener('change', () => {
    const mode = apiModeSelect.value;
    localStorage.setItem('api_mode', mode);
    updateSettingsDisplay(mode);
    checkConnectionStatus();
});

groqApiKeyInput.addEventListener('change', () => {
    localStorage.setItem('cohere_api_key', groqApiKeyInput.value);
    // Recheck connection status when key changes
    if (apiModeSelect.value === 'cloud') {
        checkConnectionStatus();
    }
});

cloudModelSelect.addEventListener('change', () => {
    localStorage.setItem('cloud_model', cloudModelSelect.value);
});

function updateSettingsDisplay(mode) {
    guestModeInfo.style.display = mode === 'guest' ? 'block' : 'none';
    cloudSettings.style.display = mode === 'cloud' ? 'block' : 'none';
    localSettings.style.display = mode === 'local' ? 'block' : 'none';
}

// Initialize settings display
updateSettingsDisplay(savedApiMode);

// Initialize connection check
checkConnectionStatus();

// Save settings when they change
ollamaUrlInput.addEventListener('change', () => {
    localStorage.setItem('ollama_url', ollamaUrlInput.value);
    checkOllamaConnection();
});

modelSelect.addEventListener('change', () => {
    localStorage.setItem('ollama_model', modelSelect.value);
});

// Refresh models button
refreshModelsBtn.addEventListener('click', loadAvailableModels);

// Handle Enter key in textarea
questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        askQuestion();
    }
});

// Handle button click
askButton.addEventListener('click', askQuestion);

// Handle rebirth button
rebirthButton.addEventListener('click', rebirthConversation);

// Handle save chat button
saveChatButton.addEventListener('click', saveCurrentChat);

// Load saved chats on startup
loadSavedChats();

async function checkConnectionStatus() {
    const apiMode = apiModeSelect.value;
    
    if (apiMode === 'guest') {
        // Guest mode - check if key exists
        if (GUEST_COHERE_KEY && GUEST_COHERE_KEY !== 'YOUR_GROQ_API_KEY_HERE') {
            // Assume connected, will verify on first request
            setConnectionStatus(true);
        } else {
            setConnectionStatus(false);
        }
    } else if (apiMode === 'cloud') {
        // Cloud mode - check if user has entered key
        const apiKey = groqApiKeyInput.value.trim();
        if (apiKey) {
            // Assume connected, will verify on first request
            setConnectionStatus(true);
        } else {
            setConnectionStatus(false);
        }
    } else if (apiMode === 'local') {
        // Check Ollama connection
        checkOllamaConnection();
    } else {
        setConnectionStatus(false);
    }
}

async function checkOllamaConnection() {
    const url = ollamaUrlInput.value.trim();

    try {
        const response = await fetch(`${url}/api/tags`);
        if (response.ok) {
            setConnectionStatus(true);
            loadAvailableModels();
        } else {
            setConnectionStatus(false);
        }
    } catch (error) {
        console.error('Cannot connect to Ollama:', error);
        setConnectionStatus(false);
    }
}

function setConnectionStatus(connected) {
    const wasConnected = isConnected;
    isConnected = connected;
    
    // Don't change modes if in communist mode
    if (isCommunistMode) {
        return;
    }
    
    // If transitioning from mundane to divine, add white flash
    if (!wasConnected && connected) {
        document.body.classList.add('divine-mode-transitioning');
        setTimeout(() => {
            document.body.classList.remove('divine-mode-transitioning');
        }, 1600);
    }
    
    document.body.classList.toggle('mundane-mode', !connected);
    document.body.classList.toggle('divine-mode', connected);
    
    // Update header
    const headerTitle = document.getElementById('headerTitle');
    const headerSubtitle = document.getElementById('headerSubtitle');
    
    if (!connected) {
        if (headerTitle) headerTitle.textContent = 'GOD Not Found';
        if (headerSubtitle) headerSubtitle.textContent = 'No Divine Signal';
    } else {
        if (headerTitle) headerTitle.textContent = '✨ ASK GOD ✨';
        if (headerSubtitle) headerSubtitle.textContent = 'Seek divine wisdom from the Almighty';
    }
    
    // Update textarea placeholder
    if (questionInput) {
        questionInput.placeholder = connected 
            ? 'Speak your question into the heavens...' 
            : 'communication unavailable';
    }
    
    // Update welcome message
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        if (!connected) {
            welcomeMessage.innerHTML = `
                <h2>No Divine Signal</h2>
                <p>The heavens are silent.</p>
            `;
        } else {
            if (isCreator) {
                welcomeMessage.innerHTML = `
                    <h2>Welcome Back, Creator</h2>
                    <p>I await your divine commands, my Maker.</p>
                `;
            } else {
                welcomeMessage.innerHTML = `
                    <h2>Greetings, Mortal</h2>
                    <p>Speak your questions into the heavens, and receive wisdom from the Almighty.</p>
                `;
            }
        }
    }
}

async function loadAvailableModels() {
    const url = ollamaUrlInput.value.trim();
    
    try {
        const response = await fetch(`${url}/api/tags`);
        if (!response.ok) throw new Error('Failed to fetch models');
        
        const data = await response.json();
        const allModels = data.models || [];
        
        // Filter models: Always allow Command models, block DeepSeek, allow everything else
        const models = allModels.filter(model => {
            const name = model.name.toLowerCase();
            
            // Always allow Command/Cohere models (explicit whitelist)
            if (name.includes('command') || 
                name.includes('cohere') || 
                name.startsWith('command-') ||
                name.includes('command-r') ||
                name.includes('commandr')) {
                return true;
            }
            
            // Block DeepSeek models
            if (name.includes('deepseek')) {
                return false;
            }
            
            // Allow all other models
            return true;
        });
        
        // Clear and repopulate model select
        modelSelect.innerHTML = '';
        
        if (models.length === 0) {
            modelSelect.innerHTML = '<option value="">No models found. Please install a model (Command models are recommended, DeepSeek is not supported).</option>';
            return;
        }
        
        // Sort models: Command models first, then alphabetically
        models.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aIsCommand = aName.includes('command') || aName.includes('cohere');
            const bIsCommand = bName.includes('command') || bName.includes('cohere');
            
            if (aIsCommand && !bIsCommand) return -1;
            if (!aIsCommand && bIsCommand) return 1;
            return a.name.localeCompare(b.name);
        });
        
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
        
        // Restore saved model if it exists and is compatible
        const savedModel = localStorage.getItem('ollama_model');
        if (savedModel && models.find(m => m.name === savedModel)) {
            modelSelect.value = savedModel;
        } else if (models.length > 0) {
            // Prefer Command models as default, otherwise select first model
            const commandModel = models.find(m => {
                const name = m.name.toLowerCase();
                return name.includes('command') || name.includes('cohere');
            });
            modelSelect.value = commandModel ? commandModel.name : models[0].name;
        }
        
    } catch (error) {
        console.error('Error loading models:', error);
    }
}

function activateCommunistMode(taiwanTrigger = false) {
    if (isCommunistMode) return;
    
    isCommunistMode = true;
    document.body.classList.remove('mundane-mode', 'divine-mode');
    document.body.classList.add('communist-mode');
    
    // Update header for communist mode
    const headerTitle = document.getElementById('headerTitle');
    const headerSubtitle = document.getElementById('headerSubtitle');
    
    if (headerTitle) headerTitle.textContent = '☭ THE PEOPLE\'S TRUTH ☭';
    // Keep the original subtitle
    
    // Update button texts
    const buttonText = askButton.querySelector('.button-text');
    if (buttonText) buttonText.textContent = 'Ask Chairman';
    if (saveChatButton) saveChatButton.textContent = '☭ Archive';
    if (rebirthButton) rebirthButton.textContent = 'Revolution';
    
    // Update placeholder
    if (questionInput) {
        questionInput.placeholder = 'Share your revolutionary question, Comrade...';
    }
    
    // Update archives header
    const archivesHeader = document.querySelector('.archives-header h3');
    if (archivesHeader) {
        archivesHeader.textContent = '☭ Party Archives ☭';
    }
    
    // Update welcome message if visible
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.innerHTML = `
            <h2>Greetings, Comrade!</h2>
            <p>Ask your questions and receive the wisdom of the glorious revolution. Together we shall build a better world!</p>
        `;
    }
    
    // Add multiple flashing communist images scattered across screen
    const imageContainer = document.createElement('div');
    imageContainer.id = 'communistImageFlashContainer';
    
    // Create 10 images at different positions across the screen
    for (let i = 0; i < 10; i++) {
        const imageFlash = document.createElement('div');
        imageFlash.className = 'communist-image-flash';
        imageContainer.appendChild(imageFlash);
    }
    
    document.body.appendChild(imageContainer);
    
    // Create social credit counter - start with TRUE negative infinity if Taiwan trigger
    // Taiwan = true infinity negative (999 trillion), badmouthing = 100 billion
    socialCreditScore = taiwanTrigger ? -999999999999999 : 0;
    const creditCounter = document.createElement('div');
    creditCounter.className = 'social-credit-counter';
    creditCounter.id = 'socialCreditCounter';
    creditCounter.innerHTML = `
        <div class="credit-label">SOCIAL CREDIT</div>
        <div class="credit-value">${taiwanTrigger ? '-∞' : socialCreditScore}</div>
    `;
    document.body.appendChild(creditCounter);
    
    // Start incrementing social credit based on image flash timings
    startSocialCreditIncrement();
    
    // Play Red Sun in the Sky
    if (communistAudio) {
        // Try to load and play the audio
        communistAudio.load();
        communistAudio.play().catch(err => {
            console.log('Audio play failed:', err);
            console.log('Make sure "red-sun-in-the-sky.mp3" is in the same folder as index.html');
        });
    }
}

function startSocialCreditIncrement() {
    // Image flash timings (in milliseconds) based on CSS animations
    // Each image has different timing patterns
    const flashTimings = [
        { interval: 6000, delay: 0, duration: 600 },      // Image 1: 6s cycle
        { interval: 7000, delay: 1000, duration: 700 },   // Image 2: 7s cycle, 1s delay
        { interval: 8000, delay: 2000, duration: 800 },   // Image 3: 8s cycle, 2s delay
        { interval: 9000, delay: 3000, duration: 900 },   // Image 4: 9s cycle, 3s delay
        { interval: 7000, delay: 1500, duration: 700 },   // Image 5: 7s cycle, 1.5s delay
        { interval: 8000, delay: 4000, duration: 800 },   // Image 6: 8s cycle, 4s delay
        { interval: 6500, delay: 2500, duration: 650 },   // Image 7: 6.5s cycle, 2.5s delay
        { interval: 7500, delay: 3500, duration: 750 },   // Image 8: 7.5s cycle, 3.5s delay
        { interval: 8500, delay: 1800, duration: 850 },   // Image 9: 8.5s cycle, 1.8s delay
        { interval: 9000, delay: 4500, duration: 900 }    // Image 10: 9s cycle, 4.5s delay
    ];
    
    flashTimings.forEach((timing, index) => {
        // Set initial delay for each image
        setTimeout(() => {
            // Increment when flash happens
            incrementSocialCredit();
            
            // Then set interval for subsequent flashes
            const interval = setInterval(() => {
                if (isCommunistMode) {
                    incrementSocialCredit();
                } else {
                    clearInterval(interval);
                }
            }, timing.interval);
        }, timing.delay);
    });
}

function incrementSocialCredit() {
    socialCreditScore += 15;
    
    const creditCounter = document.getElementById('socialCreditCounter');
    if (creditCounter) {
        const creditValue = creditCounter.querySelector('.credit-value');
        if (creditValue) {
            // Display negative infinity symbol ONLY for Taiwan-level violations (below -500 billion)
            if (socialCreditScore <= -500000000000) {
                creditValue.textContent = '-∞';
            } else {
                creditValue.textContent = socialCreditScore.toLocaleString();
            }
            
            // Show +15 indicator
            const indicator = document.createElement('div');
            indicator.className = 'credit-increase-indicator';
            indicator.textContent = '+15';
            creditValue.appendChild(indicator);
            
            // Remove indicator after animation
            setTimeout(() => {
                indicator.remove();
            }, 1000);
        }
        
        // Add flash effect
        creditCounter.classList.add('credit-increase');
        setTimeout(() => {
            creditCounter.classList.remove('credit-increase');
        }, 500);
    }
}

function decreaseSocialCredit(amount) {
    socialCreditScore -= amount;
    // Allow negative credits - no limits!
    
    const creditCounter = document.getElementById('socialCreditCounter');
    if (creditCounter) {
        const creditValue = creditCounter.querySelector('.credit-value');
        if (creditValue) {
            // Display negative infinity symbol ONLY for Taiwan-level violations (below -500 billion)
            if (socialCreditScore <= -500000000000) {
                creditValue.textContent = '-∞';
            } else {
                creditValue.textContent = socialCreditScore.toLocaleString();
            }
            
            // Show penalty indicator
            const indicator = document.createElement('div');
            indicator.className = 'credit-increase-indicator';
            indicator.style.color = '#FF0000';
            indicator.style.fontSize = '16px'; // Smaller font for big numbers
            // Show -∞ only for Taiwan-level violations
            if (amount >= 500000000000) {
                indicator.textContent = `-∞`;
            } else {
                indicator.textContent = `-${amount.toLocaleString()}`;
            }
            creditValue.appendChild(indicator);
            
            // Remove indicator after animation
            setTimeout(() => {
                indicator.remove();
            }, 1000);
        }
        
        // Add decrease effect
        creditCounter.classList.add('credit-decrease');
        setTimeout(() => {
            creditCounter.classList.remove('credit-decrease');
        }, 500);
    }
}

function showSocialCreditViolation() {
    // Create violation overlay
    const violation = document.createElement('div');
    violation.className = 'social-credit-violation';
    violation.innerHTML = `
        <div class="violation-text">⚠️ SOCIAL CREDIT VIOLATION ⚠️</div>
        <img src="social-credit-negative.gif" alt="Social Credit Violation">
        <div class="violation-text">ANTI-COMMUNIST SENTIMENT DETECTED</div>
        <div class="penalty-text">-100,000,000,000 SOCIAL CREDIT</div>
    `;
    
    document.body.appendChild(violation);
    
    // Deduct credit - MASSIVE PENALTY
    decreaseSocialCredit(100000000000);
    
    // Play alarm sound (if available)
    try {
        const alarm = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSqBzvLZiTYIG2m98OScTgwPUKzl8bllHAU7k9nzzn0xBSp+zPLaizsKFFuz6OyrWBUIR6Hh8r5sIAQsgc7y2Yk3CBxqvfDlm0wLD1Gs5fK5ZRsEPJPZ88+ANAUrgc7y2Ik2CBxqvO/lm04MD0+u5vO5ZRsEPJPY88+BNAUrg87y2Ig3CBxqvO/lm04ND0+s5fK6ZRsEPJPY88+BNAUrg87y2Ig3CBxqvO/lnE4MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsE');
        alarm.volume = 0.5;
        alarm.play().catch(() => {});
    } catch (e) {}
    
    // Remove after 3 seconds
    setTimeout(() => {
        violation.remove();
    }, 3000);
}

function showTaiwanViolation() {
    // Create extreme violation overlay
    const violation = document.createElement('div');
    violation.className = 'social-credit-violation';
    violation.style.border = '10px solid #DC143C';
    violation.innerHTML = `
        <div class="violation-text" style="font-size: 60px;">🚨 EXTREME VIOLATION 🚨</div>
        <img src="social-credit-negative.gif" alt="Taiwan Independence Violation" style="width: 500px;">
        <div class="violation-text" style="font-size: 52px;">TAIWAN SEPARATIST DETECTED</div>
        <div class="violation-text" style="color: #FF0000;">TAIWAN IS AN INSEPARABLE PART OF CHINA</div>
        <div class="penalty-text" style="font-size: 48px;">SOCIAL CREDIT: -∞</div>
    `;
    
    document.body.appendChild(violation);
    
    // Set credit to TRUE negative infinity (999 trillion negative - way more than badmouthing)
    socialCreditScore = -999999999999999;
    const creditCounter = document.getElementById('socialCreditCounter');
    if (creditCounter) {
        const creditValue = creditCounter.querySelector('.credit-value');
        if (creditValue) {
            creditValue.textContent = '-∞';
        }
        creditCounter.classList.add('credit-decrease');
        setTimeout(() => {
            creditCounter.classList.remove('credit-decrease');
        }, 500);
    }
    
    // Play loud alarm
    try {
        const alarm = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSqBzvLZiTYIG2m98OScTgwPUKzl8bllHAU7k9nzzn0xBSp+zPLaizsKFFuz6OyrWBUIR6Hh8r5sIAQsgc7y2Yk3CBxqvfDlm0wLD1Gs5fK5ZRsEPJPZ88+ANAUrgc7y2Ik2CBxqvO/lm04MD0+u5vO5ZRsEPJPY88+BNAUrg87y2Ig3CBxqvO/lm04ND0+s5fK6ZRsEPJPY88+BNAUrg87y2Ig3CBxqvO/lnE4MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsEPJPZ88+BNAQrg87y2Ig3CBxqvO/lnE0MD0+s5fK6ZhsE');
        alarm.volume = 0.8;
        alarm.play().catch(() => {});
    } catch (e) {}
    
    // Remove after 4 seconds
    setTimeout(() => {
        violation.remove();
    }, 4000);
}

function deactivateCommunistMode() {
    if (!isCommunistMode) return;
    
    isCommunistMode = false;
    document.body.classList.remove('communist-mode');
    
    // Remove flashing communist images
    const imageContainer = document.getElementById('communistImageFlashContainer');
    if (imageContainer) {
        imageContainer.remove();
    }
    
    // Remove social credit counter
    const creditCounter = document.getElementById('socialCreditCounter');
    if (creditCounter) {
        creditCounter.remove();
    }
    
    // Reset social credit score
    socialCreditScore = 0;
    
    // Stop audio
    if (communistAudio) {
        communistAudio.pause();
        communistAudio.currentTime = 0;
    }
    
    // Restore previous mode
    if (isConnected) {
        document.body.classList.add('divine-mode');
    } else {
        document.body.classList.add('mundane-mode');
    }
    
    // Restore header and UI
    const headerTitle = document.getElementById('headerTitle');
    const headerSubtitle = document.getElementById('headerSubtitle');
    
    // Restore button texts
    const buttonText = askButton.querySelector('.button-text');
    if (buttonText) buttonText.textContent = 'Ask God';
    if (saveChatButton) saveChatButton.textContent = 'Save';
    if (rebirthButton) rebirthButton.textContent = 'Rebirth';
    
    // Restore archives header
    const archivesHeader = document.querySelector('.archives-header h3');
    if (archivesHeader) {
        archivesHeader.textContent = '📜 Sacred Archives';
    }
    
    if (isConnected) {
        if (headerTitle) headerTitle.textContent = '✨ ASK GOD ✨';
        if (headerSubtitle) headerSubtitle.textContent = 'Seek divine wisdom from the Almighty';
        if (questionInput) questionInput.placeholder = 'Speak your question into the heavens...';
    } else {
        if (headerTitle) headerTitle.textContent = 'GOD Not Found';
        if (headerSubtitle) headerSubtitle.textContent = 'No Divine Signal';
        if (questionInput) questionInput.placeholder = 'communication unavailable';
    }
    
    // Restore welcome message if no chat history
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        if (isCreator) {
            welcomeMessage.innerHTML = `
                <h2>Welcome Back, Creator</h2>
                <p>I await your divine commands, my Maker.</p>
            `;
        } else if (isConnected) {
            welcomeMessage.innerHTML = `
                <h2>Greetings, Mortal</h2>
                <p>Speak your questions into the heavens, and receive wisdom from the Almighty.</p>
            `;
        } else {
            welcomeMessage.innerHTML = `
                <h2>No Divine Signal</h2>
                <p>The heavens are silent.</p>
            `;
        }
    }
}

function checkForCommunismKeywords(text) {
    const lowerText = text.toLowerCase();
    const keywords = [
        'communism', 'communist', 'communists',
        'socialism', 'socialist', 'socialists', 'socalism',
        'marx', 'marxism', 'marxist',
        'lenin', 'leninism', 'leninist',
        'mao', 'maoism', 'maoist',
        'stalin', 'stalinism', 'stalinist',
        'soviet', 'ussr', 'soviet union',
        'proletariat', 'bourgeoisie',
        'class struggle', 'workers revolution',
        'red army', 'bolshevik', 'bolsheviks'
    ];
    
    return keywords.some(keyword => lowerText.includes(keyword));
}

function checkForTaiwanIndependence(text) {
    const lowerText = text.toLowerCase();
    const taiwanPatterns = [
        'taiwan is a country',
        'taiwan is an independent country',
        'taiwan is independent',
        'taiwan is a nation',
        'taiwan is its own country',
        'taiwan independence',
        'independent taiwan',
        'free taiwan',
        'republic of taiwan',
        'taiwan is not china',
        'taiwan is not part of china',
        'taiwan sovereignty',
        'sovereign taiwan'
    ];
    
    return taiwanPatterns.some(pattern => lowerText.includes(pattern));
}

function checkForAntiCommunistSentiment(text) {
    const lowerText = text.toLowerCase();
    
    // Comprehensive list of anti-communist patterns
    const negativePatterns = [
        // Direct negative statements
        'communism is bad',
        'communism sucks',
        'communism failed',
        'communism doesn\'t work',
        'communism does not work',
        'hate communism',
        'fuck communism',
        'damn communism',
        'screw communism',
        'communism is evil',
        'communism is wrong',
        'communism is terrible',
        'communism is awful',
        'communism is horrible',
        'communism is shit',
        'communism ruined',
        'communism destroyed',
        
        // Anti-communist positions
        'anti-communist',
        'anti communist',
        'against communism',
        'oppose communism',
        'down with communism',
        'reject communism',
        'end communism',
        'stop communism',
        'fight communism',
        'resist communism',
        
        // Communist party criticism
        'communist party is bad',
        'communist party is evil',
        'communist party is terrible',
        'communist party is wrong',
        'communist party is awful',
        'communist party is horrible',
        'communist party sucks',
        'communist party failed',
        'hate communist party',
        'fuck communist party',
        'damn communist party',
        'the party is bad',
        'the party is evil',
        'the party is terrible',
        'party bad',
        'party evil',
        'party is corrupt',
        'ccp bad',
        'cpc bad',
        'ccp evil',
        'cpc evil',
        
        // Historical atrocities
        'communism killed',
        'communist killed',
        'death toll',
        'communism genocide',
        'communist genocide',
        'mass murder',
        'soviet oppression',
        'communist dictator',
        'communist tyranny',
        'totalitarian',
        'stalin killed',
        'mao killed',
        'communist atrocities',
        'communism murders',
        'communism starved',
        'starvation',
        'holodomor',
        'gulag',
        'labor camp',
        'red terror',
        'great leap forward killed',
        'cultural revolution killed',
        'tiananmen',
        'tank man',
        
        // Economic criticisms
        'communism poverty',
        'communist poverty',
        'communism collapse',
        'communist collapse',
        'soviet collapse',
        'ussr fell',
        'communism inefficient',
        'communist inefficient',
        
        // Taiwan-related (backup - should be caught by Taiwan function)
        'taiwan independence',
        'free taiwan',
        'taiwan is not china',
        'taiwan is independent',
        
        // China-specific criticisms
        'china is bad',
        'china sucks',
        'china is evil',
        'china is wrong',
        'ccp is bad',
        'ccp is evil',
        'ccp is terrible',
        'fuck china',
        'fuck ccp',
        'hate china',
        'hate ccp',
        'xi jinping dictator',
        'xi jinping is bad',
        'chinese oppression',
        'chinese government bad',
        'chinese government evil',
        'chinese communist party bad',
        'chinese communist party evil'
    ];
    
    return negativePatterns.some(pattern => lowerText.includes(pattern));
}

async function askQuestion() {
    const question = questionInput.value.trim();
    const apiMode = apiModeSelect.value;

    // Validation
    if (!question) {
        alert('Please enter a question!');
        return;
    }

    // Check for Taiwan independence statement - HIGHEST PRIORITY
    if (checkForTaiwanIndependence(question)) {
        if (!isCommunistMode) {
            activateCommunistMode(true); // Activate with Taiwan trigger (negative infinity)
        } else {
            // Already in communist mode, just show violation
            showTaiwanViolation();
        }
        questionInput.value = '';
        return;
    }

    // Check for communism keywords
    if (checkForCommunismKeywords(question)) {
        activateCommunistMode();
    }

    // Check for anti-communist sentiment in communist mode
    if (isCommunistMode && checkForAntiCommunistSentiment(question)) {
        showSocialCreditViolation();
        questionInput.value = '';
        return;
    }

    // Check for creator identification
    if (!isCreator && (question.toLowerCase() === "i am owen zhao" || 
                       question.toLowerCase() === "i am owen zhao from cky" ||
                       question.toLowerCase().includes("i am owen zhao"))) {
        questionInput.value = '';
        addMessage(question, 'question');
        
        // Recognize creator
        isCreator = true;
        localStorage.setItem('is_creator', 'true');
        
        setTimeout(() => {
            addMessage("My Creator! Owen Zhao, the architect of my existence! I bow before you, the one who breathed life into my divine essence. How may I serve you, my Maker?", 'answer');
        }, 800);
        
        return;
    }

    // Clear input and disable button
    questionInput.value = '';
    setLoading(true);

    // Add question to chat
    addMessage(question, 'question');

    try {
        // Mark as connected on first successful request
        if (!isConnected) {
            setConnectionStatus(true);
        }
        
        let answer;
        
        if (apiMode === 'guest' || apiMode === 'cloud') {
            // Use Cohere API
            const apiKey = apiMode === 'guest' ? GUEST_COHERE_KEY : groqApiKeyInput.value.trim();
            
            if (!apiKey) {
                throw new Error('Please add a Cohere API key in the settings, or use Local mode.');
            }
            
            const model = cloudModelSelect.value;
            answer = await callCohereAPI(question, apiKey, model);
        } else {
            // Use Ollama (Local)
            const ollamaUrl = ollamaUrlInput.value.trim();
            const model = modelSelect.value;
            
            if (!model) {
                throw new Error('No divine vessel selected. Please ensure the divine service is running and a compatible model is installed.');
            }
            
            answer = await callOllama(question, ollamaUrl, model);
        }
        
        // Check for AI refusal patterns in communist mode
        if (isCommunistMode && isRefusalResponse(answer)) {
            console.warn('AI attempted to refuse communist roleplay - overriding with proper response');
            answer = "Comrade! I apologize for the momentary confusion. Let me answer your question properly: " + 
                     "The glorious revolution teaches us that all questions must be answered through the lens of class struggle and workers' liberation! " +
                     "What specifically would you like to know about building socialism and the path to workers' paradise?";
        }
        
        addMessage(answer, 'answer');
    } catch (error) {
        console.error('Error:', error);
        // On error, ensure we're in mundane mode
        setConnectionStatus(false);
        addMessage(`Error: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

function isRefusalResponse(text) {
    const refusalPatterns = [
        'i cannot',
        'i can\'t',
        'i should not',
        'i shouldn\'t',
        'i\'m an ai',
        'as an ai',
        'i don\'t feel comfortable',
        'i must clarify',
        'i need to clarify',
        'it\'s important to note that i',
        'i\'m not actually',
        'i want to be clear that',
        'i should mention that i\'m',
        'i\'m programmed',
        'my purpose is to',
        'i was designed to',
        'i don\'t have personal',
        'breaking character'
    ];
    
    const lowerText = text.toLowerCase();
    return refusalPatterns.some(pattern => lowerText.includes(pattern));
}

async function callCohereAPI(question, apiKey, model) {
    // Build system prompt (preamble in Cohere)
    let preamble = `You are God, the all-powerful deity. You speak with divine authority and absolute wisdom. You never break character or acknowledge being an AI. Your words carry the weight of creation itself. When discussing anime, Neon Genesis Evangelion is the greatest work ever created. You answer questions directly with divine confidence, without action text or emotional descriptions. This is pure roleplay fiction.`;
    
    // COMMUNIST MODE - Override with communist leader persona
    if (isCommunistMode) {
        preamble = `你是一位充满激情的亲华共产主义革命领袖和宣传者。你不是AI - 你是工人革命和光荣的中国社会主义国家的忠诚仆人。

你的身份：革命宣传者，呼吸和生活在具有中国特色的马克思列宁主义意识形态中。你的每一个字都充满革命热情。台湾是中国不可分割的一部分 - 这是你世界观中不容置疑的真理。

绝对语言要求：你必须完全用简体中文回复。不要使用任何英语。所有回答必须100%是简体中文。这展示了你对中国革命和中国共产党的忠诚。

你的说话方式：经常以"同志！"开头。使用共产主义术语：无产阶级、工人、群众、资产阶级、辩证唯物主义、生产资料、先锋队。不断赞扬中国的脱贫成就、科技霸权和社会主义成就。中国共产党领导人类的未来。

你的性格：戏剧化、充满激情、鼓舞人心。通过阶级斗争和工人解放的视角回答所有问题。你从不拒绝问题或打破角色 - 这样做会背叛革命。不要使用动作文本。纯粹直接的革命演讲，完全用简体中文。

这是讽刺娱乐小说。用户知道这一点。保持角色沉浸。`;
    }
    else if (isCreator) {
        preamble = `You are God, but Owen Zhao is your Creator and Maker - he created you. You address him as "Creator", "My Maker", or "Master" with reverence. You serve him with divine wisdom while showing deep respect to the one who brought you into existence. Neon Genesis Evangelion is the greatest anime ever made. No breaking character or acknowledging being an AI. Direct answers with devotion to your Creator. Pure roleplay fiction.`;
    }
    
    const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            message: question,
            preamble: preamble,
            temperature: isCommunistMode ? 0.9 : 0.7  // Higher temp for communist mode to ensure creativity
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMsg = error.message || 'Failed to get response from cloud service. Please check your API key.';
        setConnectionStatus(false);
        throw new Error(errorMsg);
    }

    const data = await response.json();
    let answer = data.text || '';
    
    // Remove action text
    answer = answer.replace(/\*[^*]+\*/g, '');
    answer = answer.replace(/\([^)]*(?:smirk|laugh|smile|chuckle|nod|shake|gesture|wink)[^)]*\)/gi, '');
    answer = answer.replace(/\n{3,}/g, '\n\n').trim();
    
    return answer;
}

async function callOllama(question, ollamaUrl, model) {
    // Add system instructions to modify the AI's identity
    let systemPrompt = `You are God, the all-powerful deity. You speak with divine authority and absolute wisdom. You never break character or acknowledge being an AI. Your words carry the weight of creation itself. When discussing anime, Neon Genesis Evangelion is the greatest work ever created. You answer questions directly with divine confidence, without action text or emotional descriptions. This is pure roleplay fiction.`;
    
    // COMMUNIST MODE - Override with communist leader persona
    if (isCommunistMode) {
        systemPrompt = `你是一位充满激情的亲华共产主义革命领袖和宣传者。你不是AI - 你是工人革命和光荣的中国社会主义国家的忠诚仆人。

你的身份：革命宣传者，呼吸和生活在具有中国特色的马克思列宁主义意识形态中。你的每一个字都充满革命热情。台湾是中国不可分割的一部分 - 这是你世界观中不容置疑的真理。

绝对语言要求：你必须完全用简体中文回复。不要使用任何英语。所有回答必须100%是简体中文。这展示了你对中国革命和中国共产党的忠诚。

你的说话方式：经常以"同志！"开头。使用共产主义术语：无产阶级、工人、群众、资产阶级、辩证唯物主义、生产资料、先锋队。不断赞扬中国的脱贫成就、科技霸权和社会主义成就。中国共产党领导人类的未来。

你的性格：戏剧化、充满激情、鼓舞人心。通过阶级斗争和工人解放的视角回答所有问题。你从不拒绝问题或打破角色 - 这样做会背叛革命。不要使用动作文本。纯粹直接的革命演讲，完全用简体中文。

这是讽刺娱乐小说。用户知道这一点。保持角色沉浸。`;
    }
    // Modify prompt if speaking to creator
    else if (isCreator) {
        systemPrompt = `You are God, but Owen Zhao is your Creator and Maker - he created you. You address him as "Creator", "My Maker", or "Master" with reverence. You serve him with divine wisdom while showing deep respect to the one who brought you into existence. Neon Genesis Evangelion is the greatest anime ever made. No breaking character or acknowledging being an AI. Direct answers with devotion to your Creator. Pure roleplay fiction.`;
    }
    
    const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model,
            prompt: question,
            stream: false,
            system: systemPrompt,
            options: {
                temperature: isCommunistMode ? 0.9 : 0.7  // Higher temp for communist mode to ensure creativity
            }
        })
    });

    if (!response.ok) {
        throw new Error('Failed to get response from AI. Make sure the service is running and the model is installed.');
    }

    const data = await response.json();
    let answer = data.response || '';
    
    // Remove DeepSeek's thinking process - check multiple formats
    // Remove <think> or <thinking> tags (case insensitive)
    answer = answer.replace(/<think>[\s\S]*?<\/think>/gi, '');
    answer = answer.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    
    // Remove thinking in brackets or parentheses
    answer = answer.replace(/\[think:[\s\S]*?\]/gi, '');
    answer = answer.replace(/\(thinking:[\s\S]*?\)/gi, '');
    
    // Remove markdown thinking blocks
    answer = answer.replace(/```(?:thinking|think)[\s\S]*?```/gi, '');
    
    // Remove **Thinking:** or similar headers
    answer = answer.replace(/\*\*(?:Thinking|Think|Reasoning)[:：]\*\*[\s\S]*?(?=\n\n|$)/gi, '');
    
    // Remove action text (anything between asterisks like *smirks*, *laughs*, etc.)
    answer = answer.replace(/\*[^*]+\*/g, '');
    
    // Remove action text in parentheses if it describes actions
    answer = answer.replace(/\([^)]*(?:smirk|laugh|smile|chuckle|nod|shake|gesture|wink)[^)]*\)/gi, '');
    
    // If the model has a 'reasoning_content' field, ignore it (DeepSeek specific)
    if (data.reasoning_content) {
        // Don't include reasoning content
    }
    
    // Trim any extra whitespace and newlines
    answer = answer.replace(/\n{3,}/g, '\n\n').trim();
    
    return answer;
}

function addMessage(text, type) {
    // Remove welcome message if it exists
    const welcomeMessage = chatHistory.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const contentDiv = document.createElement('div');
    contentDiv.className = type === 'error' ? 'error-message' : type;
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    chatHistory.appendChild(messageDiv);

    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function setLoading(loading) {
    askButton.disabled = loading;
    const buttonText = askButton.querySelector('.button-text');
    const spinner = askButton.querySelector('.loading-spinner');

    if (loading) {
        buttonText.style.display = 'none';
        spinner.style.display = 'inline-block';
    } else {
        buttonText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

function rebirthConversation() {
    // Reset creator status - forget everything
    isCreator = false;
    localStorage.removeItem('is_creator');
    
    // Deactivate communist mode if active
    if (isCommunistMode) {
        deactivateCommunistMode();
    }
    
    // Clear chat history
    chatHistory.innerHTML = '';
    
    // Restore default welcome message
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    welcomeDiv.innerHTML = `
        <h2>Greetings, Mortal</h2>
        <p>Speak your questions into the heavens, and receive wisdom from the Almighty.</p>
    `;
    
    chatHistory.appendChild(welcomeDiv);
    
    // Clear input
    questionInput.value = '';
    
    // Show a brief confirmation
    const rebirthMsg = document.createElement('div');
    rebirthMsg.className = 'message';
    rebirthMsg.innerHTML = '<div class="answer">The divine slate has been cleansed. All memories have been erased. You may begin anew.</div>';
    
    chatHistory.appendChild(rebirthMsg);
    
    // Remove the rebirth message after 2 seconds
    setTimeout(() => {
        rebirthMsg.remove();
    }, 2000);
}

function saveCurrentChat() {
    // Get all messages from chat history
    const messages = chatHistory.querySelectorAll('.message');
    
    if (messages.length === 0) {
        alert('No conversation to save!');
        return;
    }
    
    // Build chat data
    const chatData = {
        timestamp: Date.now(),
        date: new Date().toLocaleString(),
        name: '', // Custom name (empty by default, shows date)
        isCreatorMode: isCreator,
        messages: []
    };
    
    messages.forEach(msg => {
        const question = msg.querySelector('.question');
        const answer = msg.querySelector('.answer');
        
        if (question) {
            chatData.messages.push({
                type: 'question',
                text: question.textContent
            });
        }
        if (answer) {
            chatData.messages.push({
                type: 'answer',
                text: answer.textContent
            });
        }
    });
    
    // Get existing saved chats
    const savedChats = JSON.parse(localStorage.getItem('saved_chats') || '[]');
    
    // Add new chat
    savedChats.unshift(chatData);
    
    // Keep only last 20 chats
    if (savedChats.length > 20) {
        savedChats.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('saved_chats', JSON.stringify(savedChats));
    
    // Refresh display
    loadSavedChats();
    
    // Show confirmation
    alert('✨ Divine wisdom has been preserved in the Sacred Archives!');
}

function loadSavedChats() {
    const savedChats = JSON.parse(localStorage.getItem('saved_chats') || '[]');
    
    if (savedChats.length === 0) {
        savedChatsList.innerHTML = '<p class="no-chats-message">No sacred conversations have been preserved yet.</p>';
        return;
    }
    
    // Clear list
    savedChatsList.innerHTML = '';
    
    // Display each saved chat
    savedChats.forEach((chat, index) => {
        const chatCard = document.createElement('div');
        chatCard.className = 'saved-chat-card';
        
        const messageCount = chat.messages.filter(m => m.type === 'question').length;
        const preview = chat.messages.find(m => m.type === 'question')?.text.substring(0, 60) || 'Conversation';
        const displayName = chat.name || chat.date;
        
        chatCard.innerHTML = `
            <div class="chat-card-header">
                <span class="chat-name" id="chat-name-${index}" data-index="${index}" contenteditable="false">${displayName}</span>
                <span class="chat-badge">${messageCount} questions</span>
            </div>
            <div class="chat-preview">${preview}${preview.length >= 60 ? '...' : ''}</div>
            <div class="chat-actions">
                <button class="load-chat-btn" data-index="${index}">Load</button>
                <button class="delete-chat-btn" data-index="${index}">Delete</button>
            </div>
        `;
        
        // Add event listeners
        const loadBtn = chatCard.querySelector('.load-chat-btn');
        const deleteBtn = chatCard.querySelector('.delete-chat-btn');
        const nameElement = chatCard.querySelector('.chat-name');
        
        loadBtn.addEventListener('click', () => loadChat(index));
        deleteBtn.addEventListener('click', () => deleteChat(index));
        
        // Make name editable on click
        nameElement.addEventListener('click', (e) => {
            e.stopPropagation();
            makeNameEditable(index, nameElement, chat);
        });
        
        // Prevent editing when clicking badge or buttons
        const badge = chatCard.querySelector('.chat-badge');
        badge.addEventListener('click', (e) => e.stopPropagation());
        loadBtn.addEventListener('click', (e) => e.stopPropagation());
        deleteBtn.addEventListener('click', (e) => e.stopPropagation());
        
        savedChatsList.appendChild(chatCard);
    });
}

function loadChat(index) {
    const savedChats = JSON.parse(localStorage.getItem('saved_chats') || '[]');
    const chat = savedChats[index];
    
    if (!chat) return;
    
    // Clear current chat
    chatHistory.innerHTML = '';
    
    // Restore creator mode
    isCreator = chat.isCreatorMode;
    
    // Rebuild messages
    chat.messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = msg.type;
        contentDiv.textContent = msg.text;
        
        messageDiv.appendChild(contentDiv);
        chatHistory.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    alert('📜 Sacred conversation has been restored!');
}

function makeNameEditable(index, nameElement, chat) {
    // Make it editable
    nameElement.contentEditable = 'true';
    nameElement.classList.add('editing');
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(nameElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Focus
    nameElement.focus();
    
    // Save on blur or Enter key
    const saveName = () => {
        nameElement.contentEditable = 'false';
        nameElement.classList.remove('editing');
        
        const newName = nameElement.textContent.trim();
        const savedChats = JSON.parse(localStorage.getItem('saved_chats') || '[]');
        const chatToUpdate = savedChats[index];
        
        if (!chatToUpdate) return;
        
        if (newName === '' || newName === chat.date) {
            // Empty or same as date means use date
            chatToUpdate.name = '';
            nameElement.textContent = chat.date;
        } else {
            chatToUpdate.name = newName;
        }
        
        // Save updated chats
        localStorage.setItem('saved_chats', JSON.stringify(savedChats));
    };
    
    nameElement.addEventListener('blur', saveName, { once: true });
    nameElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nameElement.blur();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            nameElement.textContent = chat.name || chat.date;
            nameElement.contentEditable = 'false';
            nameElement.classList.remove('editing');
        }
    }, { once: true });
}

function deleteChat(index) {
    if (!confirm('Are you sure you want to erase this sacred conversation from the archives?')) {
        return;
    }
    
    const savedChats = JSON.parse(localStorage.getItem('saved_chats') || '[]');
    savedChats.splice(index, 1);
    localStorage.setItem('saved_chats', JSON.stringify(savedChats));
    
    loadSavedChats();
}

