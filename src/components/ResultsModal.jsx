import React, { useEffect, useState, useRef } from 'react';
import { getPerformanceCategory, getAccuracyModifier, calculateRawWPM } from '../utils/calculations.js';
import { downloadResultCard } from '../utils/resultCard.js';
import ShareButton from './ShareButton.jsx';
import { usePersonalBest } from '../hooks/usePersonalBest.js';

const ResultsModal = ({
  isOpen,
  onClose,
  onRestart,
  results = {},
  testDuration = 60,
  actions
}) => {
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Personal best tracking
  const {
    personalBests,
    isNewPersonalBest,
    newAchievements,
    wouldBePersonalBest,
    getPerformanceStats
  } = usePersonalBest();

  // Check if this result is a personal best
  const isPersonalBest = results.wpm && personalBests ?
    wouldBePersonalBest(results.wpm, results.accuracy, testDuration) : false;

  // Check if this result beat the duration-specific record
  const isDurationBest = results.wpm && personalBests?.byDuration?.[testDuration] ?
    results.wpm > personalBests.byDuration[testDuration].wpm : false;

  // Focus management and escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement;

      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Add event listeners
      document.addEventListener('keydown', handleEscape);

      // Trap focus within modal
      const handleTabKey = (e) => {
        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleTabKey);

        // Restore focus to the previously focused element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle card download
  const handleDownloadCard = async () => {
    setIsGeneratingCard(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      await downloadResultCard(results, 'light'); // Use light theme for social sharing

      // Announce success to screen readers
      const successEvent = new CustomEvent('typingTestSuccess', {
        detail: { message: 'Result card downloaded successfully' }
      });
      window.dispatchEvent(successEvent);
    } catch (error) {
      console.error('Error generating result card:', error);

      // Announce error to screen readers
      const errorEvent = new CustomEvent('typingTestError', {
        detail: { message: 'Failed to download result card. Please try again.' }
      });
      window.dispatchEvent(errorEvent);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const {
    wpm = 0,
    accuracy = 0,
    errors = 0,
    totalChars = 0,
    timeElapsed = testDuration
  } = results;

  // Get performance category
  const category = getPerformanceCategory(wpm, accuracy);
  const accuracyModifier = getAccuracyModifier(wpm, accuracy);

  // Calculate additional metrics
  const rawWpm = calculateRawWPM(totalChars, timeElapsed);
  const timeInMinutes = timeElapsed / 60;

  // Get category-specific styling
  const getCategoryStyles = () => {
    const baseStyles = {
      emoji: category.emoji,
      name: category.name,
      description: category.description
    };

    switch (category.name) {
      case 'Legend':
        return {
          ...baseStyles,
          gradient: 'from-yellow-400 via-red-500 via-pink-500 via-purple-500 to-blue-500',
          textColor: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 via-pink-500 via-purple-500 to-blue-500',
          bgColor: 'bg-gradient-to-r from-yellow-400/10 via-red-500/10 via-pink-500/10 via-purple-500/10 to-blue-500/10',
          borderColor: 'border-purple-500/30',
          glow: 'shadow-2xl shadow-purple-500/25'
        };
      case 'Master':
        return {
          ...baseStyles,
          gradient: 'from-yellow-400 to-yellow-600',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          glow: 'shadow-2xl shadow-yellow-500/25'
        };
      case 'Expert':
        return {
          ...baseStyles,
          gradient: 'from-orange-400 to-orange-600',
          textColor: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          glow: 'shadow-2xl shadow-orange-500/25'
        };
      case 'Advanced':
        return {
          ...baseStyles,
          gradient: 'from-purple-400 to-purple-600',
          textColor: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/30',
          glow: 'shadow-xl shadow-purple-500/20'
        };
      case 'Intermediate':
        return {
          ...baseStyles,
          gradient: 'from-blue-400 to-blue-600',
          textColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          glow: 'shadow-xl shadow-blue-500/20'
        };
      default: // Beginner
        return {
          ...baseStyles,
          gradient: 'from-gray-400 to-gray-600',
          textColor: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30',
          glow: 'shadow-lg shadow-gray-500/15'
        };
    }
  };

  const categoryStyles = getCategoryStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="results-title"
      aria-describedby="results-description"
    >
      <div
        ref={modalRef}
        className={`
          relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
          bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl
          border border-neutral-200 dark:border-neutral-700
          ${categoryStyles.glow}
          animate-in zoom-in-95 duration-300
        `}
        role="document"
        tabIndex="-1"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors focus-visible"
          aria-label="Close results modal"
        >
          <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="pt-8 pb-6 px-8">
          <div className="text-center">
            <div className={`text-6xl mb-2 ${categoryStyles.textColor}`}>
              {category.emoji}
            </div>
            <h2 className={`text-3xl font-bold mb-2 ${categoryStyles.textColor}`}>
              {category.name}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-lg">
              {category.description}
            </p>
          </div>
        </div>

        {/* Main Stats */}
        <div className="px-8 pb-6">
          <div className="grid grid-cols-2 gap-6 mb-8" role="region" aria-label="Primary results">
            {/* WPM Display */}
            <div className="text-center p-6 rounded-xl bg-neutral-50 dark:bg-neutral-700/50" role="region" aria-labelledby="wpm-label">
              <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2" id="wpm-label" aria-label={`Words per minute: ${Math.round(wpm)}`}>
                {Math.round(wpm)}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                Net WPM
              </div>
              {accuracyModifier.bonus > 0 && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1" role="status" aria-label={`Accuracy bonus: plus ${accuracyModifier.bonus} words per minute`}>
                  +{accuracyModifier.bonus} bonus
                </div>
              )}
            </div>

            {/* Accuracy Display */}
            <div className="text-center p-6 rounded-xl bg-neutral-50 dark:bg-neutral-700/50" role="region" aria-labelledby="accuracy-label">
              <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2" id="accuracy-label" aria-label={`Accuracy: ${Math.round(accuracy)} percent`}>
                {Math.round(accuracy)}%
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                Accuracy
              </div>
              <div className={`text-xs mt-1 ${
                accuracy >= 95 ? 'text-green-600 dark:text-green-400' :
                accuracy >= 90 ? 'text-blue-600 dark:text-blue-400' :
                'text-orange-600 dark:text-orange-400'
              }`}
              role="status"
              aria-label={`Performance level: ${accuracy === 100 ? 'Perfect' : accuracy >= 95 ? 'Excellent' : accuracy >= 90 ? 'Good' : 'Keep practicing'}`}>
                {accuracy === 100 ? 'Perfect!' : accuracy >= 95 ? 'Excellent!' : accuracy >= 90 ? 'Good!' : 'Keep practicing!'}
              </div>
            </div>
          </div>

          {/* Personal Best Celebration */}
          {isNewPersonalBest && (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl animate-pulse" role="alert" aria-live="assertive">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-3xl" aria-hidden="true">🎉</span>
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-800 dark:text-yellow-200" id="new-personal-best-title">
                    NEW PERSONAL BEST!
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300" aria-describedby="new-personal-best-title">
                    Congratulations! You've beaten your previous record!
                  </div>
                </div>
                <span className="text-3xl" aria-hidden="true">🏆</span>
              </div>
            </div>
          )}

          {/* New Achievements */}
          {newAchievements.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl" role="alert" aria-live="assertive">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-3xl" aria-hidden="true">🏆</span>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-800 dark:text-purple-200" id="new-achievements-title">
                    ACHIEVEMENT{newAchievements.length > 1 ? 'S' : ''} UNLOCKED!
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300" aria-describedby="new-achievements-title">
                    {newAchievements.length} new achievement{newAchievements.length > 1 ? 's' : ''} earned!
                  </div>
                </div>
                <span className="text-3xl" aria-hidden="true">⭐</span>
              </div>
            </div>
          )}

          {/* Personal Best Comparison */}
          {personalBests && personalBests.wpm > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl" role="region" aria-labelledby="personal-best-comparison-title">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 text-center" id="personal-best-comparison-title">
                Personal Records Comparison
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="list" aria-label="Personal best records">
                {/* Overall Best */}
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg" role="listitem">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Overall Best</div>
                  <div className="text-lg font-bold text-blue-800 dark:text-blue-200" aria-label={`Overall best: ${Math.round(personalBests.wpm)} words per minute`}>
                    {Math.round(personalBests.wpm)} WPM
                  </div>
                  <div className={`text-xs ${results.wpm >= personalBests.wpm ? 'text-green-600' : 'text-gray-500'}`} role="status">
                    {results.wpm >= personalBests.wpm ? '↗ New record!' : `${Math.round(personalBests.wpm - results.wpm)} behind`}
                  </div>
                </div>

                {/* Duration Best */}
                {personalBests.byDuration?.[testDuration] && personalBests.byDuration[testDuration].wpm > 0 && (
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg" role="listitem">
                    <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">
                      {testDuration === 15 ? '15s' : testDuration === 30 ? '30s' : testDuration === 60 ? '1m' : '2m'} Best
                    </div>
                    <div className="text-lg font-bold text-purple-800 dark:text-purple-200" aria-label={`${testDuration} second best: ${Math.round(personalBests.byDuration[testDuration].wpm)} words per minute`}>
                      {Math.round(personalBests.byDuration[testDuration].wpm)} WPM
                    </div>
                    <div className={`text-xs ${isDurationBest ? 'text-green-600' : 'text-gray-500'}`} role="status">
                      {isDurationBest ? '↗ New record!' : `${Math.round(personalBests.byDuration[testDuration].wpm - results.wpm)} behind`}
                    </div>
                  </div>
                )}

                {/* Accuracy Best */}
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg" role="listitem">
                  <div className="text-sm text-green-600 dark:text-green-400 mb-1">Best Accuracy</div>
                  <div className="text-lg font-bold text-green-800 dark:text-green-200" aria-label={`Best accuracy: ${Math.round(personalBests.accuracy)} percent`}>
                    {Math.round(personalBests.accuracy)}%
                  </div>
                  <div className={`text-xs ${results.accuracy >= personalBests.accuracy ? 'text-green-600' : 'text-gray-500'}`} role="status">
                    {results.accuracy >= personalBests.accuracy ? '↗ New record!' : `${Math.round(personalBests.accuracy - results.accuracy)}% behind`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Badge */}
          <div className={`
            text-center p-4 rounded-xl border-2 mb-6
            ${categoryStyles.bgColor} ${categoryStyles.borderColor}
          `}>
            <div className={`text-lg font-semibold ${categoryStyles.textColor}`}>
              Performance: {category.name} {category.emoji}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
              {category.description}
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" role="region" aria-label="Detailed test statistics">
            <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/50">
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100" aria-label={`Raw words per minute: ${Math.round(rawWpm)}`}>
                {Math.round(rawWpm)}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-300">
                Raw WPM
              </div>
            </div>

            <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/50">
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100" aria-label={`Total errors: ${errors}`}>
                {errors}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-300">
                Errors
              </div>
            </div>

            <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/50">
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100" aria-label={`Total characters typed: ${totalChars}`}>
                {totalChars}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-300">
                Characters
              </div>
            </div>

            <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/50">
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100" aria-label={`Test duration: ${Math.round(timeInMinutes * 60)} seconds`}>
                {Math.round(timeInMinutes * 60)}s
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-300">
                Duration
              </div>
            </div>
          </div>

          {/* Accuracy Modifier Message */}
          {accuracyModifier.message && (
            <div className="text-center mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                {accuracyModifier.message}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center" role="group" aria-label="Result actions">
            <button
              onClick={onRestart}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors focus-visible"
              aria-describedby="test-again-description"
            >
              Test Again
            </button>

            <ShareButton
              results={results}
              testDuration={testDuration}
              className="sm:order-first"
            />

            <button
              onClick={handleDownloadCard}
              disabled={isGeneratingCard}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus-visible flex items-center gap-2"
              aria-describedby="download-description"
              aria-busy={isGeneratingCard}
            >
              {isGeneratingCard ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Download Image
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-6 py-3 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg transition-colors focus-visible"
              aria-describedby="continue-description"
            >
              Continue
            </button>

            {actions && (
              <div className="flex items-center">
                {actions}
              </div>
            )}
          </div>

          {/* Hidden descriptions for screen readers */}
          <div className="sr-only">
            <div id="test-again-description">Start a new typing test</div>
            <div id="download-description">Download your test results as an image to share</div>
            <div id="continue-description">Close results and return to main application</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;