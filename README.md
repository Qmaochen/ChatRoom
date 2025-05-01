# ChatRoom Web Application

即時聊天室網站，提供用戶註冊、登入、更改個人profile、創建聊天室、即時通訊等功能。

## 功能特點

### 1. 用戶認證 (Login, Register)
- 用戶註冊：使用電子郵件和密碼創建新帳戶
- 用戶登入：已註冊用戶可以安全登入
- 個人資料：用戶可以設置和更新個人資料信息

### 2. 聊天室管理 (Chatroom - Rooms)
- 創建聊天室：用戶可以創建新的聊天室
- 公共/私人聊天室：支持創建公共或私人聊天室
- 聊天室列表：顯示所有可用的聊天室
- 成員管理：顯示聊天室成員數量和創建時間

### 3. 即時通訊 (Chat)
- 即時消息：支持即時發送和接收消息
- 消息歷史：保存並顯示聊天歷史記錄
- 加入請求：私人聊天室的加入請求管理

### 4. 個人資料管理 (Profile)
- 上傳個人大頭貼
- 修改名字、Email、電話、住址及自介

## 如何使用

### 基本操作流程

1. **註冊/登入**
   - 訪問首頁 (index.html)
   - 按create account使用電子郵件和密碼註冊新帳戶
   - 使用已有帳戶登入

2. **瀏覽聊天室**
   - 登入後自動進入聊天室列表頁面
   - 查看所有可用的聊天室 (含public及private)
   - 可以選擇加入現有聊天室或創建新的聊天室

3. **創建聊天室**
   - 點擊 "New Room" 按鈕
   - 填寫聊天室名稱和描述
   - 選擇是否設為私人聊天室
   - 點擊創建完成

4. **參與聊天**
   - 加入聊天室後可以發送消息
   - 查看其他成員的消息

5. **個人介紹**
   - 點擊chatroom - rooms上方的人像按鈕
   - 切換到profile頁面，編輯個人簡介


## 目錄結構
```
ChatRoom/
├── public/                  # 公開訪問的前端文件
│   ├── css/                # 樣式文件目錄
│   │   ├── auth.css       # 登入/註冊頁面的樣式
│   │   ├── base.css       # 基礎共用樣式
│   │   ├── chat.css       # 聊天室界面樣式
│   │   ├── chatrooms.css  # 聊天室列表樣式
│   │   ├── common.css     # 共用元件樣式
│   │   ├── components.css # UI元件樣式
│   │   ├── cyberpunk-theme.css # 賽博龐克主題樣式
│   │   └── profile.css    # 個人資料頁面樣式
│   │
│   ├── js/                # JavaScript 文件目錄
│   │   ├── firebase-config.js  # Firebase 配置和初始化
│   │   ├── chat.js        # 聊天室功能實現
│   │   ├── chatrooms.js   # 聊天室列表功能
│   │   ├── auth.js        # 認證相關功能
│   │   └── profile.js     # 個人資料管理功能
│   │
│   ├── index.html         # 登入頁面
│   ├── register.html      # 註冊頁面
│   ├── chatrooms.html     # 聊天室列表頁面
│   ├── chat.html          # 聊天室主頁面
│   ├── profile.html       # 個人資料頁面
│   └── 404.html           # 404錯誤頁面
│
└── README.md              # 專案說明文件
```
### HTML
1. index.html:
   - 登入頁面、用戶登入表單
   - 前往註冊頁面的連結
2. register.html:
   - 註冊頁面、註冊表單
   - 前往登入頁面的連結
3. chatrooms.html:
   - 聊天室列表
   - 創建聊天室
   - 處理加入聊天室請求
4. chat.html:
   - 聊天室
   - 即時消息
5. profile.html:
   - 個人資料頁面
### CSS
1. style.css:
   - 基礎樣式設定
   - 全局變數定義
   - 基礎排版規則
2. modern-theme.css:
   - 顏色主題變數
   - 字體設定
   - 陰影效果
   - 動畫效果
   - 按鈕樣式
   - 卡片樣式
   - 表單元素樣式
   - 現代化UI元件
3. chat.css:
   - 聊天室介面樣式
   - 訊息樣式
   - 輸入區域樣式
   - 成員列表樣式
4. chatrooms.css:
   - 聊天室列表樣式
   - 房間卡片樣式
   - 創建房間表單樣式
   - 加入私人聊天室請求樣式
### JS
1. auth.js
   -  checkAuthState() 用戶認證邏輯
   - 登入/註冊處理 
2. chat.js
   - initializeUI()初始化用戶介面
   - displayNotification() 顯示通知
   - updateRoomInfo() 更新房間訊息
   - updateMembersList() 更新成員列表
   - handleJoinRequest() 處理加入請求
   - loadMessages() 載入訊息
   - displayMessage() 顯示訊息
3. chatrooms.js
   - checkAuthState() 確認用戶登入狀態
   - loadChatrooms() 載入聊天室列表
   - createChatroom() 創建新聊天室
   - joinRoom() 加入公開聊天室
   - requestJoin() 添加請求加入私人聊天室
   - handleJoinRequest() 處理加入請求
   - showNotification() 顯示中
4. profile.js
   - validateInput() 驗證用戶輸入格式
5. register.js
   - document.addEventListener() 頁面載入監聽
   - firebase.auth() 用戶狀態檢查
   - document.getElementById('register-form') 註冊表單處理


## CSS animation
1. 在登入/註冊頁面的背景
   ```@keyframes  backgroundAnimation {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
   }```

## git version control 
![螢幕擷取畫面 2025-05-01 222349](https://hackmd.io/_uploads/By0-Vb-exx.png)