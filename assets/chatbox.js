npm install @supabase/supabase-js

import { scanPageContent } from '../utils/domScanner.js';

let OPENAI_KEY = "";
let CLAUDE_KEY = "";
let DEFAULT_MODEL = "gpt-4";
let currentModel = DEFAULT_MODEL;
let confirmCallback = null;
let voiceEnabled = false;

fetch(chrome.runtime.getURL('config/settings.json'))
  .then(res => res.json())
  .then(data => {
    OPENAI_KEY = data.openaiKey;
    CLAUDE_KEY = data.claudeKey;
    DEFAULT_MODEL = data.defaultModel;
    currentModel = DEFAULT_MODEL;
  });

chrome.storage.sync.get(["voiceEnabled", "preferredModel", "darkMode"], data => {
  if (data.voiceEnabled) voiceEnabled = true;
  if (data.preferredModel) currentModel = data.preferredModel;
  if (data.darkMode) document.getElementById('ai-chatbox').classList.add('dark');
});

const box = document.getElementById('ai-chatbox');
const header = document.getElementById('chat-header');
const body = document.getElementById('chat-body');
const input = document.getElementById('chat-input');
const micButton = document.getElementById('mic-button');

let isDragging = false, offsetX, offsetY;
header.addEventListener('mousedown', e => {
  isDragging = true;
  offsetX = e.clientX - box.offsetLeft;
  offsetY = e.clientY - box.offsetTop;
});
document.addEventListener('mousemove', e => {
  if (isDragging) {
    box.style.left = `${e.clientX - offsetX}px`;
    box.style.top = `${e.clientY - offsetY}px`;
    box.style.right = 'auto';
    box.style.bottom = 'auto';
  }
});
document.addEventListener('mouseup', () => isDragging = false);

input.addEventListener('keydown', async e => {
  if (e.key === 'Enter') {
    const userText = input.value.trim();
    if (!userText) return;
    appendMessage("You", userText);
    input.value = "";

    if (confirmCallback && userText.toLowerCase().startsWith("yes")) {
      confirmCallback();
      confirmCallback = null;
      return;
    }

    const reply = await handleUserMessage(userText);
    appendMessage("AI", reply);
    if (voiceEnabled) speakText(reply);
    executeActionFromReply(reply);
  }
});

function appendMessage(sender, text) {
  const div = document.createElement('div');
  div.textContent = `${sender}: ${text}`;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

async function handleUserMessage(text) {
  const context = scanPageContent();

  const messages = [
    {
      role: "system",
      content: `You're a browser assistant that can read and act on webpages. Use [[ACTION:...]] to fill, click, scroll, or insert JS.`
    },
    {
      role: "user",
      content: `Page:\n${context.pageText}\n\nUser: ${text}`
    }
  ];

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${currentModel.startsWith('gpt') ? OPENAI_KEY : CLAUDE_KEY}`
  };

  const body = JSON.stringify(
    currentModel.startsWith('gpt') ?
      { model: currentModel, messages } :
      { model: currentModel, messages: [{ role: "user", content: messages.map(m => m.content).join('\n') }] }
  );

  const url = currentModel.startsWith('gpt') ?
    'https://api.openai.com/v1/chat/completions' :
    'https://api.anthropic.com/v1/complete';

  const res = await fetch(url, { method: 'POST', headers, body });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "(No response)";
}

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
}

let recognition;
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    micButton.classList.remove('listening');
  };

  recognition.onerror = function () {
    micButton.classList.remove('listening');
  };
}

micButton.addEventListener('click', () => {
  if (recognition) {
    recognition.start();
    micButton.classList.add('listening');
  }
});
