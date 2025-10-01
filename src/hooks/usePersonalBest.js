import { useState, useEffect, useCallback } from 'react';
import {
  getPersonalBests,
  updatePersonalBests,
  getPerformanceHistory,
  addToPerformanceHistory,
  getStreakData,
  updateStreakData,
  getAchievements,
  checkAchievements,
  cleanupOldData
} from '../utils/personalBestStorage.js';

/**
 * Custom hook for managing personal best data and performance tracking
 */
export const usePersonalBest = () => {
  const [personalBests, setPersonalBests] = useState(null);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [streakData, setStreakData] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);

  // Load all data on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const bests = getPersonalBests();
        const history = getPerformanceHistory();
        const streak = getStreakData();
        const achievementData = getAchievements();

        setPersonalBests(bests);
        setPerformanceHistory(history);
        setStreakData(streak);
        setAchievements(achievementData);
      } catch (error) {
        console.error('Error loading personal best data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Clean up old data periodically (every 24 hours)
    const lastCleanup = localStorage.getItem('typing-test-last-cleanup');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!lastCleanup || now - parseInt(lastCleanup) > oneDay) {
      cleanupOldData();
      localStorage.setItem('typing-test-last-cleanup', now.toString());
    }
  }, []);

  /**
   * Record a new test result and update all related data
   */
  const recordResult = useCallback((results) => {
    if (!results || typeof results !== 'object') {
      console.warn('Invalid results provided to recordResult');
      return { isNewBest: false, newAchievements: [] };
    }

    try {
      // Update personal bests
      const bestsUpdated = updatePersonalBests(results);

      // Add to performance history
      const updatedHistory = addToPerformanceHistory(results);

      // Update streak data
      const updatedStreak = updateStreakData();

      // Check for new achievements
      const { achievements: updatedAchievements, newAchievements: newAchievementList } = checkAchievements(results, updatedHistory);

      // Update state
      setPersonalBests(prev => ({ ...prev, ...getPersonalBests() }));
      setPerformanceHistory(updatedHistory);
      setStreakData(updatedStreak);
      setAchievements(updatedAchievements);

      const result = {
        isNewBest: bestsUpdated,
        newAchievements: newAchievementList,
        updatedHistory,
        updatedStreak,
        updatedAchievements
      };

      // Set temporary flags for UI feedback
      if (bestsUpdated) {
        setIsNewPersonalBest(true);
        setTimeout(() => setIsNewPersonalBest(false), 3000);
      }

      if (newAchievementList.length > 0) {
        setNewAchievements(newAchievementList);
        setTimeout(() => setNewAchievements([]), 5000);
      }

      return result;
    } catch (error) {
      console.error('Error recording test result:', error);
      return { isNewBest: false, newAchievements: [] };
    }
  }, []);

  /**
   * Get performance statistics
   */
  const getPerformanceStats = useCallback(() => {
    if (performanceHistory.length === 0) {
      return {
        totalTests: 0,
        averageWPM: 0,
        averageAccuracy: 0,
        bestWPM: 0,
        bestAccuracy: 0,
        improvementTrend: 0,
        recentAverage: 0
      };
    }

    const totalTests = performanceHistory.length;
    const averageWPM = performanceHistory.reduce((sum, r) => sum + r.wpm, 0) / totalTests;
    const averageAccuracy = performanceHistory.reduce((sum, r) => sum + r.accuracy, 0) / totalTests;
    const bestWPM = Math.max(...performanceHistory.map(r => r.wpm));
    const bestAccuracy = Math.max(...performanceHistory.map(r => r.accuracy));

    // Calculate improvement trend (comparing first 10 vs last 10 tests)
    let improvementTrend = 0;
    if (totalTests >= 20) {
      const first10 = performanceHistory.slice(-20, -10);
      const last10 = performanceHistory.slice(-10);
      const first10Avg = first10.reduce((sum, r) => sum + r.wpm, 0) / first10.length;
      const last10Avg = last10.reduce((sum, r) => sum + r.wpm, 0) / last10.length;
      improvementTrend = ((last10Avg - first10Avg) / first10Avg) * 100;
    }

    // Recent average (last 10 tests)
    const recentAverage = totalTests >= 10
      ? performanceHistory.slice(0, 10).reduce((sum, r) => sum + r.wpm, 0) / 10
      : averageWPM;

    return {
      totalTests,
      averageWPM: Math.round(averageWPM),
      averageAccuracy: Math.round(averageAccuracy),
      bestWPM: Math.round(bestWPM),
      bestAccuracy: Math.round(bestAccuracy),
      improvementTrend: Math.round(improvementTrend),
      recentAverage: Math.round(recentAverage)
    };
  }, [performanceHistory]);

  /**
   * Get recent performance for trend analysis
   */
  const getRecentPerformance = useCallback((count = 10) => {
    return performanceHistory.slice(0, count).map(result => ({
      wpm: result.wpm,
      accuracy: result.accuracy,
      date: result.date || new Date(result.timestamp).toLocaleDateString(),
      timestamp: result.timestamp
    }));
  }, [performanceHistory]);

  /**
   * Check if a result would be a new personal best
   */
  const wouldBePersonalBest = useCallback((wpm, accuracy, duration) => {
    if (!personalBests) return false;

    const isWPMPB = wpm > personalBests.wpm;
    const isAccuracyPB = accuracy > personalBests.accuracy;

    if (personalBests.byDuration[duration]) {
      const durationBest = personalBests.byDuration[duration];
      const isDurationWPMPB = wpm > durationBest.wpm;
      const isDurationAccuracyPB = accuracy > durationBest.accuracy;

      return isWPMPB || isAccuracyPB || isDurationWPMPB || isDurationAccuracyPB;
    }

    return isWPMPB || isAccuracyPB;
  }, [personalBests]);

  /**
   * Get achievement progress for specific milestones
   */
  const getAchievementProgress = useCallback(() => {
    if (!achievements || !performanceHistory.length) return [];

    const stats = getPerformanceStats();

    return [
      {
        id: 'speedDemon',
        name: 'Speed Demon',
        description: 'Achieve 100+ WPM',
        progress: Math.min(stats.bestWPM, 100),
        target: 100,
        unlocked: achievements.speedDemon
      },
      {
        id: 'accuracyExpert',
        name: 'Accuracy Expert',
        description: 'Achieve 100% accuracy',
        progress: stats.bestAccuracy,
        target: 100,
        unlocked: achievements.accuracyExpert
      },
      {
        id: 'consistent',
        name: 'Consistent',
        description: 'Complete 10 tests with 95%+ accuracy',
        progress: performanceHistory.filter(r => r.accuracy >= 95).length,
        target: 10,
        unlocked: achievements.consistent
      },
      {
        id: 'marathoner',
        name: 'Marathoner',
        description: 'Complete 50 tests',
        progress: stats.totalTests,
        target: 50,
        unlocked: achievements.marathoner
      },
      {
        id: 'streakMaster',
        name: 'Streak Master',
        description: 'Maintain a 7-day streak',
        progress: streakData?.currentStreak || 0,
        target: 7,
        unlocked: achievements.streakMaster
      }
    ];
  }, [achievements, performanceHistory, streakData, getPerformanceStats]);

  /**
   * Reset all personal best data
   */
  const resetAllData = useCallback(() => {
    try {
      // Clear all data from localStorage
      const { clearAllData } = require('../utils/personalBestStorage.js');
      clearAllData();

      // Reset state
      setPersonalBests({
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
      setPerformanceHistory([]);
      setStreakData({
        currentStreak: 0,
        longestStreak: 0,
        lastTestDate: null,
        streakStartDate: null
      });
      setAchievements({
        firstTest: false,
        speedDemon: false,
        accuracyExpert: false,
        consistent: false,
        marathoner: false,
        streakMaster: false,
        perfectionist: false,
        speedster: false,
        dedicated: false
      });

      return true;
    } catch (error) {
      console.error('Error resetting personal best data:', error);
      return false;
    }
  }, []);

  return {
    // State
    personalBests,
    performanceHistory,
    streakData,
    achievements,
    isLoading,
    isNewPersonalBest,
    newAchievements,

    // Actions
    recordResult,
    getPerformanceStats,
    getRecentPerformance,
    wouldBePersonalBest,
    getAchievementProgress,
    resetAllData,

    // Computed values
    hasData: performanceHistory.length > 0,
    totalTests: performanceHistory.length,
    currentStreak: streakData?.currentStreak || 0,
    longestStreak: streakData?.longestStreak || 0
  };
};