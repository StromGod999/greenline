/**
 * GreenPulse Mobile Store - Main Frontend Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Bootstrap Toasts
  const toastElList = [].slice.call(document.querySelectorAll('.toast'));
  toastElList.map(function (toastEl) {
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
    return toast;
  });

  // CSRF Token Helper
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  const csrftoken = getCookie('csrftoken');

  // Dynamic Toast Trigger
  window.showGreenToast = function(message, title = 'GreenPulse Notification') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    const toastId = 'toast-' + Date.now();
    const html = `
      <div id="${toastId}" class="toast align-items-center border-0 shadow-lg mb-2" role="alert" aria-live="assertive" aria-atomic="true" style="background: #064E3B; color: white; border-radius: 12px;">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center gap-2">
            <span class="badge bg-emerald-500 text-white rounded-circle p-1" style="background: #10B981;"><i class="fa-solid fa-check"></i></span>
            <div>
              <div class="fw-bold" style="color: #A7F3D0; font-size: 0.85rem;">${title}</div>
              <div>${message}</div>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    const toastElem = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElem, { delay: 3500 });
    toast.show();
  };

  function createToastContainer() {
    const cont = document.createElement('div');
    cont.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(cont);
    return cont;
  }

  // Wishlist AJAX Toggle
  document.querySelectorAll('.ajax-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const productId = this.getAttribute('data-product-id');
      fetch(`/wishlist/toggle/${productId}/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrftoken,
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          if (data.in_wishlist) {
            this.classList.add('active');
            this.innerHTML = '<i class="fa-solid fa-heart text-danger"></i>';
          } else {
            this.classList.remove('active');
            this.innerHTML = '<i class="fa-regular fa-heart"></i>';
          }
          window.showGreenToast(data.message, 'Wishlist Updated');
        }
      })
      .catch(err => console.error(err));
    });
  });

  // Product Detail Gallery Thumbnail Switcher
  const mainImage = document.getElementById('main-product-img');
  document.querySelectorAll('.product-thumb-item').forEach(thumb => {
    thumb.addEventListener('click', function() {
      document.querySelectorAll('.product-thumb-item').forEach(t => t.classList.remove('active-thumb'));
      this.classList.add('active-thumb');
      const targetUrl = this.getAttribute('data-img-url');
      if (mainImage && targetUrl) {
        mainImage.style.opacity = '0.4';
        setTimeout(() => {
          mainImage.src = targetUrl;
          mainImage.style.opacity = '1';
        }, 150);
      }
    });
  });

  // Color Swatch Selection
  document.querySelectorAll('.color-option-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.color-option-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const input = document.getElementById('selected-color-input');
      const label = document.getElementById('selected-color-label');
      if (input) input.value = this.getAttribute('data-color');
      if (label) label.textContent = this.getAttribute('data-color');
    });
  });

  // Storage Selection
  document.querySelectorAll('.storage-option-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.storage-option-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const input = document.getElementById('selected-storage-input');
      if (input) input.value = this.getAttribute('data-storage');
    });
  });

  // AJAX Cart Quantity Updates on Cart Page
  document.querySelectorAll('.cart-qty-ajax').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const itemId = this.getAttribute('data-item-id');
      const action = this.getAttribute('data-action');
      
      fetch(`/cart/update/${itemId}/?action=${action}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          location.reload(); // Refresh to recalculate subtotal, discount and shipping cleanly
        }
      })
      .catch(() => location.reload());
    });
  });
});
