// ==================== 特效系统 effects.js ====================
(function() {
    var G = window.G;

    G.showDamage = function(x, y, dmg, isCrit) {
        G.damageNums.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y,
            val: Math.floor(dmg),
            life: 40,
            color: isCrit ? '#ffff00' : '#ffffff',
            size: isCrit ? 24 : 16,
            vy: -2
        });
    };

    G.spawnParticles = function(x, y, color, count) {
        for (var i = 0; i < count; i++) {
            G.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 20 + Math.random() * 15,
                color: color,
                size: 2 + Math.random() * 4
            });
        }
    };

    G.effectsUpdate = function() {
        for (var i = G.particles.length - 1; i >= 0; i--) {
            var p = G.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) G.particles.splice(i, 1);
        }
        for (var i = G.damageNums.length - 1; i >= 0; i--) {
            var d = G.damageNums[i];
            d.y += d.vy;
            d.life--;
            if (d.life <= 0) G.damageNums.splice(i, 1);
        }
        if (G.screenShake > 0) G.screenShake *= 0.9;
        if (G.screenShake < 0.5) G.screenShake = 0;
    };

    G.effectsDraw = function() {
        for (var i = 0; i < G.particles.length; i++) {
            var p = G.particles[i];
            G.ctx.globalAlpha = p.life / 35;
            G.ctx.beginPath();
            G.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            G.ctx.fillStyle = p.color;
            G.ctx.fill();
        }
        for (var i = 0; i < G.damageNums.length; i++) {
            var d = G.damageNums[i];
            G.ctx.globalAlpha = d.life / 40;
            G.ctx.fillStyle = d.color;
            G.ctx.font = 'bold ' + d.size + 'px sans-serif';
            G.ctx.textAlign = 'center';
            G.ctx.fillText(d.val, d.x, d.y);
        }
        G.ctx.globalAlpha = 1;
    };
})();
