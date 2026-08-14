import { Link } from 'react-router-dom'
import './HowItWorks.css'

const STEPS = [
  {
    num: '01',
    title: 'Snap a Photo',
    desc: 'Take a picture of any clothing item or use a photo from your gallery. Our AI works instantly.',
    details: [
      'Use your phone camera or pick from your gallery',
      'No special setup needed — just point and shoot',
      'AI automatically detects the clothing item in any background',
      'Background removed automatically for clean results',
    ],
    visualLabel: 'Camera / Gallery',
  },
  {
    num: '02',
    title: 'AI Analyzes It',
    desc: 'Look AI detects the category, occasion, fabric, and colors — then matches it to your body type.',
    details: [
      'Clothing category detection (top, bottoms, footwear, dress, ethnic, and more)',
      'Color analysis — dominant color, secondary colors, color hex codes',
      'Fabric guess, fit type, sleeve style, neck type — all auto-detected',
      'Matched to your body type profile for personalized fit suggestions',
    ],
    visualLabel: 'AI Analysis',
  },
  {
    num: '03',
    title: 'Get Your Look',
    desc: 'Receive a complete outfit recommendation optimized for today\'s weather and your schedule.',
    details: [
      'Complete outfit: top + bottom + footwear + accessories',
      'Weather-optimized — fabric weight and layering based on real-time conditions',
      'Occasion-matched — formal, casual, party, workout, date night, and more',
      'Style Score included — see how your outfit scores before you wear it',
    ],
    visualLabel: 'Outfit Recommendation',
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

function HowItWorksPage() {
  return (
    <div className="how-it-works-page">
      {/* Header */}
      <section className="page-header section-bg">
        <div className="container">
          <div className="section-label">How It Works</div>
          <h1 className="page-title">Three steps to your<br /><em className="serif-accent">perfect outfit</em></h1>
          <p className="page-subtitle mx-auto">No complicated setup. Just snap, let AI do the work, and step out looking great.</p>
        </div>
      </section>

      {/* Steps */}
      <section className="section">
        <div className="container">
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.num} className="step-card-large">
                <div className="step-num-big">{s.num}</div>
                <div className="step-visual-large">
                  <div className="placeholder">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <path d="M12 18h.01" />
                    </svg>
                    <span>{s.visualLabel}</span>
                  </div>
                </div>
                <h2 className="step-title-large">{s.title}</h2>
                <p className="step-desc-large">{s.desc}</p>
                <ul className="step-details">
                  {s.details.map((d, i) => (
                    <li key={i} className="step-detail-item">
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

      {/* AI Deep Dive */}
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

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-panel reveal">
            <h2>Start dressing <em className="serif-accent">smarter</em> today</h2>
            <p className="cta-subtitle">Join thousands of users who let AI handle their daily outfit decisions.</p>
            <div className="cta-badges">
              <Link to="/pricing" className="btn btn-primary btn-large">View Pricing</Link>
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="store-badge google large">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path d="M3.18 23.76c.37.2.8.2 1.2-.02l11.4-6.58-2.5-2.5-10.1 9.1z" fill="#EA4335" />
                  <path d="M22.07 10.18L19.6 8.78l-2.82 2.82 2.82 2.82 2.5-1.42c.71-.41.71-1.41-.03-2z" fill="#FBBC04" />
                  <path d="M3.18.24C2.8.46 2.5.9 2.5 1.46v21.08c0 .56.3 1 .68 1.22l11.5-11.76L3.18.24z" fill="#4285F4" />
                  <path d="M4.38.22l11.4 6.58-2.5 2.5L3.18.24c.37-.2.83-.22 1.2-.02z" fill="#34A853" />
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

export default HowItWorksPage
