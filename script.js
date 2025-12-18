(function() {
    'use strict';

    const app = window.__reiseApp || {};
    window.__reiseApp = app;

    const config = {
        headerHeight: 80,
        transitionDuration: 300,
        scrollThreshold: 100,
        debounceDelay: 250,
        throttleDelay: 150
    };

    const utils = {
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                if (!timeout) {
                    timeout = setTimeout(() => {
                        timeout = null;
                        func(...args);
                    }, wait);
                }
            };
        },

        sanitize(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        getHeaderHeight() {
            const header = document.querySelector('.l-header, header');
            return header ? header.offsetHeight : config.headerHeight;
        }
    };

    const validators = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[\d\s+\-()]{10,20}$/,
        name: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,

        validateEmail(value) {
            return this.email.test(value.trim());
        },

        validatePhone(value) {
            if (!value) return true;
            const cleaned = value.replace(/\s/g, '');
            return this.phone.test(cleaned) && cleaned.length >= 10;
        },

        validateName(value) {
            return this.name.test(value.trim());
        },

        validateMessage(value) {
            return value.trim().length >= 10;
        },

        validateCheckbox(checked) {
            return checked === true;
        }
    };

    class BurgerMenu {
        constructor() {
            this.nav = document.querySelector('.c-nav, nav.navbar');
            this.toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
            this.menu = document.querySelector('.c-nav__menu, .navbar-collapse, #navbarNav');
            this.links = document.querySelectorAll('.c-nav__link, .nav-link');
            this.isOpen = false;
            
            if (this.nav && this.toggle && this.menu) {
                this.init();
            }
        }

        init() {
            this.toggle.addEventListener('click', () => this.toggleMenu());
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeMenu();
                }
            });

            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.nav.contains(e.target)) {
                    this.closeMenu();
                }
            });

            this.links.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 1024) {
                        this.closeMenu();
                    }
                });
            });

            window.addEventListener('resize', utils.throttle(() => {
                if (window.innerWidth >= 1024 && this.isOpen) {
                    this.closeMenu();
                }
            }, config.throttleDelay));
        }

        toggleMenu() {
            this.isOpen ? this.closeMenu() : this.openMenu();
        }

        openMenu() {
            this.isOpen = true;
            this.menu.classList.add('show', 'is-open');
            this.nav.classList.add('is-open');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.toggle.classList.add('active');
            document.body.classList.add('u-no-scroll');
            
            this.menu.style.height = `calc(100vh - var(--nav-h))`;
            this.menu.style.maxHeight = `calc(100vh - var(--nav-h))`;
        }

        closeMenu() {
            this.isOpen = false;
            this.menu.classList.remove('show', 'is-open');
            this.nav.classList.remove('is-open');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.toggle.classList.remove('active');
            document.body.classList.remove('u-no-scroll');
            
            this.menu.style.height = '';
            this.menu.style.maxHeight = '';
        }
    }

    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            const isHomepage = window.location.pathname === '/' || 
                             window.location.pathname.endsWith('/index.html');

            if (!isHomepage) {
                document.querySelectorAll('a[href^="#"]').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href !== '#' && href !== '#!') {
                        link.setAttribute('href', '/' + href);
                    }
                });
            }

            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (!link || !isHomepage) return;

                const href = link.getAttribute('href');
                if (href === '#' || href === '#!') return;

                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offset = utils.getHeaderHeight();
                    const targetPosition = target.offsetTop - offset;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        }
    }

    class ScrollSpy {
        constructor() {
            this.sections = document.querySelectorAll('section[id]');
            this.navLinks = document.querySelectorAll('.c-nav__link, .nav-link');
            
            if (this.sections.length && this.navLinks.length) {
                this.init();
            }
        }

        init() {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.setActiveLink(entry.target.id);
                        }
                    });
                },
                {
                    threshold: 0.3,
                    rootMargin: `-${utils.getHeaderHeight()}px 0px -50% 0px`
                }
            );

            this.sections.forEach(section => observer.observe(section));
            this.highlightCurrentPage();
        }

        setActiveLink(sectionId) {
            this.navLinks.forEach(link => {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
                
                const href = link.getAttribute('href');
                if (href === `#${sectionId}` || href === `/#${sectionId}`) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                }
            });
        }

        highlightCurrentPage() {
            const currentPath = window.location.pathname;
            
            this.navLinks.forEach(link => {
                const href = link.getAttribute('href');
                
                if (href === currentPath ||
                    (currentPath === '/' && (href === '/index.html' || href === '/')) ||
                    (currentPath.endsWith('/index.html') && href === '/')) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                }
            });
        }
    }

    class FormValidator {
        constructor() {
            this.forms = document.querySelectorAll('form');
            if (this.forms.length) {
                this.init();
            }
        }

        init() {
            this.forms.forEach(form => {
                form.addEventListener('submit', (e) => this.handleSubmit(e, form));
                
                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.addEventListener('blur', () => this.validateField(input));
                    input.addEventListener('input', () => {
                        if (input.classList.contains('is-invalid')) {
                            this.validateField(input);
                        }
                    });
                });
            });
        }

        handleSubmit(e, form) {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const formId = form.id;
            
            let isValid = true;
            const fields = form.querySelectorAll('input, textarea, select');
            
            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                form.classList.add('was-validated');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';
                
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }, 3000);
            }

            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            this.submitForm(data, form, submitBtn);
        }

        validateField(field) {
            const value = field.value;
            const type = field.type;
            const name = field.name;
            const required = field.hasAttribute('required');
            
            let isValid = true;
            let errorMessage = '';

            if (required && !value.trim() && type !== 'checkbox') {
                isValid = false;
                errorMessage = 'Dieses Feld ist erforderlich.';
            } else if (type === 'checkbox' && required && !field.checked) {
                isValid = false;
                errorMessage = 'Bitte akzeptieren Sie die Bedingungen.';
            } else if (type === 'email' && value) {
                if (!validators.validateEmail(value)) {
                    isValid = false;
                    errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
                }
            } else if (type === 'tel' && value) {
                if (!validators.validatePhone(value)) {
                    isValid = false;
                    errorMessage = 'Bitte geben Sie eine gültige Telefonnummer ein (10-20 Zeichen).';
                }
            } else if (name === 'name' && value) {
                if (!validators.validateName(value)) {
                    isValid = false;
                    errorMessage = 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen, nur Buchstaben).';
                }
            } else if (name === 'message' && value) {
                if (!validators.validateMessage(value)) {
                    isValid = false;
                    errorMessage = 'Die Nachricht muss mindestens 10 Zeichen enthalten.';
                }
            }

            this.showFieldError(field, isValid, errorMessage);
            return isValid;
        }

        showFieldError(field, isValid, message) {
            const formGroup = field.closest('.mb-3, .form-check');
            let feedback = formGroup ? formGroup.querySelector('.invalid-feedback') : null;
            
            if (!feedback && !isValid) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                if (formGroup) {
                    formGroup.appendChild(feedback);
                }
            }

            if (isValid) {
                field.classList.remove('is-invalid');
                field.classList.add('is-valid');
                if (feedback) {
                    feedback.style.display = 'none';
                }
            } else {
                field.classList.remove('is-valid');
                field.classList.add('is-invalid');
                if (feedback) {
                    feedback.textContent = message;
                    feedback.style.display = 'block';
                }
            }
        }

        submitForm(data, form, submitBtn) {
            fetch('process.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Netzwerkfehler');
                }
                return response.json();
            })
            .then(() => {
                this.showNotification('Nachricht erfolgreich gesendet!', 'success');
                form.reset();
                form.classList.remove('was-validated');
                
                const invalidFields = form.querySelectorAll('.is-invalid, .is-valid');
                invalidFields.forEach(field => {
                    field.classList.remove('is-invalid', 'is-valid');
                });

                setTimeout(() => {
                    window.location.href = 'thank_you.html';
                }, 1500);
            })
            .catch(() => {
                this.showNotification('Verbindungsfehler. Bitte versuchen Sie es später erneut.', 'danger');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Erneut senden';
                }
            });
        }

        showNotification(message, type) {
            const container = document.getElementById('notification-container') || this.createNotificationContainer();
            
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show`;
            notification.setAttribute('role', 'alert');
            notification.innerHTML = `
                ${utils.sanitize(message)}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
            `;
            
            container.appendChild(notification);

            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }

        createNotificationContainer() {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
            return container;
        }
    }

    class AnimationController {
        constructor() {
            this.init();
        }

        init() {
            this.animateOnScroll();
            this.animateButtons();
            this.animateCards();
            this.animateImages();
            this.countUpNumbers();
        }

        animateOnScroll() {
            const elements = document.querySelectorAll('section, .card, .c-card, .btn, .c-button');
            
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.style.opacity = '0';
                            entry.target.style.transform = 'translateY(30px)';
                            
                            requestAnimationFrame(() => {
                                entry.target.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                                entry.target.style.opacity = '1';
                                entry.target.style.transform = 'translateY(0)';
                            });
                            
                            observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    threshold: 0.1,
                    rootMargin: '0px 0px -100px 0px'
                }
            );

            elements.forEach(el => {
                if (!el.hasAttribute('data-animated')) {
                    el.setAttribute('data-animated', 'true');
                    observer.observe(el);
                }
            });
        }

        animateButtons() {
            const buttons = document.querySelectorAll('.btn, .c-button, a.btn');
            
            buttons.forEach(button => {
                button.style.transition = 'all 0.3s ease-in-out';
                
                button.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px) scale(1.02)';
                    this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
                });
                
                button.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                    this.style.boxShadow = '';
                });

                button.addEventListener('click', function(e) {
                    const ripple = document.createElement('span');
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;
                    
                    ripple.style.cssText = `
                        position: absolute;
                        width: ${size}px;
                        height: ${size}px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.5);
                        left: ${x}px;
                        top: ${y}px;
                        pointer-events: none;
                        transform: scale(0);
                        animation: ripple-effect 0.6s ease-out;
                    `;
                    
                    this.style.position = 'relative';
                    this.style.overflow = 'hidden';
                    this.appendChild(ripple);
                    
                    setTimeout(() => ripple.remove(), 600);
                });
            });

            const style = document.createElement('style');
            style.textContent = `
                @keyframes ripple-effect {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        animateCards() {
            const cards = document.querySelectorAll('.card, .c-card');
            
            cards.forEach(card => {
                card.style.transition = 'transform 0.4s ease-in-out, box-shadow 0.4s ease-in-out';
                
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-8px) scale(1.02)';
                    
                    const img = this.querySelector('img');
                    if (img) {
                        img.style.transition = 'transform 0.6s ease-out';
                        img.style.transform = 'scale(1.08)';
                    }
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                    
                    const img = this.querySelector('img');
                    if (img) {
                        img.style.transform = 'scale(1)';
                    }
                });
            });
        }

        animateImages() {
            const images = document.querySelectorAll('img');
            
            images.forEach(img => {
                if (!img.hasAttribute('loading')) {
                    img.setAttribute('loading', 'lazy');
                }
                
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.6s ease-in-out';
                
                if (img.complete) {
                    img.style.opacity = '1';
                } else {
                    img.addEventListener('load', function() {
                        this.style.opacity = '1';
                    });
                }

                img.addEventListener('error', function() {
                    this.style.opacity = '1';
                    this.src = 'data:image/svg+xml;base64,' + btoa(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">' +
                        '<rect width="100%" height="100%" fill="#f8f9fa"/>' +
                        '<text x="50%" y="50%" font-family="Arial" font-size="14" fill="#6c757d" text-anchor="middle" dy=".3em">Bild nicht verfügbar</text>' +
                        '</svg>'
                    );
                });
            });
        }

        countUpNumbers() {
            const numbers = document.querySelectorAll('[data-count]');
            
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const target = parseInt(entry.target.getAttribute('data-count'));
                            const duration = 2000;
                            const start = 0;
                            const startTime = performance.now();
                            
                            const animate = (currentTime) => {
                                const elapsed = currentTime - startTime;
                                const progress = Math.min(elapsed / duration, 1);
                                const current = Math.floor(progress * target);
                                
                                entry.target.textContent = current.toLocaleString('de-DE');
                                
                                if (progress < 1) {
                                    requestAnimationFrame(animate);
                                }
                            };
                            
                            requestAnimationFrame(animate);
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.5 }
            );

            numbers.forEach(num => observer.observe(num));
        }
    }

    class AccordionHandler {
        constructor() {
            this.accordions = document.querySelectorAll('.accordion-button');
            if (this.accordions.length) {
                this.init();
            }
        }

        init() {
            this.accordions.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = button.getAttribute('data-bs-target');
                    const collapse = document.querySelector(target);
                    
                    if (collapse) {
                        const isOpen = collapse.classList.contains('show');
                        
                        if (isOpen) {
                            collapse.classList.remove('show');
                            button.classList.add('collapsed');
                            button.setAttribute('aria-expanded', 'false');
                        } else {
                            collapse.classList.add('show');
                            button.classList.remove('collapsed');
                            button.setAttribute('aria-expanded', 'true');
                        }
                    }
                });
            });
        }
    }

    class ScrollToTop {
        constructor() {
            this.createButton();
        }

        createButton() {
            const button = document.createElement('button');
            button.innerHTML = '↑';
            button.className = 'scroll-to-top';
            button.setAttribute('aria-label', 'Nach oben scrollen');
            button.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--color-navy-600), var(--color-navy-700));
                color: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease-in-out;
                z-index: 999;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            `;
            
            button.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.1)';
                this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
            });

            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            });

            document.body.appendChild(button);

            window.addEventListener('scroll', utils.throttle(() => {
                if (window.pageYOffset > 300) {
                    button.style.opacity = '1';
                    button.style.visibility = 'visible';
                } else {
                    button.style.opacity = '0';
                    button.style.visibility = 'hidden';
                }
            }, config.throttleDelay));
        }
    }

    class FAQSearch {
        constructor() {
            this.searchInput = document.getElementById('faq-search');
            if (this.searchInput) {
                this.init();
            }
        }

        init() {
            const form = this.searchInput.closest('form');
            if (form) {
                form.addEventListener('submit', (e) => e.preventDefault());
            }

            this.searchInput.addEventListener('input', utils.debounce((e) => {
                this.filterFAQ(e.target.value);
            }, 300));
        }

        filterFAQ(query) {
            const items = document.querySelectorAll('.accordion-item');
            const searchTerm = query.toLowerCase().trim();

            items.forEach(item => {
                const button = item.querySelector('.accordion-button');
                const body = item.querySelector('.accordion-body');
                const text = (button.textContent + body.textContent).toLowerCase();

                if (text.includes(searchTerm) || searchTerm === '') {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        }
    }

    function init() {
        if (app.initialized) return;
        app.initialized = true;

        new BurgerMenu();
        new SmoothScroll();
        new ScrollSpy();
        new FormValidator();
        new AnimationController();
        new AccordionHandler();
        new ScrollToTop();
        new FAQSearch();

        document.querySelectorAll('video').forEach(video => {
            if (!video.hasAttribute('loading')) {
                video.setAttribute('loading', 'lazy');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();