class Hero extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentSlide = 0;
    this.slides = [
      {
        tag: "New Collection",
        title: "Find Your Style,<br>Love Your Look ✨",
        subtitle: "Discover the latest trends in minimalist fashion, high-end accessories, and premium tech layouts.",
        image: "./assets/hero_fashion.jpg",
        buttonText: "Shop Now",
        productId: 1
      },
      {
        tag: "Enthusiast Special",
        title: "Precision Typing,<br>Ice-Blue Backlit 🌌",
        subtitle: "Check out the Aero-75 custom linear keyboard. Pre-lubed, hot-swappable keys in modular frames.",
        image: "./assets/keyboard.jpg",
        buttonText: "Explore Keys",
        productId: 1
      },
      {
        tag: "Studio Acoustics",
        title: "Pristine Sound,<br>Matte White Finish 🎧",
        subtitle: "Audiophile titanium dynamic headphones with royal-blue breathable mesh earcups.",
        image: "./assets/headphones.jpg",
        buttonText: "Explore Audio",
        productId: 2
      }
    ];
    this.intervalTime = 6000;
    this.timer = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.startAutoSlide();
  }

  disconnectedCallback() {
    this.stopAutoSlide();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./components/Hero/Hero.css">
      <section class="hero-carousel">
        <div class="slides-wrapper">
          ${this.slides.map((slide, idx) => `
            <div class="slide ${idx === this.currentSlide ? 'active' : ''}" data-index="${idx}">
              <div class="slide-card">
                <div class="hero-content">
                  <span class="hero-tag">${slide.tag}</span>
                  <h2 class="hero-title">${slide.title}</h2>
                  <p class="hero-subtitle">${slide.subtitle}</p>
                  <button class="shop-btn shop-cta" data-id="${slide.productId}">
                    ${slide.buttonText}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                </div>
                <div class="hero-visual">
                  <img src="${slide.image}" alt="Banner Image" class="hero-img">
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Dot Indicators -->
        <div class="dot-indicators">
          ${this.slides.map((_, idx) => `
            <button class="dot ${idx === this.currentSlide ? 'active' : ''}" data-index="${idx}" aria-label="Go to slide ${idx + 1}"></button>
          `).join('')}
        </div>
      </section>
    `;
  }

  setupEventListeners() {
    const shadow = this.shadowRoot;
    
    // Dot indicator clicks
    const dots = shadow.querySelectorAll('.dot');
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-index'));
        this.goToSlide(idx);
        this.resetAutoSlide();
      });
    });

    // Details clicks
    shadow.addEventListener('click', (e) => {
      const cta = e.target.closest('.shop-cta');
      if (cta) {
        const id = cta.getAttribute('data-id');
        window.dispatchEvent(new CustomEvent('product:view', { detail: id }));
      }
    });
  }

  goToSlide(index) {
    const shadow = this.shadowRoot;
    const slides = shadow.querySelectorAll('.slide');
    const dots = shadow.querySelectorAll('.dot');
    
    if (slides.length === 0) return;

    slides[this.currentSlide].classList.remove('active');
    dots[this.currentSlide].classList.remove('active');

    this.currentSlide = (index + this.slides.length) % this.slides.length;

    slides[this.currentSlide].classList.add('active');
    dots[this.currentSlide].classList.add('active');
  }

  nextSlide() {
    this.goToSlide(this.currentSlide + 1);
  }

  startAutoSlide() {
    this.timer = setInterval(() => {
      this.nextSlide();
    }, this.intervalTime);
  }

  stopAutoSlide() {
    if (this.timer) clearInterval(this.timer);
  }

  resetAutoSlide() {
    this.stopAutoSlide();
    this.startAutoSlide();
  }
}

customElements.define('app-hero', Hero);
export default Hero;
