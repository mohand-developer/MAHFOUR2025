/**
 * FIREBASE INTEGRATION OVERLAY
 * هذا الملف يعدل الدوال الموجودة في script.js لتعمل مع Firebase
 * يتم تحميله بعد script.js مباشرة
 */

console.log('🔥 تحميل Firebase Integration Overlay...');

// ============================================
// 1. استبدال دالة addToFavorites بنسخة Firebase
// ============================================
const originalAddToFavorites = window.addToFavorites;
window.addToFavorites = async function (productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product || !product.available) {
        Swal.fire({
            icon: 'warning',
            title: 'المنتج غير متوفر',
            text: 'لا يمكن إضافة منتج غير متوفر إلى المفضلة.',
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    const favoriteProduct = {
        id: product.id,
        name: product.name,
        code: product.code,
        img: product.img,
        price: product.discount > 0 ? (product.price * (1 - product.discount / 100)).toFixed(2) : product.price
    };

    try {
        if (window.firebaseDB && window.firebaseDB.isConnected()) {
            await window.firebaseDB.toggleFavorite(favoriteProduct);

            const isInFavorites = favoritesData.some(fav => fav.id === productId);
            Swal.fire({
                icon: isInFavorites ? 'info' : 'success',
                title: isInFavorites ? 'تم الإزالة' : 'تم الإضافة',
                text: `${product.name} ${isInFavorites ? 'تم إزالته من' : 'تم إضافته إلى'} المفضلة!`,
                showConfirmButton: false,
                timer: 1500
            });

            renderProducts();
            if (window.location.pathname.includes('product-details.html')) {
                setupProductDetails();
            }
        } else {
            // Fallback to original function if Firebase not connected
            console.warn('⚠️ Firebase غير متصل، استخدام localStorage');
            originalAddToFavorites(productId);
        }
    } catch (error) {
        console.error('❌ خطأ في Firebase، استخدام localStorage:', error);
        originalAddToFavorites(productId);
    }
};

// ============================================
// 2. دالة عرض المفضلة (favorites.html)
// ============================================
window.renderFavorites = function () {
    const favoritesItems = document.querySelector('.favorites-items');
    if (!favoritesItems) return;

    const favorites = JSON.parse(localStorage.getItem('mahfourFavorites') || '[]');
    favoritesData = favorites;

    favoritesItems.innerHTML = '';

    if (favorites.length === 0) {
        favoritesItems.innerHTML = `
      <div class="empty-favorites">
        <i class="fas fa-heart-broken"></i>
        <p>قائمة المفضلة فارغة</p>
        <p style="font-size: 0.9em; margin-top: 10px; color: #777;">
          أضف المنتجات التي تعجبك لتبقى على اطلاع بها.
        </p>
      </div>`;
        return;
    }

    favorites.forEach((item, index) => {
        const animationDelay = `${index * 0.1}s`;
        const price = parseFloat(item.price);

        const div = document.createElement('div');
        div.className = 'favorite-item';
        div.style.animationDelay = animationDelay;
        div.innerHTML = `
      <img src="${item.img || 'https://via.placeholder.com/90?text=خشب'}" alt="${item.name}" class="item-image">
      <div class="item-details">
        <h3 onclick="location.href='product-details.html?id=${item.id}'">${item.name}</h3>
        <p class="price">${price.toFixed(2)} جنيه</p>
      </div>
      <button class="remove-btn" onclick="addToFavorites(${item.id})" title="إزالة من المفضلة">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;
        favoritesItems.appendChild(div);
    });
};

// ============================================
// 3. نظام التقييمات (product-details.html)
// ============================================
window.setupRatingSystem = async function (productId) {
    const ratingStars = document.querySelectorAll('#rating-stars .fa-star');
    const averageRatingEl = document.getElementById('average-rating');

    if (!ratingStars.length || !window.firebaseDB) return;

    try {
        const { avg, count } = await window.firebaseDB.getAverageRating(productId);

        if (averageRatingEl) {
            averageRatingEl.textContent = `متوسط التقييم: ${avg} نجوم (${count} تقييم${count > 1 ? 'ات' : ''})`;
        }

        ratingStars.forEach((star, index) => {
            star.classList.toggle('active', index < Math.floor(avg));
        });
    } catch (error) {
        console.error('❌ خطأ في تحميل التقييمات:', error);
    }

    ratingStars.forEach((star, index) => {
        star.addEventListener('click', async () => {
            const rating = index + 1;

            try {
                await window.firebaseDB.saveRating(productId, rating);

                Swal.fire({
                    icon: 'success',
                    title: 'شكراً لتقييمك!',
                    text: `لقد قيمت هذا المنتج بـ ${rating} نجوم`,
                    showConfirmButton: false,
                    timer: 2000
                });

                setupRatingSystem(productId);
            } catch (error) {
                console.error('❌ خطأ في حفظ التقييم:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'حدث خطأ',
                    text: 'لم نتمكن من حفظ تقييمك. حاول مرة أخرى.'
                });
            }
        });
    });
};

// ============================================
// 4. تعديل دالة orderNowViaWhatsApp لحفظ في Firebase
// ============================================
const originalOrderNowViaWhatsApp = window.orderNowViaWhatsApp;
window.orderNowViaWhatsApp = async function (productId, quantity) {
    const product = productsData.find(p => p.id === productId);
    if (!product || !product.available) {
        Swal.fire({
            icon: 'warning',
            title: 'المنتج غير متوفر',
            text: 'هذا المنتج غير متوفر حاليًا، سيتوفر في أقرب وقت.',
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    const fullName = document.getElementById('order-now-full-name').value.trim();
    const address = document.getElementById('order-now-address').value.trim();
    const locationLink = document.getElementById('order-now-location-link').value.trim();
    const phoneNumber = document.getElementById('order-now-phone-number').value.trim();

    if (!fullName || !address || !phoneNumber) {
        Swal.fire({
            icon: 'error',
            title: 'بيانات غير مكتملة',
            text: 'يرجى ملء جميع الحقول المطلوبة.',
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    if (!/^\d{11}$/.test(phoneNumber)) {
        Swal.fire({
            icon: 'error',
            title: 'رقم هاتف غير صحيح',
            text: 'يرجى إدخال رقم هاتف مكون من 11 رقمًا.',
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    const discountedPrice = product.discount > 0 ? (product.price * (1 - product.discount / 100)).toFixed(2) : product.price;
    const itemTotal = discountedPrice * quantity;

    let message = `*طلب جديد من متجر MAHFOOR CNC*\n\n`;
    message += `*الاسم:* ${fullName}\n`;
    message += `*العنوان:* ${address}\n`;
    if (locationLink) message += `*لوكيشن استلام الاوردر:* ${locationLink}\n`;
    message += `*رقم الهاتف:* ${phoneNumber}\n\n`;
    message += `*المنتج:* ${product.name}\n`;
    message += `كود المنتج: ${product.code}\n`;
    message += `- ${quantity} × ${discountedPrice} جنيه = ${itemTotal.toFixed(2)} جنيه\n`;
    message += `\n*الإجمالي:* ${itemTotal.toFixed(2)} جنيه`;

    const orderData = {
        id: Date.now(),
        date: new Date().toLocaleString('ar-EG'),
        customerName: fullName,
        address: address,
        locationLink: locationLink,
        phone: phoneNumber,
        products: [{
            id: product.id,
            name: product.name,
            code: product.code,
            quantity: quantity,
            price: discountedPrice
        }],
        total: itemTotal,
        message: message,
        status: 'قيد الانتظار'
    };

    try {
        // حفظ في Firebase أولاً
        if (window.firebaseDB && window.firebaseDB.isConnected()) {
            await window.firebaseDB.saveOrder(orderData);
            console.log('✅ تم حفظ الطلب في Firebase');
        }
    } catch (error) {
        console.error('⚠️ فشل حفظ الطلب في Firebase:', error);
    }

    // حفظ في localStorage (backup)
    let orders = JSON.parse(localStorage.getItem('mahfourOrders')) || [];
    orders.push({
        id: orderData.id,
        date: orderData.date,
        ts: Date.now(),
        details: message,
        status: 'قيد الانتظار'
    });
    localStorage.setItem('mahfourOrders', JSON.stringify(orders));

    // Pending points
    try {
        const points = Math.round(itemTotal);
        if (points > 0) {
            const pending = JSON.parse(localStorage.getItem('mahfourPendingPoints')) || [];
            pending.push({
                orderId: orderData.id,
                phone: phoneNumber,
                name: fullName,
                points,
                amount: itemTotal.toFixed(2),
                date: orderData.date
            });
            localStorage.setItem('mahfourPendingPoints', JSON.stringify(pending));
        }
    } catch (e) {
        console.warn('Failed to save pending points', e);
    }

    // إغلاق النافذة وتنظيف الحقول
    document.getElementById('order-now-modal').style.display = 'none';
    document.getElementById('order-now-full-name').value = '';
    document.getElementById('order-now-address').value = '';
    document.getElementById('order-now-location-link').value = '';
    document.getElementById('order-now-phone-number').value = '';
    document.getElementById('order-product-name').textContent = '';

    // فتح واتساب
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/+201033662370?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    Swal.fire({
        icon: 'success',
        title: 'تم إرسال الطلب',
        text: 'سيتم توجيهك إلى واتساب لتأكيد الطلب.',
        showConfirmButton: false,
        timer: 2000
    });

    // تحديث الإحصائيات
    try { updateStats(); } catch (e) { console.warn('updateStats failed', e); }
};

// ============================================
// 5. تهيئة عند تحميل الصفحة
// ============================================
function waitForFirebase(callback, maxAttempts = 50) {
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        if (window.firebaseDB && window.firebaseDB.isConnected && window.firebaseDB.isConnected()) {
            clearInterval(checkInterval);
            console.log('✅ Firebase متصل وجاهز');
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('⚠️ Firebase لم يتصل بعد 5 ثواني، المتابعة بدون Firebase');
            callback();
        }
    }, 100);
}

// تحديث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 تحميل صفحة:', window.location.pathname);

    // انتظار Firebase
    waitForFirebase(() => {
        // إذا كنا في صفحة تفاصيل المنتج
        if (window.location.pathname.includes('product-details.html')) {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = parseInt(urlParams.get('id'));
            if (productId && window.setupRatingSystem) {
                setTimeout(() => setupRatingSystem(productId), 500);
            }
        }

        // إذا كنا في صفحة المفضلة
        if (window.location.pathname.includes('favorites.html')) {
            if (window.renderFavorites) {
                setTimeout(() => renderFavorites(), 300);
            }
        }
    });
});

console.log('✅ Firebase Integration Overlay تم تحميله بنجاح');
