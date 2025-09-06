// Authentication & User Management JavaScript

// Global authentication state
let currentUser = null;
let authToken = null;

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

// Initialize authentication state
function initAuth() {
    // Check for saved token in localStorage
    authToken = localStorage.getItem('authToken');
    
    if (authToken) {
        // Verify token is still valid
        verifyToken();
    } else {
        showGuestMode();
    }
}

// Verify token with server
async function verifyToken() {
    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showLoggedInMode();
            loadUserFolders();
        } else {
            // Token invalid, clear and show guest mode
            localStorage.removeItem('authToken');
            authToken = null;
            showGuestMode();
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        showGuestMode();
    }
}

// Show logged in mode UI
function showLoggedInMode() {
    document.getElementById('guestMenu').classList.add('hidden');
    document.getElementById('userInfo').classList.remove('hidden');
    document.getElementById('folderSection').classList.remove('hidden');
    document.getElementById('userName').textContent = currentUser.firstName 
        ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
        : currentUser.username;
}

// Show guest mode UI
function showGuestMode() {
    document.getElementById('guestMenu').classList.remove('hidden');
    document.getElementById('userInfo').classList.add('hidden');
    document.getElementById('folderSection').classList.add('hidden');
}

// Show authentication modal
function showAuthModal(mode = 'login') {
    const modal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authModalTitle = document.getElementById('authModalTitle');
    const toggleToRegister = document.getElementById('toggleToRegister');
    const toggleToLogin = document.getElementById('toggleToLogin');
    
    if (mode === 'login') {
        authModalTitle.textContent = 'Login';
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        toggleToRegister.classList.remove('hidden');
        toggleToLogin.classList.add('hidden');
    } else {
        authModalTitle.textContent = 'Daftar Akun Baru';
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        toggleToRegister.classList.add('hidden');
        toggleToLogin.classList.remove('hidden');
    }
    
    modal.classList.remove('hidden');
}

// Close authentication modal
function closeAuthModal() {
    document.getElementById('loginModal').classList.add('hidden');
    // Clear form inputs
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

// Toggle between login and register forms
function toggleAuthForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authModalTitle = document.getElementById('authModalTitle');
    const toggleToRegister = document.getElementById('toggleToRegister');
    const toggleToLogin = document.getElementById('toggleToLogin');
    
    if (loginForm.classList.contains('hidden')) {
        // Currently showing register, switch to login
        authModalTitle.textContent = 'Login';
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        toggleToRegister.classList.remove('hidden');
        toggleToLogin.classList.add('hidden');
    } else {
        // Currently showing login, switch to register
        authModalTitle.textContent = 'Daftar Akun Baru';
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        toggleToRegister.classList.add('hidden');
        toggleToLogin.classList.remove('hidden');
    }
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Login successful
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            closeAuthModal();
            showLoggedInMode();
            loadUserFolders();
            showNotification('Login berhasil! Selamat datang, ' + currentUser.username, 'success');
        } else {
            showNotification(data.error || 'Login gagal', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Terjadi kesalahan saat login', 'error');
    }
});

// Handle register form submission
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, lastName, username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Registration successful
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            closeAuthModal();
            showLoggedInMode();
            loadUserFolders();
            showNotification('Pendaftaran berhasil! Selamat datang, ' + currentUser.username, 'success');
        } else {
            showNotification(data.error || 'Pendaftaran gagal', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Terjadi kesalahan saat mendaftar', 'error');
    }
});

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    showGuestMode();
    showNotification('Anda telah logout', 'info');
    
    // Clear any user-specific data from UI
    document.getElementById('folderList').innerHTML = '';
    
    // Reload references without user context
    if (typeof loadReferences === 'function') {
        loadReferences();
    }
}

// Show profile modal (placeholder)
function showProfile() {
    showNotification('Fitur profile akan segera hadir!', 'info');
}

// Get current authentication headers
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
}

// Check if user is authenticated
function isAuthenticated() {
    return authToken !== null && currentUser !== null;
}

// Get current user ID
function getCurrentUserId() {
    return currentUser ? currentUser._id : null;
}
