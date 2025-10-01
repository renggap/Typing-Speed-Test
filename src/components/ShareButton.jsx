import React, { useState } from 'react';
import { getPerformanceCategory } from '../utils/calculations.js';

const ShareButton = ({
  results = {},
  testDuration = 60,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    wpm = 0,
    accuracy = 0,
    timeElapsed = testDuration
  } = results;

  // Get performance category
  const category = getPerformanceCategory(wpm, accuracy);

  // Generate shareable URL
  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=share&wpm=${Math.round(wpm)}&accuracy=${Math.round(accuracy)}`;
  };

  // Generate formatted share text
  const generateShareText = () => {
    const timeInMinutes = Math.round(timeElapsed / 60);
    const timeUnit = timeInMinutes === 1 ? 'minute' : 'minutes';

    return `⚡ I just scored ${Math.round(wpm)} WPM on Typing Speed Test!\n` +
           `Accuracy: ${Math.round(accuracy)}%\n` +
           `Rank: ${category.name} ${category.emoji}\n` +
           `Time: ${timeInMinutes} ${timeUnit}\n\n` +
           `Can you beat my score? ${generateShareUrl()}`;
  };

  // Copy to clipboard functionality
  const copyToClipboard = async () => {
    try {
      setIsLoading(true);
      const shareText = generateShareText();
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generateShareText();
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    } finally {
      setIsLoading(false);
    }
  };

  // Twitter/X share
  const shareToTwitter = () => {
    const shareText = generateShareText();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  // WhatsApp share
  const shareToWhatsApp = () => {
    const shareText = generateShareText();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Native Web Share API (mobile devices)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        setIsLoading(true);
        const shareData = {
          title: 'My Typing Speed Test Results',
          text: generateShareText(),
          url: generateShareUrl()
        };
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          // Fallback to copy if native share fails
          copyToClipboard();
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Fallback to showing share options
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Share Button */}
      <button
        onClick={nativeShare}
        disabled={isLoading}
        className={`
          px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600
          hover:from-blue-600 hover:to-purple-700
          text-white font-semibold rounded-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sharing...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share Results
          </>
        )}
      </button>

      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            Copied to clipboard! 📋
          </div>
        </div>
      )}

      {/* Share Options Dropdown (fallback for desktop) */}
      {isOpen && !navigator.share && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 p-2 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 px-2">
              Share Options
            </div>

            {/* Copy to Clipboard */}
            <button
              onClick={() => {
                copyToClipboard();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
            >
              <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Copy to Clipboard
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Share text and link
                </div>
              </div>
            </button>

            {/* Twitter/X */}
            <button
              onClick={() => {
                shareToTwitter();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
            >
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Share on X
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Post to Twitter/X
                </div>
              </div>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => {
                shareToWhatsApp();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
            >
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
              </svg>
              <div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Share on WhatsApp
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Send via WhatsApp
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ShareButton;