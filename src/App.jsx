import React, { useState, useEffect, useCallback } from 'react';
import TypingTest from './components/TypingTest';
import ResultsModal from './components/ResultsModal';
import ThemeToggle from './components/ThemeToggle';
import ShareButton from './components/ShareButton';

// Custom hook for theme management
export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or detect system preference
    const savedTheme = localStorage.getItem('typing-test-theme');
    if (savedTheme) {
      return savedTheme;
    }

    // Detect system preference for automatic theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('typing-test-theme', theme);
  }, [theme]);

  // Apply theme to document root for CSS custom properties
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e) => {
      // Only auto-update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('typing-test-theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return { theme, toggleTheme };
};

function App() {
  const { theme } = useTheme();
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState({});

  const handleTestComplete = useCallback((results) => {
    setTestResults(results);
    setShowResults(true);
  }, []);


  return (
    <>
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-md"
      >
        Skip to main content
      </a>

      <div className="min-h-screen theme-transition"
            style={{
              backgroundColor: 'rgb(var(--bg-primary))',
              color: 'rgb(var(--text-primary))'
            }}
            role="application"
            aria-label="Typing Speed Test Application">

        {/* Simplified Header */}
        <header className="flex justify-between items-center p-4 theme-transition"
                style={{
                  borderBottom: '1px solid rgb(var(--border-primary))'
                }}
                role="banner">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            Typing Speed Test
          </h1>
          <ThemeToggle />
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8" id="main-content" role="main">
          <TypingTest
            onTestComplete={handleTestComplete}
          />
        </main>

        {/* Results Modal */}
        {showResults && (
          <ResultsModal
            isOpen={showResults}
            onClose={() => setShowResults(false)}
            onRestart={() => {
              setShowResults(false);
              setTestResults({});
            }}
            results={testResults}
            actions={<ShareButton />}
          />
        )}
      </div>
    </>
  );
}

export default App;
