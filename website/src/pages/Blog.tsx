import './Blog.css'

const POSTS = [
  {
    category: 'Trend Reports',
    title: 'Summer 2026 Fashion Trends: What\'s Hot and What\'s Not',
    excerpt: 'From pastel linens to oversized silhouettes — here\'s what the fashion world is predicting for this summer season.',
    readTime: '5 min read',
    date: 'Aug 10, 2026',
    image: 'trend-report-1',
  },
  {
    category: 'Style Tips',
    title: 'How to Build a Capsule Wardrobe That Actually Works',
    excerpt: 'Less is more. Learn how to curate 25 pieces that mix and match into 100+ outfits for every occasion.',
    readTime: '7 min read',
    date: 'Aug 5, 2026',
    image: 'capsule-wardrobe',
  },
  {
    category: 'AI & Fashion',
    title: 'Why AI Outfit Recommendations Are More Accurate Than You Think',
    excerpt: 'A behind-the-scenes look at how machine learning understands color theory, body proportions, and personal style.',
    readTime: '6 min read',
    date: 'Jul 28, 2026',
    image: 'ai-fashion',
  },
  {
    category: 'Weather & Style',
    title: 'The Complete Guide to Dressing for Indian Monsoon',
    excerpt: 'Humidity, sudden downpours, and sticky heat — here\'s how to stay stylish (and dry) through the rainy season.',
    readTime: '4 min read',
    date: 'Jul 15, 2026',
    image: 'monsoon-style',
  },
  {
    category: 'Style Quiz',
    title: 'What\'s Your Fashion Personality? Take the Quiz',
    excerpt: 'Minimalist, bohemian, street-style rebel, or classic elegant? Find out which style archetype matches your wardrobe.',
    readTime: '3 min read',
    date: 'Jul 8, 2026',
    image: 'style-quiz',
  },
  {
    category: 'Wardrobe Hacks',
    title: '10 Wardrobe Organization Tricks You\'ll Actually Use',
    excerpt: 'From color-coded shelves to seasonal rotation — simple hacks that make getting dressed in the morning effortless.',
    readTime: '5 min read',
    date: 'Jun 22, 2026',
    image: 'wardrobe-hacks',
  },
]

function BlogPage() {
  return (
    <div className="blog-page">
      {/* Header */}
      <section className="page-header">
        <div className="container">
          <div className="section-label">Blog</div>
          <h1 className="page-title">Style insights,<br /><em className="serif-accent">trends & tips</em></h1>
          <p className="page-subtitle mx-auto">Fashion advice, trend reports, and AI-powered styling tips to help you dress your best.</p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="section">
        <div className="container">
          <div className="featured-post">
            <div className="featured-post-image">
              <div className="placeholder featured-placeholder">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span>Featured Article</span>
              </div>
            </div>
            <div className="featured-post-content">
              <div className="featured-tag">Featured</div>
              <h2 className="featured-title">
                <a href="#">Summer 2026 Fashion Trends: What's Hot and What's Not</a>
              </h2>
              <p className="featured-excerpt">
                From pastel linens to oversized silhouettes — here's what the fashion world is predicting for this summer season. We break down the trends that matter and the ones you can safely ignore.
              </p>
              <div className="featured-meta">
                <span>By Look AI Team</span>
                <span>·</span>
                <span>Aug 10, 2026</span>
                <span>·</span>
                <span>8 min read</span>
              </div>
              <a href="#" className="featured-cta">Read Article →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Post Grid */}
      <section className="section">
        <div className="container">
          <div className="blog-grid">
            {POSTS.map((post) => (
              <article key={post.title} className="blog-card">
                <div className="blog-card-image">
                  <div className="placeholder">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                    <span>{post.category}</span>
                  </div>
                </div>
                <div className="blog-card-content">
                  <div className="blog-card-category">{post.category}</div>
                  <h3 className="blog-card-title">
                    <a href="#">{post.title}</a>
                  </h3>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                  <div className="blog-card-meta">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section section-bg">
        <div className="container">
          <div className="newsletter-box reveal">
            <div className="newsletter-content">
              <div className="section-label">Stay in the Loop</div>
              <h2 className="newsletter-title">Get style tips<br /><em className="serif-accent">in your inbox</em></h2>
              <p className="newsletter-desc">Weekly fashion insights, trend reports, and AI styling tips. No spam, unsubscribe anytime.</p>
            </div>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-input"
                required
              />
              <button type="submit" className="btn btn-primary">Subscribe</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default BlogPage
