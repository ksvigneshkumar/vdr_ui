export function applyBrandTheme(theme) {
    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (typeof theme === 'string') {
            if (theme.includes('linear-gradient')) {
                const colors = theme.match(/#[0-9a-fA-F]+/g);
                if (colors && colors.length >= 2) {
                    root.style.setProperty('--brand', colors[0]);
                    root.style.setProperty('--brand-secondary', colors[1]);
                    root.style.setProperty('--brand-dark', colors[1]);
                } else if (colors && colors.length === 1) {
                    root.style.setProperty('--brand', colors[0]);
                    root.style.setProperty('--brand-dark', colors[0]);
                }
                root.style.setProperty('--brand-gradient', theme);
                root.style.setProperty('--brand-bg', theme);
            } else {
                root.style.setProperty('--brand', theme);
                root.style.setProperty('--brand-secondary', theme);
                root.style.setProperty('--brand-dark', theme);
                root.style.setProperty('--brand-gradient', 'none');
                root.style.setProperty('--brand-bg', theme);
            }
        } else if (theme && typeof theme === 'object') {
            if (theme.primaryColor) {
                root.style.setProperty('--brand', theme.primaryColor);
                root.style.setProperty('--brand-bg', theme.primaryColor);
                root.style.setProperty('--brand-dark', theme.primaryColor);
                root.style.setProperty('--brand-gradient', 'none');
            }
            if (theme.secondaryColor) {
                root.style.setProperty('--brand-secondary', theme.secondaryColor);
                root.style.setProperty('--brand-dark', theme.secondaryColor);
            }
        }
    }
}

export const DEFAULT_BRAND = {
  primaryColor: '#1c7f9f',
  secondaryColor: '#2bb8a6'
};

export function getStoredBrandTheme() {
    if (typeof localStorage !== 'undefined') {
        try {
            return JSON.parse(localStorage.getItem('vdr_theme')) || null;
        } catch (e) {
            return null;
        }
    }
    return null;
}
