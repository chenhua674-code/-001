// ==================== 蛇BOSS boss.js ====================
(function() {
    var G = window.G;

    // 蛇路线配置 - 每关不同走位
    var ROUTES = [
        // 关卡1：慢速教学，宽S型（让玩家熟悉玩法）
        { speed: 0.25, amplitude: 280, frequency: 0.008, phaseShift: 0, minY: 80, maxY: null },
        // 关卡2：正常速度，中等S型（标准难度）
        { speed: 0.35, amplitude: 320, frequency: 0.010, phaseShift: Math.PI, minY: 60, maxY: null },
        // 关卡3：快速，大振幅S型（开始有压迫感）
        { speed: 0.45, amplitude: 350, frequency: 0.012, phaseShift: Math.PI / 2, minY: 100, maxY: null },
        // 关卡4：高速，紧凑S型（高难度）
        { speed: 0.55, amplitude: 380, frequency: 0.015, phaseShift: 0, minY: 80, maxY: null },
        // 关卡5：极速，疯狂S型（BOSS关）
        { speed: 0.70, amplitude: 400, frequency: 0.018, phaseShift: Math.PI / 3, minY: 60, maxY: null },
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
        this.segHp = (level + 1) * 20; // 关1=20, 关2=40, 关3=60...
        this.maxHp = this.segHp * this.segmentCount;
        this.headX = G.W / 2;
        this.headY = -100;
        this.speed = route.speed;
        this.radius = 25;
        this.amplitude = route.amplitude; // 跟随关卡配置
        this.frequency = route.frequency; // 跟随关卡配置
        this.phaseShift = route.phaseShift;
        this.collisionCooldown = 0;
        this.minY = route.minY;
        this.segSpacing = this.radius * 0.8; // 紧凑间距（紧凑连接）
        this.defenseLineY = G.defenseLineY || G.H * 0.75;
        // 帧率无关移动：用时间戳控制速度
        this._lastTime = performance.now();
        this._retreatRemaining = 0; // 平滑后退剩余距离

        for (var i = 0; i < this.segmentCount; i++) {
            this.segments.push({ x: G.W / 2, y: -100 - i * 10, hp: (i + 1) * 20 });
        }
    }

    SnakeBoss.prototype.update = function() {
        // 帧率无关移动：基于真实时间戳，确保任何显示器速度一致
        var now = performance.now();
        var dt = now - this._lastTime; // 毫秒
        if (dt < 1) return; // 避免同一毫秒多次移动
        this._lastTime = now;
        
        // speed基于60fps设计：每帧移动speed像素
        // 换算：每毫秒移动 speed/16.67 像素
        var moveAmount = this.speed * (dt / 16.667);
        
        // 平滑后退处理（替代瞬间跳变）
        if (this._retreatRemaining && this._retreatRemaining > 0) {
            var retreatSpeed = moveAmount * 3; // 后退速度是前进的3倍，快速完成
            if (retreatSpeed >= this._retreatRemaining) {
                retreatSpeed = this._retreatRemaining;
                this._retreatRemaining = 0;
            }
            this.headY -= retreatSpeed;
        } else {
            this.headY += moveAmount;
        }
        
        // 宽S型走位 = headY驱动正弦波 + 小时间偏移
        this.headX = G.W / 2 + Math.sin(
            this.headY * this.frequency + G.time * 0.005 + this.phaseShift
        ) * this.amplitude;

        // 左右边界
        if (this.headX < this.radius) this.headX = this.radius;
        if (this.headX > G.W - this.radius) this.headX = G.W - this.radius;

        // 上边界反弹
        if (this.headY < this.minY) {
            this.speed = Math.abs(this.speed);
        }

        // 失败判定：蛇头越过防守线
        if (this.headY > this.defenseLineY) {
            G.gameOver();
            return;
        }

        // 身体跟随（每段保持自己的HP，不重新分配）
        var targetX = this.headX;
        var targetY = this.headY;
        
        for (var k = 0; k < this.segments.length; k++) {
            var seg = this.segments[k];
            var dx = targetX - seg.x;
            var dy = targetY - seg.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > this.segSpacing) {
                seg.x = targetX - (dx / dist) * this.segSpacing;
                seg.y = targetY - (dy / dist) * this.segSpacing;
            }
            targetX = seg.x;
            targetY = seg.y;
        }

        // 碰撞玩家（冷却避免叠伤）
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

        // 如果超出屏幕底部，重置到顶部（进入下一关）
        if (this.headY > G.H + 200) {
            this.resetToTop();
        }
    };

    SnakeBoss.prototype.resetToTop = function() {
        this.headY = -100;
        this.headX = G.W / 2;
        this._retreatRemaining = 0;
        this.segments = [];
        for (var i = 0; i < this.segmentCount; i++) {
            this.segments.push({ x: G.W / 2, y: -100 - i * 10, hp: (i + 1) * 20 });
        }
    };

    SnakeBoss.prototype.draw = function() {
        var ctx = G.ctx;
        // 画身体段（每段分开，显示血量）
        for (var i = 0; i < this.segments.length; i++) {
            var s = this.segments[i];
            var r = this.radius * (1 - (i / this.segmentCount) * 0.3);
            if (r < 10) r = 10;
            
            // 根据剩余血量变色
            var hpRatio = s.hp / this.segHp;
            var segColor = hpRatio > 0.5 ? '#44cc44' : (hpRatio > 0.2 ? '#ffaa00' : '#ff4444');
            
            ctx.beginPath();
            ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
            ctx.fillStyle = segColor;
            ctx.fill();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 段内显示血量（加大字号）
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.font = 'bold ' + Math.max(12, r * 0.8) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(Math.max(0, Math.ceil(s.hp)), s.x, s.y);
            ctx.fillText(Math.max(0, Math.ceil(s.hp)), s.x, s.y);
        }

        // 头部（大一些，不显示血量）
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
        // 扣对应段的HP
        if (segIndex !== undefined && segIndex >= 0 && segIndex < this.segments.length) {
            this.segments[segIndex].hp -= dmg;
            G.showDamage(this.segments[segIndex].x, this.segments[segIndex].y, dmg, Math.random() < 0.2);
            // 段HP归零，移除该段，后面的段自动前移
            if (this.segments[segIndex].hp <= 0) {
                G.spawnParticles(this.segments[segIndex].x, this.segments[segIndex].y, '#00ff00', 8);
                this.segments.splice(segIndex, 1);
                G.score += 10;
                // 打掉一段，整体后退
                this.retreat();
            }
        }

        // 总HP更新
        var totalHp = 0;
        for (var k = 0; k < this.segments.length; k++) totalHp += this.segments[k].hp;
        this.hp = totalHp;

        G.screenShake = Math.min(10, G.screenShake + 1);
        G.spawnParticles(this.headX, this.headY, '#00ff00', 3);

        var hpFill = document.getElementById('boss-hp-fill');
        if (hpFill) hpFill.style.width = (Math.max(0, this.hp / this.maxHp) * 100) + '%';

        // 全部段清除 = BOSS死亡
        if (this.segments.length === 0) {
            G.score += 1000;
            G.spawnParticles(this.headX, this.headY, '#00ff00', 100);
            var self = this;
            setTimeout(function() {
                G.boss = new SnakeBoss(bossLevel + 1);
                var hpFill2 = document.getElementById('boss-hp-fill');
                if (hpFill2) hpFill2.style.width = '100%';
            }, 1000);
        }
    };

    G.SnakeBoss = SnakeBoss;

    SnakeBoss.prototype.retreat = function() {
        // 改用平滑后退，避免闪烁
        this._retreatRemaining = 50; // 需要后退的总距离
    };

    G.bossUpdate = function() {
        if (G.boss) G.boss.update();
    };

    G.bossDraw = function() {
        if (G.boss) G.boss.draw();
    };
})();
