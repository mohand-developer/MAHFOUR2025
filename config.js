/**
 * Configuration Constants for MAHFOOR CNC Website
 * Contains all global constants and configuration variables
 */

// Contact & Brand Information
const whatsappNumber = "+201033662370";
const BRAND_NAME = 'MAHFOOR CNC';
const BRAND_LOGO_URL = 'https://i.postimg.cc/4NSrnTbt/photo-2025-09-26-07-00-26.jpg';

// Authentication Passwords
const CLEAR_ORDERS_PASSWORD = "123";
const ADMIN_PASSWORD = "22/7/2009";
const PRODUCTS_PASSWORD = "MOHAND2009MOHAND1907MO09UA07";

// Firebase Configuration
const FIREBASE_ORDERS_PATH = 'orders';

// Data Version Control
const DATA_VERSION = "1.3";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Cache Keys
const CACHE_KEYS = {
  products: 'mahfourProducts',
  version: 'mahfourDataVersion',
  timestamp: 'mahfourProductsTimestamp',
  cart: 'mahfourCart',
  favorites: 'mahfourFavorites'
};
