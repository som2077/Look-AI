import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      {/* Logo */}
      <a href="/" className="navbar-logo">
        <img src={logo} alt="Look AI" />
      </a>

      {/* Nav Links */}
      <ul className="navbar-links">
        <li><a href="/">Home</a></li>
        <li><a href="/manage-subscription">Manage Subscription</a></li>
      </ul>

      {/* App Buttons */}
      <div className="navbar-apps">
        {/* Apple - Coming Soon */}
        <div className="app-btn apple coming-soon" title="Coming Soon">
          <div className="coming-soon-badge">Coming Soon</div>
          <div className="app-btn-inner">
            <svg viewBox="0 0 24 24" fill="currentColor" className="store-icon">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="app-btn-text">
              <span className="app-btn-sub">Download on the</span>
              <span className="app-btn-main">App Store</span>
            </div>
          </div>
        </div>

        {/* Google Play - Active */}
        <a
          href="https://play.google.com/store"
          target="_blank"
          rel="noopener noreferrer"
          className="app-btn google"
        >
          <div className="app-btn-inner">
            <svg viewBox="0 0 24 24" fill="none" className="store-icon google-play-icon">
              <path d="M3.18 23.76c.37.2.8.2 1.2-.02l11.4-6.58-2.5-2.5-10.1 9.1z" fill="#EA4335"/>
              <path d="M22.07 10.18L19.6 8.78l-2.82 2.82 2.82 2.82 2.5-1.42c.71-.41.71-1.41-.03-2z" fill="#FBBC04"/>
              <path d="M3.18.24C2.8.46 2.5.9 2.5 1.46v21.08c0 .56.3 1 .68 1.22l11.5-11.76L3.18.24z" fill="#4285F4"/>
              <path d="M4.38.22l11.4 6.58-2.5 2.5L3.18.24c.37-.2.83-.22 1.2-.02z" fill="#34A853"/>
            </svg>
            <div className="app-btn-text">
              <span className="app-btn-sub">GET IT ON</span>
              <span className="app-btn-main">Google Play</span>
            </div>
          </div>
        </a>
      </div>
    </nav>
  )
}
