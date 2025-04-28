import React from 'react';
import { Typography, Box, Avatar } from '@mui/material';
import styled from 'styled-components';

interface MessageProps {
    text: string;
    sender: {
        username: string;
        email: string;
    };
    timestamp: number;
    isCurrentUser: boolean;
}

const MessageContainer = styled(Box)<{ isCurrentUser: boolean }>`
    display: flex;
    flex-direction: ${props => props.isCurrentUser ? 'row-reverse' : 'row'};
    margin: 8px 0;
    gap: 8px;
`;

const MessageBubble = styled(Box)<{ isCurrentUser: boolean }>`
    background-color: ${props => props.isCurrentUser ? '#1976d2' : '#f5f5f5'};
    color: ${props => props.isCurrentUser ? 'white' : 'inherit'};
    padding: 12px 16px;
    border-radius: 16px;
    max-width: 70%;
    word-wrap: break-word;
`;

const MessageHeader = styled(Box)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
`;

const UserAvatar = styled(Avatar)`
    width: 36px;
    height: 36px;
    font-size: 1rem;
`;

export default function Message({ text, sender, timestamp, isCurrentUser }: MessageProps) {
    const initials = sender.username
        ? sender.username.substring(0, 2).toUpperCase()
        : sender.email.substring(0, 2).toUpperCase();

    return (
        <MessageContainer isCurrentUser={isCurrentUser}>
            <UserAvatar>{initials}</UserAvatar>
            <MessageBubble isCurrentUser={isCurrentUser}>
                <MessageHeader>
                    <Typography variant="subtitle2" component="span" color={isCurrentUser ? 'inherit' : 'primary'}>
                        {sender.username || sender.email}
                    </Typography>
                    <Typography variant="caption" color={isCurrentUser ? 'inherit' : 'text.secondary'}>
                        {new Date(timestamp).toLocaleTimeString()}
                    </Typography>
                </MessageHeader>
                <Typography variant="body1">
                    {text}
                </Typography>
            </MessageBubble>
        </MessageContainer>
    );
} 