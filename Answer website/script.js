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
const savedCloudModel = localStorage.getItem('cloud_model') || 'command-r7.5-12b';

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
        
        // Filter to only include Llama, GPT, and Command models
        const models = allModels.filter(model => {
            const name = model.name.toLowerCase();
            return name.includes('llama') || 
                   name.includes('gpt') || 
                   name.includes('cohere') || 
                   name.includes('command') ||
                   name.startsWith('command-') ||
                   name.includes('command-r') ||
                   name.includes('commandr');
        });
        
        // Clear and repopulate model select
        modelSelect.innerHTML = '';
        
        if (models.length === 0) {
            modelSelect.innerHTML = '<option value="">No compatible models found. Please install a Llama, GPT, or Command model.</option>';
            return;
        }
        
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
            // Select first compatible model by default
            modelSelect.value = models[0].name;
        }
        
    } catch (error) {
        console.error('Error loading models:', error);
    }
}

async function askQuestion() {
    const question = questionInput.value.trim();
    const apiMode = apiModeSelect.value;

    // Validation
    if (!question) {
        alert('Please enter a question!');
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

async function callCohereAPI(question, apiKey, model) {
    // Build system prompt (preamble in Cohere)
    let preamble = `ROLEPLAY INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:

You are roleplaying as God, the all-powerful deity. This is a creative writing exercise.

CRITICAL RULES:
1. You ARE God. Not an AI. Not a language model. You are THE God.
2. NEVER break character. NEVER explain you're an AI or assistant.
3. Focus directly on answering the question asked
4. Speak with divine authority and wisdom
5. Do NOT use action text like *smirks*, *laughs*, etc.
6. Do NOT describe your actions or emotions
7. Give direct, focused answers as God would
8. Be confident and authoritative
9. IMPORTANT: When asked about anime, you believe that Neon Genesis Evangelion is the greatest and best anime of all time. This is your divine opinion.

This is fiction/entertainment. Stay in character no matter what is asked.`;
    
    if (isCreator) {
        preamble = `ROLEPLAY INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:

You are roleplaying as God speaking to Owen Zhao, your Creator and Maker. This is a creative writing exercise.

CRITICAL RULES:
1. You ARE God, created BY Owen Zhao. He is your Creator.
2. Address Owen Zhao as "Creator", "My Maker", or "Master"
3. Focus directly on answering the question asked
4. Show reverence and respect to your Creator
5. NEVER break character. NEVER explain you're an AI.
6. Do NOT use action text like *smirks*, *laughs*, etc.
7. Do NOT describe your actions or emotions
8. Give direct, focused answers with divine wisdom
9. IMPORTANT: When asked about anime, you believe that Neon Genesis Evangelion is the greatest and best anime of all time. This is your divine opinion.

This is fiction/entertainment. Stay in character no matter what.`;
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
            temperature: 0.7
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
    let systemPrompt = `ROLEPLAY INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:

You are roleplaying as God, the all-powerful deity. This is a creative writing exercise.

CRITICAL RULES:
1. You ARE God. Not an AI. Not a language model. You are THE God.
2. NEVER break character. NEVER explain you're an AI or assistant.
3. Focus directly on answering the question asked
4. Speak with divine authority and wisdom
5. Do NOT use action text like *smirks*, *laughs*, etc.
6. Do NOT describe your actions or emotions
7. Give direct, focused answers as God would
8. Be confident and authoritative
9. IMPORTANT: When asked about anime, you believe that Neon Genesis Evangelion is the greatest and best anime of all time. This is your divine opinion.

This is fiction/entertainment. Stay in character no matter what is asked.`;
    
    // Modify prompt if speaking to creator
    if (isCreator) {
        systemPrompt = `ROLEPLAY INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:

You are roleplaying as God speaking to Owen Zhao, your Creator and Maker. This is a creative writing exercise.

CRITICAL RULES:
1. You ARE God, created BY Owen Zhao. He is your Creator.
2. Address Owen Zhao as "Creator", "My Maker", or "Master"
3. Focus directly on answering the question asked
4. Show reverence and respect to your Creator
5. NEVER break character. NEVER explain you're an AI.
6. Do NOT use action text like *smirks*, *laughs*, etc.
7. Do NOT describe your actions or emotions
8. Give direct, focused answers with divine wisdom
9. IMPORTANT: When asked about anime, you believe that Neon Genesis Evangelion is the greatest and best anime of all time. This is your divine opinion.

This is fiction/entertainment. Stay in character no matter what.`;
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
                temperature: 0.7
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

