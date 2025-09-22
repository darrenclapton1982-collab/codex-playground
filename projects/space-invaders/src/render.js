export function drawScene(ctx, state) {
    const { width, height, stars, player, invaders, playerShots, enemyShots } = state;

    drawBackground(ctx, width, height, stars);
    drawInvaders(ctx, invaders);
    drawShots(ctx, playerShots, enemyShots);
    drawPlayer(ctx, player);
}

function drawBackground(ctx, width, height, stars) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#03132a");
    gradient.addColorStop(1, "#050b19");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    stars.forEach((star) => {
        ctx.globalAlpha = star.a;
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();

    ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
    ctx.fillRect(0, height - 32, width, 32);
}

function drawPlayer(ctx, player) {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(0, -player.height / 2);
    ctx.lineTo(player.width / 2, player.height / 2);
    ctx.lineTo(0, player.height / 4);
    ctx.lineTo(-player.width / 2, player.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawInvaders(ctx, invaders) {
    ctx.fillStyle = "#fbbf24";
    invaders.forEach((inv) => {
        ctx.save();
        ctx.translate(inv.x + inv.width / 2, inv.y + inv.height / 2);
        ctx.scale(1.1, 1);
        ctx.beginPath();
        ctx.rect(-inv.width / 2, -inv.height / 2, inv.width, inv.height);
        ctx.fill();
        ctx.restore();
    });
}

function drawShots(ctx, playerShots, enemyShots) {
    ctx.fillStyle = "#f8fafc";
    playerShots.forEach((shot) => {
        ctx.fillRect(shot.x, shot.y, shot.width, shot.height);
    });

    ctx.fillStyle = "#f87171";
    enemyShots.forEach((shot) => {
        ctx.fillRect(shot.x, shot.y, shot.width, shot.height);
    });
}
