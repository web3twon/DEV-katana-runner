class GameUI {
    constructor(game) {
        this.game = game;
        
        this.scoreAnimations = [];
        this.notifications = [];
        this.floatingTexts = [];
        
        this.setupEventListeners();
        this.initializeUI();
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    initializeUI() {
        this.updateHighScore();
        this.showStartScreen();
    }
    
    updateHighScore() {
        const highScoreElements = document.querySelectorAll('#highScore');
        highScoreElements.forEach(element => {
            element.textContent = this.game.highScore;
        });
    }
    
    updateScore(newScore, animate = false) {
        const scoreElement = document.getElementById('current-score');
        
        if (animate && newScore > parseInt(scoreElement.textContent)) {
            this.animateScoreIncrease(scoreElement, parseInt(scoreElement.textContent), newScore);
        } else {
            scoreElement.textContent = newScore;
        }
        
        if (newScore > 0 && newScore % 500 === 0) {
            this.showScoreMilestone(newScore);
        }
        
        if (newScore % 25 === 0 && newScore > 0) {
            this.createScoreParticles();
        }
    }
    
    animateScoreIncrease(element, from, to) {
        const duration = 300;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentScore = Math.floor(from + (to - from) * easeOut);
            
            element.textContent = currentScore;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    showScoreMilestone(score) {
        this.addNotification(`${score} Points!`, 'milestone');
    }
    
    addNotification(text, type = 'default', duration = 1000) {
        const notification = {
            text,
            type,
            life: duration,
            maxLife: duration,
            y: 100,
            alpha: 1,
            scale: 1
        };
        
        this.notifications.push(notification);
    }
    
    createScoreParticles() {
        const canvas = this.game.canvas;
        const scoreElement = document.getElementById('current-score');
        const rect = scoreElement.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        const particleX = rect.left - canvasRect.left + rect.width / 2;
        const particleY = rect.top - canvasRect.top + rect.height / 2;
        
        for (let i = 0; i < 5; i++) {
            this.scoreAnimations.push({
                x: particleX + (Math.random() - 0.5) * 20,
                y: particleY,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 1,
                life: 60,
                maxLife: 60,
                alpha: 1,
                color: '#f6ff0d',
                size: Math.random() * 3 + 2
            });
        }
    }
    
    showStartScreen() {
        this.hideAllScreens();
        document.getElementById('startScreen').classList.remove('hidden');
        
        this.updateHighScore();
    }
    
    showGameOverScreen(finalScore, isNewHighScore = false) {
        this.hideAllScreens();
        
        document.getElementById('finalScore').textContent = finalScore;
        document.getElementById('bestScore').textContent = this.game.highScore;
        
        const messageElement = document.getElementById('scoreMessage');
        if (isNewHighScore) {
            messageElement.textContent = 'New High Score! Legendary!';
            messageElement.style.color = '#f6ff0d';
        } else if (finalScore > this.game.highScore * 0.8) {
            messageElement.textContent = 'Excellent performance!';
            messageElement.style.color = '#4bbbf0';
        } else if (finalScore > this.game.highScore * 0.5) {
            messageElement.textContent = 'Good run, samurai!';
            messageElement.style.color = '#4bbbf0';
        } else {
            messageElement.textContent = 'Keep training, samurai!';
            messageElement.style.color = '#4bbbf0';
        }
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        this.updateHighScore();
        
        this.playGameOverSound();
    }
    
    showPauseScreen() {
        document.getElementById('pauseScreen').classList.remove('hidden');
    }
    
    hidePauseScreen() {
        document.getElementById('pauseScreen').classList.add('hidden');
    }
    
    hideAllScreens() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
    }
    
    handleResize() {
        // Handle responsive UI adjustments if needed
        this.game.setupCanvas();
    }
    
    update(deltaTime) {
        const dt = deltaTime / 16;
        
        // Update score animations
        for (let i = this.scoreAnimations.length - 1; i >= 0; i--) {
            const particle = this.scoreAnimations[i];
            
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vy += 0.2 * dt;
            particle.life -= dt;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.scoreAnimations.splice(i, 1);
            }
        }
        
        // Update notifications
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            
            notification.life -= dt;
            notification.alpha = Math.min(1, notification.life / (notification.maxLife * 0.3));
            notification.y -= 0.5 * dt;
            
            if (notification.life <= 0) {
                this.notifications.splice(i, 1);
            }
        }
        
        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            
            text.y += text.vy * dt;
            text.life -= dt;
            text.alpha = text.life / text.maxLife;
            
            if (text.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        this.renderScoreAnimations(ctx);
        this.renderNotifications(ctx);
        this.renderFloatingTexts(ctx);
        
        if (this.game.gameState === 'playing') {
            this.renderGameplayUI(ctx);
        }
    }
    
    renderScoreAnimations(ctx) {
        ctx.save();
        
        this.scoreAnimations.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    renderNotifications(ctx) {
        ctx.save();
        
        this.notifications.forEach((notification, index) => {
            ctx.globalAlpha = notification.alpha;
            
            // Choose color based on notification type
            let fillStyle = '#4bbbf0';
            if (notification.type === 'milestone') fillStyle = '#f6ff0d';
            if (notification.type === 'level-unlock') fillStyle = '#ff6b9d';
            
            ctx.fillStyle = fillStyle;
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const x = ctx.canvas.width / 2;
            const y = notification.y + index * 40;
            
            // Add text shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText(notification.text, x, y);
            
            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        });
        
        ctx.restore();
    }
    
    renderFloatingTexts(ctx) {
        ctx.save();
        
        this.floatingTexts.forEach(text => {
            ctx.globalAlpha = text.alpha;
            ctx.fillStyle = text.color;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Add text shadow for better visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillText(text.text, text.x, text.y);
            
            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        });
        
        ctx.restore();
    }
    
    renderGameplayUI(ctx) {
        // Additional gameplay UI elements can be added here
        this.renderSpeedIndicator(ctx);
        this.renderLevelInfo(ctx);
    }
    
    renderSpeedIndicator(ctx) {
        const speed = this.game.gameSpeed;
        const maxDisplaySpeed = 10;
        const speedRatio = Math.min(speed / maxDisplaySpeed, 1);
        
        ctx.save();
        
        // Speed bar background - responsive positioning for desktop/mobile
        const barWidth = 100;
        const barHeight = 8;
        const barX = ctx.canvas.width - barWidth - 20;
        // Adjust position based on canvas dimensions to work for both desktop and mobile
        // Force desktop positioning - if canvas is standard desktop size (800x600 or larger)
        const isDesktop = ctx.canvas.width >= 800 && ctx.canvas.height >= 600;
        const barY = isDesktop ? 90 : 65; // Good desktop offset with clear gap
        
        ctx.fillStyle = 'rgba(16, 22, 49, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Speed bar fill
        const fillColor = speedRatio > 0.8 ? '#ff4757' : speedRatio > 0.5 ? '#f6ff0d' : '#4bbbf0';
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, barY, barWidth * speedRatio, barHeight);
        
        // Speed bar border
        ctx.strokeStyle = '#4bbbf0';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Speed label
        ctx.fillStyle = '#4bbbf0';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('SPEED', barX + barWidth, barY + barHeight + 15);
        
        ctx.restore();
    }
    
    renderLevelInfo(ctx) {
        ctx.save();
        
        // Responsive positioning for proper visibility on desktop and mobile
        // Force desktop positioning - if canvas is standard desktop size (800x600 or larger)
        const isDesktop = ctx.canvas.width >= 800 && ctx.canvas.height >= 600;
        const levelY = isDesktop ? 90 : 65; // Good desktop offset with clear gap
        const unlockY = isDesktop ? 110 : 85;
        
        // Current level indicator
        ctx.fillStyle = '#4bbbf0';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const levelText = this.game.currentLevel === 1 ? 'LEVEL 1: DOJO' : 'LEVEL 2: TRADING FLOOR';
        ctx.fillText(levelText, 20, levelY);
        
        // Show unlock requirement text only if level 1 and not unlocked yet
        if (this.game.currentLevel === 1 && !this.game.hasReachedLevel2) {
            const remaining = this.game.levelThreshold - this.game.score;
            if (remaining > 0) {
                ctx.fillStyle = '#f6ff0d';
                ctx.font = '12px monospace';
                const unlockText = `Reach score ${this.game.levelThreshold} to unlock Trading Floor!`;
                ctx.fillText(unlockText, 20, unlockY);
            }
        }
        
        ctx.restore();
    }
    
    playGameOverSound() {
        if (this.game.isMuted) return;
        const gameOverSound = document.getElementById('gameOverSound');
        if (gameOverSound && gameOverSound.play) {
            gameOverSound.currentTime = 0;
            gameOverSound.play().catch(e => {
                // Audio play failed, which is fine
            });
        }
    }
    
    // Utility methods for game state management
    getGameStats() {
        return {
            currentScore: this.game.score,
            highScore: this.game.highScore,
            gameSpeed: this.game.gameSpeed,
            gameState: this.game.gameState
        };
    }
    
    formatScore(score) {
        return score.toString().padStart(6, '0');
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}