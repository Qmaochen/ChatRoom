// Registration logic
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in, redirect to chat
            console.log('User is already signed in:', user);
            window.location.href = 'chat.html';
        }
    });

    // Handle registration form submission
    document.getElementById('register-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        // Create new account with Firebase
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                console.log('User registered:', userCredential.user);
                
                // Save user info to database
                firebase.database().ref('users/' + userCredential.user.uid).set({
                    email: email,
                    registeredAt: new Date().toISOString()
                }).then(() => {
                    // Redirect to chat page after successful registration
                    window.location.href = 'chat.html';
                });
            })
            .catch(error => {
                console.error('Error registering:', error);
                alert('Registration failed: ' + error.message);
            });
    });
}); 