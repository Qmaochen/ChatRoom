// Chat functionality

document.getElementById('message-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const message = event.target[0].value;

    // Add message to the database
    database.ref('messages').push({
        user: auth.currentUser.email,
        message: message,
        timestamp: Date.now()
    }).then(() => {
        console.log('Message sent');
        event.target[0].value = '';
    }).catch(error => {
        console.error('Error sending message:', error);
    });
});

// Listen for new messages
const messagesRef = database.ref('messages');
messagesRef.on('child_added', function(snapshot) {
    const messageData = snapshot.val();
    const messageElement = document.createElement('div');
    messageElement.textContent = `${messageData.user}: ${messageData.message}`;
    document.getElementById('chat-window').appendChild(messageElement);
}); 