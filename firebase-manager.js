/**
 * Firebase Manager Module
 * Handles all Firebase Realtime Database operations for orders and ratings
 */

// State variables
let ordersCache = [];
let ordersListenerAttached = false;
let ordersRefInstance = null;
let ratingsListeners = {}; // Map to track rating listeners by productId
const FIREBASE_ORDERS_PATH = 'orders';

/**
 * Check if Firebase Realtime Database is available
 */
function hasRealtimeDb() {
    return typeof db !== 'undefined' && db && typeof db.ref === 'function';
}

/**
 * Get cached orders array (safe accessor)
 */
function getOrdersCache() {
    return Array.isArray(ordersCache) ? ordersCache : [];
}

/**
 * Handle data changes from Firebase (called when orders update)
 * Updates UI components across admin pages
 */
function handleOrdersDataChange() {
    // Update new orders panel (admin only)
    try { renderNewOrders(); } catch (err) { /* ignore on non-admin pages */ }

    // Update filtered orders list if search is active
    try {
        const searchTerm = document.getElementById('search-orders')?.value?.trim().toLowerCase();
        if (searchTerm) {
            const filtered = getOrdersCache().filter(order => {
                const details = (order.details || '').toLowerCase();
                const status = (order.status || '').toLowerCase();
                const idMatch = order.id?.toString().includes(searchTerm);
                return idMatch || details.includes(searchTerm) || status.includes(searchTerm);
            });
            renderOrders(filtered);
        } else {
            renderOrders();
        }
    } catch (err) { /* ignore */ }

    // Update statistics
    try {
        const currentPeriod = document.getElementById('stats-period')?.value || 'all';
        updateStats(currentPeriod);
    } catch (err) { /* ignore */ }

    // Update admin products view
    try { renderAdminProducts(); } catch (err) { /* ignore */ }
}

/**
 * Initialize Firebase realtime listener for orders
 * Sets up listener that auto-updates when orders change
 */
function initOrdersRealtimeListener() {
    if (ordersListenerAttached) return;

    if (!hasRealtimeDb()) {
        // Retry if Firebase not yet loaded
        setTimeout(initOrdersRealtimeListener, 800);
        return;
    }

    ordersRefInstance = db.ref(FIREBASE_ORDERS_PATH);
    ordersRefInstance.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        const parsed = Object.entries(data).map(([key, value]) => ({
            ...value,
            firebaseKey: key
        }));

        // Sort by timestamp (newest first)
        parsed.sort((a, b) => {
            const aTs = Number(a.ts || a.id || 0);
            const bTs = Number(b.ts || b.id || 0);
            return bTs - aTs;
        });

        ordersCache = parsed;
        handleOrdersDataChange();
    }, (error) => {
        console.error('Failed to listen for orders:', error);
    });

    ordersListenerAttached = true;
}

/**
 * Push a new order to Firebase
 * @param {Object} order - Order object to save
 * @returns {Promise} Firebase push promise
 */
function pushOrderToRealtime(order) {
    if (!hasRealtimeDb()) {
        return Promise.reject(new Error('Firebase Realtime Database is not available'));
    }

    const payload = { ...order };
    if (!payload.ts) {
        payload.ts = Date.now();
    }

    return db.ref(FIREBASE_ORDERS_PATH).push(payload);
}

/**
 * Update order status in Firebase
 * @param {number} orderId - Order ID to update
 * @param {string} status - New status value
 * @returns {Promise} Firebase update promise
 */
function updateOrderStatusInRealtime(orderId, status) {
    if (!hasRealtimeDb()) {
        return Promise.reject(new Error('Firebase Realtime Database is not available'));
    }

    const target = getOrdersCache().find(order => Number(order.id) === Number(orderId));
    if (!target || !target.firebaseKey) {
        return Promise.reject(new Error('Order not found'));
    }

    return db.ref(`${FIREBASE_ORDERS_PATH}/${target.firebaseKey}`).update({ status });
}

/**
 * Remove all orders from Firebase (admin only)
 * @returns {Promise} Firebase remove promise
 */
function removeAllOrdersFromRealtime() {
    if (!hasRealtimeDb()) {
        return Promise.reject(new Error('Firebase Realtime Database is not available'));
    }

    return db.ref(FIREBASE_ORDERS_PATH).remove();
}

// --- Rating System Functions ---

/**
 * Initialize listener for product ratings
 * @param {string|number} productId - Product ID to listen for
 * @param {Function} callback - Function to call with updated ratings array
 */
function initRatingsListener(productId, callback) {
    if (!hasRealtimeDb() || !productId) return;

    // Avoid duplicate listeners for the same product
    if (ratingsListeners[productId]) {
        // If we already have a listener, we might want to just update the callback or ignore
        // For simplicity, we'll assume the callback handles the UI update and the existing listener will trigger it
        // But to be safe and support page re-renders, let's detach old and attach new if needed.
        // Actually, Firebase .on() allows multiple listeners. But let's keep track to avoid memory leaks if we were SPA.
        // Since this is simple JS, we'll just attach.
    }

    const ratingsRef = db.ref(`ratings/${productId}`);

    const listener = ratingsRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        // Convert object to array
        const ratings = Object.values(data);
        callback(ratings);
    });

    ratingsListeners[productId] = { ref: ratingsRef, listener: listener };
}

/**
 * Save or update a user's rating in Firebase
 * Uses userId as the key to ensure one rating per user per product
 * @param {string|number} productId - Product ID
 * @param {string} userId - User ID
 * @param {Object} ratingData - Rating object
 * @returns {Promise} Firebase set promise
 */
function saveUserRating(productId, userId, ratingData) {
    if (!hasRealtimeDb()) {
        return Promise.reject(new Error('Firebase Realtime Database is not available'));
    }

    return db.ref(`ratings/${productId}/${userId}`).set(ratingData);
}

// Initialize Firebase check on load
if (typeof db === 'undefined') {
    console.error("خطأ: Firebase غير متصل! تأكد من تحميل firebase-init.js قبل script.js");
}
