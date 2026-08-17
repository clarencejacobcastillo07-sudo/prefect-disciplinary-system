/**
 * Master Application Bootstrap & Theme Management
 * Client: St. Agnes Academy of Caloocan Inc.
 */

const ThemeManager = {
  getSavedTheme() {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const iconEl = document.getElementById('themeToggleIcon');
    const btnEl = document.getElementById('themeToggleBtn');
    
    if (iconEl) {
      if (theme === 'light') {
        iconEl.className = 'fas fa-sun';
        if (btnEl) btnEl.title = 'Switch to Dark Theme';
      } else {
        iconEl.className = 'fas fa-moon';
        if (btnEl) btnEl.title = 'Switch to Light Theme';
      }
    }
  },

  init() {
    const theme = this.getSavedTheme();
    this.applyTheme(theme);

    // Watch OS system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  },

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || this.getSavedTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    this.applyTheme(newTheme);
  }
};

// Immediately initialize theme script execution to avoid layout flash
ThemeManager.init();

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = typeof AuthManager !== 'undefined' ? AuthManager.getCurrentUser() : null;

  if (currentUser) {
    // Populate topbar profile info
    const nameEl = document.getElementById('topbarUserName');
    const roleEl = document.getElementById('topbarUserRole');
    const avatarEl = document.getElementById('topbarUserAvatar');

    if (nameEl) nameEl.textContent = currentUser.full_name;
    if (roleEl) roleEl.textContent = currentUser.role_name;
    if (avatarEl && currentUser.full_name) {
      const initials = currentUser.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
      avatarEl.textContent = initials;
    }
  }

  // Initialize SPA Router if present
  if (typeof Router !== 'undefined' && Router.init) {
    Router.init();
  }

  // Initialize Global Header Search if present
  if (typeof GlobalSearch !== 'undefined' && GlobalSearch.init) {
    GlobalSearch.init();
  }

  // Re-apply theme icons after DOM is fully loaded
  ThemeManager.applyTheme(ThemeManager.getSavedTheme());
});
