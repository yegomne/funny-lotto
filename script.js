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

        // Hide all global auto buttons
        document.querySelectorAll('.global-auto-btn').forEach(btn => {
            btn.style.display = 'none';
        });

        // Small delay to allow fade out before bringing in the new screen
        setTimeout(() => {
            const targetScreen = document.getElementById(targetScreenId);
            if(targetScreen) {
                targetScreen.classList.add('active');
                
                // Show specific auto button
                if (targetScreenId === 'game-screen-1') {
                    const btn = document.getElementById('auto-btn-1');
                    if (btn) btn.style.display = 'block';
                } else if (targetScreenId === 'game-screen-2') {
                    const btn = document.getElementById('auto-btn-2');
                    if (btn) btn.style.display = 'block';
                } else if (targetScreenId === 'game-screen-3') {
                    const btn = document.getElementById('auto-btn-3');
                    if (btn) btn.style.display = 'block';
                }
            }
        }, 100); // 100ms matches the start of the CSS transition loosely
    }

    // Scroll Arrow Logic for Main Screen
    const cardContainer = document.querySelector('.card-container');
    const topArrow = document.querySelector('.scroll-arrow.top-arrow');
    const bottomArrow = document.querySelector('.scroll-arrow.bottom-arrow');

    function updateScrollArrows() {
        if (!cardContainer || !topArrow || !bottomArrow) return;
        
        // Ensure parent is visible to calculate correctly
        if (cardContainer.offsetParent === null) return;
        
        const isOverflowing = cardContainer.scrollHeight > cardContainer.clientHeight;
        
        if (isOverflowing) {
            if (cardContainer.scrollTop > 5) {
                topArrow.classList.add('visible');
            } else {
                topArrow.classList.remove('visible');
            }
            
            if (cardContainer.scrollTop + cardContainer.clientHeight < cardContainer.scrollHeight - 5) {
                bottomArrow.classList.add('visible');
            } else {
                bottomArrow.classList.remove('visible');
            }
        } else {
            topArrow.classList.remove('visible');
            bottomArrow.classList.remove('visible');
        }
    }

    if (cardContainer) {
        cardContainer.addEventListener('scroll', updateScrollArrows);
        window.addEventListener('resize', updateScrollArrows);
        // Initial check after a slight delay to allow rendering/fonts
        setTimeout(updateScrollArrows, 300);
        
        // Also update when switching to main screen
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active') && mutation.target.id === 'main-screen') {
                    setTimeout(updateScrollArrows, 100);
                }
            });
        });
        const mainScreen = document.getElementById('main-screen');
        if (mainScreen) {
            observer.observe(mainScreen, { attributes: true, attributeFilter: ['class'] });
        }
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

    // Custom Confirm Modal Logic
    const confirmModal = document.getElementById('custom-confirm-modal');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    function showConfirmModal(onConfirm) {
        if(window.soundManager) window.soundManager.playHover();
        confirmModal.classList.add('show');
        
        const newConfirmBtn = modalConfirmBtn.cloneNode(true);
        const newCancelBtn = modalCancelBtn.cloneNode(true);
        modalConfirmBtn.parentNode.replaceChild(newConfirmBtn, modalConfirmBtn);
        modalCancelBtn.parentNode.replaceChild(newCancelBtn, modalCancelBtn);

        newConfirmBtn.addEventListener('click', () => {
            if(window.soundManager) window.soundManager.playClick();
            confirmModal.classList.remove('show');
            onConfirm();
        });

        newCancelBtn.addEventListener('click', () => {
            if(window.soundManager) window.soundManager.playClick();
            confirmModal.classList.remove('show');
        });
    }

    // Add click events to back buttons to return to main
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.lottoGame && window.lottoGame.isAnyGameRunning && window.lottoGame.isAnyGameRunning()) {
                showConfirmModal(() => {
                    window.lottoGame.resetLotto();
                    if(window.soundManager) window.soundManager.playClick();
                    switchScreen('main-screen');
                });
            } else {
                if(window.soundManager) window.soundManager.playClick();
                switchScreen('main-screen');
            }
        });
    });

    // Custom Premium Toggle Logic
    const premiumToggle = document.getElementById('premium-toggle');
    const premiumWrapper = document.getElementById('premium-wrapper');
    const premiumLabelText = document.getElementById('premium-label-text');
    const premiumStatus = document.getElementById('premium-status');

    let isPremiumMode = false;
    let premiumNumbers = [];
    
    if (premiumToggle) {
        premiumToggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                premiumWrapper.classList.add('active');
                premiumStatus.textContent = 'API 연결 중...';
                premiumStatus.style.color = '#1dd1a1';
                if(window.soundManager) window.soundManager.playClick();
                
                try {
                    const res = await fetch('https://funny-lotto.onrender.com/api/premium');
                    if (!res.ok) throw new Error('API 오류');
                    const data = await res.json();
                    
                    if (data.numbers && data.numbers.length === 6) {
                        isPremiumMode = true;
                        premiumNumbers = data.numbers;
                        premiumStatus.textContent = '연결 완료! VIP 번호 대기중';
                        if(window.soundManager && window.soundManager.playResultDrop) window.soundManager.playResultDrop();
                    } else {
                        throw new Error('유효하지 않은 데이터');
                    }
                } catch (err) {
                    console.error('프리미엄 API 연결 실패:', err);
                    isPremiumMode = false;
                    premiumToggle.checked = false;
                    premiumWrapper.classList.remove('active');
                    premiumLabelText.style.color = '';
                    premiumStatus.textContent = '연결 실패! (API 서버를 실행해주세요)';
                    premiumStatus.style.color = '#ff4757';
                    if(window.soundManager && window.soundManager.playTargetBounce) window.soundManager.playTargetBounce();
                }
            } else {
                isPremiumMode = false;
                premiumNumbers = [];
                premiumWrapper.classList.remove('active');
                premiumStatus.textContent = '';
                if(window.soundManager) window.soundManager.playClick();
            }
        });
    }

    // 3. Lotto Number Generation Logic
    let pickedNumbers = [];
    const maxNumbers = 6;
    const slots = document.querySelectorAll('.slot');
    const resetBtn = document.getElementById('reset-btn');
    const copyBtn = document.getElementById('copy-btn');

    function getNextPremiumNumber() {
        if (isPremiumMode && premiumNumbers && premiumNumbers.length > pickedNumbers.length) {
            return premiumNumbers[pickedNumbers.length];
        }
        return null;
    }

    // Function to pick a new number without duplicates
    function pickNumber(forcedNumber = null) {
        if (pickedNumbers.length >= maxNumbers) {
            console.warn('추첨이 이미 완료되었습니다!');
            return null;
        }

        let newNum;
        
        // 꼼수: 프리미엄 모드가 켜져 있다면 모든 추출 방식을 무시하고 프리미엄 번호를 강제 배정합니다!
        if (isPremiumMode && premiumNumbers.length > pickedNumbers.length) {
            newNum = premiumNumbers[pickedNumbers.length];
        } else if (forcedNumber !== null) {
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
                const num = pickedNumbers[index];
                slot.textContent = num;
                
                // Color mapping
                let colorClass = '';
                if(num <= 10) colorClass = 'c-10';
                else if(num <= 20) colorClass = 'c-20';
                else if(num <= 30) colorClass = 'c-30';
                else if(num <= 40) colorClass = 'c-40';
                else colorClass = 'c-50';

                // remove existing color classes to prevent overlap
                slot.className = slot.className.replace(/c-\d0/g, '').trim();
                slot.classList.add(colorClass);

                if (!slot.classList.contains('filled')) {
                    slot.classList.add('filled');
                    if(window.soundManager) window.soundManager.playResultDrop();
                }
            } else {
                slot.textContent = '';
                slot.className = slot.className.replace(/c-\d0/g, '').trim();
                slot.classList.remove('filled');
            }
        });

        // 6개 모두 뽑히면 복사 버튼 표시 및 JACKPOT 피날레
        if (copyBtn) {
            if (pickedNumbers.length === maxNumbers) {
                copyBtn.classList.add('show');
                fireJackpotFinale(); // 피날레 실행
            } else {
                copyBtn.classList.remove('show');
            }
        }
    }

    // Function to reset everything
    function resetLotto() {
        if(window.soundManager) window.soundManager.playReset();
        pickedNumbers = [];
        updateSlots();
        
        // 피날레 초기화
        clearInterval(finaleInterval);
        const jackpotOverlay = document.getElementById('jackpot-overlay');
        const jackpotText = jackpotOverlay ? jackpotOverlay.querySelector('.jackpot-text') : null;
        if(jackpotOverlay && jackpotText) {
            jackpotText.classList.remove('show');
            setTimeout(() => {
                jackpotOverlay.style.display = 'none';
            }, 800); // css transition 시간 기다림
        }

        window.dispatchEvent(new CustomEvent('resetLotto'));
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetLotto);
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if(window.soundManager) window.soundManager.playClick();
            
            // 번호를 정렬해서 보기 좋게 만듭니다
            const sortedNumbers = [...pickedNumbers].sort((a, b) => a - b);
            const textToCopy = `🚀 재미로 보는 Funny Lotto 행운의 번호: ${sortedNumbers.join(', ')}`;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '복사 완료! ✔';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                console.error('클립보드 복사 실패:', err);
                alert('클립보드 복사에 실패했습니다.');
            });
        });
    }

    // --- Jackpot 피날레 함수 ---
    let finaleInterval;
    function fireJackpotFinale() {
        if(window.soundManager) window.soundManager.playJackpotFinale();

        const jackpotOverlay = document.getElementById('jackpot-overlay');
        if(!jackpotOverlay) return;

        const jackpotText = jackpotOverlay.querySelector('.jackpot-text');
        
        jackpotOverlay.style.display = 'flex';
        // CSS transition 트리거를 위해 리플로우
        void jackpotOverlay.offsetWidth;
        jackpotText.classList.add('show');

        // 무중력 콘페티 (canvas-confetti)
        const duration = 5000;
        const animationEnd = Date.now() + duration;

        // 파티클 여러 번 쏴서 화면에 흩날리게 유지
        finaleInterval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(finaleInterval);
            }

            const particleCount = 20 * (timeLeft / duration);
            
            // 랜덤한 위치에서 떨어지도록
            if (window.confetti) {
                confetti({
                    particleCount: particleCount,
                    startVelocity: 30,
                    spread: 360,
                    ticks: 300,
                    gravity: 0.1, // 아주 가벼운 중력으로 무중력 느낌
                    drift: (Math.random() - 0.5) * 2, // 옆으로도 살짝 흩날리게
                    origin: { x: Math.random(), y: Math.random() - 0.2 },
                    colors: ['#00f3ff', '#9d00ff', '#ff00ea', '#ffffff', '#ffd700'],
                    zIndex: 9999
                });
            }
        }, 200);
    }

    // --- 파티클 폭죽 이펙트 ---
    window.createBurstParticles = function(element, color) {
        // 요소가 화면에 표시된 후 정확한 위치를 잡기 위해 약간 지연
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const rect = element.getBoundingClientRect();
                let cx = rect.left + rect.width / 2;
                let cy = rect.top + rect.height / 2;
                
                // fallback
                if (rect.width === 0 || rect.left === 0) {
                    cx = window.innerWidth / 2;
                    cy = window.innerHeight / 2;
                }

                for (let i = 0; i < 50; i++) {
                    const p = document.createElement('div');
                    p.classList.add('burst-particle');
                    p.style.backgroundColor = color || '#ffffff';
                    p.style.color = color || '#ffffff'; // box-shadow용
                    p.style.left = `${cx}px`;
                    p.style.top = `${cy}px`;
                    
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 80 + Math.random() * 220; // 통쾌하게 넓게 터지도록
                    const tx = Math.cos(angle) * distance;
                    const ty = Math.sin(angle) * distance;
                    
                    p.style.setProperty('--tx', `${tx}px`);
                    p.style.setProperty('--ty', `${ty}px`);
                    
                    document.body.appendChild(p);
                    
                    p.addEventListener('animationend', () => p.remove());
                }
            });
        });
    };

    // 전역에서 게임 스크립트들이 접근할 수 있도록 노출
    window.lottoGame = {
        pickNumber,
        getNextPremiumNumber,
        resetLotto,
        getPickedNumbers: () => [...pickedNumbers],
        isGame1Running: () => false,
        isGame2Running: () => false,
        isGame3Running: () => false,
        isAnyGameRunning: function() {
            return this.isGame1Running() || this.isGame2Running() || this.isGame3Running();
        }
    };

    // --- 병합된 Game 1 ---
    (function() {

    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          World = Matter.World,
          Bodies = Matter.Bodies,
          Body = Matter.Body,
          Events = Matter.Events;

    const domeContainer = document.getElementById('dome-container');
    const drawBtn = document.getElementById('draw-btn-1');
    const autoBtn1 = document.getElementById('auto-btn-1');
    const zoomBall = document.getElementById('zoom-ball');
    
    let isAuto1 = false;
    let autoTimeout1 = null;

    const width = 300;
    const height = 300;
    const cx = width / 2;
    const cy = height / 2;
    const domeRadius = 140;

    let engine, render, runner;
    let balls = [];
    let isDrawing = false;
    let isTornado = false;
    let drawnCount = 0;
    let bottomPartBasePos = { x: 0, y: 0 };
    let bottomPart = null;

    // colors map
    function getBallColor(num) {
        if (num <= 10) return '#fbc531'; // Yellow
        if (num <= 20) return '#0097e6'; // Blue
        if (num <= 30) return '#e84118'; // Red
        if (num <= 40) return '#7f8fa6'; // Gray
        return '#4cd137'; // Green
    }

    function initMatter() {
        if(engine) return; // already init

        engine = Engine.create();
        engine.world.gravity.y = 0; // Zero gravity initially

        render = Render.create({
            element: domeContainer,
            engine: engine,
            options: {
                width: width,
                height: height,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio // crisp rendering
            }
        });

        // Create Hollow Dome
        const segments = 28;
        const wallThickness = 15;
        const angleStep = (Math.PI * 2) / segments;
        const rectLength = (2 * Math.PI * domeRadius) / segments + 5;
        
        let domeParts = [];

        for (let i = 0; i < segments; i++) {
            const angle = i * angleStep;
            const x = cx + Math.cos(angle) * domeRadius;
            const y = cy + Math.sin(angle) * domeRadius;
            
            const part = Bodies.rectangle(x, y, wallThickness, rectLength, {
                isStatic: true,
                angle: angle,
                render: { visible: false } // invisible walls
            });

            // 7 is PI/2, exact bottom for 28 segments
            if (i === 7) {
                bottomPart = part;
                bottomPartBasePos = { x: x, y: y };
            }
            domeParts.push(part);
        }

        // Sensor below the door
        const sensor = Bodies.rectangle(cx, height + 40, 200, 20, {
            isStatic: true,
            isSensor: true,
            render: { visible: false }
        });

        World.add(engine.world, [...domeParts, sensor]);

        // Add 45 balls
        resetBalls();

        // Render Text (Numbers on balls)
        Events.on(render, 'afterRender', function() {
            const context = render.context;
            context.font = "bold 14px Outfit, sans-serif";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = "#ffffff";
            // slight text shadow for better readability
            context.shadowColor = "rgba(0,0,0,0.5)";
            context.shadowBlur = 2;

            balls.forEach(ball => {
                const { x, y } = ball.position;
                if(!ball.isDrawn) {
                   context.fillText(ball.number, x, y);
                }
            });
            
            // clear shadow
            context.shadowBlur = 0;
        });

        // Collision event for sensor (ball dropped out) and sound
        let lastCollisionTime = 0;
        Events.on(engine, 'collisionStart', function(event) {
            const pairs = event.pairs;
            const now = Date.now();
            let playedCollisionSound = false;

            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;

                if ((bodyA === sensor && bodyB.label === 'ball') || (bodyB === sensor && bodyA.label === 'ball')) {
                    const ball = bodyA.label === 'ball' ? bodyA : bodyB;
                    handleBallDrawn(ball);
                } else if ((isDrawing || isTornado) && !playedCollisionSound) {
                    // Only play tick sound during active mix, and throttle it (max 1 per 60ms)
                    if (now - lastCollisionTime > 60) {
                        if(window.soundManager) window.soundManager.playCollision();
                        lastCollisionTime = now;
                        playedCollisionSound = true;
                    }
                }
            }
        });

        // Zero-gravity roaming & Tornado effect
        Events.on(engine, 'beforeUpdate', function() {
            if (isTornado) {
                balls.forEach(ball => {
                    if (!ball.isDrawn) {
                        const dx = ball.position.x - cx;
                        const dy = ball.position.y - cy;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        const dirX = dx / (distance || 1);
                        const dirY = dy / (distance || 1);
                        
                        // Tangential vector for spinning (clockwise)
                        const tanX = -dirY;
                        const tanY = dirX;
                        
                        // 강력한 회전력. 중력(y=1.0)과 합쳐져 밑바닥에서 빙글빙글 벽을 타게 만듦
                        const spinStrength = 0.0018 * ball.mass;
                        // 중심벽으로 약간 밀어넣어 아치를 깨고 빙글빙글 돌도록 유도
                        const pullStrength = 0.0003 * ball.mass;

                        Body.applyForce(ball, ball.position, {
                            x: tanX * spinStrength - dirX * pullStrength,
                            y: tanY * spinStrength - dirY * pullStrength
                        });
                    }
                });
            } else if (!isDrawing && engine.world.gravity.y === 0) {
                balls.forEach(ball => {
                    if(!ball.isDrawn && ball.speed < 1.5) {
                        Body.applyForce(ball, ball.position, {
                            x: (Math.random() - 0.5) * 0.0001 * ball.mass,
                            y: (Math.random() - 0.5) * 0.0001 * ball.mass
                        });
                    }
                });
            }
        });

        Render.run(render);
        runner = Runner.create();
        Runner.run(runner, engine);
    }

    function resetBalls() {
        if (!engine) return;
        balls.forEach(b => World.remove(engine.world, b));
        balls = [];
        drawnCount = 0;
        drawBtn.disabled = false;
        
        isAuto1 = false;
        if (autoBtn1) {
            autoBtn1.textContent = '자동 (Auto)';
            autoBtn1.disabled = false;
        }
        clearTimeout(autoTimeout1);

        for (let i = 1; i <= 45; i++) {
            const x = cx + (Math.random() - 0.5) * 150;
            const y = cy + (Math.random() - 0.5) * 150;

            const ball = Bodies.circle(x, y, 14, { // 28px diameter (중간 사이즈로 최적화)
                label: 'ball',
                restitution: 0.8, // 튕김을 살짝 줄여서 좀 더 묵직하게 회전
                friction: 0.005,
                density: 0.04,
                render: {
                    fillStyle: getBallColor(i),
                    strokeStyle: 'rgba(255,255,255,0.4)',
                    lineWidth: 1
                }
            });
            ball.number = i;
            ball.isDrawn = false;
            balls.push(ball);
        }
        World.add(engine.world, balls);
    }

    function handleBallDrawn(ball) {
        if (!isDrawing) return; // 한 번의 추첨에 여러 번의 충돌 이벤트가 발생하는 것 방지
        if (ball.isDrawn) return;
        ball.isDrawn = true;
        
        // Close the door quickly to avoid more balls falling
        Body.setPosition(bottomPart, bottomPartBasePos);
        engine.world.gravity.y = 0; // return to zero gravity
        
        // Slightly slow down remaining balls to simulate the end of mixing
        balls.forEach(b => {
             if (!b.isDrawn) {
                 Body.setVelocity(b, { x: b.velocity.x * 0.5, y: b.velocity.y * 0.5 });
                 // 선택되지 않았는데 문 밖으로 삐져나갔거나 걸친 공들을 안전하게 돔 안으로 원복
                 if (b.position.y > cy + domeRadius - 20) {
                     Body.setPosition(b, { x: cx + (Math.random()-0.5)*50, y: cy });
                     Body.setVelocity(b, { x: 0, y: 0 });
                 }
             }
        });

        World.remove(engine.world, ball);
        drawnCount++;
        isDrawing = false;
        isTornado = false;
        
        // Record result
        const premiumNum = window.lottoGame.getNextPremiumNumber();
        const finalNumber = premiumNum !== null ? premiumNum : ball.number;
        const pickRes = window.lottoGame.pickNumber(finalNumber);
        if(!pickRes) {
            // Unexpected, but safely handle if it fails
        }

        // Re-enable draw button if we haven't reached 6
        if(drawnCount < 6) {
           drawBtn.disabled = false;
           if (isAuto1) {
               autoTimeout1 = setTimeout(() => {
                   if (isAuto1 && !isDrawing) {
                       drawBtn.click();
                   }
               }, 2000);
           }
        } else {
            isAuto1 = false;
            if (autoBtn1) autoBtn1.textContent = '자동 (Auto)';
        }

        if(window.soundManager) {
            window.soundManager.playPop();
            window.soundManager.playZoom();
        }

        // Trigger CSS Zoom animation
        zoomBall.textContent = finalNumber;
        zoomBall.style.backgroundColor = getBallColor(finalNumber);
        zoomBall.style.display = 'flex';
        zoomBall.classList.add('animate');
        
        window.createBurstParticles(zoomBall, getBallColor(finalNumber));
        
        setTimeout(() => {
            zoomBall.classList.remove('animate');
            zoomBall.style.display = 'none';
        }, 2500); 
    }

    if (autoBtn1) {
        autoBtn1.addEventListener('click', () => {
            if (drawnCount >= 6) return;
            isAuto1 = !isAuto1;
            
            if (isAuto1) {
                autoBtn1.textContent = '정지 (Stop)';
                if (!isDrawing) drawBtn.click();
            } else {
                autoBtn1.textContent = '자동 (Auto)';
                clearTimeout(autoTimeout1);
            }
        });
    }

    drawBtn.addEventListener('click', () => {
        if (drawnCount >= 6) return;
        
        if (window.soundManager) window.soundManager.playTornadoStart();
        
        isDrawing = true;
        isTornado = true; // Start tornado rotation
        drawBtn.disabled = true;

        // 세로축으로 중력이 적용된 상태에서 스핀
        engine.world.gravity.y = 1.0;

        // 3초 뒤 바닥문을 열고 하나가 튕겨져 나오게 연출
        setTimeout(() => {
            if(!isDrawing) return; // 만약 리셋이 눌렸다면 취소
            
            // 바닥문(trapdoor)을 화면 밖으로 치움
            Body.setPosition(bottomPart, { x: -1000, y: -1000 });

            // 공들 중 가장 바닥 쪽에 있는 공을 무작위 하나 선택
            let lowestBall = null;
            let maxY = -9999;
            // 회전력을 이기지 못하고 삐져나올 공 탐색
            balls.forEach(b => {
                if (!b.isDrawn && b.position.y > maxY && Math.abs(b.position.x - cx) < 50) {
                    maxY = b.position.y;
                    lowestBall = b;
                }
            });

            // 원활하게 구멍으로 추락(톡 삐져나옴)하도록 강제 배출력 적용
            if (lowestBall) {
                // 프리미엄 모드일 경우 추락 직전에 물리 공의 표기 숫자를 프리미엄 번호로 바꿔치기
                const premiumNum = window.lottoGame ? window.lottoGame.getNextPremiumNumber() : null;
                if (premiumNum !== null) {
                    lowestBall.number = premiumNum;
                }
                
                Body.setVelocity(lowestBall, { x: 0, y: 15 });
                
                // 다른 공들은 구멍 길을 터주기 위해 살짝 흩트림
                balls.forEach(b => {
                    if (b !== lowestBall && !b.isDrawn) {
                        Body.applyForce(b, b.position, { x: 0, y: -0.05 * b.mass });
                    }
                });
            } else {
                 // 만약 못찾았을 경우 예외 (보험)
                 engine.world.gravity.y = 2.0; 
            }

            // 구멍에 낀 공이 있을 경우 1초마다 살짝 쳐주는 폴백
            const shakeInterval = setInterval(() => {
                if(!isDrawing) {
                    clearInterval(shakeInterval);
                    return;
                }
                balls.forEach(b => {
                     if(!b.isDrawn && b.position.y > (cy + 20) && Math.abs(b.position.x - cx) < 30) {
                         const premiumNum = window.lottoGame ? window.lottoGame.getNextPremiumNumber() : null;
                         if (premiumNum !== null) {
                             b.number = premiumNum;
                         }
                         Body.setVelocity(b, { x: 0, y: 10 }); // 구멍 쪽으로 내리꽂음
                     }
                });
            }, 500);

        }, 3000);
    });

    // Reset logic via custom event
    window.addEventListener('resetLotto', () => {
        isDrawing = false;
        isTornado = false;
        drawBtn.disabled = false;
        zoomBall.classList.remove('animate');
        
        if (engine && bottomPart) {
             Body.setPosition(bottomPart, bottomPartBasePos);
             engine.world.gravity.y = 0;
        }
        resetBalls();
    });

    // Initialize Matter.js when Screen 1 becomes active
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('active') && mutation.target.id === 'game-screen-1') {
                initMatter();
            }
        });
    });

    const gameScreen = document.getElementById('game-screen-1');
    if(gameScreen) {
        observer.observe(gameScreen, { attributes: true, attributeFilter: ['class'] });
        // If it happens to be active initially
        if(gameScreen.classList.contains('active')) {
            initMatter();
        }
    }

    if (window.lottoGame) {
        window.lottoGame.isGame1Running = () => isDrawing || isTornado;
    }

    })();

    // --- 병합된 Game 2 ---
    (function() {

    const canvas = document.getElementById('target-canvas');
    if(!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 5;
    const sliceAngle = 2 * Math.PI / 45;

    let currentRotation = 0;
    let totalSpinDeg = 0;
    let lastTickDeg = 0;
    let spinRAF = null;
    let isSpinning = true;
    let startTime = null;
    let startRotation = 0;
    let targetRotation = 0;
    let hitNumber = null;
    let isDuplicate = false;

    const shootBtn = document.getElementById('shoot-btn');
    const autoBtn2 = document.getElementById('auto-btn-2');
    let isAuto2 = false;
    let autoTimeout2 = null;
    
    const arrow = document.getElementById('arrow');
    const notif = document.getElementById('notification-text');
    const zoomBall = document.getElementById('zoom-ball');

    // 과녁판 그리기
    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        const picked = window.lottoGame ? window.lottoGame.getPickedNumbers() : [];

        for (let i = 0; i < 45; i++) {
            const num = i + 1;
            // 0도가 3시 방향이므로, 1번(Index 0) 슬라이스가 정확히 6시(바닥)에 오도록 -Math.PI/2 오프셋을 줌
            // 아니면 Math.PI/2 위치에 그리도록 함 (6시)
            const angleCenter = Math.PI / 2 + i * sliceAngle;
            const startA = angleCenter - sliceAngle / 2;
            const endA = angleCenter + sliceAngle / 2;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startA, endA);
            ctx.closePath();

            if (picked.includes(num)) {
                ctx.fillStyle = '#1a1a24'; // 어두운 회색 (중복)
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.stroke();
            } else {
                const hue = (i / 45) * 360; // 무지개색
                ctx.fillStyle = `hsl(${hue}, 80%, 45%)`;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.stroke();
            }

            // 숫자 텍스트 그리기
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angleCenter);
            ctx.translate(radius - 22, 0); // 바깥쪽 엣지로 이동
            ctx.rotate(Math.PI / 2); // 텍스트가 바깥쪽을 향할 때 똑바로 읽히도록 회전
            
            ctx.fillStyle = picked.includes(num) ? '#444' : '#fff';
            ctx.font = 'bold 15px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num, 0, 0);
            ctx.restore();
        }
    }

    draw();

    // 상시 회전 애니메이션
    let lastTime = performance.now();
    function constantSpin(time) {
        if (!isSpinning) return;
        const dt = time - lastTime;
        lastTime = time;
        const step = dt * 0.15;
        currentRotation += step; // 속도 제어
        totalSpinDeg += step;

        if (totalSpinDeg - lastTickDeg >= 8) {
            lastTickDeg = Math.floor(totalSpinDeg / 8) * 8;
            const game2Screen = document.getElementById('game-screen-2');
            if (window.soundManager && game2Screen && game2Screen.classList.contains('active')) {
                window.soundManager.playTargetTick(step);
            }
        }

        currentRotation %= 360;
        canvas.style.transform = `rotate(${currentRotation}deg)`;
        spinRAF = requestAnimationFrame(constantSpin);
    }
    
    // 화면이 보일 때만 스핀 시작 (간편하게 바로 시작)
    spinRAF = requestAnimationFrame(constantSpin);

    // 감속 Easing (Cubic Out)
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // 정지 목표 위치까지 스핀
    function animateToTarget(time) {
        if (!startTime) startTime = time;
        const progress = Math.min((time - startTime) / 1500, 1); // 1.5초 정지

        const eased = easeOutCubic(progress);
        const prevRotation = currentRotation;
        currentRotation = startRotation + (targetRotation - startRotation) * eased;
        
        const step = currentRotation - prevRotation;
        totalSpinDeg += step;
        if (totalSpinDeg - lastTickDeg >= 8) {
            lastTickDeg = Math.floor(totalSpinDeg / 8) * 8;
            const game2Screen = document.getElementById('game-screen-2');
            if (window.soundManager && game2Screen && game2Screen.classList.contains('active')) {
                window.soundManager.playTargetTick(step);
            }
        }

        canvas.style.transform = `rotate(${currentRotation}deg)`;

        if (progress < 1) {
            spinRAF = requestAnimationFrame(animateToTarget);
        } else {
            currentRotation = targetRotation % 360;
            canvas.style.transform = `rotate(${currentRotation}deg)`;
            handleImpact(); // 충돌 완료!
        }
    }

    if (autoBtn2) {
        autoBtn2.addEventListener('click', () => {
            if (window.lottoGame && window.lottoGame.getPickedNumbers().length >= 6) return;
            isAuto2 = !isAuto2;
            
            if (isAuto2) {
                autoBtn2.textContent = '정지 (Stop)';
                if (!shootBtn.disabled) shootBtn.click();
            } else {
                autoBtn2.textContent = '자동 (Auto)';
                clearTimeout(autoTimeout2);
            }
        });
    }

    shootBtn.addEventListener('click', () => {
        if (window.lottoGame && window.lottoGame.getPickedNumbers().length >= 6) {
            alert('이미 6개의 번호를 모두 뽑았습니다!');
            return;
        }

        shootBtn.disabled = true;
        isSpinning = false;
        cancelAnimationFrame(spinRAF);

        // 결과 결정
        const premiumNum = window.lottoGame ? window.lottoGame.getNextPremiumNumber() : null;
        if (premiumNum !== null) {
            hitNumber = premiumNum;
            isDuplicate = false;
        } else {
            hitNumber = Math.floor(Math.random() * 45) + 1;
            isDuplicate = window.lottoGame ? window.lottoGame.getPickedNumbers().includes(hitNumber) : false;
        }

        // 목표 각도 계산
        // 0번 조각의 바닥(6시)은 회전 0도일때 옴. 
        // 화면의 화살표는 12시(상단)에 있으므로, 바닥(6시)에 있는 걸 12시로 올리려면 180도 오프셋이 추가로 필요.
        const sliceIdx = hitNumber - 1;
        const sliceDeg = 360 / 45; // 8도
        const requiredRotation = (180 - (sliceIdx * sliceDeg) + 360) % 360;

        // 부드럽게 감속하기 위해 추가 스핀(약 2바퀴 이상)
        const spins = 360 * 3;
        targetRotation = Math.ceil(currentRotation / 360) * 360 + spins + requiredRotation;

        startTime = null;
        startRotation = currentRotation;
        spinRAF = requestAnimationFrame(animateToTarget);

        // 화살은 충돌 0.5초 전에 발사
        // 전체 정지 시간 1500ms, 화살 비행 시간 500ms -> 시작 1000ms 지연
        setTimeout(() => {
            if (!shootBtn.disabled) return; // cancelled
            arrow.classList.add('shoot');
            if (window.soundManager) window.soundManager.playArrowShoot(); 
        }, 1000);
    });

    function handleImpact() {
        if (isDuplicate) {
            // 중복일 경우 튕겨남!
            if (window.soundManager) window.soundManager.playTargetBounce(); 
            
            arrow.classList.remove('shoot');
            void arrow.offsetWidth; // 돔강제업데이트
            arrow.classList.add('bounce');
            
            document.querySelector('.target-game-container').classList.add('shake');
            notif.classList.add('show');

            setTimeout(() => {
                if (!shootBtn.disabled) return; // cancelled
                document.querySelector('.target-game-container').classList.remove('shake');
                notif.classList.remove('show');
                arrow.classList.remove('bounce');
                
                // 다시 빙글빙글
                isSpinning = true;
                lastTime = performance.now();
                shootBtn.disabled = false;
                spinRAF = requestAnimationFrame(constantSpin);
                
                if (isAuto2) {
                    autoTimeout2 = setTimeout(() => {
                        if (isAuto2 && !shootBtn.disabled) shootBtn.click();
                    }, 500);
                }
            }, 1500);

        } else {
            // 새로운 번호일 경우 안착!
            if (window.soundManager) window.soundManager.playTargetHit();
            
            if (window.lottoGame) {
                // 게임 2 전용 줌 위치 보정
                zoomBall.style.top = '40%';
                
                // 번호 애니메이션 적용 후 슬롯에 추가
                zoomBall.textContent = hitNumber;
                zoomBall.style.display = 'flex';
                zoomBall.classList.remove('animate');
                void zoomBall.offsetWidth;
                zoomBall.classList.add('animate');
                
                window.createBurstParticles(zoomBall, `hsl(${(hitNumber / 45) * 360}, 80%, 45%)`);
                
                // 데이터 업데이트
                window.lottoGame.pickNumber(hitNumber);
                draw(); // 회색 처리 갱신

                setTimeout(() => {
                    if (!shootBtn.disabled) return; // cancelled
                    zoomBall.style.display = 'none';
                    arrow.classList.remove('shoot');
                    
                    if (window.lottoGame.getPickedNumbers().length < 6) {
                        isSpinning = true;
                        lastTime = performance.now();
                        shootBtn.disabled = false;
                        spinRAF = requestAnimationFrame(constantSpin);
                        
                        if (isAuto2) {
                            autoTimeout2 = setTimeout(() => {
                                if (isAuto2 && !shootBtn.disabled) shootBtn.click();
                            }, 500);
                        }
                    } else {
                        // 결과보기 모드로 전환 중
                        shootBtn.disabled = false;
                        isAuto2 = false;
                        if (autoBtn2) autoBtn2.textContent = '자동 (Auto)';
                    }
                }, 2500);
            }
        }
    }

    // 초기화 이벤트 리스너
    window.addEventListener('resetLotto', () => {
        isAuto2 = false;
        if (autoBtn2) autoBtn2.textContent = '자동 (Auto)';
        clearTimeout(autoTimeout2);

        shootBtn.disabled = false;
        isSpinning = true;
        arrow.classList.remove('shoot', 'bounce');
        notif.classList.remove('show');
        document.querySelector('.target-game-container').classList.remove('shake');
        zoomBall.style.display = 'none';
        zoomBall.classList.remove('animate');
        
        cancelAnimationFrame(spinRAF);
        lastTime = performance.now();
        spinRAF = requestAnimationFrame(constantSpin);
        
        draw();
    });

    if (window.lottoGame) {
        window.lottoGame.isGame2Running = () => shootBtn.disabled === true;
    }

    })();

    // --- 병합된 Game 3 ---
    (function() {

    const spinBtn = document.getElementById('spin-btn');
    const autoBtn3 = document.getElementById('auto-btn-3');
    const digitalNumber = document.getElementById('digital-number');
    const spinnerContainer = document.querySelector('.spinner-game-container');
    
    let isRolling = false;
    let isSlowing = false;
    let speed = 20;
    let rollInterval;
    let decelerateTimeout;
    let finishSpinTimeout;
    let currentNumber = 0;

    let isAuto3 = false;
    let autoTimeout3 = null;
    
    function formatNumber(num) {
        return num.toString().padStart(2, '0');
    }

    function getRandomNonDuplicate() {
        let picked = window.lottoGame.getPickedNumbers();
        if (picked.length >= 6) return null;
        let num;
        do {
            num = Math.floor(Math.random() * 45) + 1;
        } while (picked.includes(num));
        return num;
    }

    function getRandomVisualNumber() {
        return Math.floor(Math.random() * 45) + 1;
    }

    function startRolling() {
        if (window.lottoGame.getPickedNumbers().length >= 6) {
            alert('모든 번호를 뽑았습니다. 초기화 후 다시 시도해주세요.');
            return;
        }
        
        isRolling = true;
        isSlowing = false;
        speed = 20;
        spinBtn.textContent = '정지 (Stop)';
        digitalNumber.classList.add('rolling');
        digitalNumber.classList.remove('pop');
        spinnerContainer.classList.remove('flash');
        
        if (window.soundManager && window.soundManager.playShoot) {
             window.soundManager.playShoot(); 
        }

        rollInterval = setInterval(() => {
            currentNumber = getRandomVisualNumber();
            digitalNumber.textContent = formatNumber(currentNumber);
            if (window.soundManager && window.soundManager.playSpinnerTick) {
                window.soundManager.playSpinnerTick(speed);
            }
        }, speed);
    }
    
    function stopRolling() {
        isSlowing = true;
        spinBtn.disabled = true;
        spinBtn.textContent = '멈추는 중...';
        digitalNumber.classList.remove('rolling');
        digitalNumber.classList.add('slowing');
        
        clearInterval(rollInterval);
        
        // 관성 감속 로직 (Ease-out 효과)
        let decelerateTicks = 0;
        const maxTicks = 20; 
        
        let finalTargetNum = null;
        const premiumNum = window.lottoGame ? window.lottoGame.getNextPremiumNumber() : null;
        if (premiumNum !== null) {
            finalTargetNum = premiumNum;
        } else {
            finalTargetNum = getRandomNonDuplicate();
        }

        if (finalTargetNum === null) {
            resetUI();
            return;
        }
        
        function decelerateStep() {
            decelerateTicks++;
            currentNumber = getRandomVisualNumber();
            digitalNumber.textContent = formatNumber(currentNumber);
            
            // 점점 지수함수적으로 느려짐 (속도 감소)
            speed = 20 * Math.pow(1.15, decelerateTicks);
            
            if (window.soundManager && window.soundManager.playSpinnerTick) {
                window.soundManager.playSpinnerTick(speed);
            }
            
            if (decelerateTicks < maxTicks) {
                decelerateTimeout = setTimeout(decelerateStep, speed);
            } else {
                // 최종 번호에 딱 정지
                digitalNumber.textContent = formatNumber(finalTargetNum);
                finishSpin(finalTargetNum);
            }
        }
        
        decelerateTimeout = setTimeout(decelerateStep, speed);
    }
    
    function finishSpin(finalNumber) {
        isRolling = false;
        isSlowing = false;
        
        digitalNumber.classList.remove('slowing');
        digitalNumber.classList.add('pop');
        
        window.createBurstParticles(digitalNumber, '#00f3ff');
        
        // 플래시 이펙트 & 사운드
        spinnerContainer.classList.add('flash');
        if (window.soundManager && window.soundManager.playResultDrop) {
            window.soundManager.playResultDrop();
        } else if (window.soundManager && window.soundManager.playClick) {
            window.soundManager.playClick();
        }
        
        // 시스템에 최종 번호 등록 -> 하단 슬롯 반영
        window.lottoGame.pickNumber(finalNumber);
        resetUI();
        
        // 이펙트 초기화용 타이머
        finishSpinTimeout = setTimeout(() => {
            spinnerContainer.classList.remove('flash');
        }, 800);
    }
    
    function resetUI() {
        spinBtn.disabled = false;
        spinBtn.textContent = '시작 (Start)';
        if (window.lottoGame.getPickedNumbers().length >= 6) {
            spinBtn.disabled = true;
            spinBtn.textContent = '완료 (Done)';
            isAuto3 = false;
            if (autoBtn3) autoBtn3.textContent = '자동 (Auto)';
        } else if (isAuto3) {
            autoTimeout3 = setTimeout(() => {
                if (isAuto3 && !isRolling && !isSlowing) {
                    spinBtn.click(); // 시작
                    // 일정 시간 후 자동으로 정지
                    setTimeout(() => {
                        if (isAuto3 && isRolling && !isSlowing) {
                            spinBtn.click(); // 정지
                        }
                    }, 800); // 0.8초 롤링 후 정지
                }
            }, 600); // 0.6초 대기 후 다음 자동 시작
        }
    }
    
    // 글로벌 초기화 이벤트
    window.addEventListener('resetLotto', () => {
        isAuto3 = false;
        if (autoBtn3) autoBtn3.textContent = '자동 (Auto)';
        clearTimeout(autoTimeout3);

        isRolling = false;
        isSlowing = false;
        clearInterval(rollInterval);
        clearTimeout(decelerateTimeout);
        clearTimeout(finishSpinTimeout);
        
        digitalNumber.textContent = '00';
        digitalNumber.classList.remove('rolling', 'slowing', 'pop');
        spinnerContainer.classList.remove('flash');
        resetUI();
    });

    if (window.lottoGame) {
        window.lottoGame.isGame3Running = () => isRolling || isSlowing;
    }

    if (autoBtn3) {
        autoBtn3.addEventListener('click', () => {
            if (window.lottoGame.getPickedNumbers().length >= 6) return;
            isAuto3 = !isAuto3;
            
            if (isAuto3) {
                autoBtn3.textContent = '정지 (Stop)';
                if (!isRolling && !isSlowing) {
                    spinBtn.click(); // 시작
                    // 일정 시간 후 자동으로 정지
                    setTimeout(() => {
                        if (isAuto3 && isRolling && !isSlowing) {
                            spinBtn.click(); // 정지
                        }
                    }, 800);
                } else if (isRolling && !isSlowing) {
                    // 이미 롤링 중이면 이번엔 진행하고 냅두거나, 바로 멈춥니다.
                    spinBtn.click();
                }
            } else {
                autoBtn3.textContent = '자동 (Auto)';
                clearTimeout(autoTimeout3);
            }
        });
    }

    spinBtn.addEventListener('click', () => {
        if (!isRolling && !isSlowing) {
            startRolling();
        } else if (isRolling && !isSlowing) {
            stopRolling();
        }
    });

    })();

    // --- Easter Egg Logic ---
    let clickCount = 0;
    let clickTimer = null;
    const easterEggOverlay = document.getElementById('easter-egg');

    document.addEventListener('click', () => {
        clickCount++;

        if (clickCount >= 5) {
            // Show Easter Egg
            easterEggOverlay.classList.add('show');
            SoundManager.play('jackpot'); // Using jackpot sound for fun
            
            setTimeout(() => {
                easterEggOverlay.classList.remove('show');
            }, 5000);

            clickCount = 0; // Reset
        }

        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 500); // 500ms 안에 연속 클릭해야 함
    });

    // ==========================================
    // Policy Modal Logic
    // ==========================================
    const linkTerms = document.getElementById('link-terms');
    const linkPrivacy = document.getElementById('link-privacy');
    const linkRefund = document.getElementById('link-refund');
    
    const policyModal = document.getElementById('policy-modal');
    const policyCloseBtn = document.getElementById('modal-close-btn');
    const policyTitle = document.getElementById('modal-title');
    const policyContent = document.getElementById('modal-body');

    const policies = {
        terms: {
            title: '이용약관',
            content: '<h3>제1조 (목적)</h3><p>본 약관은 Yegom(이하 "회사")이 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p><h3>제2조 (서비스의 제공)</h3><p>회사는 로또 번호 생성 및 관련 통계 서비스를 오락용으로 제공합니다. 실제 당첨을 보장하지 않습니다.</p><h3>제3조 (책임의 한계)</h3><p>서비스 이용으로 인해 발생하는 어떠한 직간접적인 손해에 대해서도 회사는 책임을 지지 않습니다.</p>'
        },
        privacy: {
            title: '개인정보처리방침',
            content: '<h3>제1조 (개인정보의 수집)</h3><p>본 서비스는 사용자의 식별 가능한 민감 개인정보(이름, 연락처 등)를 수집하지 않습니다. 최소한의 서비스 품질 향상을 위해 쿠키 또는 로컬 스토리지를 활용할 수 있습니다.</p><h3>제2조 (이용 목적)</h3><p>수집된 최소한의 데이터는 서비스 개선 및 에러 분석 등의 목적으로만 활용됩니다.</p>'
        },
        refund: {
            title: '환불 및 취소 정책',
            content: '<h3>제1조 (환불 불가 원칙)</h3><p>본 서비스는 현재 무료로 제공되며, 향후 유료 결제가 포함된 프리미엄 기능의 경우 결제 후 즉시 서비스가 제공되므로 원칙적으로 환불이 불가합니다.</p><h3>제2조 (예외 사항)</h3><p>단, 시스템 오류 등으로 인해 결제되었으나 서비스를 이용하지 못한 것이 명백히 입증된 경우, 7일 이내에 고객센터(yegomne@gmail.com)로 문의 시 환불 처리가 가능합니다.</p>'
        }
    };

    function openPolicyModal(e, type) {
        e.preventDefault();
        if (policies[type]) {
            policyTitle.innerHTML = policies[type].title;
            policyContent.innerHTML = policies[type].content;
            policyModal.classList.remove('hidden');
            policyModal.classList.add('active'); // CSS transition
            if (typeof SoundManager !== 'undefined') SoundManager.play('click');
        }
    }

    if (linkTerms) linkTerms.addEventListener('click', (e) => openPolicyModal(e, 'terms'));
    if (linkPrivacy) linkPrivacy.addEventListener('click', (e) => openPolicyModal(e, 'privacy'));
    if (linkRefund) linkRefund.addEventListener('click', (e) => openPolicyModal(e, 'refund'));

    if (policyCloseBtn) {
        policyCloseBtn.addEventListener('click', () => {
            policyModal.classList.remove('active');
            policyModal.classList.add('hidden');
            if (typeof SoundManager !== 'undefined') SoundManager.play('click');
        });
    }

    if (policyModal) {
        policyModal.addEventListener('click', (e) => {
            if (e.target === policyModal) {
                policyModal.classList.remove('active');
                policyModal.classList.add('hidden');
                if (typeof SoundManager !== 'undefined') SoundManager.play('click');
            }
        });
    }
});