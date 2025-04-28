import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Avatar,
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import styled from 'styled-components';

const ProfileContainer = styled(Paper)`
    padding: 32px;
    margin-top: 80px;
`;

const AvatarContainer = styled(Box)`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 32px;
`;

const LargeAvatar = styled(Avatar)`
    width: 100px;
    height: 100px;
    font-size: 2.5rem;
    margin-bottom: 16px;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

interface UserData {
    email: string;
    username: string;
    createdAt: number;
    lastLogin: number;
}

export default function UserProfile() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const userRef = ref(database, `users/${currentUser.uid}`);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setUserData(data);
                setUsername(data.username || '');
            }
            setLoading(false);
        }).catch((error) => {
            console.error('Error fetching user data:', error);
            setError('Failed to load user data');
            setLoading(false);
        });
    }, [currentUser, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (username.length < 3 || username.length > 20) {
            setError('Username must be between 3 and 20 characters');
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            setError('Username can only contain letters, numbers, underscores and hyphens');
            return;
        }

        try {
            setError('');
            setSuccess('');
            const userRef = ref(database, `users/${currentUser.uid}`);
            await update(userRef, {
                username: username.trim()
            });
            setSuccess('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Failed to update profile');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <AppBar position="fixed">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => navigate('/chatrooms')}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ ml: 2 }}>
                        Profile
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="sm">
                <ProfileContainer elevation={3}>
                    <AvatarContainer>
                        <LargeAvatar>
                            {username.substring(0, 2).toUpperCase()}
                        </LargeAvatar>
                        <Typography variant="h5" gutterBottom>
                            {userData?.email}
                        </Typography>
                    </AvatarContainer>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <TextField
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            fullWidth
                            required
                            helperText="Username must be between 3 and 20 characters"
                        />

                        <Box mt={2}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Account Info
                            </Typography>
                            <Typography variant="body2">
                                Created: {userData?.createdAt ? new Date(userData.createdAt).toLocaleString() : 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                                Last Login: {userData?.lastLogin ? new Date(userData.lastLogin).toLocaleString() : 'N/A'}
                            </Typography>
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            Update Profile
                        </Button>
                    </Form>
                </ProfileContainer>
            </Container>
        </>
    );
} 