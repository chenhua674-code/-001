/**
 * 炼金守护者 - 竖屏塔防射击游戏
 * 基于微信小游戏架构逆向分析，从零重建
 */

// ==================== 全局配置 ====================
const CONFIG = {
    DESIGN_WIDTH: 750,
    DESIGN_HEIGHT: 1334,
    FIXED_DT: 1 / 60,
    MAX_DT: 0.1,
    GRAVITY: -10,
    // 游戏数值
    PLAYER_MAX_HP: 100,
    PLAYER_BASE_DAMAGE: 10,
    PLAYER_BASE_SPEED: 200,
    PLAYER_ATTACK_INTERVAL: 500, // ms
    // 怪物
    MONSTER_BASE_HP: 30,
    MONSTER_BASE_SPEED: 60,
    MONSTER_BASE_REWARD: 5,
    // 波次
    MONSTERS_PER_WAVE: 10,
    WAVE_INTERVAL: 3000, // ms
    BOSS_EVERY: 5, // Boss every 5 waves
    // 技能
    MAX_SKILL_LEVEL: 10,
    UPGRADE_INTERVAL: 5, // kills between upgrades
    // 物理
    BULLET_SPEED: 400,
    COLLISION_RADIUS: 20,
};

// ==================== 技能数据 ====================
const SKILL_DATA = [
    { id: 'aiXin', name: '爱心弹', icon: '❤️', desc: '发射爱心形状的追踪弹', damage: 8, speed: 350, color: '#ff4466', type: 'homing' },
    { id: 'anMoBang', name: '按摩棒', icon: '🔨', desc: '近战锤击，范围伤害', damage: 15, speed: 0, color: '#888', type: 'melee', range: 80 },
    { id: 'bandage', name: '绷带', icon: '🩹', desc: '治疗自身，回复HP', damage: 0, speed: 0, color: '#00ff88', type: 'heal', healAmount: 15 },
    { id: 'bangZhi', name: '棒槌', icon: '🔧', desc: '投掷棒槌，直线穿透', damage: 12, speed: 300, color: '#aa8844', type: 'pierce', pierceCount: 2 },
    { id: 'bingHua', name: '冰花', icon: '❄️', desc: '冰霜减速，冻结敌人', damage: 5, speed: 250, color: '#44aaff', type: 'slow', slowFactor: 0.4, slowDuration: 2000 },
    { id: 'chaoXi', name: '潮汐', icon: '🌊', desc: '水波攻击，扇形范围', damage: 10, speed: 280, color: '#2266cc', type: 'spread', count: 5, spreadAngle: 60 },
    { id: 'chongJiBo', name: '冲击波', icon: '💫', desc: '环形冲击波，360°覆盖', damage: 7, speed: 200, color: '#ffaa00', type: 'ring', count: 12 },
    { id: 'chuChangQi', name: '除尘器', icon: '🌀', desc: '旋风吸引敌人', damage: 3, speed: 150, color: '#aaa', type: 'vortex', pullSpeed: 30 },
    { id: 'daShouShuDao', name: '手术刀', icon: '🔪', desc: '高速切割，暴击率高', damage: 6, speed: 500, color: '#ddd', type: 'crit', critRate: 0.4 },
    { id: 'daZui', name: '大嘴', icon: '👄', desc: '吞噬敌人，秒杀低血量目标', damage: 20, speed: 0, color: '#ff0088', type: 'execute', executeThreshold: 0.2 },
    { id: 'dianQiu', name: '电球', icon: '⚡', desc: '闪电链，弹射多个目标', damage: 9, speed: 400, color: '#ffff00', type: 'chain', chainCount: 3 },
    { id: 'dianWenPai', name: '电蚊拍', icon: '🦟', desc: '范围电击，持续伤害', damage: 4, speed: 0, color: '#ffcc00', type: 'aura', radius: 120, tickRate: 500 },
    { id: 'diLei', name: '地雷', icon: '💣', desc: '埋设地雷，踩踏爆炸', damage: 30, speed: 0, color: '#555', type: 'mine', triggerRadius: 40 },
    { id: 'guCi', name: '古瓷', icon: '🏺', desc: '投掷瓷瓶，碎成碎片', damage: 10, speed: 300, color: '#cc6644', type: 'shrapnel', shrapnelCount: 8 },
    { id: 'haiLang', name: '海浪', icon: '🏖️', desc: '巨浪推进，击退敌人', damage: 8, speed: 180, color: '#3399ff', type: 'knockback', knockbackForce: 150 },
    { id: 'huoEgg', name: '火蛋', icon: '🥚', desc: '火焰蛋，爆炸溅射', damage: 15, speed: 280, color: '#ff4400', type: 'explosive', splashRadius: 60 },
    { id: 'jiaZhi', name: '加持', icon: '✋', desc: '增强所有已选技能', damage: 0, speed: 0, color: '#ffd700', type: 'buff', buffAmount: 1.3 },
    { id: 'jiGuang', name: '激光', icon: '🔆', desc: '持续激光，高额伤害', damage: 2, speed: 0, color: '#00ffcc', type: 'beam', duration: 3000 },
    { id: 'jiuJin', name: '酒精', icon: '🍺', desc: '投掷酒精瓶，燃烧区域', damage: 6, speed: 250, color: '#ff8800', type: 'burn', burnDuration: 3000, burnDPS: 8 },
    { id: 'jiXie', name: '机械', icon: '🤖', desc: '召唤机械助手自动攻击', damage: 8, speed: 300, color: '#88ccff', type: 'summon', summonCount: 2 },
    { id: 'keDou', name: '蝌蚪', icon: '🐸', desc: '蝌蚪群游，自动追踪', damage: 5, speed: 180, color: '#44cc44', type: 'swarm', count: 6 },
    { id: 'liangMao', name: '两毛', icon: '🪙', desc: '金币弹，杀敌额外奖励', damage: 7, speed: 350, color: '#ffd700', type: 'coin', bonusReward: 3 },
    { id: 'liuXing', name: '流星', icon: '☄️', desc: '天降流星，大范围打击', damage: 25, speed: 0, color: '#ff6600', type: 'meteor', radius: 80, delay: 1500 },
    { id: 'longJuanFeng', name: '龙卷风', icon: '🌪️', desc: '持续龙卷风，旋转伤害', damage: 4, speed: 0, color: '#cccccc', type: 'tornado', duration: 5000, radius: 60 },
    { id: 'longTong', name: '笼筒', icon: '🎆', desc: '烟花散射，华丽覆盖', damage: 6, speed: 350, color: '#ff44aa', type: 'firework', count: 8, spreadAngle: 90 },
    { id: 'lunPan', name: '轮盘', icon: '🎰', desc: '随机效果，赌运气的技能', damage: 10, speed: 300, color: '#ff00ff', type: 'random' },
    { id: 'miXue', name: '密雪', icon: '🌨️', desc: '密集雪弹，减速+伤害', damage: 4, speed: 200, color: '#aaddff', type: 'snow', count: 12, slowFactor: 0.3 },
    { id: 'moGuYun', name: '蘑菇云', icon: '🍄', desc: '核爆级伤害，超广范围', damage: 50, speed: 0, color: '#ff3300', type: 'nuke', radius: 150 },
    { id: 'reWen', name: '热纹', icon: '🔥', desc: '热能波纹，持续灼烧', damage: 5, speed: 220, color: '#ff6644', type: 'dot', dotDuration: 2000, dotDPS: 10 },
    { id: 'yiLiao', name: '医疗', icon: '💊', desc: '持续回复HP', damage: 0, speed: 0, color: '#00cc66', type: 'regen', regenRate: 5, regenDuration: 5000 },
    { id: 'zhongDu', name: '中毒', icon: '☠️', desc: '毒雾弥漫，持续毒伤', damage: 3, speed: 0, color: '#66ff00', type: 'poison', poisonDuration: 4000, poisonDPS: 6 },
    { id: 'zhuaZhi', name: '爪击', icon: '🐾', desc: '近战爪击，连击效果', damage: 12, speed: 0, color: '#ff8866', type: 'claw', comboCount: 3 },
    { id: 'xueQiu', name: '雪球', icon: '⛄', desc: '雪球滚大，越滚越强', damage: 8, speed: 150, color: '#ffffff', type: 'growing', growthRate: 0.1 },
];

// ==================== 工具函数 ====================
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function dist(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }
function angleTo(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); }
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

// ==================== 音频系统 ====================
class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
    }
    play(type) {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            const now = this.ctx.currentTime;
            switch (type) {
                case 'shoot':
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    osc.start(now); osc.stop(now + 0.1);
                    break;
                case 'hit':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(300, now);
                    osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
                    gain.gain.setValueAtTime(0.06, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    osc.start(now); osc.stop(now + 0.08);
                    break;
                case 'kill':
                    osc.frequency.setValueAtTime(500, now);
                    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.15);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.start(now); osc.stop(now + 0.2);
                    break;
                case 'levelup':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(400, now);
                    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    osc.start(now); osc.stop(now + 0.3);
                    break;
                case 'wave':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(200, now);
                    osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc.start(now); osc.stop(now + 0.5);
                    break;
                case 'hurt':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(200, now);
                    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.start(now); osc.stop(now + 0.15);
                    break;
            }
        } catch (e) {}
    }
}

// ==================== 粒子系统 ====================
class ParticleSystem {
    constructor() { this.particles = []; }

    emit(x, y, color, count = 5, speed = 100, life = 500) {
        for (let i = 0; i < count; i++) {
            const angle = rand(0, Math.PI * 2);
            const spd = rand(speed * 0.5, speed * 1.5);
            this.particles.push({
                x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
                life, maxLife: life, color, size: rand(2, 5)
            });
        }
    }

    emitExplosion(x, y, color, size = 20) {
        this.emit(x, y, color, size, 150, 600);
        // Add ring effect
        this.particles.push({
            x, y, vx: 0, vy: 0,
            life: 300, maxLife: 300, color, size, ring: true,
            ringRadius: 5, ringMaxRadius: size * 3
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt * 1000;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.95; p.vy *= 0.95;
            if (p.ring) {
                const t = 1 - p.life / p.maxLife;
                p.currentRingRadius = lerp(p.ringRadius, p.ringMaxRadius, t);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            if (p.ring) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.currentRingRadius, 0, Math.PI * 2);
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2 * alpha;
                ctx.stroke();
            } else if (p.star) {
                // Star-shaped particles
                ctx.fillStyle = p.color;
                const spikes = 4;
                const outerR = p.size * (1 + alpha);
                const innerR = outerR * 0.4;
                ctx.beginPath();
                for (let i = 0; i < spikes * 2; i++) {
                    const r = i % 2 === 0 ? outerR : innerR;
                    const a = (i / (spikes * 2)) * Math.PI * 2 + Date.now() / 500;
                    const px = p.x + Math.cos(a) * r;
                    const py = p.y + Math.sin(a) * r;
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
            } else {
                // Round particles with glow
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 4;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        ctx.globalAlpha = 1;
    }
}

// ==================== 浮动文字 ====================
class FloatingText {
    constructor() { this.texts = []; }

    add(x, y, text, color = '#fff', size = 16) {
        this.texts.push({ x, y, text, color, size, life: 1000, maxLife: 1000 });
    }

    update(dt) {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.life -= dt * 1000;
            t.y -= 40 * dt;
            if (t.life <= 0) this.texts.splice(i, 1);
        }
    }

    draw(ctx) {
        for (const t of this.texts) {
            ctx.globalAlpha = t.life / t.maxLife;
            ctx.font = `bold ${t.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillText(t.text, t.x + 1, t.y + 1);

            // Main text with glow
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
    }
}

// ==================== 玩家 ====================
class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.hp = CONFIG.PLAYER_MAX_HP;
        this.maxHp = CONFIG.PLAYER_MAX_HP;
        this.damage = CONFIG.PLAYER_BASE_DAMAGE;
        this.speed = CONFIG.PLAYER_BASE_SPEED;
        this.attackInterval = CONFIG.PLAYER_ATTACK_INTERVAL;
        this.lastAttack = 0;
        this.skills = []; // { skillId, level }
        this.xp = 0;
        this.kills = 0;
        this.score = 0;
        this.invincible = 0;
        this.radius = 22;
        // Status effects
        this.regen = 0; this.regenTimer = 0;
        this.buffMultiplier = 1;
        // Energy system (like original AddPowerByTime)
        this.power = 0;
        this.maxPower = 100;
        this.addPowerTime = 3; // seconds per power
        this.lastAddPowerTime = Date.now();
    }

    addPower(amount) {
        if (this.power < this.maxPower) {
            const added = Math.min(amount, this.maxPower - this.power);
            this.power += added;
        }
    }

    usePower(amount) {
        if (this.power >= amount) {
            this.power -= amount;
            return true;
        }
        return false;
    }

    addSkill(skillId) {
        const existing = this.skills.find(s => s.skillId === skillId);
        if (existing) {
            existing.level++;
        } else {
            this.skills.push({ skillId, level: 1 });
        }
    }

    getSkillLevel(skillId) {
        const s = this.skills.find(s => s.skillId === skillId);
        return s ? s.level : 0;
    }

    hasSkill(skillId) {
        return this.skills.some(s => s.skillId === skillId);
    }

    getDamageMultiplier() {
        let mult = this.buffMultiplier;
        if (this.hasSkill('jiaZhi')) {
            const lvl = this.getSkillLevel('jiaZhi');
            mult *= Math.pow(1.3, lvl);
        }
        return mult;
    }

    update(dt, monsters, game) {
        // Energy regeneration (like original AddPowerByTime)
        const now = Date.now();
        const powerInterval = this.addPowerTime * 1000;
        if (now - this.lastAddPowerTime >= powerInterval && this.power < this.maxPower) {
            this.addPower(1);
            this.lastAddPowerTime = now;
        }

        // Regen
        if (this.regen > 0) {
            this.regenTimer -= dt * 1000;
            if (this.regenTimer <= 0) {
                this.hp = Math.min(this.maxHp, this.hp + this.regen);
                this.regenTimer = 1000;
            }
        }

        // Invincibility
        if (this.invincible > 0) this.invincible -= dt * 1000;

        // Auto attack nearest monster
        this.lastAttack += dt * 1000;
        if (this.lastAttack >= this.attackInterval) {
            this.lastAttack = 0;
            this.autoAttack(monsters, game);
        }

        // Aura damage (电蚊拍)
        if (this.hasSkill('dianWenPai')) {
            const lvl = this.getSkillLevel('dianWenPai');
            const sd = SKILL_DATA.find(s => s.id === 'dianWenPai');
            const radius = sd.range * lvl;
            for (const m of monsters) {
                if (dist(this.x, this.y, m.x, m.y) < radius + m.radius) {
                    m.takeDamage(sd.damage * lvl * this.getDamageMultiplier(), game);
                }
            }
        }
    }

    autoAttack(monsters, game) {
        // Find nearest monster
        let nearest = null, nearestDist = Infinity;
        for (const m of monsters) {
            const d = dist(this.x, this.y, m.x, m.y);
            if (d < nearestDist) { nearestDist = d; nearest = m; }
        }

        if (!nearest) return;

        // Fire all active skills
        for (const { skillId, level } of this.skills) {
            const sd = SKILL_DATA.find(s => s.id === skillId);
            if (!sd || sd.type === 'heal' || sd.type === 'buff' || sd.type === 'regen' || sd.type === 'aura') continue;
            game.fireSkill(sd, level, this, nearest);
        }
        game.audio.play('shoot');
    }

    takeDamage(amount, game) {
        if (this.invincible > 0) return;
        this.hp -= amount;
        this.invincible = 300;
        game.audio.play('hurt');
        game.floatText.add(this.x, this.y - 30, `-${amount}`, '#ff4444', 18);
        game.particles.emit(this.x, this.y, '#ff4444', 8, 80, 400);
        if (this.hp <= 0) {
            this.hp = 0;
            game.gameOver();
        }
    }

    heal(amount, game) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        game.floatText.add(this.x, this.y - 30, `+${amount}`, '#00ff88', 18);
        game.particles.emit(this.x, this.y, '#00ff88', 6, 60, 400);
    }

    draw(ctx) {
        const t = Date.now() / 1000;
        const pulse = 1 + Math.sin(t * 3) * 0.05;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.radius + 4, this.radius * 0.85 * pulse, this.radius * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer glow
        const glowGrad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.5);
        glowGrad.addColorStop(0, 'rgba(68, 136, 255, 0.15)');
        glowGrad.addColorStop(0.5, 'rgba(68, 136, 255, 0.05)');
        glowGrad.addColorStop(1, 'rgba(68, 136, 255, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Body gradient
        const bodyGrad = ctx.createRadialGradient(this.x - 5, this.y - 8, 2, this.x, this.y, this.radius);
        bodyGrad.addColorStop(0, '#88ccff');
        bodyGrad.addColorStop(0.5, '#4488ff');
        bodyGrad.addColorStop(1, '#2255cc');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = 'rgba(136, 204, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner armor pattern
        ctx.strokeStyle = 'rgba(136, 204, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 2, this.radius * 0.65, Math.PI * 0.8, Math.PI * 0.2, true);
        ctx.stroke();

        // Ears
        const earH = 16 + Math.sin(t * 2) * 2;
        ctx.fillStyle = '#4488ff';
        // Left ear
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - this.radius * 0.7);
        ctx.lineTo(this.x - 18, this.y - this.radius - earH);
        ctx.lineTo(this.x - 3, this.y - this.radius * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(136, 204, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Inner left ear
        ctx.fillStyle = '#ff88aa';
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - this.radius * 0.75);
        ctx.lineTo(this.x - 15, this.y - this.radius - earH + 4);
        ctx.lineTo(this.x - 6, this.y - this.radius * 0.82);
        ctx.closePath();
        ctx.fill();
        // Right ear
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y - this.radius * 0.7);
        ctx.lineTo(this.x + 18, this.y - this.radius - earH);
        ctx.lineTo(this.x + 3, this.y - this.radius * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(136, 204, 255, 0.4)';
        ctx.stroke();
        // Inner right ear
        ctx.fillStyle = '#ff88aa';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y - this.radius * 0.75);
        ctx.lineTo(this.x + 15, this.y - this.radius - earH + 4);
        ctx.lineTo(this.x + 6, this.y - this.radius * 0.82);
        ctx.closePath();
        ctx.fill();

        // Eyes - big anime style
        const eyeY = this.y - 4;
        // Left eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(this.x - 7, eyeY, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Left pupil
        ctx.fillStyle = '#1a3366';
        ctx.beginPath();
        ctx.ellipse(this.x - 6, eyeY + 1, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Left eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 5, eyeY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x - 8, eyeY + 2, 1, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(this.x + 7, eyeY, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a3366';
        ctx.beginPath();
        ctx.ellipse(this.x + 8, eyeY + 1, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + 9, eyeY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 6, eyeY + 2, 1, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#1a3366';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - 3, this.y + 4);
        ctx.quadraticCurveTo(this.x, this.y + 7, this.x + 3, this.y + 4);
        ctx.stroke();

        // Whiskers
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 0.8;
        for (let side = -1; side <= 1; side += 2) {
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x + side * 12, this.y + 3 + i * 3);
                ctx.lineTo(this.x + side * 22, this.y + 1 + i * 5);
                ctx.stroke();
            }
        }

        // Shield aura when invincible
        if (this.invincible > 0) {
            ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 + Math.sin(t * 10) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        // HP bar below
        const barW = 44, barH = 4;
        const barX = this.x - barW / 2, barY = this.y + this.radius + 8;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 2);
        ctx.fill();
        const hpRatio = this.hp / this.maxHp;
        const hpColor = hpRatio > 0.5 ? '#44ff66' : hpRatio > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillStyle = hpColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * hpRatio, barH, 2);
        ctx.fill();
        // Glow on HP bar
        ctx.shadowColor = hpColor;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// ==================== 怪物 ====================
class Monster {
    constructor(x, y, wave, isBoss = false) {
        this.x = x; this.y = y;
        this.isBoss = isBoss;
        const waveMult = 1 + wave * 0.15;
        this.maxHp = (isBoss ? CONFIG.MONSTER_BASE_HP * 10 : CONFIG.MONSTER_BASE_HP) * waveMult;
        this.hp = this.maxHp;
        this.speed = (isBoss ? CONFIG.MONSTER_BASE_SPEED * 0.5 : CONFIG.MONSTER_BASE_SPEED) * (1 + wave * 0.03);
        this.damage = (isBoss ? 20 : 8) * (1 + wave * 0.1);
        this.reward = (isBoss ? 50 : CONFIG.MONSTER_BASE_REWARD) * (1 + wave * 0.1);
        this.radius = isBoss ? 35 : rand(12, 18);
        this.slowed = 0; this.slowFactor = 1;
        this.burning = 0; this.burnDPS = 0;
        this.poisoned = 0; this.poisonDPS = 0;
        this.lastBurnTick = 0;
        this.lastPoisonTick = 0;
        this.type = randInt(0, 3); // Visual variation
    }

    takeDamage(amount, game) {
        this.hp -= amount;
        game.floatText.add(this.x, this.y - this.radius - 10, Math.round(amount).toString(), '#ffff00', 14);
        if (this.hp <= 0) {
            this.die(game);
        }
    }

    die(game) {
        game.player.kills++;
        // Drop pickups
        const coinCount = this.isBoss ? 5 : randInt(1, 3);
        for (let i = 0; i < coinCount; i++) {
            game.pickups.push(new Pickup(
                this.x + rand(-20, 20), this.y + rand(-20, 20),
                'coin', Math.round(this.reward / coinCount)
            ));
        }
        if (Math.random() < 0.3 || this.isBoss) {
            game.pickups.push(new Pickup(
                this.x + rand(-15, 15), this.y + rand(-15, 15),
                'power', this.isBoss ? 10 : 2
            ));
        }

        game.particles.emitExplosion(this.x, this.y, this.isBoss ? '#ff4400' : '#ff8844', this.isBoss ? 30 : 10);
        game.audio.play('kill');
    }

    update(dt, player, game) {
        // Move toward player
        const angle = angleTo(this.x, this.y, player.x, player.y);
        const currentSpeed = this.speed * this.slowFactor;
        this.x += Math.cos(angle) * currentSpeed * dt;
        this.y += Math.sin(angle) * currentSpeed * dt;

        // Slow timer
        if (this.slowed > 0) {
            this.slowed -= dt * 1000;
            if (this.slowed <= 0) this.slowFactor = 1;
        }

        // Burn tick
        if (this.burning > 0) {
            this.burning -= dt * 1000;
            this.lastBurnTick += dt * 1000;
            if (this.lastBurnTick >= 500) {
                this.lastBurnTick = 0;
                this.takeDamage(this.burnDPS * 0.5, game);
                game.particles.emit(this.x, this.y, '#ff4400', 2, 30, 200);
            }
        }

        // Poison tick
        if (this.poisoned > 0) {
            this.poisoned -= dt * 1000;
            this.lastPoisonTick += dt * 1000;
            if (this.lastPoisonTick >= 500) {
                this.lastPoisonTick = 0;
                this.takeDamage(this.poisonDPS * 0.5, game);
                game.particles.emit(this.x, this.y, '#66ff00', 2, 30, 200);
            }
        }

        // Collision with player
        const d = dist(this.x, this.y, player.x, player.y);
        if (d < this.radius + player.radius) {
            player.takeDamage(this.damage, game);
        }
    }

    draw(ctx) {
        const t = Date.now() / 1000;
        const bobY = Math.sin(t * 3 + this.x * 0.1) * 2;

        // Monster visual configs: body color, eye color, accent color, pattern type
        const monsterTypes = [
            { body: ['#cc4444', '#882222'], accent: '#ff6666', eyeColor: '#ffff00', pattern: 'spikes', name: '炎魔' },
            { body: ['#44cc44', '#228822'], accent: '#66ff66', eyeColor: '#ff00ff', pattern: 'spots', name: '毒虫' },
            { body: ['#cc44cc', '#882288'], accent: '#ff66ff', eyeColor: '#00ffff', pattern: 'cracks', name: '暗影' },
            { body: ['#cccc44', '#888822'], accent: '#ffff66', eyeColor: '#ff4444', pattern: 'armor', name: '甲壳' },
        ];
        const mtype = monsterTypes[this.type];
        const isFlashing = this.burning > 0 || this.poisoned > 0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.radius + 5, this.radius * 0.8, this.radius * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Aura based on status
        if (this.burning > 0) {
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 15;
        } else if (this.poisoned > 0) {
            ctx.shadowColor = '#66ff00';
            ctx.shadowBlur = 15;
        } else if (this.slowed > 0) {
            ctx.shadowColor = '#44aaff';
            ctx.shadowBlur = 10;
        }

        // Body with gradient
        const bodyGrad = ctx.createRadialGradient(this.x - this.radius * 0.3, this.y - this.radius * 0.3 + bobY, 2, this.x, this.y + bobY, this.radius);
        bodyGrad.addColorStop(0, mtype.accent);
        bodyGrad.addColorStop(0.5, mtype.body[0]);
        bodyGrad.addColorStop(1, mtype.body[1]);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();

        // Different body shapes based on type
        if (this.type === 0) {
            // Round body
            ctx.arc(this.x, this.y + bobY, this.radius, 0, Math.PI * 2);
        } else if (this.type === 1) {
            // Blob shape
            const pts = 8;
            for (let i = 0; i <= pts; i++) {
                const a = (i / pts) * Math.PI * 2;
                const r = this.radius + Math.sin(a * 3 + t * 2) * 2;
                const px = this.x + Math.cos(a) * r;
                const py = this.y + bobY + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
        } else if (this.type === 2) {
            // Diamond shape
            ctx.moveTo(this.x, this.y + bobY - this.radius);
            ctx.lineTo(this.x + this.radius, this.y + bobY);
            ctx.lineTo(this.x, this.y + bobY + this.radius);
            ctx.lineTo(this.x - this.radius, this.y + bobY);
            ctx.closePath();
        } else {
            // Hexagon armor
            const sides = 6;
            for (let i = 0; i <= sides; i++) {
                const a = (i / sides) * Math.PI * 2 - Math.PI / 6;
                const px = this.x + Math.cos(a) * this.radius;
                const py = this.y + bobY + Math.sin(a) * this.radius;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
        }
        ctx.fill();

        // Pattern overlay
        ctx.globalAlpha = 0.3;
        if (mtype.pattern === 'spikes') {
            ctx.strokeStyle = mtype.accent;
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(this.x + Math.cos(a) * this.radius * 0.3, this.y + bobY + Math.sin(a) * this.radius * 0.3);
                ctx.lineTo(this.x + Math.cos(a) * (this.radius + 5), this.y + bobY + Math.sin(a) * (this.radius + 5));
                ctx.stroke();
            }
        } else if (mtype.pattern === 'spots') {
            ctx.fillStyle = mtype.accent;
            for (let i = 0; i < 3; i++) {
                const a = (i / 3) * Math.PI * 2 + t;
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(a) * this.radius * 0.4, this.y + bobY + Math.sin(a) * this.radius * 0.4, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (mtype.pattern === 'cracks') {
            ctx.strokeStyle = mtype.accent;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - 5, this.y + bobY - 5);
            ctx.lineTo(this.x + 3, this.y + bobY);
            ctx.lineTo(this.x + 8, this.y + bobY + 6);
            ctx.moveTo(this.x + 3, this.y + bobY);
            ctx.lineTo(this.x + 2, this.y + bobY + 10);
            ctx.stroke();
        } else if (mtype.pattern === 'armor') {
            ctx.strokeStyle = mtype.accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - this.radius * 0.6, this.y + bobY - 3);
            ctx.lineTo(this.x + this.radius * 0.6, this.y + bobY - 3);
            ctx.moveTo(this.x - this.radius * 0.5, this.y + bobY + 4);
            ctx.lineTo(this.x + this.radius * 0.5, this.y + bobY + 4);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Eyes - menacing
        const eyeY = this.y + bobY - this.radius * 0.15;
        const eyeSize = this.radius * 0.22;
        const pupilSize = eyeSize * 0.6;
        // Left eye
        ctx.fillStyle = mtype.eyeColor;
        ctx.beginPath();
        ctx.ellipse(this.x - this.radius * 0.3, eyeY, eyeSize, eyeSize * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, eyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        // Right eye
        ctx.fillStyle = mtype.eyeColor;
        ctx.beginPath();
        ctx.ellipse(this.x + this.radius * 0.3, eyeY, eyeSize, eyeSize * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.radius * 0.3, eyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY + this.radius * 0.3, this.radius * 0.3, 0.1, Math.PI - 0.1);
        ctx.stroke();

        // Boss effects
        if (this.isBoss) {
            // Dark aura
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(t * 4) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y + bobY, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            // Crown
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.font = `${this.radius * 1.2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👑', this.x, this.y + bobY - this.radius - 15);
            ctx.shadowBlur = 0;
        }

        // HP bar
        if (this.hp < this.maxHp) {
            const barW = this.radius * 2, barH = 3;
            const barX = this.x - barW / 2, barY = this.y + bobY + this.radius + 6;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW, barH, 1.5);
            ctx.fill();
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW * (this.hp / this.maxHp), barH, 1.5);
            ctx.fill();
        }
    }
}

// ==================== 掉落物 ====================
class Pickup {
    constructor(x, y, type, value) {
        this.x = x; this.y = y;
        this.type = type; // 'coin', 'xp', 'power'
        this.value = value;
        this.radius = type === 'coin' ? 10 : type === 'xp' ? 8 : 12;
        this.speed = 300;
        this.life = 15000;
        this.active = true;
        this.attracted = false;
        this.bobOffset = rand(0, Math.PI * 2);
    }

    update(dt, player, game) {
        this.life -= dt * 1000;
        if (this.life <= 0) { this.active = false; return; }

        // Attract to player when nearby
        const d = dist(this.x, this.y, player.x, player.y);
        const attractRange = this.type === 'power' ? 120 : 80;
        if (d < attractRange || this.attracted) {
            this.attracted = true;
            const angle = angleTo(this.x, this.y, player.x, player.y);
            const speed = this.speed * (1 + (attractRange - d) / attractRange);
            this.x += Math.cos(angle) * speed * dt;
            this.y += Math.sin(angle) * speed * dt;

            // Pickup
            if (d < player.radius + this.radius) {
                this.collect(player, game);
            }
        }
    }

    collect(player, game) {
        this.active = false;
        switch (this.type) {
            case 'coin':
                player.score += this.value;
                game.floatText.add(this.x, this.y, `+${this.value}💰`, '#ffd700', 14);
                break;
            case 'xp':
                player.kills += this.value;
                game.floatText.add(this.x, this.y, `+${this.value}⭐`, '#88ccff', 14);
                if (player.kills % CONFIG.UPGRADE_INTERVAL === 0) {
                    game.showUpgrade();
                }
                break;
            case 'power':
                player.power = (player.power || 0) + this.value;
                game.floatText.add(this.x, this.y, `+${this.value}⚡`, '#00ff88', 14);
                break;
        }
        game.particles.emit(this.x, this.y, this.type === 'coin' ? '#ffd700' : this.type === 'xp' ? '#88ccff' : '#00ff88', 5, 40, 200);
    }

    draw(ctx) {
        const t = Date.now() / 1000;
        const bob = Math.sin(t * 3 + this.bobOffset) * 3;

        // Glow
        ctx.shadowColor = this.type === 'coin' ? '#ffd700' : this.type === 'xp' ? '#88ccff' : '#00ff88';
        ctx.shadowBlur = 8;

        if (this.type === 'coin') {
            // Gold coin
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(this.x, this.y + bob, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x - 2, this.y + bob - 2, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'xp') {
            // XP star
            ctx.fillStyle = '#88ccff';
            ctx.beginPath();
            const spikes = 5, outerR = this.radius, innerR = this.radius * 0.4;
            for (let i = 0; i < spikes * 2; i++) {
                const r = i % 2 === 0 ? outerR : innerR;
                const a = (i / (spikes * 2)) * Math.PI * 2 + t;
                const px = this.x + Math.cos(a) * r;
                const py = this.y + bob + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            // Power orb
            ctx.fillStyle = '#00ff88';
            ctx.beginPath();
            ctx.arc(this.x, this.y + bob, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x, this.y + bob - 2, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }
}

// ==================== 子弹 ====================
class Bullet {
    constructor(x, y, targetX, targetY, skillData, level, owner) {
        this.x = x; this.y = y;
        this.targetX = targetX; this.targetY = targetY;
        this.skill = skillData; this.level = level;
        this.owner = owner;
        this.damage = skillData.damage * level * (owner ? owner.getDamageMultiplier() : 1);
        this.speed = skillData.speed;
        this.radius = 6;
        this.life = 5000;
        this.active = true;
        this.pierceCount = skillData.pierceCount || 0;
        this.hitCount = 0;
        this.angle = angleTo(x, y, targetX, targetY);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.trail = [];
        // Skill specific
        this.slowFactor = skillData.slowFactor || 0;
        this.slowDuration = skillData.slowDuration || 0;
        this.burnDuration = skillData.burnDuration || 0;
        this.burnDPS = skillData.burnDPS || 0;
        this.poisonDuration = skillData.poisonDuration || 0;
        this.poisonDPS = skillData.poisonDPS || 0;
        this.splashRadius = skillData.splashRadius || 0;
        this.radius = skillData.type === 'meteor' ? 15 : 6 + level;
        // Growing雪球
        this.growing = skillData.type === 'growing';
        this.growthRate = skillData.growthRate || 0;
    }

    update(dt, monsters, game) {
        this.life -= dt * 1000;
        if (this.life <= 0) { this.active = false; return; }

        // Growing雪球
        if (this.growing) {
            this.radius += this.radius * this.growthRate * dt;
            this.damage += this.damage * this.growthRate * dt;
        }

        // Homing behavior: track nearest monster
        if (this.skill.type === 'homing' || this.skill.type === 'swarm' || this.skill.type === 'growing') {
            // Find nearest living monster
            let nearest = null, nd = Infinity;
            for (const m of monsters) {
                const d = dist(this.x, this.y, m.x, m.y);
                if (d < nd) { nd = d; nearest = m; }
            }
            if (nearest) {
                const targetAngle = angleTo(this.x, this.y, nearest.x, nearest.y);
                // Smooth turning
                let angleDiff = targetAngle - this.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                const turnSpeed = 5 * dt; // how fast it turns
                this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Trail
        this.trail.push({ x: this.x, y: this.y, life: 200 });
        if (this.trail.length > 10) this.trail.shift();
        for (const t of this.trail) t.life -= dt * 1000;
        this.trail = this.trail.filter(t => t.life > 0);

        // Check collisions
        for (const m of monsters) {
            if (dist(this.x, this.y, m.x, m.y) < this.radius + m.radius) {
                m.takeDamage(this.damage, game);
                game.audio.play('hit');
                game.particles.emit(this.x, this.y, this.skill.color, 4, 60, 300);

                // Apply status effects
                if (this.slowFactor > 0) { m.slowFactor = this.slowFactor; m.slowed = this.slowDuration; }
                if (this.burnDuration > 0) { m.burning = this.burnDuration; m.burnDPS = this.burnDPS * this.level; }
                if (this.poisonDuration > 0) { m.poisoned = this.poisonDuration; m.poisonDPS = this.poisonDPS * this.level; }

                // Splash damage
                if (this.splashRadius > 0) {
                    for (const other of monsters) {
                        if (other === m) continue;
                        if (dist(this.x, this.y, other.x, other.y) < this.splashRadius) {
                            other.takeDamage(this.damage * 0.5, game);
                        }
                    }
                    game.particles.emitExplosion(this.x, this.y, this.skill.color, 15);
                }

                this.hitCount++;
                if (this.hitCount > this.pierceCount) {
                    this.active = false;
                    return;
                }
            }
        }

        // Out of bounds
        if (this.x < -50 || this.x > game.width + 50 || this.y < -50 || this.y > game.height + 50) {
            this.active = false;
        }
    }

    draw(ctx) {
        const t = Date.now() / 1000;

        // Trail with skill-specific style
        for (let i = 0; i < this.trail.length; i++) {
            const tr = this.trail[i];
            const alpha = (tr.life / 200) * 0.4;
            const size = this.radius * (tr.life / 200) * 0.4;
            ctx.globalAlpha = alpha;

            if (this.skill.type === 'homing' || this.skill.type === 'aiXin') {
                // Heart trail
                ctx.fillStyle = this.skill.color;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, size, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.skill.type === 'ring' || this.skill.type === 'chongJiBo') {
                ctx.strokeStyle = this.skill.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, size * 2, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = this.skill.color;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // Main bullet with glow
        ctx.shadowColor = this.skill.color;
        ctx.shadowBlur = 8;

        // Skill-specific bullet shapes
        switch (this.skill.type) {
            case 'homing': {
                // Heart shape
                ctx.fillStyle = this.skill.color;
                ctx.beginPath();
                const s = this.radius * 0.6;
                ctx.moveTo(this.x, this.y + s * 0.3);
                ctx.bezierCurveTo(this.x - s, this.y - s * 0.5, this.x - s * 0.5, this.y - s, this.x, this.y - s * 0.4);
                ctx.bezierCurveTo(this.x + s * 0.5, this.y - s, this.x + s, this.y - s * 0.5, this.x, this.y + s * 0.3);
                ctx.fill();
                break;
            }
            case 'crit': {
                // Star shape
                ctx.fillStyle = this.skill.color;
                ctx.beginPath();
                const spikes = 5, outerR = this.radius, innerR = this.radius * 0.4;
                for (let i = 0; i < spikes * 2; i++) {
                    const r = i % 2 === 0 ? outerR : innerR;
                    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
                    const px = this.x + Math.cos(a) * r;
                    const py = this.y + Math.sin(a) * r;
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'coin': {
                // Gold coin with shine
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x - 2, this.y - 2, this.radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'ring': {
                // Expanding ring
                ctx.strokeStyle = this.skill.color;
                ctx.lineWidth = 3;
                const ringR = this.radius + Math.sin(t * 10) * 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, ringR, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'explosive': {
                // Fireball with flicker
                const flicker = 1 + Math.sin(t * 20) * 0.15;
                const fbGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * flicker);
                fbGrad.addColorStop(0, '#ffff88');
                fbGrad.addColorStop(0.4, '#ff8800');
                fbGrad.addColorStop(1, 'rgba(255, 0, 0, 0.3)');
                ctx.fillStyle = fbGrad;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * flicker, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'slow': {
                // Snowflake
                ctx.fillStyle = this.skill.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 + t;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + Math.cos(a) * this.radius * 1.2, this.y + Math.sin(a) * this.radius * 1.2);
                    ctx.stroke();
                }
                break;
            }
            case 'chain': {
                // Lightning bolt
                ctx.fillStyle = this.skill.color;
                ctx.beginPath();
                ctx.moveTo(this.x - 2, this.y - this.radius);
                ctx.lineTo(this.x + 3, this.y);
                ctx.lineTo(this.x - 1, this.y);
                ctx.lineTo(this.x + 2, this.y + this.radius);
                ctx.lineTo(this.x - 3, this.y);
                ctx.lineTo(this.x + 1, this.y);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'beam': {
                // Laser dot
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = this.skill.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            default: {
                // Glowing orb
                const orbGrad = ctx.createRadialGradient(this.x - this.radius * 0.2, this.y - this.radius * 0.2, 0, this.x, this.y, this.radius);
                orbGrad.addColorStop(0, '#fff');
                orbGrad.addColorStop(0.3, this.skill.color);
                orbGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = orbGrad;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
        }

        ctx.shadowBlur = 0;
    }
}

// ==================== 召唤物 ====================
class Summon {
    constructor(x, y, skillData, level, target) {
        this.x = x; this.y = y;
        this.skill = skillData; this.level = level;
        this.target = target;
        this.damage = skillData.damage * level;
        this.attackInterval = 800;
        this.lastAttack = 0;
        this.life = 8000;
        this.radius = 15;
        this.offsetAngle = rand(0, Math.PI * 2);
        this.orbitRadius = 40;
        this.ownerX = x; this.ownerY = y;
    }

    update(dt, monsters, game) {
        this.life -= dt * 1000;
        this.lastAttack += dt * 1000;

        // Orbit around player
        const t = Date.now() / 1000;
        this.x = game.player.x + Math.cos(this.offsetAngle + t * 2) * this.orbitRadius;
        this.y = game.player.y + Math.sin(this.offsetAngle + t * 2) * this.orbitRadius;

        // Attack nearest monster
        if (this.lastAttack >= this.attackInterval) {
            this.lastAttack = 0;
            let nearest = null, nd = Infinity;
            for (const m of monsters) {
                const d = dist(this.x, this.y, m.x, m.y);
                if (d < nd && d < 200) { nd = d; nearest = m; }
            }
            if (nearest) {
                nearest.takeDamage(this.damage, game);
                game.particles.emit(nearest.x, nearest.y, this.skill.color, 3, 50, 200);
            }
        }

        if (this.life <= 0) this.active = false;
    }

    draw(ctx) {
        const t = Date.now() / 1000;
        const bobY = Math.sin(t * 5) * 2;

        // Glow
        ctx.shadowColor = this.skill.color;
        ctx.shadowBlur = 10;

        // Body
        ctx.fillStyle = this.skill.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y + bobY - 3, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY - 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 1, this.y + bobY - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Orbit path hint
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.ownerX, this.ownerY, this.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ==================== 地雷 ====================
class Mine {
    constructor(x, y, skillData, level) {
        this.x = x; this.y = y;
        this.skill = skillData; this.level = level;
        this.damage = skillData.damage * level;
        this.triggerRadius = skillData.triggerRadius;
        this.radius = 10;
        this.life = 15000;
        this.active = true;
    }

    update(dt, monsters, game) {
        this.life -= dt * 1000;
        if (this.life <= 0) { this.explode(game); return; }
        for (const m of monsters) {
            if (dist(this.x, this.y, m.x, m.y) < this.triggerRadius + m.radius) {
                this.explode(game);
                return;
            }
        }
    }

    explode(game) {
        this.active = false;
        game.particles.emitExplosion(this.x, this.y, '#ff8800', 25);
        for (const m of game.monsters) {
            if (dist(this.x, this.y, m.x, m.y) < 80) {
                m.takeDamage(this.damage, game);
            }
        }
    }

    draw(ctx) {
        const t = Date.now() / 1000;
        const pulse = 1 + Math.sin(t * 4) * 0.1;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 8, this.radius * 1.2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mine body
        const mineGrad = ctx.createRadialGradient(this.x - 3, this.y - 3, 0, this.x, this.y, this.radius * pulse);
        mineGrad.addColorStop(0, '#666');
        mineGrad.addColorStop(0.5, '#444');
        mineGrad.addColorStop(1, '#222');
        ctx.fillStyle = mineGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Fuse/spark
        ctx.fillStyle = '#ff4400';
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 3, 3 + Math.sin(t * 8) * 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Danger indicator
        ctx.fillStyle = 'rgba(255,68,0,0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.triggerRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==================== 主游戏 ====================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();
        this.floatText = new FloatingText();

        this.width = CONFIG.DESIGN_WIDTH;
        this.height = CONFIG.DESIGN_HEIGHT;
        this.scale = 1;

        this.player = null;
        this.monsters = [];
        this.bullets = [];
        this.summons = [];
        this.mines = [];
        this.pickups = [];

        this.wave = 0;
        this.waveTimer = 0;
        this.monstersSpawned = 0;
        this.spawnTimer = 0;
        this.waveDelay = CONFIG.WAVE_INTERVAL;

        this.state = 'loading'; // loading, playing, paused, gameover
        this.loadingProgress = 0;

        this.lastTime = 0;
        this.accumulator = 0;

        this.touchStart = null;
        this.playerTarget = null;
    }

    async init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInput();
        this.audio.init();

        // Simulate loading
        const loadingSteps = [
            '加载游戏引擎...',
            '初始化物理系统...',
            '加载技能数据...',
            '生成美术资源...',
            '准备就绪！'
        ];

        for (let i = 0; i < loadingSteps.length; i++) {
            this.loadingProgress = (i + 1) / loadingSteps.length * 100;
            document.getElementById('progressFill').style.width = this.loadingProgress + '%';
            document.getElementById('loadingText').textContent = loadingSteps[i];
            await new Promise(r => setTimeout(r, 300));
        }

        await new Promise(r => setTimeout(r, 500));

        document.getElementById('loadingScreen').style.display = 'none';
        this.startGame();
    }

    resize() {
        const container = document.getElementById('gameContainer');
        const cw = container.clientWidth, ch = container.clientHeight;
        const aspect = CONFIG.DESIGN_WIDTH / CONFIG.DESIGN_HEIGHT;
        const containerAspect = cw / ch;

        if (containerAspect > aspect) {
            this.canvas.height = ch * devicePixelRatio;
            this.canvas.width = ch * aspect * devicePixelRatio;
        } else {
            this.canvas.width = cw * devicePixelRatio;
            this.canvas.height = cw / aspect * devicePixelRatio;
        }
        this.canvas.style.width = this.canvas.width / devicePixelRatio + 'px';
        this.canvas.style.height = this.canvas.height / devicePixelRatio + 'px';
        this.scale = this.canvas.width / CONFIG.DESIGN_WIDTH;
        this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
        this.width = CONFIG.DESIGN_WIDTH;
        this.height = CONFIG.DESIGN_HEIGHT;
    }

    setupInput() {
        const canvas = this.canvas;
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale;
            const y = (e.clientY - rect.top) / this.scale;
            return { x, y };
        };

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const pos = getPos(e.touches[0]);
            this.touchStart = pos;
            this.playerTarget = pos;
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const pos = getPos(e.touches[0]);
            this.playerTarget = pos;
        }, { passive: false });

        canvas.addEventListener('touchend', () => {
            this.touchStart = null;
        });

        // Mouse fallback
        canvas.addEventListener('mousedown', (e) => {
            const pos = getPos(e);
            this.touchStart = pos;
            this.playerTarget = pos;
        });
        canvas.addEventListener('mousemove', (e) => {
            if (this.touchStart) {
                const pos = getPos(e);
                this.playerTarget = pos;
            }
        });
        canvas.addEventListener('mouseup', () => { this.touchStart = null; });

        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
    }

    startGame() {
        this.player = new Player(this.width / 2, this.height * 0.7);
        // 开局自带基础技能
        this.player.addSkill('aiXin');
        this.player.addSkill('bangZhi');
        this.monsters = [];
        this.bullets = [];
        this.summons = [];
        this.mines = [];
        this.pickups = [];
        this.wave = 0;
        this.waveTimer = 2000;
        this.monstersSpawned = 0;
        this.spawnTimer = 0;
        this.state = 'playing';
        this.particles.particles = [];
        this.floatText.texts = [];

        document.getElementById('hud').style.display = 'block';
        document.getElementById('skillPanel').style.display = 'block';
        document.getElementById('pauseBtn').style.display = 'flex';
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('upgradeDialog').style.display = 'none';

        this.updateUI();
        this.buildSkillPanel();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pauseBtn').textContent = '▶';
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pauseBtn').textContent = '⏸';
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    gameOver() {
        this.state = 'gameover';
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('finalWave').textContent = `到达波次: ${this.wave}`;
        document.getElementById('finalScore').textContent = `总分: ${this.player.score}`;
        document.getElementById('finalKills').textContent = `击杀: ${this.player.kills}`;
    }

    buildSkillPanel() {
        const row = document.getElementById('skillsRow');
        row.innerHTML = '';
        for (const { skillId, level } of this.player.skills) {
            const sd = SKILL_DATA.find(s => s.id === skillId);
            if (!sd) continue;
            const btn = document.createElement('div');
            btn.className = 'skill-btn available';
            btn.innerHTML = `
                <div class="skill-icon">${sd.icon}</div>
                <div class="skill-level">Lv.${level}</div>
            `;
            btn.title = `${sd.name}: ${sd.desc}`;
            row.appendChild(btn);
        }
    }

    showUpgrade() {
        this.state = 'paused';
        this.audio.play('levelup');

        const dialog = document.getElementById('upgradeDialog');
        const options = document.getElementById('upgradeOptions');
        options.innerHTML = '';

        // Generate 3 random options
        const available = [];
        // Options: upgrade existing skill or add new skill
        for (const sd of SKILL_DATA) {
            if (this.player.hasSkill(sd.id) && this.player.getSkillLevel(sd.id) < CONFIG.MAX_SKILL_LEVEL) {
                available.push({ ...sd, action: 'upgrade' });
            } else if (!this.player.hasSkill(sd.id)) {
                available.push({ ...sd, action: 'new' });
            }
        }

        const choices = [];
        while (choices.length < 3 && available.length > 0) {
            const idx = randInt(0, available.length - 1);
            choices.push(available.splice(idx, 1)[0]);
        }

        for (const choice of choices) {
            const opt = document.createElement('div');
            opt.className = 'upgrade-option';
            opt.innerHTML = `
                <div class="opt-icon">${choice.icon}</div>
                <div class="opt-info">
                    <div class="opt-name">${choice.action === 'upgrade' ? `⬆️ 升级 ${choice.name}` : `🆕 解锁 ${choice.name}`}</div>
                    <div class="opt-desc">${choice.desc}</div>
                </div>
            `;
            opt.addEventListener('click', () => {
                this.player.addSkill(choice.id);
                // Apply instant effects
                if (choice.type === 'heal') {
                    const sd = SKILL_DATA.find(s => s.id === 'bandage');
                    this.player.heal(sd.healAmount * this.player.getSkillLevel('bandage'), this);
                }
                if (choice.type === 'regen') {
                    const sd = SKILL_DATA.find(s => s.id === 'yiLiao');
                    this.player.regen = sd.regenRate * this.player.getSkillLevel('yiLiao');
                    this.player.regenTimer = 1000;
                }
                dialog.style.display = 'none';
                this.buildSkillPanel();
                this.updateUI();
                this.state = 'playing';
                this.lastTime = performance.now();
                requestAnimationFrame((t) => this.loop(t));
            });
            options.appendChild(opt);
        }

        dialog.style.display = 'flex';
    }

    fireSkill(skillData, level, player, target) {
        const px = player.x, py = player.y;
        const tx = target.x, ty = target.y;

        switch (skillData.type) {
            case 'homing':
            case 'crit':
            case 'coin':
            case 'pierce':
            case 'growing':
                this.bullets.push(new Bullet(px, py, tx, ty, skillData, level, player));
                break;

            case 'spread':
            case 'firework':
            case 'snow': {
                const count = (skillData.count || 3) + level;
                const spreadAngle = skillData.spreadAngle || 60;
                const baseAngle = angleTo(px, py, tx, ty);
                for (let i = 0; i < count; i++) {
                    const a = baseAngle + (i / (count - 1) - 0.5) * spreadAngle * Math.PI / 180;
                    const bx = px + Math.cos(a) * 30;
                    const by = py + Math.sin(a) * 30;
                    const b = new Bullet(bx, by, px + Math.cos(a) * 200, py + Math.sin(a) * 200, skillData, level, player);
                    b.angle = a; b.vx = Math.cos(a) * b.speed; b.vy = Math.sin(a) * b.speed;
                    this.bullets.push(b);
                }
                break;
            }

            case 'ring': {
                const ringCount = (skillData.count || 8) + level * 2;
                for (let i = 0; i < ringCount; i++) {
                    const a = (i / ringCount) * Math.PI * 2;
                    const b = new Bullet(px, py, px + Math.cos(a) * 100, py + Math.sin(a) * 100, skillData, level, player);
                    b.angle = a; b.vx = Math.cos(a) * b.speed; b.vy = Math.sin(a) * b.speed;
                    b.radius = 4;
                    this.bullets.push(b);
                }
                break;
            }

            case 'explosive': {
                const b = new Bullet(px, py, tx, ty, skillData, level, player);
                this.bullets.push(b);
                break;
            }

            case 'meteor':
                setTimeout(() => {
                    this.particles.emitExplosion(tx, ty, skillData.color, 20);
                    for (const m of this.monsters) {
                        if (dist(tx, ty, m.x, m.y) < skillData.radius + m.radius) {
                            m.takeDamage(skillData.damage * level * player.getDamageMultiplier(), this);
                        }
                    }
                    this.audio.play('hit');
                }, skillData.delay || 1000);
                // Show warning
                this.floatText.add(tx, ty, '⚠️', '#ff4400', 24);
                break;

            case 'summon': {
                const summonCount = (skillData.summonCount || 1) + Math.floor(level / 2);
                for (let i = 0; i < summonCount; i++) {
                    this.summons.push(new Summon(px, py, skillData, level, target));
                }
                break;
            }

            case 'mine':
                this.mines.push(new Mine(px, py - 20, skillData, level));
                break;

            case 'nuke':
                // Screen nuke
                for (const m of this.monsters) {
                    if (dist(px, py, m.x, m.y) < skillData.radius) {
                        m.takeDamage(skillData.damage * level * player.getDamageMultiplier(), this);
                    }
                }
                this.particles.emitExplosion(px, py, skillData.color, 40);
                this.audio.play('kill');
                break;

            case 'heal':
                player.heal(skillData.healAmount * level, this);
                break;

            case 'buff':
                player.buffMultiplier *= skillData.buffAmount;
                this.floatText.add(px, py, '⬆️ 强化!', '#ffd700', 20);
                break;

            case 'regen':
                player.regen = skillData.regenRate * level;
                player.regenTimer = 1000;
                this.floatText.add(px, py, '💊 持续回复', '#00cc66', 18);
                break;

            case 'random':
                // Random effect: pick a random skill type
                const rTypes = ['spread', 'ring', 'explosive', 'meteor', 'heal'];
                const randomType = pick(rTypes);
                if (randomType === 'heal') {
                    player.heal(30 * level, this);
                } else if (randomType === 'meteor') {
                    const mx = rand(50, this.width - 50);
                    const my = rand(50, this.height * 0.5);
                    this.fireSkill({ ...skillData, type: 'meteor' }, level, player, { x: mx, y: my });
                } else {
                    this.bullets.push(new Bullet(px, py, tx, ty, { ...skillData, type: randomType }, level, player));
                }
                break;

            // === 新增技能类型 ===
            case 'chain': {
                // 闪电链：弹射多个目标
                const chainCount = (skillData.chainCount || 3) + level;
                let targets = [...this.monsters].sort((a, b) => dist(px, py, a.x, a.y) - dist(px, py, b.x, b.y));
                let lastX = px, lastY = py;
                for (let i = 0; i < Math.min(chainCount, targets.length); i++) {
                    const t = targets[i];
                    this.bullets.push(new Bullet(lastX, lastY, t.x, t.y, skillData, level, player));
                    lastX = t.x; lastY = t.y;
                }
                break;
            }

            case 'melee': {
                // 近战攻击：范围伤害
                const range = (skillData.range || 80) + level * 10;
                for (const m of this.monsters) {
                    if (dist(px, py, m.x, m.y) < range + m.radius) {
                        m.takeDamage(skillData.damage * level * player.getDamageMultiplier(), this);
                    }
                }
                this.particles.emit(px, py, skillData.color, 8, 100, 300);
                break;
            }

            case 'claw': {
                // 爪击：连击效果
                const comboCount = (skillData.comboCount || 3) + Math.floor(level / 2);
                for (let i = 0; i < comboCount; i++) {
                    setTimeout(() => {
                        const a = angleTo(px, py, tx, ty) + (i - comboCount / 2) * 0.3;
                        const cx = px + Math.cos(a) * 30;
                        const cy = py + Math.sin(a) * 30;
                        for (const m of this.monsters) {
                            if (dist(cx, cy, m.x, m.y) < 40 + m.radius) {
                                m.takeDamage(skillData.damage * level * player.getDamageMultiplier(), this);
                            }
                        }
                        this.particles.emit(cx, cy, skillData.color, 5, 80, 200);
                    }, i * 150);
                }
                break;
            }

            case 'execute': {
                // 吞噬：秒杀低血量目标
                const threshold = skillData.executeThreshold || 0.2;
                for (const m of this.monsters) {
                    if (dist(px, py, m.x, m.y) < 80 + m.radius) {
                        if (m.hp / m.maxHp < threshold) {
                            m.takeDamage(m.hp, this); // Instant kill
                            this.floatText.add(m.x, m.y, '💀 吞噬!', '#ff0088', 20);
                        } else {
                            m.takeDamage(skillData.damage * level * player.getDamageMultiplier(), this);
                        }
                    }
                }
                this.particles.emit(px, py, skillData.color, 10, 120, 400);
                break;
            }

            case 'knockback': {
                // 海浪：击退敌人
                const kbForce = (skillData.knockbackForce || 150) + level * 20;
                const kbAngle = angleTo(px, py, tx, ty);
                for (const m of this.monsters) {
                    if (dist(px, py, m.x, m.y) < 120 + m.radius) {
                        m.takeDamage(skillData.damage * level * player.getDamageMultiplier(), this);
                        m.x += Math.cos(kbAngle) * kbForce * 0.016;
                        m.y += Math.sin(kbAngle) * kbForce * 0.016;
                    }
                }
                this.particles.emit(px, py, skillData.color, 12, 80, 500);
                break;
            }

            case 'burn': {
                // 燃烧：区域持续伤害（用子弹实现）
                const b = new Bullet(px, py, tx, ty, skillData, level, player);
                this.bullets.push(b);
                break;
            }

            case 'vortex': {
                // 旋风：吸引敌人
                const pullSpeed = (skillData.pullSpeed || 30) + level * 5;
                for (const m of this.monsters) {
                    const d = dist(px, py, m.x, m.y);
                    if (d < 150) {
                        const angle = angleTo(m.x, m.y, px, py);
                        m.x += Math.cos(angle) * pullSpeed * 0.016;
                        m.y += Math.sin(angle) * pullSpeed * 0.016;
                        m.takeDamage(skillData.damage * level * player.getDamageMultiplier(), this);
                    }
                }
                this.particles.emit(px, py, skillData.color, 6, 50, 400);
                break;
            }

            case 'beam': {
                // 激光：持续伤害
                const bAngle = angleTo(px, py, tx, ty);
                const beamRange = 300 + level * 50;
                for (const m of this.monsters) {
                    if (dist(px, py, m.x, m.y) < beamRange) {
                        const mA = angleTo(px, py, m.x, m.y);
                        if (Math.abs(mA - bAngle) < 0.2) {
                            m.takeDamage(skillData.damage * level * player.getDamageMultiplier(), this);
                        }
                    }
                }
                // Visual beam effect (handled in draw via temporary effect)
                this.particles.emit(px + Math.cos(bAngle) * 150, py + Math.sin(bAngle) * 150, skillData.color, 15, 30, 200);
                break;
            }

            case 'shrapnel': {
                // 碎瓷：碎成多个碎片
                const count = (skillData.shrapnelCount || 8) + level;
                for (let i = 0; i < count; i++) {
                    const a = (i / count) * Math.PI * 2;
                    const b = new Bullet(px, py, px + Math.cos(a) * 100, py + Math.sin(a) * 100, skillData, level, player);
                    b.vx = Math.cos(a) * 200; b.vy = Math.sin(a) * 200;
                    b.radius = 3;
                    this.bullets.push(b);
                }
                break;
            }

            case 'poison': {
                // 毒雾：区域持续毒伤
                const poisonR = 100 + level * 20;
                for (const m of this.monsters) {
                    if (dist(px, py, m.x, m.y) < poisonR + m.radius) {
                        m.poisoned = skillData.poisonDuration + level * 500;
                        m.poisonDPS = skillData.poisonDPS * level;
                        m.takeDamage(skillData.damage * level * player.getDamageMultiplier(), this);
                    }
                }
                this.particles.emit(px, py, skillData.color, 15, 60, 800);
                break;
            }

            case 'tornado': {
                // 龙卷风：持续旋转伤害
                const tornado = { x: px, y: py, radius: (skillData.radius || 60) + level * 10, damage: skillData.damage * level, life: (skillData.duration || 5000) + level * 500, maxLife: (skillData.duration || 5000) + level * 500 };
                this.tornadoes = this.tornadoes || [];
                this.tornadoes.push(tornado);
                break;
            }

            case 'dot': {
                // 热纹：持续灼烧
                const dotR = 80 + level * 15;
                for (const m of this.monsters) {
                    if (dist(px, py, m.x, m.y) < dotR + m.radius) {
                        m.burning = skillData.dotDuration + level * 300;
                        m.burnDPS = skillData.dotDPS * level;
                    }
                }
                this.particles.emit(px, py, skillData.color, 10, 50, 600);
                break;
            }

            case 'slow': {
                // 冰花：减速（子弹已经处理了减速效果）
                this.bullets.push(new Bullet(px, py, tx, ty, skillData, level, player));
                break;
            }

            case 'swarm': {
                // 蝌蚪群：多个追踪弹
                const count = (skillData.count || 6) + level;
                for (let i = 0; i < count; i++) {
                    const offsetAngle = (i / count) * Math.PI * 2;
                    const sx = px + Math.cos(offsetAngle) * 20;
                    const sy = py + Math.sin(offsetAngle) * 20;
                    const b = new Bullet(sx, sy, tx, ty, skillData, level, player);
                    b.radius = 4;
                    this.bullets.push(b);
                }
                break;
            }

            default:
                this.bullets.push(new Bullet(px, py, tx, ty, skillData, level, player));
                break;
        }
    }

    spawnMonster() {
        const isBoss = this.wave > 0 && this.wave % CONFIG.BOSS_EVERY === 0 && this.monstersSpawned === 0;
        const edge = randInt(0, 2); // 0=top, 1=left, 2=right
        let x, y;
        switch (edge) {
            case 0: x = rand(50, this.width - 50); y = -30; break;
            case 1: x = -30; y = rand(50, this.height * 0.4); break;
            case 2: x = this.width + 30; y = rand(50, this.height * 0.4); break;
        }
        this.monsters.push(new Monster(x, y, this.wave, isBoss));
        this.monstersSpawned++;
    }

    startWave() {
        this.wave++;
        this.monstersSpawned = 0;
        this.waveTimer = 0;
        this.audio.play('wave');
        this.floatText.add(this.width / 2, this.height / 2, `第 ${this.wave} 波`, '#ffd700', 28);
        if (this.wave % CONFIG.BOSS_EVERY === 0) {
            this.floatText.add(this.width / 2, this.height / 2 + 40, '⚠️ BOSS 来袭!', '#ff4444', 24);
        }
        this.updateUI();
    }

    updateUI() {
        if (!this.player) return;
        const hpRatio = this.player.hp / this.player.maxHp;
        document.getElementById('hpBar').style.width = (hpRatio * 100) + '%';
        document.getElementById('hpText').textContent = `${Math.round(this.player.hp)}/${this.player.maxHp}`;
        document.getElementById('waveBadge').textContent = `第 ${this.wave} 波`;
        document.getElementById('powerVal').textContent = Math.round(this.player.power);
        document.getElementById('scoreVal').textContent = this.player.score;
    }

    update(dt) {
        if (this.state !== 'playing') return;
        if (!this.player) return;

        // Player movement
        if (this.playerTarget && this.player) {
            const dx = this.playerTarget.x - this.player.x;
            const dy = this.playerTarget.y - this.player.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > 5) {
                const moveSpeed = Math.min(this.player.speed * dt, d);
                this.player.x += (dx / d) * moveSpeed;
                this.player.y += (dy / d) * moveSpeed;
            }
            // Clamp position
            this.player.x = clamp(this.player.x, this.player.radius, this.width - this.player.radius);
            this.player.y = clamp(this.player.y, this.player.radius + 60, this.height - this.player.radius - 100);
        }

        // Wave management
        if (this.monstersSpawned >= CONFIG.MONSTERS_PER_WAVE + this.wave * 2 && this.monsters.length === 0) {
            this.waveTimer += dt * 1000;
            if (this.waveTimer >= this.waveDelay) {
                this.startWave();
            }
        } else if (this.monstersSpawned < CONFIG.MONSTERS_PER_WAVE + this.wave * 2) {
            this.spawnTimer += dt * 1000;
            const spawnInterval = Math.max(200, 800 - this.wave * 30);
            if (this.spawnTimer >= spawnInterval) {
                this.spawnTimer = 0;
                this.spawnMonster();
            }
        }

        // Update player
        this.player.update(dt, this.monsters, this);

        // Update monsters
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            this.monsters[i].update(dt, this.player, this);
            if (this.monsters[i].hp <= 0) this.monsters.splice(i, 1);
        }

        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(dt, this.monsters, this);
            if (!this.bullets[i].active) this.bullets.splice(i, 1);
        }

        // Update summons
        for (let i = this.summons.length - 1; i >= 0; i--) {
            this.summons[i].update(dt, this.monsters, this);
            if (!this.summons[i].active) this.summons.splice(i, 1);
        }

        // Update mines
        for (let i = this.mines.length - 1; i >= 0; i--) {
            this.mines[i].update(dt, this.monsters, this);
            if (!this.mines[i].active) this.mines.splice(i, 1);
        }

        // Update pickups
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            this.pickups[i].update(dt, this.player, this);
            if (!this.pickups[i].active) this.pickups.splice(i, 1);
        }
        // Limit pickup count to prevent lag
        if (this.pickups.length > 100) this.pickups.splice(0, this.pickups.length - 100);

        // Update tornadoes
        this.tornadoes = this.tornadoes || [];
        for (let i = this.tornadoes.length - 1; i >= 0; i--) {
            const t = this.tornadoes[i];
            t.life -= dt * 1000;
            if (t.life <= 0) { this.tornadoes.splice(i, 1); continue; }
            for (const m of this.monsters) {
                if (dist(t.x, t.y, m.x, m.y) < t.radius + m.radius) {
                    m.takeDamage(t.damage * dt * 5, this);
                }
            }
        }

        // Update particles & floating text
        this.particles.update(dt);
        this.floatText.update(dt);

        this.updateUI();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Background
        this.drawBackground(ctx);

        // Mines
        for (const m of this.mines) m.draw(ctx);

        // Pickups
        for (const p of this.pickups) p.draw(ctx);

        // Tornadoes - enhanced visual
        this.tornadoes = this.tornadoes || [];
        for (const t of this.tornadoes) {
            const lifeRatio = t.life / t.maxLife;
            const alpha = Math.max(0.2, lifeRatio);
            ctx.globalAlpha = alpha;
            const time = Date.now() / 150;
            const rotation = time * 0.5;

            // Tornado cone
            ctx.save();
            ctx.translate(t.x, t.y);

            // Outer swirl
            ctx.strokeStyle = 'rgba(180, 180, 200, 0.3)';
            ctx.lineWidth = 4;
            for (let ring = 0; ring < 4; ring++) {
                const r = t.radius * (0.3 + ring * 0.2);
                ctx.beginPath();
                for (let a = 0; a < Math.PI * 2; a += 0.15) {
                    const wobble = Math.sin(a * 4 + time + ring * 0.8) * 8;
                    const px = Math.cos(a + rotation + ring * 0.5) * (r + wobble);
                    const py = Math.sin(a + rotation + ring * 0.5) * (r + wobble) * 0.6;
                    if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            }

            // Inner glow
            const twGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, t.radius * 0.8);
            twGrad.addColorStop(0, 'rgba(200, 200, 220, 0.15)');
            twGrad.addColorStop(1, 'rgba(200, 200, 220, 0)');
            ctx.fillStyle = twGrad;
            ctx.beginPath();
            ctx.arc(0, 0, t.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            ctx.globalAlpha = 1;
        }

        // Monsters
        for (const m of this.monsters) m.draw(ctx);

        // Bullets
        for (const b of this.bullets) b.draw(ctx);

        // Summons
        for (const s of this.summons) s.draw(ctx);

        // Player
        if (this.player) this.player.draw(ctx);

        // Particles & floating text
        this.particles.draw(ctx);
        this.floatText.draw(ctx);
    }

    drawBackground(ctx) {
        const t = Date.now() / 1000;

        // Deep space gradient
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#050810');
        grad.addColorStop(0.3, '#0a0e1a');
        grad.addColorStop(0.7, '#120a28');
        grad.addColorStop(1, '#0a0e1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Nebula effect
        ctx.globalAlpha = 0.08;
        const nebulaGrad = ctx.createRadialGradient(this.width * 0.3, this.height * 0.2, 0, this.width * 0.3, this.height * 0.2, 300);
        nebulaGrad.addColorStop(0, '#4400aa');
        nebulaGrad.addColorStop(0.5, '#220066');
        nebulaGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        const nebulaGrad2 = ctx.createRadialGradient(this.width * 0.7, this.height * 0.6, 0, this.width * 0.7, this.height * 0.6, 250);
        nebulaGrad2.addColorStop(0, '#004466');
        nebulaGrad2.addColorStop(1, 'transparent');
        ctx.fillStyle = nebulaGrad2;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.globalAlpha = 1;

        // Twinkling stars (parallax)
        this._stars = this._stars || [];
        if (this._stars.length === 0) {
            for (let i = 0; i < 80; i++) {
                this._stars.push({
                    x: rand(0, this.width),
                    y: rand(0, this.height),
                    size: rand(0.5, 2.5),
                    speed: rand(0.5, 2),
                    brightness: rand(0.3, 1),
                    twinkleSpeed: rand(1, 4),
                });
            }
        }

        for (const star of this._stars) {
            const twinkle = 0.5 + Math.sin(t * star.twinkleSpeed) * 0.5;
            const alpha = star.brightness * twinkle;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            // Move slowly
            star.y += star.speed * 0.3;
            if (star.y > this.height + 5) { star.y = -5; star.x = rand(0, this.width); }
        }
        ctx.globalAlpha = 1;

        // Grid pattern with glow
        ctx.strokeStyle = 'rgba(100, 100, 200, 0.04)';
        ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < this.width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
        }

        // Bottom safe zone with subtle glow
        const zoneGrad = ctx.createLinearGradient(0, this.height * 0.6, 0, this.height);
        zoneGrad.addColorStop(0, 'rgba(68, 136, 255, 0)');
        zoneGrad.addColorStop(0.5, 'rgba(68, 136, 255, 0.03)');
        zoneGrad.addColorStop(1, 'rgba(68, 136, 255, 0.08)');
        ctx.fillStyle = zoneGrad;
        ctx.fillRect(0, this.height * 0.6, this.width, this.height * 0.4);

        // Subtle border lines for arena
        ctx.strokeStyle = 'rgba(68, 136, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(20, 60, this.width - 40, this.height - 160);
        ctx.setLineDash([]);
    }

    loop(timestamp) {
        if (this.state !== 'playing') return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, CONFIG.MAX_DT);
        this.lastTime = timestamp;

        this.accumulator += dt;
        while (this.accumulator >= CONFIG.FIXED_DT) {
            this.update(CONFIG.FIXED_DT);
            this.accumulator -= CONFIG.FIXED_DT;
        }

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }
}

// ==================== 启动 ====================
const game = new Game();
game.init();
