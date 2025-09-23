const AudioContext = window.AudioContext || window.webkitAudioContext;

export function createAudioController(config) {
    let ctx = null;
    let masterGain = null;
    let musicNode = null;
    let musicPlaying = false;

    function ensureContext() {
        if (!ctx) {
            try {
                ctx = new AudioContext();
                masterGain = ctx.createGain();
                masterGain.gain.value = 0.6;
                masterGain.connect(ctx.destination);
            } catch (error) {
                console.warn("Audio disabled", error);
            }
        }
        if (ctx?.state === "suspended") {
            ctx.resume().catch(() => {/* ignored */});
        }
    }

    function unlock() {
        ensureContext();
    }

    function playTone({ frequency, type = "sine", duration = 0.15, volume = 0.4 }) {
        if (!ctx) {
            return;
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.value = volume;
        osc.connect(gain);
        gain.connect(masterGain);
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
        osc.start(now);
        osc.stop(now + duration);
    }

    function playShoot(volume = config.sfx.shoot) {
        ensureContext();
        if (!ctx) {
            return;
        }
        playTone({ frequency: 880, type: "triangle", duration: 0.08, volume });
    }

    function playHit(volume = config.sfx.hit) {
        ensureContext();
        if (!ctx) {
            return;
        }
        playTone({ frequency: 220, type: "sawtooth", duration: 0.2, volume });
    }

    function playPower(volume = config.sfx.power) {
        ensureContext();
        if (!ctx) {
            return;
        }
        playTone({ frequency: 520, type: "square", duration: 0.25, volume });
    }

    function playExplosion(volume = config.sfx.explode) {
        ensureContext();
        if (!ctx) {
            return;
        }
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i += 1) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        noise.connect(gain);
        gain.connect(masterGain);
        noise.start();
    }

    function startMusic() {
        ensureContext();
        if (!ctx || musicPlaying) {
            return;
        }
        const now = ctx.currentTime;
        const beat = 60 / config.music.bpm;
        const sequence = [0, 2, 4, 7, 9, 11];
        musicNode = ctx.createGain();
        musicNode.gain.value = config.music.volume;
        musicNode.connect(masterGain);
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.connect(musicNode);
        sequence.forEach((step, index) => {
            const t = now + beat * index;
            const freq = 220 * Math.pow(2, step / 12);
            osc.frequency.setValueAtTime(freq, t);
        });
        osc.frequency.setValueAtTime(220, now + beat * sequence.length);
        osc.start(now);
        osc.stop(now + beat * sequence.length + 0.001);
        musicPlaying = true;
        osc.onended = () => {
            musicPlaying = false;
            startMusic();
        };
    }

    return {
        unlock,
        start() {
            ensureContext();
            if (!ctx) {
                return;
            }
            ctx.resume().catch(() => {/* ignored */});
            startMusic();
        },
        stopMusic() {
            if (musicNode) {
                musicNode.disconnect();
                musicNode = null;
            }
            musicPlaying = false;
        },
        playShoot,
        playHit,
        playPower,
        playExplosion,
        dispose() {
            if (ctx && ctx.state !== "closed") {
                ctx.close();
            }
            ctx = null;
        }
    };
}
