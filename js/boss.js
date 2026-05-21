// ==================== 蛇BOSS boss.js ====================
(function() {
    var G = window.G;

    // 蛇路线配置 - 每关不同走位
    // 原版：speed 1.5px/frame ≈ 90px/s，但原版蛇是用 IK 跟随，不是正弦波
    // 我们的正弦波版本需要更慢的速度才能匹配原版感觉
    var ROUTES = [
        // 关卡1：大幅 S 弯
        { pixelsPerSecond: 18, amplitude: 350, frequency: 0.012, phaseShift: 0, minY: -200, maxY: null },
        // 关卡2：稍快
        { pixelsPerSecond: 22, amplitude: 380, frequency: 0.015, phaseShift: Math.PI, minY: -200, maxY: null },
        // 关卡3：快速
        { pixelsPerSecond: 26, amplitude: 400, frequency: 0.018, phaseShift: Math.PI / 2, minY: -200, maxY: null },
        // 关卡4：高速
        { pixelsPerSecond: 30, amplitude: 420, frequency: 0.020, phaseShift: 0, minY: -200, maxY: null },
        // 关卡5：极速
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
        // 原版：蛇总血量 5000，每关+2000
        this.totalHp = 5000 + level * 2000;
        this.maxHp = this.totalHp;
        this.hp = this.totalHp;
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
        this.retreatAmount = 0; // 受击后退量
        this.retreatDecay = 0.95; // 后退恢复速度

        // 原版蛇身：只是位置记录，没有独立血量
        for (var i = 0; i < this.segmentCount; i++) {
            this.segments.push({ x: G.W / 2, y: -100 - i * this.segSpacing });
        }
    }

    SnakeBoss.prototype.update = function() {
        var now = performance.now();
        var dt = (now - this._lastTime) / 1000;
        this._lastTime = now;
        if (dt > 0.1) dt = 0.1;

        // 受击后退效果：蛇整体向上退
        if (this.retreatAmount > 0) {
            this.retreatAmount *= this.retreatDecay;
            if (this.retreatAmount < 0.5) this.retreatAmount = 0;
        }

        this.headY += this._pixelsPerSecond * dt;

        // S型走位
        this.headX = G.W / 2 + Math.sin(
            this.headY * this.frequency + this.phaseShift
        ) * this.amplitude;

        // 左右边界
        if (this.headX < this.radius) this.headX = this.radius;
        if (this.headX > G.W - this.radius) this.headX = G.W - this.radius;

        // 失败判定：蛇头越过防守线
        if (this.headY > this.defenseLineY) {
            G.gameOver();
            return;
        }

        // 身体跟随（波浪行进算法）
        var basePhase = this.phaseShift;
        var phaseLag = this.frequency * this.segSpacing * 0.5;
        var retreatY = this.retreatAmount; // 受击后退偏移

        for (var k = 0; k < this.segments.length; k++) {
            var seg = this.segments[k];
            seg.y = this.headY - k * this.segSpacing - retreatY * Math.exp(-k * 0.05); // 越靠近头部退得越多
            seg.x = G.W / 2 + Math.sin(
                seg.y * this.frequency + basePhase + k * phaseLag
            ) * this.amplitude;
        }

        // 碰撞玩家
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

        // 超出屏幕底部，重置到顶部（进入下一关）
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
        // 重置血量（原版每关+2000）
        this.totalHp = 5000 + bossLevel * 2000;
        this.maxHp = this.totalHp;
        this.hp = this.totalHp;
        this.retreatAmount = 0;
        this.segments = [];
        for (var i = 0; i < this.segmentCount; i++) {
            this.segments.push({ x: G.W / 2, y: -100 - i * this.segSpacing });
        }
        // 更新 BOSS 名称
        var bossNameEl = document.getElementById('boss-name');
        if (bossNameEl) bossNameEl.textContent = '🐉 变异病毒长龙 Lv.' + (bossLevel + 1);
    };

    SnakeBoss.prototype.draw = function() {
        var ctx = G.ctx;
        // 画蛇身段（原版风格：半透明肉块 + 闪烁效果）
        for (var i = this.segments.length - 1; i >= 0; i--) {
            var s = this.segments[i];
            var r = this.radius * (1 - (i / this.segmentCount) * 0.6); 
            if (r < 5) r = 5;
            
            var flicker = Math.sin(G.time * 0.2 + i * 0.1) * 0.1;
            ctx.beginPath();
            ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 255, 100, ' + (0.6 + flicker) + ')';
            ctx.fill();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 头部（原版：触手 + 眼睛）
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
        this.hp -= dmg;
        G.showDamage(this.headX, this.headY - 30, dmg, Math.random() < 0.2);
        
        // 受击后退效果
        this.retreatAmount = Math.min(this.retreatAmount + 30, 80);

        G.screenShake = Math.min(10, G.screenShake + 1);
        G.spawnParticles(this.headX, this.headY, '#00ff00', 3);

        // 更新血条
        var hpFill = document.getElementById('boss-hp-fill');
        if (hpFill) hpFill.style.width = (Math.max(0, this.hp / this.maxHp) * 100) + '%';

        // BOSS 死亡
        if (this.hp <= 0) {
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
