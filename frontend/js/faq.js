/**
 * FAQ Accordion Functionality
 * Handles FAQ item expand/collapse
 */

(function() {
  'use strict';

  const faqItems = document.querySelectorAll('.faq-item');
  
  if (faqItems.length === 0) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      
      // Toggle current item
      if (isActive) {
        item.classList.remove('active');
      } else {
        item.classList.add('active');
        // Smooth scroll to question if needed
        question.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
})();

