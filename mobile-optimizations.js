// mobile-optimizations.js
// أضف هذا الملف وقم باستدعائه في index.html قبل script.js

// كشف الأجهزة المحمولة
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// تعيين إعدادات الأداء للأجهزة المحمولة
window.PERFORMANCE_CONFIG = {
    // تقليل التأثيرات البصرية على الأجهزة المحمولة
    enableShadows: !isMobile,
    enableParticles: !isMobile,
    particleCount: isMobile ? 5 : 20,
    maxParticles: isMobile ? 50 : 200,
    enableTrail: !isMobile,
    trailLength: isMobile ? 3 : 10,

    // تحسينات خاصة بـ iOS
    enableBlur: !isIOS,
    enableComplexGradients: !isIOS,

    // إعدادات Canvas
    pixelRatio: isMobile ? 1 : window.devicePixelRatio || 1
};

// تحسين أداء Canvas للأجهزة المحمولة
if (isMobile) {
    // تعطيل بعض ميزات CSS التي تؤثر على الأداء
    document.documentElement.style.setProperty('--enable-shadows', 'none');

    // تحسين اللمس
    document.addEventListener('touchstart', function(e) {
        if (e.target.tagName !== 'BUTTON') {
            e.preventDefault();
        }
    }, { passive: false });

    // منع التكبير المزدوج
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// تحسين requestAnimationFrame للأجهزة المحمولة
window.optimizedRAF = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           function(callback) {
               window.setTimeout(callback, 1000 / 60);
           };
})();