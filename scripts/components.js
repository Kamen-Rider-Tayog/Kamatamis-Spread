const HEADER_TEMPLATE = `
  <header class="navbar" role="banner">
    <div class="navbar-container">
      <a href="index.html" class="navbar-brand" aria-label="Kamatamis Spread - Home">
        <span class="brand-logo"></span>
      </a>
      <nav class="navbar-nav" role="navigation" aria-label="Main navigation">
        <ul class="navbar-nav">
          <li><a href="index.html" class="navbar-link">Home</a></li>
          <li><a href="impact.html" class="navbar-link">Our Story</a></li>
          <li><a href="products.html" class="navbar-link">Products</a></li>
          <li><a href="process.html" class="navbar-link">Production</a></li>
          <li><a href="contact.html" class="navbar-link">Contact</a></li>
        </ul>
      </nav>
      <div class="navbar-actions">
        <button class="navbar-cart-btn" aria-label="Shopping cart">
          <i data-lucide="shopping-cart" class="lucide-icon"></i>
          <span class="cart-badge" style="display: none;"></span>
        </button>
        <a href="#order-form" class="btn btn-secondary btn-sm">Pre-Order</a>
        <button class="navbar-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="navbar-nav">
          <span class="navbar-toggle-icon" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </header>
`;

const FOOTER_TEMPLATE = `
  <footer class="footer" role="contentinfo">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <span class="brand-logo"></span>
            <span class="brand-product">Kamatamis Spread</span>
          </div>
          <p class="footer-tagline">Where Every Tomato Counts</p>
          <p class="footer-text">A F.A.R.M. enterprise transforming surplus tomatoes into premium spreads. Supporting Bukidnon farmers, reducing food waste, delivering nutrition.</p>
        </div>
        <nav class="footer-nav" aria-label="Quick links">
          <h3 class="footer-title">Quick Links</h3>
          <ul class="footer-links">
            <li><a href="index.html" class="footer-link">Home</a></li>
            <li><a href="impact.html" class="footer-link">Our Story</a></li>
            <li><a href="products.html" class="footer-link">Products</a></li>
            <li><a href="process.html" class="footer-link">Production</a></li>
            <li><a href="contact.html" class="footer-link">Contact</a></li>
          </ul>
        </nav>
        <nav class="footer-nav" aria-label="Products">
          <h3 class="footer-title">Products</h3>
          <ul class="footer-links">
            <li><a href="products.html" class="footer-link">Classic</a></li>
            <li><a href="products.html" class="footer-link">Spicy-Chili</a></li>
            <li><a href="products.html" class="footer-link">Details</a></li>
            <li><a href="products.html" class="footer-link">Pricing</a></li>
          </ul>
        </nav>
        <div class="footer-nav">
          <h3 class="footer-title">Connect</h3>
          <ul class="footer-links">
            <li class="footer-link"><i data-lucide="map-pin" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i> Cavite State University</li>
            <li class="footer-link"><i data-lucide="mail" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i> farm.kamatamis@email.com</li>
            <li class="footer-link"><i data-lucide="phone" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i> +63 9XX XXX XXXX</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copyright">&copy; 2024 F.A.R.M. - Kamatamis Spread. All rights reserved.</p>
        <div class="footer-bottom-right">
          <div class="brand-trademark">
            <span>Made with</span>
            <i data-lucide="heart" class="heart-icon"></i>
            <span>by Kagame</span>
          </div>
          <div class="footer-social">
            <a href="#" class="footer-social-link" aria-label="Facebook"><i data-lucide="globe" class="lucide-icon"></i></a>
            <a href="#" class="footer-social-link" aria-label="Instagram"><i data-lucide="share-2" class="lucide-icon"></i></a>
            <a href="#" class="footer-social-link" aria-label="Email"><i data-lucide="mail" class="lucide-icon"></i></a>
          </div>
        </div>
      </div>
    </div>
  </footer>
`;

class ComponentLoader {
  constructor() {
    this.init();
  }

  init() {
    this.loadHeader();
    this.loadFooter();
  }

  loadHeader() {
    const container = document.getElementById('app-header');
    if (!container) return;
    container.innerHTML = HEADER_TEMPLATE;
    if (window.lucide) lucide.createIcons();
    this.bindNavbarEvents();
  }

  loadFooter() {
    const container = document.getElementById('app-footer');
    if (!container) return;
    container.innerHTML = FOOTER_TEMPLATE;
    if (window.lucide) lucide.createIcons();
  }

  bindNavbarEvents() {
    const toggle = document.querySelector('.navbar-toggle');
    const navLinks = document.querySelector('.navbar-nav');
    const currentPage = this.getCurrentPage();

    this.setActiveLink(currentPage);

    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        const isActive = navLinks.classList.toggle('active');
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-expanded', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
      });
    }

    document.querySelectorAll('.navbar-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks?.classList.remove('active');
        toggle?.classList.remove('active');
        toggle?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks?.classList.contains('active')) {
        navLinks.classList.remove('active');
        toggle?.classList.remove('active');
        toggle?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggle?.focus();
      }
    });

    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) navbar.classList.toggle('scrolled', window.pageYOffset > 50);
    }, { passive: true });
  }

  setActiveLink(page) {
    document.querySelectorAll('.navbar-link').forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
      const href = link.getAttribute('href');
      if (href) {
        const linkPage = href.replace('.html', '').split('/').pop();
        if (linkPage === page || (page === 'index' && linkPage === 'index')) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      }
    });
  }

  getCurrentPage() {
    const path = window.location.pathname;
    return (path.split('/').pop() || 'index.html').replace('.html', '');
  }
}

