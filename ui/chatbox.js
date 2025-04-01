class AIAssistant {
    constructor() {
        this.container = document.getElementById('ai-assistant-container');
        this.header = document.getElementById('ai-assistant-header');
        this.messages = document.getElementById('ai-assistant-messages');
        this.input = document.getElementById('ai-assistant-input');
        this.sendButton = document.getElementById('ai-assistant-send');
        this.modelButton = document.getElementById('ai-assistant-model');
        this.minimizeButton = document.getElementById('ai-assistant-minimize');
        this.screenshotButton = document.getElementById('ai-assistant-screenshot');
        this.voiceButton = document.getElementById('ai-assistant-voice');
        this.speakButton = document.getElementById('ai-assistant-speak');
        this.resizeHandle = document.getElementById('ai-assistant-resize');
        this.suggestions = document.getElementById('ai-assistant-suggestions');
        
        this.isDragging = false;
        this.isResizing = false;
        this.isMinimized = false;
        this.isSpeechEnabled = false;
        this.currentModel = 'gpt-4';
        this.dragOffset = { x: 0, y: 0 };
        
        this.setupEventListeners();
        this.setupResizeObserver();
        this.setupSpeechRecognition();
        this.loadSettings();
    }

    setupEventListeners() {
        // Dragging
        this.header.addEventListener('mousedown', this.startDragging.bind(this));
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.stopDragging.bind(this));

        // Resizing
        this.resizeHandle.addEventListener('mousedown', this.startResizing.bind(this));
        document.addEventListener('mousemove', this.handleResize.bind(this));
        document.addEventListener('mouseup', this.stopResizing.bind(this));

        // Input handling
        this.input.addEventListener('keydown', this.handleInput.bind(this));
        this.input.addEventListener('input', this.adjustInputHeight.bind(this));
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // UI Controls
        this.minimizeButton.addEventListener('click', this.toggleMinimize.bind(this));
        this.modelButton.addEventListener('click', this.toggleModel.bind(this));
        this.screenshotButton.addEventListener('click', this.startScreenshot.bind(this));
        this.voiceButton.addEventListener('click', this.toggleVoiceInput.bind(this));
        this.speakButton.addEventListener('click', this.toggleTextToSpeech.bind(this));

        // Save position when window closes
        window.addEventListener('beforeunload', () => this.saveSettings());
    }

    setupResizeObserver() {
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === this.container) {
                    this.saveSettings();
                }
            }
        });
        resizeObserver.observe(this.container);
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.input.value = transcript;
                this.sendMessage();
            };
        }
    }

    async loadSettings() {
        const settings = await chrome.storage.sync.get([
            'position',
            'size',
            'model',
            'isMinimized',
            'isSpeechEnabled'
        ]);

        if (settings.position) {
            this.container.style.left = settings.position.x + 'px';
            this.container.style.top = settings.position.y + 'px';
        }

        if (settings.size) {
            this.container.style.width = settings.size.width + 'px';
            this.container.style.height = settings.size.height + 'px';
        }

        if (settings.model) {
            this.currentModel = settings.model;
            this.modelButton.querySelector('.model-icon').textContent = this.currentModel;
        }

        if (settings.isMinimized) {
            this.toggleMinimize();
        }

        if (settings.isSpeechEnabled) {
            this.isSpeechEnabled = true;
            this.speakButton.classList.add('active');
        }
    }

    async saveSettings() {
        const rect = this.container.getBoundingClientRect();
        await chrome.storage.sync.set({
            position: { x: rect.left, y: rect.top },
            size: { width: rect.width, height: rect.height },
            model: this.currentModel,
            isMinimized: this.isMinimized,
            isSpeechEnabled: this.isSpeechEnabled
        });
    }

    startDragging(e) {
        if (e.target === this.header) {
            this.isDragging = true;
            const rect = this.container.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    }

    handleDrag(e) {
        if (!this.isDragging) return;
        
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        
        // Keep within viewport
        const rect = this.container.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        
        this.container.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
        this.container.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    }

    stopDragging() {
        this.isDragging = false;
        this.saveSettings();
    }

    startResizing(e) {
        if (!this.isMinimized) {
            this.isResizing = true;
            e.preventDefault();
        }
    }

    handleResize(e) {
        if (!this.isResizing) return;
        
        const rect = this.container.getBoundingClientRect();
        const width = e.clientX - rect.left;
        const height = e.clientY - rect.top;
        
        this.container.style.width = Math.max(300, width) + 'px';
        this.container.style.height = Math.max(200, height) + 'px';
    }

    stopResizing() {
        this.isResizing = false;
        this.saveSettings();
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.container.classList.toggle('minimized');
        this.saveSettings();
    }

    toggleModel() {
        const models = ['gpt-4', 'claude-2', 'gemini-pro'];
        const currentIndex = models.indexOf(this.currentModel);
        this.currentModel = models[(currentIndex + 1) % models.length];
        this.modelButton.querySelector('.model-icon').textContent = this.currentModel;
        this.saveSettings();
    }

    startScreenshot() {
        const overlay = document.getElementById('ai-assistant-screenshot-overlay');
        const selection = document.getElementById('ai-assistant-screenshot-selection');
        
        overlay.style.display = 'block';
        let startX, startY;
        
        const onMouseDown = (e) => {
            startX = e.clientX;
            startY = e.clientY;
            selection.style.left = startX + 'px';
            selection.style.top = startY + 'px';
            
            const onMouseMove = (e) => {
                const width = e.clientX - startX;
                const height = e.clientY - startY;
                selection.style.width = Math.abs(width) + 'px';
                selection.style.height = Math.abs(height) + 'px';
                selection.style.left = (width < 0 ? e.clientX : startX) + 'px';
                selection.style.top = (height < 0 ? e.clientY : startY) + 'px';
            };
            
            const onMouseUp = () => {
                const rect = selection.getBoundingClientRect();
                this.captureScreenshot(rect);
                overlay.style.display = 'none';
                selection.style.width = '0';
                selection.style.height = '0';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        
        overlay.addEventListener('mousedown', onMouseDown, { once: true });
    }

    async captureScreenshot(rect) {
        try {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            await chrome.runtime.sendMessage({
                type: 'CAPTURE_SCREENSHOT',
                data: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
            }, (dataUrl) => {
                const img = new Image();
                img.onload = () => {
                    context.drawImage(img, 0, 0);
                    this.appendScreenshot(canvas.toDataURL());
                };
                img.src = dataUrl;
            });
        } catch (error) {
            console.error('Screenshot failed:', error);
        }
    }

    appendScreenshot(dataUrl) {
        const message = document.createElement('div');
        message.className = 'ai-assistant-message assistant';
        
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '8px';
        
        message.appendChild(img);
        this.messages.appendChild(message);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    toggleVoiceInput() {
        if (this.recognition) {
            this.recognition.start();
            this.voiceButton.classList.add('active');
            
            this.recognition.onend = () => {
                this.voiceButton.classList.remove('active');
            };
        }
    }

    toggleTextToSpeech() {
        this.isSpeechEnabled = !this.isSpeechEnabled;
        this.speakButton.classList.toggle('active');
        this.saveSettings();
    }

    speak(text) {
        if (this.isSpeechEnabled && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            speechSynthesis.speak(utterance);
        }
    }

    adjustInputHeight() {
        this.input.style.height = 'auto';
        this.input.style.height = (this.input.scrollHeight) + 'px';
    }

    handleInput(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Add user message
        this.appendMessage(message, 'user');
        this.input.value = '';
        this.adjustInputHeight();

        // Get page content for context
        const pageContent = await this.getPageContent();

        try {
            // Send to background script
            const response = await chrome.runtime.sendMessage({
                type: 'CHAT_MESSAGE',
                data: {
                    message,
                    model: this.currentModel,
                    context: pageContent
                }
            });

            // Add AI response
            this.appendMessage(response.text, 'assistant');
            if (this.isSpeechEnabled) {
                this.speak(response.text);
            }

            // Show suggestions if available
            if (response.suggestions) {
                this.showSuggestions(response.suggestions);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            this.appendMessage('Sorry, there was an error processing your request.', 'assistant');
        }
    }

    appendMessage(text, role) {
        const message = document.createElement('div');
        message.className = `ai-assistant-message ${role}`;
        message.textContent = text;
        this.messages.appendChild(message);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    showSuggestions(suggestions) {
        this.suggestions.innerHTML = '';
        this.suggestions.style.display = 'block';
        
        suggestions.forEach(suggestion => {
            const button = document.createElement('button');
            button.className = 'ai-assistant-suggestion';
            button.textContent = suggestion;
            button.onclick = () => {
                this.input.value = suggestion;
                this.sendMessage();
                this.suggestions.style.display = 'none';
            };
            this.suggestions.appendChild(button);
        });
    }

    async getPageContent() {
        return {
            url: window.location.href,
            title: document.title,
            text: document.body.innerText,
            html: document.documentElement.outerHTML
        };
    }
}

// Initialize the assistant
const assistant = new AIAssistant(); 