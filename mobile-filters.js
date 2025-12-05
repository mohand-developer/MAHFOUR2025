/* ===================================== */
/* JavaScript للفلاتر القابلة للطي - MAHFOOR CNC */
/* Collapsible Filters Script - Mobile Only */
/* ===================================== */

// 📱 فقط للموبايل - تشغيل الكود تحت 768px
function isMobileView() {
    return window.innerWidth <= 768;
}

// 🎯 وظيفة تهيئة الفلاتر القابلة للطي
function initCollapsibleFilters() {
    // لو مش موبايل، متعملش حاجة
    if (!isMobileView()) {
        return;
    }

    const filtersAside = document.querySelector('.filters');
    const filtersTitle = filtersAside ? filtersAside.querySelector('h3') : null;

    if (!filtersAside || !filtersTitle) {
        console.warn('⚠️ الفلاتر غير موجودة في الصفحة');
        return;
    }

    // ✅ استرجاع الحالة المحفوظة من localStorage
    const savedState = localStorage.getItem('mahfoorFiltersState');
    const isCollapsed = savedState === 'collapsed'; // البداية: مطوي

    // ✅ تطبيق الحالة في البداية
    if (isCollapsed) {
        filtersAside.classList.add('collapsed');
    } else {
        filtersAside.classList.remove('collapsed');
    }

    // ✅ وظيفة التبديل بين الطي والفتح
    function toggleFilters() {
        filtersAside.classList.toggle('collapsed');

        // حفظ الحالة الجديدة في localStorage
        const newState = filtersAside.classList.contains('collapsed') ? 'collapsed' : 'expanded';
        localStorage.setItem('mahfoorFiltersState', newState);

        // تأثير صوتي/بصري بسيط (اختياري)
        if (filtersAside.classList.contains('collapsed')) {
            console.log('✅ الفلاتر مطوية');
        } else {
            console.log('✅ الفلاتر مفتوحة');
        }
    }

    // ✅ إضافة حدث الضغط على العنوان
    filtersTitle.addEventListener('click', toggleFilters);

    // ✅ إضافة دعم لوحة المفاتيح (Accessibility)
    filtersTitle.setAttribute('tabindex', '0');
    filtersTitle.setAttribute('role', 'button');
    filtersTitle.setAttribute('aria-expanded', !isCollapsed);

    filtersTitle.addEventListener('keydown', (e) => {
        // مفتاح Enter أو Space
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFilters();
            filtersTitle.setAttribute('aria-expanded', !filtersAside.classList.contains('collapsed'));
        }
    });

    console.log('✅ تم تفعيل الفلاتر القابلة للطي');
}

// 🔄 إعادة تهيئة الفلاتر عند تغيير حجم الشاشة
function handleResize() {
    const filtersAside = document.querySelector('.filters');

    if (isMobileView()) {
        // لو دخلنا الموبايل، فعّل الفلاتر القابلة للطي
        initCollapsibleFilters();
    } else {
        // لو رجعنا للديسكتوب، شيل class collapsed
        if (filtersAside) {
            filtersAside.classList.remove('collapsed');
            localStorage.removeItem('mahfoorFiltersState'); // امسح الحالة المحفوظة
        }
    }
}

// 🚀 تشغيل الكود عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initCollapsibleFilters();

    // إضافة مستمع لتغيير حجم الشاشة
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 250); // انتظر 250ms بعد انتهاء Resize
    });
});

console.log('✅ تم تحميل سكريبت الفلاتر القابلة للطي - MAHFOOR CNC');
