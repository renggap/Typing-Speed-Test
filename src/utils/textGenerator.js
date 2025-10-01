/**
 * Text generation and quote selection utilities for typing test
 */

import { quotes, getQuotesByDifficulty } from '../data/quotes.js';

// Quote tracking system to prevent repetition
class QuoteTracker {
  constructor() {
    this.usedQuotes = new Set();
    this.quoteHistory = [];
    this.maxHistorySize = 10;
  }

  // Mark a quote as used
  markQuoteUsed(quote) {
    this.usedQuotes.add(quote.text);
    this.quoteHistory.unshift(quote);

    // Keep only recent quotes in history
    if (this.quoteHistory.length > this.maxHistorySize) {
      const removedQuote = this.quoteHistory.pop();
      this.usedQuotes.delete(removedQuote.text);
    }
  }

  // Check if quote was recently used
  isQuoteUsed(quote) {
    return this.usedQuotes.has(quote.text);
  }

  // Get recently used quotes
  getRecentQuotes() {
    return this.quoteHistory.slice(0, 3); // Last 3 quotes
  }

  // Reset tracking
  reset() {
    this.usedQuotes.clear();
    this.quoteHistory = [];
  }

  // Get statistics
  getStats() {
    return {
      usedCount: this.usedQuotes.size,
      historySize: this.quoteHistory.length,
      maxHistorySize: this.maxHistorySize
    };
  }
}

// Global quote tracker instance
const quoteTracker = new QuoteTracker();

/**
 * Get a random quote from all available quotes
 * @returns {object} Random quote object with text, difficulty, and author
 */
export const getRandomQuote = () => {
  if (quotes.length === 0) {
    return {
      text: "No quotes available. Please add quotes to continue.",
      difficulty: "easy",
      author: "System",
      category: "system"
    };
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

/**
 * Select a random quote by difficulty level
 * @param {string} difficulty - Difficulty level: 'easy', 'medium', or 'hard'
 * @returns {object} Random quote object matching the difficulty level
 */
export const selectQuoteByDifficulty = (difficulty = 'easy') => {
  const quotesByDifficulty = getQuotesByDifficulty(difficulty);

  if (quotesByDifficulty.length === 0) {
    // Fallback to any available quote if no quotes match the difficulty
    return getRandomQuote();
  }

  // Try to find an unused quote first
  const unusedQuotes = quotesByDifficulty.filter(quote => !quoteTracker.isQuoteUsed(quote));

  if (unusedQuotes.length > 0) {
    const randomIndex = Math.floor(Math.random() * unusedQuotes.length);
    return unusedQuotes[randomIndex];
  }

  // If all quotes have been used recently, pick any random one
  const randomIndex = Math.floor(Math.random() * quotesByDifficulty.length);
  return quotesByDifficulty[randomIndex];
};

/**
 * Smart quote selection based on user WPM performance
 * @param {number} userWPM - User's words per minute score
 * @param {string} lastDifficulty - Last difficulty used (optional)
 * @returns {object} Quote object with appropriate difficulty for user's skill level
 */
export const getProgressiveQuote = (userWPM = 0, lastDifficulty = null) => {
  let targetDifficulty = 'easy';

  // Determine appropriate difficulty based on WPM
  if (userWPM >= 60) {
    targetDifficulty = 'hard';
  } else if (userWPM >= 35) {
    targetDifficulty = 'medium';
  } else {
    targetDifficulty = 'easy';
  }

  // If user is struggling with current difficulty, adjust down
  if (lastDifficulty === 'hard' && userWPM < 50) {
    targetDifficulty = 'medium';
  } else if (lastDifficulty === 'medium' && userWPM < 25) {
    targetDifficulty = 'easy';
  }

  // If user is excelling, consider moving up
  if (lastDifficulty === 'easy' && userWPM > 50) {
    targetDifficulty = 'medium';
  } else if (lastDifficulty === 'medium' && userWPM > 70) {
    targetDifficulty = 'hard';
  }

  return selectQuoteByDifficulty(targetDifficulty);
};

/**
 * Shuffle the quote order for randomization
 * @param {array} quotesArray - Array of quotes to shuffle (optional)
 * @returns {array} Shuffled array of quotes
 */
export const shuffleQuotes = (quotesArray = null) => {
  const arrayToShuffle = quotesArray || [...quotes];
  const shuffled = [...arrayToShuffle];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

/**
 * Get quotes filtered by category
 * @param {string} category - Category to filter by
 * @returns {array} Array of quotes matching the category
 */
export const getQuotesByCategory = (category) => {
  if (!category) return quotes;

  return quotes.filter(quote =>
    quote.category && quote.category.toLowerCase() === category.toLowerCase()
  );
};

/**
 * Get all available categories
 * @returns {string[]} Array of unique categories
 */
export const getAvailableCategories = () => {
  const categories = quotes
    .map(quote => quote.category)
    .filter(category => category);

  return [...new Set(categories)];
};

/**
 * Get all available difficulty levels
 * @returns {string[]} Array of difficulty levels
 */
export const getAvailableDifficulties = () => {
  return ['easy', 'medium', 'hard'];
};

/**
 * Get comprehensive quote statistics
 * @returns {object} Object with detailed statistics
 */
export const getQuoteStats = () => {
  const stats = {
    easy: getQuotesByDifficulty('easy').length,
    medium: getQuotesByDifficulty('medium').length,
    hard: getQuotesByDifficulty('hard').length,
    total: quotes.length
  };

  // Add category breakdown
  const categories = getAvailableCategories();
  stats.categories = {};
  categories.forEach(category => {
    stats.categories[category] = getQuotesByCategory(category).length;
  });

  // Add quote tracker stats
  stats.tracker = quoteTracker.getStats();

  return stats;
};

/**
 * Mark current quote as used in the tracking system
 * @param {object} quote - Quote object to mark as used
 */
export const markCurrentQuoteUsed = (quote) => {
  if (quote && quote.text) {
    quoteTracker.markQuoteUsed(quote);
  }
};

/**
 * Get recently used quotes for reference
 * @returns {array} Array of recently used quotes
 */
export const getRecentQuotes = () => {
  return quoteTracker.getRecentQuotes();
};

/**
 * Reset the quote tracking system
 */
export const resetQuoteTracking = () => {
  quoteTracker.reset();
};

/**
 * Get a quote with balanced category selection
 * @param {string} difficulty - Difficulty level (optional)
 * @returns {object} Quote object with good category variety
 */
export const getBalancedQuote = (difficulty = null) => {
  const recentQuotes = getRecentQuotes();
  const recentCategories = recentQuotes.map(quote => quote.category).filter(Boolean);

  let availableQuotes;

  if (difficulty) {
    availableQuotes = getQuotesByDifficulty(difficulty);
  } else {
    availableQuotes = [...quotes];
  }

  // Filter out recently used categories if possible
  const quotesWithNewCategories = availableQuotes.filter(quote =>
    quote.category && !recentCategories.includes(quote.category)
  );

  if (quotesWithNewCategories.length > 0) {
    const randomIndex = Math.floor(Math.random() * quotesWithNewCategories.length);
    return quotesWithNewCategories[randomIndex];
  }

  // Fallback to any quote if all categories have been used recently
  if (difficulty) {
    return selectQuoteByDifficulty(difficulty);
  } else {
    return getRandomQuote();
  }
};