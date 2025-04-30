# ChatRoom - Real-time Web Chat Application

A modern, real-time chat application built with Firebase and vanilla JavaScript. This application allows users to create accounts, join chat rooms, and communicate in real-time with other users.

## Features

### User Management
- User registration with email and password
- User authentication
- User profile management
- Password recovery functionality
- Remember login state

### Chat Rooms
- Create public and private chat rooms
- Join existing chat rooms
- Real-time message updates
- Member management in rooms
- Room privacy settings (public/private)
- Admin privileges for room creators

### Chat Features
- Real-time messaging
- Message timestamps
- User presence indicators
- Member list in chat rooms
- Support for system messages
- Support for bot messages

### UI Features
- Modern, responsive design
- Dark/light mode support
- Loading indicators
- Error handling and notifications
- Mobile-friendly interface

## How to Use

### As a User
1. Visit the website: https://chatroom-679cd.web.app
2. Register a new account or log in with existing credentials
3. Browse available chat rooms or create your own
4. Join rooms and start chatting
5. Manage your profile and settings

### For Developers (Local Setup)

#### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase CLI
- Git

#### Step-by-Step Setup Guide

1. **Clone the Repository**
   ```bash
   git clone [your-repository-url]
   cd ChatRoom
   ```

2. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase**
   ```bash
   firebase login
   ```

4. **Initialize Firebase Project**
   ```bash
   firebase init
   ```
   Select the following options:
   - Hosting
   - Realtime Database
   - Choose your project or create a new one
   - Use public directory
   - Configure as single-page app: No
   - Set up automatic builds: No

5. **Configure Firebase**
   - Create a new project in Firebase Console
   - Copy your Firebase configuration from Project Settings
   - Replace the configuration in `public/index.html` and other relevant files:
   ```javascript
   const firebaseConfig = {
       apiKey: "your-api-key",
       authDomain: "your-auth-domain",
       databaseURL: "your-database-url",
       projectId: "your-project-id",
       storageBucket: "your-storage-bucket",
       messagingSenderId: "your-messaging-sender-id",
       appId: "your-app-id"
   };
   ```

6. **Set Up Database Rules**
   - Copy the contents of `database.rules.json`
   - Update your Firebase Realtime Database rules

7. **Install Dependencies**
   ```bash
   npm install
   ```

8. **Run Locally**
   ```bash
   firebase serve
   ```
   The application will be available at `http://localhost:5000`

9. **Deploy**
   ```bash
   firebase deploy
   ```

## Project Structure
```
ChatRoom/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js
│   │   ├── chat.js
│   │   └── chatrooms.js
│   ├── index.html
│   ├── register.html
│   ├── chat.html
│   ├── chatrooms.html
│   └── profile.html
├── firebase.json
├── database.rules.json
└── README.md
```

## Security Features
- Secure authentication using Firebase Auth
- Database rules to protect user data
- Input validation and sanitization
- Protected routes requiring authentication
- Rate limiting for message sending
- Private room access control

## Troubleshooting

### Common Issues and Solutions

1. **Page Not Found (404) Error**
   - Clear browser cache
   - Ensure you're using the correct URL
   - Check if you're logged in for protected routes

2. **Authentication Issues**
   - Verify email format
   - Password must be at least 6 characters
   - Check internet connection
   - Clear browser cookies if persistent

3. **Chat Room Access Issues**
   - Verify room exists
   - Check if you have permission to join
   - For private rooms, request access from admin

4. **Real-time Updates Not Working**
   - Check internet connection
   - Refresh the page
   - Clear browser cache
   - Verify Firebase configuration

## Technical Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Stable internet connection
- Minimum screen resolution: 320px width

## Support and Contact
For technical support or feature requests, please create an issue in the repository or contact the development team.

## License
[Your License Information]

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Repository URL

[Repository URL](https://github.com/Qmaochen/ChatRoom)

## Screenshots

![Screenshot 1](<screenshot-url>)
![Screenshot 2](<screenshot-url>) 
