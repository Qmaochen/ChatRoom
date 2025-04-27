// DOM Elements
const userEmailElement = document.getElementById('user-email');
const chatroomsList = document.getElementById('chatrooms-list');
const createRoomBtn = document.getElementById('create-room-btn');
const createRoomModal = document.getElementById('create-room-modal');
const createRoomForm = document.getElementById('create-room-form');
const cancelCreateRoomBtn = document.getElementById('cancel-create-room');
const logoutButton = document.getElementById('logout-btn');

// 確保 Firebase 已初始化
function ensureFirebaseInitialized() {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    return firebase.auth();
}

// 檢查用戶登入狀態
function checkAuthState() {
    const auth = ensureFirebaseInitialized();
    auth.onAuthStateChanged(function(user) {
        if (!user) {
            console.log("No user logged in");
            window.location.href = "index.html";
            return;
        }
        console.log("User logged in:", user.email);
        
        // 獲取並顯示用戶名
        const db = firebase.database();
        db.ref(`users/${user.uid}`).once('value')
            .then(snapshot => {
                const userData = snapshot.val();
                if (userData && userData.username) {
                    userEmailElement.textContent = userData.username;
                } else {
                    userEmailElement.textContent = user.email;
                }
            })
            .catch(error => {
                console.error('Error fetching username:', error);
                userEmailElement.textContent = user.email;
            });
            
        loadChatrooms();
    });
}

// 載入聊天室列表
function loadChatrooms() {
    const db = firebase.database();
    const chatroomsRef = db.ref('chatrooms');
    
    if (!chatroomsList) {
        console.error("Chatrooms list element not found");
        return;
    }
    
    chatroomsRef.on('value', (snapshot) => {
        chatroomsList.innerHTML = '';
        snapshot.forEach((doc) => {
            const room = doc.val();
            const roomId = doc.key;
            const roomElement = document.createElement('div');
            roomElement.className = 'chatroom-card';
            roomElement.innerHTML = `
                <div class="chatroom-info">
                    <h3 class="chatroom-name">${room.name}</h3>
                    <p class="chatroom-description">${room.description || 'No description'}</p>
                </div>
                <div class="chatroom-meta">
                    <div class="chatroom-members">
                        <i class="fas fa-users"></i>
                        <span>${Object.keys(room.members || {}).length} members</span>
                    </div>
                    <button onclick="joinChatroom('${roomId}', '${room.name}')" class="join-btn">
                        <i class="fas fa-sign-in-alt"></i>
                        Join
                    </button>
                </div>
            `;
            chatroomsList.appendChild(roomElement);
        });
    });
}

// 加入聊天室
function joinChatroom(roomId, roomName) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        alert("Please login first");
        window.location.href = "index.html";
        return;
    }
    
    const db = firebase.database();
    
    // 先獲取用戶信息
    db.ref(`users/${currentUser.uid}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            const roomRef = db.ref(`chatrooms/${roomId}/members/${currentUser.uid}`);
            
            return roomRef.set({
                email: currentUser.email,
                username: userData.username,
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });
        })
        .then(() => {
            // 儲存當前聊天室資訊
            localStorage.setItem('currentRoom', JSON.stringify({
                id: roomId,
                name: roomName
            }));
            
            // 導向到聊天室頁面
            window.location.href = `chat.html?room=${roomId}`;
        })
        .catch((error) => {
            console.error("Error joining chatroom:", error);
            alert("Error joining chatroom. Please try again.");
        });
}

// 創建新聊天室
function createChatroom(name, description) {
    const currentUser = firebase.auth().currentUser;
    
    if (!currentUser) {
        alert("Please login first");
        return;
    }
    
    const db = firebase.database();
    
    // 先獲取用戶信息
    db.ref(`users/${currentUser.uid}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            const chatroomsRef = db.ref('chatrooms');
            const newRoomRef = chatroomsRef.push();
            
            return newRoomRef.set({
                name: name,
                description: description,
                createdBy: currentUser.uid,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                members: {
                    [currentUser.uid]: {
                        email: currentUser.email,
                        username: userData.username,
                        role: 'admin',
                        joinedAt: firebase.database.ServerValue.TIMESTAMP
                    }
                }
            });
        })
        .then(() => {
            console.log("Chatroom created successfully");
            createRoomModal.classList.remove('active');
            createRoomForm.reset();
        })
        .catch((error) => {
            console.error("Error creating chatroom:", error);
            alert(error.message);
        });
}

// 處理創建聊天室表單
if (createRoomForm) {
    createRoomForm.onsubmit = function(e) {
        e.preventDefault();
        const name = document.getElementById('room-name').value;
        const description = document.getElementById('room-description').value;
        
        if (!name) {
            alert("Please enter a room name");
            return;
        }
        
        createChatroom(name, description);
    };
}

// 創建聊天室相關事件
createRoomBtn.addEventListener('click', () => {
    createRoomModal.classList.add('active');
});

cancelCreateRoomBtn.addEventListener('click', () => {
    createRoomModal.classList.remove('active');
    createRoomForm.reset();
});

// 登出
logoutButton.addEventListener('click', () => {
    firebase.auth().signOut()
        .then(() => {
            console.log('User signed out successfully');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentRoom');
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        });
});

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
}); 