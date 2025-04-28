// 等待 DOM 完全加載
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
    const toggleMembersBtn = document.getElementById('toggle-members');
    const membersSidebar = document.querySelector('.members-sidebar');

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

    // 切換成員列表側邊欄
    if (toggleMembersBtn && membersSidebar) {
        toggleMembersBtn.addEventListener('click', () => {
            membersSidebar.classList.toggle('active');
        });

        // 點擊側邊欄外部時關閉側邊欄
        document.addEventListener('click', (e) => {
            if (membersSidebar.classList.contains('active') &&
                !membersSidebar.contains(e.target) &&
                e.target !== toggleMembersBtn) {
                membersSidebar.classList.remove('active');
            }
        });
    }

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
        
        membersList.innerHTML = '';
        Object.entries(members).forEach(([uid, member]) => {
            const memberElement = document.createElement('div');
            memberElement.classList.add('member-item');
            
            const initials = member.username ? member.username.substring(0, 2).toUpperCase() : 
                           member.email.split('@')[0].substring(0, 2).toUpperCase();
            
            memberElement.innerHTML = `
                <div class="member-avatar">${initials}</div>
                <div class="member-info">
                    <div class="member-name">${member.username || member.email}</div>
                    <div class="member-status">${member.role || 'member'}</div>
                </div>
            `;
            
            membersList.appendChild(memberElement);
        });
    }

    // 載入訊息
    function loadMessages() {
        if (!messageList) {
            console.error('Message list element not found in loadMessages');
            return;
        }

        const db = firebase.database();
        const messagesRef = db.ref(`chatrooms/${roomId}/messages`);
        
        // 清空消息列表
        messageList.innerHTML = '';
        
        // 監聽新消息
        messagesRef.on('child_added', (snapshot) => {
            try {
                const message = snapshot.val();
                displayMessage(message);
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });
    }

    // 顯示訊息
    function displayMessage(message) {
        if (!messageList) {
            console.error('Message list element not found in displayMessage');
            return;
        }

        try {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            
            // 處理系統消息
            if (message.type === 'system') {
                messageElement.classList.add('system-message');
                messageElement.innerHTML = `
                    <div class="message-content">
                        <div class="message-text">${message.text}</div>
                        <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
                    </div>
                `;
                messageList.appendChild(messageElement);
                messageList.scrollTop = messageList.scrollHeight;
                return;
            }
            
            const isCurrentUser = message.userId === currentUser.uid;
            messageElement.classList.add(isCurrentUser ? 'sent' : 'received');

            // 獲取發送者的用戶名
            firebase.database().ref(`users/${message.userId}`).once('value')
                .then(snapshot => {
                    const userData = snapshot.val() || {};
                    const displayName = userData.username || message.email;

                    messageElement.innerHTML = `
                        <div class="message-content">
                            <div class="message-header">
                                <span class="message-sender">${displayName}</span>
                                <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div class="message-text">${message.text}</div>
                        </div>
                    `;

                    messageList.appendChild(messageElement);
                    messageList.scrollTop = messageList.scrollHeight;
                });
        } catch (error) {
            console.error('Error displaying message:', error);
        }
    }

    // 檢查用戶是否是聊天室成員
    function checkRoomMembership(user) {
        const db = firebase.database();
        const roomRef = db.ref(`chatrooms/${roomId}`);
        
        roomRef.once('value').then((snapshot) => {
            const room = snapshot.val();
            if (!room) {
                console.error('Chatroom not found');
                alert('Chatroom not found');
                window.location.href = 'chatrooms.html';
                return;
            }

            currentRoom = room;
            updateRoomInfo(room);
            
            // 如果是私有聊天室且用戶不是成員，檢查是否有待處理的加入請求
            if (room.privacy === 'private' && (!room.members || !room.members[user.uid])) {
                const joinRequestRef = db.ref(`chatrooms/${roomId}/joinRequests/${user.uid}`);
                joinRequestRef.once('value').then(snapshot => {
                    const request = snapshot.val();
                    if (!request || request.status === 'rejected') {
                        alert('You need to request access to join this private chatroom.');
                        window.location.href = 'chatrooms.html';
                    } else if (request.status === 'pending') {
                        alert('Your join request is still pending approval.');
                        window.location.href = 'chatrooms.html';
                    }
                });
                return;
            }
            
            // 如果是管理員，監聽加入請求
            if (room.members && room.members[user.uid] && room.members[user.uid].role === 'admin') {
                roomRef.child('joinRequests').on('value', snapshot => {
                    const requests = snapshot.val();
                    if (requests) {
                        displayJoinRequests(requests);
                    }
                });
            }
            
            // 更新成員列表
            if (room.members) {
                updateMembersList(room.members);
            }
            
            // 載入訊息
            loadMessages();
        });
    }

    // 處理加入請求
    function handleJoinRequest(userId, action) {
        const db = firebase.database();
        const roomRef = db.ref(`chatrooms/${roomId}`);
        const requestRef = db.ref(`chatrooms/${roomId}/joinRequests/${userId}`);
        const currentUser = firebase.auth().currentUser;

        if (!currentUser) {
            console.error('No user signed in');
            return;
        }

        // 檢查當前用戶是否有權限處理請求
        roomRef.child(`members/${currentUser.uid}`).once('value')
            .then(snapshot => {
                const memberData = snapshot.val();
                if (!memberData || memberData.role !== 'admin') {
                    throw new Error('You do not have permission to handle join requests');
                }

                if (action === 'approve') {
                    // 先獲取請求數據
                    return requestRef.once('value')
                        .then(snapshot => {
                            const request = snapshot.val();
                            if (!request) {
                                throw new Error('Join request not found');
                            }

                            const updates = {};
                            // 更新請求狀態
                            updates[`joinRequests/${userId}/status`] = 'approved';
                            updates[`joinRequests/${userId}/approvedBy`] = currentUser.uid;
                            updates[`joinRequests/${userId}/approvedAt`] = firebase.database.ServerValue.TIMESTAMP;

                            // 添加到成員列表
                            updates[`members/${userId}`] = {
                                email: request.email,
                                username: request.username,
                                role: 'member',
                                joinedAt: firebase.database.ServerValue.TIMESTAMP
                            };

                            // 執行更新
                            return roomRef.update(updates)
                                .then(() => {
                                    // 發送系統消息
                                    return roomRef.child('messages').push({
                                        type: 'system',
                                        text: `${request.username} has joined the chatroom`,
                                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                                        userId: currentUser.uid,
                                        email: currentUser.email
                                    });
                                });
                        });
                } else if (action === 'reject') {
                    // 拒絕請求
                    return requestRef.update({
                        status: 'rejected',
                        rejectedBy: currentUser.uid,
                        rejectedAt: firebase.database.ServerValue.TIMESTAMP
                    });
                }
            })
            .then(() => {
                console.log(`Join request ${action}ed successfully`);
                // 移除請求顯示
                const requestItem = document.querySelector(`.request-item[data-user-id="${userId}"]`);
                if (requestItem) {
                    requestItem.remove();
                }
            })
            .catch(error => {
                console.error('Error handling join request:', error);
                alert(error.message || `Error ${action}ing join request`);
            });
    }

    // 顯示加入請求
    function displayJoinRequests(requests) {
        if (!messageList) return;

        // 移除現有的請求顯示
        const existingRequests = messageList.querySelector('.join-requests');
        if (existingRequests) {
            existingRequests.remove();
        }

        // 過濾出待處理的請求
        const pendingRequests = Object.entries(requests || {})
            .filter(([_, request]) => request.status === 'pending');

        if (pendingRequests.length === 0) return;

        // 創建請求容器
        const requestsContainer = document.createElement('div');
        requestsContainer.className = 'join-requests';
        requestsContainer.innerHTML = `
            <div class="join-requests-header">
                <h3>Pending Join Requests (${pendingRequests.length})</h3>
            </div>
            <div class="requests-list"></div>
        `;

        const requestsList = requestsContainer.querySelector('.requests-list');

        // 添加每個請求
        pendingRequests.forEach(([userId, request]) => {
            const requestElement = document.createElement('div');
            requestElement.className = 'request-item';
            requestElement.dataset.userId = userId;
            requestElement.innerHTML = `
                <div class="request-info">
                    <span class="request-username">${request.username}</span>
                    <span class="request-time">Requested ${formatTimestamp(request.requestedAt)}</span>
                </div>
                <div class="request-actions">
                    <button class="approve-btn">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="reject-btn">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            `;

            // 添加按鈕事件監聽器
            const approveBtn = requestElement.querySelector('.approve-btn');
            const rejectBtn = requestElement.querySelector('.reject-btn');

            approveBtn.addEventListener('click', () => handleJoinRequest(userId, 'approve'));
            rejectBtn.addEventListener('click', () => handleJoinRequest(userId, 'reject'));

            requestsList.appendChild(requestElement);
        });

        // 插入到消息列表的頂部
        messageList.insertBefore(requestsContainer, messageList.firstChild);
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

    // 確保用戶已登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log('User is signed in:', user.email);
            currentUser = user;
            
            // 獲取用戶名並顯示
            if (userEmailElement) {
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
            }
            
            checkRoomMembership(user);
        } else {
            console.log('No user is signed in');
            window.location.href = 'index.html';
        }
    });

    // 發送訊息
    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!messageInput) return;
            
            const message = messageInput.value;
            if (message.trim() === '') return;

            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                console.error('No user signed in');
                return;
            }

            const db = firebase.database();
            const messagesRef = db.ref(`chatrooms/${roomId}/messages`);
            
            messagesRef.push({
                text: message,
                email: currentUser.email,
                userId: currentUser.uid,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).catch(error => {
                console.error('Error sending message:', error);
                alert('Error sending message. Please try again.');
            });

            messageInput.value = '';
        });
    }

    // 登出
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

    // Sidebar toggle functionality
    const toggleMembersButton = document.querySelector('.toggle-members');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    function toggleSidebar() {
        membersSidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        
        // Update ARIA attributes
        const isExpanded = membersSidebar.classList.contains('active');
        toggleMembersButton.setAttribute('aria-expanded', isExpanded);
        
        // Prevent body scrolling when sidebar is open
        document.body.style.overflow = isExpanded ? 'hidden' : '';
    }

    toggleMembersButton.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && membersSidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });

    // Handle window resize
    let windowWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        const newWidth = window.innerWidth;
        if (newWidth !== windowWidth) {
            windowWidth = newWidth;
            if (newWidth > 768 && membersSidebar.classList.contains('active')) {
                toggleSidebar();
            }
        }
    });

    // 添加處理加入請求的函數
    function handleJoinRequests() {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) return;
        
        const db = firebase.database();
        const roomRef = db.ref(`chatrooms/${roomId}`);
        
        // 檢查用戶是否是管理員
        roomRef.child('members').child(currentUser.uid).once('value')
            .then(snapshot => {
                const memberData = snapshot.val();
                if (!memberData || memberData.role !== 'admin') {
                    return;
                }
                
                // 監聽加入請求
                roomRef.child('joinRequests').on('child_added', snapshot => {
                    const request = snapshot.val();
                    if (request.status === 'pending') {
                        showJoinRequestNotification(snapshot.key, request);
                    }
                });
            });
    }

    // 顯示加入請求通知
    function showJoinRequestNotification(userId, request) {
        const notification = document.createElement('div');
        notification.className = 'join-request-notification';
        notification.innerHTML = `
            <div class="request-info">
                <strong>${request.username}</strong> wants to join the chatroom
            </div>
            <div class="request-actions">
                <button onclick="approveJoinRequest('${userId}')">Approve</button>
                <button onclick="rejectJoinRequest('${userId}')">Reject</button>
            </div>
        `;
        
        document.querySelector('.chat-container').prepend(notification);
    }

    // 批准加入請求
    function approveJoinRequest(userId) {
        const db = firebase.database();
        const batch = {};
        
        // 更新請求狀態
        batch[`chatrooms/${roomId}/joinRequests/${userId}/status`] = 'approved';
        
        // 添加用戶到成員列表
        db.ref(`users/${userId}`).once('value')
            .then(snapshot => {
                const userData = snapshot.val();
                batch[`chatrooms/${roomId}/members/${userId}`] = {
                    email: userData.email,
                    username: userData.username,
                    role: 'member',
                    joinedAt: firebase.database.ServerValue.TIMESTAMP
                };
                
                return db.ref().update(batch);
            })
            .then(() => {
                // 發送系統消息通知
                sendSystemMessage(`${userData.username} has joined the chatroom`);
                // 移除通知
                removeJoinRequestNotification(userId);
            })
            .catch(error => {
                console.error('Error approving join request:', error);
                alert('Error approving join request. Please try again.');
            });
    }

    // 拒絕加入請求
    function rejectJoinRequest(userId) {
        const db = firebase.database();
        db.ref(`chatrooms/${roomId}/joinRequests/${userId}/status`).set('rejected')
            .then(() => {
                removeJoinRequestNotification(userId);
            })
            .catch(error => {
                console.error('Error rejecting join request:', error);
                alert('Error rejecting join request. Please try again.');
            });
    }

    // 移除加入請求通知
    function removeJoinRequestNotification(userId) {
        const notification = document.querySelector(`.join-request-notification[data-user-id="${userId}"]`);
        if (notification) {
            notification.remove();
        }
    }

    // 在頁面加載時初始化
    handleJoinRequests();
}); 