import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../App.jsx';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg theme-transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      style={{
        backgroundColor: 'rgb(var(--bg-secondary))',
        color: 'rgb(var(--text-primary))',
        border: '1px solid rgb(var(--border-primary))'
      }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <Sun
          size={20}
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
            theme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-180 scale-0'
          }`}
          style={{ color: 'rgb(var(--text-primary))' }}
        />

        {/* Moon icon */}
        <Moon
          size={20}
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
            theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-180 scale-0'
          }`}
          style={{ color: 'rgb(var(--text-primary))' }}
        />
      </div>

      {/* Screen reader text */}
      <span className="sr-only">
        Switch to {theme === 'light' ? 'dark' : 'light'} mode
      </span>
    </button>
  );
};

export default ThemeToggle;