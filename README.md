# 🖋️ inkdrop

> A minimalist, lightning-fast note-taking PWA designed for simplicity and productivity.

[![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)](https://web.dev/progressive-web-apps/)
[![Offline](https://img.shields.io/badge/Offline-Capable-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers)
[![Mobile](https://img.shields.io/badge/Mobile-Optimized-orange.svg)](https://developers.google.com/web/fundamentals/design-and-ux/responsive/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![inkdrop Preview](assets/screenshots/inkdrop-preview.png)

*Clean, minimalist interface designed for distraction-free note-taking*

## ✨ Features

### 🚀 **Core Functionality**
- **Instant Note Creation** - Start writing immediately with auto-save
- **Real-time Search** - Find notes instantly as you type
- **Bulk Operations** - Select, export, or delete multiple notes at once
- **Smart Export** - Download notes as organized text archives
- **Offline Support** - Works completely offline with PWA technology

### 📱 **Mobile-First Design**
- **Responsive Layout** - Perfect on phones, tablets, and desktops
- **Touch Optimized** - Designed for mobile interaction
- **High-Quality Icons** - Crisp at all resolutions with proper safe areas
- **Fast Performance** - Lightweight and optimized for mobile networks

### 🎨 **User Experience**
- **Dark Theme** - Easy on the eyes with minimalist design
- **No Distractions** - Clean interface focused on writing
- **Keyboard Shortcuts** - Power user features for efficiency
- **Custom Modals** - Native-feeling confirmation dialogs

## 🏗️ **Technical Highlights**

### ⚡ **Performance**
- **22KB Total Size** (gzipped) - Lightning fast loading
- **Debounced Operations** - Smooth typing and search experience
- **Intelligent Caching** - Smart offline functionality
- **Memory Efficient** - Handles large notes without lag

### 🔧 **Architecture**
- **Vanilla JavaScript** - No frameworks, maximum performance
- **Progressive Web App** - Installable with native app features
- **Service Worker** - Advanced caching and offline support
- **Local Storage** - Your data stays private and secure

### 🛡️ **Security & Privacy**
- **Client-Side Only** - No servers, no tracking, no data collection
- **CSP Headers** - Content Security Policy protection
- **Input Validation** - XSS protection and data integrity
- **Graceful Error Handling** - Robust against corrupted data

## 📁 Project Structure

```
inkdrop/
├── index.html              # Main application entry point
├── src/
│   ├── app.js              # Core application logic
│   └── app.css             # Styles and responsive design
├── assets/
│   ├── icons/              # PWA icons (32px, 192px, 512px)
│   └── screenshots/        # App preview images
├── sw.js                   # Service worker for offline support
├── app.manifest.json       # PWA manifest
├── browserconfig.xml       # Windows tile configuration
├── robots.txt              # SEO directives
├── README.md               # Project documentation
├── LICENSE                 # MIT License
└── .gitignore              # Git ignore rules
```

## 🚀 Quick Start

### **Option 1: Direct Use**
1. Visit the live app: [inkdrop.netlify.app](https://inkdrop.netlify.app)
2. Start writing notes immediately
3. Install as PWA for native app experience

### **Option 2: Local Development**
```bash
# Clone the repository
git clone https://github.com/yourusername/inkdrop.git
cd inkdrop

# Serve locally (any static server)
python -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000

# Open http://localhost:8000
```

## 📱 Installation

### **Mobile (iOS/Android)**
1. Open in Safari/Chrome
2. Tap "Add to Home Screen"
3. Enjoy native app experience

### **Desktop (Chrome/Edge/Firefox)**
1. Click install icon in address bar
2. Or use browser menu "Install inkdrop"
3. Launch from desktop/start menu

## 🎯 Usage

### **Basic Operations**
- **Create Note**: Click "+" or use Ctrl+N
- **Search Notes**: Type in search box (Ctrl+F)
- **Edit Note**: Click any note to open editor
- **Auto-Save**: Notes save automatically as you type

### **Bulk Operations**
- **Select Mode**: Click select icon in header
- **Select All**: Choose all notes at once
- **Export**: Download selected notes as archive
- **Delete**: Remove multiple notes with confirmation

### **Keyboard Shortcuts**
- `Ctrl+N` - New note
- `Ctrl+F` - Focus search
- `Ctrl+S` - Manual save (auto-save is default)
- `Escape` - Close modals/exit selection mode

## 📸 Screenshots

### **Desktop Experience**
![inkdrop Desktop](assets/screenshots/inkdrop-preview.png)
*Clean, minimalist interface optimized for focus and productivity*

### **Mobile Experience**
The app automatically adapts to mobile devices with:
- Touch-optimized interface
- Compact bulk selection bar
- Responsive typography
- Native app feel when installed as PWA

## 🔧 Technical Details

### **Browser Support**
- Chrome 80+ ✅
- Firefox 75+ ✅
- Safari 13+ ✅
- Edge 80+ ✅

### **PWA Features**
- Offline functionality
- App shortcuts (New note, Search)
- File handling (.txt, .md files)
- Share target integration
- Background sync ready

### **Performance Metrics**
- **First Contentful Paint**: <0.5s
- **Time to Interactive**: <1s
- **Lighthouse Score**: 100/100
- **Bundle Size**: 74KB uncompressed, 22KB gzipped

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### **Development Setup**
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for truly simple, fast note-taking
- Built with modern web standards and progressive enhancement
- Designed for privacy-conscious users who want local-first applications

---

**Made with ❤️ for note-takers who value simplicity and speed**
