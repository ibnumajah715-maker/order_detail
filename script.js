// ==================== CONFIGURATION ====================
const API_BASE = 'http://localhost/order_detail/api';// Sesuaikan dengan path Anda

// ==================== GLOBAL VARIABLES ====================
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let pendingActionAfterLogin = null;

// ==================== API FUNCTIONS ====================

// Auth Functions dengan Database
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE}/auth.php?action=register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE}/auth.php?action=login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function logoutUser() {
    try {
        const response = await fetch(`${API_BASE}/auth.php?action=logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' // <<< FIX: Ensure session cookie is sent
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function updateUserProfile(profileData) {
    try {
        const response = await fetch(`${API_BASE}/auth.php?action=update_profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // <<< FIX: Ensure session cookie is sent
            body: JSON.stringify(profileData)
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function checkAuthStatus() {
    try {
        const headers = {};
        const storedUser = JSON.parse(localStorage.getItem('currentUser'));
        if (storedUser && storedUser.session_id) {
            headers['X-Session-Id'] = storedUser.session_id;
        }

        console.log('Checking auth status with headers:', headers); // Added logging

        const response = await fetch(`${API_BASE}/auth.php?action=check_auth`, {
            method: 'GET',
            credentials: 'include',
            headers: headers
        });

        const result = await response.json();
        console.log('Auth check result:', result); // Added logging
        return result;
    } catch (error) {
        console.error('Auth check error:', error);
        return { success: false, message: 'Network error' };
    }
}
// Order Functions dengan Database
async function createOrder(orderData) {
    try {
        const response = await fetch(`${API_BASE}/orders.php?action=create_order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // <<< FIX: Ensure session cookie is sent
            body: JSON.stringify(orderData)
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Create order error:', error);
        return { success: false, message: 'Network error' };
    }
}

// Di bagian API Functions tambahkan:
async function getUserOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders.php?action=user_orders`, {
            method: 'GET',
            credentials: 'include' // ✅ Include session
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Get orders error:', error);
        return { success: false, message: 'Network error' };
    }
}

// ==================== DOM ELEMENTS ====================
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const cartIcon = document.querySelector('.cart-icon');
const cartSidebar = document.querySelector('.cart-sidebar');
const closeCart = document.querySelector('.close-cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItemsContainer = document.querySelector('.cart-items');
const cartCount = document.querySelector('.cart-count');
const cartTotal = document.querySelector('.cart-total span:last-child');
const checkoutBtn = document.querySelector('.checkout-btn');
const userMenu = document.querySelector('.user-menu');
const userName = document.querySelector('.user-name');
const loginBtns = document.querySelectorAll('.login-btn');
const registerBtns = document.querySelectorAll('.register-btn');
const logoutBtn = document.querySelector('.logout-btn');
const loggedInMenu = document.querySelector('.logged-in-menu');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const profileModal = document.getElementById('profileModal');
const checkoutModal = document.getElementById('checkoutModal');
const paymentModal = document.getElementById('paymentModal');
const closeModals = document.querySelectorAll('.close-modal');
const switchToRegister = document.querySelector('.switch-to-register');
const switchToLogin = document.querySelector('.switch-to-login');
const loginForm = document.querySelector('.login-form');
const registerForm = document.querySelector('.register-form');

// ==================== SHIPPING COSTS CONFIG ====================
const SHIPPING_COSTS = {
    takeaway: 0,
    delivery: {
        base: 10000,
        perKm: 2000,
        maxDistance: 15
    }
};
function toggleMenu() {
    const menu = document.getElementById('produkMenu');
    menu.classList.toggle('show');
}
function showNotificationWithAction(message, actions) {
    const notification = document.createElement('div');
    notification.className = 'notification with-actions';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 2000;
        max-width: 350px;
    `;

    notification.innerHTML = `
        <div style="margin-bottom: 10px;">${message}</div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            ${actions.map(action =>
        `<button onclick="${action.action}" 
                         style="padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">
                    ${action.text}
                </button>`
    ).join('')}
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 5000);
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function () {
    // Check auth status dari server
    checkAuthStatus().then(result => {
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserState();
        } else {
            // Jika auth check gagal, clear localStorage
            localStorage.removeItem('currentUser');
            currentUser = null;
            updateUserState();
        }
    }).catch(error => {
        console.error('Auth check failed:', error);
        localStorage.removeItem('currentUser');
        currentUser = null;
        updateUserState();
    });

    initMenuFilter();
    initCart();
    initCheckoutSystem();
    initOrdersNavigation();
    initSearchFunctionality();

    // Add CSS for notification animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .shipping-section {
            margin: 1rem 0;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #8B4513;
        }
        
        .shipping-section .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }
        
        .shipping-section .error {
            color: #dc3545;
            font-weight: 600;
        }
        
        .cost-breakdown {
            margin: 1rem 0;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .cost-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #dee2e6;
        }
        
        .cost-total {
            display: flex;
            justify-content: space-between;
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            border-top: 2px solid #8B4513;
            font-size: 1.1rem;
        }
    `;
    document.head.appendChild(style);

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Simple animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.menu-item, .feature, .testimonial').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Video Control
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
        heroVideo.play().catch(function (error) {
            console.log('Autoplay prevented: ', error);
            document.querySelector('.video-container').style.background = '#8B4513';
        });

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    heroVideo.play();
                } else {
                    heroVideo.pause();
                }
            });
        }, { threshold: 0.5 });

        videoObserver.observe(heroVideo);
    }

    // Initialize Auth System
    initAuthSystem();
});

// ==================== AUTH SYSTEM ====================

function initAuthSystem() {
    // Login form dengan database - IMPROVED VERSION
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted');

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const result = await loginUser(email, password);

            if (result.success) {
                currentUser = result.user;
                // ✅ Simpan session_id ke localStorage
                if (result.session_id) {
                    currentUser.session_id = result.session_id;
                }
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUserState();
                showNotification('Login berhasil!');
                loginForm.reset();

                // Tutup modal login
                closeModal(loginModal);

                // Jalankan aksi yang tertunda setelah login
                if (pendingActionAfterLogin) {
                    console.log('Executing pending action after login');
                    // Beri sedikit delay untuk memastikan modal tertutup sepenuhnya
                    setTimeout(() => {
                        pendingActionAfterLogin();
                        pendingActionAfterLogin = null;
                    }, 300);
                }
            } else {
                showNotification(result.message, 'error');
            }
        });
    }

    // Register form dengan database - TETAP SAMA
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userData = {
                name: document.getElementById('registerName').value,
                email: document.getElementById('registerEmail').value,
                phone: document.getElementById('registerPhone').value,
                password: document.getElementById('registerPassword').value
            };

            const confirmPassword = document.getElementById('registerConfirmPassword').value;

            if (userData.password !== confirmPassword) {
                showNotification('Password tidak cocok!', 'error');
                return;
            }

            const result = await registerUser(userData);

            if (result.success) {
                closeModal(registerModal);
                showNotification('Pendaftaran berhasil! Silakan login.');
                registerForm.reset();
            } else {
                showNotification(result.message, 'error');
            }
        });
    }

    // Logout dengan database - TETAP SAMA
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await logoutUser();
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateUserState();
            showNotification('Logout berhasil!');
        });
    }

    // Profile functionality - TETAP SAMA
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (currentUser) {
                populateProfileForm(currentUser);
                showModal(profileModal);
            } else {
                showNotification('Silakan login terlebih dahulu!', 'error');
                showModal(loginModal);
            }
        });
    }

    // Profile form - TETAP SAMA
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveProfile();
        });
    }

    // Modal handlers - FIXED for multiple buttons
    if (loginBtns.length > 0) {
        loginBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showModal(loginModal);
            });
        });
    }

    if (registerBtns.length > 0) {
        registerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showModal(registerModal);
            });
        });
    }

    // Switch between login and register - TETAP SAMA
    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(loginModal);
            showModal(registerModal);
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(registerModal);
            showModal(loginModal);
        });
    }

    // Close modals - TETAP SAMA
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // Close modal when clicking outside - TETAP SAMA
    [loginModal, registerModal, profileModal, checkoutModal, paymentModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        }
    });
}

function updateUserState() {
    // Always check localStorage first
    const storedUser = localStorage.getItem('currentUser');

    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            // Check if elements exist before updating
            if (userName) userName.textContent = currentUser.name;
            if (loginBtns.length > 0) loginBtns.forEach(btn => btn.style.display = 'none');
            if (registerBtns.length > 0) registerBtns.forEach(btn => btn.style.display = 'none');
            if (loggedInMenu) loggedInMenu.style.display = 'block';
            console.log('User state updated:', currentUser.name);
        } catch (error) {
            console.error('Error parsing user data:', error);
            clearUserData();
        }
    } else {
        clearUserData();
    }
}

function clearUserData() {
    currentUser = null;
    if (userName) userName.textContent = 'Guest';
    if (loginBtns.length > 0) loginBtns.forEach(btn => btn.style.display = 'block');
    if (registerBtns.length > 0) registerBtns.forEach(btn => btn.style.display = 'block');
    if (loggedInMenu) loggedInMenu.style.display = 'none';
}

function populateProfileForm(user) {
    document.getElementById('profileNameInput').value = user.name || '';
    document.getElementById('profileEmailInput').value = user.email || '';
    document.getElementById('profilePhoneInput').value = user.phone || '';
    document.getElementById('profileBirthDate').value = user.birth_date || '';
    document.getElementById('profileAddress').value = user.address || '';
    document.getElementById('profileProvince').value = user.province || '';
    document.getElementById('profileCity').value = user.city || '';
    document.getElementById('profileDistrict').value = user.district || '';
    document.getElementById('profilePostalCode').value = user.postal_code || '';

    // Set gender
    if (user.gender) {
        document.querySelector(`input[name="gender"][value="${user.gender}"]`).checked = true;
    }
}

async function saveProfile() {
    if (!currentUser) return;

    const profileData = {
        name: document.getElementById('profileNameInput').value,
        email: document.getElementById('profileEmailInput').value,
        phone: document.getElementById('profilePhoneInput').value,
        birth_date: document.getElementById('profileBirthDate').value,
        gender: document.querySelector('input[name="gender"]:checked')?.value || '',
        address: document.getElementById('profileAddress').value,
        province: document.getElementById('profileProvince').value,
        city: document.getElementById('profileCity').value,
        district: document.getElementById('profileDistrict').value,
        postal_code: document.getElementById('profilePostalCode').value
    };

    const result = await updateUserProfile(profileData);

    if (result.success) {
        currentUser = result.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserState();
        showNotification('Profil berhasil diperbarui!', 'success');
        closeModal(profileModal);
    } else {
        showNotification(result.message, 'error');
    }
}

// ==================== ORDERS PAGE NAVIGATION ====================

function initOrdersNavigation() {
    // Handle orders button in user menu
    const ordersBtn = document.querySelector('.orders-btn');
    if (ordersBtn) {
        ordersBtn.addEventListener('click', function (e) {
            if (!currentUser) {
                e.preventDefault();
                showNotification('Silakan login terlebih dahulu!', 'error');
                showModal(loginModal);
            }
            // Jika sudah login, biarkan redirect natural ke orders.php
        });
    }

    // Handle login state untuk orders link
    document.querySelectorAll('a[href="orders.php"]').forEach(link => {
        link.addEventListener('click', function (e) {
            if (!currentUser) {
                e.preventDefault();
                showNotification('Silakan login terlebih dahulu!', 'error');
                showModal(loginModal);
            }
        });
    });
}

// ==================== CHECKOUT SYSTEM ====================

function initCheckoutSystem() {
    // Event listener untuk tombol checkout di cart - FIXED VERSION
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            console.log('Checkout button clicked');

            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (cart.length === 0) {
                showNotification('Keranjang Anda kosong!', 'error');
                return;
            }

            // Cek login status secara langsung
            if (!currentUser) {
                console.log('User not logged in, showing login modal');
                showNotification('Silakan login terlebih dahulu untuk checkout!', 'error');
                showModal(loginModal);

                // Simpan action untuk setelah login
                pendingActionAfterLogin = () => {
                    console.log('Executing pending action after login');
                    openCheckout();
                };
            } else {
                console.log('User already logged in, opening checkout directly');
                openCheckout();
            }
        });
    }

    // Event listener untuk metode pengambilan
    document.querySelectorAll('input[name="deliveryMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            toggleDeliveryAddress(e.target.value);
        });
    });

    // Event listener untuk form checkout
    const checkoutForm = document.querySelector('.checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            proceedToPayment();
        });
    }

    // Event listener untuk kembali ke keranjang
    const backToCartBtn = document.querySelector('.back-to-cart');
    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', () => {
            closeCheckout();
        });
    }

    // Event listener untuk konfirmasi pembayaran
    const confirmPaymentBtn = document.querySelector('.confirm-payment');
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', () => {
            completeOrder();
        });
    }

    // Event listener untuk batalkan pembayaran
    const cancelPaymentBtn = document.querySelector('.cancel-payment');
    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', () => {
            closePayment();
        });
    }
}


function checkLoginStatus() {
    return currentUser !== null;
}
// PERBAIKAN FUNGSI requireLogin
function requireLogin(callback) {
    console.log('requireLogin called, currentUser:', currentUser);

    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu!', 'error');
        showModal(loginModal);

        // Simpan callback untuk dijalankan setelah login berhasil
        if (callback) {
            pendingActionAfterLogin = callback;
            console.log('Pending action saved:', callback);
        }
        return false;
    }
    return true;
}
function openCheckout() {
    console.log('openCheckout called');

    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        showNotification('Keranjang Anda kosong!', 'error');
        return;
    }

    // Validasi login ulang untuk memastikan
    if (!currentUser) {
        console.error('User not authenticated in openCheckout');
        showNotification('Sesi login tidak valid. Silakan login kembali!', 'error');
        showModal(loginModal);
        return;
    }

    try {
        console.log('Updating order summary...');
        // Update order summary
        updateOrderSummary(cart);

        // Populate form dengan data user
        populateCheckoutForm();

        console.log('Showing checkout modal...');
        showModal(checkoutModal);

    } catch (error) {
        console.error('Error in openCheckout:', error);
        showNotification('Terjadi kesalahan saat membuka checkout', 'error');
    }
}
// FUNGSI BARU: populate checkout form dengan data user
function populateCheckoutForm() {
    if (!currentUser) {
        console.warn('No current user for populating checkout form');
        return;
    }

    console.log('Populating checkout form with user data:', currentUser);

    const nameInput = document.getElementById('customerName');
    const emailInput = document.getElementById('customerEmail');
    const phoneInput = document.getElementById('customerPhone');
    const addressInput = document.getElementById('deliveryAddress');

    if (nameInput) {
        nameInput.value = currentUser.name || '';
        console.log('Set name:', currentUser.name);
    }
    if (emailInput) {
        emailInput.value = currentUser.email || '';
        console.log('Set email:', currentUser.email);
    }
    if (phoneInput) {
        phoneInput.value = currentUser.phone || '';
        console.log('Set phone:', currentUser.phone);
    }
    if (addressInput && currentUser.address) {
        addressInput.value = currentUser.address || '';
        console.log('Set address:', currentUser.address);
    }
}
function updateOrderSummary(cart) {
    const summaryItems = document.querySelector('.summary-items');
    const totalAmount = document.querySelector('.total-amount');

    if (!summaryItems || !totalAmount) return;

    summaryItems.innerHTML = '';

    let subtotal = 0;
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'summary-item';
        itemElement.innerHTML = `
            <span>${item.name} (${item.quantity}x)</span>
            <span>Rp ${(item.price * item.quantity).toLocaleString()}</span>
        `;
        summaryItems.appendChild(itemElement);

        subtotal += item.price * item.quantity;
    });

    // Hitung dan tampilkan biaya ongkir
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value || 'takeaway';
    const shippingCost = calculateShippingCost(deliveryMethod, subtotal);
    const total = subtotal + (shippingCost || 0);

    // Update tampilan biaya ongkir
    updateShippingDisplay(subtotal, shippingCost, deliveryMethod);

    totalAmount.textContent = total.toLocaleString();
}

function updateShippingDisplay(subtotal, shippingCost, deliveryMethod) {
    let shippingSection = document.querySelector('.shipping-section');

    if (!shippingSection) {
        shippingSection = document.createElement('div');
        shippingSection.className = 'shipping-section';
        document.querySelector('.order-summary').appendChild(shippingSection);
    }

    if (deliveryMethod === 'takeaway') {
        shippingSection.innerHTML = `
            <div class="summary-item">
                <span>Biaya Pengiriman (Take Away)</span>
                <span>Gratis</span>
            </div>
        `;
    } else {
        if (shippingCost === null) {
            shippingSection.innerHTML = `
                <div class="summary-item error">
                    <span>⚠️ Pengiriman tidak tersedia untuk jarak Anda</span>
                </div>
            `;
        } else {
            shippingSection.innerHTML = `
                <div class="summary-item">
                    <span>Biaya Pengiriman</span>
                    <span>Rp ${shippingCost.toLocaleString()}</span>
                </div>
                <div class="shipping-note">
                    <small>Biaya pengiriman berlaku untuk semua pesanan</small>
                </div>
            `;
        }
    }
}

function calculateShippingCost(deliveryMethod, subtotal) {
    if (deliveryMethod === 'takeaway') {
        return 0;
    }

    const deliveryConfig = SHIPPING_COSTS.delivery;

    // Hitung jarak
    const distance = calculateDistanceFromStore();

    // Jika jarak melebihi maksimal, tidak bisa delivery
    if (distance > deliveryConfig.maxDistance) {
        return null;
    }

    return deliveryConfig.base + (distance * deliveryConfig.perKm);
}

function calculateDistanceFromStore() {
    return Math.floor(Math.random() * 10) + 1;
}

function toggleDeliveryAddress(method) {
    const addressSection = document.querySelector('.delivery-address');
    if (addressSection) {
        if (method === 'delivery') {
            addressSection.style.display = 'block';
            validateDeliveryAvailability();
        } else {
            addressSection.style.display = 'none';
        }
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateOrderSummary(cart);
}

function validateDeliveryAvailability() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = calculateShippingCost('delivery', subtotal);

    if (shippingCost === null) {
        showNotification('Maaf, pengiriman tidak tersedia untuk lokasi Anda. Silakan pilih Take Away.', 'error');
        document.querySelector('input[name="deliveryMethod"][value="takeaway"]').checked = true;
        toggleDeliveryAddress('takeaway');
    }
}

function proceedToPayment() {
    // Validasi login
    if (!currentUser) {
        showNotification('Sesi telah berakhir. Silakan login kembali!', 'error');
        showModal(loginModal);
        return;
    }

    const formData = getCheckoutFormData();

    if (!validateCheckoutForm(formData)) {
        return;
    }

    if (formData.deliveryMethod === 'delivery' && formData.shippingCost === null) {
        showNotification('Maaf, pengiriman tidak tersedia untuk lokasi Anda.', 'error');
        return;
    }

    showPaymentInstructions(formData);
    closeModal(checkoutModal);
    showModal(paymentModal);
}

function getCheckoutFormData() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value || 'takeaway';

    const shippingCost = calculateShippingCost(deliveryMethod, subtotal);
    const total = subtotal + (shippingCost || 0);

    return {
        name: document.getElementById('customerName')?.value || '',
        phone: document.getElementById('customerPhone')?.value || '',
        email: document.getElementById('customerEmail')?.value || '',
        deliveryMethod: deliveryMethod,
        address: document.getElementById('deliveryAddress')?.value || '',
        note: document.getElementById('deliveryNote')?.value || '',
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash',
        items: cart,
        subtotal: subtotal,
        shippingCost: shippingCost,
        total: total
    };
}

function validateCheckoutForm(formData) {
    if (!formData.name.trim()) {
        showNotification('Nama lengkap harus diisi', 'error');
        return false;
    }

    if (!formData.phone.trim()) {
        showNotification('Nomor telepon harus diisi', 'error');
        return false;
    }

    if (formData.deliveryMethod === 'delivery' && !formData.address.trim()) {
        showNotification('Alamat pengiriman harus diisi untuk metode delivery', 'error');
        return false;
    }

    return true;
}

function showPaymentInstructions(formData) {
    const paymentDetails = document.querySelector('.payment-details');
    if (!paymentDetails) return;

    const paymentMethod = formData.paymentMethod;
    let instructions = '';

    const costDetails = `
        <div class="cost-breakdown">
            <div class="cost-item">
                <span>Subtotal:</span>
                <span>Rp ${formData.subtotal.toLocaleString()}</span>
            </div>
            <div class="cost-item">
                <span>Biaya Pengiriman:</span>
                <span>${formData.deliveryMethod === 'takeaway' ? 'Gratis' : `Rp ${formData.shippingCost.toLocaleString()}`}</span>
            </div>
            <div class="cost-total">
                <span><strong>Total:</strong></span>
                <span><strong>Rp ${formData.total.toLocaleString()}</strong></span>
            </div>
        </div>
    `;

    switch (paymentMethod) {
        case 'cash':
            instructions = `
                <div class="payment-info cash">
                    <i class="fas fa-money-bill-wave"></i>
                    <h5>Bayar di Tempat</h5>
                    ${costDetails}
                    <p>Silakan tunjukkan pesanan ini saat ${formData.deliveryMethod === 'takeaway' ? 'mengambil' : 'menerima'} pesanan</p>
                    <div class="order-details">
                        <p><strong>Detail Pesanan:</strong></p>
                        <p>Nama: ${formData.name}</p>
                        <p>No. Telepon: ${formData.phone}</p>
                        <p>Metode: ${formData.deliveryMethod === 'takeaway' ? 'Take Away' : 'Delivery'}</p>
                        ${formData.deliveryMethod === 'delivery' ? `<p>Alamat: ${formData.address}</p>` : ''}
                    </div>
                </div>
            `;
            break;

        case 'qris':
            instructions = `
                <div class="payment-info qris">
                    <i class="fas fa-qrcode"></i>
                    <h5>Pembayaran QRIS</h5>
                    ${costDetails}
                    <div class="qris-code">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=HAVEN-${Date.now()}-${formData.total}" alt="QR Code">
                    </div>
                    <p>Scan QR code di atas untuk melakukan pembayaran</p>
                    <div class="payment-instruction">
                        <p><strong>Cara Pembayaran:</strong></p>
                        <ol>
                            <li>Buka aplikasi e-wallet atau mobile banking Anda</li>
                            <li>Pilih fitur scan QRIS</li>
                            <li>Arahkan kamera ke QR code di atas</li>
                            <li>Konfirmasi pembayaran</li>
                        </ol>
                    </div>
                </div>
            `;
            break;

        case 'bank_transfer':
            instructions = `
                <div class="payment-info bank-transfer">
                    <i class="fas fa-university"></i>
                    <h5>Transfer Bank</h5>
                    ${costDetails}
                    <div class="bank-details">
                        <p><strong>Bank BCA</strong></p>
                        <p>No. Rekening: <strong>1234 5678 9012</strong></p>
                        <p>Atas Nama: <strong>HAVEN FASHION</strong></p>
                    </div>
                    <div class="payment-instruction">
                        <p><strong>Instruksi Transfer:</strong></p>
                        <ol>
                            <li>Transfer tepat sejumlah <strong>Rp ${formData.total.toLocaleString()}</strong></li>
                            <li>Gunakan nomor rekening di atas</li>
                            <li>Simpan bukti transfer</li>
                            <li>Pesanan akan diproses setelah pembayaran dikonfirmasi</li>
                        </ol>
                    </div>
                </div>
            `;
            break;

        case 'ewallet':
            instructions = `
                <div class="payment-info ewallet">
                    <i class="fas fa-wallet"></i>
                    <h5>E-Wallet</h5>
                    ${costDetails}
                    <div class="ewallet-options">
                        <div class="ewallet-option">
                            <i class="fab fa-google-pay"></i>
                            <span>Gopay</span>
                        </div>
                        <div class="ewallet-option">
                            <i class="fab fa-product-hunt"></i>
                            <span>OVO</span>
                        </div>
                        <div class="ewallet-option">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>Dana</span>
                        </div>
                    </div>
                    <div class="payment-instruction">
                        <p><strong>Instruksi Pembayaran:</strong></p>
                        <ol>
                            <li>Pilih e-wallet yang ingin digunakan</li>
                            <li>Ikuti instruksi di aplikasi e-wallet Anda</li>
                            <li>Konfirmasi pembayaran</li>
                        </ol>
                    </div>
                </div>
            `;
            break;
    }

    paymentDetails.innerHTML = instructions;
}

async function completeOrder() {
    try {
        console.log('Starting completeOrder...');

        // Validasi login terakhir sebelum membuat order
        if (!currentUser) {
            showNotification('Sesi telah berakhir. Silakan login kembali!', 'error');
            closePayment();
            showModal(loginModal);
            return;
        }

        const formData = getCheckoutFormData();
        console.log('Form data:', formData);

        // Siapkan data order untuk database
        const orderData = {
            customer_name: formData.name,
            customer_email: formData.email,
            customer_phone: formData.phone,
            delivery_method: formData.deliveryMethod,
            delivery_address: formData.address,
            delivery_note: formData.note,
            payment_method: formData.paymentMethod,
            subtotal: formData.subtotal,
            shipping_cost: formData.shippingCost || 0,
            total_amount: formData.total,
            items: formData.items,
            user_id: currentUser.id
        };

        console.log('Sending order data:', orderData);
        const result = await createOrder(orderData);

        if (result.success) {
            // Kosongkan keranjang
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCart();

            // Tampilkan konfirmasi dengan nomor order
            showNotification(`Pesanan berhasil! Nomor Order: ${result.order_number}`);

            // Tutup modal
            closePayment();
            closeCartSidebar();

            // Reset form
            const checkoutForm = document.querySelector('.checkout-form');
            if (checkoutForm) checkoutForm.reset();

        } else {
            console.error('Order creation failed:', result);
            showNotification('Gagal membuat pesanan: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error in completeOrder:', error);
        showNotification('Terjadi kesalahan sistem. Silakan coba lagi.', 'error');
    }
}

function closeCheckout() {
    closeModal(checkoutModal);
}

function closePayment() {
    closeModal(paymentModal);
}

function closeAllModals() {
    [loginModal, registerModal, profileModal, checkoutModal, paymentModal].forEach(modal => {
        closeModal(modal);
    });
}
// FUNGSI DEBUG UNTUK TESTING
function debugCheckout() {
    console.log('=== DEBUG CHECKOUT ===');
    console.log('currentUser:', currentUser);
    console.log('cart:', JSON.parse(localStorage.getItem('cart')) || []);
    console.log('pendingActionAfterLogin:', pendingActionAfterLogin);
    console.log('checkoutBtn:', checkoutBtn);
    console.log('checkoutModal:', document.getElementById('checkoutModal'));
    console.log('=== END DEBUG ===');
}
// ==================== MENU FILTER & SIZE SELECTION ====================

function initMenuFilter() {
    console.log('Initializing menu filter and size selection...');

    // Filter functionality
    const filterBtns = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.menu-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const category = this.getAttribute('data-category');

            menuItems.forEach(item => {
                if (category === 'all' || item.getAttribute('data-category') === category) {
                    item.style.display = 'block';
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Size Selection System
    const sizeOptions = document.querySelectorAll('.size-option');
    console.log('Size options found:', sizeOptions.length);

    sizeOptions.forEach(option => {
        option.addEventListener('click', function () {
            console.log('Size clicked:', this.textContent);

            const parent = this.closest('.size-options');
            const parentOptions = parent.querySelectorAll('.size-option');
            parentOptions.forEach(opt => opt.classList.remove('selected'));

            this.classList.add('selected');

            const addToCartBtn = this.closest('.menu-item').querySelector('.add-to-cart');
            if (addToCartBtn) {
                addToCartBtn.disabled = false;
                console.log('Add to cart button enabled');
            }
        });
    });

    // Add to Cart with Size Selection
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {
        button.disabled = true;

        button.addEventListener('click', function () {
            const menuItem = this.closest('.menu-item');
            const selectedSize = menuItem.querySelector('.size-option.selected');

            if (!selectedSize) {
                showNotification('Silakan pilih ukuran terlebih dahulu!', 'error');
                return;
            }

            const id = this.dataset.id;
            const name = this.dataset.name;
            const price = parseInt(this.dataset.price);
            const image = this.dataset.image;
            const size = selectedSize.getAttribute('data-size');

            console.log('Adding to cart:', { id, name, price, size });

            const existingItem = cart.find(item => item.id === id && item.size === size);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id,
                    name,
                    price,
                    image,
                    size,
                    quantity: 1
                });
            }

            updateCart();
            showAddedToCartMessage(name);

            const sizeOptions = menuItem.querySelectorAll('.size-option');
            sizeOptions.forEach(opt => opt.classList.remove('selected'));
            this.disabled = true;
        });
    });

    console.log('Menu filter and size selection initialized successfully');
}

// ==================== CART FUNCTIONALITY ====================

function initCart() {
    // Open cart
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close cart
    if (closeCart) {
        closeCart.addEventListener('click', closeCartSidebar);
    }
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCartSidebar);
    }

    updateCart();
}

function closeCartSidebar() {
    if (cartSidebar) cartSidebar.classList.remove('active');
    if (cartOverlay) cartOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));

    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;

    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Keranjang belanja Anda kosong</p>
                </div>
            `;
            if (cartTotal) cartTotal.textContent = 'Rp 0';
            if (checkoutBtn) {
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.6';
            }
            return;
        }

        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.style.opacity = '1';
        }

        let totalPrice = 0;

        cart.forEach(item => {
            totalPrice += item.price * item.quantity;

            const cartItemElement = document.createElement('div');
            cartItemElement.classList.add('cart-item');
            cartItemElement.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-size">Ukuran: ${item.size}</div>
                    <div class="cart-item-price">Rp ${item.price.toLocaleString()}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease" data-id="${item.id}" data-size="${item.size}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}" data-size="${item.size}">
                        <button class="quantity-btn increase" data-id="${item.id}" data-size="${item.size}">+</button>
                    </div>
                </div>
                <button class="remove-item" data-id="${item.id}" data-size="${item.size}">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            cartItemsContainer.appendChild(cartItemElement);
        });

        if (cartTotal) cartTotal.textContent = `Rp ${totalPrice.toLocaleString()}`;

        document.querySelectorAll('.decrease').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const size = e.target.dataset.size;
                updateQuantity(id, size, -1);
            });
        });

        document.querySelectorAll('.increase').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const size = e.target.dataset.size;
                updateQuantity(id, size, 1);
            });
        });

        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.closest('.remove-item').dataset.id;
                const size = e.target.closest('.remove-item').dataset.size;
                removeFromCart(id, size);
            });
        });
    }
}

function updateQuantity(id, size, change) {
    const item = cart.find(item => item.id === id && item.size === size);

    if (item) {
        item.quantity += change;

        if (item.quantity < 1) {
            removeFromCart(id, size);
        } else {
            updateCart();
        }
    }
}

function removeFromCart(id, size) {
    cart = cart.filter(item => !(item.id === id && item.size === size));
    updateCart();
}

function showAddedToCartMessage(itemName) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #25D366;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 2000;
        transform: translateX(150%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;

    notification.innerHTML = `
        <i class="fas fa-check-circle" style="margin-right: 10px;"></i>
        ${itemName} ditambahkan ke keranjang!
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(150%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ==================== SEARCH FUNCTIONALITY ====================

function initSearchFunctionality() {
    console.log('Initializing search functionality...');

    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    if (!searchInput || !searchBtn) {
        console.log('Search elements not found');
        return;
    }

    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        max-height: 400px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
        margin-top: 5px;
    `;

    searchInput.parentElement.style.position = 'relative';
    searchInput.parentElement.appendChild(searchResults);

    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        performSearch(searchInput.value.trim());
        hideSearchResults();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(searchInput.value.trim());
            hideSearchResults();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            hideSearchResults();
        }
    });

    function showSearchResults(query) {
        if (!query) {
            hideSearchResults();
            return;
        }

        const results = searchProducts(query);
        renderSearchResults(results, query);
        searchResults.style.display = 'block';
    }

    function hideSearchResults() {
        searchResults.style.display = 'none';
    }

    function searchProducts(query) {
        const searchTerm = query.toLowerCase();
        const menuItems = document.querySelectorAll('.menu-item');
        const results = [];

        menuItems.forEach(item => {
            const productName = item.querySelector('h3').textContent.toLowerCase();
            const productDesc = item.querySelector('p').textContent.toLowerCase();
            const productCategory = item.getAttribute('data-category');
            const productImage = item.querySelector('img').src;
            const productPrice = item.querySelector('.price').textContent;

            if (productName.includes(searchTerm) ||
                productDesc.includes(searchTerm) ||
                productCategory.includes(searchTerm)) {

                results.push({
                    element: item,
                    name: item.querySelector('h3').textContent,
                    description: item.querySelector('p').textContent,
                    price: productPrice,
                    image: productImage,
                    category: productCategory
                });
            }
        });

        return results;
    }

    function renderSearchResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results" style="padding: 20px; text-align: center; color: #666;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; color: #ddd;"></i>
                    <p>Tidak ditemukan produk untuk "<strong>${query}</strong>"</p>
                </div>
            `;
            return;
        }

        searchResults.innerHTML = results.map(product => `
            <div class="search-result-item" style="
                display: flex;
                align-items: center;
                padding: 10px 15px;
                border-bottom: 1px solid #f0f0f0;
                cursor: pointer;
                transition: background 0.3s ease;
            ">
                <img src="${product.image}" alt="${product.name}" 
                     style="width: 50px; height: 50px; border-radius: 5px; margin-right: 15px; object-fit: cover;">
                <div class="search-result-info" style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #333;">${product.name}</h4>
                    <div class="price" style="color: #007bff; font-weight: 600; font-size: 14px;">${product.price}</div>
                    <small style="color: #666; text-transform: capitalize;">${product.category}</small>
                </div>
            </div>
        `).join('');

        searchResults.querySelectorAll('.search-result-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const productElement = results[index].element;
                selectSearchResult(productElement);
            });
        });

        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.background = '#f8f9fa';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'white';
            });
        });
    }

    function selectSearchResult(productElement) {
        productElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        productElement.style.animation = 'searchHighlight 2s ease';

        searchInput.value = '';
        hideSearchResults();

        setTimeout(() => {
            productElement.style.animation = '';
        }, 2000);
    }

    function performSearch(query) {
        if (!query) {
            resetSearch();
            return;
        }

        const menuItems = document.querySelectorAll('.menu-item');
        let hasResults = false;

        menuItems.forEach(item => {
            const productName = item.querySelector('h3').textContent.toLowerCase();
            const productDesc = item.querySelector('p').textContent.toLowerCase();
            const productCategory = item.getAttribute('data-category');

            if (productName.includes(query.toLowerCase()) ||
                productDesc.includes(query.toLowerCase()) ||
                productCategory.includes(query.toLowerCase())) {
                item.style.display = 'block';
                highlightText(item, query);
                hasResults = true;
            } else {
                item.style.display = 'none';
            }
        });

        showSearchResultsMessage(hasResults, query);
    }

    function highlightText(productElement, query) {
        const productName = productElement.querySelector('h3');
        const productDesc = productElement.querySelector('p');

        const highlightText = (element, term) => {
            const text = element.textContent;
            const regex = new RegExp(`(${term})`, 'gi');
            const highlighted = text.replace(regex, '<mark style="background-color: #fff3cd; padding: 2px 4px; border-radius: 3px;">$1</mark>');
            element.innerHTML = highlighted;
        };

        highlightText(productName, query);
        highlightText(productDesc, query);
    }

    function showSearchResultsMessage(hasResults, query) {
        const existingMessage = document.querySelector('.no-search-results');
        if (existingMessage) {
            existingMessage.remove();
        }

        if (!hasResults) {
            const message = document.createElement('div');
            message.className = 'no-search-results';
            message.style.cssText = `
                text-align: center;
                padding: 40px;
                color: #666;
                grid-column: 1 / -1;
            `;

            message.innerHTML = `
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; color: #ddd;"></i>
                <h3>Tidak ada hasil untuk "${query}"</h3>
                <p>Coba dengan kata kunci yang berbeda atau lihat semua produk kami.</p>
                <button class="btn primary" style="margin-top: 20px;" onclick="resetSearch()">
                    Tampilkan Semua Produk
                </button>
            `;

            document.querySelector('.menu-grid').appendChild(message);
        }
    }

    function resetSearch() {
        searchInput.value = '';
        const menuItems = document.querySelectorAll('.menu-item');

        menuItems.forEach(item => {
            item.style.display = 'block';
            const name = item.querySelector('h3');
            const desc = item.querySelector('p');
            name.innerHTML = name.textContent;
            desc.innerHTML = desc.textContent;
        });

        const message = document.querySelector('.no-search-results');
        if (message) {
            message.remove();
        }

        hideSearchResults();
    }

    window.resetSearch = resetSearch;

    console.log('Search functionality initialized successfully');
}

// Add CSS animation for search highlight
const searchStyle = document.createElement('style');
searchStyle.textContent = `
    @keyframes searchHighlight {
        0% { 
            background-color: transparent; 
            transform: scale(1);
        }
        50% { 
            background-color: rgba(255, 193, 7, 0.2); 
            transform: scale(1.02);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        100% { 
            background-color: transparent; 
            transform: scale(1);
        }
    }
    
    .search-results::-webkit-scrollbar {
        width: 6px;
    }
    
    .search-results::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 0 10px 10px 0;
    }
    
    .search-results::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
    }
    
    .search-results::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
`;
document.head.appendChild(searchStyle);

// ==================== UTILITY FUNCTIONS ====================