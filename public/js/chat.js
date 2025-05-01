// Utility Functions
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function sanitizeUrl(url) {
    if (!url) return '';
    // Only allow http:, https:, and data: protocols
    const protocol = url.split(':')[0].toLowerCase();
    if (!['http', 'https', 'data'].includes(protocol)) {
        return '';
    }
    return escapeHtml(url);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // Get DOM elements
    const messageList = document.getElementById('message-list');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const userEmailElement = document.getElementById('user-email');
    const logoutButton = document.getElementById('logout-btn');
    const roomNameElement = document.getElementById('room-name');
    const membersCountElement = document.getElementById('room-members-count');
    const membersList = document.getElementById('members-list');
    const toggleMembersButton = document.getElementById('toggle-members');
    const membersSidebar = document.querySelector('.members-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // 初始化 UI 元素
    function initializeUI() {
        // 側邊欄切換功能
        if (toggleMembersButton && membersSidebar && sidebarOverlay) {
            toggleMembersButton.addEventListener('click', () => {
                membersSidebar.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
                document.body.classList.toggle('sidebar-open');
            });

            sidebarOverlay.addEventListener('click', () => {
                membersSidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            });

            // 按ESC關閉側邊欄
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && membersSidebar.classList.contains('active')) {
                    membersSidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            });

            // 響應式處理
            let windowWidth = window.innerWidth;
            window.addEventListener('resize', () => {
                const newWidth = window.innerWidth;
                if (newWidth !== windowWidth) {
                    windowWidth = newWidth;
                    if (newWidth > 768 && membersSidebar.classList.contains('active')) {
                        membersSidebar.classList.remove('active');
                        sidebarOverlay.classList.remove('active');
                        document.body.classList.remove('sidebar-open');
                    }
                }
            });
        }

        // 登出按鈕功能
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                firebase.auth().signOut()
                    .then(() => {
                        console.log('User signed out successfully');
                        window.location.href = 'index.html';
                    })
                    .catch((error) => {
                        console.error('Error signing out:', error);
                        alert('Error signing out. Please try again.');
                    });
            });
        }

        // 消息表單提交功能
        if (messageForm) {
            messageForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const messageInput = document.getElementById('message-input');
                const message = messageInput.value.trim();
                
                if (!message) return;

                try {
                    const currentUser = firebase.auth().currentUser;
                    if (!currentUser) {
                        throw new Error('Please sign in to send messages');
                    }

                    const db = firebase.database();
                    const messagesRef = db.ref(`chatrooms/${roomId}/messages`);

                    await messagesRef.push().set({
                        text: message,
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        userId: currentUser.uid,
                        displayName: currentUser.displayName || currentUser.email,
                        type: 'user'
                    });

                    messageInput.value = '';
                } catch (error) {
                    console.error('Error sending message:', error);
                    alert(error.message || 'Failed to send message. Please try again.');
                }
            });
        }

        // 監聽加入請求
        function listenToJoinRequests() {
            const db = firebase.database();
            const roomRef = db.ref(`chatrooms/${roomId}`);

            // 監聽新的加入請求
            roomRef.child('joinRequests').on('child_added', async (snapshot) => {
                try {
                    const request = snapshot.val();
                    if (!request || request.status !== 'pending') return;

                    // 在通知集合中添加請求通知
                    const notificationRef = roomRef.child('notifications').push();
                    await notificationRef.set({
                        type: 'join_request',
                        userId: request.userId,
                        username: request.username || request.email,
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        status: 'pending',
                        requestId: snapshot.key
                    });
                } catch (error) {
                    console.error('Error processing join request:', error);
                }
            });

            // 監聽請求狀態變化
            roomRef.child('joinRequests').on('child_changed', async (snapshot) => {
                try {
                    const request = snapshot.val();
                    if (!request) return;

                    // 更新通知狀態
                    const notificationsRef = roomRef.child('notifications');
                    const notificationsSnapshot = await notificationsRef.orderByChild('requestId').equalTo(snapshot.key).once('value');
                    
                    notificationsSnapshot.forEach(notification => {
                        notification.ref.update({
                            status: request.status
                        });
                    });

                    if (request.status === 'approve') {
                        // 將用戶添加到成員列表
                        await roomRef.child(`members/${request.userId}`).set({
                            email: request.email,
                            username: request.username,
                            role: 'member',
                            joinedAt: firebase.database.ServerValue.TIMESTAMP
                        });
                    }
                } catch (error) {
                    console.error('Error processing join request status change:', error);
                }
            });

            // 監聽通知
            roomRef.child('notifications').on('child_added', async (snapshot) => {
                try {
                    const notification = snapshot.val();
                    if (!notification) return;

                    const currentUser = firebase.auth().currentUser;
                    if (!currentUser) return;

                    // 檢查用戶是否為管理員
                    const memberSnapshot = await roomRef.child(`members/${currentUser.uid}`).once('value');
                    const memberData = memberSnapshot.val();
                    
                    if (memberData?.role === 'admin') {
                        displayNotification(notification, snapshot.key);
                    }
                } catch (error) {
                    console.error('Error displaying notification:', error);
                }
            });
        }

        // 處理加入請求
        window.handleJoinRequest = async function(requestId, action) {
            try {
                const currentUser = firebase.auth().currentUser;
                if (!currentUser) {
                    throw new Error('You must be logged in to handle join requests');
                }

                const db = firebase.database();
                const roomRef = db.ref(`chatrooms/${roomId}`);
                
                // 檢查當前用戶是否為管理員
                const memberSnapshot = await roomRef.child(`members/${currentUser.uid}`).once('value');
                const memberData = memberSnapshot.val();
                
                if (!memberData || memberData.role !== 'admin') {
                    throw new Error('Only admins can handle join requests');
                }

                // 更新請求狀態
                await roomRef.child(`joinRequests/${requestId}`).update({
                    status: action,
                    handledBy: currentUser.uid,
                    handledAt: firebase.database.ServerValue.TIMESTAMP
                });

                console.log(`Join request ${requestId} ${action}d successfully`);
            } catch (error) {
                console.error('Error handling join request:', error);
                alert(error.message);
            }
        };
    }

    // 顯示通知
    function displayNotification(notification, notificationId) {
        if (!messageList) return;

        const notificationElement = document.createElement('div');
        notificationElement.className = 'message system-message notification';
        notificationElement.id = `notification-${notificationId}`;

        if (notification.type === 'join_request' && notification.status === 'pending') {
            notificationElement.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${escapeHtml(notification.username)} 請求加入聊天室</div>
                    <div class="request-actions">
                        <button onclick="handleJoinRequest('${notification.requestId}', 'approve')" class="approve-btn">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button onclick="handleJoinRequest('${notification.requestId}', 'reject')" class="reject-btn">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                    <div class="message-time">${formatTimestamp(notification.timestamp)}</div>
                </div>
            `;
        }

        messageList.appendChild(notificationElement);
        messageList.scrollTop = messageList.scrollHeight;
    }

    // 檢查所有必需的 DOM 元素是否存在
    if (!messageList) {
        console.error('Element with id "message-list" not found');
        return;
    }

    // 獲取聊天室 ID
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');

    if (!roomId) {
        console.log('No room ID provided, redirecting to chatrooms page');
        window.location.href = 'chatrooms.html';
        return;
    }

    let currentRoom = null;
    let currentUser = null;

    // 更新房間信息
    function updateRoomInfo(room) {
        if (roomNameElement) {
            roomNameElement.textContent = room.name || 'Chat Room';
        }
        
        const membersCount = room.members ? Object.keys(room.members).length : 0;
        if (membersCountElement) {
            membersCountElement.textContent = `${membersCount} member${membersCount !== 1 ? 's' : ''}`;
        }
    }

    // 更新成員列表
    function updateMembersList(members) {
        if (!membersList) return;
        
        membersList.innerHTML = `
            <div class="members-header">
                <h3>Room Members</h3>
                <span class="members-count">${Object.keys(members).length}</span>
            </div>
            <div class="members-list-content"></div>
        `;

        const membersListContent = membersList.querySelector('.members-list-content');
        
        Object.entries(members).forEach(([uid, member]) => {
            const memberElement = document.createElement('div');
            memberElement.classList.add('member-item');
            
            firebase.database().ref(`users/${uid}`).once('value')
                .then(snapshot => {
                    const userData = snapshot.val() || {};
                    const initials = member.username ? member.username.substring(0, 2).toUpperCase() : 
                                   member.email.split('@')[0].substring(0, 2).toUpperCase();
                    
                    memberElement.innerHTML = `
                        <div class="member-avatar">
                            ${userData.photoURL ? 
                                `<img src="${userData.photoURL}" alt="${member.username}'s avatar">` :
                                initials}
                        </div>
                        <div class="member-info">
                            <div class="member-name">${member.username || member.email}</div>
                            <div class="member-role ${member.role === 'admin' ? 'admin-role' : ''}">${member.role || 'member'}</div>
                        </div>
                    `;
                });
            
            membersListContent.appendChild(memberElement);
        });
    }

    // 顯示加入請求
    function displayJoinRequests() {
        const db = firebase.database();
        const requestsSection = document.getElementById('join-requests-section');
        const roomRef = db.ref(`chatrooms/${roomId}`);

        roomRef.child('joinRequests').on('value', snapshot => {
            const requests = snapshot.val() || {};
            const pendingRequests = Object.entries(requests).filter(([_, req]) => req.status === 'pending');

            if (pendingRequests.length > 0) {
                requestsSection.innerHTML = `
                    <div class="requests-header">
                        <h3>Pending Requests</h3>
                        <span class="requests-count">${pendingRequests.length}</span>
                    </div>
                    <div class="requests-list"></div>
                `;

                const requestsList = requestsSection.querySelector('.requests-list');
                
                pendingRequests.forEach(([userId, request]) => {
                    const requestElement = document.createElement('div');
                    requestElement.className = 'request-item';
                    requestElement.innerHTML = `
                        <div class="request-info">
                            <div class="request-user">${escapeHtml(request.username || request.email)}</div>
                            <div class="request-time">${formatTimestamp(request.requestedAt)}</div>
                        </div>
                        <div class="request-actions">
                            <button class="approve-btn" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="reject-btn" title="Reject">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;

                    // 添加按鈕事件
                    const approveBtn = requestElement.querySelector('.approve-btn');
                    const rejectBtn = requestElement.querySelector('.reject-btn');

                    approveBtn.addEventListener('click', () => handleJoinRequest(userId, 'approve'));
                    rejectBtn.addEventListener('click', () => handleJoinRequest(userId, 'reject'));

                    requestsList.appendChild(requestElement);
                });
            } else {
                requestsSection.innerHTML = '';
            }
        });
    }

    // 處理加入請求
    async function handleJoinRequest(userId, action) {
        try {
            const db = firebase.database();
            const roomRef = db.ref(`chatrooms/${roomId}`);
            
            // 獲取請求資料
            const requestSnapshot = await roomRef.child(`joinRequests/${userId}`).once('value');
            const request = requestSnapshot.val();

            if (action === 'approve') {
                // 添加用戶到成員列表
                await roomRef.child(`members/${userId}`).set({
                    email: request.email,
                    username: request.username,
                    role: 'member',
                    joinedAt: firebase.database.ServerValue.TIMESTAMP
                });

                // 更新請求狀態
                await roomRef.child(`joinRequests/${userId}`).update({
                    status: 'approved',
                    handledAt: firebase.database.ServerValue.TIMESTAMP,
                    handledBy: firebase.auth().currentUser.uid
                });

                // 更新UI
                const memberElement = document.createElement('div');
                memberElement.classList.add('member-item');
                memberElement.innerHTML = `
                    <div class="member-avatar">
                        ${request.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div class="member-info">
                        <div class="member-name">${request.username}</div>
                        <div class="member-role">member</div>
                    </div>
                `;
                
                const membersListContent = membersList.querySelector('.members-list-content');
                if (membersListContent) {
                    membersListContent.appendChild(memberElement);
                }

                // 顯示通知
                showNotification(`${request.username} has joined the chat room`, 'success');
            } else {
                // 更新請求狀態為拒絕
                await roomRef.child(`joinRequests/${userId}`).update({
                    status: 'rejected',
                    handledAt: firebase.database.ServerValue.TIMESTAMP,
                    handledBy: firebase.auth().currentUser.uid
                });

                // 顯示通知
                showNotification(`Request from ${request.username} has been rejected`, 'info');
            }

            // 移除請求項目
            const requestElement = document.querySelector(`.request-item[data-user-id="${userId}"]`);
            if (requestElement) {
                requestElement.remove();
            }

            // 更新請求計數
            updateRequestsCount();

        } catch (error) {
            console.error('Error handling join request:', error);
            showNotification('Error processing request. Please try again.', 'error');
        }
    }

    // 顯示通知
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // 動畫效果
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // 自動移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 更新請求計數
    function updateRequestsCount() {
        const requestsCount = document.querySelector('.requests-count');
        const requestsList = document.querySelector('.requests-list');
        
        if (requestsCount && requestsList) {
            const count = requestsList.children.length;
            requestsCount.textContent = count;

            // 如果沒有請求了，隱藏整個請求區域
            const requestsSection = document.getElementById('join-requests-section');
            if (requestsSection && count === 0) {
                requestsSection.innerHTML = '';
            }
        }
    }

    // 載入訊息
    function loadMessages() {
        if (!messageList) {
            console.error('Message list element not found in loadMessages');
            return;
        }

        const db = firebase.database();
        const messagesRef = db.ref(`chatrooms/${roomId}/messages`);
        
        messageList.innerHTML = '';
        
        messagesRef.on('child_added', async (snapshot) => {
            try {
                const message = snapshot.val();
                displayMessage(message, snapshot.key);
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });
    }

    // 顯示訊息
    function displayMessage(message, messageId) {
        if (!messageList) {
            console.error('Message list element not found in displayMessage');
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.id = messageId;

        if (message.type === 'system') {
            if (message.requestId) {
                // 這是一個加入請求消息
                messageElement.className = 'message system-message join-request';
                messageElement.innerHTML = `
                    <div class="message-content">
                        <div class="message-text">${escapeHtml(message.text)}</div>
                        <div class="request-actions">
                            <button onclick="handleJoinRequest('${message.requestId}', 'approve')" class="approve-btn">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button onclick="handleJoinRequest('${message.requestId}', 'reject')" class="reject-btn">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                        <div class="message-time">${formatTimestamp(message.timestamp)}</div>
                    </div>
                `;
            } else {
                // 一般系統消息
                messageElement.className = 'message system-message';
                messageElement.innerHTML = `
                    <div class="message-content">
                        <div class="message-text">${escapeHtml(message.text)}</div>
                        <div class="message-time">${formatTimestamp(message.timestamp)}</div>
                    </div>
                `;
            }
        } else {
            const isCurrentUser = message.userId === firebase.auth().currentUser?.uid;
            messageElement.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
            
            messageElement.innerHTML = `
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${escapeHtml(message.displayName || 'Anonymous')}</div>` : ''}
                    <div class="message-text">${escapeHtml(message.text)}</div>
                    <div class="message-time">${formatTimestamp(message.timestamp)}</div>
                </div>
            `;
        }

        messageList.appendChild(messageElement);
        messageList.scrollTop = messageList.scrollHeight;
    }

    // 處理新消息通知
    async function handleNewMessageNotification(message) {
        // 如果消息是系統消息或是當前用戶發送的，不發送通知
        if (message.type === 'system' || message.userId === currentUser.uid) {
            return;
        }

        // 如果瀏覽器窗口在焦點上或沒有通知權限，不發送通知
        if (document.hasFocus() || Notification.permission !== "granted") {
            return;
        }

        try {
            // 獲取發送者的用戶信息
            const userSnapshot = await firebase.database().ref(`users/${message.userId}`).once('value');
            const userData = userSnapshot.val() || {};
            const displayName = userData.username || message.email;

            // 獲取聊天室信息
            const roomSnapshot = await firebase.database().ref(`chatrooms/${roomId}`).once('value');
            const roomData = roomSnapshot.val() || {};
            const roomName = roomData.name || 'Chat Room';

            // 創建通知
            const notification = new Notification(`New message in ${roomName}`, {
                body: `${displayName}: ${message.text}`,
                icon: "/images/chat-icon.png",  // 使用默認圖標
                tag: `chat-${roomId}`,  // 使用tag來防止重複通知
                requireInteraction: false,  // 通知會自動關閉
                silent: false  // 允許聲音
            });

            // 點擊通知時的行為
            notification.onclick = function() {
                // 聚焦到聊天窗口
                window.focus();
                this.close();
            };

            // 5秒後自動關閉通知
            setTimeout(() => notification.close(), 5000);

        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    // 檢查用戶是否是聊天室成員
    function checkRoomMembership(user) {
        const db = firebase.database();
        const roomRef = db.ref(`chatrooms/${roomId}`);
        
        return roomRef.once('value').then((snapshot) => {
            const room = snapshot.val();
            if (!room) {
                console.error('Chatroom not found');
                alert('Chatroom not found');
                window.location.href = 'chatrooms.html';
                return false;
            }

            currentRoom = room;
            
            if (!room.members || !room.members[user.uid]) {
                if (room.privacy === 'private') {
                    return roomRef.child(`joinRequests/${user.uid}`).once('value').then(snapshot => {
                        const request = snapshot.val();
                        if (!request) {
                            return roomRef.child(`joinRequests/${user.uid}`).set({
                                userId: user.uid,
                                email: user.email,
                                username: user.displayName || user.email,
                                status: 'pending',
                                requestedAt: firebase.database.ServerValue.TIMESTAMP
                            }).then(() => {
                                alert('Your join request has been sent. Please wait for approval.');
                                window.location.href = 'chatrooms.html';
                                return false;
                            });
                        } else if (request.status === 'rejected') {
                            alert('Your join request has been rejected.');
                            window.location.href = 'chatrooms.html';
                            return false;
                        } else if (request.status === 'pending') {
                            alert('Your join request is still pending approval.');
                            window.location.href = 'chatrooms.html';
                            return false;
                        }
                    });
                }
                
                return roomRef.child(`members/${user.uid}`).set({
                    email: user.email,
                    username: user.displayName || user.email,
                    role: 'member',
                    joinedAt: firebase.database.ServerValue.TIMESTAMP
                }).then(() => {
                    updateRoomInfo(room);
                    loadMessages();
                    return true;
                });
            }
            
            updateRoomInfo(room);
            if (room.members) {
                updateMembersList(room.members);
            }
            loadMessages();
            return true;
        });
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

    // 初始化應用程序
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log('User is signed in:', user.email);
            currentUser = user;
            
            // 獲取用戶名和頭像並顯示
            if (userEmailElement) {
                const db = firebase.database();
                db.ref(`users/${user.uid}`).once('value')
                    .then(snapshot => {
                        const userData = snapshot.val();
                        const userInfo = document.querySelector('.user-info');
                        
                        if (userInfo) {
                            userInfo.innerHTML = `
                                <a href="profile.html" class="profile-link" aria-label="View profile">
                                    <div class="user-avatar">
                                        ${userData?.photoURL ? 
                                            `<img src="${userData.photoURL}" alt="Your avatar">` :
                                            (userData?.username ? userData.username.substring(0, 2).toUpperCase() : 
                                             user.email.substring(0, 2).toUpperCase())}
                                    </div>
                                    <span id="user-email" aria-label="Current user email">
                                        ${userData?.username || user.email}
                                    </span>
                                </a>
                            `;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching username:', error);
                        if (userEmailElement) {
                            userEmailElement.textContent = user.email;
                        }
                    });
            }
            
            checkRoomMembership(user)
                .then(() => {
                    initializeUI();
                    listenToJoinRequests(); // 添加監聽加入請求
                });
        } else {
            console.log('No user is signed in');
            window.location.href = 'index.html';
        }
    });
});