const CODES = {
    GEAR_N: 'KeyN',
    GEAR_1: 'Digit1',
    GEAR_2: 'Digit2',
    GEAR_3: 'Digit3',
    GEAR_4: 'Digit4',
    GEAR_5: 'Digit5',
    GEAR_6: 'Digit6',
    GEAR_SUPER: 'Backslash',
    CLUTCH: 'AltLeft',
    ACCEL: 'KeyW',
    BRAKE: 'KeyS'
};

const GEARS_CONFIG = {
    [CODES.GEAR_N]: {
        maxSpeed: 1,
        accel: 0,
        step: 0.5,
        value: 'N'
    },

    [CODES.GEAR_1]: {
        maxSpeed: 20,
        accel: 0.15,
        step: 5,
        value: 1
    },

    [CODES.GEAR_2]: {
        maxSpeed: 40,
        accel: 0.3,
        step: 10,
        value: 2
    },

    [CODES.GEAR_3]: {
        maxSpeed: 70,
        accel: 0.5,
        step: 15,
        value: 3
    },

    [CODES.GEAR_4]: {
        maxSpeed: 90,
        accel: 0.7,
        step: 25,
        value: 4
    },

    [CODES.GEAR_5]: {
        maxSpeed: 120,
        accel: 0.8,
        step: 25,
        value: 5
    },
};

function playSound(path,volume) {
    let audio = new Audio(path)

    volume = volume || 1

    if (audio) {
        audio.volume = volume
        audio.currentTime = 0
        audio.play()

        return audio
    }
}

const elements = {
    numbersBar: document.querySelector('.numbers-part'),
    gearLabel: document.getElementById('car-gear-label'),
    background: document.querySelector('.background-box'),
    speedBar: document.querySelector('.current-speed'),
    pedals: document.querySelectorAll('.pedal'),
    road: document.querySelector('.road-box'),
    distanceLabel: document.getElementById('distance-label'),
};

let KEYS_PRESSED = new Set();
let lastGearToggle = 0;
let distance = 0;
let msgInterval, msgTimeout;

class Transport {
    constructor(type, driver, speedLimit, speedGrow, brakePower) {
        this.type = type;
        this.driver = driver;
        this.speedLimit = speedLimit;
        this.speedGrow = speedGrow;
        this.brakePower = brakePower;
        this.speed = 0;
        this.gear = 'N';
        this.engine = true;
        this.bgOffset = 0;
        this.friction = 0.1;

        createSpeedMarks(speedLimit, 50);
    }

    setGear(gearConfig) {
        const now = Date.now();
        if (now - lastGearToggle < 3000) {
            return;
        }

        playSound('./sounds/gear-sound.mp3',1)

        lastGearToggle = now;
        this.speedLimit = gearConfig.maxSpeed;
        this.gear = gearConfig.value;
        this.speedGrow = gearConfig.accel;
        elements.gearLabel.textContent = gearConfig.value;

        createSpeedMarks(gearConfig.maxSpeed, gearConfig.step);
    }
}

const car = new Transport('Kamaz', 'Den4ik', 300, 0.5, 0.8);

function createSpeedMarks(max, step) {
    elements.numbersBar.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let i = 0; i <= max; i += step) {
        const mark = document.createElement('p');
        mark.textContent = i;
        fragment.appendChild(mark);
    }

    if (max % step !== 0) {
        const lastMark = document.createElement('p');
        lastMark.textContent = max;
        fragment.appendChild(lastMark);
    }
    elements.numbersBar.appendChild(fragment);
}

document.addEventListener('keydown', (e) => {
    const code = e.code;
    KEYS_PRESSED.add(code);

    if (GEARS_CONFIG[code] && KEYS_PRESSED.has(CODES.CLUTCH)) {
        if (car.speed < GEARS_CONFIG[code].maxSpeed) {
            car.setGear(GEARS_CONFIG[code]);
        }
    }

    if (code == CODES.CLUTCH) {
        playSound('./sounds/pedal-sound.mp3',0.2)
    }

    if (code === CODES.ACCEL) elements.pedals[2].classList.add('active');
    if (code === CODES.BRAKE) elements.pedals[1].classList.add('active');
    if (code === CODES.CLUTCH) elements.pedals[0].classList.add('active');
});

document.addEventListener('keyup', (e) => {
    const code = e.code;
    KEYS_PRESSED.delete(code);

    if (code === CODES.ACCEL) elements.pedals[2].classList.remove('active');
    if (code === CODES.BRAKE) elements.pedals[1].classList.remove('active');
    if (code === CODES.CLUTCH) elements.pedals[0].classList.remove('active');
});

function updateFrame() {
    if (!car) return;

    const isClutchPressed = KEYS_PRESSED.has(CODES.CLUTCH);
    const isAccelPressed = KEYS_PRESSED.has(CODES.ACCEL);
    const isBrakePressed = KEYS_PRESSED.has(CODES.BRAKE);

    const shouldGass = car.engine && isAccelPressed && !isClutchPressed && car.gear !== 'N';

    if (shouldGass && car.speed < car.speedLimit) {
        car.speed += car.speedGrow;
    }

    if (car.engine && !isClutchPressed && car.gear !== 'N') {
        if (isBrakePressed && car.speed > 0) {
            car.speed -= car.brakePower;
        }
    }

    if (car.speed > 0) car.speed -= car.friction;
    if (car.speed < 0) car.speed = 0;

    car.bgOffset -= car.speed;
    if (elements.background) {
        elements.background.style.backgroundPositionX = `${car.bgOffset / 10}px`;
        elements.road.style.backgroundPositionX = `${car.bgOffset / 10}px`;
    }

    distance += car.speed / 6000

    elements.distanceLabel.textContent = distance.toFixed(0) + 'km'

    if (elements.speedBar) {
        const percent = (car.speed / car.speedLimit) * 100;
        elements.speedBar.style.width = `${Math.min(percent, 100)}%`;
    }

    requestAnimationFrame(updateFrame);
}

updateFrame();