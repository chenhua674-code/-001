// ==================== 蛇BOSS boss.js ====================
// ==================== 蛇BOSS boss.js ====================
(function() {
    var G = window.G;

    var ROUTES = [
        { pixelsPerSecond: 18, amplitude: 350, frequency: 0.012, phaseShift: 0, minY: -200, maxY: null },
        { pixelsPerSecond: 22, amplitude: 380, frequency: 0.015, phaseShift: Math.PI, minY: -200, maxY: null },
        { pixelsPerSecond: 26, amplitude: 400, frequency: 0.018, phaseShift: Math.PI / 2, minY: -200, maxY: null },
        { pixelsPerSecond: 30, amplitude: 420, frequency: 0.020, phaseShift: 0, minY: -200, maxY: null },
        { pixelsPerSecond: 35, amplitude: 450, frequency: 0.022, phaseShift: Math.PI / 3, minY: -200, maxY: null },
    ];

    var currentRoute = 0;
    var bossLevel = 0;

    function getRoute(level) {
        return ROUTES[level % ROUTES.length];
    }

    function SnakeBoss(level) {
        level = level || 0;
        bossLevel = level;
        var route = getRoute(level);
        currentRoute = level;

        this.segments = [];
        this.segmentCount = 100;
        this.segHp = 50; // 每段血量，显示在格子上
        this.maxHp = this.segHp * this.segmentCount;
        this.hp = this.maxHp;
        this.headX = G.W / 2;
        this.headY = -100;
        this.radius = 25;
        this.amplitude = route.amplitude; 
        this.frequency = route.frequency; 
        this.phaseShift = route.phaseShift;
        this.collisionCooldown = 0;
        this.minY = route.minY;
        this.segSpacing = this.radius * 1.4;
        this.defenseLineY = G.defenseLineY || G.H * 0.75;
        this._pixelsPerSecond = route.pixelsPerSecond;
        this._lastTime = performance.now();
        this.retreatAmount = 0; 

        for (var i = 0; i < this.segmentCount; i++) {
            this.segments.push({ x: G.W / 2, y: -100 - i * this.segSpacing, hp: this.segHp });
        }
    }

    SnakeBoss.prototype.update = function() {
        var now = performance.now();
        var dt = (now - this._lastTime) / 1000;
        this._lastTime = now;
        if (dt > 0.1) dt = 0.1;

        if (this.retreatAmount > 0) {
            this.retreatAmount *= 0.92;
            if (this.retreatAmount < 0.5) this.retreatAmount = 0;
        }

        this.headY += this._pixelsPerSecond * dt;

        this.headX = G.W / 2 + Math.sin(
            this.headY * this.frequency + this.phaseShift
        ) * this.amplitude;

        if (this.headX < this.radius) this.headX = this.radius;
        if (this.headX > G.W - this.radius) this.headX = G.W - this.radius;

        if (this.headY > this.defenseLineY) {
            G.gameOver();
            return;
        }

        var basePhase = this.phaseShift;
        var phaseLag = this.frequency * this.segSpacing * 0.5;
        var retreatY = this.retreatAmount; 

        for (var k = 0; k < this.segments.length; k++) {
            var seg = this.segments[k];
            seg.y = this.headY - k * this.segSpacing - retreatY * Math.exp(-k * 0.05);
            seg.x = G.W / 2 + Math.sin(
                seg.y * this.frequency + basePhase + k * phaseLag
            ) * this.amplitude;
        }

        if (this.headY > G.player.y - 50 && G.player && this.collisionCooldown <= 0) {
            var d = Math.sqrt(
                (this.headX - G.player.x) * (this.headX - G.player.x) +
                (this.headY - G.player.y) * (this.headY - G.player.y)
            );
            if (d < this.radius + G.player.radius) {
                G.player.hp -= 100;
                this.collisionCooldown = 60;
                G.screenShake = 15;
                G.showDamage(G.player.x, G.player.y, 100, true);
                G.spawnParticles(G.player.x, G.player.y, '#ff4444', 10);
                if (G.player.hp <= 0) G.gameOver();
            }
        }
        if (this.collisionCooldown > 0) this.collisionCooldown--;

        if (this.headY > G.H + 200) {
            this.resetToTop();
        }
    };

    SnakeBoss.prototype.resetToTop = function() {
        bossLevel++;
        var route = getRoute(bossLevel);
        this.headY = -100;
        this.headX = G.W / 2;
        this.amplitude = route.amplitude;
        this.frequency = route.frequency;
        this.phaseShift = route.phaseShift;
        this._pixelsPerSecond = route.pixelsPerSecond;
        this.retreatAmount = 0;
        this.segmentCount = 100;
        this.segHp = 50 + bossLevel * 20; 
        this.maxHp = this.segHp * this.segmentCount;
        this.hp = this.maxHp;
        this.segments = [];
        for (var i = 0; i < this.segmentCount; i++) {
            this.segments.push({ x: G.W / 2, y: -100 - i * this.segSpacing, hp: this.segHp });
        }
        var bossNameEl = document.getElementById('boss-name');
        if (bossNameEl) bossNameEl.textContent = '🐉 变异病毒长龙 Lv.' + (bossLevel + 1);
    };

    SnakeBoss.prototype.draw = function() {
        var ctx = G.ctx;
        for (var i = 0; i < this.segments.length; i++) {
            var s = this.segments[i];
            var r = this.radius * (1 - (i / 100) * 0.3);
            if (r < 10) r = 10;
            
            var hpRatio = s.hp / this.segHp;
            var segColor = hpRatio > 0.5 ? '#44cc44' : (hpRatio > 0.2 ? '#ffaa00' : '#ff4444');
            
            ctx.beginPath();
            ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
            ctx.fillStyle = segColor;
            ctx.fill();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 段内显示血量数字
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.font = 'bold ' + Math.max(12, r * 0.8) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(Math.max(0, Math.ceil(s.hp)), s.x, s.y);
            ctx.fillText(Math.max(0, Math.ceil(s.hp)), s.x, s.y);
        }

        // 头部
        ctx.save();
        ctx.translate(this.headX, this.headY);
        for (var t = 0; t < 6; t++) {
            var angle = (t / 6) * Math.PI * 2 + G.time * 0.1;
            var len = 40 + Math.sin(G.time * 0.3 + t) * 10;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                Math.cos(angle) * len * 0.5 + Math.sin(G.time * 0.5) * 10,
                Math.sin(angle) * len * 0.5,
                Math.cos(angle) * len,
                Math.sin(angle) * len
            );
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        var headGrad = ctx.createRadialGradient(-5, -5, 5, 0, 0, this.radius * 1.5);
        headGrad.addColorStop(0, '#aaffaa');
        headGrad.addColorStop(0.5, '#00ff00');
        headGrad.addColorStop(1, '#004400');
        ctx.fillStyle = headGrad;
        ctx.fill();
        ctx.fillStyle = 'red';
        ctx.beginPath(); ctx.arc(-10, -5, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, -5, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(-10, -5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, -5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    };

    SnakeBoss.prototype.takeDamage = function(dmg, segIndex) {
        // 打特定段
        if (segIndex !== undefined && segIndex >= 0 && segIndex < this.segments.length) {
            this.segments[segIndex].hp -= dmg;
            G.showDamage(this.segments[segIndex].x, this.segments[segIndex].y, dmg, Math.random() < 0.2);
            
            // 打掉整段
            if (this.segments[segIndex].hp <= 0) {
                var seg = this.segments[segIndex];
                G.spawnParticles(seg.x, seg.y, '#00ff00', 8);
                this.segments.splice(segIndex, 1);
                G.score += 10;
                this.retreatAmount = 40; // 打掉段时触发后退
                G.drops.push({ x: seg.x, y: seg.y, value: 25, life: 300, color: '#00ff88' });
                // 更新总血量（移除段也扣血）
                this.hp = Math.max(0, this.hp - this.segHp);
            } else {
                this.hp = Math.max(0, this.hp - dmg);
            }
        } else {
            // 打头部
            this.hp = Math.max(0, this.hp - dmg);
            G.showDamage(this.headX, this.headY - 30, dmg, Math.random() < 0.2);
            this.retreatAmount = Math.min(this.retreatAmount + 5, 20); // 打头部轻微后退
        }

        G.screenShake = Math.min(10, G.screenShake + 1);
        G.spawnParticles(this.headX, this.headY, '#00ff00', 3);

        var hpFill = document.getElementById('boss-hp-fill');
        if (hpFill) hpFill.style.width = (Math.max(0, this.hp / this.maxHp) * 100) + '%';

        if (this.segments.length === 0) {
            G.score += 1000;
            G.spawnParticles(this.headX, this.headY, '#00ff00', 100);
            var self = this;
            setTimeout(function() {
                G.boss = new SnakeBoss(bossLevel + 1);
                var hpFill2 = document.getElementById('boss-hp-fill');
                if (hpFill2) hpFill2.style.width = '100%';
            }, 1000);
            this.segments = [];
        }
    };

    G.SnakeBoss = SnakeBoss;

    G.bossUpdate = function() {
        if (G.boss) G.boss.update();
    };

    G.bossDraw = function() {
        if (G.boss) G.boss.draw();
    };
})();
