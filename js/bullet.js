// ==================== 子弹系统 bullet.js ====================
(function() {
    var G = window.G;

    G.fireSkill = function(bulletData) {
        G.bullets.push(bulletData);
    };

    G.bulletUpdate = function() {
        for (var i = G.bullets.length - 1; i >= 0; i--) {
            var b = G.bullets[i];
            
            // 直线飞行
            b.x += b.vx;
            b.y += b.vy;

            // 拖尾
            G.particles.push({
                x: b.x, y: b.y,
                vx: 0, vy: 0,
                life: 5,
                color: b.color,
                size: 2
            });

            // 出界
            if (b.x < 0 || b.x > G.W || b.y < 0 || b.y > G.H) {
                G.bullets.splice(i, 1);
                continue;
            }

            // 碰撞检测 - 打蛇头（原版逻辑）
            if (G.boss && G.boss.segments.length > 0) {
                var dHead = Math.sqrt(
                    (b.x - G.boss.headX) * (b.x - G.boss.headX) +
                    (b.y - G.boss.headY) * (b.y - G.boss.headY)
                );
                if (dHead < G.boss.radius * 2) {
                    G.boss.takeDamage(b.dmg);
                    b.pierce = (b.pierce || 0) - 1;
                    if (b.pierce < 0) {
                        G.bullets.splice(i, 1);
                    }
                    continue;
                }
            }
        }
    };

    G.bulletDraw = function() {
        for (var i = 0; i < G.bullets.length; i++) {
            var b = G.bullets[i];
            var size = b.size || 4;
            G.ctx.beginPath();
            G.ctx.arc(b.x, b.y, size, 0, Math.PI * 2);
            G.ctx.fillStyle = b.color;
            G.ctx.shadowBlur = 10;
            G.ctx.shadowColor = b.color;
            G.ctx.fill();
            G.ctx.shadowBlur = 0;
        }
    };
})();
