class KatanaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('katanaHighScore')) || 0;
        
        // Level system
        this.currentLevel = 1;
        this.levelThreshold = 1000; // Score required to unlock level 2
        this.hasReachedLevel2 = false;
        
        // Level transition system
        this.isTransitioning = false;
        this.transitionProgress = 0; // 0 = full dojo, 1 = full trading floor
        this.transitionDuration = 300; // frames for smooth transition (5 seconds at 60fps)
        this.transitionTimer = 0;
        
        // Market volatility system (for Trading Floor)
        this.marketState = 'normal'; // 'normal', 'crash', 'pump'
        this.volatilityTimer = 0;
        this.volatilityDuration = 0;
        this.baseGameSpeed = 1.5;
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        
        this.gameSpeed = 1.5;
        this.baseSpeed = 1.5; // consistent with debug defaults
        this.speedIncrease = 0.15; // consistent with debug defaults  
        this.speedInterval = 50; // consistent with debug defaults
        this.obstaclePoints = 5; // consistent with debug defaults
        this.distanceRate = 5; // consistent with debug defaults
        this.scoreMultiplier = 1.0; // consistent with debug defaults
        this.backgroundX = 0;
        
        this.animationId = null;
        this.lastTime = 0;
        
        this.deltaTime = 0;
        
        // Track key states for precise jumping
        this.keysPressed = new Set();
        
        this.setupCanvas();
        
        this.player = new Player(this);
        this.obstacleManager = new ObstacleManager(this);
        this.ui = new GameUI(this);
        
        // Audio system
        this.backgroundMusic = document.getElementById('backgroundMusic');
        this.isMusicPlaying = false;
        this.lastMusicUpdate = 0;
        this.isMuted = localStorage.getItem('katanaMuted') === 'true';
        
        this.setupEventListeners();
        this.setupUI();
        
        this.gameLoop = this.gameLoop.bind(this);
    }
    
    setupCanvas() {
        // Always use actual window dimensions for mobile
        if (window.innerWidth <= 768) {
            // Get actual viewport dimensions
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            
            // Set canvas resolution to match actual screen
            this.canvas.width = vw;
            this.canvas.height = vh;
            
            // Force CSS to fill entire screen
            this.canvas.style.width = vw + 'px';
            this.canvas.style.height = vh + 'px';
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.zIndex = '1';
            this.canvas.style.display = 'block';
            
            // Hide game header on mobile to use full screen
            const header = document.querySelector('.game-header');
            if (header) {
                header.style.position = 'absolute';
                header.style.top = '10px';
                header.style.left = '10px';
                header.style.right = '10px';
                header.style.zIndex = '100';
                header.style.background = 'rgba(16, 22, 49, 0.8)';
                header.style.borderRadius = '8px';
            }
            
            console.log('Mobile canvas setup:', this.canvas.width, 'x', this.canvas.height, 'viewport:', vw, 'x', vh);
        } else {
            // Desktop: Use container-based sizing
            const container = this.canvas.parentElement;
            const containerRect = container.getBoundingClientRect();
            
            this.canvas.width = 800;
            this.canvas.height = 600;
            
            const scale = Math.min(containerRect.width / 800, containerRect.height / 600);
            this.canvas.style.width = (800 * scale) + 'px';
            this.canvas.style.height = (600 * scale) + 'px';
            this.canvas.style.position = 'relative';
            this.canvas.style.zIndex = 'auto';
        }
        
        this.ctx.imageSmoothingEnabled = false;
        
        // Store canvas dimensions for game logic
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        
        // Single resize handler that works for both orientations
        const resizeHandler = () => {
            setTimeout(() => {
                this.setupCanvas();
                // Reset player position to prevent going off-screen
                if (this.player) {
                    this.player.reset();
                }
            }, 100);
        };
        
        window.addEventListener('resize', resizeHandler);
        window.addEventListener('orientationchange', resizeHandler);
    }
    
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        this.canvas.addEventListener('click', () => this.handleJump());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleJump();
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            this.playUISound();
            this.startGame();
        });
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.playUISound();
            this.restartGame();
        });
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.playUISound();
            this.showMenu();
        });
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.playUISound();
            this.resumeGame();
        });
        document.getElementById('pauseMenuBtn').addEventListener('click', () => {
            this.playUISound();
            this.showMenu();
        });
        document.getElementById('muteBtn').addEventListener('click', () => {
            this.toggleMute();
        });
        
    }
    
    setupUI() {
        document.getElementById('highScore').textContent = this.highScore;
        this.updateScore(0);
        this.updateMuteButton();
    }
    
    handleKeyDown(e) {
        const jumpKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        
        switch(e.code) {
            case 'Space':
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                e.preventDefault();
                // Only jump if key wasn't already pressed (prevents holding to spam jump)
                if (!this.keysPressed.has(e.code)) {
                    this.keysPressed.add(e.code);
                    this.handleJump();
                }
                break;
            case 'KeyP':
                // Pause functionality disabled during gameplay
                // if (this.gameState === 'playing') {
                //     this.pauseGame();
                // } else if (this.gameState === 'paused') {
                //     this.resumeGame();
                // }
                break;
            case 'Escape':
                // Menu access disabled during gameplay  
                // if (this.gameState === 'playing' || this.gameState === 'paused') {
                //     this.showMenu();
                // }
                break;
        }
    }
    
    handleKeyUp(e) {
        const jumpKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        
        if (jumpKeys.includes(e.code)) {
            this.keysPressed.delete(e.code);
        }
    }
    
    handleJump() {
        if (this.gameState === 'playing' && this.player) {
            this.player.jump();
        } else if (this.gameState === 'start') {
            this.startGame();
        } else if (this.gameState === 'gameOver') {
            this.restartGame();
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.gameSpeed = this.baseSpeed;
        this.backgroundX = 0;
        
        // Reset level state
        this.currentLevel = 1;
        this.hasReachedLevel2 = false;
        
        // Reset level transition
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionTimer = 0;
        
        // Reset market volatility
        this.marketState = 'normal';
        this.volatilityTimer = 0;
        this.volatilityDuration = 0;
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        
        // Reset background music speed
        if (this.backgroundMusic) {
            this.backgroundMusic.playbackRate = 1.0;
        }
        
        if (this.player && this.player.reset) {
            this.player.reset();
        }
        if (this.obstacleManager && this.obstacleManager.reset) {
            this.obstacleManager.reset();
        }
        
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        
        // Hide pause instructions during gameplay
        const instructions = document.querySelector('.instructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
        
        this.updateScore(0);
        this.startBackgroundMusic();
        
        // Always restart the game loop to ensure it starts
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.lastTime = 0;
        this.gameLoop();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
        this.pauseBackgroundMusic();
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
        this.resumeBackgroundMusic();
    }
    
    restartGame() {
        this.startGame();
    }
    
    showMenu() {
        this.gameState = 'start';
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        
        // Show pause instructions when back in menu
        const instructions = document.querySelector('.instructions');
        if (instructions) {
            instructions.style.display = 'block';
        }
        
        this.stopBackgroundMusic();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.stopBackgroundMusic();
        this.playGameOverSound();
        
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('katanaHighScore', this.highScore.toString());
            document.getElementById('scoreMessage').textContent = 'New High Score! Legendary!';
        } else if (this.score > this.highScore * 0.8) {
            document.getElementById('scoreMessage').textContent = 'Excellent performance!';
        } else if (this.score > this.highScore * 0.5) {
            document.getElementById('scoreMessage').textContent = 'Good run, samurai!';
        } else {
            document.getElementById('scoreMessage').textContent = 'Keep training, samurai!';
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.highScore;
        document.getElementById('highScore').textContent = this.highScore;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    updateScore(points) {
        const oldScore = this.score;
        // Apply score multiplier to points earned
        const multipliedPoints = Math.floor(points * this.scoreMultiplier);
        this.score += multipliedPoints;
        
        document.getElementById('current-score').textContent = this.score;
        
        if (this.ui && this.ui.updateScore) {
            this.ui.updateScore(this.score, true);
        }
        
        // Check for level progression
        if (!this.hasReachedLevel2 && this.score >= this.levelThreshold) {
            this.unlockLevel2();
        }
        
        if (this.score > 0 && this.score % this.speedInterval === 0 && oldScore % this.speedInterval !== 0) {
            this.gameSpeed += this.speedIncrease;
        }
    }
    
    update(deltaTime) {
        if (this.ui && this.ui.update) {
            this.ui.update(deltaTime);
        }
        
        // Update debug manager if available
        if (window.debugManager) {
            window.debugManager.updateLiveStats();
        }
        
        if (this.gameState !== 'playing') return;
        
        // Update level transition
        if (this.isTransitioning) {
            this.updateLevelTransition(deltaTime);
        }
        
        this.backgroundX -= this.gameSpeed;
        if (this.backgroundX <= -this.canvas.width) {
            this.backgroundX = 0;
        }
        
        if (this.player && this.player.update) {
            this.player.update(deltaTime);
        }
        if (this.obstacleManager && this.obstacleManager.update) {
            this.obstacleManager.update(deltaTime);
        }
        
        if (this.obstacleManager && this.player && this.obstacleManager.checkCollision) {
            if (this.obstacleManager.checkCollision(this.player)) {
                this.gameOver();
            }
        }
        
        if (Math.floor(performance.now() / 100) % this.distanceRate === 0) {
            this.updateScore(1);
        }
    }
    
    updateMarketVolatility(deltaTime) {
        const dt = deltaTime / 16;
        this.volatilityTimer += dt;
        
        // Trigger volatility events every 30-60 seconds
        const nextEventTime = 1800 + Math.random() * 1800; // 30-60 seconds at 60fps
        
        if (this.marketState === 'normal' && this.volatilityTimer >= nextEventTime) {
            // Trigger random market event
            const eventType = Math.random() < 0.5 ? 'crash' : 'pump';
            this.triggerMarketEvent(eventType);
            this.volatilityTimer = 0;
        }
        
        // Update current market state
        if (this.marketState !== 'normal') {
            this.volatilityDuration -= dt;
            
            if (this.marketState === 'crash') {
                // Screen shake and slowdown
                this.screenShake.intensity = 5 + Math.random() * 3;
                this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
                this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
                this.gameSpeed = this.baseSpeed * 0.7; // 30% slower
            } else if (this.marketState === 'pump') {
                // Speed boost and excitement
                this.gameSpeed = this.baseSpeed * 1.4; // 40% faster
                this.screenShake.intensity = 2 + Math.sin(this.volatilityTimer * 0.5) * 1;
                this.screenShake.x = Math.sin(this.volatilityTimer * 0.3) * this.screenShake.intensity;
                this.screenShake.y = Math.cos(this.volatilityTimer * 0.4) * this.screenShake.intensity;
            }
            
            // Return to normal when duration expires
            if (this.volatilityDuration <= 0) {
                this.marketState = 'normal';
                this.screenShake = { x: 0, y: 0, intensity: 0 };
                this.gameSpeed = this.baseSpeed;
            }
        }
    }
    
    triggerMarketEvent(eventType) {
        this.marketState = eventType;
        this.volatilityDuration = 180 + Math.random() * 120; // 3-5 seconds duration
        
        // Show notification
        if (this.ui && this.ui.addNotification) {
            if (eventType === 'crash') {
                this.ui.addNotification('MARKET CRASH!', 'market-crash', 1500);
            } else if (eventType === 'pump') {
                this.ui.addNotification('BULL RUN!', 'market-pump', 1500);
            }
        }
        
        console.log(`Market event triggered: ${eventType}`);
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            if (this.obstacleManager && this.obstacleManager.render) {
                this.obstacleManager.render(this.ctx);
            }
            if (this.player && this.player.render) {
                this.player.render(this.ctx);
            }
            
            if (this.gameState === 'paused') {
                this.drawPauseOverlay();
            }
        }
        
        if (this.ui && this.ui.render) {
            this.ui.render(this.ctx);
        }
    }
    
    drawBackground() {
        if (this.isTransitioning) {
            this.drawTransitionBackground();
        } else if (this.currentLevel === 2) {
            this.drawTradingFloorBackground();
        } else {
            this.drawDojoBackground();
        }
        
        this.drawScrollingBackground();
    }
    
    drawTransitionBackground() {
        // Blend between dojo and trading floor backgrounds
        const progress = this.easeInOutCubic(this.transitionProgress);
        
        // Draw dojo background
        this.drawDojoBackground();
        
        // Overlay trading floor background with increasing opacity
        this.ctx.save();
        this.ctx.globalAlpha = progress;
        this.drawTradingFloorBackground();
        this.ctx.restore();
    }
    
    drawDojoBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a2040');
        gradient.addColorStop(1, '#0f1420');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawTradingFloorBackground() {
        // Trading floor gradient with green/red tones
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a3d2e');
        gradient.addColorStop(0.3, '#0f1f18');
        gradient.addColorStop(0.7, '#1f0f18');
        gradient.addColorStop(1, '#3d1a2e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stock market chart pattern
        this.drawStockChartPattern();
    }
    
    drawStockChartPattern() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.15;
        this.ctx.strokeStyle = '#22c55e'; // Green for bull market
        this.ctx.lineWidth = 2;
        
        // Draw candlestick chart pattern in background
        const candleWidth = 20;
        const candleSpacing = 30;
        const chartStartY = this.canvas.height * 0.3;
        const chartHeight = this.canvas.height * 0.4;
        
        for (let x = -this.backgroundX % candleSpacing; x < this.canvas.width + candleSpacing; x += candleSpacing) {
            // Random candlestick data
            const seed = Math.floor((x + this.backgroundX) / candleSpacing);
            const random1 = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
            const random2 = (Math.sin(seed * 78.233) * 43758.5453) % 1;
            const random3 = (Math.sin(seed * 34.162) * 43758.5453) % 1;
            
            const high = chartStartY + Math.abs(random1) * chartHeight * 0.3;
            const low = chartStartY + chartHeight - Math.abs(random2) * chartHeight * 0.3;
            const open = high + (low - high) * Math.abs(random3);
            const close = high + (low - high) * Math.abs((random1 + random2) % 1);
            
            const isGreen = close > open;
            this.ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
            this.ctx.fillStyle = isGreen ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            
            // Draw candlestick wick
            this.ctx.beginPath();
            this.ctx.moveTo(x, high);
            this.ctx.lineTo(x, low);
            this.ctx.stroke();
            
            // Draw candlestick body
            const bodyTop = Math.min(open, close);
            const bodyHeight = Math.abs(close - open);
            this.ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
            this.ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
        }
        
        this.ctx.restore();
    }
    
    drawScrollingBackground() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        
        const lineSpacing = 50;
        const lineOffset = this.backgroundX % lineSpacing;
        
        if (this.isTransitioning) {
            // During transition, blend both grid styles
            const progress = this.easeInOutCubic(this.transitionProgress);
            
            // Draw dojo grid first
            this.ctx.strokeStyle = '#4bbbf0';
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = 0.3 * (1 - progress);
            
            for (let x = lineOffset; x < this.canvas.width + lineSpacing; x += lineSpacing) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
            
            for (let y = 0; y < this.canvas.height + lineSpacing; y += lineSpacing) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
            
            // Overlay trading floor grid
            this.ctx.globalAlpha = 0.3 * progress;
            
            // Draw horizontal lines with alternating colors
            for (let y = 0; y < this.canvas.height + lineSpacing; y += lineSpacing) {
                const isEven = Math.floor(y / lineSpacing) % 2 === 0;
                this.ctx.strokeStyle = isEven ? '#22c55e' : '#ef4444';
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
            
            // Vertical lines in neutral color
            this.ctx.strokeStyle = '#fbbf24';
            for (let x = lineOffset; x < this.canvas.width + lineSpacing; x += lineSpacing) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
        } else if (this.currentLevel === 2) {
            // Trading floor grid with neon green/red colors
            this.ctx.strokeStyle = '#22c55e';
            this.ctx.lineWidth = 1;
            
            // Draw horizontal lines with alternating colors
            for (let y = 0; y < this.canvas.height + lineSpacing; y += lineSpacing) {
                const isEven = Math.floor(y / lineSpacing) % 2 === 0;
                this.ctx.strokeStyle = isEven ? '#22c55e' : '#ef4444';
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
            
            // Vertical lines in neutral color
            this.ctx.strokeStyle = '#fbbf24';
            for (let x = lineOffset; x < this.canvas.width + lineSpacing; x += lineSpacing) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
        } else {
            // Original dojo grid
            this.ctx.strokeStyle = '#4bbbf0';
            this.ctx.lineWidth = 1;
            
            for (let x = lineOffset; x < this.canvas.width + lineSpacing; x += lineSpacing) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
            
            for (let y = 0; y < this.canvas.height + lineSpacing; y += lineSpacing) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }
    
    drawPauseOverlay() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(16, 22, 49, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(this.deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(this.gameLoop);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.stopBackgroundMusic();
    }
    
    // Background music controls
    startBackgroundMusic() {
        if (this.isMuted) return;
        if (this.backgroundMusic && this.backgroundMusic.play) {
            this.backgroundMusic.volume = 0.3; // Keep music at lower volume
            this.backgroundMusic.playbackRate = 1.0; // Will be updated during transition
            this.backgroundMusic.play().catch(e => {
                // Audio play failed, which is fine (autoplay restrictions)
                console.log('Background music autoplay blocked');
            });
            this.isMusicPlaying = true;
        }
    }
    
    pauseBackgroundMusic() {
        if (this.backgroundMusic && this.isMusicPlaying) {
            this.backgroundMusic.pause();
        }
    }
    
    resumeBackgroundMusic() {
        if (this.isMuted) return;
        if (this.backgroundMusic && this.isMusicPlaying) {
            this.backgroundMusic.play().catch(e => {
                // Audio play failed, which is fine
            });
        }
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.isMusicPlaying = false;
        }
    }
    
    // UI sound effects
    playUISound() {
        if (this.isMuted) return;
        const uiSound = document.getElementById('uiSound');
        if (uiSound && uiSound.play) {
            uiSound.currentTime = 0;
            uiSound.play().catch(e => {
                // Audio play failed, which is fine
            });
        }
    }
    
    playSettingsSound() {
        if (this.isMuted) return;
        const settingsSound = document.getElementById('settingsSound');
        if (settingsSound && settingsSound.play) {
            settingsSound.currentTime = 0;
            settingsSound.play().catch(e => {
                // Audio play failed, which is fine
            });
        }
    }
    
    playGameOverSound() {
        if (this.isMuted) return;
        const gameOverSound = document.getElementById('gameOverSound');
        if (gameOverSound && gameOverSound.play) {
            gameOverSound.currentTime = 0;
            gameOverSound.play().catch(e => {
                // Audio play failed, which is fine
            });
        }
    }

    // Mute functionality
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('katanaMuted', this.isMuted.toString());
        
        if (this.isMuted) {
            this.pauseBackgroundMusic();
        } else if (this.gameState === 'playing') {
            this.resumeBackgroundMusic();
        }
        
        this.updateMuteButton();
    }

    updateMuteButton() {
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            if (this.isMuted) {
                muteBtn.textContent = '🔇';
                muteBtn.classList.add('muted');
            } else {
                muteBtn.textContent = '🔊';
                muteBtn.classList.remove('muted');
            }
        }
    }
    
    // Level system methods
    unlockLevel2() {
        this.hasReachedLevel2 = true;
        
        // Show level transition notification
        if (this.ui && this.ui.addNotification) {
            this.ui.addNotification('TRADING FLOOR UNLOCKED!', 'level-unlock', 2000);
        }
        
        // Start gradual transition instead of immediate change
        this.isTransitioning = true;
        this.transitionTimer = 0;
        this.transitionProgress = 0;
        
        console.log('Level 2 transition started: Trading Floor');
    }
    
    updateLevelTransition(deltaTime) {
        const dt = deltaTime / 16;
        this.transitionTimer += dt;
        
        // Calculate transition progress (0 to 1)
        this.transitionProgress = Math.min(this.transitionTimer / this.transitionDuration, 1);
        
        // Use easing function for smoother transition
        const easedProgress = this.easeInOutCubic(this.transitionProgress);
        
        // Update music speed gradually with iOS compatibility
        if (this.backgroundMusic && this.isMusicPlaying) {
            const targetSpeed = 1.0 + (0.25 * easedProgress); // 1.0 to 1.25
            
            // iOS-friendly approach: use discrete steps to prevent audio skipping
            const isIOS = this.detectiOS();
            if (isIOS) {
                // For iOS: Use discrete speed steps to avoid audio glitches
                if (!this.lastMusicUpdate || Date.now() - this.lastMusicUpdate > 200) {
                    this.lastMusicUpdate = Date.now();
                    
                    // Use discrete speed levels instead of smooth transitions
                    let discreteSpeed = 1.0;
                    if (easedProgress >= 0.8) {
                        discreteSpeed = 1.25;
                    } else if (easedProgress >= 0.6) {
                        discreteSpeed = 1.20;
                    } else if (easedProgress >= 0.4) {
                        discreteSpeed = 1.15;
                    } else if (easedProgress >= 0.2) {
                        discreteSpeed = 1.10;
                    } else if (easedProgress >= 0.1) {
                        discreteSpeed = 1.05;
                    }
                    
                    // Only update if the discrete speed has actually changed
                    const currentSpeed = Math.round(this.backgroundMusic.playbackRate * 100) / 100;
                    if (currentSpeed !== discreteSpeed) {
                        try {
                            this.backgroundMusic.playbackRate = discreteSpeed;
                        } catch (error) {
                            console.log('iOS playbackRate adjustment failed:', error);
                        }
                    }
                }
            } else {
                // Android and desktop: use normal smooth approach
                try {
                    this.backgroundMusic.playbackRate = targetSpeed;
                } catch (error) {
                    console.log('PlaybackRate adjustment failed:', error);
                }
            }
        }
        
        // Complete transition
        if (this.transitionProgress >= 1) {
            this.isTransitioning = false;
            this.currentLevel = 2;
            this.transitionProgress = 1;
            
            // Update obstacle manager for new level
            if (this.obstacleManager && this.obstacleManager.setLevel) {
                this.obstacleManager.setLevel(2);
            }
            
            console.log('Level 2 transition completed');
        }
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    detectiOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    // Apply default settings to ensure consistency between local and remote environments
    applyDefaultSettings() {
        // These defaults match the debug system's defaults to ensure consistent gameplay
        const defaultSettings = {
            // Player Physics
            gravity: 0.5,
            jumpForce: 10, // applied as negative
            maxFallSpeed: 8,
            
            // Obstacles  
            spawnDelay: 150,
            minGap: 200,
            maxGap: 280,
            obstacleWidth: 50,
            horizontalSpacing: 120,
            
            // Game Speed
            baseSpeed: 1.5,
            speedIncrease: 0.15,
            speedInterval: 50,
            
            // Scoring
            obstaclePoints: 5,
            distanceRate: 5,
            scoreMultiplier: 1.0,
            
            // Turtle Tokens
            apySpawnRate: 10
        };
        
        // Apply player physics settings
        if (this.player) {
            this.player.gravity = defaultSettings.gravity;
            this.player.jumpForce = -defaultSettings.jumpForce;
            this.player.maxFallSpeed = defaultSettings.maxFallSpeed;
        }
        
        // Apply obstacle settings
        if (this.obstacleManager) {
            this.obstacleManager.spawnDelay = defaultSettings.spawnDelay;
            this.obstacleManager.minGap = defaultSettings.minGap;
            this.obstacleManager.maxGap = defaultSettings.maxGap;
            this.obstacleManager.baseObstacleWidth = defaultSettings.obstacleWidth;
            this.obstacleManager.minHorizontalSpacing = defaultSettings.horizontalSpacing;
            this.obstacleManager.turtleSpawnRate = defaultSettings.apySpawnRate;
        }
        
        // Apply game speed settings
        this.baseSpeed = defaultSettings.baseSpeed;
        this.speedIncrease = defaultSettings.speedIncrease;
        this.speedInterval = defaultSettings.speedInterval;
        
        // Apply scoring settings
        this.obstaclePoints = defaultSettings.obstaclePoints;
        this.distanceRate = defaultSettings.distanceRate;
        this.scoreMultiplier = defaultSettings.scoreMultiplier;
        
        console.log('Applied default settings for consistent gameplay across all environments');
    }
}

let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new KatanaGame();
    window.game = game; // Make game available globally for debug manager
    
    // Initialize debug manager after game is ready with retry
    const initDebugManager = () => {
        console.log('Attempting to initialize debug manager...');
        console.log('DebugManager available?', typeof DebugManager !== 'undefined');
        console.log('Game object:', !!game);
        
        if (typeof DebugManager !== 'undefined') {
            try {
                console.log('Creating new DebugManager instance...');
                window.debugManager = new DebugManager(game);
                console.log('Debug manager initialized successfully');
            } catch (error) {
                console.error('Failed to initialize debug manager:', error);
                console.error('Error stack:', error.stack);
                // Retry once after a longer delay
                setTimeout(() => {
                    try {
                        console.log('Retrying debug manager initialization...');
                        window.debugManager = new DebugManager(game);
                        console.log('Debug manager initialized on retry');
                    } catch (retryError) {
                        console.error('Debug manager retry failed:', retryError);
                        console.error('Retry error stack:', retryError.stack);
                        // If debug manager fails to initialize, ensure defaults are still applied
                        game.applyDefaultSettings();
                    }
                }, 500);
            }
        } else {
            console.log('DebugManager class not found - applying default settings for consistent gameplay');
            // If debug manager is not available (production), apply default settings
            game.applyDefaultSettings();
        }
    };
    
    setTimeout(initDebugManager, 200);
});