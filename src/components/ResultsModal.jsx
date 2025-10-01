import React, { useEffect, useRef } from 'react';
import ShareButton from './ShareButton.jsx';

const ResultsModal = ({
  isOpen,
  onClose,
  onRestart,
  results = {}
}) => {
  const modalRef = useRef(null);

  // Focus management and escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Add event listener
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

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
    timeElapsed = 60
  } = results;

  // Determine rank based on WPM
  const getRank = (wpm) => {
    if (wpm >= 80) return { text: 'Expert', emoji: '🏆' };
    if (wpm >= 60) return { text: 'Advanced', emoji: '⭐' };
    if (wpm >= 40) return { text: 'Intermediate', emoji: '🔥' };
    return { text: 'Beginner', emoji: '🌟' };
  };

  const rank = getRank(wpm);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="results-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-sm bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-neutral-700/50 animate-in zoom-in-95 duration-300"
        role="document"
        tabIndex="-1"
      >
        {/* Main Content */}
        <div className="p-8 text-center">
          {/* Trophy Icon and WPM */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 4h14l-1 8H6l-1-8zM9 12h6v8a2 2 0 01-2 2h-2a2 2 0 01-2-2v-8z"/>
                <path d="M12 2l2 4H10l2-4z"/>
              </svg>
            </div>
            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2" id="results-title">
              {Math.round(wpm)}
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-300 font-medium">
              WPM
            </div>
          </div>

          {/* Rank Display */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-semibold text-sm">
              <span className="text-base">{rank.emoji}</span>
              <span>{rank.text}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Accuracy */}
            <div className="bg-white/50 dark:bg-neutral-800/50 rounded-2xl p-4 backdrop-blur-sm border border-white/20 dark:border-neutral-700/30">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {Math.round(accuracy)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Accuracy
              </div>
            </div>

            {/* Errors */}
            <div className="bg-white/50 dark:bg-neutral-800/50 rounded-2xl p-4 backdrop-blur-sm border border-white/20 dark:border-neutral-700/30">
              <div className="text-2xl font-bold text-red-500 dark:text-red-400 mb-1">
                {errors}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Errors
              </div>
            </div>

            {/* Time */}
            <div className="bg-white/50 dark:bg-neutral-800/50 rounded-2xl p-4 backdrop-blur-sm border border-white/20 dark:border-neutral-700/30">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {Math.round(timeElapsed)}s
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Time
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onRestart}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors focus-visible shadow-lg"
            >
              Try Again
            </button>

            <ShareButton results={results} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;