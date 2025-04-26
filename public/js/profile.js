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
}

// 檢查用戶認證狀態
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        console.log('User is signed in:', user.email);
        loadUserProfile(user.uid);
    } else {
        console.log('No user is signed in');
        window.location.href = 'index.html';
    }
});

// 載入用戶資料
function loadUserProfile(userId) {
    const userRef = firebase.database().ref('users/' + userId);
    userRef.once('value').then(function(snapshot) {
        const userData = snapshot.val() || {};
        displayProfile(userData);
    }).catch(function(error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile data');
    });
}

// 顯示用戶資料
function displayProfile(userData) {
    const profileInfo = document.getElementById('profile-info');
    if (!profileInfo) return;

    profileInfo.innerHTML = `
        <div class="profile-section">
            <h2>Profile Information</h2>
            <div class="profile-field">
                <label>Display Name:</label>
                <input type="text" id="displayName" value="${userData.displayName || ''}" placeholder="Enter your display name">
            </div>
            <div class="profile-field">
                <label>Bio:</label>
                <textarea id="bio" placeholder="Tell us about yourself">${userData.bio || ''}</textarea>
            </div>
            <div class="profile-field">
                <label>Join Date:</label>
                <span>${userData.joinDate || new Date().toISOString().split('T')[0]}</span>
            </div>
            <button onclick="updateProfile()" class="update-btn">Update Profile</button>
        </div>
    `;
}

// 更新用戶資料
function updateProfile() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please sign in to update your profile');
        return;
    }

    const displayName = document.getElementById('displayName').value;
    const bio = document.getElementById('bio').value;

    const updates = {
        displayName: displayName,
        bio: bio,
        lastUpdated: new Date().toISOString()
    };

    // 如果是新用戶，添加加入日期
    firebase.database().ref('users/' + user.uid).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                updates.joinDate = new Date().toISOString().split('T')[0];
            }
            
            // 更新資料
            return firebase.database().ref('users/' + user.uid).update(updates);
        })
        .then(() => {
            alert('Profile updated successfully!');
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            alert('Error updating profile');
        });
}

document.getElementById('edit-profile').addEventListener('click', function() {
    // Logic to edit user profile
    console.log('Edit profile clicked');
    // This is where you would add functionality to edit and save user profile information
}); 