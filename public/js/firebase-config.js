// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAu9P2YxQN_kCgOpzDhD6Kz4XYoQxXMUyg",
    authDomain: "chatroom-679cd.firebaseapp.com",
    databaseURL: "https://chatroom-679cd-default-rtdb.firebaseio.com",
    projectId: "chatroom-679cd",
    storageBucket: "chatroom-679cd.firebasestorage.app",
    messagingSenderId: "106697321863",
    appId: "1:106697321863:web:58fece4bc10e1cc1507722",
    measurementId: "G-NYQHW23511"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const database = firebase.database();

console.log("Firebase initialized successfully"); 