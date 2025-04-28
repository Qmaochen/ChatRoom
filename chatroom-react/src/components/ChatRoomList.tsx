import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, push, set } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
    Container,
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    AppBar,
    Toolbar,
    IconButton,
    Box,
    Chip,
    Card,
    CardContent,
    CardActionArea,
    Grid,
    Avatar,
    Badge
} from '@mui/material';
import { 
    Add as AddIcon, 
    ExitToApp as LogoutIcon,
    Public as PublicIcon,
    Lock as LockIcon,
    Group as GroupIcon
} from '@mui/icons-material';
import styled from 'styled-components';

const PageContainer = styled.div`
    min-height: 100vh;
    background-color: #f5f5f5;
    display: flex;
    flex-direction: column;
`;

const ContentContainer = styled(Container)`
    flex: 1;
    padding: 24px;
    padding-top: 88px;
`;

const StyledCard = styled(Card)`
    height: 100%;
    transition: transform 0.2s, box-shadow 0.2s;
    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    }
`;

const RoomName = styled(Typography)`
    font-weight: 600;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Description = styled(Typography)`
    color: rgba(0, 0, 0, 0.6);
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const MetaInfo = styled(Box)`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
`;

interface ChatRoom {
    id: string;
    name: string;
    description: string;
    createdAt: number;
    privacy: 'public' | 'private';
    members: Record<string, {
        role: string;
        joinedAt: number;
    }>;
}

export default function ChatRoomList() {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [openNewRoomDialog, setOpenNewRoomDialog] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomDescription, setNewRoomDescription] = useState('');
    const [newRoomPrivacy, setNewRoomPrivacy] = useState<'public' | 'private'>('public');
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const roomsRef = ref(database, 'chatrooms');
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const roomsList = Object.entries(data)
                    .map(([id, room]: [string, any]) => ({
                        id,
                        ...room
                    }))
                    .sort((a, b) => b.createdAt - a.createdAt);
                setRooms(roomsList);
            } else {
                setRooms([]);
            }
        });

        return () => unsubscribe();
    }, [currentUser, navigate]);

    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) return;

        const roomsRef = ref(database, 'chatrooms');
        const newRoomRef = push(roomsRef);
        const roomData = {
            name: newRoomName.trim(),
            description: newRoomDescription.trim(),
            createdAt: Date.now(),
            createdBy: currentUser?.uid,
            privacy: newRoomPrivacy,
            members: {
                [currentUser!.uid]: {
                    role: 'admin',
                    joinedAt: Date.now()
                }
            }
        };

        await set(newRoomRef, roomData);
        setOpenNewRoomDialog(false);
        setNewRoomName('');
        setNewRoomDescription('');
        setNewRoomPrivacy('public');
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    const handleRoomClick = (roomId: string) => {
        navigate(`/chat/${roomId}`);
    };

    const getMemberCount = (members: Record<string, any>) => {
        return Object.keys(members).length;
    };

    return (
        <PageContainer>
            <AppBar position="fixed" elevation={0} sx={{ backgroundColor: 'white', color: 'primary.main' }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Chat Rooms
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenNewRoomDialog(true)}
                        sx={{ mr: 2 }}
                    >
                        Create Room
                    </Button>
                    <IconButton onClick={handleLogout} color="inherit">
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <ContentContainer maxWidth="lg">
                <Grid container spacing={3}>
                    {rooms.map((room) => (
                        <Grid item xs={12} sm={6} md={4} key={room.id}>
                            <StyledCard>
                                <CardActionArea onClick={() => handleRoomClick(room.id)}>
                                    <CardContent>
                                        <RoomName variant="h6">
                                            {room.name}
                                            {room.privacy === 'private' ? (
                                                <LockIcon fontSize="small" color="secondary" />
                                            ) : (
                                                <PublicIcon fontSize="small" color="primary" />
                                            )}
                                        </RoomName>
                                        <Description variant="body2">
                                            {room.description || 'No description available'}
                                        </Description>
                                        <MetaInfo>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <GroupIcon fontSize="small" color="action" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {getMemberCount(room.members)} members
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Created {new Date(room.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </MetaInfo>
                                    </CardContent>
                                </CardActionArea>
                            </StyledCard>
                        </Grid>
                    ))}
                </Grid>
            </ContentContainer>

            <Dialog
                open={openNewRoomDialog}
                onClose={() => setOpenNewRoomDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Create New Chat Room</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Room Name"
                            type="text"
                            fullWidth
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                        />
                        <TextField
                            margin="dense"
                            label="Description"
                            type="text"
                            fullWidth
                            multiline
                            rows={3}
                            value={newRoomDescription}
                            onChange={(e) => setNewRoomDescription(e.target.value)}
                        />
                        <Box mt={2}>
                            <Typography variant="subtitle2" gutterBottom>
                                Privacy Setting
                            </Typography>
                            <Box display="flex" gap={1}>
                                <Button
                                    variant={newRoomPrivacy === 'public' ? 'contained' : 'outlined'}
                                    onClick={() => setNewRoomPrivacy('public')}
                                    startIcon={<PublicIcon />}
                                >
                                    Public
                                </Button>
                                <Button
                                    variant={newRoomPrivacy === 'private' ? 'contained' : 'outlined'}
                                    onClick={() => setNewRoomPrivacy('private')}
                                    startIcon={<LockIcon />}
                                >
                                    Private
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewRoomDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateRoom} variant="contained">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContainer>
    );
} 