import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'
import './Navbar.css'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'AI', href: '#ai-deep-dive' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMobile = () => setMobileOpen(false)

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <a href="/" className="navbar-logo">
        <img src={logo} alt="Look AI" />
      </a>

      {/* Center Nav Links */}
      <ul className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a href={link.href} onClick={closeMobile}>{link.label}</a>
          </li>
        ))}
      </ul>

      {/* Right Side: Download Badge + Hamburger */}
      <div className="navbar-right">
        <a
          href="https://play.google.com/store"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-download-btn"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path d="M3.18 23.76c.37.2.8.2 1.2-.02l11.4-6.58-2.5-2.5-10.1 9.1z" fill="#EA4335"/>
            <path d="M22.07 10.18L19.6 8.78l-2.82 2.82 2.82 2.82 2.5-1.42c.71-.41.71-1.41-.03-2z" fill="#FBBC04"/>
            <path d="M3.18.24C2.8.46 2.5.9 2.5 1.46v21.08c0 .56.3 1 .68 1.22l11.5-11.76L3.18.24z" fill="#4285F4"/>
            <path d="M4.38.22l11.4 6.58-2.5 2.5L3.18.24c.37-.2.83-.22 1.2-.02z" fill="#34A853"/>
          </svg>
          Get the App
        </a>

        {/* Hamburger */}
        <button
          className={`hamburger ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  )
}
