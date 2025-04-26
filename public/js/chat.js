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
    const emojiButton = document.getElementById('emoji-button');

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
            
            const initials = member.email.split('@')[0].substring(0, 2).toUpperCase();
            
            memberElement.innerHTML = `
                <div class="member-avatar">${initials}</div>
                <div class="member-info">
                    <div class="member-name">${member.email}</div>
                    <div class="member-status">${member.role}</div>
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

        const messagesRef = firebase.database().ref(`chatrooms/${roomId}/messages`);
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
            
            const isCurrentUser = message.email === currentUser.email;
            messageElement.classList.add(isCurrentUser ? 'sent' : 'received');

            messageElement.innerHTML = `
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${message.email}</span>
                        <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div class="message-text">${message.text}</div>
                </div>
            `;

            messageList.appendChild(messageElement);
            messageList.scrollTop = messageList.scrollHeight;
        } catch (error) {
            console.error('Error displaying message:', error);
        }
    }

    // 檢查用戶是否是聊天室成員
    function checkRoomMembership(user) {
        const roomRef = firebase.database().ref(`chatrooms/${roomId}`);
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
            
            if (!room.members || !room.members[user.uid]) {
                console.log('Adding user to room members');
                // 如果用戶不是成員，將其添加為成員
                roomRef.child(`members/${user.uid}`).set({
                    email: user.email,
                    role: 'member'
                }).then(() => {
                    loadMessages();
                }).catch(error => {
                    console.error('Error adding user to room:', error);
                });
            } else {
                console.log('User is already a member');
                loadMessages();
            }

            // 監聽成員變化
            roomRef.child('members').on('value', (snapshot) => {
                const members = snapshot.val() || {};
                updateMembersList(members);
                updateRoomInfo({ ...room, members });
            });
        }).catch(error => {
            console.error('Error checking room membership:', error);
        });
    }

    // 確保用戶已登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log('User is signed in:', user.email);
            currentUser = user;
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
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

            if (!currentUser) {
                console.error('No user signed in');
                return;
            }

            const messagesRef = firebase.database().ref(`chatrooms/${roomId}/messages`);
            messagesRef.push({
                text: message,
                email: currentUser.email,
                userId: currentUser.uid,
                timestamp: Date.now()
            }).catch(error => {
                console.error('Error sending message:', error);
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

    // 表情符號按鈕功能（如果需要可以添加表情符號選擇器）
    if (emojiButton && messageInput) {
        emojiButton.addEventListener('click', () => {
            // 這裡可以添加表情符號選擇器的實現
            alert('Emoji picker coming soon!');
        });
    }
}); 