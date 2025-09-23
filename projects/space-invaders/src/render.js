import { BACKGROUND_CONFIG, BOSS_CONFIG, TRAIL_CONFIG } from "./config.js";

export function drawScene(ctx, state) {
    const {
        width,
        height,
        stars,
        background,
        player,
        invaders,
        playerShots,
        enemyShots,
        powerUps,
        boss,
        particles,
        flash,
        drones,
        combo,
        cameraShake,
        time
    } = state;

    ctx.save();
    if (cameraShake && cameraShake.magnitude > 0) {
        ctx.translate(cameraShake.offsetX, cameraShake.offsetY);
    }

    drawBackground(ctx, width, height, stars, background, time);
    if (flash && flash.time > 0) {
        drawFlash(ctx, width, height, flash.time, flash.duration);
    }
    drawInfiniteGrid(ctx, width, height, background);
    drawNebulae(ctx, width, height, background, time);
    drawInvaders(ctx, invaders, time);
    if (boss) {
        drawBoss(ctx, boss, width, time);
    }
    drawPowerUps(ctx, powerUps, time);
    drawTrail(ctx, player.trail, time);
    drawPlayer(ctx, player, drones, time);
    drawShots(ctx, playerShots, enemyShots, time);
    drawParticles(ctx, particles);
    if (combo && combo.multiplier > 1) {
        drawCombo(ctx, combo, width, time);
    }
    ctx.restore();
}

function drawBackground(ctx, width, height, stars, background, time) {
    background.layers.forEach((layer, index) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, layer.colorA);
        gradient.addColorStop(1, layer.colorB);
        ctx.globalAlpha = layer.alpha;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    });
    ctx.globalAlpha = 1;

    ctx.save();
    stars.forEach((star, index) => {
        ctx.globalAlpha = star.a;
        const hue = 200 + (index % 3) * 40;
        const radius = star.r * (1 + Math.sin(time * 6 + index) * 0.08);
        ctx.fillStyle = `hsl(${hue} 82% 78%)`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function drawInfiniteGrid(ctx, width, height, background) {
    const { spacing, alpha } = BACKGROUND_CONFIG.grid;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    for (let y = -spacing + background.gridOffset; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawNebulae(ctx, width, height, background, time) {
    background.nebulae.forEach((nebula, index) => {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * nebula.scale);
        gradient.addColorStop(0, `hsla(${nebula.hue} ${nebula.saturation}% ${nebula.lightness}% / ${nebula.alpha})`);
        gradient.addColorStop(1, "transparent");
        ctx.save();
        ctx.translate(nebula.x, nebula.y);
        ctx.rotate(nebula.rotation + time * 0.05 * (index % 2 === 0 ? 1 : -1));
        ctx.scale(1 + Math.sin(time * 0.2 + index) * 0.05, 1 + Math.cos(time * 0.25 + index) * 0.05);
        ctx.fillStyle = gradient;
        ctx.fillRect(-400, -400, 800, 800);
        ctx.restore();
    });
}

function drawFlash(ctx, width, height, time, duration) {
    const alpha = Math.max(0, 0.35 * (time / duration));
    ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
    ctx.fillRect(0, 0, width, height);
}

function drawTrail(ctx, trail, time) {
    if (!trail.length) {
        return;
    }
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < trail.length - 1; i += 1) {
        const current = trail[i];
        const next = trail[i + 1];
        const alpha = Math.max(0, current.time / TRAIL_CONFIG.life);
        if (alpha <= 0) {
            continue;
        }
        const gradient = ctx.createLinearGradient(current.x, current.y, next.x, next.y);
        gradient.addColorStop(0, `rgba(14, 165, 233, ${alpha * 0.7})`);
        gradient.addColorStop(1, `rgba(56, 189, 248, ${alpha * 0.2})`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6 * alpha;
        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawPlayer(ctx, player, drones, time) {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    const bodyGradient = ctx.createLinearGradient(-player.width, 0, player.width, 0);
    bodyGradient.addColorStop(0, "#1d4ed8");
    bodyGradient.addColorStop(0.5, "#38bdf8");
    bodyGradient.addColorStop(1, "#22d3ee");

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(0, -player.height * 0.8);
    ctx.quadraticCurveTo(player.width * 0.55, -player.height * 0.2, player.width * 0.65, player.height * 0.4);
    ctx.lineTo(player.width * 0.15, player.height * 0.6);
    ctx.lineTo(0, player.height * 0.35);
    ctx.lineTo(-player.width * 0.15, player.height * 0.6);
    ctx.lineTo(-player.width * 0.65, player.height * 0.4);
    ctx.quadraticCurveTo(-player.width * 0.55, -player.height * 0.2, 0, -player.height * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
    ctx.beginPath();
    ctx.ellipse(0, -player.height * 0.25, player.width * 0.22, player.height * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    if (player.shield > 0) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(163, 230, 53, 0.55)";
        ctx.beginPath();
        ctx.arc(0, 0, player.width * 0.8, 0, Math.PI * 2);
        ctx.stroke();
    }

    const flamePulse = 1 + Math.sin(time * 20) * 0.25;
    ctx.fillStyle = `rgba(248, 113, 113, ${0.6 + 0.4 * Math.sin(time * 18)})`;
    ctx.beginPath();
    ctx.moveTo(-5, player.height * 0.6);
    ctx.quadraticCurveTo(0, player.height * (0.9 + 0.2 * flamePulse), 5, player.height * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (drones && drones.length) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
        drones.forEach((drone, index) => {
            const pulse = 1 + Math.sin(time * 6 + index) * 0.2;
            ctx.save();
            ctx.translate(drone.x, drone.y);
            ctx.beginPath();
            ctx.arc(0, 0, 8 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
            ctx.beginPath();
            ctx.arc(0, 0, 3 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
        });
    }
}

function drawInvaders(ctx, invaders, time) {
    invaders.forEach((inv, index) => {
        drawInvaderSprite(ctx, inv, time + index * 0.12);
        if (inv.health < inv.maxHealth) {
            drawHealthBar(ctx, inv.x, inv.y - 6, inv.width, inv.health / inv.maxHealth);
        }
    });
}

function drawInvaderSprite(ctx, inv, time) {
    const { key, color } = inv.type;
    const centerX = inv.x + inv.width / 2;
    const centerY = inv.y + inv.height / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.shadowColor = `${color}aa`;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;

    switch (key) {
        case "grunt": {
            ctx.beginPath();
            ctx.roundRect(-inv.width / 2, -inv.height / 2, inv.width, inv.height, 8);
            ctx.fill();
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(-inv.width / 3, -inv.height / 6, inv.width / 6, inv.height / 3);
            ctx.fillRect(inv.width / 6, -inv.height / 6, inv.width / 6, inv.height / 3);
            break;
        }
        case "striker": {
            ctx.beginPath();
            ctx.moveTo(0, -inv.height / 2);
            ctx.lineTo(inv.width / 2, inv.height / 3);
            ctx.lineTo(0, inv.height / 2);
            ctx.lineTo(-inv.width / 2, inv.height / 3);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "rgba(248, 250, 252, 0.8)";
            ctx.beginPath();
            ctx.arc(0, 0, inv.height / 4, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case "tank": {
            ctx.beginPath();
            ctx.roundRect(-inv.width / 2, -inv.height / 3, inv.width, inv.height * 2 / 3, 10);
            ctx.fill();
            ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
            ctx.fillRect(-inv.width / 2.5, -inv.height / 2.2, inv.width / 1.25, inv.height / 4);
            ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
            ctx.fillRect(-inv.width / 6, -inv.height / 2.4, inv.width / 3, inv.height / 5);
            break;
        }
        case "sapper": {
            ctx.beginPath();
            ctx.ellipse(0, 0, inv.width / 2, inv.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
            ctx.beginPath();
            ctx.moveTo(0, inv.height / 2);
            ctx.lineTo(inv.width / 3, inv.height / 2 + inv.height / 4);
            ctx.lineTo(-inv.width / 3, inv.height / 2 + inv.height / 4);
            ctx.closePath();
            ctx.fill();
            break;
        }
        case "warden": {
            const radius = Math.max(inv.width, inv.height) / 2;
            ctx.beginPath();
            for (let i = 0; i < 6; i += 1) {
                const angle = (Math.PI / 3) * i + Math.sin(time) * 0.05;
                const x = Math.cos(angle) * radius * 0.8;
                const y = Math.sin(angle) * radius * 0.8;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = "rgba(248, 250, 252, 0.8)";
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case "sniper": {
            ctx.rotate(Math.sin(time * 3) * 0.1);
            ctx.beginPath();
            ctx.roundRect(-inv.width / 2.2, -inv.height / 2, inv.width * 0.9, inv.height, 6);
            ctx.fill();
            ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
            ctx.fillRect(-inv.width / 10, -inv.height / 2, inv.width / 5, inv.height);
            break;
        }
        default: {
            ctx.beginPath();
            ctx.rect(-inv.width / 2, -inv.height / 2, inv.width, inv.height);
            ctx.fill();
            break;
        }
    }
    ctx.restore();
}

function drawBoss(ctx, boss, width, time) {
    ctx.save();
    ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2);
    const gradient = ctx.createLinearGradient(-boss.width / 2, 0, boss.width / 2, 0);
    gradient.addColorStop(0, "#f59e0b");
    gradient.addColorStop(0.5, "#fb7185");
    gradient.addColorStop(1, "#c084fc");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-boss.width / 2, boss.height / 2);
    ctx.lineTo(-boss.width / 2 + 48, -boss.height / 2);
    ctx.lineTo(0, -boss.height / 2 - Math.sin(time * 2) * 16);
    ctx.lineTo(boss.width / 2 - 48, -boss.height / 2);
    ctx.lineTo(boss.width / 2, boss.height / 2);
    ctx.closePath();
    ctx.fill();

    if (boss.shield > 0) {
        ctx.strokeStyle = "rgba(96, 165, 250, 0.7)";
        ctx.lineWidth = 6;
        ctx.stroke();
    }

    ctx.restore();

    const ratio = Math.max(0, boss.health / boss.maxHealth);
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    ctx.fillRect(width / 2 - boss.width / 2, boss.y + boss.height + 16, boss.width, 12);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(width / 2 - boss.width / 2, boss.y + boss.height + 16, boss.width * ratio, 12);
}

function drawShots(ctx, playerShots, enemyShots, time) {
    ctx.save();
    playerShots.forEach((shot, index) => {
        ctx.globalCompositeOperation = "lighter";
        const gradient = ctx.createLinearGradient(shot.x, shot.y, shot.x, shot.y + shot.height);
        gradient.addColorStop(0, shot.pierce ? "#38bdf8" : "#f8fafc");
        gradient.addColorStop(1, "rgba(56, 189, 248, 0.1)");
        ctx.fillStyle = gradient;
        ctx.fillRect(shot.x, shot.y, shot.width, shot.height);
    });
    ctx.restore();

    ctx.fillStyle = "#fb7185";
    enemyShots.forEach((shot) => {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillRect(shot.x, shot.y, shot.width, shot.height);
        ctx.restore();
    });
}

function drawPowerUps(ctx, powerUps, time) {
    powerUps.forEach((p, index) => {
        const gradient = ctx.createRadialGradient(
            p.x + p.width / 2,
            p.y + p.height / 2,
            4,
            p.x + p.width / 2,
            p.y + p.height / 2,
            p.width / 2
        );
        gradient.addColorStop(0, `${p.type.color}dd`);
        gradient.addColorStop(1, `${p.type.color}33`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = p.type.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
        ctx.font = "bold 10px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(p.type.label.charAt(0), p.x + p.width / 2, p.y + p.height / 2 + 3);
    });
}

function drawParticles(ctx, particles) {
    particles.forEach((particle) => {
        const alpha = Math.max(0, particle.life / particle.maxLife);
        const color = particle.color.replace("1)", `${alpha})`);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2.8, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawHealthBar(ctx, x, y, width, ratio) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    ctx.fillRect(x, y, width, 4);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(x, y, width * ratio, 4);
}

function drawCombo(ctx, combo, width, time) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
    ctx.font = "bold 26px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    const wobble = Math.sin(time * 6) * 6;
    ctx.fillText(`x${combo.multiplier.toFixed(2)} Combo`, width / 2, 120 + wobble);
    ctx.restore();
}
