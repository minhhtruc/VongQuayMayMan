// ===== CẤU HÌNH =====
// const FORCE_NUMBERS = [15, 6, 35, 10, 50, 14, 17, 34, 56, 22];
// const BLACKLIST = [4, 9, 49, 30, 29, 39, 54, 64, 23];

// ===== BIẾN =====
let validNumbers = [];
let wheelNumbers = []; // Tất cả số hiển thị trên vòng (bao gồm blacklist)
let forcedMap = new Map();
let spinCount = 0;
let lastMin = null;
let lastMax = null;

// ===== CANVAS =====
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
let currentAngle = 0;
let spinning = false;

// ===== ÂM THANH (Web Audio API - không cần file) =====
let audioCtx = null;

function getAudioCtx() {
    // Tạo AudioContext khi cần (trình duyệt yêu cầu phải có tương tác người dùng trước)
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

// Tiếng "tic" mỗi khi vòng quay đi qua 1 ô số
function playTick() {
    const ac = getAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "square";
    osc.frequency.value = 1000;

    gain.gain.setValueAtTime(0.15, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start();
    osc.stop(ac.currentTime + 0.05);
}

// Tiếng chuông "ting" khi có kết quả
function playWinSound() {
    const ac = getAudioCtx();
    const now = ac.currentTime;
    const notes = [880, 1108, 1318]; // hợp âm vui tai

    notes.forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        const startTime = now + i * 0.08;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
    });
}

// ===== QUAY =====
function spin() {
    if (spinning) return;

    const min = +document.getElementById("min").value;
    const max = +document.getElementById("max").value;

    if (isNaN(min) || isNaN(max) || min >= max) {
        alert("Khoảng số không hợp lệ!");
        return;
    }

    if (min !== lastMin || max !== lastMax) resetData(min, max);

    if (!validNumbers.length) {
        alert("Hết số!");
        return;
    }

    spinCount++;
    let value;

    // ===== XÁC ĐỊNH SỐ TRÚNG =====
    // --- ĐÃ TẮT: cơ chế ép số cho 10 lượt quay đầu ---
    // if (spinCount <= 10 && spinCount <= FORCE_NUMBERS.length) {
    //     value = FORCE_NUMBERS[spinCount - 1];
    // } else {
    //     if (!validNumbers.length) {
    //         alert("Hết số!");
    //         return;
    //     }
    //     value = validNumbers[Math.floor(Math.random() * validNumbers.length)];
    // }

    // --- ĐANG DÙNG: ngẫu nhiên 100% mọi lượt ---
    value = validNumbers[Math.floor(Math.random() * validNumbers.length)];

    // ===== QUAY VỚI TẤT CẢ SỐ =====
    spinWheelTo(value, wheelNumbers, () => {
        // ===== HIỂN THỊ SAU KHI QUAY XONG VỚI ANIMATION =====
        const resultEl = document.getElementById("result");
        resultEl.classList.remove("show-result");
        resultEl.innerText = value;
        setTimeout(() => resultEl.classList.add("show-result"), 10);

        // ===== XOÁ SAU KHI QUAY =====
        validNumbers = validNumbers.filter(n => n !== value);
    });
}

// ===== RESET DATA =====
function resetData(min, max) {
    spinCount = 0;
    forcedMap.clear();
    currentAngle = 0;

    // --- ĐÃ TẮT: lọc số ép ra khỏi danh sách hợp lệ ---
    // const forced = FORCE_NUMBERS.filter(
    //     n => n >= min && n <= max && !BLACKLIST.includes(n)
    // );

    const all = Array.from({ length: max - min + 1 }, (_, i) => i + min);

    // Tất cả số hiển thị trên vòng (bao gồm blacklist)
    wheelNumbers = [...all];

    // --- ĐÃ TẮT: chỉ số hợp lệ để quay (không có blacklist và forced) ---
    // validNumbers = all.filter(n => !BLACKLIST.includes(n) && !forced.includes(n));

    // --- ĐANG DÙNG: tất cả số đều hợp lệ để quay ngẫu nhiên ---
    validNumbers = [...all];

    drawWheel(wheelNumbers);
    lastMin = min;
    lastMax = max;
}

// ===== RESET GAME =====
function resetGame() {
    spinCount = 0;
    forcedMap.clear();
    validNumbers = [];
    wheelNumbers = [];
    lastMin = lastMax = null;
    currentAngle = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("result").innerText = "---";

    // Dọn confetti còn sót lại trên màn hình
    confettiParticles = [];
    if (confettiCtx) confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// ===== VẼ VÒNG =====
function drawWheel(numbers, winningNumber = null) {
    if (!numbers.length) return;

    const c = canvas.width / 2;
    const r = c - 8;
    const step = (2 * Math.PI) / numbers.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    numbers.forEach((num, i) => {
        const start = currentAngle + i * step;
        const end = start + step;
        const isWinner = winningNumber === num;

        // Gradient đẹp hơn với màu sắc phong phú
        const colors = [
            ["#ff6b9d", "#c44569"],
            ["#ffa36c", "#ee6352"],
            ["#ffca3a", "#ff924c"],
            ["#8ac926", "#52b788"],
            ["#6a4c93", "#9d4edd"]
        ];
        const colorPair = colors[i % colors.length];

        const grad = ctx.createRadialGradient(c, c, 20, c, c, r);
        if (isWinner) {
            grad.addColorStop(0, "#ffd700");
            grad.addColorStop(1, "#ff8c00");
        } else {
            grad.addColorStop(0, colorPair[0]);
            grad.addColorStop(1, colorPair[1]);
        }

        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.arc(c, c, r, start, end);
        ctx.fillStyle = grad;
        ctx.fill();

        // Border segment
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = isWinner ? 3 : 1.5;
        ctx.stroke();

        // Highlight winner with glow
        if (isWinner) {
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 20;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Text
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(start + step / 2);
        ctx.textAlign = "right";

        if (isWinner) {
            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px sans-serif";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.strokeText(num, r - 12, 6);
        } else {
            ctx.fillStyle = "#1a1a1a";
            ctx.font = "bold 14px sans-serif";
        }

        ctx.fillText(num, r - 12, 6);
        ctx.restore();
    });
}

// ===== HIỆU ỨNG CONFETTI (pháo giấy) =====
let confettiCanvas = null;
let confettiCtx = null;
let confettiParticles = [];
let confettiAnimId = null;

function getConfettiCanvas() {
    if (confettiCanvas) return confettiCanvas;

    confettiCanvas = document.createElement("canvas");
    confettiCanvas.style.position = "fixed";
    confettiCanvas.style.top = "0";
    confettiCanvas.style.left = "0";
    confettiCanvas.style.width = "100vw";
    confettiCanvas.style.height = "100vh";
    confettiCanvas.style.pointerEvents = "none";
    confettiCanvas.style.zIndex = "9999";
    document.body.appendChild(confettiCanvas);

    function resize() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    confettiCtx = confettiCanvas.getContext("2d");
    return confettiCanvas;
}

function launchConfetti() {
    const cv = getConfettiCanvas();
    const colors = ["#ff6b9d", "#ffca3a", "#8ac926", "#6a4c93", "#1982c4", "#ff924c", "#ffd700"];
    const centerX = cv.width / 2;
    const topY = cv.height * 0.25;
    const count = 140;

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 9;
        confettiParticles.push({
            x: centerX + (Math.random() - 0.5) * 120,
            y: topY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 6,
            size: 6 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            life: 0,
            maxLife: 90 + Math.random() * 40
        });
    }

    if (!confettiAnimId) animateConfetti();
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach(p => {
        p.vy += 0.18; // trọng lực
        p.vx *= 0.99; // cản gió
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life++;

        const fade = Math.max(0, 1 - p.life / p.maxLife);
        confettiCtx.save();
        confettiCtx.globalAlpha = fade;
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rotation);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        confettiCtx.restore();
    });

    confettiParticles = confettiParticles.filter(p => p.life < p.maxLife && p.y < confettiCanvas.height + 50);

    if (confettiParticles.length > 0) {
        confettiAnimId = requestAnimationFrame(animateConfetti);
    } else {
        confettiAnimId = null;
    }
}

// ===== QUAY MƯỢT =====
function spinWheelTo(value, numbers, onComplete) {
    spinning = true;

    const index = numbers.indexOf(value);
    const step = (2 * Math.PI) / numbers.length;

    // Pointer ở trên (270 độ = -90 độ), tính target để số thắng nằm ở giữa ô tại vị trí pointer
    const targetPosition = -Math.PI / 2 - index * step - step / 2;
    const target = currentAngle + (10 * Math.PI * 2) + (targetPosition - (currentAngle % (Math.PI * 2)));

    const start = currentAngle;
    const duration = 4200;
    const begin = performance.now();

    // Theo dõi ô đang nằm dưới pointer để biết khi nào kim "đi qua" một ô mới -> phát tiếng tic
    function getPointerSlot(angle) {
        // Vị trí ô tại pointer (-90 độ), ngược với cách tính targetPosition ở trên
        const rel = (-Math.PI / 2 - angle) % (2 * Math.PI);
        const normalized = ((rel % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        return Math.floor(normalized / step);
    }
    let lastSlot = getPointerSlot(currentAngle);

    function animate(t) {
        const p = Math.min((t - begin) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        currentAngle = start + (target - start) * ease;
        drawWheel(numbers, p === 1 ? value : null);

        // Phát tiếng tic mỗi lần kim đi qua một ô mới
        const slot = getPointerSlot(currentAngle);
        if (slot !== lastSlot) {
            playTick();
            lastSlot = slot;
        }

        if (p < 1) {
            requestAnimationFrame(animate);
        } else {
            spinning = false;
            playWinSound();
            launchConfetti();
            if (onComplete) onComplete();
        }
    }

    requestAnimationFrame(animate);
}

// ===== TIỆN ÍCH =====
function generateNonAdjacentSlots(total, count) {
    const arr = Array.from({ length: total }, (_, i) => i + 1);
    shuffleArray(arr);
    const res = [];
    for (const n of arr) {
        if (
            res.length < count &&
            !res.includes(n - 1) &&
            !res.includes(n + 1)
        ) res.push(n);
    }
    return res;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
