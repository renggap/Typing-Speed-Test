import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import TypingTest from './components/TypingTest';
import ResultsModal from './components/ResultsModal';
import DurationSelector from './components/DurationSelector';
import ThemeToggle from './components/ThemeToggle';
import ShareButton from './components/ShareButton';
import PersonalBestDisplay from './components/PersonalBestDisplay';
import { usePersonalBest } from './hooks/usePersonalBest';

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

function App() {
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
  const [showResults, setShowResults] = useState(false);
  const [testDuration, setTestDuration] = useState(60); // seconds
  const [testResults, setTestResults] = useState({});
  const [showPersonalBest, setShowPersonalBest] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [activeShortcut, setActiveShortcut] = useState(null);

  // Personal best hook
  const { recordResult, personalBests, isNewPersonalBest } = usePersonalBest();

  // Keyboard shortcuts configuration
  const keyboardShortcuts = {
    // Global shortcuts
    ' ': () => {
      setActiveShortcut('Space');
      handleStartNewTest();
      setTimeout(() => setActiveShortcut(null), 150);
    },
    'Enter': () => {
      setActiveShortcut('Enter');
      handleStartNewTest();
      setTimeout(() => setActiveShortcut(null), 150);
    },
    'Escape': () => {
      setActiveShortcut('Esc');
      if (showResults) setShowResults(false);
      else if (showPersonalBest) setShowPersonalBest(false);
      else if (showKeyboardHelp) setShowKeyboardHelp(false);
      setTimeout(() => setActiveShortcut(null), 150);
    },
    't': () => {
      setActiveShortcut('T');
      toggleTheme();
      setTimeout(() => setActiveShortcut(null), 150);
    },
    'T': () => {
      setActiveShortcut('T');
      toggleTheme();
      setTimeout(() => setActiveShortcut(null), 150);
    },
    '?': () => {
      setActiveShortcut('?');
      setShowKeyboardHelp(!showKeyboardHelp);
      setTimeout(() => setActiveShortcut(null), 150);
    },
    '/': () => {
      setActiveShortcut('/');
      setShowKeyboardHelp(!showKeyboardHelp);
      setTimeout(() => setActiveShortcut(null), 150);
    },

    // Duration shortcuts (1-4)
    '1': () => {
      setActiveShortcut('1');
      setTestDuration(15);
      setTimeout(() => setActiveShortcut(null), 150);
    },
    '2': () => {
      setActiveShortcut('2');
      setTestDuration(30);
      setTimeout(() => setActiveShortcut(null), 150);
    },
    '3': () => {
      setActiveShortcut('3');
      setTestDuration(60);
      setTimeout(() => setActiveShortcut(null), 150);
    },
    '4': () => {
      setActiveShortcut('4');
      setTestDuration(120);
      setTimeout(() => setActiveShortcut(null), 150);
    },

    // Modal-specific shortcuts
    ...(showResults && {
      'r': () => {
        setActiveShortcut('R');
        handleRestart();
        setTimeout(() => setActiveShortcut(null), 150);
      },
      'R': () => {
        setActiveShortcut('R');
        handleRestart();
        setTimeout(() => setActiveShortcut(null), 150);
      },
      's': () => {
        setActiveShortcut('S');
        handleShare();
        setTimeout(() => setActiveShortcut(null), 150);
      },
      'S': () => {
        setActiveShortcut('S');
        handleShare();
        setTimeout(() => setActiveShortcut(null), 150);
      },
      'd': () => {
        setActiveShortcut('D');
        handleDownload();
        setTimeout(() => setActiveShortcut(null), 150);
      },
      'D': () => {
        setActiveShortcut('D');
        handleDownload();
        setTimeout(() => setActiveShortcut(null), 150);
      },
    }),

    // Personal best shortcuts
    'p': () => {
      setActiveShortcut('P');
      setShowPersonalBest(!showPersonalBest);
      setTimeout(() => setActiveShortcut(null), 150);
    },
    'P': () => {
      setActiveShortcut('P');
      setShowPersonalBest(!showPersonalBest);
      setTimeout(() => setActiveShortcut(null), 150);
    },
  };

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

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const handleStartNewTest = useCallback(() => {
    if (!showResults && !showPersonalBest) {
      // This will be handled by TypingTest component
      const event = new CustomEvent('startNewTest');
      window.dispatchEvent(event);
    }
  }, [showResults, showPersonalBest]);

  const handleRestart = useCallback(() => {
    if (showResults) {
      setShowResults(false);
      setTestResults({});
      const event = new CustomEvent('restartTest');
      window.dispatchEvent(event);
    }
  }, [showResults]);

  const handleShare = useCallback(() => {
    if (showResults && testResults.wpm) {
      const event = new CustomEvent('shareResults');
      window.dispatchEvent(event);
    }
  }, [showResults, testResults]);

  const handleDownload = useCallback(() => {
    if (showResults && testResults.wpm) {
      const event = new CustomEvent('downloadResult');
      window.dispatchEvent(event);
    }
  }, [showResults, testResults]);

  const handleTestComplete = useCallback((results) => {
    setTestResults(results);
    setShowResults(true);

    // Record the result for personal best tracking
    recordResult(results);
  }, [recordResult]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const shortcut = keyboardShortcuts[e.key];
      if (shortcut) {
        e.preventDefault();
        shortcut();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts]);

  // Global event listeners for accessibility announcements
  useEffect(() => {
    const handleTypingTestError = (e) => {
      const announcement = document.getElementById('alerts');
      if (announcement) {
        announcement.textContent = e.detail.message;
      }
    };

    const handleTypingTestSuccess = (e) => {
      const announcement = document.getElementById('announcements');
      if (announcement) {
        announcement.textContent = e.detail.message;
      }
    };

    window.addEventListener('typingTestError', handleTypingTestError);
    window.addEventListener('typingTestSuccess', handleTypingTestSuccess);

    return () => {
      window.removeEventListener('typingTestError', handleTypingTestError);
      window.removeEventListener('typingTestSuccess', handleTypingTestSuccess);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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

        {/* Header with navigation landmark */}
        <header className="flex justify-between items-center p-4 theme-transition"
                style={{
                  borderBottom: '1px solid rgb(var(--border-primary))'
                }}
                role="banner">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              Typing Speed Test
            </h1>
            {/* Personal Best Indicator */}
            {personalBests && personalBests.wpm > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Best:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(personalBests.wpm)} WPM
                </span>
                <span className="text-gray-500">•</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {Math.round(personalBests.accuracy)}%
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <DurationSelector
              duration={testDuration}
              onDurationChange={setTestDuration}
            />
            <button
              onClick={() => setShowPersonalBest(!showPersonalBest)}
              className="px-3 py-2 text-sm font-medium rounded-md theme-transition cursor-pointer focus-visible"
              style={{
                backgroundColor: showPersonalBest
                  ? 'rgb(var(--primary-500))'
                  : 'rgb(var(--bg-tertiary))',
                color: showPersonalBest
                  ? 'white'
                  : 'rgb(var(--text-primary))',
                border: '1px solid rgb(var(--border-primary))'
              }}
              title="View Personal Records (P)"
              aria-label={showPersonalBest ? "Hide personal records" : "Show personal records"}
              aria-pressed={showPersonalBest}
              aria-describedby="personal-records-description"
            >
              📊 Records
            </button>
            <span id="personal-records-description" className="sr-only">
              View your typing speed test history and personal best scores
            </span>

            <button
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              className="px-3 py-2 text-sm font-medium rounded-md theme-transition cursor-pointer focus-visible"
              style={{
                backgroundColor: showKeyboardHelp
                  ? 'rgb(var(--primary-500))'
                  : 'rgb(var(--bg-tertiary))',
                color: showKeyboardHelp
                  ? 'white'
                  : 'rgb(var(--text-primary))',
                border: '1px solid rgb(var(--border-primary))'
              }}
              title="Keyboard Shortcuts (?)"
              aria-label={showKeyboardHelp ? "Hide keyboard shortcuts help" : "Show keyboard shortcuts help"}
              aria-pressed={showKeyboardHelp}
              aria-describedby="keyboard-help-description"
            >
              ⌨️ Help
            </button>
            <span id="keyboard-help-description" className="sr-only">
              Show available keyboard shortcuts for controlling the application
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Active Shortcut Indicator */}
        {activeShortcut && (
          <div
            className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-3 py-1 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="font-mono text-sm">{activeShortcut}</span>
          </div>
        )}

        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="announcements" />
        <div aria-live="assertive" aria-atomic="true" className="sr-only" id="alerts" />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8" id="main-content" role="main">
          <TypingTest
            duration={testDuration}
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
            testDuration={testDuration}
            actions={<ShareButton />}
          />
        )}

        {/* Personal Best Modal */}
        {showPersonalBest && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="personal-best-title"
            aria-describedby="personal-best-description"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div id="personal-best-title" className="sr-only">Personal Best Records</div>
              <div id="personal-best-description" className="sr-only">
                View your typing speed test history and personal best scores
              </div>
              <PersonalBestDisplay
                isVisible={showPersonalBest}
                onClose={() => setShowPersonalBest(false)}
              />
            </div>
          </div>
        )}

        {/* Keyboard Help Modal */}
        {showKeyboardHelp && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="keyboard-help-title"
            aria-describedby="keyboard-help-description"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200" id="keyboard-help-title">
                    Keyboard Shortcuts
                  </h2>
                  <button
                    onClick={() => setShowKeyboardHelp(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    aria-label="Close keyboard shortcuts help"
                  >
                    ✕
                  </button>
                </div>
                <div id="keyboard-help-description">
                  Available keyboard shortcuts for controlling the typing speed test application
                </div>

                <div className="space-y-6">
                  {/* Global Shortcuts */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                      Global Shortcuts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">Space / Enter</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Start new test</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">T</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Toggle theme</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">P</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Personal records</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">? / /</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Show/hide help</span>
                      </div>
                    </div>
                  </div>

                  {/* Duration Shortcuts */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                      Test Duration
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">1</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">15 seconds</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">2</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">30 seconds</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">3</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">1 minute</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">4</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">2 minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Results Modal Shortcuts */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                      Results Modal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">R</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Restart test</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">S</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Share results</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">D</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Download card</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">Esc</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Close modal</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Press <span className="font-mono">Esc</span> to close this help dialog
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
