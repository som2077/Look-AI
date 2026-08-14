import { Link } from 'react-router-dom'
import './Pricing.css'

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for trying out Look AI and digitizing your first wardrobe items.',
    features: [
      'Up to 30 wardrobe items',
      'Daily AI outfit recommendations',
      'Basic weather integration',
      'Style score (basic)',
      'Standard support',
    ],
    highlight: false,
    cta: 'Get Started',
    ctaLink: '/how-it-works',
  },
  {
    name: 'Pro',
    price: '₹299',
    period: 'per month',
    description: 'For fashion enthusiasts who want the full AI-powered styling experience.',
    features: [
      'Unlimited wardrobe items',
      'Advanced AI outfit recommendations',
      'Full weather integration + Comfort Score',
      'Style Score with gamification & streaks',
      'Achievement badges',
      'Priority support',
      'Batch scanning (up to 10 photos at once)',
    ],
    highlight: true,
    cta: 'Start Pro Trial',
    ctaLink: '/how-it-works',
  },
  {
    name: 'Family',
    price: '₹499',
    period: 'per month',
    description: 'Share the style love. Up to 5 family members with individual wardrobes and recommendations.',
    features: [
      'Everything in Pro, for up to 5 members',
      'Individual wardrobes & style profiles per member',
      'Shared outfit recommendations for family events',
      'Family streak challenges',
      'Priority + dedicated support',
    ],
    highlight: false,
    cta: 'Try Family',
    ctaLink: '/how-it-works',
  },
]

function PricingPage() {
  return (
    <div className="pricing-page">
      {/* Header */}
      <section className="page-header">
        <div className="container">
          <div className="section-label">Pricing</div>
          <h1 className="page-title">Simple, transparent<br /><em className="serif-accent">pricing</em></h1>
          <p className="page-subtitle mx-auto">Start free, upgrade when you need more. No hidden fees, cancel anytime.</p>

          {/* Toggle Annual/Monthly */}
          <div className="pricing-toggle">
            <span className="toggle-label">Monthly</span>
            <button className="toggle-switch" aria-label="Toggle billing period">
              <span className="toggle-thumb" />
            </button>
            <span className="toggle-label">Annual<span className="toggle-badge">Save 20%</span></span>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="section">
        <div className="container">
          <div className="pricing-grid">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`pricing-card ${plan.highlight ? 'pricing-card-highlight' : ''}`}>
                {plan.highlight && <div className="pricing-card-badge">Most Popular</div>}
                <div className="pricing-card-header">
                  <h2 className="pricing-card-name">{plan.name}</h2>
                  <div className="pricing-card-price">
                    <span className="pricing-card-amount">{plan.price}</span>
                    <span className="pricing-card-period">/{plan.period}</span>
                  </div>
                  <p className="pricing-card-desc">{plan.description}</p>
                </div>
                <hr className="pricing-card-divider" />
                <ul className="pricing-card-features">
                  {plan.features.map((f, i) => (
                    <li key={i} className="pricing-card-feature">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="feature-check">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="pricing-card-cta">
                  <Link to={plan.ctaLink} className={`btn btn-${plan.highlight ? 'primary' : 'secondary'}`}>
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ mini */}
      <section className="section section-bg">
        <div className="container">
          <div className="text-center reveal">
            <div className="section-label">FAQ</div>
            <h2 className="section-title">Pricing questions?<br /><em className="serif-accent">We got you.</em></h2>
          </div>
          <div className="pricing-faq">
            {[
              {
                q: 'Can I switch plans later?',
                a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately.',
              },
              {
                q: 'Is there a free trial for Pro?',
                a: 'Yes! You get a 7-day free trial of Pro when you first upgrade. No charges until the trial ends.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit/debit cards, UPI, and net banking via Razorpay.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Absolutely. Cancel anytime from your account settings. Your data stays intact even after cancellation.',
              },
            ].map((item, i) => (
              <div key={i} className="pricing-faq-item">
                <h3 className="pricing-faq-q">{item.q}</h3>
                <p className="pricing-faq-a">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-panel reveal">
            <h2>Ready to dress <em className="serif-accent">smarter</em>?</h2>
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
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PricingPage
