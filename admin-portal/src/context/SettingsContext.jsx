import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
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

    const updateTheme = (newTheme) => {
        setTheme(newTheme);
    };

    const updateTimezone = (newTimezone) => {
        setTimezone(newTimezone);
    };

    const value = {
        theme,
        timezone,
        updateTheme,
        updateTimezone
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

