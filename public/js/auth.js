console.log("auth.js loaded at: " + new Date().toISOString());

// 檢查 Firebase 是否可用
if (typeof firebase === 'undefined') {
    console.error("Firebase not available! Check if Firebase SDK is properly loaded.");
} else {
    console.log("Firebase Auth available:", !!firebase.auth);
}

// 確保 Firebase 已初始化
function ensureFirebaseInitialized() {
    if (!firebase.apps.length) {
        const firebaseConfig = {
            apiKey: "AIzaSyAu9P2YxQN_kCgOpzDhD6Kz4XYoQxXMUyg",
            authDomain: "chatroom-679cd.firebaseapp.com",
            databaseURL: "https://chatroom-679cd-default-rtdb.firebaseio.com",
            projectId: "chatroom-679cd",
            storageBucket: "chatroom-679cd.firebasestorage.app",
            messagingSenderId: "106697321863",
            appId: "1:106697321863:web:58fece4bc10e1cc1507722"
        };
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized in auth.js");
    }
}

// 處理註冊表單提交
var registerForm = document.getElementById('register-form');
if (registerForm) {
    console.log("Register form found");
    
    registerForm.onsubmit = function(e) {
        e.preventDefault();
        console.log("Register form submitted");
        
        ensureFirebaseInitialized();
        
        var email = document.getElementById('register-email').value;
        var password = document.getElementById('register-password').value;
        var submitBtn = document.querySelector('#register-form .submit-btn');
        
        if (!email || !password) {
            alert("Please enter both email and password");
            return;
        }
        
        if (password.length < 6) {
            alert("Password should be at least 6 characters");
            return;
        }
        
        console.log("Attempting to create account with:", email);
        submitBtn.textContent = "Creating account...";
        submitBtn.disabled = true;
        
        // 使用 Firebase SDK 註冊用戶
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                console.log("Registration successful:", userCredential);
                // 註冊成功後自動登入並跳轉到聊天室列表頁面
                window.location.href = "chatrooms.html";
            })
            .catch(function(error) {
                console.error("Registration failed:", error);
                alert(error.message || "Registration failed");
                submitBtn.textContent = "Create Account";
                submitBtn.disabled = false;
            });
    };
}

// 處理登入表單提交
var loginForm = document.getElementById('login-form');
if (loginForm) {
    console.log("Login form found");
    
    loginForm.onsubmit = function(e) {
        e.preventDefault();
        console.log("Login form submitted");
        
        ensureFirebaseInitialized();
        
        var email = document.getElementById('login-email').value;
        var password = document.getElementById('login-password').value;
        var submitBtn = document.querySelector('#login-form .submit-btn');
        
        if (!email || !password) {
            alert("Please enter both email and password");
            return;
        }
        
        console.log("Attempting to login with:", email);
        submitBtn.textContent = "Signing in...";
        submitBtn.disabled = true;
        
        // 使用 Firebase SDK 登入
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                console.log("Login successful:", userCredential);
                window.location.href = "chatrooms.html";
            })
            .catch(function(error) {
                console.error("Login failed:", error);
                alert(error.message || "Login failed");
                submitBtn.textContent = "Sign in";
                submitBtn.disabled = false;
            });
    };
}

// 檢查用戶登入狀態
if (typeof firebase !== 'undefined' && firebase.auth) {
    ensureFirebaseInitialized();
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("User is signed in:", user.email);
            
            // 如果在登入頁面但已登入，跳轉到聊天室列表頁面
            var path = window.location.pathname;
            if (path.endsWith('index.html') || path.endsWith('/')) {
                console.log("Redirecting to chatrooms page...");
                window.location.href = "chatrooms.html";
            }
        } else {
            console.log("No user signed in");
            
            // 如果在聊天頁面但未登入，跳轉到登入頁面
            if (window.location.pathname.endsWith('chat.html')) {
                console.log("Redirecting to login page...");
                window.location.href = "index.html";
            }
        }
    });
}

// 移除可能有問題的代碼
try {
    // 移除這些可能引起問題的監聽器
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    
    // 只在元素存在時添加事件監聽器
    if (loginTab && registerTab) {
        loginTab.onclick = null;
        registerTab.onclick = null;
    }
    
    if (showRegister) showRegister.onclick = null;
    if (showLogin) showLogin.onclick = null;
} catch (e) {
    console.log("Cleanup not needed");
} 