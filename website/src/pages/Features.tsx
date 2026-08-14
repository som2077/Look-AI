import { Link } from 'react-router-dom'
import './Features.css'

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4v1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-4" />
        <path d="M8 2a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h4" />
        <rect x="4" y="11" width="16" height="11" rx="2" />
        <path d="M9 15h6" />
        <path d="M9 18h4" />
      </svg>
    ),
    title: 'AI Outfit Recommendations',
    desc: 'Get daily outfit suggestions mapped to your personal style, body type, and local weather — every single morning.',
    details: [
      'Morning daily recommendations based on your wardrobe, body type, weather, and schedule',
      'Color coordination and fabric matching powered by fashion AI',
      'Occasion-aware suggestions — formal, casual, party, workout, and more',
      'Learn your preferences over time — the more you use it, the better it gets',
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
    title: 'Digital Wardrobe',
    desc: 'Snap a photo — AI detects category, occasion, and colors. Background removed automatically. Your entire closet, digitized.',
    details: [
      'AI-powered clothing detection — category, colors, fabric, fit, and style tags',
      'Automatic background removal for clean, professional wardrobe images',
      '41 clothing categories with rich metadata: occasion, season, formality, versatility',
      'Sort, filter, and search your wardrobe by color, category, brand, or style',
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </svg>
    ),
    title: 'Weather Integration',
    desc: 'Live weather data synced with your location. Our Comfort Score suggests the right fabric weight and breathability.',
    details: [
      'Real-time weather from Open-Meteo — temperature, humidity, wind speed, conditions',
      'Custom Comfort Score algorithm: Temperature × 0.5 + Humidity × 0.3 + Wind × 0.2',
      'Dynamic fabric recommendations — cotton for heat, wool for cold, layers for variable conditions',
      '10-minute cached forecast data — fresh without burning API limits',
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9Z" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9Z" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
    title: 'Style Score & Gamification',
    desc: 'Track your fashion streak, view your circular Style Score (0–100), and unlock achievement badges as you level up.',
    details: [
      'Daily Style Score (0–100) based on outfit choices, variety, and consistency',
      'Streak tracking — log outfits daily to build and maintain your streak',
      'Achievement badges for milestones — 7-day streak, 100 outfits logged, seasonal challenges',
      'Visual score ring animation — see your progress at a glance',
    ],
  },
]

function FeaturesPage() {
  return (
    <div className="features-page">
      {/* Header */}
      <section className="page-header">
        <div className="container">
          <div className="section-label">Features</div>
          <h1 className="page-title">Everything you need to<br /><em className="serif-accent">dress smarter</em></h1>
          <p className="page-subtitle">From AI-powered recommendations to weather-synced outfits — every part of your daily style, handled.</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section">
        <div className="container">
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature-detail-card">
                <div className="feature-detail-icon">{f.icon}</div>
                <h2 className="feature-detail-title">{f.title}</h2>
                <p className="feature-detail-desc">{f.desc}</p>
                <ul className="feature-detail-list">
                  {f.details.map((d, j) => (
                    <li key={j} className="feature-detail-item">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="check-icon">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-panel">
            <h2>Start dressing <em className="serif-accent">smarter</em> today</h2>
            <p className="cta-subtitle">Join thousands of users who let AI handle their daily outfit decisions.</p>
            <div className="cta-badges">
              <Link to="/pricing" className="btn btn-primary btn-large">View Pricing</Link>
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="store-badge google large">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path d="M3.18 23.76c.37.2.8.2 1.2-.02l11.4-6.58-2.5-2.5-10.1 9.1z" fill="#EA4335"/>
                  <path d="M22.07 10.18L19.6 8.78l-2.82 2.82 2.82 2.82 2.5-1.42c.71-.41.71-1.41-.03-2z" fill="#FBBC04"/>
                  <path d="M3.18.24C2.8.46 2.5.9 2.5 1.46v21.08c0 .56.3 1 .68 1.22l11.5-11.76L3.18.24z" fill="#4285F4"/>
                  <path d="M4.38.22l11.4 6.58-2.5 2.5L3.18.24c.37-.2.83-.22 1.2-.02z" fill="#34A853"/>
                </svg>
                <div className="store-badge-text">
                  <span className="store-badge-sub">GET IT ON</span>
                  <span className="store-badge-main">Google Play</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default FeaturesPage
