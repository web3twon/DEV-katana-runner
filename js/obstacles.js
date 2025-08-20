class Obstacle {
    constructor(x, y, width, height, type = 'default') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.passed = false;
        
        this.animation = {
            frameCount: 0,
            glowIntensity: 0.5
        };
        
        // Candlestick specific properties
        if (type === 'candlestick_green' || type === 'candlestick_red') {
            this.originalHeight = height;
            this.baseHeight = height;
            this.baseY = y; // Store original Y position for stable expansion
            this.expansionCycle = Math.random() * Math.PI * 2; // Random starting phase
            this.expansionRate = 0.015 + Math.random() * 0.005; // Slower expansion/contraction
            this.maxExpansion = 0.25; // 25% expansion (reduced from 50% for safety)
            this.isGreen = type === 'candlestick_green';
        }
    }
    
    update(speed, deltaTime) {
        const dt = deltaTime / 16;
        this.x -= speed * dt;
        this.animation.frameCount += dt;
        this.animation.glowIntensity = 0.5 + Math.sin(this.animation.frameCount * 0.1) * 0.3;
        
        // Update candlestick expansion/contraction with stable frame-rate independent animation
        if (this.type === 'candlestick_green' || this.type === 'candlestick_red') {
            // Use time-based animation instead of frame-based to prevent glitching
            this.expansionCycle += this.expansionRate * dt;
            
            // Clamp expansion cycle to prevent floating point drift
            if (this.expansionCycle > Math.PI * 2) {
                this.expansionCycle -= Math.PI * 2;
            }
            
            const expansionFactor = 1 + (Math.sin(this.expansionCycle) * this.maxExpansion);
            
            if (this.isGreen) {
                // Green candlesticks expand upward - calculate from base position
                const targetHeight = this.baseHeight * expansionFactor;
                const heightChange = targetHeight - this.baseHeight;
                
                // Set position relative to base to prevent drift
                this.height = targetHeight;
                this.y = this.baseY - heightChange;
            } else {
                // Red candlesticks expand downward from base position
                this.height = this.baseHeight * expansionFactor;
                this.y = this.baseY; // Keep base Y stable
            }
        }
    }
    
    render(ctx) {
        ctx.save();
        
        switch(this.type) {
            case 'pillar':
                this.renderPillar(ctx);
                break;
            case 'defi_node':
                this.renderDefiNode(ctx);
                break;
            case 'liquidation_wall':
                this.renderLiquidationWall(ctx);
                break;
            case 'candlestick_green':
                this.renderCandlestickGreen(ctx);
                break;
            case 'candlestick_red':
                this.renderCandlestickRed(ctx);
                break;
            default:
                this.renderDefault(ctx);
        }
        
        ctx.restore();
    }
    
    renderPillar(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#101631');
        gradient.addColorStop(0.5, '#1a2040');
        gradient.addColorStop(1, '#101631');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = `rgba(75, 187, 240, ${this.animation.glowIntensity})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        const lineSpacing = 20;
        ctx.strokeStyle = `rgba(246, 255, 13, 0.3)`;
        ctx.lineWidth = 1;
        for (let i = this.y + lineSpacing; i < this.y + this.height; i += lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(this.x + 5, i);
            ctx.lineTo(this.x + this.width - 5, i);
            ctx.stroke();
        }
    }
    
    renderDefiNode(ctx) {
        // Create a high-tech DeFi node with circuit pattern
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height / 2, 0,
            this.x + this.width / 2, this.y + this.height / 2, this.width / 2
        );
        gradient.addColorStop(0, '#4bbbf0');
        gradient.addColorStop(0.7, '#1a2040');
        gradient.addColorStop(1, '#101631');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw circuit lines
        ctx.strokeStyle = `rgba(246, 255, 13, ${this.animation.glowIntensity})`;
        ctx.lineWidth = 2;
        
        // Horizontal circuit lines
        const lineCount = Math.floor(this.height / 15);
        for (let i = 0; i < lineCount; i++) {
            const y = this.y + 10 + i * 15;
            ctx.beginPath();
            ctx.moveTo(this.x + 5, y);
            ctx.lineTo(this.x + this.width - 5, y);
            ctx.stroke();
            
            // Add small nodes on lines
            ctx.fillStyle = '#f6ff0d';
            ctx.fillRect(this.x + 10 + (i % 3) * 10, y - 1, 3, 3);
            ctx.fillRect(this.x + this.width - 15 - (i % 2) * 8, y - 1, 3, 3);
        }
        
        // Outer border
        ctx.strokeStyle = '#4bbbf0';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Center label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MEV BOT', this.x + this.width / 2, this.y + this.height / 2);
    }
    
    renderLiquidationWall(ctx) {
        // Create animated gradient background with pulsing effect
        const pulseIntensity = 0.3 + Math.sin(this.animation.frameCount * 0.15) * 0.2;
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, `rgba(139, 34, 47, ${0.9 * pulseIntensity})`);
        gradient.addColorStop(0.3, `rgba(255, 71, 87, ${pulseIntensity})`);
        gradient.addColorStop(0.7, `rgba(255, 71, 87, ${1.0 * pulseIntensity})`);
        gradient.addColorStop(1, `rgba(139, 34, 47, ${0.9 * pulseIntensity})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add animated warning stripes with clipping
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.clip();
        
        ctx.strokeStyle = `rgba(255, 255, 0, ${this.animation.glowIntensity})`;
        ctx.lineWidth = 2;
        const stripeSpacing = 15;
        const stripeOffset = (this.animation.frameCount * 0.5) % (stripeSpacing * 2);
        
        for (let i = -stripeSpacing; i < this.height + stripeSpacing; i += stripeSpacing) {
            const y = this.y + i + stripeOffset;
            if (y >= this.y - stripeSpacing && y <= this.y + this.height + stripeSpacing) {
                ctx.beginPath();
                ctx.moveTo(this.x, y);
                ctx.lineTo(this.x + this.width, y - this.width * 0.3);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(this.x, y + 3);
                ctx.lineTo(this.x + this.width, y - this.width * 0.3 + 3);
                ctx.stroke();
            }
        }
        
        ctx.restore();
        
        // Add danger border with glow effect
        ctx.shadowColor = '#ff4757';
        ctx.shadowBlur = 10 * this.animation.glowIntensity;
        ctx.strokeStyle = `rgba(255, 71, 87, ${this.animation.glowIntensity})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Add inner warning pattern
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 200, 200, ${0.4 + this.animation.glowIntensity * 0.3})`;
        ctx.lineWidth = 1;
        
        // Vertical warning lines
        const lineCount = Math.floor(this.width / 8);
        for (let i = 1; i < lineCount; i++) {
            const x = this.x + (i * this.width) / lineCount;
            ctx.beginPath();
            ctx.moveTo(x, this.y + 5);
            ctx.lineTo(x, this.y + this.height - 5);
            ctx.stroke();
        }
        
        // Add crackling energy effect at edges
        ctx.strokeStyle = `rgba(255, 255, 100, ${this.animation.glowIntensity})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const sparkY = this.y + Math.random() * this.height;
            const sparkSize = 3 + Math.random() * 4;
            
            ctx.beginPath();
            ctx.moveTo(this.x - sparkSize, sparkY);
            ctx.lineTo(this.x + sparkSize, sparkY);
            ctx.moveTo(this.x, sparkY - sparkSize);
            ctx.lineTo(this.x, sparkY + sparkSize);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - sparkSize, sparkY);
            ctx.lineTo(this.x + this.width + sparkSize, sparkY);
            ctx.moveTo(this.x + this.width, sparkY - sparkSize);
            ctx.lineTo(this.x + this.width, sparkY + sparkSize);
            ctx.stroke();
        }
        
        // Center label with glow
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LIQUIDATION', this.x + this.width / 2, this.y + this.height / 2);
        ctx.shadowBlur = 0;
    }
    
    renderCandlestickGreen(ctx) {
        // Green candlestick (bull market) - expands upward
        const baseGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        baseGradient.addColorStop(0, '#10b981');
        baseGradient.addColorStop(0.2, '#22c55e');
        baseGradient.addColorStop(0.5, '#16a34a');
        baseGradient.addColorStop(0.8, '#15803d');
        baseGradient.addColorStop(1, '#14532d');
        
        ctx.fillStyle = baseGradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add multiple glow layers for depth
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 15 * this.animation.glowIntensity;
        ctx.strokeStyle = `rgba(16, 185, 129, ${this.animation.glowIntensity * 0.8})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Inner bright border
        ctx.shadowBlur = 5;
        ctx.strokeStyle = `rgba(34, 197, 94, ${this.animation.glowIntensity})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
        ctx.shadowBlur = 0;
        
        // Animated energy lines running vertically
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + this.animation.glowIntensity * 0.4})`;
        ctx.lineWidth = 2;
        const lineCount = Math.floor(this.width / 8);
        for (let i = 0; i < lineCount; i++) {
            const x = this.x + (i + 1) * (this.width / (lineCount + 1));
            const offsetY = Math.sin(this.animation.frameCount * 0.1 + i) * 10;
            ctx.beginPath();
            ctx.moveTo(x, this.y + 10 + offsetY);
            ctx.lineTo(x, this.y + this.height - 10 + offsetY);
            ctx.stroke();
        }
        
        // Sparkle effects at expansion edges
        const expansionLevel = Math.sin(this.expansionCycle) * 0.5 + 0.5;
        for (let i = 0; i < 8; i++) {
            const sparkleX = this.x + Math.random() * this.width;
            const sparkleY = this.y + Math.random() * 20;
            ctx.fillStyle = `rgba(255, 255, 255, ${expansionLevel * 0.8})`;
            ctx.fillRect(sparkleX - 1, sparkleY - 1, 2, 2);
        }
        
        // Remove bull/bear text for cleaner look
        ctx.shadowBlur = 0;
        
        // Price ticker animation
        const tickerY = this.y + 20;
        ctx.fillStyle = `rgba(16, 185, 129, ${this.animation.glowIntensity})`;
        ctx.font = '8px monospace';
        ctx.fillText('↗ +$', this.x + this.width / 2, tickerY);
    }
    
    renderCandlestickRed(ctx) {
        // Red candlestick (bear market) - expands downward
        const baseGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        baseGradient.addColorStop(0, '#fca5a5');
        baseGradient.addColorStop(0.2, '#f87171');
        baseGradient.addColorStop(0.5, '#ef4444');
        baseGradient.addColorStop(0.8, '#dc2626');
        baseGradient.addColorStop(1, '#991b1b');
        
        ctx.fillStyle = baseGradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add multiple glow layers for depth
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15 * this.animation.glowIntensity;
        ctx.strokeStyle = `rgba(220, 38, 38, ${this.animation.glowIntensity * 0.8})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Inner bright border
        ctx.shadowBlur = 5;
        ctx.strokeStyle = `rgba(239, 68, 68, ${this.animation.glowIntensity})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
        ctx.shadowBlur = 0;
        
        // Animated energy lines running vertically (downward flowing)
        ctx.strokeStyle = `rgba(255, 200, 200, ${0.3 + this.animation.glowIntensity * 0.4})`;
        ctx.lineWidth = 2;
        const lineCount = Math.floor(this.width / 8);
        for (let i = 0; i < lineCount; i++) {
            const x = this.x + (i + 1) * (this.width / (lineCount + 1));
            const offsetY = Math.sin(this.animation.frameCount * 0.1 + i + Math.PI) * 10;
            ctx.beginPath();
            ctx.moveTo(x, this.y + 10 + offsetY);
            ctx.lineTo(x, this.y + this.height - 10 + offsetY);
            ctx.stroke();
        }
        
        // Warning sparkles at expansion edges
        const expansionLevel = Math.sin(this.expansionCycle) * 0.5 + 0.5;
        for (let i = 0; i < 8; i++) {
            const sparkleX = this.x + Math.random() * this.width;
            const sparkleY = this.y + this.height - Math.random() * 20;
            ctx.fillStyle = `rgba(255, 150, 150, ${expansionLevel * 0.8})`;
            ctx.fillRect(sparkleX - 1, sparkleY - 1, 2, 2);
        }
        
        // Remove bull/bear text for cleaner look
        ctx.shadowBlur = 0;
        
        // Price ticker animation
        const tickerY = this.y + this.height - 20;
        ctx.fillStyle = `rgba(220, 38, 38, ${this.animation.glowIntensity})`;
        ctx.font = '8px monospace';
        ctx.fillText('↘ -$', this.x + this.width / 2, tickerY);
    }
    
    renderDefault(ctx) {
        ctx.fillStyle = '#4bbbf0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = '#f6ff0d';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
}

class TurtleToken {
    constructor(x, y, level = 1) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.width = 30;
        this.height = 30;
        this.collected = false;
        this.level = level;
        this.animation = {
            frameCount: 0,
            floatOffset: 0,
            glowIntensity: 0.5,
            rotation: 0
        };
        
        // Fixed values: 100 for level 1, 500 for level 2
        this.value = level === 2 ? 500 : 100;
        
        // Load turtle image
        this.turtleImage = new Image();
        this.imageLoaded = false;
        this.turtleImage.onload = () => {
            this.imageLoaded = true;
        };
        this.turtleImage.onerror = () => {
            this.imageLoaded = false;
        };
        this.turtleImage.src = './images/turtle.png';
    }
    
    update(speed, deltaTime) {
        const dt = deltaTime / 16;
        this.x -= speed * dt;
        this.animation.frameCount += dt;
        this.animation.floatOffset = Math.sin(this.animation.frameCount * 0.08) * 8;
        this.animation.glowIntensity = 0.5 + Math.sin(this.animation.frameCount * 0.12) * 0.4;
        this.animation.rotation += dt * 0.02;
        this.y = this.baseY + this.animation.floatOffset;
    }
    
    render(ctx) {
        if (this.collected) return;
        
        ctx.save();
        
        // Draw glow effect - gold for level 2, blue for level 1
        ctx.shadowColor = this.level === 2 ? '#ffd700' : '#4bbbf0';
        ctx.shadowBlur = 15 * this.animation.glowIntensity;
        
        // Rotate around center
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.animation.rotation);
        
        if (this.imageLoaded) {
            // Draw turtle image
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                this.turtleImage,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // Fallback: Draw simple circle - gold for level 2, blue for level 1
            ctx.fillStyle = this.level === 2 ? '#ffd700' : '#4bbbf0';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Turtle text
            ctx.fillStyle = '#101631';
            ctx.font = 'bold 6px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐢', 0, 0);
        }
        
        ctx.restore();
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
}

class StockCertificate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.width = 35;
        this.height = 25;
        this.collected = false;
        this.animation = {
            frameCount: 0,
            floatOffset: 0,
            glowIntensity: 0.5,
            rotation: 0,
            sparkles: []
        };
        this.value = 75 + Math.floor(Math.random() * 125); // 75-200 bonus points
        
        // Initialize sparkle effects
        for (let i = 0; i < 6; i++) {
            this.animation.sparkles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                phase: Math.random() * Math.PI * 2,
                speed: 0.05 + Math.random() * 0.03
            });
        }
    }
    
    update(speed, deltaTime) {
        const dt = deltaTime / 16;
        this.x -= speed * dt;
        this.animation.frameCount += dt;
        this.animation.floatOffset = Math.sin(this.animation.frameCount * 0.06) * 12;
        this.animation.glowIntensity = 0.6 + Math.sin(this.animation.frameCount * 0.1) * 0.4;
        this.animation.rotation += dt * 0.015;
        this.y = this.baseY + this.animation.floatOffset;
        
        // Update sparkles
        this.animation.sparkles.forEach(sparkle => {
            sparkle.phase += sparkle.speed * dt;
        });
    }
    
    render(ctx) {
        if (this.collected) return;
        
        ctx.save();
        
        // Draw glow effect
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 20 * this.animation.glowIntensity;
        
        // Rotate around center
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.animation.rotation);
        
        // Draw stock certificate background
        const gradient = ctx.createLinearGradient(-this.width/2, -this.height/2, this.width/2, this.height/2);
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(0.3, '#f59e0b');
        gradient.addColorStop(0.7, '#d97706');
        gradient.addColorStop(1, '#92400e');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw inner decorative border
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.width/2 + 2, -this.height/2 + 2, this.width - 4, this.height - 4);
        
        // Draw dollar sign
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
        
        // Draw sparkles
        this.animation.sparkles.forEach(sparkle => {
            const sparkleAlpha = (Math.sin(sparkle.phase) + 1) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha * 0.8})`;
            const sparkleX = sparkle.x - this.width/2;
            const sparkleY = sparkle.y - this.height/2;
            ctx.fillRect(sparkleX - 1, sparkleY - 1, 2, 2);
        });
        
        ctx.restore();
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
}

class ObstacleManager {
    constructor(game) {
        this.game = game;
        this.obstacles = [];
        this.turtleTokens = [];
        this.stockCertificates = [];
        this.spawnTimer = 0;
        this.bonusSpawnTimer = 0;
        this.spawnDelay = 150; // frames between spawns - consistent with debug defaults
        this.bonusSpawnDelay = 120; // frames between bonus spawns (frequent spawning)
        this.minGap = 200; // consistent with debug defaults
        this.maxGap = 280; // consistent with debug defaults
        this.baseObstacleWidth = 50; // consistent with debug defaults
        this.minHorizontalSpacing = 120; // consistent with debug defaults
        
        // Obstacle-type-specific spacing multipliers
        this.obstacleSpacingMultipliers = {
            'pillar': 1.0,
            'defi_node': 1.0,
            'liquidation_wall': 1.5,  // Extra spacing for wide liquidation walls
            'candlestick_green': 1.6,  // Moderately increased spacing for expanding candlesticks
            'candlestick_red': 1.6     // Moderately increased spacing for expanding candlesticks
        };
        this.safeZoneHeight = 80; // Guaranteed passable area height
        
        // Level-specific obstacle types
        this.level1ObstacleTypes = ['pillar', 'defi_node', 'liquidation_wall'];
        this.level2ObstacleTypes = ['candlestick_green', 'candlestick_red'];
        this.obstacleTypes = this.level1ObstacleTypes; // Start with level 1
        this.currentLevel = 1;
        this.difficultyRamp = 0;
        
        // Turtle token frequency control
        this.obstacleCount = 0;
        this.turtleSpawnRate = 10; // Spawn turtle token every N obstacles
    }
    
    reset() {
        this.obstacles = [];
        this.turtleTokens = [];
        this.stockCertificates = [];
        this.spawnTimer = 0;
        this.bonusSpawnTimer = 0;
        this.spawnDelay = 120;
        this.difficultyRamp = 0;
        this.obstacleCount = 0;
        // Reset to level 1
        this.currentLevel = 1;
        this.obstacleTypes = this.level1ObstacleTypes;
    }
    
    setLevel(level) {
        this.currentLevel = level;
        if (level === 2) {
            this.obstacleTypes = this.level2ObstacleTypes;
            console.log('ObstacleManager switched to Trading Floor obstacles');
        } else {
            this.obstacleTypes = this.level1ObstacleTypes;
        }
    }
    
    update(deltaTime) {
        const dt = deltaTime / 16;
        
        this.difficultyRamp += dt * 0.001;
        this.spawnDelay = Math.max(60, 120 - this.difficultyRamp * 20);
        
        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.update(this.game.gameSpeed, deltaTime);
            
            if (obstacle.isOffScreen()) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // Update turtle tokens
        for (let i = this.turtleTokens.length - 1; i >= 0; i--) {
            const bonus = this.turtleTokens[i];
            bonus.update(this.game.gameSpeed, deltaTime);
            
            if (bonus.isOffScreen() || bonus.collected) {
                this.turtleTokens.splice(i, 1);
            }
        }
        
        // Update stock certificates
        for (let i = this.stockCertificates.length - 1; i >= 0; i--) {
            const certificate = this.stockCertificates[i];
            certificate.update(this.game.gameSpeed, deltaTime);
            
            if (certificate.isOffScreen() || certificate.collected) {
                this.stockCertificates.splice(i, 1);
            }
        }
        
        // Spawn obstacles
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnDelay) {
            this.spawnObstacle();
            this.spawnTimer = 0;
            this.obstacleCount++;
            
            // Check if we should spawn a collectible based on obstacle count
            if (this.obstacleCount % this.turtleSpawnRate === 0 && this.obstacles.length >= 2) {
                this.spawnTurtleToken();
            }
        }
    }
    
    getCanvasWidth() {
        return this.game.canvas.width;
    }
    
    getCanvasHeight() {
        return this.game.canvas.height;
    }
    
    spawnObstacle() {
        const canvasWidth = this.getCanvasWidth();
        const canvasHeight = this.getCanvasHeight();
        const obstacleWidth = this.baseObstacleWidth + Math.random() * 20;
        const obstacleType = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        
        // Check if there's enough horizontal spacing from existing obstacles
        if (!this.canSpawnAtPosition(canvasWidth, obstacleWidth, obstacleType)) {
            return; // Skip spawning if too close to existing obstacles
        }
        
        // Calculate safe gap size (ensure it's always navigable)
        const playerHeight = 40; // Player character height
        const safetyMargin = 20; // Extra space for comfortable navigation
        let minimumSafeGap = playerHeight + safetyMargin * 2; // 80 pixels minimum
        
        // For candlestick obstacles, add extra safety margin due to expansion
        if (obstacleType === 'candlestick_green' || obstacleType === 'candlestick_red') {
            minimumSafeGap = playerHeight + safetyMargin * 3; // 100 pixels minimum for candlesticks (more challenging)
        }
        
        // Use the larger of configured gap or minimum safe gap
        const actualMinGap = Math.max(this.minGap, minimumSafeGap);
        const actualMaxGap = Math.max(this.maxGap, actualMinGap + 80);
        const gapSize = actualMinGap + Math.random() * (actualMaxGap - actualMinGap);
        
        // Calculate safe vertical position for the gap - bars should touch edges
        const topMargin = 0; // No space from top - bars touch edge
        const bottomMargin = 0; // No space from bottom - bars touch edge
        const availableHeight = canvasHeight - topMargin - bottomMargin - gapSize;
        
        if (availableHeight <= 0) {
            // If screen too small, create a single obstacle instead
            this.spawnSingleObstacle(canvasWidth, canvasHeight, obstacleWidth, obstacleType);
            return;
        }
        
        const gapCenterY = topMargin + gapSize/2 + Math.random() * availableHeight;
        const gapTopY = gapCenterY - gapSize/2;
        const gapBottomY = gapCenterY + gapSize/2;
        
        // Create obstacles with validated gap
        const obstacles = this.createObstaclePair(canvasWidth, canvasHeight, obstacleWidth, gapTopY, gapBottomY, obstacleType);
        
        // Final validation - ensure obstacles don't overlap with existing ones
        if (this.validateObstacles(obstacles)) {
            this.obstacles.push(...obstacles);
        }
    }
    
    canSpawnAtPosition(x, width, obstacleType = 'pillar') {
        // Check minimum horizontal spacing from existing obstacles
        // Use boundary-to-boundary distance to prevent overlapping navigable space
        const spacingMultiplier = this.obstacleSpacingMultipliers[obstacleType] || 1.0;
        const requiredSpacing = this.minHorizontalSpacing * spacingMultiplier;
        
        for (const obstacle of this.obstacles) {
            const existingRightEdge = obstacle.x + obstacle.width;
            const newLeftEdge = x;
            const newRightEdge = x + width;
            const existingLeftEdge = obstacle.x;
            
            // Calculate the minimum distance between obstacle boundaries
            let boundaryDistance;
            if (newLeftEdge >= existingRightEdge) {
                // New obstacle is to the right
                boundaryDistance = newLeftEdge - existingRightEdge;
            } else if (existingLeftEdge >= newRightEdge) {
                // New obstacle is to the left
                boundaryDistance = existingLeftEdge - newRightEdge;
            } else {
                // Obstacles would overlap
                boundaryDistance = 0;
            }
            
            if (boundaryDistance < requiredSpacing) {
                return false;
            }
        }
        return true;
    }
    
    createObstaclePair(canvasWidth, canvasHeight, width, gapTop, gapBottom, type) {
        const obstacles = [];
        
        // Create top obstacle extending to very top (always create if gap exists)
        if (gapTop > 0) {
            obstacles.push(new Obstacle(
                canvasWidth,
                0,
                width,
                gapTop,
                type
            ));
        }
        
        // Create bottom obstacle extending to very bottom (always create if gap exists)
        const bottomStart = gapBottom;
        const bottomHeight = canvasHeight - bottomStart; // Extend all the way to bottom
        if (bottomHeight > 0) {
            obstacles.push(new Obstacle(
                canvasWidth,
                bottomStart,
                width,
                bottomHeight,
                type
            ));
        }
        
        return obstacles;
    }
    
    spawnSingleObstacle(canvasWidth, canvasHeight, width, type) {
        // Create a single obstacle that extends to edge with guaranteed gap
        const playerHeight = 40;
        const safetyMargin = 30;
        const minGapSize = playerHeight + safetyMargin * 2;
        
        // Randomly place gap at top or bottom
        let obstacle;
        if (Math.random() < 0.5) {
            // Gap at bottom - obstacle extends from top
            const obstacleHeight = canvasHeight - minGapSize;
            obstacle = new Obstacle(canvasWidth, 0, width, obstacleHeight, type);
        } else {
            // Gap at top - obstacle extends to bottom
            const gapHeight = minGapSize;
            const obstacleHeight = canvasHeight - gapHeight;
            obstacle = new Obstacle(canvasWidth, gapHeight, width, obstacleHeight, type);
        }
        
        if (this.validateObstacles([obstacle])) {
            this.obstacles.push(obstacle);
        }
    }
    
    validateObstacles(newObstacles) {
        // Check that new obstacles don't overlap with existing ones
        for (const newObstacle of newObstacles) {
            for (const existingObstacle of this.obstacles) {
                if (this.obstaclesOverlap(newObstacle, existingObstacle)) {
                    return false;
                }
            }
        }
        return true;
    }
    
    obstaclesOverlap(obs1, obs2) {
        // Check if two obstacles overlap
        return !(obs1.x + obs1.width < obs2.x || 
                obs2.x + obs2.width < obs1.x || 
                obs1.y + obs1.height < obs2.y || 
                obs2.y + obs2.height < obs1.y);
    }
    
    spawnTurtleToken() {
        const canvasWidth = this.getCanvasWidth();
        const canvasHeight = this.getCanvasHeight();
        
        // Find the most recent obstacle pair to place bonus in their gap
        const safePosition = this.findGapForBonus(canvasWidth, canvasHeight);
        if (safePosition) {
            const token = new TurtleToken(safePosition.x, safePosition.y, this.currentLevel);
            this.turtleTokens.push(token);
        }
    }
    
    spawnStockCertificate() {
        const canvasWidth = this.getCanvasWidth();
        const canvasHeight = this.getCanvasHeight();
        
        // Find the most recent obstacle pair to place bonus in their gap
        const safePosition = this.findGapForBonus(canvasWidth, canvasHeight);
        if (safePosition) {
            const certificate = new StockCertificate(safePosition.x, safePosition.y);
            this.stockCertificates.push(certificate);
        }
    }
    
    findGapForBonus(canvasWidth, canvasHeight) {
        if (this.obstacles.length === 0) return null;
        
        const bonusSize = 30;
        const playerHeight = 40;
        const minGapRequired = playerHeight + 40; // Player + safety margin
        
        // Find the most recent obstacle pair on screen
        const recentObstacles = this.obstacles
            .filter(obs => obs.x > canvasWidth - 100 && obs.x < canvasWidth + 400)
            .sort((a, b) => b.x - a.x); // Sort by X position, newest first
        
        if (recentObstacles.length === 0) {
            return this.createSafeOpenAreaBonus(canvasWidth, canvasHeight);
        }
        
        // Group by X position to find obstacle pairs
        const groups = this.groupObstaclesByX(recentObstacles);
        
        // Find the best gap in the most recent group
        for (const group of groups) {
            const gap = this.findBestGapInGroup(group, canvasHeight, minGapRequired);
            if (gap) {
                return {
                    x: group[0].x + group[0].width / 2, // Center of obstacle width
                    y: gap.centerY
                };
            }
        }
        
        // Fallback: create in completely open space
        return this.createSafeOpenAreaBonus(canvasWidth, canvasHeight);
    }
    
    groupObstaclesByX(obstacles) {
        const groups = [];
        const groupRange = 60; // Pixels to consider as same group
        
        for (const obstacle of obstacles) {
            let foundGroup = false;
            
            for (const group of groups) {
                if (Math.abs(group[0].x - obstacle.x) <= groupRange) {
                    group.push(obstacle);
                    foundGroup = true;
                    break;
                }
            }
            
            if (!foundGroup) {
                groups.push([obstacle]);
            }
        }
        
        // Sort each group by Y position and return only groups with 2+ obstacles
        return groups
            .filter(group => group.length >= 2)
            .map(group => group.sort((a, b) => a.y - b.y));
    }
    
    findBestGapInGroup(group, canvasHeight, minGapRequired) {
        // Look for gaps between obstacles in this group
        for (let i = 0; i < group.length - 1; i++) {
            const topObstacle = group[i];
            const bottomObstacle = group[i + 1];
            
            const gapTop = topObstacle.y + topObstacle.height;
            const gapBottom = bottomObstacle.y;
            const gapSize = gapBottom - gapTop;
            
            // Only use gaps that are large enough for safe passage
            if (gapSize >= minGapRequired) {
                return {
                    centerY: gapTop + gapSize / 2,
                    gapSize: gapSize
                };
            }
        }
        
        // Check gap above first obstacle
        const firstObstacle = group[0];
        if (firstObstacle.y > minGapRequired + 50) {
            return {
                centerY: (50 + firstObstacle.y) / 2,
                gapSize: firstObstacle.y - 50
            };
        }
        
        // Check gap below last obstacle
        const lastObstacle = group[group.length - 1];
        const bottomGap = canvasHeight - 50 - (lastObstacle.y + lastObstacle.height);
        if (bottomGap >= minGapRequired) {
            return {
                centerY: lastObstacle.y + lastObstacle.height + bottomGap / 2,
                gapSize: bottomGap
            };
        }
        
        return null;
    }
    
    createSafeOpenAreaBonus(canvasWidth, canvasHeight) {
        // Create bonus in completely open area away from all obstacles
        const attempts = 20;
        const bonusSize = 30;
        const safeDistance = 80; // Minimum distance from any obstacle
        
        for (let i = 0; i < attempts; i++) {
            const x = canvasWidth + 150 + Math.random() * 200;
            const y = 80 + Math.random() * (canvasHeight - 160);
            
            // Check distance from all obstacles
            let isSafe = true;
            for (const obstacle of this.obstacles) {
                const dx = Math.abs(x - (obstacle.x + obstacle.width / 2));
                const dy = Math.abs(y - (obstacle.y + obstacle.height / 2));
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < safeDistance) {
                    isSafe = false;
                    break;
                }
            }
            
            if (isSafe) {
                return { x, y };
            }
        }
        
        // Ultimate fallback: far right side in middle
        return {
            x: canvasWidth + 300,
            y: canvasHeight / 2
        };
    }
    
    
    render(ctx) {
        // Render obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.render(ctx);
        });
        
        // Render turtle tokens
        this.turtleTokens.forEach(token => {
            token.render(ctx);
        });
        
        // Render stock certificates
        this.stockCertificates.forEach(certificate => {
            certificate.render(ctx);
        });
    }
    
    renderDebugInfo(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText(`Obstacles: ${this.obstacles.length}`, 10, 30);
        ctx.fillText(`Spawn Timer: ${Math.floor(this.spawnTimer)}`, 10, 45);
        ctx.fillText(`Difficulty: ${this.difficultyRamp.toFixed(2)}`, 10, 60);
        ctx.restore();
    }
    
    checkCollision(player) {
        const playerBounds = player.getBounds();
        
        // Check obstacle collisions
        for (const obstacle of this.obstacles) {
            const obstacleBounds = obstacle.getBounds();
            
            if (this.isColliding(playerBounds, obstacleBounds)) {
                this.createCollisionEffect(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                return true;
            }
            
            if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
                obstacle.passed = true;
                this.game.updateScore(this.game.obstaclePoints);
                this.playScoreSound();
            }
        }
        
        // Check turtle token collection
        for (const token of this.turtleTokens) {
            if (!token.collected) {
                const tokenBounds = token.getBounds();
                
                if (this.isColliding(playerBounds, tokenBounds)) {
                    token.collected = true;
                    this.game.updateScore(token.value);
                    this.createBonusEffect(token.x + token.width / 2, token.y + token.height / 2, token.value);
                    this.playBonusSound();
                    
                }
            }
        }
        
        // Check stock certificate collection
        for (const certificate of this.stockCertificates) {
            if (!certificate.collected) {
                const certificateBounds = certificate.getBounds();
                
                if (this.isColliding(playerBounds, certificateBounds)) {
                    certificate.collected = true;
                    this.game.updateScore(certificate.value);
                    this.createBonusEffect(certificate.x + certificate.width / 2, certificate.y + certificate.height / 2, certificate.value);
                    this.playBonusSound();
                }
            }
        }
        
        return false;
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createCollisionEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            const particle = {
                x: x + (Math.random() - 0.5) * 50,
                y: y + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                maxLife: 30,
                alpha: 1,
                color: '#ff4757',
                size: Math.random() * 4 + 2
            };
            
            if (this.game.player.particles) {
                this.game.player.particles.push(particle);
            }
        }
    }
    
    createBonusEffect(x, y, value) {
        // Create golden particles for bonus collection
        for (let i = 0; i < 20; i++) {
            const particle = {
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2, // Slight upward bias
                life: 40,
                maxLife: 40,
                alpha: 1,
                color: '#f6ff0d',
                size: Math.random() * 3 + 1
            };
            
            if (this.game.player.particles) {
                this.game.player.particles.push(particle);
            }
        }
        
        // Create floating score text
        const scoreText = {
            x: x,
            y: y,
            text: `+${value}`,
            life: 60,
            maxLife: 60,
            alpha: 1,
            vy: -1,
            color: '#f6ff0d'
        };
        
        if (this.game.ui && this.game.ui.floatingTexts) {
            this.game.ui.floatingTexts.push(scoreText);
        }
    }
    
    playScoreSound() {
        if (this.game.isMuted) return;
        const scoreSound = document.getElementById('scoreSound');
        if (scoreSound && scoreSound.play) {
            scoreSound.currentTime = 0;
            scoreSound.play().catch(e => {
                // Audio play failed, which is fine
            });
        }
    }
    
    playBonusSound() {
        if (this.game.isMuted) return;
        // Use dedicated turtle collection sound (keeping apy-collect.mp3 for now)
        const apySound = document.getElementById('apySound');
        if (apySound && apySound.play) {
            apySound.currentTime = 0;
            apySound.play().catch(e => {
                // Audio play failed, which is fine
            });
        }
    }
    
    getClosestObstacle(player) {
        let closest = null;
        let minDistance = Infinity;
        
        for (const obstacle of this.obstacles) {
            const distance = obstacle.x - player.x;
            if (distance > 0 && distance < minDistance) {
                minDistance = distance;
                closest = obstacle;
            }
        }
        
        return closest;
    }
    
    clearObstacles() {
        this.obstacles = [];
    }
}