document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
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
        mobileMenuBtn.classList.remove('active');
    }

    function openMenu() {
        if (!isMobile()) return;
        mobileMenu.classList.remove('hidden');
        mobileMenuBtn.classList.add('active');
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

    document.addEventListener('click', function(event) {
        if (!isMobile()) return;
        const isClickInsideMenu = mobileMenu.contains(event.target);
        const isClickOnButton = mobileMenuBtn.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnButton && !mobileMenu.classList.contains('hidden')) {
            closeMenu();
        }
    });

    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (isMobile()) {
                setTimeout(closeMenu, 100);
            }
        });
    });
});

