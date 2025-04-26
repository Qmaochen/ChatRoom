// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase - 使用與頁面匹配的 Firebase v8 語法
firebase.initializeApp(firebaseConfig);

// 為 v8 SDK 初始化服務
const auth = firebase.auth();
const database = firebase.database();

console.log("Firebase initialized with v8 SDK");