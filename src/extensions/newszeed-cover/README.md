# Newszeed Cover Generator - Chrome Extension

AI-powered news cover generator using Gemini directly in your browser.

## Features

- 🎨 **9 News Categories** - World Politics, Breaking News, Finance, Football, Transfer, Drama, โหนกระแส, Esports, Health, Celebrity
- 🔄 **Batch Processing** - Queue system with priority scheduling
- 💾 **Presets** - Save and load your configurations
- ⚡ **Auto-Download** - Automatically save generated images
- 🎯 **Gemini Integration** - Uses Gemini AI directly, no API needed

## Installation

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `src/extensions/newszeed-cover` folder

## Usage

1. Open [Gemini](https://gemini.google.com) in a browser tab
2. Click the Newszeed extension icon
3. Upload images, select category, customize text
4. Click "สร้างหน้าปก" to generate

## Tech Stack

- Chrome Extension Manifest V3
- Glassmorphism Design System
- IndexedDB for queue persistence
- Token Bucket rate limiting
- Exponential backoff with jitter for retries
