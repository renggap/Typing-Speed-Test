// Canvas image generation for sharing results
import { getPerformanceCategory } from './calculations.js';

/**
 * Main function to generate result card canvas
 * @param {object} results - Test results object
 * @param {string} theme - Theme preference (light/dark)
 * @returns {HTMLCanvasElement} Generated canvas element
 */
export const generateResultCard = (results, theme = 'light') => {
  const {
    wpm = 0,
    accuracy = 0,
    errors = 0,
    totalChars = 0,
    timeElapsed = 60
  } = results;

  // Get performance category
  const category = getPerformanceCategory(wpm);

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set dimensions for social sharing
  canvas.width = 800;
  canvas.height = 600;

  // Enable high-DPI support
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = canvas.width;
  const displayHeight = canvas.height;

  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  canvas.style.width = displayWidth + 'px';
  canvas.style.height = displayHeight + 'px';

  ctx.scale(dpr, dpr);

  // Set up canvas context
  ctx.imageSmoothingEnabled = true;
  ctx.textBaseline = 'middle';

  // Draw background gradient based on performance
  drawBackground(canvas, ctx, category, theme);

  // Draw main text elements
  drawTextElements(canvas, ctx, results, category);

  // Draw performance badge
  drawBadge(canvas, ctx, category);

  // Add branding
  addBranding(canvas, ctx);

  return canvas;
};

/**
 * Draw performance-based gradient background
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {object} category - Performance category object
 * @param {string} theme - Theme preference
 */
const drawBackground = (canvas, ctx, category, theme) => {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

  // Define gradient colors based on performance category
  const gradients = {
    'Legend': ['#FFD700', '#FF6B35', '#F7931E', '#C2185B', '#7B1FA2', '#3F51B5'],
    'Master': ['#CA8A04', '#EAB308'],
    'Expert': ['#EA580C', '#F97316'],
    'Advanced': ['#7C3AED', '#A855F7'],
    'Intermediate': ['#1E40AF', '#3B82F6'],
    'Beginner': ['#6B7280', '#9CA3AF']
  };

  const colors = gradients[category.name] || gradients['Beginner'];

  if (category.name === 'Legend') {
    // Rainbow gradient for Legend
    const positions = [0, 0.2, 0.4, 0.6, 0.8, 1];
    colors.forEach((color, index) => {
      gradient.addColorStop(positions[index], color);
    });
  } else {
    // Standard gradient
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add subtle pattern overlay
  addBackgroundPattern(ctx, canvas.width, canvas.height, theme);
};

/**
 * Add subtle background pattern
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string} theme - Theme preference
 */
const addBackgroundPattern = (ctx, width, height, theme) => {
  ctx.save();

  // Create subtle dot pattern
  ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  for (let x = 0; x < width; x += 50) {
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
};

/**
 * Draw main text elements (WPM, accuracy, stats)
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {object} results - Test results
 * @param {object} category - Performance category
 */
const drawTextElements = (canvas, ctx, results, category) => {
  const { wpm, accuracy, errors, totalChars, timeElapsed } = results;
  const timeInMinutes = Math.round(timeElapsed / 60);

  // Main WPM display (center-top)
  ctx.save();
  ctx.textAlign = 'center';

  // WPM Label
  ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('WPM', canvas.width / 2, 150);

  // WPM Value (large)
  ctx.font = 'bold 144px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(Math.round(wpm), canvas.width / 2, 280);

  ctx.restore();

  // Accuracy and Time (bottom section)
  ctx.save();
  ctx.textAlign = 'center';

  // Accuracy
  ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`${Math.round(accuracy)}%`, canvas.width / 2 - 150, 450);

  ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Accuracy', canvas.width / 2 - 150, 490);

  // Time
  ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`${timeInMinutes}m`, canvas.width / 2 + 150, 450);

  ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Time', canvas.width / 2 + 150, 490);

  ctx.restore();
};

/**
 * Draw performance badge with emoji
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {object} category - Performance category
 */
const drawBadge = (canvas, ctx, category) => {
  ctx.save();
  ctx.textAlign = 'center';

  // Badge background
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;

  // Draw rounded rectangle badge
  const badgeWidth = 300;
  const badgeHeight = 80;
  const badgeX = canvas.width / 2 - badgeWidth / 2;
  const badgeY = 350;

  roundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 15);
  ctx.fill();
  ctx.stroke();

  // Badge text and emoji
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFFFFF';

  const badgeText = `${category.name} ${category.emoji}`;
  ctx.fillText(badgeText, canvas.width / 2, badgeY + badgeHeight / 2);

  ctx.restore();
};

/**
 * Add branding elements
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
const addBranding = (canvas, ctx) => {
  ctx.save();

  // Subtle branding at bottom
  ctx.textAlign = 'center';
  ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('Typing Speed Test', canvas.width / 2, canvas.height - 40);

  // Website URL
  ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('supernova-corp.com', canvas.width / 2, canvas.height - 15);

  ctx.restore();
};

/**
 * Helper function to draw rounded rectangles
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {number} radius - Corner radius
 */
const roundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

/**
 * Download result card as image
 * @param {object} results - Test results object
 * @param {string} theme - Theme preference
 */
export const downloadResultCard = (results, theme = 'light') => {
  const { wpm = 0, accuracy = 0 } = results;

  // Generate canvas
  const canvas = generateResultCard(results, theme);

  // Create download link
  const link = document.createElement('a');
  link.download = `typing-test-${wpm}wpm-${Math.round(accuracy)}pct.png`;
  link.href = canvas.toDataURL('image/png');

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};