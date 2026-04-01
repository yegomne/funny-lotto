document.addEventListener('DOMContentLoaded', () => {
    // 1. Particle Background Generation
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Randomize size, position, and animation duration
        const size = Math.random() * 4 + 1; // 1px to 5px
        const posX = Math.random() * 100; // 0% to 100%
        const delay = Math.random() * 10; // 0s to 10s
        const duration = Math.random() * 10 + 10; // 10s to 20s
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        particlesContainer.appendChild(particle);
    }

    // 2. Screen Transition Logic
    const gameCards = document.querySelectorAll('.game-card');
    const backButtons = document.querySelectorAll('.back-btn');
    const screens = document.querySelectorAll('.screen');

    function switchScreen(targetScreenId) {
        // Fade out all screens
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Small delay to allow fade out before bringing in the new screen
        setTimeout(() => {
            const targetScreen = document.getElementById(targetScreenId);
            if(targetScreen) {
                targetScreen.classList.add('active');
            }
        }, 100); // 100ms matches the start of the CSS transition loosely
    }

    // Add click events to cards to go to specific games
    gameCards.forEach(card => {
        // hover sound
        card.addEventListener('mouseenter', () => {
            if(window.soundManager) window.soundManager.playHover();
        });
        card.addEventListener('click', () => {
            if(window.soundManager) window.soundManager.playClick();
            const targetId = card.getAttribute('data-target');
            switchScreen(targetId);
        });
    });

    // Add click events to back buttons to return to main
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if(window.soundManager) window.soundManager.playClick();
            switchScreen('main-screen');
        });
    });

    // 3. Lotto Number Generation Logic
    let pickedNumbers = [];
    const maxNumbers = 6;
    const slots = document.querySelectorAll('.slot');
    const resetBtn = document.getElementById('reset-btn');

    // Function to pick a new number without duplicates
    function pickNumber(forcedNumber = null) {
        if (pickedNumbers.length >= maxNumbers) {
            console.warn('추첨이 이미 완료되었습니다!');
            return null;
        }

        let newNum;
        if (forcedNumber !== null) {
            if (pickedNumbers.includes(forcedNumber)) {
                console.warn('이미 뽑힌 번호입니다:', forcedNumber);
                return null;
            }
            newNum = forcedNumber;
        } else {
            do {
                newNum = Math.floor(Math.random() * 45) + 1;
            } while (pickedNumbers.includes(newNum));
        }

        pickedNumbers.push(newNum);
        updateSlots();
        return newNum;
    }

    // Function to update the glowing slots visually
    function updateSlots() {
        slots.forEach((slot, index) => {
            if (index < pickedNumbers.length) {
                slot.textContent = pickedNumbers[index];
                if (!slot.classList.contains('filled')) {
                    slot.classList.add('filled');
                    if(window.soundManager) window.soundManager.playResultDrop();
                }
            } else {
                slot.textContent = '';
                slot.classList.remove('filled');
            }
        });
    }

    // Function to reset everything
    function resetLotto() {
        if(window.soundManager) window.soundManager.playReset();
        pickedNumbers = [];
        updateSlots();
        window.dispatchEvent(new CustomEvent('resetLotto'));
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetLotto);
    }

    // 전역에서 게임 스크립트들이 접근할 수 있도록 노출
    window.lottoGame = {
        pickNumber,
        resetLotto,
        getPickedNumbers: () => [...pickedNumbers]
    };
});
