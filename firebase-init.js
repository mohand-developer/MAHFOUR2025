const firebaseConfig = {
  apiKey: "AIzaSyCOoh1GVhGhA4g7M9ptprPRnTrszpSexmU",
  authDomain: "mahfoor-cnc-6b389.firebaseapp.com",
  databaseURL: "https://mahfoor-cnc-6b389-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "mahfoor-cnc-6b389",
  storageBucket: "mahfoor-cnc-6b389.appspot.com",
  messagingSenderId: "422714394058",
  appId: "1:422714394058:web:d3dab2bf9f64b27cc5fb33"
};

// Initialize Firebase
if (typeof firebase === 'undefined') {
  console.error('Firebase SDK not loaded. Make sure firebase-app and firebase-database scripts are included before firebase-init.js');
} else {
  firebase.initializeApp(firebaseConfig);
  // expose a consistent global database reference
  window.db = window.db || firebase.database();
}
