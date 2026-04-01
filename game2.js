/**
 * Game 2: 회전 과녁판 게임 (Rotating Target Board)
 * 45개의 파이 조각을 가진 과녁판이 회전하며 화살이 날아가 숫자를 맞춥니다.
 */

document.addEventListener('DOMContentLoaded', () => {
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
            if (window.soundManager) window.soundManager.playTargetTick();
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
        
        totalSpinDeg += (currentRotation - prevRotation);
        if (totalSpinDeg - lastTickDeg >= 8) {
            lastTickDeg = Math.floor(totalSpinDeg / 8) * 8;
            if (window.soundManager) window.soundManager.playTargetTick();
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

    shootBtn.addEventListener('click', () => {
        if (window.lottoGame && window.lottoGame.getPickedNumbers().length >= 6) {
            alert('이미 6개의 번호를 모두 뽑았습니다!');
            return;
        }

        shootBtn.disabled = true;
        isSpinning = false;
        cancelAnimationFrame(spinRAF);

        // 결과 결정
        hitNumber = Math.floor(Math.random() * 45) + 1;
        isDuplicate = window.lottoGame ? window.lottoGame.getPickedNumbers().includes(hitNumber) : false;

        // 목표 각도 계산
        // hitNumber 조각이 바닥(6시 방향)에 있으려면 
        // 0번 조각의 바닥은 회전 0도일때 옴. i번 조각이 바닥에 오려면 360 - i * 8도 회전이 필요
        const sliceIdx = hitNumber - 1;
        const sliceDeg = 360 / 45; // 8도
        const requiredRotation = 360 - (sliceIdx * sliceDeg);

        // 부드럽게 감속하기 위해 추가 스핀(약 2바퀴 이상)
        const spins = 360 * 3;
        targetRotation = Math.ceil(currentRotation / 360) * 360 + spins + requiredRotation;

        startTime = null;
        startRotation = currentRotation;
        spinRAF = requestAnimationFrame(animateToTarget);

        // 화살은 충돌 0.5초 전에 발사
        // 전체 정지 시간 1500ms, 화살 비행 시간 500ms -> 시작 1000ms 지연
        setTimeout(() => {
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
                document.querySelector('.target-game-container').classList.remove('shake');
                notif.classList.remove('show');
                arrow.classList.remove('bounce');
                
                // 다시 빙글빙글
                isSpinning = true;
                lastTime = performance.now();
                shootBtn.disabled = false;
                spinRAF = requestAnimationFrame(constantSpin);
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
                
                // 데이터 업데이트
                window.lottoGame.pickNumber(hitNumber);
                draw(); // 회색 처리 갱신

                setTimeout(() => {
                    zoomBall.style.display = 'none';
                    arrow.classList.remove('shoot');
                    
                    if (window.lottoGame.getPickedNumbers().length < 6) {
                        isSpinning = true;
                        lastTime = performance.now();
                        shootBtn.disabled = false;
                        spinRAF = requestAnimationFrame(constantSpin);
                    } else {
                        // 결과보기 모드로 전환 중
                        shootBtn.disabled = false;
                    }
                }, 2500);
            }
        }
    }

    // 초기화 이벤트 리스너
    window.addEventListener('resetLotto', () => {
        draw();
    });
});
