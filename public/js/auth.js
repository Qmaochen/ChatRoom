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
        
        // 設置身份驗證持久性為 LOCAL
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                console.log("Auth persistence set to LOCAL");
            })
            .catch((error) => {
                console.error("Error setting auth persistence:", error);
            });
            
        console.log("Firebase initialized in auth.js");
    }
    return firebase.auth();
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
        var username = document.getElementById('register-username').value;
        var submitBtn = document.querySelector('#register-form .submit-btn');
        
        if (!email || !password || !username) {
            alert("Please fill in all fields");
            return;
        }
        
        if (password.length < 6) {
            alert("Password should be at least 6 characters");
            return;
        }

        if (username.length < 3 || username.length > 20) {
            alert("Username must be between 3 and 20 characters");
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            alert("Username can only contain letters, numbers, underscores and hyphens");
            return;
        }
        
        console.log("Attempting to create account with:", email);
        submitBtn.textContent = "Creating account...";
        submitBtn.disabled = true;

        let createdUser = null;
        const db = firebase.database();

        // 先檢查用戶名是否已存在
        db.ref(`usernames/${username}`).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    throw new Error('USERNAME_EXISTS');
                }
                // 創建用戶帳號
                return firebase.auth().createUserWithEmailAndPassword(email, password);
            })
            .then(userCredential => {
                console.log("Account created successfully:", userCredential);
                createdUser = userCredential.user;
                
                // 寫入用戶數據
                const userData = {
                    email: email,
                    username: username,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    lastLogin: firebase.database.ServerValue.TIMESTAMP
                };

                // 使用 multi-path update 來確保原子性操作
                const updates = {};
                updates[`users/${createdUser.uid}`] = userData;
                updates[`usernames/${username}`] = createdUser.uid;
                
                return db.ref().update(updates);
            })
            .then(() => {
                console.log("User data saved successfully");
                window.location.href = "chatrooms.html";
            })
            .catch(function(error) {
                console.error("Registration failed:", error);
                
                // 如果發生錯誤，需要刪除已創建的用戶
                if (createdUser) {
                    createdUser.delete().then(() => {
                        console.log("Rolled back user creation");
                    }).catch((deleteError) => {
                        console.error("Error rolling back:", deleteError);
                    });
                }
                
                let errorMessage;
                switch(error.message) {
                    case 'USERNAME_EXISTS':
                        errorMessage = "This username is already taken. Please choose another one.";
                        break;
                    case 'auth/email-already-in-use':
                        errorMessage = "This email is already registered. Please use another email or sign in.";
                        break;
                    case 'auth/invalid-email':
                        errorMessage = "Please enter a valid email address.";
                        break;
                    case 'auth/weak-password':
                        errorMessage = "Password should be at least 6 characters long.";
                        break;
                    default:
                        errorMessage = error.message || "Registration failed. Please try again.";
                }
                
                alert(errorMessage);
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
        
        const auth = ensureFirebaseInitialized();
        const db = firebase.database();
        
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
        auth.signInWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                console.log("Login successful:", userCredential);
                const user = userCredential.user;
                
                // 獲取用戶信息
                return db.ref('users').child(user.uid).once('value')
                    .then(snapshot => {
                        const userData = snapshot.val();
                        // 更新用戶信息
                        localStorage.setItem('currentUser', JSON.stringify({
                            uid: user.uid,
                            email: user.email,
                            username: userData.username,
                            lastLoginTime: new Date().getTime()
                        }));
                        
                        // 更新最後登入時間
                        return db.ref('users').child(user.uid).update({
                            lastLogin: firebase.database.ServerValue.TIMESTAMP
                        });
                    });
            })
            .then(() => {
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