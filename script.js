// ===== CẤU HÌNH NỘI BỘ =====

// 4 số bắt buộc xuất hiện (KHÔNG liền nhau trong 10 lượt đầu)
const FORCE_NUMBERS = [6, 17, 22, 50];

// Số không bao giờ xuất hiện
const BLACKLIST = [4, 9, 49, 30, 29, 39, 54, 64, 23];

// ===========================

let validNumbers = [];
let forcedSlots = [];
let forcedMap = new Map();
let spinCount = 0;
let lastMin = null;
let lastMax = null;

// ===== QUAY SỐ =====
function spin() {
    const min = parseInt(document.getElementById("min").value);
    const max = parseInt(document.getElementById("max").value);

    if (isNaN(min) || isNaN(max) || min >= max) {
        alert("Khoảng số không hợp lệ!");
        return;
    }

    // Nếu đổi khoảng → reset dữ liệu
    if (min !== lastMin || max !== lastMax) {
        resetData(min, max);
    }

    spinCount++;

    let value;

    // 10 lượt đầu: ưu tiên số bắt buộc (đã xen kẽ)
    if (spinCount <= 10 && forcedMap.has(spinCount)) {
        value = forcedMap.get(spinCount);
    } 
    // Random bình thường
    else {
        if (validNumbers.length === 0) {
            document.getElementById("result").innerText = "Hết số!";
            return;
        }

        const index = Math.floor(Math.random() * validNumbers.length);
        value = validNumbers[index];
        validNumbers.splice(index, 1);
    }

    document.getElementById("result").innerText = value;
}

// ===== RESET DATA KHI ĐỔI KHOẢNG =====
function resetData(min, max) {
    spinCount = 0;
    forcedMap.clear();

    // Lọc số bắt buộc hợp lệ
    const forced = FORCE_NUMBERS.filter(
        n => n >= min && n <= max && !BLACKLIST.includes(n)
    );

    // Chọn vị trí KHÔNG LIỀN NHAU trong 10 lượt đầu
    forcedSlots = generateNonAdjacentSlots(10, forced.length);

    shuffleArray(forced);
    forcedSlots.forEach((slot, i) => {
        forcedMap.set(slot, forced[i]);
    });

    // Danh sách random thường
    const allNumbers = Array.from(
        { length: max - min + 1 },
        (_, i) => i + min
    );

    validNumbers = allNumbers.filter(
        n => !BLACKLIST.includes(n) && !forced.includes(n)
    );

    lastMin = min;
    lastMax = max;
}

// ===== RESET NÚT BẤM (ĐÃ FIX) =====
function resetGame() {
    spinCount = 0;
    forcedMap.clear();
    validNumbers = [];
    forcedSlots = [];
    lastMin = null;
    lastMax = null;

    document.getElementById("result").innerText = "---";
}

// ===== TIỆN ÍCH =====
function generateNonAdjacentSlots(total, count) {
    const slots = [];
    const candidates = Array.from({ length: total }, (_, i) => i + 1);

    shuffleArray(candidates);

    for (const pos of candidates) {
        if (
            slots.length < count &&
            !slots.includes(pos - 1) &&
            !slots.includes(pos + 1)
        ) {
            slots.push(pos);
        }
    }

    return slots.slice(0, count);
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
