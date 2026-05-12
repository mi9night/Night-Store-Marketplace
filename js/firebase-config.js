/**
 * Конфиг веб-приложения Firebase (Console → Project settings → Your apps).
 * Analytics в проекте не подключён — используется compat Auth через js/firebase-init.js.
 */
/**
 * URL для отправки кодов на почту (POST JSON: { email, purpose, code }).
 * Реализуйте на Cloudflare Worker / своём бэкенде (Resend, SendGrid и т.д.).
 * Пустая строка — код не показывается на сайте; отладка только с ?debugCodes=1 в URL.
 */
window.NIGHTSTORE_EMAIL_CODE_WEBHOOK = "";

window.__NIGHTSTORE_FIREBASE_CONFIG__ = {
  apiKey: "AIzaSyBQJ5R8Nlc1CivtxCXk-qFH5N2CG8MdqoY",
  authDomain: "night-store-401e8.firebaseapp.com",
  projectId: "night-store-401e8",
  storageBucket: "night-store-401e8.firebasestorage.app",
  messagingSenderId: "664034265257",
  appId: "1:664034265257:web:8003e62c38e597acfcc1b8",
  measurementId: "G-TLH25L1ZJ0",
};
