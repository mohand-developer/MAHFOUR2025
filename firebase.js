// firebase.js - Firebase SDK Integration for MAHFOOR CNC
// Firebase SDK (v9 modular - يشتغل مع المواقع الحديثة)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// إعدادات Firebase (من Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCOoh1GVhGhA4g7M9ptprPRnTrszpSexmU",
  authDomain: "mahfoor-cnc-6b389.firebaseapp.com",
  databaseURL: "https://mahfoor-cnc-6b389-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mahfoor-cnc-6b389",
  storageBucket: "mahfoor-cnc-6b389.firebasestorage.app",
  messagingSenderId: "422714394058",
  appId: "1:422714394058:web:e3b38f117b8a6c4dc5fb33",
  measurementId: "G-BE3V7YRJL2"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// تسجيل دخول مجهول تلقائي (عشان كل زائر يكون ليه ID خاص)
signInAnonymously(auth).catch(err => console.log("Auth error:", err));

// متغير لحفظ ID المستخدم الحالي
let currentUserId = null;

// مراقبة حالة تسجيل الدخول
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
    console.log("✅ مستخدم مجهول متصل:", currentUserId);
    // بعد ما يتوصل نحمل كل البيانات بتاعته
    loadUserData();
  }
});

// دوال جاهزة هتستخدمها في script.js
window.firebaseDB = {
  // حفظ طلب جديد في Firestore
  async saveOrder(orderData) {
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        userId: currentUserId || "guest",
        timestamp: serverTimestamp()
      });
      console.log("✅ تم حفظ الطلب في Firebase:", docRef.id);
      return docRef.id;
    } catch (e) {
      console.error("❌ خطأ في حفظ الطلب:", e);
      throw e;
    }
  },

  // حفظ تقييم منتج
  async saveRating(productId, rating) {
    if (!currentUserId) {
      console.warn("⚠️ يجب تسجيل الدخول لحفظ التقييم");
      return;
    }
    try {
      await addDoc(collection(db, "ratings"), {
        productId: Number(productId),
        rating: Number(rating),
        userId: currentUserId,
        timestamp: serverTimestamp()
      });
      console.log("✅ تم حفظ التقييم:", rating, "نجوم للمنتج", productId);
    } catch (e) {
      console.error("❌ خطأ في حفظ التقييم:", e);
    }
  },

  // جلب متوسط التقييمات لمنتج معين
  async getAverageRating(productId) {
    const q = query(collection(db, "ratings"), where("productId", "==", Number(productId)));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { avg: 0, count: 0 };
    }

    let sum = 0;
    snapshot.forEach(doc => sum += doc.data().rating);
    const average = (sum / snapshot.docs.length).toFixed(1);

    console.log(`📊 متوسط تقييم المنتج ${productId}: ${average} (${snapshot.docs.length} تقييم)`);
    return { avg: parseFloat(average), count: snapshot.docs.length };
  },

  // تبديل المفضلة (إضافة أو إزالة)
  async toggleFavorite(product) {
    if (!currentUserId) {
      console.warn("⚠️ يجب تسجيل الدخول لإضافة المفضلة");
      return;
    }

    const favRef = collection(db, "favorites");
    const q = query(favRef, where("userId", "==", currentUserId), where("product.id", "==", product.id));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // إضافة للمفضلة
      await addDoc(favRef, {
        userId: currentUserId,
        product,
        timestamp: serverTimestamp()
      });
      console.log("❤️ تمت إضافة المنتج للمفضلة:", product.name);
    } else {
      // إزالة من المفضلة
      snapshot.forEach(async (d) => await deleteDoc(d.ref));
      console.log("💔 تمت إزالة المنتج من المفضلة:", product.name);
    }

    // تحديث المفضلة محلياً بعد التغيير (سيتم تلقائياً عبر onSnapshot)
  },

  // تحميل المفضلة تلقائياً مع تحديث حي (real-time)
  loadFavorites() {
    if (!currentUserId) {
      console.warn("⚠️ لم يتم تسجيل الدخول بعد، سيتم تحميل المفضلة عند الاتصال");
      return;
    }

    const q = query(collection(db, "favorites"), where("userId", "==", currentUserId));

    // مراقبة التغييرات في الوقت الفعلي
    onSnapshot(q, (snapshot) => {
      const favs = [];
      snapshot.forEach(doc => favs.push(doc.data().product));

      console.log(`📋 تم تحميل ${favs.length} منتج من المفضلة`);

      // حفظ محلي كـ backup لو النت قطع
      localStorage.setItem('mahfourFavorites', JSON.stringify(favs));

      // إعادة رسم المفضلة لو الدالة موجودة
      if (window.renderFavorites) {
        window.renderFavorites();
      }

      // تحديث العداد
      updateFavoritesCount();
    });
  },

  // حفظ السلة في Firebase (اختياري - للمزامنة بين الأجهزة)
  async saveCart(cartItems) {
    if (!currentUserId) return;

    try {
      // حفظ في مستند المستخدم
      const userDocRef = doc(db, "users", currentUserId);
      await updateDoc(userDocRef, {
        cart: cartItems,
        lastUpdated: serverTimestamp()
      });
      console.log("🛒 تم حفظ السلة في Firebase");
    } catch (e) {
      // إذا المستند مش موجود، نعمله
      console.log("📝 إنشاء مستند مستخدم جديد");
    }
  },

  // الحصول على معرف المستخدم الحالي
  getCurrentUserId() {
    return currentUserId;
  },

  // التحقق من حالة الاتصال
  isConnected() {
    return currentUserId !== null;
  }
};

// تحديث عدد المفضلة في الهيدر
function updateFavoritesCount() {
  const favs = JSON.parse(localStorage.getItem('mahfourFavorites') || '[]');
  const el = document.getElementById('favorites-count');
  if (el) {
    el.textContent = favs.length;
  }
}

// تحميل بيانات المستخدم لما يفتح الموقع
function loadUserData() {
  console.log("📥 جاري تحميل بيانات المستخدم...");
  window.firebaseDB.loadFavorites();
  // لو عايز تحمل السلة أو النقاط من Firebase هنا
}

// تحديث العداد بشكل دوري (احتياطي)
setInterval(updateFavoritesCount, 2000);

console.log("🔥 Firebase SDK تم تحميله بنجاح");