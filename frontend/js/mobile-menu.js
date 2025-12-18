document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const heroContent = document.querySelector('.hero-content');

    if (!mobileMenuBtn || !mobileMenu) {
        return;
    }

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function closeMenu() {
        if (!isMobile()) return;
        mobileMenu.classList.add('hidden');
        mobileMenu.setAttribute('aria-hidden', 'true');
        if (mobileMenuBackdrop) {
            mobileMenuBackdrop.classList.add('hidden');
            mobileMenuBackdrop.setAttribute('aria-hidden', 'true');
        }
        mobileMenuBtn.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
    }

    function openMenu() {
        if (!isMobile()) return;
        mobileMenu.classList.remove('hidden');
        mobileMenu.setAttribute('aria-hidden', 'false');
        if (mobileMenuBackdrop) {
            mobileMenuBackdrop.classList.remove('hidden');
            mobileMenuBackdrop.setAttribute('aria-hidden', 'false');
        }
        mobileMenuBtn.classList.add('active');
        document.body.classList.add('mobile-menu-open');
    }
    if (window.innerWidth > 768) {
        mobileMenu.classList.remove('hidden');
    } else {
        mobileMenu.classList.add('hidden');
    }

    window.addEventListener('resize', function() {
        if (isMobile()) {
            if (!mobileMenuBtn.classList.contains('active')) {
                mobileMenu.classList.add('hidden');
            }
        } else {
            mobileMenu.classList.remove('hidden');
            mobileMenuBtn.classList.remove('active');
        }
    });

    mobileMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!isMobile()) return;
        if (mobileMenu.classList.contains('hidden')) {
            openMenu();
        } else {
            closeMenu();
        }
    });

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', function(e) {
            e.stopPropagation();
            closeMenu();
        });
    }

    // Close menu when clicking backdrop
    if (mobileMenuBackdrop) {
        mobileMenuBackdrop.addEventListener('click', function(e) {
            e.stopPropagation();
            closeMenu();
        });
    }

    document.addEventListener('click', function(event) {
        if (!isMobile()) return;
        const isClickInsideMenu = mobileMenu.contains(event.target);
        const isClickOnButton = mobileMenuBtn.contains(event.target);
        const isClickOnBackdrop = mobileMenuBackdrop && mobileMenuBackdrop.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnButton && !isClickOnBackdrop && !mobileMenu.classList.contains('hidden')) {
            closeMenu();
        }
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden') && isMobile()) {
            closeMenu();
        }
    });

    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (isMobile()) {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    // Close menu first
                    closeMenu();
                    
                    // Then scroll to section after a brief delay
                    setTimeout(() => {
                        const targetId = href.substring(1);
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                            const headerOffset = 80; // Account for fixed header
                            const elementPosition = targetElement.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                            window.scrollTo({
                                top: offsetPosition,
                                behavior: 'smooth'
                            });
                        }
                    }, 300);
                } else {
                    // For external links, just close menu
                    setTimeout(closeMenu, 100);
                }
            }
        });
    });

    // Ensure menu closes on window resize
    window.addEventListener('resize', function() {
        if (!isMobile() && !mobileMenu.classList.contains('hidden')) {
            closeMenu();
        }
    });
});

