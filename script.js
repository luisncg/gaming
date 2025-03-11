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
  isJumping: false
  
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
  obstacleSpawnRate: 120 // Spawn a new obstacle every 120 frames (about 2 seconds)
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
  });

  button.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys[action] = !isKeyDown;
  });
}

// Bind touch controls
addTouchControl(leftButton, 'ArrowLeft', true);
addTouchControl(rightButton, 'ArrowRight', true);
addTouchControl(upButton, 'Space', true);

// Initialize game
function initGame() {
  gameState.gameActive = true;
  gameState.score = 0;
  gameState.viewportOffset = 0;
  gameState.lastGeneratedX = 800;
  scoreElement.textContent = '0';
  gameOverScreen.style.display = 'none';

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
  
  // createObstacle(400, 415, 45, 45);
  
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

// Create obstacle (updated function)
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
// Add a function to spawn falling obstacles (updated)
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

// Update game state
function updateGame() {
  if (!gameState.gameActive) return;

  player.velocityY += gameState.gravity;

  if (keys['ArrowLeft']) player.velocityX = -player.speed;
  else if (keys['ArrowRight']) player.velocityX = player.speed;
  else player.velocityX = 0;

  // Add this to your updateGame function where you handle player movement
if (keys['ArrowLeft']) {
  player.velocityX = -player.speed;
  player.element.style.transform = 'scaleX(-1)'; // Flip horizontally
} else if (keys['ArrowRight']) {
  player.velocityX = player.speed;
  player.element.style.transform = 'scaleX(1)'; // Normal orientation
} else player.velocityX = 0;
  
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

// Right after this section (after the closing curly brace), add the code:
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



  // INSERT THE NEW CODE RIGHT HERE
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
    const adjustedX = obstacle.isFalling ? 
      (obstacle.x - gameState.viewportOffset) : 
      (obstacle.x - gameState.viewportOffset);
    
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
    
 already removed)
Fixed collision detection to use the visual position of obstacles
Made sure obstacle positions are updated during camera movement
To implement this fix:

Replace your createObstacle() function
Replace your spawnFallingObstacle() function
Update the section in updateGame() that handles falling obstacles
Add the additional code for updating obstacles during camera movement
These changes should ensure that obstacles continue to fall correctly regardless of whether the player is moving the screen or standing still. The obstacles will now appear within the visible area and be properly positioned relative to the viewport.




Retry
Claude can make mistakes. Please double-check responses.



No file chosen

3.7 Sonnet

Choose style

Fixed Falling Obstacles Code

// Create obstacle (updated function)
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

// Add a function to spawn falling obstacles (updated)
function spawnFallingObstacle() {
  // Calculate a position within the current visible area (viewport-relative)
  const viewportWidth = gameContainer.clientWidth;
  const randomX = Math.random() * viewportWidth;
  createObstacle(randomX, -50, 45, 45, true); // Start above the screen
}

// Update the existing obstacle update code in updateGame()
// Replace the section that handles updating falling obstacles with this:

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
    const adjustedX = obstacle.isFalling ? 
      (obstacle.x - gameState.viewportOffset) : 
      (obstacle.x - gameState.viewportOffset);
    
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
  
  // Check for collision with player (update to handle visual position correctly)
  let obstacleVisualX = obstacle.isFalling ? 
    (obstacle.x - gameState.viewportOffset) : 
    (obstacle.x - gameState.viewportOffset);
    
  if (player.x + player.width > obstacleVisualX &&
      player.x < obstacleVisualX + obstacle.width &&
      player.y + player.height > obstacle.y &&
      player.y < obstacle.y + obstacle.height) {
    gameOver();
    return;
  }
}
  // END OF NEW CODE INSERTION

  // Fall off screen check
  if (player.y > gameContainer.clientHeight) {
    gameOver();
    return;
  }

  
  // Rest of the updateGame function (platform collisions, burger collection, etc.)
  // ...


  player.isJumping = true;
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];

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


  for (let i = 0; i < burgers.length; i++) {
    const burger = burgers[i];

    if (player.x + player.width > burger.x - gameState.viewportOffset &&
      player.x < burger.x - gameState.viewportOffset + burger.width &&
      player.y + player.height > burger.y &&
      player.y < burger.y + burger.height) {

      gameState.score += 10;
      scoreElement.textContent = gameState.score;

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

  finalScoreElement.textContent = 'Score: ' + gameState.score;
  gameOverScreen.style.display = 'flex';
}

// Event listeners for keyboard input
document.addEventListener('keydown', (event) => {
  keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
  keys[event.key] = false;
});

// Modify the generateLevelContent function to include some static obstacles on platforms
// while keeping the main raining mechanic separate
function generateLevelContent() {
  const startX = gameState.lastGeneratedX;
  const endX = startX + 1000; // Generate 1000px of content at a time
  let lastPlatformX = startX;

  // Generate platforms with gaps
  while (lastPlatformX < endX) {
    const platformWidth = Math.floor(Math.random() * 200) + 100;
    const gap = Math.floor(Math.random() * 100) + 50; // Gap between platforms
    const platformY = Math.floor(Math.random() * 150) + 350; // Vary the height a bit

    createPlatform(lastPlatformX, platformY, platformWidth, 30);

    // Removed the static obstacle creation code from here

    // Add a burger on some platforms
    if (Math.random() < 0.5) {
      const burgerX = lastPlatformX + Math.random() * (platformWidth - 30);
      createBurger(burgerX, platformY - 40);
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
