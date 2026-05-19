# 鬼新娘 游戏开发计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 将单文件游戏拆分为模块化结构，修复已知bug，保持核心玩法不变

**Architecture:** 模块化HTML5 Canvas游戏，通过全局 `window.G` 共享状态，各模块按依赖顺序加载

**Tech Stack:** HTML5 Canvas + 传统JS（var/function），单HTML入口 + 多JS模块

---

## 目录结构

```
/Users/d/AI_Studio/game_new/
├── index.html          # 入口：HTML结构 + CSS + JS模块加载 + 组装脚本
├── js/
│   ├── core.js         # 游戏引擎：Canvas初始化、resize、游戏循环、全局状态
│   ├── input.js        # 输入控制：触摸/鼠标事件、inputX
│   ├── effects.js      # 特效：粒子系统、伤害数字、屏幕震动
│   ├── boss.js         # 蛇BOSS：120段连贯蛇身、S型走位、碰撞玩家
│   ├── bullet.js       # 子弹系统：创建、飞行、碰撞检测、拖尾
│   ├── player.js       # 玩家系统：移动跟随、自动射击、属性、XP/升级
│   ├── skill.js        # 技能系统：8技能池、3选1菜单、升级逻辑
│   └── ui.js           # UI系统：HUD更新、HP条、GameOver
```

## 模块依赖顺序

```
core.js → input.js → effects.js → boss.js → bullet.js → player.js → skill.js → ui.js
```

## 全局状态接口

所有模块共享 `window.G`：
```javascript
window.G = {
    canvas: ..., ctx: ..., W: ..., H: ...,
    gameState: 'playing',
    score: 0, time: 0, screenShake: 0,
    player: {...}, boss: null,
    bullets: [], angels: [],
    particles: [], damageNums: [],
    inputX: ...,
    fireSkill: function(bulletData) {...},
    showDamage: function(x,y,dmg,isCrit) {...},
    showSkillMenu: function() {...},
    gameOver: function() {...},
    restartGame: function() {...}
};
```

---

### Task 1: 游戏引擎 core.js

**Objective:** 创建Canvas初始化、全局状态、游戏循环

**Files:**
- Create: `/Users/d/AI_Studio/game_new/js/core.js`

**内容：**
```javascript
// ==================== 游戏引擎 core.js ====================
(function() {
    var G = window.G = {};

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
    G.player = null;
    G.boss = null;

    // 游戏循环
    function update() {
        if (G.gameState !== 'playing') return;
        G.time++;

        // 调用各模块update
        if (G.inputUpdate) G.inputUpdate();
        if (G.playerUpdate) G.playerUpdate();
        if (G.bossUpdate) G.bossUpdate();
        if (G.bulletUpdate) G.bulletUpdate();
        if (G.angelUpdate) G.angelUpdate();
        if (G.effectsUpdate) G.effectsUpdate();
        if (G.uiUpdate) G.uiUpdate();

        // 升级检查
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

        if (G.bossDraw) G.bossDraw();
        if (G.angelDraw) G.angelDraw();
        if (G.playerDraw) G.playerDraw();
        if (G.bulletDraw) G.bulletDraw();
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
})();
```

**验证：** 加载后 `window.G` 存在，canvas初始化正确

---

### Task 2: 输入控制 input.js

**Objective:** 触摸/鼠标输入，控制玩家左右移动

**Files:**
- Create: `/Users/d/AI_Studio/game_new/js/input.js`

**内容：**
```javascript
// ==================== 输入控制 input.js ====================
(function() {
    var G = window.G;
    G.inputX = G.W / 2;

    window.addEventListener('mousemove', function(e) {
        G.inputX = e.clientX;
    });
    window.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) G.inputX = e.touches[0].clientX;
    }, {passive: true});
    window.addEventListener('touchstart', function(e) {
        if (e.touches.length > 0) G.inputX = e.touches[0].clientX;
    }, {passive: true});

    G.inputUpdate = function() {
        // 由 playerUpdate 处理移动，input只负责更新inputX
    };
})();
```

---

### Task 3: 特效系统 effects.js

**Objective:** 粒子、伤害数字、屏幕震动

**Files:**
- Create: `/Users/d/AI_Studio/game_new/js/effects.js`

**内容：**
```javascript
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
        // 粒子更新
        for (var i = G.particles.length - 1; i >= 0; i--) {
            var p = G.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) G.particles.splice(i, 1);
        }
        // 伤害数字
        for (var i = G.damageNums.length - 1; i >= 0; i--) {
            var d = G.damageNums[i];
            d.y += d.vy;
            d.life--;
            if (d.life <= 0) G.damageNums.splice(i, 1);
        }
        // 屏幕震动衰减
        if (G.screenShake > 0) G.screenShake *= 0.9;
        if (G.screenShake < 0.5) G.screenShake = 0;
    };

    G.effectsDraw = function() {
        // 粒子
        for (var i = 0; i < G.particles.length; i++) {
            var p = G.particles[i];
            G.ctx.globalAlpha = p.life / 35;
            G.ctx.beginPath();
            G.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            G.ctx.fillStyle = p.color;
            G.ctx.fill();
        }
        // 伤害数字
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
```

---

### Task 4: 蛇BOSS系统 boss.js

**Objective:** 120段连贯蛇身、S型走位、碰撞玩家

**Files:**
- Create: `/Users/d/AI_Studio/game_new/js/boss.js`

**内容：**
```javascript
// ==================== 蛇BOSS boss.js ====================
(function() {
    var G = window.G;

    function SnakeBoss() {
        this.segments = [];
        this.segmentCount = 120;
        this.hp = 5000;
        this.maxHp = 5000;
        this.headX = G.W / 2;
        this.headY = -100;
        this.speed = 1.5;
        this.radius = 25;
        this.amplitude = 180;
        this.frequency = 0.03;

        for (var i = 0; i < this.segmentCount; i++) {
            this.segments.push({ x: G.W / 2, y: -100 - i * 10 });
        }
    }

    SnakeBoss.prototype.update = function() {
        this.headY += this.speed;
        this.headX = G.W / 2 + Math.sin(this.headY * this.frequency + G.time * 0.02) * this.amplitude;

        if (this.headX < this.radius) this.headX = this.radius;
        if (this.headX > G.W - this.radius) this.headX = G.W - this.radius;

        var last = this.segments[0];
        var dist = Math.sqrt(
            (this.headX - last.x) * (this.headX - last.x) +
            (this.headY - last.y) * (this.headY - last.y)
        );
        if (dist > 8) {
            this.segments.unshift({ x: this.headX, y: this.headY });
            if (this.segments.length > this.segmentCount) this.segments.pop();
        }

        // 碰撞玩家
        if (this.headY > G.player.y - 50 && G.player) {
            var d = Math.sqrt(
                (this.headX - G.player.x) * (this.headX - G.player.x) +
                (this.headY - G.player.y) * (this.headY - G.player.y)
            );
            if (d < this.radius + G.player.radius) {
                G.player.hp -= 100;
                G.screenShake = 15;
                G.showDamage(G.player.x, G.player.y, 100, true);
                if (G.player.hp <= 0) G.gameOver();
            }
        }
    };

    SnakeBoss.prototype.draw = function() {
        var ctx = G.ctx;
        // 身体（从尾到头）
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

        // 头部
        ctx.save();
        ctx.translate(this.headX, this.headY);

        // 触手
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

        // 头部圆
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        var headGrad = ctx.createRadialGradient(-5, -5, 5, 0, 0, this.radius * 1.5);
        headGrad.addColorStop(0, '#aaffaa');
        headGrad.addColorStop(0.5, '#00ff00');
        headGrad.addColorStop(1, '#004400');
        ctx.fillStyle = headGrad;
        ctx.fill();

        // 眼睛
        ctx.fillStyle = 'red';
        ctx.beginPath(); ctx.arc(-10, -5, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, -5, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(-10, -5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, -5, 2, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    };

    SnakeBoss.prototype.takeDamage = function(dmg) {
        this.hp -= dmg;
        G.showDamage(this.headX, this.headY - 30, dmg, Math.random() < 0.2);
        G.screenShake = Math.min(10, G.screenShake + 1);
        G.spawnParticles(this.headX, this.headY, '#00ff00', 3);

        var hpFill = document.getElementById('boss-hp-fill');
        if (hpFill) hpFill.style.width = (Math.max(0, this.hp / this.maxHp) * 100) + '%';

        if (this.hp <= 0) {
            G.score += 1000;
            G.spawnParticles(this.headX, this.headY, '#00ff00', 100);
            setTimeout(function() {
                G.boss = new SnakeBoss();
                G.boss.hp += 2000;
                G.boss.maxHp = G.boss.hp;
                G.boss.speed += 0.3;
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
```

---

### Task 5: 子弹系统 bullet.js

**Objective:** 子弹创建、飞行、碰撞检测、拖尾

**Files:**
- Create: `/Users/d/AI_Studio/game_new/js/bullet.js`

**内容：**
```javascript
// ==================== 子弹系统 bullet.js ====================
(function() {
    var G = window.G;

    G.fireSkill = function(bulletData) {
        G.bullets.push(bulletData);
    };

    G.bulletUpdate = function() {
        for (var i = G.bullets.length - 1; i >= 0; i--) {
            var b = G.bullets[i];
            b.x += b.vx;
            b.y += b.vy;

            // 拖尾粒子
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

            // 碰撞BOSS
            if (G.boss && G.boss.segments) {
                // 碰撞头部
                var d = Math.sqrt(
                    (b.x - G.boss.headX) * (b.x - G.boss.headX) +
                    (b.y - G.boss.headY) * (b.y - G.boss.headY)
                );
                if (d < G.boss.radius * 2) {
                    G.boss.takeDamage(b.dmg);
                    b.pierce--;
                    if (b.pierce < 0) {
                        G.bullets.splice(i, 1);
                        continue;
                    }
                }
                // 碰撞身体
                for (var j = 0; j < G.boss.segments.length; j++) {
                    var seg = G.boss.segments[j];
                    d = Math.sqrt((b.x - seg.x) * (b.x - seg.x) + (b.y - seg.y) * (b.y - seg.y));
                    if (d < G.boss.radius + 5) {
                        G.boss.takeDamage(b.dmg);
                        b.pierce--;
                        if (b.pierce < 0) {
                            G.bullets.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
    };

    G.bulletDraw = function() {
        for (var i = 0; i < G.bullets.length; i++) {
            var b = G.bullets[i];
            G.ctx.beginPath();
            G.ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            G.ctx.fillStyle = b.color;
            G.ctx.shadowBlur = 10;
            G.ctx.shadowColor = b.color;
            G.ctx.fill();
            G.ctx.shadowBlur = 0;
        }
    };
})();
```

---

### Task 6: 玩家系统 player.js

**Objective:** 玩家移动、自动射击、属性、XP/升级

**Files:**
- Create: `/Users/d/AI_Studio/game_new/js/player.js`

**内容：**
```javascript
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
            hasAngel: false,
            angelCount: 0
        };
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

        // 自动射击
        if (G.player.fireTimer > 0) {
            G.player.fireTimer--;
        } else {
            G.player.fireTimer = G.player.fireRate;
            var targetX = G.boss ? G.boss.headX : G.W / 2;
            var targetY = G.boss ? G.boss.headY : 100;
            var angle = Math.atan2(targetY - G.player.y, targetX - G.player.x);
            var spread = G.player.bulletCount > 1 ? 0.25 : 0;

            for (var i = 0; i < G.player.bulletCount; i++) {
                var a = angle + (i - (G.player.bulletCount - 1) / 2) * spread;
                G.fireSkill({
                    x: G.player.x,
                    y: G.player.y,
                    vx: Math.cos(a) * 14,
                    vy: Math.sin(a) * 14,
                    dmg: G.player.damage,
                    color: '#00ffff',
                    pierce: G.player.pierce
                });
            }
        }
    };

    G.playerDraw = function() {
        if (!G.player) return;
        var ctx = G.ctx;
        ctx.save();
        ctx.translate(G.player.x, G.player.y);

        // 旋转护盾
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

        // 核心底座
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

        // 核心瞳孔
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
```

---

### Task 7: 技能系统 skill.js

**Objective:** 技能池、3选1升级菜单、XP逻辑

**Files:**
- Create: `/Users/d/AI_Studio/game_new/js/skill.js`

**内容：**
```javascript
// ==================== 技能系统 skill.js ====================
(function() {
    var G = window.G;

    G.SKILLS = [
        { name: '多发弹', icon: '\uD83D\uDD25', desc: '同时发射多发子弹', effect: function() { G.player.bulletCount++; } },
        { name: '伤害提升', icon: '\u2694\uFE0F', desc: '伤害 +30', effect: function() { G.player.damage += 30; } },
        { name: '射速提升', icon: '\u26A1', desc: '攻击间隔 -3', effect: function() { G.player.fireRate = Math.max(5, G.player.fireRate - 3); } },
        { name: '穿透弹', icon: '\uD83C\uDFAF', desc: '子弹可穿透 +1', effect: function() { G.player.pierce++; } },
        { name: '天使助战', icon: '\uD83D\uDC7C', desc: '召唤天使自动攻击', effect: function() { G.player.hasAngel = true; G.player.angelCount++; } },
        { name: 'HP恢复', icon: '\u2764\uFE0F', desc: '回复 500 HP', effect: function() { G.player.hp = Math.min(G.player.maxHp, G.player.hp + 500); } },
        { name: '最大HP提升', icon: '\uD83D\uDC96', desc: '最大HP +300', effect: function() { G.player.maxHp += 300; G.player.hp += 300; } },
        { name: '范围扩大', icon: '\uD83C\uDF1F', desc: '攻击范围增大', effect: function() { G.player.radius += 5; } }
    ];

    G.showSkillMenu = function() {
        G.gameState = 'skill';
        var menu = document.getElementById('skill-menu');
        var container = document.getElementById('skills-container');
        container.innerHTML = '';

        // 随机选3个
        var choices = G.SKILLS.slice().sort(function() { return Math.random() - 0.5; }).slice(0, 3);

        for (var i = 0; i < choices.length; i++) {
            (function(skill) {
                var card = document.createElement('div');
                card.className = 'skill-card';
                card.innerHTML = '<span class="skill-icon">' + skill.icon + '</span>' +
                    '<div class="skill-info"><h3>' + skill.name + '</h3><p>' + skill.desc + '</p></div>';
                card.addEventListener('click', function() {
                    skill.effect();
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
            G.ctx.fillText('\uD83D\uDC7C', a.x, a.y);
            G.ctx.beginPath();
            G.ctx.arc(a.x, a.y, 30, 0, Math.PI * 2);
            G.ctx.fillStyle = 'rgba(255,255,255,0.1)';
            G.ctx.fill();
        }
    };
})();
```

---

### Task 8: UI系统 ui.js

**Objective:** HUD更新、HP条、GameOver、Restart

**Files:**
- Create: `/Users/d/AI_Studio/game_new/js/ui.js`

**内容：**
```javascript
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
        G.player.damage = 50;
        G.player.fireRate = 25;
        G.player.bulletCount = 1;
        G.player.pierce = 0;
        G.player.hasAngel = false;
        G.player.angelCount = 0;

        G.boss = new G.SnakeBoss();
        G.bullets = [];
        G.angels = [];
        G.particles = [];
        G.damageNums = [];
        G.score = 0;
        G.time = 0;

        var go = document.getElementById('game-over');
        if (go) go.style.display = 'none';

        var bossHpFill = document.getElementById('boss-hp-fill');
        if (bossHpFill) bossHpFill.style.width = '100%';

        G.gameState = 'playing';
    };
})();
```

---

### Task 9: 整合 index.html

**Objective:** 组装所有模块到单HTML文件

**Files:**
- Modify: `/Users/d/AI_Studio/game_new/index.html`

**内容：**
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0">
<title>鬼新娘 - 弹射射击</title>
<style>
body { margin: 0; overflow: hidden; background: #000; font-family: sans-serif; touch-action: none; }
canvas { display: block; background: #050510; }
#ui { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
#hud { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; color: white; font-size: 18px; font-weight: bold; text-shadow: 0 2px 4px black; }
#boss-hp-container { position: absolute; top: 45px; left: 5%; width: 90%; height: 20px; }
#boss-name { text-align: center; color: #ff3333; font-size: 16px; margin-bottom: 2px; text-shadow: 0 0 5px red; }
#boss-hp-bg { width: 100%; height: 12px; background: #333; border: 2px solid #555; border-radius: 6px; overflow: hidden; }
#boss-hp-fill { height: 100%; background: linear-gradient(90deg, #ff0000, #ff6600); width: 100%; transition: width 0.1s; }

#skill-menu { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); pointer-events: auto; flex-direction: column; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
.skill-card { width: 85%; max-width: 400px; background: linear-gradient(135deg, #222, #111); border: 2px solid #444; color: white; padding: 15px; margin: 8px 0; border-radius: 12px; display: flex; align-items: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
.skill-card:active { transform: scale(0.98); }
.skill-icon { font-size: 32px; margin-right: 15px; }
.skill-info h3 { margin: 0; color: #00ffff; font-size: 18px; }
.skill-info p { margin: 4px 0 0; color: #aaa; font-size: 14px; }

#game-over { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); pointer-events: auto; flex-direction: column; justify-content: center; align-items: center; color: white; }
#restart { padding: 15px 40px; background: #ff3333; border: none; color: white; font-size: 20px; border-radius: 8px; margin-top: 20px; cursor: pointer; }

#player-hp-container { position: absolute; bottom: 20px; left: 5%; width: 90%; height: 14px; }
#player-hp-bg { width: 100%; height: 100%; background: #333; border: 1px solid #555; border-radius: 7px; overflow: hidden; }
#player-hp-fill { height: 100%; background: linear-gradient(90deg, #00ff88, #00cc66); width: 100%; transition: width 0.1s; }
</style>
</head>
<body>
<canvas id="game"></canvas>
<div id="ui">
    <div id="hud">
        <span>🏆 分数: <span id="score">0</span></span>
        <span>⏱️ <span id="time">00:00</span></span>
    </div>

    <div id="boss-hp-container">
        <div id="boss-name">🐉 变异病毒长龙</div>
        <div id="boss-hp-bg"><div id="boss-hp-fill"></div></div>
    </div>

    <div id="skill-menu">
        <h2 style="color: #00ff88; text-shadow: 0 0 10px #00ff88; margin-bottom: 20px;">⬆️ 升级! 选择强化</h2>
        <div id="skills-container" style="width: 100%; display: flex; flex-direction: column; align-items: center;"></div>
    </div>

    <div id="game-over">
        <h1 style="color: #ff3333; font-size: 40px; text-shadow: 0 0 10px red;">💀 防线崩溃</h1>
        <p style="font-size: 20px;">最终分数: <span id="final-score" style="color: #00ff88">0</span></p>
        <button id="restart" onclick="G.restartGame()">不服再来</button>
    </div>

    <div id="player-hp-container">
        <div id="player-hp-bg"><div id="player-hp-fill"></div></div>
    </div>
</div>

<!-- 模块加载 -->
<script src="js/core.js"></script>
<script src="js/input.js"></script>
<script src="js/effects.js"></script>
<script src="js/boss.js"></script>
<script src="js/bullet.js"></script>
<script src="js/player.js"></script>
<script src="js/skill.js"></script>
<script src="js/ui.js"></script>

<!-- 启动 -->
<script>
    G.initPlayer();
    G.boss = new G.SnakeBoss();
    G.start();
</script>
</body>
</html>
```

---

## 验证清单

- [ ] 页面加载无JS错误
- [ ] 玩家可见且在底部
- [ ] 蛇BOSS可见且S型走位
- [ ] 子弹自动发射并击中BOSS
- [ ] 玩家可左右移动
- [ ] BOSS HP条正确更新
- [ ] 玩家HP条正确更新
- [ ] 升级菜单弹出
- [ ] GameOver可重启
- [ ] GitHub Pages可访问
