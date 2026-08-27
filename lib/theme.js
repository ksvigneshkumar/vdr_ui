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
            const primary = theme.primaryColor || '#1c7f9f';
            const secondary = theme.secondaryColor;

            root.style.setProperty('--brand', primary);
            root.style.setProperty('--brand-dark', secondary || primary);

            if (secondary && secondary !== primary) {
                root.style.setProperty('--brand-secondary', secondary);
                const grad = `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
                root.style.setProperty('--brand-gradient', grad);
                root.style.setProperty('--brand-bg', grad);
            } else {
                root.style.setProperty('--brand-secondary', primary);
                root.style.setProperty('--brand-gradient', 'none');
                root.style.setProperty('--brand-bg', primary);
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
