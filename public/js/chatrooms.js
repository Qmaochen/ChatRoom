// DOM Elements
const userEmailElement = document.getElementById('user-email');
const chatroomsList = document.getElementById('chatrooms-list');
const createRoomBtn = document.getElementById('create-room-btn');
const createRoomModal = document.getElementById('create-room-modal');
const createRoomForm = document.getElementById('create-room-form');
const cancelCreateRoomBtn = document.getElementById('cancel-create-room');
const logoutButton = document.getElementById('logout-btn');

// 確保用戶已登入
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user.email);
        userEmailElement.textContent = user.email;
        loadChatrooms();
    } else {
        console.log('No user is signed in');
        window.location.href = 'index.html';
    }
});

// 載入聊天室列表
function loadChatrooms() {
    const chatroomsRef = firebase.database().ref('chatrooms');
    chatroomsRef.on('value', (snapshot) => {
        chatroomsList.innerHTML = '';
        snapshot.forEach((chatroomSnapshot) => {
            const chatroom = chatroomSnapshot.val();
            const chatroomId = chatroomSnapshot.key;
            displayChatroom(chatroomId, chatroom);
        });
    });
}

// 顯示聊天室卡片
function displayChatroom(chatroomId, chatroom) {
    const chatroomElement = document.createElement('div');
    chatroomElement.classList.add('chatroom-card');
    
    chatroomElement.innerHTML = `
        <div class="chatroom-name">${chatroom.name}</div>
        <div class="chatroom-description">${chatroom.description || 'No description'}</div>
        <div class="chatroom-meta">
            <div class="chatroom-members">
                <i class="fas fa-users"></i>
                <span>${Object.keys(chatroom.members || {}).length} members</span>
            </div>
            <div class="chatroom-created">
                Created ${new Date(chatroom.createdAt).toLocaleDateString()}
            </div>
        </div>
    `;

    // 點擊進入聊天室
    chatroomElement.addEventListener('click', () => {
        window.location.href = `chat.html?room=${chatroomId}`;
    });

    chatroomsList.appendChild(chatroomElement);
}

// 創建聊天室相關事件
createRoomBtn.addEventListener('click', () => {
    createRoomModal.classList.add('active');
});

cancelCreateRoomBtn.addEventListener('click', () => {
    createRoomModal.classList.remove('active');
    createRoomForm.reset();
});

createRoomForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('room-name').value;
    const description = document.getElementById('room-description').value;
    const currentUser = firebase.auth().currentUser;

    if (!currentUser) return;

    const chatroomsRef = firebase.database().ref('chatrooms');
    const newChatroomRef = chatroomsRef.push();
    
    newChatroomRef.set({
        name: name,
        description: description,
        createdAt: Date.now(),
        createdBy: currentUser.email,
        members: {
            [currentUser.uid]: {
                email: currentUser.email,
                role: 'admin'
            }
        }
    }).then(() => {
        createRoomModal.classList.remove('active');
        createRoomForm.reset();
    }).catch((error) => {
        console.error('Error creating chatroom:', error);
        alert('Error creating chatroom. Please try again.');
    });
});

// 登出
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