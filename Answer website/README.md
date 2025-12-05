# ✨ Ask God - Divine Q&A Website ✨

A beautiful, holy-themed AI question-answering website powered by Ollama.

## 🌟 Features

- Divine golden theme with flowing gradients
- AI-powered responses using Ollama
- Creator recognition for Owen Zhao
- Conversation rebirth (clear and restart)
- Divine configuration panel
- Persistent settings

## 🚀 Three Ways to Run:

### Option 1: Guest Mode ☁️ (EASIEST - Works Instantly!)
**No installation needed! Works on any device.**
1. Set up a free Groq API key (see `SETUP_GUEST_MODE.md`)
2. Open `index.html` in your browser
3. Start asking questions immediately!

### Option 2: Cloud Mode ☁️ (Your Own Key)
1. Get a free Groq API key at [console.groq.com](https://console.groq.com)
2. Open the website
3. Go to Divine Configuration → Choose "Cloud"
4. Enter your API key
5. Done!

### Option 3: Local Mode 💻 (Most Private)
**Prerequisites:**
1. **Install Ollama**: Download from [https://ollama.ai](https://ollama.ai)
2. **Download a Llama Model**: 
   ```bash
   ollama pull llama3.1
   # or
   ollama pull llama2
   ```

### Option 1: Simple File Opening
Just open `index.html` in your browser!

### Option 2: Python Server (Recommended)
```bash
python server.py
```
Then visit: `http://localhost:8080`

### Option 3: Node.js Server
```bash
npm install -g http-server
http-server -p 8080
```

## 🌐 Accessing from Other Devices (Same Network)

1. Start the server:
   ```bash
   python server.py
   ```

2. Find your computer's IP address:
   - **Windows**: `ipconfig` (look for IPv4 Address)
   - **Mac/Linux**: `ifconfig` or `ip addr`

3. On another device, visit:
   ```
   http://YOUR_IP_ADDRESS:8080
   ```

## 🌍 Deploying Online with ngrok

To make your website accessible from anywhere on the internet:

1. **Install ngrok**: [https://ngrok.com/download](https://ngrok.com/download)

2. **Start your local server**:
   ```bash
   python server.py
   ```

3. **In another terminal, run ngrok**:
   ```bash
   ngrok http 8080
   ```

4. **Share the URL**: ngrok will give you a public URL like `https://abc123.ngrok.io`

**Important**: With ngrok, Ollama must still be running on your local machine. The website will be accessible worldwide but will connect to your local Ollama instance.

## 📝 Alternative: Deploy Static Files

You can deploy the HTML/CSS/JS files to any static hosting service:
- **GitHub Pages**: Free, easy
- **Netlify**: Free, drag & drop
- **Vercel**: Free, automatic deployments

**Note**: When deployed this way, users need to:
1. Have Ollama running on their own machine
2. Update the "Sacred Server Portal" in Divine Configuration to `http://localhost:11434`

## 🔧 Configuration

### Divine Configuration Panel
Click "⚡ Divine Configuration ⚡" at the bottom to:
- Change the Ollama server URL
- Select different AI models
- Refresh available models

### Creator Mode
Type "I am Owen Zhao" to be recognized as the Creator. God will serve you with reverence!

## 🎯 Usage

1. Ensure Ollama is running
2. Open the website
3. Type your question
4. Click "Ask God"
5. Receive divine wisdom!

### Special Commands
- **"I am Owen Zhao"** - Become the Creator
- **Divine Rebirth button** - Clear conversation

## 🛠️ Tech Stack

- Pure HTML/CSS/JavaScript
- Ollama API for AI responses
- No frameworks or build tools needed!

## ⚠️ Disclaimer

*This is just a joke. Not the real God. For entertainment purposes only.*

---

Created with divine inspiration ✨

