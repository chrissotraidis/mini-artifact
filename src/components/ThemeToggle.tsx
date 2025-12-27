import React, { useEffect } from 'react';
import { useStore, selectTheme, type Theme } from '../store';
import { Sun, Moon } from 'lucide-react';

// ============================================================
// ThemeToggle - Dark/Light Mode Toggle Button
// ============================================================

export function ThemeToggle() {
    const theme = useStore(selectTheme);
    const toggleTheme = useStore((s) => s.toggleTheme);
    const setTheme = useStore((s) => s.setTheme);

    // Apply theme to document on mount and when theme changes
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Also apply on initial mount from localStorage
    useEffect(() => {
        const storedTheme = localStorage.getItem('mini-artifact-theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', storedTheme);
            if (storedTheme !== theme) {
                setTheme(storedTheme as Theme);
            }
        } else {
            // Default to dark
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {theme === 'dark' ? (
                <Sun size={18} className="theme-toggle-icon" />
            ) : (
                <Moon size={18} className="theme-toggle-icon" />
            )}
        </button>
    );
}

export default ThemeToggle;
