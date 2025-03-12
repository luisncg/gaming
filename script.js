// Game variables
const player = {
  element: document.getElementById('player'),
  x: 50,
  y: 300,
  width: 40,
  height: 40,
  velocityX: 0,
  velocityY: 0,
  speed: 5,
  jumpForce: 15,
  isCrouching: false,
  normalHeight: 50,  // Original player height
  crouchHeight: 25   // Height when crouching
  isJumping: false,
  isInvincible: false,
  invincibilityTimer: 0,
  normalSpeed: 5 // Store the original speed
};

const gameState = {
  gravity: 0.8,
  score: 0,
  gameActive: true,
  gameInterval: null,
  lastGeneratedX: 800,
  viewportOffset: 0,
  generationThreshold: 500,
  obstacleSpawnTimer: 0,
  obstacleSpawnRate: 120, // Spawn a new obstacle every 120 frames (about 2 seconds)
  powerUpDuration: 300, // 5 seconds (60 frames per second × 5)
  powerUpThreshold: 50, // Score needed to trigger power-up
  powerUpActive: false,
  powerUpTriggered: false // To ensure it only triggers once when threshold is reached
};


let platforms = [];
let obstacles = [];
let burgers = [];
let keys = {};

const gameContainer = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

// Touch controls
const leftButton = document.getElementById('left');
const rightButton = document.getElementById('right');
const upButton = document.getElementById('up');

// Handle touch controls
function addTouchControl(button, action, isKeyDown) {
  button.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    keys[action] = isKeyDown;
    
    // Add crouching for down button
    if (action === 'down') {
      startCrouching();
    }
  });

  button.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys[action] = !isKeyDown;
    
    // Stop crouching for down button
    if (action === 'down') {
      stopCrouching();
    }
  });
}

// Bind touch controls
addTouchControl(leftButton, 'a', true);
addTouchControl(rightButton, 'd', true);
addTouchControl(upButton, 'Space', true);
addTouchControl(document.getElementById('down'), 'down', true);
// Add this new function before initGame
// Helper function to check if a new platform would overlap with existing ones
function wouldOverlap(newX, newY, newWidth, newHeight, verticalMargin = 30) {
  return platforms.some(platform => {
    // Check horizontal overlap
    const horizontalOverlap = 
      newX + newWidth > platform.x && 
      newX < platform.x + platform.width;
    
    // Check vertical overlap with margin
    // This prevents platforms from being too close vertically
    const verticalOverlap = 
      Math.abs((newY + newHeight / 2) - (platform.y + platform.height / 2)) < verticalMargin;
    
    return horizontalOverlap && verticalOverlap;
  });
}


// Initialize game
function initGame() {
  gameState.gameActive = true;
  gameState.score = 0;
  gameState.viewportOffset = 0;
  gameState.lastGeneratedX = 800;
  scoreElement.textContent = '0';
  gameOverScreen.style.display = 'none';

  // Reset power-up state
  player.isInvincible = false;
  player.invincibilityTimer = 0;
  player.speed = player.normalSpeed;
  gameState.powerUpActive = false;
  gameState.powerUpTriggered = false;
  gameState.powerUpThreshold = 50; // Reset to initial threshold
  
  // Remove any lingering power-up text
  const powerUpText = document.getElementById('power-up-text');
  if (powerUpText) powerUpText.remove();
  
  // Reset player animation
  player.element.style.animation = '';

  player.x = 50;
  player.y = 300;
  player.velocityX = 0;
  player.velocityY = 0;
  player.element.style.left = player.x + 'px';
  player.element.style.top = player.y + 'px';

  platforms = [];
  obstacles = [];
  burgers = [];
  
  document.querySelectorAll('.platform, .obstacle, .burger').forEach(element => element.remove());

  createPlatform(0, 450, 300, 50);
  createPlatform(350, 450, 300, 50);
  createPlatform(700, 450, 300, 50);
  createPlatform(500, 350, 200, 30);
  
  createBurger(250, 415);
  createBurger(550, 315);

  generateLevelContent();
  gameState.gameInterval = setInterval(updateGame, 16);
}

// Create platform
function createPlatform(x, y, width, height) {
  const platform = document.createElement('div');
  platform.className = 'platform';
  platform.style.left = (x - gameState.viewportOffset) + 'px';
  platform.style.top = y + 'px';
  platform.style.width = width + 'px';
  platform.style.height = height + 'px';

  gameContainer.appendChild(platform);

  platforms.push({ element: platform, x, y, width, height });
}

// Create obstacle
function createObstacle(x, y, width = 45, height = 45, isFalling = false) {
  const obstacle = document.createElement('div');
  obstacle.className = 'obstacle';
  obstacle.style.width = width + 'px';
  obstacle.style.height = height + 'px';
  
  // For falling obstacles, position relative to viewport offset immediately
  const posX = isFalling ? x : (x - gameState.viewportOffset);
  
  obstacle.style.left = posX + 'px';
  obstacle.style.top = y + 'px';
  obstacle.style.backgroundImage = "url('https://i.imgur.com/WI3ssR6.png')";
  obstacle.style.backgroundSize = "cover";
  obstacle.style.position = "absolute";

  gameContainer.appendChild(obstacle);

  obstacles.push({ 
    element: obstacle, 
    x: isFalling ? x + gameState.viewportOffset : x, // Store the absolute x for falling obstacles
    y, 
    width, 
    height, 
    isFalling, 
    velocityY: 0,
    fallSpeed: Math.random() * 2 + 3 // Random fall speed between 3-5
  });
}

// Add a function to spawn falling obstacles
function spawnFallingObstacle() {
  // Calculate a position within the current visible area (viewport-relative)
  const viewportWidth = gameContainer.clientWidth;
  const randomX = Math.random() * viewportWidth;
  createObstacle(randomX, -50, 45, 45, true); // Start above the screen
}

// Create burger
function createBurger(x, y) {
  // Check if the burger would overlap an obstacle
  const isOnObstacle = obstacles.some(obstacle => 
    x + 30 > obstacle.x && x < obstacle.x + obstacle.width &&
    y + 30 > obstacle.y && y < obstacle.y + obstacle.height
  );

  // If it would overlap, adjust its position to be just above the obstacle
  if (isOnObstacle) {
    y -= 40; // Moves the burger up to avoid overlap
  }

  const burger = document.createElement('div');
  burger.className = 'burger';
  burger.style.left = (x - gameState.viewportOffset) + 'px';
  burger.style.top = y + 'px';

  gameContainer.appendChild(burger);

  burgers.push({ element: burger, x, y, width: 30, height: 30 });
}

// ADD THIS NEW FUNCTION DIRECTLY AFTER THE createBurger FUNCTION:
function activatePowerUp() {
  player.isInvincible = true;
  player.invincibilityTimer = gameState.powerUpDuration;
  player.speed = player.normalSpeed * 1.5; // 50% speed boost
  gameState.powerUpActive = true;
  
  // Visual effects for power-up
  player.element.style.animation = 'rainbow 0.5s linear infinite';
  
  // Add a visual indicator for power-up
  const powerUpText = document.createElement('div');
  powerUpText.textContent = 'rainbow time !';
  powerUpText.style.position = 'absolute';
  powerUpText.style.top = '50px';
  powerUpText.style.left = '50%';
  powerUpText.style.transform = 'translateX(-50%)';
  powerUpText.style.color = 'white';
  powerUpText.style.fontWeight = 'bold';
  powerUpText.style.fontSize = '24px';
  powerUpText.style.textShadow = '0 0 5px #ff0000, 0 0 10px #ff7700, 0 0 15px #ffff00, 0 0 20px #00ff00, 0 0 25px #0000ff, 0 0 30px #8a2be2';
  powerUpText.style.zIndex = '100';
  powerUpText.id = 'power-up-text';
  gameContainer.appendChild(powerUpText);
  
  // Remove the text after 2 seconds
  setTimeout(() => {
    const textElement = document.getElementById('power-up-text');
    if (textElement) textElement.remove();
  }, 2000);
  
  // Add rainbow animation style if it doesn't exist
  if (!document.getElementById('rainbow-animation-style')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'rainbow-animation-style';
    styleSheet.textContent = `
      @keyframes rainbow {
        0% { filter: hue-rotate(0deg) brightness(1.2); }
        50% { filter: hue-rotate(180deg) brightness(1.5); }
        100% { filter: hue-rotate(360deg) brightness(1.2); }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}


// Update the keyboard controls in the updateGame function
function updateGame() {
  if (!gameState.gameActive) return;

  // Power-up timer management
  if (player.isInvincible) {
    player.invincibilityTimer--;
    
    if (player.invincibilityTimer <= 0) {
      // Reset to normal
      player.isInvincible = false;
      player.speed = player.normalSpeed;
      player.element.style.animation = '';
      gameState.powerUpActive = false;
      
      // Reset power-up trigger at higher threshold for next power-up
      gameState.powerUpTriggered = false;
      gameState.powerUpThreshold += 100; // Next power-up at +100 points
    }
  }

  player.velocityY += gameState.gravity;

  // Handle player movement with WASD instead of arrow keys
  if (keys['a'] || keys['A']) {
    player.velocityX = -player.speed;
    player.element.style.transform = 'scaleX(-1)'; // Flip horizontally
  } else if (keys['d'] || keys['D']) {
    player.velocityX = player.speed;
    player.element.style.transform = 'scaleX(1)'; // Normal orientation
  } else {
    player.velocityX = 0;
  }

// Double-check power-up threshold - safety check for bug fix
  if (!player.isInvincible && !gameState.powerUpTriggered && gameState.score >= gameState.powerUpThreshold) {
    activatePowerUp();
    gameState.powerUpTriggered = true;
  }
  
  
  if ((keys[' '] || keys['Space']) && !player.isJumping) {
    player.velocityY = -player.jumpForce;
    player.isJumping = true;
  }

  player.x += player.velocityX;
  player.y += player.velocityY;

  if (player.x < 0) player.x = 0;

  // Camera scrolling logic
  if (player.x > gameContainer.clientWidth / 2 && player.velocityX > 0) {
    gameState.viewportOffset += player.velocityX;
    player.x = gameContainer.clientWidth / 2;

    platforms.forEach(platform => platform.element.style.left = (platform.x - gameState.viewportOffset) + 'px');
    obstacles.forEach(obstacle => obstacle.element.style.left = (obstacle.x - gameState.viewportOffset) + 'px');
    burgers.forEach(burger => burger.element.style.left = (burger.x - gameState.viewportOffset) + 'px');

    if (gameState.lastGeneratedX - gameState.viewportOffset < gameContainer.clientWidth + gameState.generationThreshold) {
      generateLevelContent();
    }
  }

  // Update the visual position of falling obstacles when camera moves
  obstacles.forEach(obstacle => {
    if (obstacle.isFalling) {
      // For falling obstacles, recalculate position based on viewport
      obstacle.element.style.left = (obstacle.x - gameState.viewportOffset) + 'px';
    } else {
      // For static obstacles
      obstacle.element.style.left = (obstacle.x - gameState.viewportOffset) + 'px';
    }
  });
  
  // Parallax effect for clouds
  document.querySelector('.cloud1').style.left = `${10 - (gameState.viewportOffset * 0.01) % 100}%`;
  document.querySelector('.cloud2').style.left = `${40 - (gameState.viewportOffset * 0.01) % 100}%`;
  document.querySelector('.cloud3').style.left = `${70 - (gameState.viewportOffset * 0.01) % 100}%`;

  // Handle falling obstacle spawning
  gameState.obstacleSpawnTimer++;
  if (gameState.obstacleSpawnTimer >= gameState.obstacleSpawnRate) {
    spawnFallingObstacle();
    gameState.obstacleSpawnTimer = 0;
    
    // Make obstacles spawn faster as score increases
    gameState.obstacleSpawnRate = Math.max(30, 120 - Math.floor(gameState.score / 50));
  }

  // Update falling obstacles
  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    
    if (obstacle.isFalling) {
      // Apply gravity to falling obstacles
      obstacle.velocityY += gameState.gravity * 0.5;
      obstacle.y += obstacle.velocityY;
      
      // Update obstacle position on screen
      obstacle.element.style.top = obstacle.y + 'px';
      
      // For falling obstacles, we need to adjust their visual x position when viewport changes
      const adjustedX = obstacle.x - gameState.viewportOffset;
      obstacle.element.style.left = adjustedX + 'px';
      
      // Remove obstacles that fall off-screen
      if (obstacle.y > gameContainer.clientHeight) {
        if (obstacle.element && obstacle.element.parentNode) {
          gameContainer.removeChild(obstacle.element);
        }
        obstacles.splice(i, 1);
        i--;
        continue;
      }
    }
    
    // Check for collision with player
    const obstacleVisualX = obstacle.x - gameState.viewportOffset;
    const hitboxReduction = 10; // pixels to reduce from each side
    
    // Only check collision if not invincible
    if (!player.isInvincible && 
        player.x + player.width - hitboxReduction > obstacleVisualX + hitboxReduction &&
        player.x + hitboxReduction < obstacleVisualX + obstacle.width - hitboxReduction &&
        player.y + player.height - hitboxReduction > obstacle.y + hitboxReduction &&
        player.y + hitboxReduction < obstacle.y + obstacle.height - hitboxReduction) {
      gameOver();
      return;
    }
    
    // If invincible, destroy obstacles on collision
    if (player.isInvincible &&
        player.x + player.width > obstacleVisualX &&
        player.x < obstacleVisualX + obstacle.width &&
        player.y + player.height > obstacle.y &&
        player.y < obstacle.y + obstacle.height) {
      // Remove the obstacle
      if (obstacle.element && obstacle.element.parentNode) {
        gameContainer.removeChild(obstacle.element);
      }
      obstacles.splice(i, 1);
      i--;
      continue;
    }
  }

  // Fall off screen check
  if (player.y > gameContainer.clientHeight) {
    gameOver();
    return;
  }

  // Platform collision detection
  player.isJumping = true;
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];


    // I might want to modify the collision detection to account for crouching
    if (player.velocityY >= 0 &&
      player.x + player.width > platform.x - gameState.viewportOffset &&
      player.x < platform.x - gameState.viewportOffset + platform.width &&
      player.y + player.height >= platform.y &&
      player.y + player.height <= platform.y + platform.height + 10) {

      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.isJumping = false;
    }
  }

  // Burger collection
  for (let i = 0; i < burgers.length; i++) {
    const burger = burgers[i];

    if (player.x + player.width > burger.x - gameState.viewportOffset &&
      player.x < burger.x - gameState.viewportOffset + burger.width &&
      player.y + player.height > burger.y &&
      player.y < burger.y + burger.height) {

      gameState.score += 10;
      scoreElement.textContent = gameState.score;

      // Check if player reached powerUp threshold
      if (!gameState.powerUpTriggered && gameState.score >= gameState.powerUpThreshold) {
        activatePowerUp();
        gameState.powerUpTriggered = true;
      }

      gameContainer.removeChild(burger.element);
      burgers.splice(i, 1);
      i--;
    }
  }


  player.element.style.left = player.x + 'px';
  player.element.style.top = player.y + 'px';
}

// Game over function
function gameOver() {
  gameState.gameActive = false;
  clearInterval(gameState.gameInterval);

  // Clear power-up state immediately on game over
  player.isInvincible = false;
  player.speed = player.normalSpeed;
  player.element.style.animation = '';
  
  // Remove power-up visual
  const powerUpText = document.getElementById('power-up-text');
  if (powerUpText) powerUpText.remove();

  finalScoreElement.textContent = 'Score: ' + gameState.score;
  gameOverScreen.style.display = 'flex';
}

// Update the keyboard event listeners
document.addEventListener('keydown', (event) => {
  // Map both WASD and arrow keys to the same actions
  if (event.key === 'a' || event.key === 'A') keys['ArrowLeft'] = true;
  if (event.key === 'd' || event.key === 'D') keys['ArrowRight'] = true;
  if (event.key === 's' || event.key === 'S') {
    keys['ArrowDown'] = true;
    startCrouching();
  }
  
  // Store original key as well
  keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
  // Map both WASD and arrow keys to the same actions
  if (event.key === 'a' || event.key === 'A') keys['ArrowLeft'] = false;
  if (event.key === 'd' || event.key === 'D') keys['ArrowRight'] = false;
  if (event.key === 's' || event.key === 'S') {
    keys['ArrowDown'] = false;
    stopCrouching();
  }
  
  // Store original key as well
  keys[event.key] = false;
});

// Add these new functions
function startCrouching() {
  if (!player.isJumping) {
    player.isCrouching = true;
    player.element.style.height = `${player.crouchHeight}px`;
    player.height = player.crouchHeight;
    
    // Optionally, change player image to crouching image
    player.element.style.backgroundImage = "url('https://i.imgur.com/WI3ssR6.png')";
    
    // Adjust player position to keep feet on the ground
    player.y += player.normalHeight - player.crouchHeight;
    player.element.style.top = `${player.y}px`;
  }
}

function stopCrouching() {
  player.isCrouching = false;
  player.element.style.height = `${player.normalHeight}px`;
  player.height = player.normalHeight;
  
  // Restore original player image
  player.element.style.backgroundImage = "url('https://i.imgur.com/LrO0MTY.png')";
  
  // Adjust player position back
  player.y -= player.normalHeight - player.crouchHeight;
  player.element.style.top = `${player.y}px`;
}


// Generate level content
function generateLevelContent() {
  const startX = gameState.lastGeneratedX;
  const endX = startX + 1000; // Generate 1000px of content at a time
  let lastPlatformX = startX;
  const minGap = 50; // Minimum gap between platforms
  const maxAttempts = 10; // Max attempts to place a platform

  // Generate platforms with gaps
  while (lastPlatformX < endX) {
    const platformWidth = Math.floor(Math.random() * 200) + 100;
    const gap = Math.floor(Math.random() * 100) + minGap; // Gap between platforms
    
    // Try different Y positions if there's an overlap
    let platformY = 0;
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < maxAttempts) {
      // Vary the height a bit, but keep within playable range
      platformY = Math.floor(Math.random() * 150) + 350;
      
      // Check if this position would overlap
      if (!wouldOverlap(lastPlatformX, platformY, platformWidth, 30)) {
        placed = true;
      } else {
        attempts++;
      }
    }
    
    if (placed) {
      createPlatform(lastPlatformX, platformY, platformWidth, 30);

      // Add a burger on some platforms
      if (Math.random() < 0.5) {
        const burgerX = lastPlatformX + Math.random() * (platformWidth - 30);
        createBurger(burgerX, platformY - 40);
      }
    }

    lastPlatformX += platformWidth + gap;
  }

  // Update the last generated position
  gameState.lastGeneratedX = endX;
}

// Restart button
restartButton.addEventListener('click', initGame);

// Start the game
initGame();
