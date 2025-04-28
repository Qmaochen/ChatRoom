import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, push, set, get } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import Message from './Message';
import {
    Container,
    Paper,
    Typography,
    TextField,
    IconButton,
    Box,
    AppBar,
    Toolbar,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Button,
    CircularProgress
} from '@mui/material';
import {
    Send as SendIcon,
    ArrowBack as ArrowBackIcon,
    People as PeopleIcon
} from '@mui/icons-material';
import styled from 'styled-components';

const PageContainer = styled.div`
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const ChatContainer = styled(Paper)`
    height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    margin-top: 64px;
    overflow: hidden;
`;

const MessagesContainer = styled(Box)`
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    &::-webkit-scrollbar {
        width: 8px;
    }
    &::-webkit-scrollbar-track {
        background: #f1f1f1;
    }
    &::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
`;

const InputContainer = styled(Box)`
    padding: 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
    display: flex;
    gap: 8px;
    background-color: white;
`;

interface Message {
    id: string;
    text: string;
    userId: string;
    email: string;
    timestamp: number;
}

interface User {
    email: string;
    username: string;
    lastLogin: number;
}

export default function ChatRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomName, setRoomName] = useState('');
    const [users, setUsers] = useState<Record<string, User>>({});
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!currentUser || !roomId) {
            navigate('/chatrooms');
            return;
        }

        // Load room data
        const roomRef = ref(database, `chatrooms/${roomId}`);
        const unsubscribeRoom = onValue(roomRef, (snapshot) => {
            const roomData = snapshot.val();
            if (!roomData) {
                navigate('/chatrooms');
                return;
            }
            setRoomName(roomData.name);
            setLoading(false);
        });

        // Load messages
        const messagesRef = ref(database, `chatrooms/${roomId}/messages`);
        const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const messagesList = Object.entries(data).map(([id, message]: [string, any]) => ({
                    id,
                    ...message
                }));
                setMessages(messagesList.sort((a, b) => a.timestamp - b.timestamp));
                scrollToBottom();
            }
        });

        // Load users
        const usersRef = ref(database, 'users');
        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setUsers(data);
            }
        });

        return () => {
            unsubscribeRoom();
            unsubscribeMessages();
            unsubscribeUsers();
        };
    }, [currentUser, roomId, navigate]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const messagesRef = ref(database, `chatrooms/${roomId}/messages`);
        const newMessageRef = push(messagesRef);
        await set(newMessageRef, {
            text: newMessage.trim(),
            userId: currentUser.uid,
            email: currentUser.email,
            timestamp: Date.now()
        });

        setNewMessage('');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <PageContainer>
            <AppBar position="fixed">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => navigate('/chatrooms')}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
                        {roomName}
                    </Typography>
                    <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                        <PeopleIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <ChatContainer elevation={0}>
                <MessagesContainer>
                    {messages.map((message) => (
                        <Message
                            key={message.id}
                            text={message.text}
                            sender={{
                                username: users[message.userId]?.username || '',
                                email: message.email
                            }}
                            timestamp={message.timestamp}
                            isCurrentUser={message.userId === currentUser?.uid}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </MessagesContainer>

                <form onSubmit={handleSendMessage}>
                    <InputContainer>
                        <TextField
                            fullWidth
                            placeholder="Type a message"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            variant="outlined"
                            size="small"
                        />
                        <IconButton
                            color="primary"
                            type="submit"
                            disabled={!newMessage.trim()}
                        >
                            <SendIcon />
                        </IconButton>
                    </InputContainer>
                </form>
            </ChatContainer>

            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <Box sx={{ width: 300, pt: 2 }}>
                    <Typography variant="h6" sx={{ px: 2, mb: 2 }}>
                        Room Members
                    </Typography>
                    <List>
                        {Object.entries(users).map(([userId, user]) => (
                            <ListItem key={userId}>
                                <ListItemAvatar>
                                    <Avatar>
                                        {user.username?.substring(0, 2).toUpperCase() ||
                                            user.email.substring(0, 2).toUpperCase()}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={user.username || user.email}
                                    secondary={`Last seen: ${new Date(
                                        user.lastLogin
                                    ).toLocaleString()}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </PageContainer>
    );
} 