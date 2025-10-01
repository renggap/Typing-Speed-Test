/**
 * Personal Best Storage Utilities
 * Handles local storage operations for personal records and performance tracking
 */

const STORAGE_KEYS = {
  PERSONAL_BESTS: 'typing-test-personal-bests',
  PERFORMANCE_HISTORY: 'typing-test-performance-history',
  STREAK_DATA: 'typing-test-streak-data',
  ACHIEVEMENTS: 'typing-test-achievements',
  SETTINGS: 'typing-test-settings'
};

const DEFAULT_SETTINGS = {
  streakTracking: true,
  historyLimit: 100,
  dataRetentionDays: 365
};

/**
 * Get data from localStorage with error handling
 */
const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Save data to localStorage with error handling
 */
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn(`Error saving to localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Get personal best records
 */
export const getPersonalBests = () => {
  return getFromStorage(STORAGE_KEYS.PERSONAL_BESTS, {
    wpm: 0,
    accuracy: 0,
    consistency: 0,
    byDuration: {
      15: { wpm: 0, accuracy: 0, date: null },
      30: { wpm: 0, accuracy: 0, date: null },
      60: { wpm: 0, accuracy: 0, date: null },
      120: { wpm: 0, accuracy: 0, date: null }
    }
  });
};

/**
 * Update personal best records
 */
export const updatePersonalBests = (results) => {
  const currentBests = getPersonalBests();
  const { wpm, accuracy, testDuration } = results;
  let updated = false;

  // Update overall bests
  if (wpm > currentBests.wpm) {
    currentBests.wpm = wpm;
    updated = true;
  }

  if (accuracy > currentBests.accuracy) {
    currentBests.accuracy = accuracy;
    updated = true;
  }

  // Update duration-specific bests
  const durationKey = testDuration.toString();
  if (currentBests.byDuration[durationKey]) {
    if (wpm > currentBests.byDuration[durationKey].wpm) {
      currentBests.byDuration[durationKey].wpm = wpm;
      currentBests.byDuration[durationKey].date = new Date().toISOString();
      updated = true;
    }

    if (accuracy > currentBests.byDuration[durationKey].accuracy) {
      currentBests.byDuration[durationKey].accuracy = accuracy;
      currentBests.byDuration[durationKey].date = new Date().toISOString();
      updated = true;
    }
  }

  if (updated) {
    saveToStorage(STORAGE_KEYS.PERSONAL_BESTS, currentBests);
  }

  return updated;
};

/**
 * Get performance history
 */
export const getPerformanceHistory = () => {
  return getFromStorage(STORAGE_KEYS.PERFORMANCE_HISTORY, []);
};

/**
 * Add result to performance history
 */
export const addToPerformanceHistory = (results) => {
  const history = getPerformanceHistory();
  const settings = getSettings();

  // Add timestamp if not present
  const resultWithTimestamp = {
    ...results,
    timestamp: new Date().toISOString(),
    date: new Date().toDateString()
  };

  // Add to beginning of array (most recent first)
  history.unshift(resultWithTimestamp);

  // Limit history size
  if (history.length > settings.historyLimit) {
    history.splice(settings.historyLimit);
  }

  saveToStorage(STORAGE_KEYS.PERFORMANCE_HISTORY, history);
  return history;
};

/**
 * Get streak data
 */
export const getStreakData = () => {
  return getFromStorage(STORAGE_KEYS.STREAK_DATA, {
    currentStreak: 0,
    longestStreak: 0,
    lastTestDate: null,
    streakStartDate: null
  });
};

/**
 * Update streak data
 */
export const updateStreakData = () => {
  const streakData = getStreakData();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  if (streakData.lastTestDate === today) {
    // Already tested today, no change needed
    return streakData;
  }

  if (streakData.lastTestDate === yesterday) {
    // Consecutive day, increment streak
    streakData.currentStreak += 1;
  } else if (streakData.lastTestDate !== today) {
    // Streak broken, start new one
    streakData.currentStreak = 1;
    streakData.streakStartDate = today;
  }

  // Update longest streak if current is longer
  if (streakData.currentStreak > streakData.longestStreak) {
    streakData.longestStreak = streakData.currentStreak;
  }

  streakData.lastTestDate = today;

  saveToStorage(STORAGE_KEYS.STREAK_DATA, streakData);
  return streakData;
};

/**
 * Get achievements
 */
export const getAchievements = () => {
  return getFromStorage(STORAGE_KEYS.ACHIEVEMENTS, {
    firstTest: false,
    speedDemon: false, // 100+ WPM
    accuracyExpert: false, // 100% accuracy
    consistent: false, // 10+ tests with 95%+ accuracy
    marathoner: false, // 50+ tests completed
    streakMaster: false, // 7-day streak
    perfectionist: false, // 100% accuracy with 50+ WPM
    speedster: false, // 80+ WPM average over 10 tests
    dedicated: false // 100+ tests completed
  });
};

/**
 * Check and update achievements
 */
export const checkAchievements = (results, allResults = []) => {
  const achievements = getAchievements();
  const history = allResults.length > 0 ? allResults : getPerformanceHistory();
  let newAchievements = [];

  // First test achievement
  if (!achievements.firstTest && history.length >= 1) {
    achievements.firstTest = true;
    newAchievements.push('firstTest');
  }

  // Speed demon (100+ WPM)
  if (!achievements.speedDemon && results.wpm >= 100) {
    achievements.speedDemon = true;
    newAchievements.push('speedDemon');
  }

  // Accuracy expert (100% accuracy)
  if (!achievements.accuracyExpert && results.accuracy >= 100) {
    achievements.accuracyExpert = true;
    newAchievements.push('accuracyExpert');
  }

  // Consistent (10+ tests with 95%+ accuracy)
  const consistentTests = history.filter(r => r.accuracy >= 95).length;
  if (!achievements.consistent && consistentTests >= 10) {
    achievements.consistent = true;
    newAchievements.push('consistent');
  }

  // Marathoner (50+ tests)
  if (!achievements.marathoner && history.length >= 50) {
    achievements.marathoner = true;
    newAchievements.push('marathoner');
  }

  // Streak master (7-day streak)
  const streakData = getStreakData();
  if (!achievements.streakMaster && streakData.currentStreak >= 7) {
    achievements.streakMaster = true;
    newAchievements.push('streakMaster');
  }

  // Perfectionist (100% accuracy with 50+ WPM)
  if (!achievements.perfectionist && results.accuracy >= 100 && results.wpm >= 50) {
    achievements.perfectionist = true;
    newAchievements.push('perfectionist');
  }

  // Speedster (80+ WPM average over 10 tests)
  if (!achievements.speedster && history.length >= 10) {
    const recentTests = history.slice(0, 10);
    const avgWPM = recentTests.reduce((sum, r) => sum + r.wpm, 0) / recentTests.length;
    if (avgWPM >= 80) {
      achievements.speedster = true;
      newAchievements.push('speedster');
    }
  }

  // Dedicated (100+ tests)
  if (!achievements.dedicated && history.length >= 100) {
    achievements.dedicated = true;
    newAchievements.push('dedicated');
  }

  if (newAchievements.length > 0) {
    saveToStorage(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }

  return { achievements, newAchievements };
};

/**
 * Get user settings
 */
export const getSettings = () => {
  return { ...DEFAULT_SETTINGS, ...getFromStorage(STORAGE_KEYS.SETTINGS, {}) };
};

/**
 * Update user settings
 */
export const updateSettings = (newSettings) => {
  const currentSettings = getSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  saveToStorage(STORAGE_KEYS.SETTINGS, updatedSettings);
  return updatedSettings;
};

/**
 * Clean up old data based on retention settings
 */
export const cleanupOldData = () => {
  const settings = getSettings();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.dataRetentionDays);

  let cleaned = false;

  // Clean performance history
  const history = getPerformanceHistory();
  const filteredHistory = history.filter(result => {
    const resultDate = new Date(result.timestamp);
    return resultDate > cutoffDate;
  });

  if (filteredHistory.length !== history.length) {
    saveToStorage(STORAGE_KEYS.PERFORMANCE_HISTORY, filteredHistory);
    cleaned = true;
  }

  return cleaned;
};

/**
 * Export all data for backup
 */
export const exportAllData = () => {
  return {
    personalBests: getPersonalBests(),
    performanceHistory: getPerformanceHistory(),
    streakData: getStreakData(),
    achievements: getAchievements(),
    settings: getSettings(),
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
};

/**
 * Import data from backup
 */
export const importAllData = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup data format');
  }

  if (data.version !== '1.0') {
    throw new Error('Unsupported backup version');
  }

  try {
    if (data.personalBests) {
      saveToStorage(STORAGE_KEYS.PERSONAL_BESTS, data.personalBests);
    }
    if (data.performanceHistory) {
      saveToStorage(STORAGE_KEYS.PERFORMANCE_HISTORY, data.performanceHistory);
    }
    if (data.streakData) {
      saveToStorage(STORAGE_KEYS.STREAK_DATA, data.streakData);
    }
    if (data.achievements) {
      saveToStorage(STORAGE_KEYS.ACHIEVEMENTS, data.achievements);
    }
    if (data.settings) {
      saveToStorage(STORAGE_KEYS.SETTINGS, data.settings);
    }

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

/**
 * Clear all data (for reset functionality)
 */
export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  return true;
};