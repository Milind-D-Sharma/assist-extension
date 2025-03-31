# AI Assistant Chrome Extension

An AI-powered Chrome extension that helps you with web automation and tasks. The extension provides a chat interface where you can interact with an AI assistant to automate web tasks, fill forms, and more.

## Features

- 🤖 AI-powered chat interface
- 🔐 Google Sign-In authentication
- 💬 Real-time chat with message history
- 🎨 Modern and responsive UI
- 🌙 Dark mode support
- ♿ Accessibility features
- 🔄 Message regeneration
- 📋 Copy message functionality
- 🖼️ Screenshot capture
- 🤖 Web automation capabilities

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-assistant-extension.git
cd ai-assistant-extension
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_CLIENT_ID=your_client_id
```

4. Build the extension:
```bash
npm run build
```

5. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` directory

## Development

- Start development server:
```bash
npm run dev
```

- Run tests:
```bash
npm test
npm run test:watch  # Run tests in watch mode
```

- Lint code:
```bash
npm run lint
```

- Format code:
```bash
npm run format
```

## Project Structure

```
ai-assistant-extension/
├── background.js          # Background script
├── content.js            # Content script
├── popup.js             # Popup script
├── popup.html           # Popup HTML
├── popup.css            # Popup styles
├── content.css          # Content styles
├── manifest.json        # Extension manifest
├── utils/
│   ├── auth.js         # Authentication service
│   └── chat.js         # Chat service
├── icons/              # Extension icons
└── tests/              # Test files
```

## Features in Detail

### Authentication
- Google Sign-In integration
- Secure user session management
- Persistent authentication state

### Chat Interface
- Real-time message updates
- Message history
- Message regeneration
- Copy message functionality
- Responsive design
- Dark mode support

### Web Automation
- Form filling
- Button clicking
- Screenshot capture
- Page context analysis
- Macro recording and playback

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Firebase for authentication and database
- Chrome Extension APIs
- Modern web technologies and frameworks
