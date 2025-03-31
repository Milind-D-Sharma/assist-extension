import React from 'react';
import { createRoot } from 'react-dom/client';
import { Chat } from './components/Chat';
import './styles/Chat.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Chat />); 