import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('adminUser');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setPreferences(parsedUser.organizationPreferences || null);
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                localStorage.removeItem('adminUser');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        setPreferences(userData.organizationPreferences || null);
        localStorage.setItem('adminUser', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setPreferences(null);
        localStorage.removeItem('adminUser');
    };

    // Apply primary color to root CSS variables for dynamic themes
    useEffect(() => {
        if (preferences?.theme?.primaryColor) {
            document.documentElement.style.setProperty('--color-primary', preferences.theme.primaryColor);
        } else {
            document.documentElement.style.removeProperty('--color-primary');
        }
    }, [preferences]);

    const value = {
        user,
        preferences,
        login,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
