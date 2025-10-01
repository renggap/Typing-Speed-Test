import React, { useState } from 'react';
import { usePersonalBest } from '../hooks/usePersonalBest.js';

/**
 * Personal Best Display Component
 * Shows user's personal records, achievements, and performance history
 */
const PersonalBestDisplay = ({ isVisible = true, onClose }) => {
  const {
    personalBests,
    performanceHistory,
    streakData,
    achievements,
    isLoading,
    isNewPersonalBest,
    newAchievements,
    getPerformanceStats,
    getRecentPerformance,
    getAchievementProgress,
    resetAllData
  } = usePersonalBest();

  const [activeTab, setActiveTab] = useState('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportData, setExportData] = useState(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isVisible) return null;

  const stats = getPerformanceStats();
  const recentPerformance = getRecentPerformance(10);
  const achievementProgress = getAchievementProgress();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleExportData = () => {
    const { exportAllData } = require('../utils/personalBestStorage.js');
    const data = exportAllData();
    setExportData(JSON.stringify(data, null, 2));
    setShowExportDialog(true);
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const { importAllData } = require('../utils/personalBestStorage.js');
          if (importAllData(data)) {
            alert('Data imported successfully! Please refresh the page.');
            window.location.reload();
          } else {
            alert('Failed to import data. Please check the file format.');
          }
        } catch (error) {
          alert('Invalid file format. Please select a valid backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const downloadExportFile = () => {
    if (!exportData) return;

    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typing-test-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDurationLabel = (seconds) => {
    if (seconds === 15) return '15s';
    if (seconds === 30) return '30s';
    if (seconds === 60) return '1m';
    if (seconds === 120) return '2m';
    return `${seconds}s`;
  };

  const AchievementBadge = ({ achievement, progress, unlocked }) => {
    const percentage = Math.min((progress / achievement.target) * 100, 100);

    const getAchievementIcon = (id) => {
      const icons = {
        firstTest: '🎯',
        speedDemon: '⚡',
        accuracyExpert: '🎯',
        consistent: '🔥',
        marathoner: '🏃',
        streakMaster: '🔥',
        perfectionist: '💎',
        speedster: '💨',
        dedicated: '👑'
      };
      return icons[id] || '🏆';
    };

    const getAchievementColor = (id) => {
      const colors = {
        firstTest: 'from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-800',
        speedDemon: 'from-yellow-50 to-orange-100 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800',
        accuracyExpert: 'from-green-50 to-emerald-100 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800',
        consistent: 'from-purple-50 to-pink-100 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800',
        marathoner: 'from-indigo-50 to-blue-100 border-indigo-200 dark:from-indigo-900/20 dark:to-blue-900/20 dark:border-indigo-800',
        streakMaster: 'from-red-50 to-orange-100 border-red-200 dark:from-red-900/20 dark:to-orange-900/20 dark:border-red-800',
        perfectionist: 'from-cyan-50 to-teal-100 border-cyan-200 dark:from-cyan-900/20 dark:to-teal-900/20 dark:border-cyan-800',
        speedster: 'from-violet-50 to-purple-100 border-violet-200 dark:from-violet-900/20 dark:to-purple-900/20 dark:border-violet-800',
        dedicated: 'from-amber-50 to-yellow-100 border-amber-200 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-800'
      };
      return colors[id] || 'from-gray-50 to-gray-100 border-gray-200 dark:from-gray-900/20 dark:to-gray-800/20 dark:border-gray-800';
    };

    return (
      <div className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
        unlocked
          ? `bg-gradient-to-br ${getAchievementColor(achievement.id)} shadow-lg`
          : 'bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
            unlocked ? 'bg-white/80 shadow-md animate-pulse' : 'bg-gray-300 text-gray-600'
          }`}>
            {unlocked ? getAchievementIcon(achievement.id) : '🔒'}
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold ${unlocked ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600'}`}>
              {achievement.name}
            </h4>
            <p className={`text-sm ${unlocked ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}>
              {achievement.description}
            </p>
            {!unlocked && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{progress}/{achievement.target}</span>
                  <span>{Math.round(percentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )}
            {unlocked && (
              <div className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                ✓ Unlocked!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            Personal Records
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your typing progress and achievements
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* New Personal Best Celebration */}
      {isNewPersonalBest && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">
                New Personal Best!
              </p>
              <p className="text-sm text-green-600 dark:text-green-300">
                Congratulations on beating your record!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Achievements */}
      {newAchievements.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                Achievement{newAchievements.length > 1 ? 's' : ''} Unlocked!
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                {newAchievements.length} new achievement{newAchievements.length > 1 ? 's' : ''} earned
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'history', label: 'History' },
          { id: 'achievements', label: 'Achievements' },
          { id: 'breakdown', label: 'Breakdown' },
          { id: 'data', label: 'Data Management' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Best WPM */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Best WPM</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {personalBests?.wpm ? Math.round(personalBests.wpm) : 0}
                  </p>
                </div>
                <div className="text-2xl">⚡</div>
              </div>
            </div>

            {/* Best Accuracy */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Best Accuracy</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {personalBests?.accuracy ? Math.round(personalBests.accuracy) : 0}%
                  </p>
                </div>
                <div className="text-2xl">🎯</div>
              </div>
            </div>

            {/* Current Streak */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Current Streak</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {streakData?.currentStreak || 0}
                  </p>
                </div>
                <div className="text-2xl">🔥</div>
              </div>
            </div>

            {/* Total Tests */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Total Tests</p>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                    {stats.totalTests}
                  </p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {recentPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No test history yet. Complete some tests to see your progress!</p>
              </div>
            ) : (
              <>
                {/* Recent Performance Chart */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Recent Performance (Last 10 Tests)
                  </h3>
                  <div className="space-y-2">
                    {recentPerformance.map((result, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500 w-16">
                            {result.date}
                          </span>
                          <div className="flex space-x-4">
                            <span className="text-sm">
                              <span className="font-medium text-blue-600">{Math.round(result.wpm)}</span> WPM
                            </span>
                            <span className="text-sm">
                              <span className="font-medium text-green-600">{Math.round(result.accuracy)}%</span> Accuracy
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievementProgress.map(achievement => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  progress={achievement.progress}
                  unlocked={achievement.unlocked}
                />
              ))}
            </div>
          </div>
        )}

        {/* Breakdown Tab */}
        {activeTab === 'breakdown' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration Breakdown */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Best by Duration
              </h3>
              <div className="space-y-3">
                {Object.entries(personalBests?.byDuration || {}).map(([duration, data]) => (
                  <div key={duration} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getDurationLabel(parseInt(duration))}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {data.wpm ? Math.round(data.wpm) : 0} WPM
                      </div>
                      <div className="text-xs text-gray-500">
                        {data.accuracy ? Math.round(data.accuracy) : 0}% Accuracy
                      </div>
                      {data.date && (
                        <div className="text-xs text-gray-400">
                          {formatDate(data.date)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Performance Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Average WPM</span>
                  <span className="font-medium">{stats.averageWPM}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Average Accuracy</span>
                  <span className="font-medium">{stats.averageAccuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Improvement Trend</span>
                  <span className={`font-medium ${stats.improvementTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.improvementTrend > 0 ? '+' : ''}{stats.improvementTrend}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</span>
                  <span className="font-medium">{streakData?.longestStreak || 0} days</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Data */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="mr-2">📤</span>
                  Export Data
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Download a backup of all your personal records, achievements, and settings.
                </p>
                <button
                  onClick={handleExportData}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Export Backup File
                </button>
              </div>

              {/* Import Data */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="mr-2">📥</span>
                  Import Data
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Restore your data from a backup file.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {/* Data Statistics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                <span className="mr-2">📊</span>
                Data Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {performanceHistory.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Object.values(achievements).filter(Boolean).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {streakData?.longestStreak || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Best Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {personalBests?.wpm ? Math.round(personalBests.wpm) : 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Best WPM</div>
                </div>
              </div>
            </div>

            {/* Data Management Actions */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-yellow-800 dark:text-yellow-200 flex items-center">
                <span className="mr-2">⚠️</span>
                Danger Zone
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                These actions are permanent and cannot be undone. Please export your data first if you want to keep a backup.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (window.confirm('This will clear all your personal records and achievements. Are you sure?')) {
                      resetAllData();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Clear All Data
                </button>
                <button
                  onClick={() => {
                    const { cleanupOldData } = require('../utils/personalBestStorage.js');
                    const cleaned = cleanupOldData();
                    alert(cleaned ? 'Old data cleaned up successfully!' : 'No old data to clean up.');
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
                >
                  Clean Old Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Data Button */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Reset all personal records and achievements
            </p>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            Reset Data
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Reset All Data?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will permanently delete all your personal records, achievements, and history. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Reset All Data
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog Modal */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Export Data
              </h3>
              <button
                onClick={() => setShowExportDialog(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Copy the data below or download it as a file to backup your progress:
              </p>
              <textarea
                readOnly
                value={exportData}
                className="w-full h-64 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-xs"
                placeholder="Export data will appear here..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={downloadExportFile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Download File
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportData);
                  alert('Data copied to clipboard!');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowExportDialog(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalBestDisplay;