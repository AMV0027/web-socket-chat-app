import React, { useEffect, useRef, useState } from 'react';
import { IoIosSend } from "react-icons/io";
import { MdImage, MdOutlineGif } from "react-icons/md";
import GiphySearch from './GiphySearch';
import ImageModal from './ImageModal';

const ChatRoom = ({ username, room }) => {
    const [messages, setMessages] = useState([]);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [typingUser, setTypingUser] = useState(null);
    const [message, setMessage] = useState('');
    const [showGiphySearch, setShowGiphySearch] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        ws.current = new WebSocket('wss://web-socket-chat-app-5jc7.onrender.com');

        ws.current.onopen = () => {
            ws.current.send(JSON.stringify({ type: 'setUsername', username }));
            ws.current.send(JSON.stringify({ type: 'joinRoom', room }));
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'message':
                        setMessages(prev => [...prev, {
                            id: Date.now() + Math.random(),
                            username: data.username,
                            message: data.message,
                            messageType: data.messageType,
                            timestamp: new Date(data.timestamp).toLocaleTimeString()
                        }]);
                        setTypingUser(null);
                        break;
                    case 'typing':
                        if (data.username !== username) {
                            setTypingUser(data.username);
                            setTimeout(() => setTypingUser(null), 1000);
                        }
                        break;
                    case 'roomUsers':
                        setUsersInRoom(data.users);
                        setUserCount(data.userCount);
                        break;
                    case 'error':
                        console.error('Server error:', data.message);
                        alert(data.message);
                        break;
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [username, room]);

    const MessageContent = ({ msg }) => {
        const isMedia = msg.messageType === 'image' || msg.messageType === 'gif';

        if (isMedia) {
            return (
                <div className="message-media-container">
                    <img
                        src={msg.message}
                        alt={`Sent by ${msg.username}`}
                        className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(msg.message)}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300?text=Failed+to+load+image';
                        }}
                        style={{ maxHeight: '300px', objectFit: 'contain' }}
                    />
                    <span className="text-xs opacity-70 mt-1">{msg.timestamp}</span>
                </div>
            );
        }

        return (
            <div className="message-text-container">
                <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                <span className="text-xs opacity-70 mt-1">{msg.timestamp}</span>
            </div>
        );
    };

    const handleSendMessage = () => {
        if (message.trim() && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'message',
                message: message.trim(),
                messageType: 'text'
            }));
            setMessage('');
        }
    };

    const handleSendImage = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (ws.current?.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({
                        type: 'message',
                        message: reader.result,
                        messageType: 'image'
                    }));
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error sending image:', error);
            alert('Failed to send image. Please try again.');
        }
    };

    const handleSendGif = (gifUrl) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'message',
                message: gifUrl,
                messageType: 'gif'
            }));
            setShowGiphySearch(false);
        }
    };

    const handleImageClick = (url) => {
        setSelectedImage(url);
        setIsModalOpen(true);
    };


    return (
        <div className="w-full md:w-[700px] flex flex-col h-screen bg-cover bg-fixed bg-gradient-to-tr from-purple-600 via-blue-500 to-blue-400 ">
            <header className="p-4 text-white bg-zinc-950 bg-opacity-70 rounded-b-3xl shadow-lg">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gradient-to-tr from-purple-400 via-blue-800 to-blue-400 rounded-full" />
                        <h2 className="font-medium">Room: {room}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">{userCount} Online</span>
                        <div className="h-2 w-2 bg-blue-400 animate-pulse rounded-full" />
                    </div>
                </div>
                {typingUser && (
                    <div className="text-sm text-gray-400 mt-2">
                        {typingUser} is typing...
                    </div>
                )}
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`
                            relative max-w-[80%] p-3 rounded-xl
                            ${msg.username === username
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white bg-opacity-90 text-black rounded-bl-none'
                            }
                        `}>
                            <div className="text-xs opacity-70 mb-1">
                                {msg.username}
                            </div>
                            <MessageContent msg={msg} />
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="bg-zinc-900 bg-opacity-50 backdrop-blur-lg md:p-4 m-2 p-2 rounded-full flex items-center gap-2">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleSendImage}
                    className="hidden"
                    id="file-input"
                />
                <label
                    htmlFor="file-input"
                    className="p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
                >
                    <MdImage className="text-2xl" />
                </label>
                <button
                    onClick={() => setShowGiphySearch(prev => !prev)}
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    <MdOutlineGif className="text-2xl" />
                </button>
                <input
                    type="text"
                    className="flex-1 bg-zinc-800 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        } else {
                            handleTyping();
                        }
                    }}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    <IoIosSend className="text-2xl" />
                </button>
            </div>

            {showGiphySearch && (
                <div className="absolute bottom-20 left-0 right-0 mx-2">
                    <GiphySearch onSelectGif={handleSendGif} />
                </div>
            )}

            <ImageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imageUrl={selectedImage}
            />
        </div>
    );
};

export default ChatRoom;