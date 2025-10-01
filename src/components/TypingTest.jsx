import React, { useState, useEffect, useCallback, useRef } from 'react';
import { calculateWPM, calculateAccuracy, calculateNetWPM } from '../utils/calculations.js';
import {
  getRandomQuote,
  getProgressiveQuote,
  markCurrentQuoteUsed,
  getQuoteStats,
  resetQuoteTracking
} from '../utils/textGenerator.js';

const TypingTest = ({ duration = 60, onTestComplete }) => {
  // State management
  const [testState, setTestState] = useState('idle'); // 'idle' | 'active' | 'complete'
  const [currentText, setCurrentText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(60); // Default 60 seconds
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [testDuration, setTestDuration] = useState(60); // Selected duration
  const [error, setError] = useState(null); // Error state for announcements

  // Enhanced quote system state
  const [currentQuote, setCurrentQuote] = useState(null);
  const [lastDifficulty, setLastDifficulty] = useState(null);
  const [userWPMHistory, setUserWPMHistory] = useState([]);
  const [showDifficulty, setShowDifficulty] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Duration options
  const durationOptions = [
    { label: '15s', value: 15 },
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
    { label: '120s', value: 120 }
  ];

  // Initialize test with progressive quote selection
  const startTest = useCallback(() => {
    try {
      setError(null); // Clear any previous errors

      // Calculate average WPM from recent performance
      const avgWPM = userWPMHistory.length > 0
        ? userWPMHistory.reduce((sum, wpm) => sum + wpm, 0) / userWPMHistory.length
        : 0;

      // Get progressive quote based on user performance
      const quote = getProgressiveQuote(avgWPM, lastDifficulty);

      if (!quote || !quote.text) {
        throw new Error('Unable to load quote for typing test. Please try again.');
      }

      setCurrentQuote(quote);
      setCurrentText(quote.text);
      setLastDifficulty(quote.difficulty);
      setTypedText('');
      setErrors(0);
      setStartTime(Date.now());
      setTimeRemaining(testDuration);
      setTestState('active');
      setWpm(0);
      setAccuracy(100);

      // Focus the input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err) {
      setError(err.message);
      // Announce error to screen readers
      const errorEvent = new CustomEvent('typingTestError', {
        detail: { message: err.message }
      });
      window.dispatchEvent(errorEvent);
    }

    // Start countdown timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setTestState('complete');
          clearInterval(timerRef.current);

          // Track the completed quote and update WPM history
          if (currentQuote) {
            markCurrentQuoteUsed(currentQuote);
            setUserWPMHistory(prev => [...prev, wpm].slice(-5)); // Keep last 5 WPM scores
          }

          // Pass results to parent component
          if (onTestComplete) {
            const timeElapsed = testDuration;
            const results = {
              wpm,
              accuracy,
              errors,
              totalChars: typedText.length,
              correctChars: typedText.length - errors,
              timeElapsed,
              testDuration,
              quote: currentQuote
            };
            onTestComplete(results);
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [testDuration]);

  // Handle key press events
  const handleKeyPress = useCallback((e) => {
    if (testState !== 'active') return;

    const key = e.key;
    const currentLength = typedText.length;

    // Handle backspace
    if (key === 'Backspace') {
      if (currentLength > 0) {
        const newTypedText = typedText.slice(0, -1);
        setTypedText(newTypedText);

        // Recalculate errors for the new length
        let newErrors = 0;
        for (let i = 0; i < newTypedText.length; i++) {
          if (newTypedText[i] !== currentText[i]) {
            newErrors++;
          }
        }
        setErrors(newErrors);

        // Update WPM and accuracy
        if (startTime) {
          const timeElapsed = (Date.now() - startTime) / 1000;
          const currentWpm = calculateNetWPM(newTypedText.length, newErrors, timeElapsed);
          const currentAccuracy = calculateAccuracy(newTypedText.length - newErrors, newTypedText.length);
          setWpm(currentWpm);
          setAccuracy(currentAccuracy);
        }
      }
      return;
    }

    // Ignore non-printable characters except space
    if (key.length > 1 && key !== ' ') return;

    // Check if we've reached the end of the text
    if (currentLength >= currentText.length) return;

    const newTypedText = typedText + key;
    setTypedText(newTypedText);

    // Check for error
    const isCorrect = key === currentText[currentLength];
    if (!isCorrect) {
      setErrors(prev => prev + 1);
    }

    // Update WPM and accuracy
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000;
      const currentWpm = calculateNetWPM(newTypedText.length, errors + (isCorrect ? 0 : 1), timeElapsed);
      const correctChars = newTypedText.length - (errors + (isCorrect ? 0 : 1));
      const currentAccuracy = calculateAccuracy(correctChars, newTypedText.length);
      setWpm(currentWpm);
      setAccuracy(currentAccuracy);
    }

    // Check if test is complete
    if (newTypedText.length >= currentText.length) {
      setTestState('complete');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Track the completed quote and update WPM history
      if (currentQuote) {
        markCurrentQuoteUsed(currentQuote);
        setUserWPMHistory(prev => [...prev, wpm].slice(-5)); // Keep last 5 WPM scores
      }

      // Pass results to parent component
      if (onTestComplete) {
        const timeElapsed = (Date.now() - startTime) / 1000;
        const results = {
          wpm,
          accuracy,
          errors,
          totalChars: newTypedText.length,
          correctChars: newTypedText.length - errors,
          timeElapsed,
          testDuration,
          quote: currentQuote
        };
        onTestComplete(results);
      }
    }
  }, [testState, typedText, currentText, errors, startTime]);

  // Handle restart
  const handleRestart = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTestState('idle');
    setTypedText('');
    setErrors(0);
    setStartTime(null);
    setTimeRemaining(testDuration);
    setWpm(0);
    setAccuracy(100);

    // Reset quote tracking for fresh start
    resetQuoteTracking();
    setUserWPMHistory([]);
    setLastDifficulty(null);
  }, [testDuration]);

  // Handle duration change
  const handleDurationChange = useCallback((duration) => {
    setTestDuration(duration);
    setTimeRemaining(duration);
  }, []);

  // Keyboard event listener
  useEffect(() => {
    if (testState === 'active') {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [testState, handleKeyPress]);

  // Global keyboard shortcuts for TypingTest
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Don't trigger shortcuts when user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Handle restart shortcut (R key)
      if (e.key === 'r' || e.key === 'R') {
        if (testState === 'active' || testState === 'complete') {
          e.preventDefault();
          handleRestart();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [testState, handleRestart]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Render character with highlighting
  const renderText = () => {
    return currentText.split('').map((char, index) => {
      let textColor = 'rgb(var(--text-muted))'; // Unreached text
      let backgroundColor = 'transparent';

      if (index < typedText.length) {
        // Already typed characters
        if (typedText[index] === char) {
          textColor = 'rgb(var(--success-600))';
          backgroundColor = 'rgba(var(--success-100), 0.3)';
        } else {
          textColor = 'rgb(var(--error-600))';
          backgroundColor = 'rgba(var(--error-100), 0.3)';
        }
      } else if (index === typedText.length) {
        // Current character to type
        textColor = 'rgb(var(--text-primary))';
        backgroundColor = 'rgb(var(--bg-tertiary))';
      }

      return (
        <span
          key={index}
          className={`theme-transition ${char === ' ' ? 'mr-1' : ''}`}
          style={{
            color: textColor,
            backgroundColor: backgroundColor,
            padding: '2px 4px',
            borderRadius: '4px',
            animation: index === typedText.length ? 'pulse 2s infinite' : 'none'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 card" role="region" aria-labelledby="typing-test-title">
      {/* Error announcements for screen readers */}
      {error && (
        <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }} id="typing-test-title">
          Typing Speed Test
        </h1>
        <p style={{ color: 'rgb(var(--text-secondary))' }} id="typing-test-description">
          Test your typing speed and accuracy
        </p>
      </header>

      {/* Controls Section */}
      <div className="mb-6 space-y-4">
        {/* Test Duration Selector */}
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-secondary))' }} id="duration-label">
            Test Duration:
          </p>
          <div className="flex space-x-2" role="radiogroup" aria-labelledby="duration-label">
            {durationOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleDurationChange(option.value)}
                disabled={testState === 'active'}
                className="px-4 py-2 rounded-full text-sm font-medium theme-transition cursor-pointer focus-visible"
                style={{
                  backgroundColor: testDuration === option.value
                    ? 'rgb(var(--primary-500))'
                    : 'rgb(var(--bg-tertiary))',
                  color: testDuration === option.value
                    ? 'white'
                    : 'rgb(var(--text-primary))',
                  border: '1px solid rgb(var(--border-primary))',
                  opacity: testState === 'active' ? '0.5' : '1'
                }}
                role="radio"
                aria-checked={testDuration === option.value}
                aria-describedby={`duration-${option.value}-description`}
                onMouseEnter={(e) => {
                  if (testDuration !== option.value && testState !== 'active') {
                    e.target.style.backgroundColor = 'rgb(var(--bg-secondary))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (testDuration !== option.value && testState !== 'active') {
                    e.target.style.backgroundColor = 'rgb(var(--bg-tertiary))';
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          {durationOptions.map(option => (
            <div key={option.value} id={`duration-${option.value}-description`} className="sr-only">
              Set test duration to {option.label} ({option.value} seconds)
            </div>
          ))}
        </div>

        {/* Quote Options */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDifficulty(!showDifficulty)}
              className="px-3 py-1 text-xs font-medium rounded theme-transition cursor-pointer focus-visible"
              style={{
                backgroundColor: showDifficulty ? 'rgb(var(--primary-500))' : 'rgb(var(--bg-tertiary))',
                color: showDifficulty ? 'white' : 'rgb(var(--text-primary))',
                border: '1px solid rgb(var(--border-primary))'
              }}
              aria-pressed={showDifficulty}
              aria-describedby="difficulty-description"
            >
              {showDifficulty ? 'Hide' : 'Show'} Difficulty
            </button>
            <div id="difficulty-description" className="sr-only">
              Toggle display of quote difficulty level and source information
            </div>
          </div>

          <div className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
            {getQuoteStats().total} quotes available
          </div>
        </div>
      </div>

      {/* Typing Area */}
      <div className="mb-6">
        {/* Quote Info Bar */}
        {currentQuote && showDifficulty && (
          <div className="mb-3 flex justify-between items-center" role="region" aria-label="Quote information">
            <div className="flex space-x-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  currentQuote.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  currentQuote.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
                role="status"
                aria-label={`Difficulty: ${currentQuote.difficulty}`}
              >
                {currentQuote.difficulty.toUpperCase()}
              </span>
              {currentQuote.category && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800" role="status" aria-label={`Category: ${currentQuote.category}`}>
                  {currentQuote.category.charAt(0).toUpperCase() + currentQuote.category.slice(1)}
                </span>
              )}
            </div>
            {currentQuote.author && (
              <span className="text-xs text-gray-500" role="status" aria-label={`Author: ${currentQuote.author}`}>
                — {currentQuote.author}
              </span>
            )}
          </div>
        )}

        <div
          className="rounded-lg p-6 min-h-[120px] font-mono text-lg leading-relaxed theme-transition"
          style={{
            backgroundColor: 'rgb(var(--bg-tertiary))',
            border: '2px solid rgb(var(--border-primary))'
          }}
          role="textbox"
          aria-multiline="true"
          aria-label={`Typing test text${currentText ? ': ' + currentText.length + ' characters' : ': waiting for test to start'}`}
          aria-describedby="typing-instructions typing-status"
          tabIndex={testState === 'active' ? 0 : -1}
        >
          {currentText ? renderText() : (
            <p style={{ color: 'rgb(var(--text-muted))' }} id="typing-instructions">
              Click "Start Test" to begin typing...
            </p>
          )}
        </div>
        <div id="typing-instructions" className="sr-only">
          Type the text that appears in the box above. The current character to type will be highlighted.
        </div>
        <div id="typing-status" className="sr-only" aria-live="polite">
          {testState === 'idle' && 'Ready to start typing test'}
          {testState === 'active' && `Test in progress. ${timeRemaining} seconds remaining. ${typedText.length} of ${currentText.length} characters typed.`}
          {testState === 'complete' && `Test completed. Final score: ${Math.round(wpm)} WPM, ${Math.round(accuracy)}% accuracy.`}
        </div>
      </div>

      {/* Stats Display */}
      <div className="flex justify-between items-center mb-6" role="region" aria-label="Test statistics" aria-live="polite">
        <div className="flex space-x-6">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'rgb(var(--primary-500))' }} aria-label={`Words per minute: ${Math.round(wpm)}`}>
              {Math.round(wpm)}
            </p>
            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>WPM</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'rgb(var(--success-500))' }} aria-label={`Accuracy: ${Math.round(accuracy)} percent`}>
              {Math.round(accuracy)}%
            </p>
            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'rgb(var(--warning-500))' }} aria-label={`Errors: ${errors}`}>
              {errors}
            </p>
            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>Errors</p>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-3xl font-bold"
             style={{
               color: timeRemaining <= 10
                 ? 'rgb(var(--error-500))'
                 : 'rgb(var(--text-primary))'
             }}
             aria-label={`Time remaining: ${timeRemaining} seconds`}
             role="timer"
             aria-live="polite"
             aria-atomic="true">
            {timeRemaining}s
          </p>
          <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>Time Left</p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center space-x-4" role="group" aria-label="Test controls">
        {testState === 'idle' && (
          <button
            onClick={startTest}
            className="px-8 py-3 font-semibold rounded-lg theme-transition hover:scale-105 focus-visible"
            style={{
              backgroundColor: 'rgb(var(--success-500))',
              color: 'white',
              border: '1px solid rgb(var(--success-600))'
            }}
            aria-describedby="start-test-description"
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgb(var(--success-600))';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgb(var(--success-500))';
            }}
          >
            Start Test
          </button>
        )}

        {testState === 'active' && (
          <button
            onClick={handleRestart}
            className="px-8 py-3 font-semibold rounded-lg theme-transition hover:scale-105 focus-visible"
            style={{
              backgroundColor: 'rgb(var(--error-500))',
              color: 'white',
              border: '1px solid rgb(var(--error-600))'
            }}
            aria-describedby="restart-test-description"
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgb(var(--error-600))';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgb(var(--error-500))';
            }}
          >
            Restart
          </button>
        )}

        {testState === 'complete' && (
          <>
            <button
              onClick={startTest}
              className="px-8 py-3 font-semibold rounded-lg theme-transition hover:scale-105 focus-visible"
              style={{
                backgroundColor: 'rgb(var(--primary-500))',
                color: 'white',
                border: '1px solid rgb(var(--primary-600))'
              }}
              aria-describedby="try-again-description"
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgb(var(--primary-600))';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgb(var(--primary-500))';
              }}
            >
              Try Again
            </button>
            <button
              onClick={handleRestart}
              className="px-8 py-3 font-semibold rounded-lg theme-transition hover:scale-105 focus-visible"
              style={{
                backgroundColor: 'rgb(var(--bg-tertiary))',
                color: 'rgb(var(--text-primary))',
                border: '1px solid rgb(var(--border-primary))'
              }}
              aria-describedby="new-quote-description"
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgb(var(--bg-secondary))';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgb(var(--bg-tertiary))';
              }}
            >
              New Quote
            </button>
          </>
        )}
      </div>

      {/* Hidden descriptions for screen readers */}
      <div className="sr-only">
        <div id="start-test-description">Begin a new typing speed test with a random quote</div>
        <div id="restart-test-description">Stop current test and start over with a new quote</div>
        <div id="try-again-description">Take the same test again with the same quote</div>
        <div id="new-quote-description">Start over with a different quote</div>
      </div>

      {/* Hidden input for focus management */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute pointer-events-none"
        onChange={() => {}}
      />
    </div>
  );
};

export default TypingTest;