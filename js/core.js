// ==================== 游戏引擎 core.js ====================
(function() {
    var G = window.G = {};

    G.defenseLineY = G.H * 0.75; // 防守线位置（75%高度）

    // Canvas 初始化
    G.canvas = document.getElementById('game');
    G.ctx = G.canvas.getContext('2d');
    G.W = window.innerWidth;
    G.H = window.innerHeight;
    G.canvas.width = G.W;
    G.canvas.height = G.H;

    // 窗口resize
    window.addEventListener('resize', function() {
        G.W = window.innerWidth;
        G.H = window.innerHeight;
        G.canvas.width = G.W;
        G.canvas.height = G.H;
        if (G.player) {
            G.player.x = G.W / 2;
            G.player.y = G.H - 80;
        }
    });

    // 游戏状态
    G.gameState = 'playing';
    G.score = 0;
    G.time = 0;
    G.screenShake = 0;

    // 实体数组
    G.bullets = [];
    G.angels = [];
    G.particles = [];
    G.damageNums = [];
    G.drops = []; // XP 掉落物
    G.player = null;
    G.boss = null;

    // 游戏循环
    function update() {
        if (G.gameState !== 'playing') return;
        G.time++;

        if (G.inputUpdate) G.inputUpdate();
        if (G.playerUpdate) G.playerUpdate();
        if (G.bossUpdate) G.bossUpdate();
        if (G.bulletUpdate) G.bulletUpdate();
        if (G.angelUpdate) G.angelUpdate();
        if (G.effectsUpdate) G.effectsUpdate();
        if (G.dropUpdate) G.dropUpdate();
        if (G.uiUpdate) G.uiUpdate();

        if (G.player && G.player.xp >= G.player.xpToNext) {
            G.player.xp -= G.player.xpToNext;
            G.player.level++;
            G.player.xpToNext = Math.floor(G.player.xpToNext * 1.5);
            if (G.showSkillMenu) G.showSkillMenu();
        }
    }

    function draw() {
        G.ctx.clearRect(0, 0, G.W, G.H);
        G.ctx.save();
        if (G.screenShake > 0) {
            G.ctx.translate(
                (Math.random() - 0.5) * G.screenShake * 5,
                (Math.random() - 0.5) * G.screenShake * 5
            );
        }

        // 背景网格
        G.ctx.strokeStyle = 'rgba(255, 0, 50, 0.05)';
        G.ctx.lineWidth = 2;
        for (var i = 0; i < G.W; i += 50) {
            G.ctx.beginPath();
            G.ctx.moveTo(i, 0);
            G.ctx.lineTo(i, G.H);
            G.ctx.stroke();
        }
        
        // 绿色防守线
        var dlY = G.defenseLineY || G.H * 0.75;
        G.ctx.strokeStyle = 'rgba(0, 255, 100, 0.6)';
        G.ctx.lineWidth = 3;
        G.ctx.setLineDash([10, 5]);
        G.ctx.beginPath();
        G.ctx.moveTo(0, dlY);
        G.ctx.lineTo(G.W, dlY);
        G.ctx.stroke();
        G.ctx.setLineDash([]);

        if (G.bossDraw) G.bossDraw();
        if (G.angelDraw) G.angelDraw();
        if (G.playerDraw) G.playerDraw();
        if (G.bulletDraw) G.bulletDraw();
        if (G.dropDraw) G.dropDraw();
        if (G.effectsDraw) G.effectsDraw();

        G.ctx.restore();
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    G.start = function() {
        loop();
    };

    // ==================== 掉落物系统 ====================
    G.dropUpdate = function() {
        for (var i = G.drops.length - 1; i >= 0; i--) {
            var d = G.drops[i];
            
            // 存在时间
            d.life--;
            if (d.life <= 0) {
                G.drops.splice(i, 1);
                continue;
            }

            // 玩家拾取检测
            if (G.player) {
                var dx = d.x - G.player.x;
                var dy = d.y - G.player.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                
                // 吸附范围大一点，手感好
                if (dist < G.player.radius + 20) {
                    G.player.xp += d.value;
                    G.drops.splice(i, 1);
                    continue;
                }
                
                // 慢速飘动（增加时间感）
                d.y += 0.5; 
            }
        }
    };

    G.dropDraw = function() {
        var ctx = G.ctx;
        for (var i = 0; i < G.drops.length; i++) {
            var d = G.drops[i];
            
            // 呼吸效果
            var scale = 1 + Math.sin(G.time * 0.1) * 0.1;
            var size = 12 * scale;
            
            // 发光
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = d.color;
            ctx.fillStyle = d.color;
            
            // 画正方形
            ctx.translate(d.x, d.y);
            ctx.rotate(G.time * 0.05); // 旋转
            ctx.fillRect(-size/2, -size/2, size, size);
            
            // 内部文字
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('XP', 0, 0);
            
            ctx.restore();
        }
    };
})();
