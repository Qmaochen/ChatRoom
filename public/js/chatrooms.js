// ChatRoomsList
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
            window.location.replace("/");
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
                    window.location.replace('/');
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
            window.location.href = `/chat?room=${roomId}`;
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
            window.location.href = `/chat?room=${roomId}`;
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
        
        window.location.replace(`/chat?room=${roomId}`);
        
    } catch (error) {
        console.error('Error joining chatroom:', error);
        alert(error.message || 'Error joining chatroom. Please try again.');
    }
}

// 添加進入聊天室的函數（用於已經是成員的用戶）
function enterChatroom(roomId) {
    // 儲存當前房間ID到localStorage
    localStorage.setItem('currentRoomId', roomId);
    // 導航到聊天室頁面
    window.location.href = `/chat?room=${roomId}`;
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

// Join Request Popup Management
let currentPopupCount = 0;

function showJoinRequest(requestData) {
    const requestsSection = document.getElementById('join-requests-section');
    
    // 如果還沒有請求，添加 has-requests 類
    if (!requestsSection.classList.contains('has-requests')) {
        requestsSection.classList.add('has-requests');
    }
    
    // 創建請求項目
    const requestItem = document.createElement('div');
    requestItem.className = 'join-request-item';
    requestItem.dataset.userId = requestData.userId;
    
    requestItem.innerHTML = `
        <div class="request-info">
            <span class="request-user"></span>
            <span class="request-time"></span>
        </div>
        <div class="request-actions">
            <button class="approve-btn">
                <i class="fas fa-check"></i>
                Approve
            </button>
            <button class="reject-btn">
                <i class="fas fa-times"></i>
                Reject
            </button>
        </div>
    `;
    
    // 添加按鈕事件監聽器
    const approveBtn = requestItem.querySelector('.approve-btn');
    const rejectBtn = requestItem.querySelector('.reject-btn');
    
    approveBtn.addEventListener('click', async () => {
        try {
            await handleJoinRequest(requestData.roomId, requestData.userId, true);
            removeRequestItem(requestItem);
        } catch (error) {
            console.error('Error approving request:', error);
        }
    });
    
    rejectBtn.addEventListener('click', async () => {
        try {
            await handleJoinRequest(requestData.roomId, requestData.userId, false);
            removeRequestItem(requestItem);
        } catch (error) {
            console.error('Error rejecting request:', error);
        }
    });
    
    // 添加到請求區域
    requestsSection.appendChild(requestItem);
}

function removeRequestItem(requestItem) {
    requestItem.style.opacity = '0';
    requestItem.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        requestItem.remove();
        
        // 檢查是否還有其他請求
        const requestsSection = document.getElementById('join-requests-section');
        if (!requestsSection.querySelector('.join-request-item')) {
            requestsSection.classList.remove('has-requests');
        }
    }, 300);
}

// 監聽新的加入請求
function listenToJoinRequests(roomId) {
    const joinRequestsRef = firebase.database().ref(`chatrooms/${roomId}/joinRequests`);
    
    joinRequestsRef.on('child_added', (snapshot) => {
        const requestData = snapshot.val();
        requestData.userId = snapshot.key;
        requestData.roomId = roomId;
        
        // 顯示請求
        showJoinRequest(requestData);
    });
    
    // 監聽請求移除
    joinRequestsRef.on('child_removed', (snapshot) => {
        const requestItem = document.querySelector(`.join-request-item[data-user-id="${snapshot.key}"]`);
        if (requestItem) {
            removeRequestItem(requestItem);
        }
    });
}

// 處理加入請求
async function handleJoinRequest(roomId, userId, isApproved) {
    const roomRef = firebase.database().ref(`chatrooms/${roomId}`);
    
    try {
        if (isApproved) {
            // 獲取用戶信息
            const userSnapshot = await firebase.database().ref(`users/${userId}`).once('value');
            const userData = userSnapshot.val();
            
            // 添加用戶到成員列表
            await roomRef.child(`members/${userId}`).set({
                email: userData.email,
                username: userData.username || userData.email,
                role: 'member',
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            // 添加系統消息
            await addSystemMessage(roomId, `${userData.username || userData.email} 已加入聊天室`);
        }
        
        // 移除加入請求
        await roomRef.child(`joinRequests/${userId}`).remove();
        
        // 顯示通知
        showNotification(isApproved ? '已同意加入請求' : '已拒絕加入請求', isApproved ? 'success' : 'error');
    } catch (error) {
        console.error('Error handling join request:', error);
        throw error;
    }
}

// 添加系統消息
async function addSystemMessage(roomId, message) {
    const messagesRef = firebase.database().ref(`chatrooms/${roomId}/messages`);
    await messagesRef.push({
        text: message,
        type: 'system',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}-notification`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'times-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 3000);
    }, 3000);
}

// 顯示待處理的加入請求
async function displayPendingRequests() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;

    const db = firebase.database();
    const requestsContainer = document.createElement('div');
    requestsContainer.id = 'pending-requests';
    requestsContainer.className = 'pending-requests-container';

    // 獲取當前用戶管理的聊天室
    const roomsSnapshot = await db.ref('chatrooms').once('value');
    const rooms = roomsSnapshot.val() || {};

    let hasRequests = false;
    
    for (const [roomId, room] of Object.entries(rooms)) {
        // 檢查當前用戶是否為該聊天室的管理員
        if (room.members?.[currentUser.uid]?.role === 'admin' && room.joinRequests) {
            const pendingRequests = Object.entries(room.joinRequests)
                .filter(([_, request]) => request.status === 'pending');

            if (pendingRequests.length > 0) {
                hasRequests = true;
                const roomRequests = document.createElement('div');
                roomRequests.className = 'room-requests';
                roomRequests.innerHTML = `
                    <h3>${escapeHtml(room.name)} - Join Request</h3>
                    <div class="requests-list"></div>
                `;

                const requestsList = roomRequests.querySelector('.requests-list');
                
                for (const [userId, request] of pendingRequests) {
                    const requestElement = document.createElement('div');
                    requestElement.className = 'request-item';
                    requestElement.innerHTML = `
                        <div class="request-info">
                            <span class="request-user">${escapeHtml(request.username || request.email)}</span>
                            <span class="request-time">${formatTimestamp(request.requestedAt)}</span>
                        </div>
                        <div class="request-actions">
                            <button class="approve-btn" onclick="handleRequest('${roomId}', '${userId}', 'approve')">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="reject-btn" onclick="handleRequest('${roomId}', '${userId}', 'reject')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    `;
                    requestsList.appendChild(requestElement);
                }
                
                requestsContainer.appendChild(roomRequests);
            }
        }
    }

    if (hasRequests) {
        const chatroomsList = document.querySelector('.chatrooms-list');
        if (chatroomsList) {
            chatroomsList.parentElement.insertBefore(requestsContainer, chatroomsList);
        }
    }
}

// 處理加入請求
async function handleRequest(roomId, userId, action) {
    try {
        const db = firebase.database();
        const roomRef = db.ref(`chatrooms/${roomId}`);
        
        // 更新請求狀態
        await roomRef.child(`joinRequests/${userId}`).update({
            status: action,
            handledAt: firebase.database.ServerValue.TIMESTAMP,
            handledBy: firebase.auth().currentUser.uid
        });

        if (action === 'approve') {
            // 獲取用戶資料
            const requestSnapshot = await roomRef.child(`joinRequests/${userId}`).once('value');
            const request = requestSnapshot.val();

            // 將用戶添加到成員列表
            await roomRef.child(`members/${userId}`).set({
                email: request.email,
                username: request.username,
                role: 'member',
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });
        }

        // 重新載入請求列表
        const requestsContainer = document.getElementById('pending-requests');
        if (requestsContainer) {
            requestsContainer.remove();
        }
        await displayPendingRequests();

    } catch (error) {
        console.error('Error handling request:', error);
        alert('處理請求時發生錯誤，請稍後再試。');
    }
}

// 格式化時間戳
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// 在頁面載入時顯示待處理的請求
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            displayPendingRequests();
        }
    });
}); 