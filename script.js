// ===== CẤU HÌNH =====
const FORCE_NUMBERS = [6, 17, 22, 50];
const BLACKLIST = [4, 9, 49, 30, 29, 39, 54, 64, 23];

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

// ===== QUAY =====
// ===== QUAY (ĐÃ FIX) =====
function spin() {
    if (spinning) return;

    const min = +document.getElementById("min").value;
    const max = +document.getElementById("max").value;

    if (isNaN(min) || isNaN(max) || min >= max) {
        alert("Khoảng số không hợp lệ!");
        return;
    }

    if (min !== lastMin || max !== lastMax) resetData(min, max);

    spinCount++;
    let value;

    // ===== XÁC ĐỊNH SỐ TRÚNG =====
    if (spinCount <= 10 && forcedMap.has(spinCount)) {
        value = forcedMap.get(spinCount);
    } else {
        if (!validNumbers.length) {
            alert("Hết số!");
            return;
        }
        value = validNumbers[Math.floor(Math.random() * validNumbers.length)];
    }

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

    const forced = FORCE_NUMBERS.filter(
        n => n >= min && n <= max && !BLACKLIST.includes(n)
    );

    const slots = generateNonAdjacentSlots(10, forced.length);
    shuffleArray(forced);
    slots.forEach((s, i) => forcedMap.set(s, forced[i]));

    const all = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    
    // Tất cả số hiển thị trên vòng (bao gồm blacklist)
    wheelNumbers = [...all];
    
    // Chỉ số hợp lệ để quay (không có blacklist và forced)
    validNumbers = all.filter(n => !BLACKLIST.includes(n) && !forced.includes(n));

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

    function animate(t) {
        const p = Math.min((t - begin) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        currentAngle = start + (target - start) * ease;
        drawWheel(numbers, p === 1 ? value : null);

        if (p < 1) {
            requestAnimationFrame(animate);
        } else {
            spinning = false;
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
