const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// replace policy links
const newFooter = `<div class="footer-policy-links">
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
const footerRegex = /<div class="footer-policy-links">[\s\S]*?<p class="copyright">.*?<\/p>/;
html = html.replace(footerRegex, newFooter);

// replace modal
const newModal = `<div id="policy-modal" class="modal-overlay hidden">
        <div class="modal-content">
            <button id="modal-close-btn" class="close-btn">&times;</button>
            <h2 id="modal-title"></h2>
            <div id="modal-body" class="modal-body-text"></div>
        </div>
    </div>`;
const modalRegex = /<div id="policy-modal-overlay" class="modal-overlay">[\s\S]*?<\/div>[\s]*?<\/div>/;
html = html.replace(modalRegex, newModal);

fs.writeFileSync('index.html', html, 'utf8');
