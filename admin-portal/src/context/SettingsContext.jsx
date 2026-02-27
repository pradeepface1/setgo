import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const { user } = useAuth(); // Get user from AuthContext

    const [activeTheme, setActiveTheme] = useState(() => {
        return localStorage.getItem('activeTheme') || 'midnight-neon';
    });

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', activeTheme);
        localStorage.setItem('activeTheme', activeTheme);

        // Sync with Tailwind dark mode
        if (activeTheme === 'arctic-frost') {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    }, [activeTheme]);

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    const [timezone, setTimezone] = useState(() => {
        return localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    });

    useEffect(() => {
        // Apply theme to document
        const root = document.documentElement;

        if (theme === 'system') {
            // Detect system preference
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (isDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        } else if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    // Listen for system theme changes when theme is set to 'system'
    useEffect(() => {
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                const root = document.documentElement;
                if (e.matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('timezone', timezone);
    }, [timezone]);

    const [font, setFont] = useState(() => {
        return localStorage.getItem('font') || 'Inter';
    });

    useEffect(() => {
        // Apply font to document
        const root = document.documentElement;

        // 1. Dynamic Google Fonts Loading
        const fontId = 'dynamic-google-font';
        let link = document.getElementById(fontId);

        if (!link) {
            link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        // Format font name for Google Fonts URL
        const fontNameForUrl = font.replace(/ /g, '+');
        link.href = `https://fonts.googleapis.com/css2?family=${fontNameForUrl}:wght@100;300;400;500;700;900&display=swap`;

        // 2. Apply font family to body
        // We use a CSS variable to make it easy for tailwind or other styles to refer to it if needed
        root.style.setProperty('--font-family-primary', `'${font}', sans-serif`);
        document.body.style.fontFamily = `'${font}', sans-serif`;

        // REMOVED: localStorage.setItem('font', font); // Only persist on Save
    }, [font]);

    const [currentVertical, setCurrentVertical] = useState(() => {
        return localStorage.getItem('vertical') || 'TAXI';
    });

    // Enforce vertical based on role
    useEffect(() => {
        if (user) {
            if (user.role === 'LOGISTICS_ADMIN' || (user.role === 'ORG_ADMIN' && user.vertical === 'LOGISTICS')) {
                setCurrentVertical('LOGISTICS');
            } else if (user.role === 'TAXI_ADMIN' || (user.role === 'ORG_ADMIN' && user.vertical === 'TAXI')) {
                setCurrentVertical('TAXI');
            }
        }
    }, [user]);

    useEffect(() => {
        localStorage.setItem('vertical', currentVertical);
    }, [currentVertical]);

    const updateTheme = (newTheme) => {
        setTheme(newTheme);
    };

    const updateActiveTheme = (newTheme) => {
        setActiveTheme(newTheme);
    };

    const updateTimezone = (newTimezone) => {
        setTimezone(newTimezone);
    };

    const updateFont = (newFont) => {
        setFont(newFont);
    };

    const toggleVertical = (vertical) => {
        setCurrentVertical(vertical);
    }

    const value = {
        theme,
        activeTheme,
        timezone,
        font,
        currentVertical,
        updateTheme,
        updateActiveTheme,
        updateTimezone,
        updateFont,
        toggleVertical
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

