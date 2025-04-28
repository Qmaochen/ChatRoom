import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Link as MuiLink,
    Alert
} from '@mui/material';
import styled from 'styled-components';

const StyledPaper = styled(Paper)`
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    max-width: 400px;
    margin: 64px auto;
`;

const Form = styled.form`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (password.length < 6) {
            return setError('Password should be at least 6 characters');
        }

        if (username.length < 3 || username.length > 20) {
            return setError('Username must be between 3 and 20 characters');
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return setError('Username can only contain letters, numbers, underscores and hyphens');
        }

        try {
            setError('');
            setLoading(true);
            await register(email, password, username);
            navigate('/chatrooms');
        } catch (error) {
            setError('Failed to create an account. Please try again.');
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container>
            <StyledPaper elevation={3}>
                <Typography variant="h4" component="h1">
                    Create Account
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                    Join our chat community
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <TextField
                        label="Username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        fullWidth
                        helperText="Password must be at least 6 characters long"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        fullWidth
                        size="large"
                    >
                        Create Account
                    </Button>
                </Form>

                <Box textAlign="center">
                    <Typography variant="body2">
                        Already have an account?{' '}
                        <MuiLink component={Link} to="/login">
                            Sign in
                        </MuiLink>
                    </Typography>
                </Box>
            </StyledPaper>
        </Container>
    );
} 