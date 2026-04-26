# 🎬 CinemaScope

![CinemaScope](public/fallback-image-film.jpg)

**CinemaScope** is a cinematic, modern film discovery application designed to provide an immersive browsing experience. Built with performance and premium aesthetics in mind, it leverages real-time data from the TMDB API to let users explore popular films, deep-dive into detailed cast and movie pages, and seamlessly search across a vast database.

---

## ✨ Features

- **Immersive Cinematic UI**: Features a dark, premium aesthetic with full-viewport backdrops, glassmorphism elements, and smooth framer-motion transitions.
- **Fluid Responsiveness**: Utilizes CSS `clamp()` functions across the board for typography and layout, ensuring a flawless layout from mobile screens to 4K monitors.
- **Performance Optimized**: Implements route-level code-splitting (lazy loading), aggressive Suspense boundaries, and WebP image optimizations for minimal bundle sizes and fast First Contentful Paint (FCP).
- **Modern Data Fetching**: Powered by SWR with `suspense: true` for concurrent, non-blocking requests and seamless skeleton loading states that prevent Cumulative Layout Shift (CLS).
- **Secure Authentication**: Integrated with Auth0 to protect specific routes (e.g., Profile, Film Details, Compare Tool) while keeping discovery pages (Home, Search) public.
- **Accessible & Keyboard Friendly**: Features horizontal scroll primitives with keyboard navigation, clear `focus-visible` rings, and a `useReducedMotion` hook to respect user OS settings.

## 🛠 Tech Stack

- **Frontend Framework**: React 18 & Vite 6
- **Styling**: Tailwind CSS v4 (Custom Design Tokens)
- **Data Fetching**: SWR & Axios/Fetch
- **Animations**: Framer Motion
- **Authentication**: Auth0
- **External API**: The Movie Database (TMDB) API

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A [TMDB API Key](https://developer.themoviedb.org/docs/getting-started)
- An [Auth0](https://auth0.com/) Tenant (for authentication features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cscope.git
   cd cscope
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env
   ```
   *Required Variables:*
   - `VITE_API_KEY`: Your TMDB API Key.
   - `VITE_BASE_URL`: `https://api.themoviedb.org/3`
   - `VITE_AUTH0_DOMAIN`: Your Auth0 tenant domain.
   - `VITE_AUTH0_CLIENT_ID`: Your Auth0 client ID.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```text
src/
├── components/
│   ├── layout/       # App shell components (Navbar, Footer)
│   ├── sections/     # Major page sections (Hero, HeroCarousel, GenreRow)
│   └── ui/           # Reusable primitives (FilmCard, LazyImage, Skeletons)
├── hooks/            # Custom React hooks (useReducedMotion, useRecentlyViewed)
├── lib/              # Utilities, constants, and API fetchers
├── pages/            # Route-level components (lazy-loaded)
└── styles/           # Global CSS and Tailwind v4 design tokens
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/YOUR_USERNAME/cscope/issues) if you want to contribute.

## 📝 License

This project is licensed under the MIT License.
