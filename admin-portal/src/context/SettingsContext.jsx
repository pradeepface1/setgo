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

    const [currentVertical, setCurrentVertical] = useState(() => {
        return localStorage.getItem('vertical') || 'TAXI';
    });

    // Enforce vertical based on role
    useEffect(() => {
        if (user) {
            if (user.role === 'LOGISTICS_ADMIN') {
                setCurrentVertical('LOGISTICS');
            } else if (user.role === 'TAXI_ADMIN') {
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

    const updateTimezone = (newTimezone) => {
        setTimezone(newTimezone);
    };

    const toggleVertical = (vertical) => {
        setCurrentVertical(vertical);
    }

    const value = {
        theme,
        timezone,
        currentVertical,
        updateTheme,
        updateTimezone,
        toggleVertical
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

