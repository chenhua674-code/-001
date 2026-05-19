// ==================== 技能系统 skill.js ====================
(function() {
    var G = window.G;

    G.SKILLS = [
        { name: '多发弹', icon: '🔥', desc: '同时发射多发子弹', effect: function() { G.player.bulletCount++; } },
        { name: '伤害提升', icon: '⚔️', desc: '伤害 +30', effect: function() { G.player.damage += 30; } },
        { name: '射速提升', icon: '⚡', desc: '攻击间隔 -3', effect: function() { G.player.fireRate = Math.max(5, G.player.fireRate - 3); } },
        { name: '穿透弹', icon: '🎯', desc: '子弹可穿透 +1', effect: function() { G.player.pierce++; } },
        { name: '天使助战', icon: '👼', desc: '召唤天使自动攻击', effect: function() { G.player.hasAngel = true; G.player.angelCount++; } },
        { name: 'HP恢复', icon: '❤️', desc: '回复 500 HP', effect: function() { G.player.hp = Math.min(G.player.maxHp, G.player.hp + 500); } },
        { name: '最大HP提升', icon: '💖', desc: '最大HP +300', effect: function() { G.player.maxHp += 300; G.player.hp += 300; } },
        { name: '范围扩大', icon: '🌟', desc: '攻击范围增大', effect: function() { G.player.radius += 5; } }
    ];

    G.showSkillMenu = function() {
        G.gameState = 'skill';
        var menu = document.getElementById('skill-menu');
        var container = document.getElementById('skills-container');
        container.innerHTML = '';

        var choices = G.SKILLS.slice().sort(function() { return Math.random() - 0.5; }).slice(0, 3);

        for (var i = 0; i < choices.length; i++) {
            (function(skill) {
                var card = document.createElement('div');
                card.className = 'skill-card';
                card.innerHTML = '<span class="skill-icon">' + skill.icon + '</span>' +
                    '<div class="skill-info"><h3>' + skill.name + '</h3><p>' + skill.desc + '</p></div>';
                card.addEventListener('click', function() {
                    skill.effect();
                    // 记录已选技能
                    if (G.player.skills.indexOf(skill.name) === -1) {
                        G.player.skills.push(skill.name);
                    }
                    menu.style.display = 'none';
                    G.gameState = 'playing';
                });
                container.appendChild(card);
            })(choices[i]);
        }

        menu.style.display = 'flex';
    };

    G.angelUpdate = function() {
        if (!G.player) return;
        if (G.player.hasAngel && G.angels.length < G.player.angelCount) {
            G.angels.push({ x: G.W / 2, y: G.H / 2, timer: 0 });
        }
        for (var i = 0; i < G.angels.length; i++) {
            var a = G.angels[i];
            a.timer++;
            a.x = G.W / 2 + Math.sin(a.timer * 0.03) * 150;
            a.y = G.H / 3 + Math.cos(a.timer * 0.04) * 100;
            if (a.timer % 20 === 0 && G.boss) {
                G.fireSkill({
                    x: a.x, y: a.y,
                    vx: (G.boss.headX - a.x) * 0.06,
                    vy: (G.boss.headY - a.y) * 0.06,
                    dmg: G.player.damage * 0.3,
                    color: '#ffff00',
                    pierce: 0
                });
            }
        }
    };

    G.angelDraw = function() {
        for (var i = 0; i < G.angels.length; i++) {
            var a = G.angels[i];
            G.ctx.font = '40px Arial';
            G.ctx.textAlign = 'center';
            G.ctx.textBaseline = 'middle';
            G.ctx.fillText('👼', a.x, a.y);
            G.ctx.beginPath();
            G.ctx.arc(a.x, a.y, 30, 0, Math.PI * 2);
            G.ctx.fillStyle = 'rgba(255,255,255,0.1)';
            G.ctx.fill();
        }
    };
})();
