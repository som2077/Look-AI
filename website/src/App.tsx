import { useEffect, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'

/* ─── Data ──────────────────────────────────────────────── */

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
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </svg>
    ),
    title: 'Weather Integration',
    desc: 'Live weather data synced with your location. Our Comfort Score suggests the right fabric weight and breathability.',
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
    title: 'Style Score',
    desc: 'Track your fashion streak, view your circular Style Score (0–100), and unlock achievement badges as you level up.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Snap a Photo',
    desc: 'Take a picture of any clothing item or use a photo from your gallery. Our AI works instantly.',
  },
  {
    num: '02',
    title: 'AI Analyzes It',
    desc: 'Look AI detects the category, occasion, fabric, and colors — then matches it to your body type.',
  },
  {
    num: '03',
    title: 'Get Your Look',
    desc: 'Receive a complete outfit recommendation optimized for today\'s weather and your schedule.',
  },
]

const AI_POINTS = [
  { label: 'Body Type Analysis', desc: 'Tailored to your unique shape and measurements' },
  { label: 'Occasion Matching', desc: 'Formal, casual, athleisure — your AI knows the context' },
  { label: 'Color Coordination', desc: 'Harmonious palettes pulled from your actual wardrobe' },
]

const WEATHER_POINTS = [
  { label: 'Comfort Score Algorithm', desc: 'Temperature × Humidity × Wind = your comfort rating' },
  { label: 'Fabric Recommendations', desc: 'Cotton, wool, or layers — matched to real-time conditions' },
  { label: '10-Minute Cache', desc: 'Fresh forecast data without burning through API limits' },
]

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Fashion Blogger', text: 'Look AI completely changed how I plan outfits. The weather integration is brilliant — no more sweating in the wrong clothes!', rating: 5 },
  { name: 'Arjun K.', role: 'Software Engineer', text: 'I used to spend 15 minutes every morning deciding what to wear. Now it takes 30 seconds. The AI really gets my style.', rating: 5 },
  { name: 'Meera D.', role: 'College Student', text: 'The Style Score gamification is addictive! I actually enjoy organizing my wardrobe now. Plus the masonry view is gorgeous.', rating: 5 },
]

const FAQ_ITEMS = [
  {
    q: 'How does the AI outfit recommendation work?',
    a: 'Look AI combines your wardrobe data, body type profile, local weather conditions, and upcoming schedule to generate outfit suggestions. Our AI understands color theory, occasion dress codes, and seasonal layering to create looks that actually work.',
  },
  {
    q: 'Is Look AI free to use?',
    a: 'Look AI offers a generous free tier that includes basic outfit recommendations and wardrobe digitization. For unlimited scans, advanced AI features, and priority recommendations, we offer affordable Pro plans.',
  },
  {
    q: 'How accurate is the clothing detection?',
    a: 'Our AI accurately detects clothing category, occasion, and dominant colors with over 90% accuracy. Background removal uses the same technology as remove.bg for clean, professional results.',
  },
  {
    q: 'Is there a limit on wardrobe items?',
    a: 'Free users can add up to 30 items to their digital wardrobe. Pro users get unlimited items, batch scanning, and advanced categorization features.',
  },
  {
    q: 'How does weather integration work?',
    a: 'Look AI uses Open-Meteo (a free, open-source weather API) to fetch forecasts based on your location. Our custom Comfort Score algorithm combines temperature, humidity, and wind speed to recommend the right fabric weight and breathability.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'Absolutely. Your wardrobe photos and personal data are encrypted and stored securely. We use Clerk for authentication and Supabase with Row-Level Security policies. Your data is never shared with third parties.',
  },
]

/* ─── Components ────────────────────────────────────────── */

function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-glow" />
      <div className="container hero-inner">
        <div className="hero-text">
          <div className="section-label">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            AI-Powered Fashion
          </div>
          <h1>Your personal<br /><em className="serif-accent">AI stylist</em></h1>
          <p className="hero-subtitle">
            Digitize your wardrobe, analyze your body type, and get a complete daily look — recommended by AI, matched to your style, and synced to the weather outside.
          </p>
          <div className="hero-badges">
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="store-badge google">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
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
            <div className="store-badge apple coming-soon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="store-badge-text">
                <span className="store-badge-sub">Coming Soon</span>
                <span className="store-badge-main">App Store</span>
              </div>
            </div>
          </div>
          <div className="hero-social-proof">
            <div className="proof-avatars">
              <div className="proof-avatar" style={{ background: '#6366f1' }}>P</div>
              <div className="proof-avatar" style={{ background: '#8b5cf6' }}>A</div>
              <div className="proof-avatar" style={{ background: '#a855f7' }}>M</div>
              <div className="proof-avatar" style={{ background: '#ec4899' }}>S</div>
            </div>
            <span className="proof-text">Loved by <strong>5,000+</strong> users ⭐ 4.9</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-mock-glow" />
          <div className="hero-phone">
            <div className="phone-screen">
              <div className="phone-status">
                <span>TUE · 21°C</span>
                <span className="phone-notch" />
              </div>
              <div className="phone-look-label">
                <span>Today's Look</span>
                <span className="tag-chip">SCORE 88</span>
              </div>
              <div className="phone-outfit">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 6.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
                  <path d="M12 6.5 3 13h3l6-4.5L18 13h3L12 6.5Z" />
                  <path d="M5 13v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                </svg>
                <span>Outfit preview</span>
                <div className="phone-score">
                  <div className="score-ring" />
                  <span className="score-ring-num">88</span>
                  <span className="score-ring-label">Score</span>
                </div>
              </div>
              <div className="phone-tags">
                <span className="tag-chip">Casual</span>
                <span className="tag-chip">Linen</span>
                <span className="tag-chip">21°C</span>
              </div>
            </div>
          </div>
          <div className="hero-widget wa">
            <span className="dot" />
            COMFORT 87
          </div>
          <div className="hero-widget wb">
            <span className="dot warm" />
            STYLE +2 · STREAK 12
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="section">
      <div className="container">
        <div className="text-center reveal">
          <div className="section-label">Features</div>
          <h2 className="section-title">Everything you need to<br /><em className="serif-accent">dress smarter</em></h2>
          <p className="section-subtitle mx-auto">From AI-powered recommendations to weather-synced outfits — every part of your daily style, handled.</p>
        </div>
        <div className="features-grid reveal">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`feature-card ${i === 3 ? 'feature-card-wide' : ''}`}>
              {i === 3 ? (
                <>
                  <div>
                    <div className="feature-icon">{f.icon}</div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                  <div className="feature-score-visual">
                    <div className="feature-score-ring" />
                    <div className="feature-score-center">
                      <strong>87</strong>
                      <span>Style Score</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="section section-bg">
      <div className="container">
        <div className="text-center reveal">
          <div className="section-label">How It Works</div>
          <h2 className="section-title">Three steps to your<br /><em className="serif-accent">perfect outfit</em></h2>
          <p className="section-subtitle mx-auto">No complicated setup. Just snap, let AI do the work, and step out looking great.</p>
        </div>
        <div className="steps-grid reveal">
          {STEPS.map((s) => (
            <div key={s.num} className="step-card">
              <div className="step-num">{s.num}</div>
              <div className="step-visual">
                <div className="placeholder">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <path d="M12 18h.01" />
                  </svg>
                </div>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AIDeepDive() {
  return (
    <section id="ai-deep-dive" className="section">
      <div className="container">
        {/* Block 1 */}
        <div className="ai-split reveal">
          <div className="ai-split-text">
            <div className="section-label">The AI Behind Your Style</div>
            <h2 className="section-title">Intelligent fashion<br /><em className="serif-accent">analysis</em></h2>
            <p className="section-subtitle">Look AI doesn't just pick random clothes — it understands your body, your lifestyle, and the science of color and fabric.</p>
            <ul className="ai-points">
              {AI_POINTS.map((p) => (
                <li key={p.label} className="ai-point">
                  <div className="ai-point-check">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <strong>{p.label}</strong>
                    <span>{p.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="ai-split-visual">
            <div className="placeholder ai-screenshot">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
              <span>AI Analysis Screenshot</span>
            </div>
          </div>
        </div>

        {/* Block 2 */}
        <div className="ai-split reverse reveal">
          <div className="ai-split-text">
            <div className="section-label">Weather Intelligence</div>
            <h2 className="section-title">Weather-synced<br /><em className="serif-accent">comfort</em></h2>
            <p className="section-subtitle">Every recommendation is optimized for real-time weather conditions at your exact location.</p>
            <ul className="ai-points">
              {WEATHER_POINTS.map((p) => (
                <li key={p.label} className="ai-point">
                  <div className="ai-point-check">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <strong>{p.label}</strong>
                    <span>{p.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="ai-split-visual">
            <div className="placeholder ai-screenshot">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
              <span>Weather Integration Screenshot</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section className="section section-bg">
      <div className="container">
        <div className="text-center reveal">
          <div className="section-label">Testimonials</div>
          <h2 className="section-title">Loved by people who<br /><em className="serif-accent">dress better</em></h2>
        </div>
        <div className="testimonials-grid reveal">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="testimonial-card">
              <div className="testimonial-stars">
                {'★'.repeat(t.rating)}
              </div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: '#6366f1' }}>
                  {t.name[0]}
                </div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <section id="faq" className="section">
      <div className="container">
        <div className="text-center reveal">
          <div className="section-label">FAQ</div>
          <h2 className="section-title">Frequently asked<br /><em className="serif-accent">questions</em></h2>
        </div>
        <div className="faq-list reveal">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`faq-item ${openIdx === i ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                <span>{item.q}</span>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="faq-answer">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTABanner() {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-panel reveal">
          <h2>Start dressing <em className="serif-accent">smarter</em> today</h2>
          <p className="cta-subtitle">Join thousands of users who let AI handle their daily outfit decisions.</p>
          <div className="cta-badges">
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
          <div className="store-badge apple large coming-soon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="store-badge-text">
              <span className="store-badge-sub">Coming Soon</span>
              <span className="store-badge-main">App Store</span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">Look AI</div>
            <p>Your Personal AI Stylist. Digitize your wardrobe, get daily outfit recommendations, and dress smarter — powered by AI.</p>
          </div>
          <div className="footer-links">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#ai-deep-dive">AI Technology</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Use</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Look AI. All rights reserved.</span>
          <div className="footer-social">
            <a href="#" aria-label="Twitter">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a href="#" aria-label="TikTok">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── App ───────────────────────────────────────────────── */

function App() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <AIDeepDive />
        <Testimonials />
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}

export default App
