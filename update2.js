const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
    '<div class="footer-policy-links">\\n            <a href="#" class="policy-link" data-policy="terms">이용약관</a>\\n            <span class="divider">|</span>\\n            <a href="#" class="policy-link" data-policy="privacy">개인정보처리방침</a>\\n            <span class="divider">|</span>\\n            <a href="#" class="policy-link" data-policy="disclaimer">법적고지</a>\\n        </div>\\n        <p class="copyright">© 2024 Funny LOTTO. All rights reserved.</p>',
    '<div class="footer-policy-links">\\n            <a href="#" id="link-terms">이용약관</a>\\n            <span class="divider">|</span>\\n            <a href="#" id="link-privacy">개인정보처리방침</a>\\n            <span class="divider">|</span>\\n            <a href="#" id="link-refund">환불 및 취소 정책</a>\\n        </div>\\n        <div class="footer-business-info">\\n            <p>상호: 예곰(Yegom)</p>\\n            <p>문의: yegomne@gmail.com</p>\\n            <p class="copyright">© 2024 Yegom All Rights Reserved.</p>\\n        </div>'
);
let oldModalHtml = '<div id="policy-modal-overlay" class="modal-overlay">\\n        <div class="modal-content">\\n            <button class="close-btn policy-close-btn">&times;</button>\\n            <h2 id="policy-title"></h2>\\n            <div id="policy-content" class="modal-body-text"></div>\\n        </div>\\n    </div>';
let newModalHtml = '<div id="policy-modal" class="modal-overlay hidden">\\n        <div class="modal-content">\\n            <button id="modal-close-btn" class="close-btn">&times;</button>\\n            <h2 id="modal-title"></h2>\\n            <div id="modal-body" class="modal-body-text"></div>\\n        </div>\\n    </div>';

html = html.replace(oldModalHtml, newModalHtml);
// also handle windows CRLF maybe
html = html.replace(
    oldModalHtml.replace(/\\n/g, '\\r\\n'),
    newModalHtml.replace(/\\n/g, '\\r\\n')
);
html = html.replace(
    '<div class="footer-policy-links">\\r\\n            <a href="#" class="policy-link" data-policy="terms">이용약관</a>\\r\\n            <span class="divider">|</span>\\r\\n            <a href="#" class="policy-link" data-policy="privacy">개인정보처리방침</a>\\r\\n            <span class="divider">|</span>\\r\\n            <a href="#" class="policy-link" data-policy="disclaimer">법적고지</a>\\r\\n        </div>\\r\\n        <p class="copyright">© 2024 Funny LOTTO. All rights reserved.</p>',
    '<div class="footer-policy-links">\\r\\n            <a href="#" id="link-terms">이용약관</a>\\r\\n            <span class="divider">|</span>\\r\\n            <a href="#" id="link-privacy">개인정보처리방침</a>\\r\\n            <span class="divider">|</span>\\r\\n            <a href="#" id="link-refund">환불 및 취소 정책</a>\\r\\n        </div>\\r\\n        <div class="footer-business-info">\\r\\n            <p>상호: 예곰(Yegom)</p>\\r\\n            <p>문의: yegomne@gmail.com</p>\\r\\n            <p class="copyright">© 2024 Yegom All Rights Reserved.</p>\\r\\n        </div>'
);
fs.writeFileSync('index.html', html, 'utf8');

// Update CSS
let css = fs.readFileSync('styles.css', 'utf8');
css = css.replace('.policy-modal-overlay {', '.modal-overlay {');
css = css.replace('.policy-modal-overlay.active {', '.modal-overlay.active {');
css = css.replace('.policy-modal-overlay .modal-content {', '.modal-overlay .modal-content {\\n    overflow-y: auto;');
css = css.replace('.policy-modal-overlay.active .modal-content {', '.modal-overlay.active .modal-content {');

if (!css.includes('.modal-overlay.hidden')) {
    css += '\\n\\n.modal-overlay.hidden {\\n    opacity: 0 !important;\\n    pointer-events: none !important;\\n}\\n\\n.footer-business-info {\\n    margin-top: 10px;\\n    font-size: 0.75rem;\\n    color: var(--text-muted);\\n    line-height: 1.4;\\n    opacity: 0.7;\\n}\\n\\n.footer-business-info p {\\n    margin: 3px 0;\\n}\\n';
}
fs.writeFileSync('styles.css', css, 'utf8');

// Update JS
let js = fs.readFileSync('script.js', 'utf8');
let oldJsBlockStr = "    const policyLinks = document.querySelectorAll('.policy-link');";
let idx = js.indexOf(oldJsBlockStr);
if (idx !== -1) {
    let before = js.substring(0, idx);
    let after = `    const linkTerms = document.getElementById('link-terms');
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
});`;
    fs.writeFileSync('script.js', before + after, 'utf8');
}
