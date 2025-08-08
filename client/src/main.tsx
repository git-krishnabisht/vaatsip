import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

document.documentElement.setAttribute('theme', 'light');

const _root = document.getElementById('root');
if (_root === null) {
  throw new Error('root element is not defined');
}

const root = createRoot(_root);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
