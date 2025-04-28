// Profile functionality

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
    }
    return firebase.auth();
}

// 驗證輸入
function validateInput(input, type) {
    const patterns = {
        username: /^[a-zA-Z0-9_-]{3,20}$/,
        phone: /^\+?[\d\s-]{10,}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    };

    if (!input.trim()) return true; // 允許空值
    return patterns[type] ? patterns[type].test(input) : true;
}

// 處理錯誤顯示
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    const errorDiv = element.parentElement.querySelector('.error-message') || 
                    document.createElement('div');
    
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#f44336';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    
    if (!element.parentElement.querySelector('.error-message')) {
        element.parentElement.appendChild(errorDiv);
    }
}

// 清除錯誤消息
function clearError(elementId) {
    const element = document.getElementById(elementId);
    const errorDiv = element.parentElement.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const profileContainer = document.getElementById('profile-info');
    const auth = ensureFirebaseInitialized();
    
    // 檢查用戶登入狀態
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // 獲取用戶資料
            const db = firebase.database();
            const userRef = db.ref(`users/${user.uid}`);
            
            try {
                const snapshot = await userRef.once('value');
                const userData = snapshot.val() || {};
                
                // 顯示用戶資料表單
                profileContainer.innerHTML = `
                    <form id="profile-form" class="profile-section">
                        <div class="profile-field">
                            <label for="profile-picture">Profile Picture</label>
                            <div class="profile-picture-container">
                                <img id="profile-preview" src="${userData.photoURL || 'https://via.placeholder.com/150'}" 
                                     alt="Profile picture" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover;">
                                <input type="file" id="profile-picture" accept="image/*" style="display: none;">
                                <button type="button" onclick="document.getElementById('profile-picture').click()" class="update-btn">
                                    Change Picture
                                </button>
                            </div>
                        </div>
                        
                        <div class="profile-field">
                            <label for="username">Username</label>
                            <input type="text" id="username" value="${userData.username || ''}" required
                                   placeholder="Enter your username (3-20 characters)">
                        </div>
                        
                        <div class="profile-field">
                            <label for="email">Email</label>
                            <input type="email" id="email" value="${user.email}" disabled>
                        </div>
                        
                        <div class="profile-field">
                            <label for="phone">Phone Number</label>
                            <input type="tel" id="phone" value="${userData.phone || ''}"
                                   placeholder="Enter your phone number">
                        </div>
                        
                        <div class="profile-field">
                            <label for="bio">Bio</label>
                            <textarea id="bio" placeholder="Tell us about yourself">${userData.bio || ''}</textarea>
                        </div>

                        <div class="profile-field">
                            <label for="address">Address</label>
                            <textarea id="address" placeholder="Enter your address">${userData.address || ''}</textarea>
                        </div>
                        
                        <div class="profile-field">
                            <label>Account Status</label>
                            <div class="status-info">
                                <p>Member since: ${new Date(userData.createdAt || Date.now()).toLocaleDateString()}</p>
                                <p>Last login: ${new Date(userData.lastLogin || Date.now()).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <button type="submit" class="update-btn">Update Profile</button>
                    </form>
                `;
                
                // 處理圖片上傳預覽
                const profilePicture = document.getElementById('profile-picture');
                const profilePreview = document.getElementById('profile-preview');
                
                profilePicture.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        if (file.size > 5 * 1024 * 1024) { // 5MB limit
                            alert('Image size should not exceed 5MB');
                            return;
                        }
                        
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            profilePreview.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                });
                
                // 即時驗證
                const usernameInput = document.getElementById('username');
                const phoneInput = document.getElementById('phone');
                
                usernameInput.addEventListener('input', () => {
                    clearError('username');
                    if (!validateInput(usernameInput.value, 'username')) {
                        showError('username', 'Username must be 3-20 characters and can only contain letters, numbers, underscores and hyphens');
                    }
                });
                
                phoneInput.addEventListener('input', () => {
                    clearError('phone');
                    if (!validateInput(phoneInput.value, 'phone')) {
                        showError('phone', 'Please enter a valid phone number');
                    }
                });
                
                // 處理表單提交
                const profileForm = document.getElementById('profile-form');
                profileForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const username = document.getElementById('username').value.trim();
                    const phone = document.getElementById('phone').value.trim();
                    const bio = document.getElementById('bio').value.trim();
                    const address = document.getElementById('address').value.trim();
                    
                    // 驗證輸入
                    if (!validateInput(username, 'username')) {
                        showError('username', 'Invalid username format');
                        return;
                    }
                    
                    if (phone && !validateInput(phone, 'phone')) {
                        showError('phone', 'Invalid phone number format');
                        return;
                    }
                    
                    try {
                        const updatedData = {
                            username,
                            phone,
                            bio,
                            address,
                            updatedAt: firebase.database.ServerValue.TIMESTAMP
                        };
                        
                        // 更新用戶資料
                        await userRef.update(updatedData);
                        
                        // 處理圖片上傳
                        const file = profilePicture.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = async (e) => {
                                await userRef.update({
                                    photoURL: e.target.result
                                });
                            };
                            reader.readAsDataURL(file);
                        }
                        
                        // 顯示成功消息
                        const successMessage = document.createElement('div');
                        successMessage.className = 'success-message';
                        successMessage.style.backgroundColor = '#4CAF50';
                        successMessage.style.color = 'white';
                        successMessage.style.padding = '10px';
                        successMessage.style.borderRadius = '5px';
                        successMessage.style.marginTop = '10px';
                        successMessage.textContent = 'Profile updated successfully!';
                        
                        profileForm.appendChild(successMessage);
                        setTimeout(() => successMessage.remove(), 3000);
                        
                    } catch (error) {
                        console.error('Error updating profile:', error);
                        alert('Failed to update profile. Please try again.');
                    }
                });
            } catch (error) {
                console.error('Error loading profile:', error);
                profileContainer.innerHTML = `
                    <div class="error-container" style="text-align: center; padding: 20px;">
                        <i class="fas fa-exclamation-circle" style="color: #f44336; font-size: 48px;"></i>
                        <h2 style="color: #f44336; margin: 10px 0;">Error Loading Profile</h2>
                        <p>We encountered an error while loading your profile. Please try again later.</p>
                        <button onclick="location.reload()" class="update-btn" style="margin-top: 20px;">
                            Retry
                        </button>
                    </div>
                `;
            }
        } else {
            window.location.href = 'index.html';
        }
    });
}); 