const WEB3FORMS_KEY = (window.KAMATAMIS_CONFIG && window.KAMATAMIS_CONFIG.web3formsKey) || '';

function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" aria-label="Dismiss">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('active'));

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 250);
  });

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 250);
    }
  }, 4000);
}

class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.previousActiveElement = null;
    this.init();
  }

  init() {
    document.querySelectorAll('[data-modal-trigger]').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = trigger.getAttribute('data-modal-trigger');
        this.open(modalId);
      });
    });

    document.addEventListener('click', (e) => {
      if (!(e.target instanceof Element)) return;
      const closeBtn = e.target.closest('.modal-close');
      if (closeBtn) {
        const overlay = closeBtn.closest('.modal-overlay');
        if (overlay) this.close(overlay.id);
        return;
      }
      if (e.target.classList.contains('modal-overlay')) {
        this.close(e.target.id);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
      }
    });
  }

  register(modalId, contentGenerator) {
    this.modals.set(modalId, contentGenerator);
  }

  open(modalId) {
    let overlay = document.getElementById(modalId);

    if (!overlay && this.modals.has(modalId)) {
      overlay = this.createModal(modalId);
      document.body.appendChild(overlay);
    }

    if (overlay) {
      this.previousActiveElement = document.activeElement;
      this.activeModal = modalId;
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.trapFocus(overlay);
      const closeBtn = overlay.querySelector('.modal-close');
      closeBtn?.focus();
      if (window.lucide) {
        lucide.createIcons({ nodes: [overlay] });
      }
    }
  }

  createModal(modalId) {
    const generator = this.modals.get(modalId);
    const content = generator ? generator() : '';
    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', `${modalId}-title`);
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title" id="${modalId}-title">${content.title || 'Details'}</h2>
          <button class="modal-close" aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">${content.body || ''}</div>
        ${content.footer ? `<div class="modal-footer">${content.footer}</div>` : ''}
      </div>
    `;
    return overlay;
  }

  close(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      this.activeModal = null;
      if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
        this.previousActiveElement.focus();
        this.previousActiveElement = null;
      }
      setTimeout(() => {
        if (!overlay.classList.contains('active') && overlay.parentNode) {
          overlay.remove();
        }
      }, 250);
    }
  }

  trapFocus(overlay) {
    const focusableElements = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    overlay.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }
}

class TableFilter {
  constructor(tableSelector) {
    this.table = document.querySelector(tableSelector);
    if (!this.table) return;
    this.headers = this.table.querySelectorAll('th');
    this.tbody = this.table.querySelector('tbody');
    this.rows = Array.from(this.tbody.querySelectorAll('tr'));
    this.searchInput = document.querySelector(`[data-table-search="${tableSelector}"]`);
    this.sortDirections = new Map();
    this.init();
  }

  init() {
    this.headers.forEach((header, index) => {
      if (header.hasAttribute('data-sortable')) {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => this.sort(index));
        const icon = document.createElement('span');
        icon.className = 'sort-icon';
        icon.innerHTML = ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>';
        header.appendChild(icon);
      }
    });

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => this.filter(e.target.value));
    }
  }

  sort(columnIndex) {
    const header = this.headers[columnIndex];
    const currentDirection = this.sortDirections.get(columnIndex) || 'asc';
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    this.sortDirections.set(columnIndex, newDirection);

    this.headers.forEach((h, i) => {
      const icon = h.querySelector('.sort-icon');
      if (icon) {
        if (i === columnIndex) {
          icon.style.transform = newDirection === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)';
          icon.style.opacity = '1';
        } else {
          icon.style.opacity = '0.3';
        }
      }
    });

    const groups = this.getGroups();
    groups.forEach(group => {
      group.rows.sort((a, b) => this.compareRows(a, b, columnIndex, newDirection));
    });

    groups.forEach(group => {
      if (group.header) this.tbody.appendChild(group.header);
      group.rows.forEach(row => this.tbody.appendChild(row));
    });
  }

  compareRows(a, b, columnIndex, direction) {
    const aText = a.cells[columnIndex].textContent.trim();
    const bText = b.cells[columnIndex].textContent.trim();
    const aNum = parseFloat(aText.replace(/[^0-9.-]+/g, ''));
    const bNum = parseFloat(bText.replace(/[^0-9.-]+/g, ''));
    let comparison = 0;
    if (!isNaN(aNum) && !isNaN(bNum)) {
      comparison = aNum - bNum;
    } else {
      comparison = aText.localeCompare(bText);
    }
    return direction === 'asc' ? comparison : -comparison;
  }

  getGroups() {
    const groups = [];
    let current = null;
    this.rows.forEach(row => {
      if (row.querySelector('td[colspan]')) {
        current = { header: row, rows: [] };
        groups.push(current);
      } else {
        if (!current) {
          current = { header: null, rows: [] };
          groups.push(current);
        }
        current.rows.push(row);
      }
    });
    return groups;
  }

  filter(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    this.getGroups().forEach(group => {
      let visibleCount = 0;
      group.rows.forEach(row => {
        const matches = row.textContent.toLowerCase().includes(term);
        row.style.display = matches ? '' : 'none';
        if (matches) visibleCount += 1;
      });
      if (group.header) {
        group.header.style.display = term === '' || visibleCount > 0 ? '' : 'none';
      }
    });
  }
}

class OrderFormManager {
  constructor(formSelector) {
    this.form = document.querySelector(formSelector);
    if (!this.form) return;
    this.products = [
      { id: 'classic', name: 'Kamatamis Spread - Classic Flavor', price: 114, flavor: 'Classic', image: 'assets/images/classic-jar.svg' },
      { id: 'spicy', name: 'Kamatamis Spread - Spicy-Chili Flavor', price: 119, flavor: 'Spicy-Chili', image: 'assets/images/spicy-jar.svg' }
    ];
    this.init();
  }

  init() {
    this.bindQuantitySelectors();
    this.bindFormSubmit();
    this.bindFlavorSelection();
    this.bindClearErrors();
    this.applyFlavorParam();
    this.updateOrderSummary();
  }

  bindClearErrors() {
    this.form.querySelectorAll('.form-input, .form-textarea').forEach(field => {
      field.addEventListener('input', () => {
        field.classList.remove('has-error');
        const errorEl = field.parentNode.querySelector('.form-error');
        if (errorEl) errorEl.textContent = '';
      });
    });
  }

  applyFlavorParam() {
    const flavor = new URLSearchParams(window.location.search).get('flavor');
    if (!flavor) return;
    const checkbox = this.form.querySelector(`[data-flavor-select="${flavor}"]`);
    if (!checkbox) return;
    checkbox.checked = true;
    const qtyInput = this.form.querySelector(`.quantity-input[data-product-id="${flavor}"]`);
    if (qtyInput) qtyInput.value = Math.max(1, parseInt(qtyInput.value, 10) || 0);
  }

  getSelectedItems() {
    return this.products
      .filter(product => {
        const checkbox = this.form.querySelector(`[data-flavor-select="${product.id}"]`);
        return checkbox && checkbox.checked;
      })
      .map(product => {
        const qtyInput = this.form.querySelector(`.quantity-input[data-product-id="${product.id}"]`);
        const quantity = Math.max(1, parseInt(qtyInput?.value, 10) || 0);
        return { ...product, quantity };
      });
  }

  bindQuantitySelectors() {
    this.form.querySelectorAll('.quantity-selector').forEach(selector => {
      const input = selector.querySelector('.quantity-input');
      const decrement = selector.querySelector('[data-action="decrement"]');
      const increment = selector.querySelector('[data-action="increment"]');
      const productId = selector.dataset.productId;

      decrement?.addEventListener('click', () => {
        const newVal = Math.max(0, parseInt(input.value) - 1);
        input.value = newVal;
        this.handleQuantityChange(productId, newVal);
      });

      increment?.addEventListener('click', () => {
        const newVal = parseInt(input.value) + 1;
        input.value = newVal;
        this.handleQuantityChange(productId, newVal);
      });

      input?.addEventListener('change', () => {
        const newVal = Math.max(0, parseInt(input.value) || 0);
        input.value = newVal;
        this.handleQuantityChange(productId, newVal);
      });
    });
  }

  bindFlavorSelection() {
    this.form.querySelectorAll('[data-flavor-select]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const productId = checkbox.getAttribute('data-flavor-select');
        const qtyInput = this.form.querySelector(`.quantity-input[data-product-id="${productId}"]`);
        if (checkbox.checked) {
          const qty = Math.max(1, parseInt(qtyInput?.value, 10) || 0);
          if (qtyInput) qtyInput.value = qty;
        } else {
          if (qtyInput) qtyInput.value = 0;
        }
        this.clearFlavorError();
        this.updateOrderSummary();
      });
    });
  }

  clearFlavorError() {
    const checkboxes = Array.from(this.form.querySelectorAll('[data-flavor-select]'));
    if (!checkboxes.some(cb => cb.checked)) return;
    checkboxes.forEach(cb => cb.classList.remove('has-error'));
    const errorEl = this.form.querySelector('[data-flavor-error]');
    if (errorEl) errorEl.textContent = '';
  }

  handleQuantityChange(productId, quantity) {
    const checkbox = this.form.querySelector(`[data-flavor-select="${productId}"]`);
    if (checkbox) checkbox.checked = quantity > 0;
    this.clearFlavorError();
    this.updateOrderSummary();
  }

  updateOrderSummary() {
    const summaryContainer = document.querySelector('[data-order-summary]');
    if (!summaryContainer) return;

    const selectedItems = this.getSelectedItems();

    if (selectedItems.length === 0) {
      summaryContainer.innerHTML = `
        <div class="order-summary">
          <h3 class="order-summary-title">Order Summary</h3>
          <p style="color: var(--color-text-light); text-align: center; padding: var(--spacing-lg);">
            Select products and quantities to see your order summary
          </p>
        </div>
      `;
      return;
    }

    const itemsHtml = selectedItems.map(item => `
      <div class="order-item">
        <div class="order-item-info">
          <span class="order-item-name">${item.name}</span>
          <span class="order-item-details">₱${item.price.toLocaleString()} × ${item.quantity} jar(s)</span>
        </div>
        <span class="order-item-price">₱${(item.price * item.quantity).toLocaleString()}</span>
      </div>
    `).join('');

    const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    summaryContainer.innerHTML = `
      <div class="order-summary">
        <h3 class="order-summary-title">Order Summary</h3>
        ${itemsHtml}
        <div class="order-total">
          <span>Total</span>
          <span>₱${total.toLocaleString()}</span>
        </div>
      </div>
    `;
  }

  bindFormSubmit() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.validateForm()) {
        await this.submitOrder();
      }
    });
  }

  validateForm() {
    let isValid = true;
    const requiredFields = this.form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
      if (field.type === 'checkbox') return;
      const errorEl = field.parentNode.querySelector('.form-error');
      if (!field.value.trim()) {
        field.classList.add('has-error');
        if (errorEl) errorEl.textContent = 'This field is required';
        isValid = false;
      } else {
        field.classList.remove('has-error');
        if (errorEl) errorEl.textContent = '';
      }
    });

    const emailField = this.form.querySelector('input[type="email"]');
    if (emailField && emailField.value && !this.isValidEmail(emailField.value)) {
      emailField.classList.add('has-error');
      const errorEl = emailField.parentNode.querySelector('.form-error');
      if (errorEl) errorEl.textContent = 'Please enter a valid email address';
      isValid = false;
    } else if (emailField) {
      emailField.classList.remove('has-error');
    }

    const flavorCheckboxes = Array.from(this.form.querySelectorAll('[data-flavor-select]'));
    const flavorErrorEl = this.form.querySelector('[data-flavor-error]');
    if (!flavorCheckboxes.some(cb => cb.checked)) {
      flavorCheckboxes.forEach(cb => cb.classList.add('has-error'));
      if (flavorErrorEl) flavorErrorEl.textContent = 'Please select at least one flavor';
      isValid = false;
    } else {
      flavorCheckboxes.forEach(cb => cb.classList.remove('has-error'));
      if (flavorErrorEl) flavorErrorEl.textContent = '';
    }

    if (this.getSelectedItems().length === 0) {
      showToast('Please select at least one product', 'error');
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async submitOrder() {
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid currentColor;border-radius:50%;border-right-color:transparent;animation:spin 0.8s linear infinite;margin-right:8px;"></span>Submitting...';

    try {
      const formData = new FormData(this.form);
      const items = this.getSelectedItems();
      const orderData = {
        items,
        customer: {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          address: formData.get('address'),
          notes: formData.get('notes')
        },
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        timestamp: new Date().toISOString()
      };

      await this.sendOrder(orderData);

      showToast('Order submitted successfully! We\'ll contact you soon.', 'success');
      this.form.reset();
      this.form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
      this.form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
      this.updateOrderSummary();

    } catch (error) {
      showToast(error.message || 'Failed to submit order. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  async sendOrder(order) {
    if (!WEB3FORMS_KEY || WEB3FORMS_KEY === 'YOUR_ACCESS_KEY') {
      throw new Error('Order form is not connected yet — please email farm.kamatamis@email.com.');
    }

    const payload = {
      access_key: WEB3FORMS_KEY,
      subject: `New Kamatamis pre-order — ₱${order.total.toLocaleString()}`,
      from_name: 'Kamatamis Spread Website',
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone || 'Not provided',
      address: order.customer.address,
      notes: order.customer.notes || 'None',
      items: order.items.map(item => `${item.name} × ${item.quantity}`).join('\n'),
      total: `₱${order.total.toLocaleString()}`,
      submitted_at: order.timestamp
    };

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      throw new Error('Failed to submit order. Please try again.');
    }
  }
}

class TabManager {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;
    this.tabs = this.container.querySelectorAll('.tab-btn');
    this.panels = document.querySelectorAll('.tab-panel');
    this.init();
  }

  init() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.activateTab(tab));
      tab.addEventListener('keydown', (e) => this.handleKeydown(e));
    });
  }

  activateTab(selectedTab) {
    const targetId = selectedTab.getAttribute('data-tab-target');
    this.tabs.forEach(tab => tab.classList.remove('active'));
    this.panels.forEach(panel => {
      panel.classList.remove('active');
      if (panel.id === targetId) {
        panel.classList.add('active');
      }
    });
    selectedTab.classList.add('active');
  }

  handleKeydown(e) {
    const tabsArray = Array.from(this.tabs);
    const currentIndex = tabsArray.indexOf(e.target);
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % tabsArray.length;
        break;
      case 'ArrowLeft':
        newIndex = (currentIndex - 1 + tabsArray.length) % tabsArray.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabsArray.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    tabsArray[newIndex].focus();
    this.activateTab(tabsArray[newIndex]);
  }
}

class ProductModalManager {
  constructor() {
    this.modalManager = window.modalManager;
    this.products = {
      classic: {
        id: 'classic',
        title: 'Kamatamis Spread - Classic Flavor',
        price: 114,
        size: '150ml',
        description: 'Our classic Kamatamis Spread made from upcycled second-class tomatoes, slow-cooked to perfection with brown sugar, lemon juice, cinnamon, and ginger. Soft, smooth texture with a balanced sweet tomato taste.',
        ingredients: [
          'Second-Class tomatoes (upcycled)',
          'Brown sugar',
          'Lemon juice',
          'Cinnamon powder',
          'Fresh ginger',
          'Salt (pinch)'
        ],
        packaging: '150ml eco-friendly glass jar with metal lid',
        usage: [
          'Spread on toast, pandesal, or crackers',
          'Glaze for roasted meats and vegetables',
          'Condiment for cheese boards and charcuterie',
          'Mix into yogurt or oatmeal',
          'Base for salad dressings and marinades'
        ],
        nutrition: 'High in Lycopene, Vitamin C, Potassium | No preservatives | No artificial colors'
      },
      spicy: {
        id: 'spicy',
        title: 'Kamatamis Spread - Spicy-Chili Flavor',
        price: 119,
        size: '150ml',
        description: 'Our signature spread with a kick! Made from upcycled second-class tomatoes with chili powder and flakes for a balanced spicy heat that complements the natural tomato sweetness.',
        ingredients: [
          'Second-Class tomatoes (upcycled)',
          'Brown sugar',
          'Lemon juice',
          'Cinnamon powder',
          'Fresh ginger',
          'Chili powder',
          'Chili flakes',
          'Salt (pinch)'
        ],
        packaging: '150ml eco-friendly glass jar with metal lid',
        usage: [
          'Spicy spread on toast or pandesal',
          'Glaze for grilled pork, chicken, or seafood',
          'Stir into fried rice or noodles',
          'Mix with cream cheese for a spicy dip',
          'Topping for burgers and sandwiches',
          'Add to soups and stews for depth'
        ],
        nutrition: 'High in Lycopene, Vitamin C, Potassium, Capsaicin | No preservatives | No artificial colors'
      }
    };
    this.registerModals();
  }

  registerModals() {
    Object.entries(this.products).forEach(([id, product]) => {
      this.modalManager.register(`modal-${id}`, () => ({
        title: product.title,
        body: this.generateModalContent(product),
        footer: `
          <a href="contact.html?flavor=${id}#order-form" class="btn btn-accent">
            <i data-lucide="shopping-bag" style="width:18px;height:18px;display:inline;vertical-align:middle;margin-right:8px;"></i>Place a Pre-Order
          </a>
          <button class="btn btn-secondary modal-close">Close</button>
        `
      }));
    });
  }

  generateModalContent(product) {
    return `
      <div class="product-modal-content">
        <div class="product-modal-header">
          <div class="product-modal-price">
            <span class="product-modal-size">${product.size}</span>
            <span class="product-modal-cost">₱${product.price}.00</span>
          </div>
          <span class="badge badge-flavor${product.title.includes('Spicy') ? ' spicy' : ''}">${product.title.includes('Spicy') ? 'Spicy-Chili' : 'Original'}</span>
        </div>
        <p class="product-modal-description">${product.description}</p>

        <div class="product-modal-section">
          <h3 class="product-modal-section-title">Ingredients</h3>
          <ul class="product-modal-list">
            ${product.ingredients.map(ing => `<li>${ing}</li>`).join('')}
          </ul>
        </div>

        <div class="product-modal-section">
          <h3 class="product-modal-section-title">Packaging</h3>
          <p class="product-modal-text">${product.packaging}</p>
        </div>

        <div class="product-modal-section">
          <h3 class="product-modal-section-title">Usage Ideas</h3>
          <ul class="product-modal-list">
            ${product.usage.map(use => `<li>${use}</li>`).join('')}
          </ul>
        </div>

        <div class="product-modal-section">
          <h3 class="product-modal-section-title">Nutritional Highlights</h3>
          <p class="product-modal-text">${product.nutrition}</p>
        </div>
      </div>
    `;
  }
}

class CountUp {
  constructor() {
    this.elements = document.querySelectorAll('[data-count-to]');
    this.init();
  }

  init() {
    if (!this.elements.length) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.elements.forEach(el => {
      const raw = el.getAttribute('data-count-to');
      const target = parseFloat(raw);
      if (isNaN(target)) return;
      const decimals = (raw.split('.')[1] || '').length;
      const format = (value) => value.toFixed(decimals);

      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        el.textContent = format(target);
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer.unobserve(el);
          const duration = 1400;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = format(target * eased);
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.4 });

      observer.observe(el);
    });
  }
}

class ScrollReveal {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.1;
    this.rootMargin = options.rootMargin || '0px 0px -50px 0px';
    this.elements = document.querySelectorAll('[data-reveal]');
    this.init();
  }

  init() {
    if (!('IntersectionObserver' in window)) {
      this.elements.forEach(el => el.classList.add('revealed'));
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: this.threshold, rootMargin: this.rootMargin });

    this.elements.forEach(el => this.observer.observe(el));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.componentLoader = new ComponentLoader();

  if (window.lucide) {
    lucide.createIcons();
  }
  window.modalManager = new ModalManager();
  new ScrollReveal();
  new CountUp();

  if (document.querySelector('#order-form')) {
    window.orderFormManager = new OrderFormManager('#order-form');
  }

  if (document.querySelector('.tabs')) {
    new TabManager('.tabs');
  }

  if (document.querySelector('.table-custom')) {
    document.querySelectorAll('.table-custom').forEach(table => {
      new TableFilter(`#${table.id}`);
    });
  }

  if (document.querySelector('[data-product-modal]')) {
    window.productModalManager = new ProductModalManager();
    document.querySelectorAll('[data-product-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.getAttribute('data-product-modal');
        window.modalManager.open(`modal-${productId}`);
      });
    });
  }
});