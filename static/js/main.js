// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    navToggle.style.transform = navLinks.style.display === 'flex' ? 'rotate(90deg)' : 'rotate(0)';
  });
}

// Close mobile menu on link click (only on mobile)
const navItems = document.querySelectorAll('.nav-link');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    // Only close menu on mobile devices (window width <= 768px)
    if (window.innerWidth <= 768) {
      navLinks.style.display = 'none';
      if (navToggle) navToggle.style.transform = 'rotate(0)';
    }
  });
});

// Navbar background change on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(31, 41, 55, 0.98)';
  } else {
    navbar.style.background = 'rgba(31, 41, 55, 0.95)';
  }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#' && document.querySelector(href)) {
      e.preventDefault();
      const target = document.querySelector(href);
      const offsetTop = target.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe feature cards, testimonials, etc.
document.querySelectorAll('.feature-card, .step-card, .testimonial-card, .impact-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// Counter animation for stats
const animateCounters = () => {
  const statNumbers = document.querySelectorAll('.stat-number');
  const impactNumbers = document.querySelectorAll('.impact-number');
  
  const animate = (element, target, duration = 2000) => {
    if (element.textContent.includes('₹')) {
      // For currency
      const numMatch = target.match(/[\d.]+/);
      if (!numMatch) return;
      const num = parseFloat(numMatch[0]);
      const isL = target.includes('L');
      const startTime = Date.now();
      
      const updateCounter = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(num * progress);
        element.textContent = '₹' + current + (isL ? 'L+' : '+');
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target;
        }
      };
      updateCounter();
    } else if (element.textContent.includes('K')) {
      // For K format
      const numMatch = target.match(/[\d.]+/);
      if (!numMatch) return;
      const num = parseFloat(numMatch[0]);
      const startTime = Date.now();
      
      const updateCounter = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = (num * progress).toFixed(1);
        element.textContent = current + 'K+';
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target;
        }
      };
      updateCounter();
    }
  };
  
  statNumbers.forEach(stat => {
    const target = stat.textContent;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animate(stat, target);
        observer.unobserve(stat);
      }
    }, { threshold: 0.5 });
    observer.observe(stat);
  });

  impactNumbers.forEach(num => {
    const target = num.textContent;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animate(num, target);
        observer.unobserve(num);
      }
    }, { threshold: 0.5 });
    observer.observe(num);
  });
};

animateCounters();

// Add scroll-based navbar highlight
window.addEventListener('scroll', () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (scrollY >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').slice(1) === current) {
      link.classList.add('active');
    }
  });
});

// Responsive menu for mobile
if (window.innerWidth <= 768) {
  navLinks.style.display = 'none';
  navLinks.style.position = 'absolute';
  navLinks.style.top = '70px';
  navLinks.style.left = '0';
  navLinks.style.right = '0';
  navLinks.style.backgroundColor = 'rgba(31, 41, 55, 0.98)';
  navLinks.style.flexDirection = 'column';
  navLinks.style.padding = '20px 0';
  navLinks.style.gap = '0';
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    navLinks.style.display = 'flex';
    navLinks.style.position = 'static';
    navLinks.style.backgroundColor = 'transparent';
  }
});

// Parallax effect for hero
const hero = document.querySelector('.hero');
window.addEventListener('scroll', () => {
  if (window.scrollY < window.innerHeight) {
    const scrolled = window.scrollY;
    hero.style.backgroundPosition = `center ${scrolled * 0.5}px`;
  }
});

// Button ripple effect
const buttons = document.querySelectorAll('.btn');
buttons.forEach(button => {
  button.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.width = '0';
    ripple.style.height = '0';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
    ripple.style.pointerEvents = 'none';
    
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.animate([
      { width: '0px', height: '0px', opacity: '1' },
      { width: size + 'px', height: size + 'px', opacity: '0' }
    ], {
      duration: 600,
      easing: 'ease-out'
    }).onfinish = () => ripple.remove();
  });
});

// Page load animations
window.addEventListener('load', () => {
  const hero = document.querySelector('.hero-content');
  if (hero) {
    hero.style.opacity = '1';
  }
});

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const nameInput = contactForm.querySelector('input[placeholder="Your Name"]');
    const emailInput = contactForm.querySelector('input[placeholder="Your Email"]');
    const subjectInput = contactForm.querySelector('input[placeholder="Subject"]');
    const messageInput = contactForm.querySelector('textarea[placeholder="Your Message"]');
    
    const name = nameInput.value;
    const email = emailInput.value;
    const subject = subjectInput.value;
    const message = messageInput.value;
    
    // Validate form
    if (name && email && subject && message) {
      // Show success feedback
      const button = contactForm.querySelector('button[type="submit"]');
      const originalHTML = button.innerHTML;
      const originalBg = button.style.background;
      
      // Change button to success state
      button.innerHTML = '<i class="fas fa-check-circle"></i> Message Received!';
      button.style.background = 'linear-gradient(135deg, #00c853, #00a850)';
      button.disabled = true;
      
      // You can log the message or send it via AJAX to a backend endpoint
      console.log('Contact Message:', { name, email, subject, message });
      
      // Reset form
      contactForm.reset();
      
      // Restore button after 3 seconds
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.style.background = originalBg;
        button.disabled = false;
      }, 3000);
      
      // Show toast notification
      showNotification(`Thank you ${name}! We've received your message and will get back to you soon.`, 'success');
    }
  });
}

// Toast Notification Function
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #00e676, #00c853)' : '#3b82f6'};
    color: white;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks.style.display === 'flex') {
    navLinks.style.display = 'none';
  }
});
