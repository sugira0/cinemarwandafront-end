# CINEMA Rwanda Frontend

Modern web application for streaming movies in Rwanda. Built with React and Vite for optimal performance and developer experience.

## Overview

- **Framework**: React 18+
- **Build Tool**: Vite
- **State Management**: Context API
- **Styling**: CSS modules
- **HTTP Client**: Axios
- **Deployment**: Vercel
- **API Base URL**: `https://cinemarwanda-backend.vercel.app`

## Features

- **User Authentication**: Login, registration, and profile management
- **Content Discovery**: Browse, search, and filter movies
- **Movie Details**: Comprehensive movie information with ratings and reviews
- **Streaming**: High-quality video streaming with adaptive bitrate
- **Watchlist**: Save movies for later viewing
- **Subscriptions**: Multiple subscription tiers with mobile money payment
- **Comments & Ratings**: Community engagement through reviews
- **Push Notifications**: Real-time updates and alerts
- **Multi-language Support**: Internationalization ready
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark Mode**: User-configurable theme
- **Device Management**: Manage streaming devices

## Prerequisites

- Node.js 16+
- npm or yarn

## Installation

```bash
npm install
```

## Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# API Configuration
VITE_API_ORIGIN=https://cinemarwanda-backend.vercel.app

# Firebase (optional)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain

# Application
VITE_APP_NAME=CINEMA Rwanda
VITE_APP_VERSION=1.0.0
```

## Running the App

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` with hot module reloading (HMR).

### Build for Production

```bash
npm run build
```

Optimized production bundle will be created in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Linting

```bash
npm run lint
```

Fix ESLint issues automatically:

```bash
npm run lint:fix
```

## Project Structure

```
cinemarwandafront-end/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── MovieCard.jsx
│   │   ├── VideoPlayer.jsx
│   │   ├── LoginModal.jsx
│   │   ├── Comments.jsx
│   │   └── ...
│   ├── pages/            # Page components
│   ├── context/          # Context API providers
│   ├── hooks/            # Custom React hooks
│   ├── api/              # API integration
│   │   └── axios.js      # Axios configuration
│   ├── lib/              # Utility libraries
│   ├── assets/           # Images, icons, fonts
│   ├── App.jsx           # Main App component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static files
├── vite.config.js        # Vite configuration
├── eslint.config.js      # ESLint configuration
└── package.json          # Dependencies
```

## Key Components

### Navbar
Navigation bar with logo, menu, and user account access.

### MovieCard
Reusable card displaying movie poster, title, and rating.

### VideoPlayer
Custom video player with quality selection and playback controls.

### LoginModal
User authentication modal with login and registration tabs.

### Comments
User reviews and ratings section for movies.

### Paywall
Subscription plan selection and payment processing.

## API Integration

All API requests go through configured axios instance pointing to:
```
https://cinemarwanda-backend.vercel.app
```

Authentication via JWT token stored in localStorage.

## Authentication Flow

1. User navigates to login
2. Enter credentials and submit
3. Backend returns JWT token
4. Token stored in localStorage
5. Subsequent requests include Authorization header
6. Token validated for protected routes

## Deployment

Deployed on Vercel. Push to main branch triggers automatic build and deployment.

### Manual Deployment

```bash
npm run build
vercel deploy --prod
```

## Performance Optimization

- **Code Splitting**: Dynamic imports for lazy-loaded routes
- **Image Optimization**: Cloudinary integration for responsive images
- **Caching**: Strategic use of localStorage and session storage
- **CSS Modules**: Scoped styling to prevent conflicts
- **Tree Shaking**: Vite removes unused code in production

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

**API connection errors:**
- Verify `VITE_API_ORIGIN` in `.env.local`
- Check backend is running at configured URL
- Review network tab in browser DevTools

**Build errors:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf dist`
- Check Node.js version: `node --version`

**Styling issues:**
- CSS modules are scoped locally
- Global styles in `src/index.css`
- Use CSS variables for theming

## Development Tips

- Use React DevTools for component debugging
- Network throttling in DevTools for testing slow connections
- Test responsiveness at different breakpoints
- Use browser console for API debugging

## Contributing

Follow established code style and component patterns. Submit pull requests for review before merging to main.

## Support

Refer to [Vite Documentation](https://vitejs.dev) for build tool questions and [React Documentation](https://react.dev) for framework-specific queries.
