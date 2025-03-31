class ChatInterface {
    constructor() {
        this.container = document.getElementById('chat-container');
        this.messagesContainer = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-btn');
        this.minimizeButton = document.getElementById('minimize-btn');
        this.closeButton = document.getElementById('close-btn');
        this.voiceInputButton = document.getElementById('voice-input-btn');
        this.voiceOutputButton = document.getElementById('voice-output-btn');
        
        this.isDragging = false;
        this.isResizing = false;
        this.isMinimized = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        
        this.initializeDragAndResize();
        this.initializeSpeechRecognition();
        this.setupEventListeners();
    }

    initializeDragAndResize() {
        const header = this.container.querySelector('.chat-header');
        let startX, startY, startWidth, startHeight;

        // Dragging functionality
        header.addEventListener('mousedown', (e) => {
            if (e.target === this.minimizeButton || e.target === this.closeButton) return;
            
            this.isDragging = true;
            startX = e.clientX - this.container.offsetLeft;
            startY = e.clientY - this.container.offsetTop;
        });

        // Resizing functionality
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        this.container.appendChild(resizeHandle);

        resizeHandle.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = this.container.offsetWidth;
            startHeight = this.container.offsetHeight;
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const x = e.clientX - startX;
                const y = e.clientY - startY;
                this.container.style.left = `${x}px`;
                this.container.style.top = `${y}px`;
            }
            if (this.isResizing) {
                const width = startWidth + (e.clientX - startX);
                const height = startHeight + (e.clientY - startY);
                this.container.style.width = `${width}px`;
                this.container.style.height = `${height}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isResizing = false;
        });
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                this.input.value = text;
            };
        }
    }

    setupEventListeners() {
        // Send message
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Minimize/Maximize
        this.minimizeButton.addEventListener('click', () => {
            this.isMinimized = !this.isMinimized;
            this.container.classList.toggle('minimized');
            this.minimizeButton.textContent = this.isMinimized ? '□' : '_';
        });

        // Close
        this.closeButton.addEventListener('click', () => {
            this.container.style.display = 'none';
        });

        // Voice input
        this.voiceInputButton.addEventListener('click', () => {
            if (this.recognition) {
                this.recognition.start();
                this.voiceInputButton.classList.add('active');
                this.recognition.onend = () => {
                    this.voiceInputButton.classList.remove('active');
                };
            }
        });

        // Voice output
        this.voiceOutputButton.addEventListener('click', () => {
            const lastAssistantMessage = this.messagesContainer.querySelector('.message.assistant:last-child');
            if (lastAssistantMessage) {
                const text = lastAssistantMessage.textContent;
                const utterance = new SpeechSynthesisUtterance(text);
                this.synthesis.speak(utterance);
            }
        });

        // Auto-resize textarea
        this.input.addEventListener('input', () => {
            this.input.style.height = 'auto';
            this.input.style.height = this.input.scrollHeight + 'px';
        });
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.input.value = '';
        this.input.style.height = 'auto';

        try {
            // Send message to background script for processing
            const response = await chrome.runtime.sendMessage({
                type: 'CHAT_MESSAGE',
                message: message
            });

            // Add assistant response to chat
            this.addMessage(response.text, 'assistant');
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('Sorry, there was an error processing your request.', 'assistant');
        }
    }

    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatInterface();
}); 