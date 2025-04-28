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

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/chatrooms');
        } catch (error) {
            setError('Failed to sign in. Please check your credentials.');
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container>
            <StyledPaper elevation={3}>
                <Typography variant="h4" component="h1">
                    Welcome Back
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                    Sign in to continue
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
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
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        fullWidth
                        size="large"
                    >
                        Sign In
                    </Button>
                </Form>

                <Box textAlign="center">
                    <Typography variant="body2">
                        Don't have an account?{' '}
                        <MuiLink component={Link} to="/register">
                            Create an account
                        </MuiLink>
                    </Typography>
                </Box>
            </StyledPaper>
        </Container>
    );
} 