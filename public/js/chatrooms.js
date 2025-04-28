// DOM Elements
const userEmailElement = document.getElementById('user-email');
const chatroomsList = document.getElementById('chatrooms-list');
const createRoomBtn = document.getElementById('create-room-btn');
const createRoomModal = document.getElementById('create-room-modal');
const createRoomForm = document.getElementById('create-room-form');
const closeModalBtn = document.querySelector('.close-modal-btn');
const cancelBtn = document.getElementById('cancel-create-room');
const logoutBtn = document.getElementById('logout-btn');
const roomsCountElement = document.getElementById('rooms-count');

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
                // 只在元素存在時更新內容
                if (userEmailElement) {
                    if (userData && userData.username) {
                        userEmailElement.textContent = userData.username;
                    } else {
                        userEmailElement.textContent = user.email;
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching username:', error);
                // 只在元素存在時更新內容
                if (userEmailElement) {
                    userEmailElement.textContent = user.email;
                }
            });
            
        loadChatrooms();
    });
}

// 載入聊天室列表
function loadChatrooms() {
    const db = firebase.database();
    const chatroomsRef = db.ref('chatrooms');
    const chatroomsContainer = document.getElementById('chatrooms-list');
    
    if (!chatroomsContainer) {
        console.error('Chatrooms container not found');
        return;
    }
    
    chatroomsRef.on('value', async (snapshot) => {
        try {
            chatroomsContainer.innerHTML = '';
            
            if (!snapshot.exists()) {
                chatroomsContainer.innerHTML = `
                    <div class="no-chatrooms">
                        <i class="fas fa-comments"></i>
                        <p>No chatrooms available. Create one to get started!</p>
                    </div>
                `;
                return;
            }
            
            const chatrooms = snapshot.val() || {};
            const user = firebase.auth().currentUser;
            
            // Update rooms count
            const roomsCount = Object.keys(chatrooms).length;
            if (roomsCountElement) {
                roomsCountElement.textContent = `${roomsCount} ${roomsCount === 1 ? 'Room' : 'Rooms'}`;
            }
            
            // Sort chatrooms by creation time (newest first)
            const sortedRooms = Object.entries(chatrooms)
                .sort(([, a], [, b]) => b.createdAt - a.createdAt);
            
            for (const [roomId, room] of sortedRooms) {
                const card = createChatroomCard(room, roomId);
                if (card) {
                    chatroomsContainer.appendChild(card);
                }
            }
        } catch (error) {
            console.error('Error loading chatrooms:', error);
            chatroomsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading chatrooms. Please try again later.</p>
                </div>
            `;
        }
    });
}

// 在 createChatroomCard 函數中添加隱私標記和加入按鈕
function createChatroomCard(room, roomId) {
    if (!room) {
        console.error('Room data is missing');
        return null;
    }

    const card = document.createElement('div');
    card.className = 'chatroom-card';
    card.dataset.roomId = roomId;
    
    // 添加隱私狀態標記
    const privacyIcon = room.privacy === 'private' ? '🔒' : '🌐';
    const privacyText = room.privacy === 'private' ? 'Private' : 'Public';
    const membersCount = room.members ? Object.keys(room.members).length : 0;
    
    card.innerHTML = `
        <div class="chatroom-header">
            <h3 class="chatroom-name">${escapeHtml(room.name) || 'Unnamed Room'}</h3>
            <span class="chatroom-privacy ${room.privacy === 'private' ? 'private' : 'public'}">
                ${privacyIcon} ${privacyText}
            </span>
        </div>
        <p class="chatroom-description">${escapeHtml(room.description || 'No description available')}</p>
        <div class="chatroom-meta">
            <div class="chatroom-members">
                <i class="fas fa-users"></i>
                <span>${membersCount} member${membersCount !== 1 ? 's' : ''}</span>
            </div>
            <span class="chatroom-created">Created ${formatDate(room.createdAt)}</span>
        </div>
    `;

    // 添加點擊事件
    card.addEventListener('click', () => {
        joinChatroom(roomId);
    });
    
    return card;
}

// 創建新聊天室
function createChatroom(name, description) {
    const currentUser = firebase.auth().currentUser;
    
    if (!currentUser) {
        alert("Please login first");
        return;
    }
    
    const db = firebase.database();
    const privacy = document.querySelector('input[name="privacy"]:checked').value;
    
    // 先獲取用戶信息
    db.ref(`users/${currentUser.uid}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            const chatroomsRef = db.ref('chatrooms');
            const newRoomRef = chatroomsRef.push();
            
            return newRoomRef.set({
                name: name,
                description: description,
                privacy: privacy,
                createdBy: currentUser.uid,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                members: {
                    [currentUser.uid]: {
                        email: currentUser.email,
                        username: userData.username,
                        role: 'admin',
                        joinedAt: firebase.database.ServerValue.TIMESTAMP
                    }
                },
                joinRequests: {} // 初始化加入請求列表
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

// 等待 DOM 完全加載
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM fully loaded');
        
        // 初始化頁面
        checkAuthState();
        
        // 登出按鈕事件
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await firebase.auth().signOut();
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('currentRoom');
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('Error signing out:', error);
                    alert('Failed to sign out. Please try again.');
                }
            });
        }

        // Show create room form
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => {
                createRoomModal.classList.add('active');
            });
        }

        // Hide create room form
        if (closeModalBtn || cancelBtn) {
            [closeModalBtn, cancelBtn].forEach(btn => {
                btn.addEventListener('click', () => {
                    createRoomModal.classList.remove('active');
                    createRoomForm.reset();
                });
            });
        }

        // Close overlay when clicking outside the form
        if (createRoomModal) {
            createRoomModal.addEventListener('click', (e) => {
                if (e.target === createRoomModal) {
                    createRoomModal.classList.remove('active');
                }
            });
        }

        // Handle form submission
        if (createRoomForm) {
            createRoomForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const roomName = document.getElementById('room-name').value.trim();
                const roomDescription = document.getElementById('room-description').value.trim();
                const isPrivate = document.getElementById('room-private').checked;

                try {
                    const currentUser = firebase.auth().currentUser;
                    if (!currentUser) {
                        throw new Error('Please login first');
                    }

                    const db = firebase.database();
                    
                    // 先獲取用戶信息
                    const userSnapshot = await db.ref(`users/${currentUser.uid}`).once('value');
                    const userData = userSnapshot.val();
                    
                    const chatroomsRef = db.ref('chatrooms');
                    const newRoomRef = chatroomsRef.push();
                    
                    await newRoomRef.set({
                        name: roomName,
                        description: roomDescription,
                        privacy: isPrivate ? 'private' : 'public',
                        createdBy: currentUser.uid,
                        createdAt: firebase.database.ServerValue.TIMESTAMP,
                        members: {
                            [currentUser.uid]: {
                                email: currentUser.email,
                                username: userData.username,
                                role: 'admin',
                                joinedAt: firebase.database.ServerValue.TIMESTAMP
                            }
                        },
                        joinRequests: {} // 初始化加入請求列表
                    });

                    // Hide the form after successful creation
                    createRoomModal.classList.remove('active');
                    
                    // Clear the form
                    createRoomForm.reset();
                } catch (error) {
                    console.error('Error creating room:', error);
                    alert(error.message || 'Failed to create room. Please try again.');
                }
            });
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
    }
});

// 加入公開聊天室
function joinRoom(roomId) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        alert('Please sign in to join a room');
        return;
    }
    
    firebase.database().ref(`users/${currentUser.uid}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            const username = userData.username || currentUser.email;
            
            return firebase.database().ref(`chatrooms/${roomId}/members/${currentUser.uid}`).set({
                email: currentUser.email,
                username: username,
                role: 'member',
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });
        })
        .then(() => {
            window.location.href = `chat.html?room=${roomId}`;
        })
        .catch(error => {
            console.error('Error joining room:', error);
            alert('Error joining room. Please try again.');
        });
}

// 添加請求加入私有聊天室的函數
function requestJoin(roomId) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        alert('Please sign in to request joining a room');
        return;
    }
    
    const db = firebase.database();
    const requestRef = db.ref(`chatrooms/${roomId}/joinRequests/${currentUser.uid}`);
    
    // 獲取用戶信息
    db.ref(`users/${currentUser.uid}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            // 創建加入請求
            return requestRef.set({
                email: currentUser.email,
                username: userData.username,
                requestedAt: firebase.database.ServerValue.TIMESTAMP,
                status: 'pending'
            });
        })
        .then(() => {
            alert('Join request sent successfully. Please wait for approval.');
            // 重新載入聊天室列表以更新按鈕狀態
            loadChatrooms();
        })
        .catch(error => {
            console.error('Error sending join request:', error);
            alert('Error sending join request. Please try again.');
        });
}

// 修改加入聊天室的函數
async function joinChatroom(roomId) {
    if (!roomId) {
        console.error('No room ID provided');
        return;
    }

    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        alert('Please sign in to join a room');
        return;
    }
    
    const db = firebase.database();
    const roomRef = db.ref(`chatrooms/${roomId}`);
    
    try {
        // 檢查聊天室是否存在
        const roomSnapshot = await roomRef.once('value');
        const room = roomSnapshot.val();
        
        if (!room) {
            throw new Error('Chatroom not found');
        }

        // 檢查用戶是否已經是成員
        if (room.members && room.members[currentUser.uid]) {
            window.location.href = `chat.html?room=${roomId}`;
            return;
        }
        
        // 檢查是否已經有待處理的請求
        if (room.joinRequests && room.joinRequests[currentUser.uid]) {
            const request = room.joinRequests[currentUser.uid];
            if (request.status === 'pending') {
                alert('Your join request is still pending approval.');
                return;
            }
        }
        
        // 如果是私有聊天室，需要發送加入請求
        if (room.privacy === 'private') {
            const userSnapshot = await db.ref(`users/${currentUser.uid}`).once('value');
            const userData = userSnapshot.val();
            
            await roomRef.child(`joinRequests/${currentUser.uid}`).set({
                email: currentUser.email,
                username: userData.username,
                requestedAt: firebase.database.ServerValue.TIMESTAMP,
                status: 'pending'
            });
            
            alert('Join request sent. Please wait for approval.');
            return;
        }
        
        // 如果是公開聊天室，直接加入
        const userSnapshot = await db.ref(`users/${currentUser.uid}`).once('value');
        const userData = userSnapshot.val();
        
        await roomRef.child(`members/${currentUser.uid}`).set({
            email: currentUser.email,
            username: userData.username,
            role: 'member',
            joinedAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        window.location.href = `chat.html?room=${roomId}`;
        
    } catch (error) {
        console.error('Error joining chatroom:', error);
        alert(error.message || 'Error joining chatroom. Please try again.');
    }
}

// 添加進入聊天室的函數（用於已經是成員的用戶）
function enterChatroom(roomId) {
    window.location.href = `chat.html?room=${roomId}`;
}

// Helper Functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'today';
    } else if (diffDays === 1) {
        return 'yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

async function handlePrivateRoomJoin(roomId, room) {
    const user = firebase.auth().currentUser;
    
    // Check if user is already requesting to join
    const requestRef = firebase.database().ref(`joinRequests/${roomId}/${user.uid}`);
    const requestSnapshot = await requestRef.once('value');
    
    if (requestSnapshot.exists()) {
        alert('Your join request is pending approval.');
        return;
    }
    
    const confirmed = confirm('This is a private room. Would you like to request to join?');
    
    if (confirmed) {
        try {
            await requestRef.set({
                userId: user.uid,
                email: user.email,
                requestedAt: firebase.database.ServerValue.TIMESTAMP,
                status: 'pending'
            });
            
            alert('Join request sent! Please wait for admin approval.');
        } catch (error) {
            console.error('Error sending join request:', error);
            alert('Failed to send join request. Please try again.');
        }
    }
} 