// ==================== 玩家系统 player.js ====================
(function() {
    var G = window.G;

    G.initPlayer = function() {
        G.player = {
            x: G.W / 2,
            y: G.H - 80,
            radius: 30,
            hp: 1000,
            maxHp: 1000,
            damage: 50,
            fireRate: 25,
            fireTimer: 0,
            level: 1,
            xp: 0,
            xpToNext: 100,
            bulletCount: 1,
            pierce: 0,
            bulletSpeed: 14,
            bulletSize: 4,
            critRate: 0,
            hasAngel: false,
            angelCount: 0,
            skills: []
        };

        // 初始技能：多发弹 + 穿透弹
        G.player.skills.push('多发弹');
        G.player.skills.push('穿透弹');
    };

    G.playerUpdate = function() {
        if (!G.player) return;

        // 跟随输入
        var distToInput = G.inputX - G.player.x;
        if (Math.abs(distToInput) > 2) {
            G.player.x += distToInput * 0.15;
        }

        // 边界限制
        G.player.x = Math.max(G.player.radius, Math.min(G.W - G.player.radius, G.player.x));
        
        // 玩家不能越过防守线
        var defenseLineY = G.H * 0.75;
        G.player.y = Math.max(defenseLineY, Math.min(G.H - G.player.radius, G.player.y));
        G.defenseLineY = defenseLineY;

        // 自动射击 - 瞄准蛇BOSS头部（原版逻辑）
        if (G.player.fireTimer > 0) {
            G.player.fireTimer--;
        } else {
            G.player.fireTimer = G.player.fireRate;
            
            var px = G.player.x;
            var py = G.player.y;
            var speed = G.player.bulletSpeed || 14;
            var size = G.player.bulletSize || 4;
            
            // 暴击判定
            var isCrit = Math.random() < (G.player.critRate || 0);
            var dmg = isCrit ? G.player.damage * 2 : G.player.damage;
            
            // 瞄准蛇头（原版）
            var targetX = G.boss ? G.boss.headX : px;
            var targetY = G.boss ? G.boss.headY : 0;
            var baseAngle = Math.atan2(targetY - py, targetX - px);
            
            // 多发弹（扇形分布）
            var count = G.player.bulletCount || 1;
            var spread = count > 1 ? 0.25 : 0;
            var startAngle = baseAngle - (count - 1) * spread / 2;
            
            for (var i = 0; i < count; i++) {
                var angle = startAngle + i * spread;
                var vx = Math.cos(angle) * speed;
                var vy = Math.sin(angle) * speed;
                
                G.fireSkill({
                    x: px,
                    y: py,
                    vx: vx,
                    vy: vy,
                    dmg: dmg,
                    color: isCrit ? '#ffff00' : '#00ffff',
                    pierce: G.player.pierce,
                    size: size
                });
            }
        }
    };

    G.playerDraw = function() {
        if (!G.player) return;
        var ctx = G.ctx;
        ctx.save();
        ctx.translate(G.player.x, G.player.y);

        ctx.rotate(G.time * 0.05);
        ctx.beginPath();
        ctx.arc(0, 0, G.player.radius + 5, 0, Math.PI * 1.5);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.rotate(-G.time * 0.05);

        var grad = ctx.createRadialGradient(0, -5, 5, 0, 0, G.player.radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(0.4, 'rgba(0, 255, 255, 0.6)');
        grad.addColorStop(1, 'rgba(0, 100, 255, 0.1)');
        ctx.beginPath();
        ctx.arc(0, 0, G.player.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fff';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    };
})();
