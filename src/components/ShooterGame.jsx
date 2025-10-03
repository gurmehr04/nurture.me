import React, { useEffect, useRef, useState } from 'react';

const EmojiShooterGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    score: 0,
    gameOver: false,
    shooter: {
      x: 0,
      y: 0,
      width: 80,
      height: 80,
      speed: 10  // Reduced from 5
    },
    balls: [],
    emojis: [],
    barValue: 250
  });

  const [controls, setControls] = useState({
    isMovingLeft: false,
    isMovingRight: false
  });

  // Adjusted Constants
  const BALL_SPEED = 3;  // Reduced from 5
  const EMOJI_SPEED = 1;  // Reduced from 2
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const EMOJI_SPAWN_RATE = 0.01; // Reduced from 0.02 (1% chance per frame instead of 2%)
  const BAR_CHANGE_RATE = {
    happy: -20,    // Reduced from -20
    other: 30      // Reduced from 30
  };
  const SCORE_CHANGE = {
    happy: -20,     // Reduced from -10
    other:  30      // Reduced from 10
  };

  // Load images
  const images = {
    background: '/spaceBG.gif',
    ball: '/bullet.png',
    shooter: '/SpaceShip.png',
    emojis: {
      sad: '/sad.png',
      angry: '/angry.png',
      happy: '/happy.png'
    }
  };

  const initGame = () => {
    if (!canvasRef.current) return;

    setGameState({
      score: 0,
      gameOver: false,
      shooter: {
        x: CANVAS_WIDTH / 2 - 25,
        y: CANVAS_HEIGHT - 90,
        width: 80,
        height: 80,
        speed: 5  // Reduced from 5
      },
      balls: [],
      emojis: [],
      barValue: 250
    });
  };

  const createEmoji = () => {
    const types = ['sad', 'angry', 'happy'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      type,
      x: Math.random() * (CANVAS_WIDTH - 60),
      y: 0,
      width: 60,
      height: 60,
      hit: false
    };
  };

  const shootBall = () => {
    setGameState(prev => ({
      ...prev,
      balls: [...prev.balls, {
        x: prev.shooter.x + prev.shooter.width / 2,
        y: prev.shooter.y,
        radius: 10,
        speed: BALL_SPEED
      }]
    }));
  };

  const detectCollision = (ball, emoji) => {
    return (
      ball.x - ball.radius < emoji.x + emoji.width &&
      ball.x + ball.radius > emoji.x &&
      ball.y - ball.radius < emoji.y + emoji.height &&
      ball.y + ball.radius > emoji.y
    );
  };

  const updateGame = () => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      // Update shooter position with smoother movement
      let newShooterX = prev.shooter.x;
      if (controls.isMovingLeft && newShooterX > 0) {
        newShooterX -= prev.shooter.speed;
      }
      if (controls.isMovingRight && newShooterX < CANVAS_WIDTH - prev.shooter.width) {
        newShooterX += prev.shooter.speed;
      }

      // Update balls with adjusted speed
      const newBalls = prev.balls.filter(ball => {
        ball.y -= ball.speed;
        return ball.y > 0;
      });

      // Update emojis with reduced spawn rate
      const newEmojis = [...prev.emojis];
      if (Math.random() < EMOJI_SPAWN_RATE) {
        newEmojis.push(createEmoji());
      }
      
      newEmojis.forEach((emoji) => {
        emoji.y += EMOJI_SPEED;
      });

      // Check collisions with adjusted scoring
      let newScore = prev.score;
      let newBarValue = prev.barValue;
      
      newBalls.forEach((ball, ballIndex) => {
        newEmojis.forEach((emoji, emojiIndex) => {
          if (detectCollision(ball, emoji)) {
            newBalls.splice(ballIndex, 1);
            newEmojis.splice(emojiIndex, 1);
            
            if (emoji.type === 'happy') {
              newBarValue += BAR_CHANGE_RATE.happy;
              newScore += SCORE_CHANGE.happy;
            } else {
              newBarValue += BAR_CHANGE_RATE.other;
              newScore += SCORE_CHANGE.other;
            }
          }
        });
      });

      // Limit bar value changes
      newBarValue = Math.max(0, Math.min(newBarValue, CANVAS_WIDTH));
      const gameOver = newBarValue <= 0 || newBarValue >= CANVAS_WIDTH;

      return {
        ...prev,
        score: newScore,
        barValue: newBarValue,
        gameOver,
        shooter: { ...prev.shooter, x: newShooterX },
        balls: newBalls,
        emojis: newEmojis.filter(emoji => emoji.y < CANVAS_HEIGHT)
      };
    });
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    const bgImg = new Image();
    bgImg.src = images.background;
    ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw shooter
    const shooterImg = new Image();
    shooterImg.src = images.shooter;
    ctx.drawImage(
      shooterImg,
      gameState.shooter.x,
      gameState.shooter.y,
      gameState.shooter.width,
      gameState.shooter.height
    );

    // Draw balls
    const ballImg = new Image();
    ballImg.src = images.ball;
    gameState.balls.forEach(ball => {
      ctx.drawImage(ballImg, ball.x - 10, ball.y - 10, 30, 30);
    });

    // Draw emojis
    gameState.emojis.forEach(emoji => {
      const emojiImg = new Image();
      emojiImg.src = images.emojis[emoji.type];
      ctx.drawImage(emojiImg, emoji.x, emoji.y, emoji.width, emoji.height);
    });

    // Draw progress bar
    const barPadding = 10;
    const barHeight = 30;
    const barWidth = CANVAS_WIDTH - 2 * barPadding;
    const filledWidth = (gameState.barValue / CANVAS_WIDTH) * barWidth;

    ctx.fillStyle = '#ffff';
    ctx.fillRect(barPadding, 10, barWidth, barHeight);

    ctx.fillStyle = gameState.barValue > 600 ? 'green' : 
                   gameState.barValue > 300 ? 'yellow' : 'red';
    ctx.fillRect(barPadding, 10, filledWidth, barHeight);

    // Draw score with better visibility
    ctx.fillStyle = '#000';  // Changed to white for better visibility
    ctx.font = 'bold 20px Arial';  // Made font bold
    ctx.fillText(`Score: ${gameState.score}`, CANVAS_WIDTH/2 - 40, 32);

    // Draw game over screen
    if (gameState.gameOver) {
      // Draw semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';  // Adjusted for transparency
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
      // Draw "Game Over" text
      ctx.fillStyle = '#ffff';  // White text for visibility
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
      // Draw Final Score
      ctx.font = '30px Arial';  // Slightly smaller font for the score
      ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }    
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        setControls(prev => ({ ...prev, isMovingLeft: true }));
      } else if (event.key === 'ArrowRight') {
        setControls(prev => ({ ...prev, isMovingRight: true }));
      } else if (event.key === ' ') {
        shootBall();
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'ArrowLeft') {
        setControls(prev => ({ ...prev, isMovingLeft: false }));
      } else if (event.key === 'ArrowRight') {
        setControls(prev => ({ ...prev, isMovingRight: false }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    let animationFrameId;
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const gameLoop = (timestamp) => {
      if (!gameState.gameOver) {
        const deltaTime = timestamp - lastFrameTime;
        
        if (deltaTime >= frameInterval) {
          updateGame();
          drawGame();
          lastFrameTime = timestamp;
        }
        
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    gameLoop(0);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameState, controls]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-4 text-white text-lg">
        Use Arrow Keys to move, Spacebar to shoot
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-600 rounded-lg"
      />
      {gameState.gameOver && (
        <button
          onClick={initGame}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Restart
        </button>
      )}
    </div>
  );
};

export default EmojiShooterGame;