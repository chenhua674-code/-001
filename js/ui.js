// ==================== UI系统 ui.js ====================
(function() {
    var G = window.G;

    G.uiUpdate = function() {
        if (!G.player) return;

        var secs = Math.floor(G.time / 60);
        var min = Math.floor(secs / 60);
        var sec = secs % 60;
        var timeStr = min + ':' + (sec < 10 ? '0' : '') + sec;

        var scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = G.score;

        var timeEl = document.getElementById('time');
        if (timeEl) timeEl.innerText = timeStr;

        var playerHpFill = document.getElementById('player-hp-fill');
        if (playerHpFill) {
            playerHpFill.style.width = (G.player.hp / G.player.maxHp * 100) + '%';
        }
    };

    G.gameOver = function() {
        G.gameState = 'gameover';
        var go = document.getElementById('game-over');
        if (go) go.style.display = 'flex';
        var finalScore = document.getElementById('final-score');
        if (finalScore) finalScore.innerText = G.score;
    };

    G.restartGame = function() {
        if (!G.player) return;
        G.player.hp = G.player.maxHp;
        G.player.level = 1;
        G.player.xp = 0;
        G.player.damage = 10;
        G.player.fireRate = 25;
        G.player.bulletCount = 1;
        G.player.pierce = 1;
        G.player.bulletSpeed = 14;
        G.player.bulletSize = 4;
        G.player.critRate = 0;
        G.player.hasAngel = false;
        G.player.angelCount = 0;
        G.player.skills = ['多发弹', '穿透弹'];
        G.player.x = G.W / 2;
        G.player.y = G.H - 80;

        G.boss = new G.SnakeBoss();
        G.bullets = [];
        G.angels = [];
        G.particles = [];
        G.damageNums = [];
        G.score = 0;
        G.time = 0;
        G.screenShake = 0;
        G.inputX = G.W / 2;

        var go = document.getElementById('game-over');
        if (go) go.style.display = 'none';

        var bossHpFill = document.getElementById('boss-hp-fill');
        if (bossHpFill) bossHpFill.style.width = '100%';

        G.gameState = 'playing';
    };
})();
