const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');
const oldFooter = `        <div class="footer-policy-links">
            <a href="#" class="policy-link" data-policy="terms">이용약관</a>
            <span class="divider">|</span>
            <a href="#" class="policy-link" data-policy="privacy">개인정보처리방침</a>
            <span class="divider">|</span>
            <a href="#" class="policy-link" data-policy="disclaimer">법적고지</a>
        </div>
        <p class="copyright">© 2024 Funny LOTTO. All rights reserved.</p>`;
const newFooter = `        <div class="footer-policy-links">
            <a href="#" id="link-terms">이용약관</a>
            <span class="divider">|</span>
            <a href="#" id="link-privacy">개인정보처리방침</a>
            <span class="divider">|</span>
            <a href="#" id="link-refund">환불 및 취소 정책</a>
        </div>
        <div class="footer-business-info">
            <p>상호: 예곰(Yegom)</p>
            <p>문의: yegomne@gmail.com</p>
            <p class="copyright">© 2024 Yegom All Rights Reserved.</p>
        </div>`;
html = html.replace(oldFooter, newFooter);

const oldModal = `    <div id="policy-modal-overlay" class="modal-overlay">
        <div class="modal-content">
            <button class="close-btn policy-close-btn">&times;</button>
            <h2 id="policy-title"></h2>
            <div id="policy-content" class="modal-body-text"></div>
        </div>
    </div>`;
const newModal = `    <div id="policy-modal" class="modal-overlay hidden">
        <div class="modal-content">
            <button id="modal-close-btn" class="close-btn">&times;</button>
            <h2 id="modal-title"></h2>
            <div id="modal-body" class="modal-body-text"></div>
        </div>
    </div>`;
html = html.replace(oldModal, newModal);
fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html updated');

// 2. Update styles.css
let css = fs.readFileSync('styles.css', 'utf8');
const oldCssModal = `
.policy-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
}

.policy-modal-overlay.active {
    opacity: 1;
    pointer-events: all;
}

.policy-modal-overlay .modal-content {
    background: rgba(15, 15, 30, 0.95);
    border: 1px solid var(--glass-border);
    border-radius: 15px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    padding: 30px;
    box-shadow: 0 0 30px rgba(0, 243, 255, 0.1);
    position: relative;
    overflow-y: auto;
    transform: translateY(20px);
    transition: all 0.3s ease;
}

.policy-modal-overlay.active .modal-content {
    transform: translateY(0);
}`;
// We will replace `.policy-modal-overlay` entirely with `.modal-overlay` and also add `.hidden` helper class.
css = css.replace('.policy-modal-overlay {', '.modal-overlay {\n    /* To replace hidden class functionality but keep transition */\n');
css = css.replace('.policy-modal-overlay.active {', '.modal-overlay.active {');
css = css.replace('.policy-modal-overlay .modal-content {', '.modal-overlay .modal-content {\n    overflow-y: auto;\n');
css = css.replace('.policy-modal-overlay.active .modal-content {', '.modal-overlay.active .modal-content {');

// Add .hidden specifically to hide it and business info at the bottom of the footer styles
if (!css.includes('.modal-overlay.hidden')) {
    css += `

.modal-overlay.hidden {
    opacity: 0 !important;
    pointer-events: none !important;
}

.footer-business-info {
    margin-top: 10px;
    font-size: 0.75rem;
    color: var(--text-muted);
    line-height: 1.4;
    opacity: 0.7;
}

.footer-business-info p {
    margin: 3px 0;
}
`;
}
fs.writeFileSync('styles.css', css, 'utf8');
console.log('styles.css updated');

// 3. Update script.js
let js = fs.readFileSync('script.js', 'utf8');

const newJs = `    const linkTerms = document.getElementById('link-terms');
    const linkPrivacy = document.getElementById('link-privacy');
    const linkRefund = document.getElementById('link-refund');
    
    const policyModal = document.getElementById('policy-modal');
    const policyCloseBtn = document.getElementById('modal-close-btn');
    const policyTitle = document.getElementById('modal-title');
    const policyContent = document.getElementById('modal-body');

    const policies = {
        terms: {
            title: '이용약관',
            content: \`
                <h3>제1조 (목적)</h3>
                <p>본 약관은 Yegom(이하 "회사")이 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                <h3>제2조 (서비스의 제공)</h3>
                <p>회사는 로또 번호 생성 및 관련 통계 서비스를 오락용으로 제공합니다. 실제 당첨을 보장하지 않습니다.</p>
                <h3>제3조 (책임의 한계)</h3>
                <p>서비스 이용으로 인해 발생하는 어떠한 직간접적인 손해에 대해서도 회사는 책임을 지지 않습니다.</p>
            \`
        },
        privacy: {
            title: '개인정보처리방침',
            content: \`
                <h3>제1조 (개인정보의 수집)</h3>
                <p>본 서비스는 사용자의 식별 가능한 민감 개인정보(이름, 연락처 등)를 수집하지 않습니다. 최소한의 서비스 품질 향상을 위해 쿠키 또는 로컬 스토리지를 활용할 수 있습니다.</p>
                <h3>제2조 (이용 목적)</h3>
                <p>수집된 최소한의 데이터는 서비스 개선 및 에러 분석 등의 목적으로만 활용됩니다.</p>
            \`
        },
        refund: {
            title: '환불 및 취소 정책',
            content: \`
                <h3>제1조 (환불 불가 원칙)</h3>
                <p>본 서비스는 현재 무료로 제공되며, 향후 유료 결제가 포함된 프리미엄 기능의 경우 결제 후 즉시 서비스가 제공되므로 원칙적으로 환불이 불가합니다.</p>
                <h3>제2조 (예외 사항)</h3>
                <p>단, 시스템 오류 등으로 인해 결제되었으나 서비스를 이용하지 못한 것이 명백히 입증된 경우, 7일 이내에 고객센터(yegomne@gmail.com)로 문의 시 환불 처리가 가능합니다.</p>
            \`
        }
    };

    function openPolicyModal(e, type) {
        e.preventDefault();
        if (policies[type]) {
            policyTitle.innerHTML = policies[type].title;
            policyContent.innerHTML = policies[type].content;
            policyModal.classList.remove('hidden');
            policyModal.classList.add('active');
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
    }\`;

const idx1 = js.indexOf('    const policyLinks = document.querySelectorAll(\'.policy-link\');');
const strToEnd = js.substring(0, idx1);
js = strToEnd + newJs + '\n});';
fs.writeFileSync('script.js', js, 'utf8');
console.log('script.js updated');
