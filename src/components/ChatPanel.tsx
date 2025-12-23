import React, { useEffect, useRef } from 'react';
import { useStore, selectMessages } from '../store';

// ============================================================
// Example Prompts for Getting Started
// ============================================================

const EXAMPLE_PROMPTS = [
    {
        icon: '✅',
        text: 'Build a todo list with tasks that have titles, due dates, and priority levels',
    },
    {
        icon: '💰',
        text: 'Create a simple expense tracker to log spending by category',
    },
    {
        icon: '📝',
        text: 'Make a notes app where I can organize notes into folders',
    },
];

// ============================================================
// ChatPanel - Conversation Display
// ============================================================

interface ChatPanelProps {
    onSendMessage?: (message: string) => void;
}

export function ChatPanel({ onSendMessage }: ChatPanelProps) {
    const messages = useStore(selectMessages);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleExampleClick = (text: string) => {
        if (onSendMessage) {
            onSendMessage(text);
        }
    };

    return (
        <div className="chat-panel">
            <div className="panel-header">
                <h2 className="panel-title">💬 Chat</h2>
                <span className="panel-badge">{messages.length}</span>
            </div>

            <div className="chat-messages" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">🚀</div>
                        <h3 className="chat-empty-title">Get Started</h3>
                        <p className="chat-empty-text">
                            Describe the app you want to build, or try an example:
                        </p>

                        <div className="example-prompts">
                            {EXAMPLE_PROMPTS.map((prompt, index) => (
                                <button
                                    key={index}
                                    className="example-prompt"
                                    onClick={() => handleExampleClick(prompt.text)}
                                >
                                    <span className="example-icon">{prompt.icon}</span>
                                    <span className="example-text">{prompt.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`chat-message chat-message-${message.role}`}
                        >
                            <div className="message-avatar">
                                {message.role === 'user' ? '👤' : '🤖'}
                            </div>
                            <div className="message-content">
                                <div className="message-header">
                                    <span className="message-role">
                                        {message.role === 'user' ? 'You' : 'Mini-Arnold'}
                                    </span>
                                    <span className="message-time">
                                        {formatTime(message.timestamp)}
                                    </span>
                                </div>
                                <div className="message-text">{message.content}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default ChatPanel;
