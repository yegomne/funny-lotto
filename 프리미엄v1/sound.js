class SoundManager {
    constructor() {
        this.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = null;
        this.masterGain = null;
    }

    _init() {
        if (!this.audioCtx) {
            this.audioCtx = new this.AudioContext();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0.5; // Master volume 50%
            this.masterGain.connect(this.audioCtx.destination);
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    _playTone(freq, type, duration, vol=0.5, slideTo=null) {
        this._init();
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        
        if (slideTo) {
             osc.frequency.exponentialRampToValueAtTime(slideTo, this.audioCtx.currentTime + duration);
        }
        
        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    // UI Hover (가벼운 전자음)
    playHover() {
        this._playTone(600, 'sine', 0.1, 0.1);
    }

    // UI Click (확실한 터치음)
    playClick() {
        this._playTone(800, 'square', 0.1, 0.15);
    }

    // 공끼리 부딪히는 소리 (유리구슬 틱틱)
    playCollision() {
        // 주파수를 살짝 랜덤하게 주어 자연스러운 타격감 형성
        const freq = 600 + Math.random() * 400; 
        this._playTone(freq, 'triangle', 0.05, 0.05); 
    }

    // 추첨 버튼 클릭 시 회오리 시작음 (고조되는 효과)
    playTornadoStart() {
        // 150Hz에서 800Hz로 3초간 상승하는 긴장감 조성 사운드
        this._playTone(150, 'sawtooth', 3.0, 0.2, 800);
    }

    // 공이 돔에서 빠져나올 때 (뽁!)
    playPop() {
        this._playTone(300, 'sine', 0.2, 0.5, 800);
    }

    // 줌인 애니메이션 사운드 (우주적인 느낌슈웅~)
    playZoom() {
        this._playTone(800, 'sine', 0.6, 0.3, 2000);
    }

    // 하단 슬롯에 번호가 확정될 때 (띵동!)
    playResultDrop() {
        this._playTone(1200, 'triangle', 0.2, 0.4, 400);
        setTimeout(() => this._playTone(1600, 'sine', 0.4, 0.4), 100);
    }

    // 초기화 버튼 시 사운드 (띠리링~ 하강)
    playReset() {
        this._playTone(600, 'sawtooth', 0.4, 0.2, 200);
    }

    // === Game 2: 회전 과녁판 전용 사운드 ===

    // 1. 화살 발사 사운드 (Energy Arrow Fire - EMP)
    playArrowShoot() {
        this._init();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.3);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(5000, this.audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(500, this.audioCtx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
    }

    // 과녁판 회전 틱 사운드 (Wheel Tick)
    playTargetTick(speed = 2.5) {
        this._init();
        if(this.audioCtx.state !== 'running') return; // 클릭 이전에는 소리 안나게 스킵
        
        const baseFreq = 200 + Math.min(Math.abs(speed) * 20, 800); // 팽팽하게 돌아갈때 고음
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();
        
        osc.type = 'square'; // 좀 더 찰칵거리는 기계식 톱니 느낌
        osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, this.audioCtx.currentTime + 0.05);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq * 2, this.audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(baseFreq, this.audioCtx.currentTime + 0.05);
        filter.Q.value = 3;

        // 속도가 빠를수록 볼륨도 커져서 타격감이 극대화됨
        const vol = 0.03 + Math.min(Math.abs(speed) * 0.005, 0.1);
        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.05);
    }

    // 2. 과녁 적중 사운드 (Target Hit - Success)
    playTargetHit() {
        this._init();
        
        // Impact Thud (둔탁한 타격)
        this._playTone(200, 'square', 0.1, 0.4, 50);
        
        // High-pitched Synth Chime (청량한 차임벨)
        setTimeout(() => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2000, this.audioCtx.currentTime); // 2kHz
            osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.5);
            
            gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime); // 강한 타격감
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.5);
        }, 50);
    }

    // 3. 중복 번호 튕겨냄 사운드 (Target Bounce - Error)
    playTargetBounce() {
        this._init();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        // 둔탁한 글리치 느낌을 위해 square 웨이브와 낮은 주파수 사용
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        // 왜곡(Distortion)된 느낌을 주도록 불규칙한 주파수 변화
        osc.frequency.linearRampToValueAtTime(80, this.audioCtx.currentTime + 0.1);
        osc.frequency.linearRampToValueAtTime(120, this.audioCtx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(50, this.audioCtx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
    }

    // === Game 3: 디지털 스피너 전용 사운드 ===
    
    // 스피너 회전 틱 (속도에 따라 주파수 변화)
    playSpinnerTick(speed) {
        this._init();
        if(this.audioCtx.state !== 'running') return;
        
        // speed(딜레이ms)가 작을수록(빠를수록) 고주파, 클수록(느릴수록) 저주파
        const baseFreq = Math.max(150, 20000 / Math.max(10, speed));
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();
        
        osc.type = 'triangle'; // 사이버틱한 디지털 소리
        osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
        // 음이 살짝 떨어지며 맺히는 느낌
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, this.audioCtx.currentTime + 0.04);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(baseFreq * 2, this.audioCtx.currentTime);

        // 회전 속도에 따라 볼륨 살짝 변화
        const vol = 0.05 + Math.min(speed * 0.0002, 0.05); 
        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.04);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.04);
    }

    // === 피날레 폭죽 사운드 ===
    playJackpotFinale() {
        this._init();
        
        // 화려한 빵빠레 아르페지오 (A Major 상승)
        const notes = [440, 554, 659, 880, 1108, 1318, 1760]; 
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this._playTone(freq, 'sine', 0.1, 0.4);
                this._playTone(freq * 1.5, 'triangle', 0.2, 0.3); // 배음 믹싱
            }, idx * 80);
        });

        // 펑!! 터지는 베이스 드랍
        setTimeout(() => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.type = 'sawtooth';
            // 폭발적인 킥 & 드랍
            osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 1.5);
            
            gain.gain.setValueAtTime(0.8, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 1.5);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 1.5);
        }, 500);

        // 연쇄적으로 터지는 폭죽 소리 흉내 (피융~ 팡!)
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                // 기존 0.05~0.15 에서 0.2~0.6 정도로 볼륨 대폭 증폭
                const vol = 0.2 + Math.random() * 0.4;
                // 폭죽 솟아오르는 소리 + 터지는 느낌
                this._playTone(200 + Math.random() * 400, 'square', 0.15, vol, 1000 + Math.random()*2000);
            }, 600 + Math.random() * 3000); // 3초간 난사
        }
    }
}

// 전역 객체로 등록
window.soundManager = new SoundManager();

// 브라우저 정책상 사용자 상호작용 후 AudioContext가 활성화되어야 하므로 클릭 이벤트에 초기화 바인딩
document.addEventListener('click', () => {
    if (window.soundManager) {
        window.soundManager._init();
    }
}, { once: true });
