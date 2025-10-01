/**
 * Core calculation functions for typing speed test
 */

/**
 * Calculate WPM (Words Per Minute) using standard typing test formula
 * Formula: (Characters Typed / 5) / (Time in Minutes)
 * @param {number} totalChars - Total characters typed
 * @param {number} timeInSeconds - Time taken in seconds
 * @returns {number} WPM value rounded to 2 decimal places
 */
export const calculateWPM = (totalChars, timeInSeconds) => {
  if (timeInSeconds <= 0 || totalChars < 0) return 0;
  const timeInMinutes = timeInSeconds / 60;
  return Math.round((totalChars / 5) / timeInMinutes * 100) / 100;
};

/**
 * Calculate accuracy percentage
 * Formula: (Correct Characters / Total Characters) × 100
 * @param {number} correctChars - Number of correct characters
 * @param {number} totalChars - Total characters typed
 * @returns {number} Accuracy percentage rounded to 2 decimal places
 */
export const calculateAccuracy = (correctChars, totalChars) => {
  if (totalChars <= 0) return 0;
  return Math.round((correctChars / totalChars) * 100 * 100) / 100;
};

/**
 * Calculate raw WPM (total characters including errors)
 * @param {number} totalChars - Total characters typed (including errors)
 * @param {number} timeInSeconds - Time taken in seconds
 * @returns {number} Raw WPM value
 */
export const calculateRawWPM = (totalChars, timeInSeconds) => {
  if (timeInSeconds <= 0 || totalChars < 0) return 0;
  return calculateWPM(totalChars, timeInSeconds);
};

/**
 * Calculate net WPM (excluding errors)
 * Formula: ((Total characters - Errors) / 5) / time in minutes
 * @param {number} totalChars - Total characters typed
 * @param {number} errors - Number of errors made
 * @param {number} timeInSeconds - Time taken in seconds
 * @returns {number} Net WPM value
 */
export const calculateNetWPM = (totalChars, errors, timeInSeconds) => {
  if (timeInSeconds <= 0 || totalChars < 0 || errors < 0) return 0;
  const correctChars = totalChars - errors;
  return calculateWPM(correctChars, timeInSeconds);
};

/**
 * Get performance category based on WPM and accuracy
 * @param {number} wpm - Words per minute
 * @param {number} accuracy - Accuracy percentage
 * @returns {object} Category object with emoji, name, and description
 */
export const getPerformanceCategory = (wpm) => {
  // Performance categories based on WPM ranges
  if (wpm >= 100) {
    return {
      emoji: '👑',
      name: 'Legend',
      description: 'Extraordinary!'
    };
  } else if (wpm >= 81) {
    return {
      emoji: '🏆',
      name: 'Master',
      description: 'Outstanding!'
    };
  } else if (wpm >= 61) {
    return {
      emoji: '🚀',
      name: 'Expert',
      description: 'Impressive!'
    };
  } else if (wpm >= 41) {
    return {
      emoji: '⚡',
      name: 'Advanced',
      description: 'Nice speed!'
    };
  } else if (wpm >= 21) {
    return {
      emoji: '📝',
      name: 'Intermediate',
      description: 'You\'re getting there!'
    };
  } else {
    return {
      emoji: '🐌',
      name: 'Beginner',
      description: 'Keep practicing!'
    };
  }
};

/**
 * Get accuracy modifier and feedback
 * @param {number} wpm - Words per minute
 * @param {number} accuracy - Accuracy percentage
 * @returns {object} Modifier object with bonus, message, and class
 */
export const getAccuracyModifier = (wpm, accuracy) => {
  if (accuracy === 100) {
    return {
      bonus: 5,
      message: 'Perfect accuracy! +5 WPM bonus applied',
      class: 'perfect-accuracy'
    };
  } else if (accuracy >= 95) {
    return {
      bonus: 0,
      message: 'Excellent accuracy!',
      class: 'excellent-accuracy'
    };
  } else if (accuracy >= 90) {
    return {
      bonus: 0,
      message: 'Good accuracy! Try to aim for 95%+ for better scores',
      class: 'good-accuracy'
    };
  } else {
    return {
      bonus: 0,
      message: 'Focus on accuracy to improve your overall performance',
      class: 'needs-work-accuracy'
    };
  }
};