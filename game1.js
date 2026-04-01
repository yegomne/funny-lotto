document.addEventListener('DOMContentLoaded', () => {
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          World = Matter.World,
          Bodies = Matter.Bodies,
          Body = Matter.Body,
          Events = Matter.Events;

    const domeContainer = document.getElementById('dome-container');
    const drawBtn = document.getElementById('draw-btn-1');
    const zoomBall = document.getElementById('zoom-ball');

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
        const pickRes = window.lottoGame.pickNumber(ball.number);
        if(!pickRes) {
            // Unexpected, but safely handle if it fails
        }

        // Re-enable draw button if we haven't reached 6
        if(drawnCount < 6) {
           drawBtn.disabled = false;
        }

        if(window.soundManager) {
            window.soundManager.playPop();
            window.soundManager.playZoom();
        }

        // Trigger CSS Zoom animation
        zoomBall.textContent = ball.number;
        zoomBall.style.backgroundColor = getBallColor(ball.number);
        zoomBall.style.display = 'flex';
        zoomBall.classList.add('animate');
        
        setTimeout(() => {
            zoomBall.classList.remove('animate');
            zoomBall.style.display = 'none';
        }, 2500); 
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
});
