import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken } from '../../utils/tokenStorage';

export const useTaskWebSocket = (taskId, onEventReceived) => {
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef(null);

    useEffect(() => {
        if (!taskId) return;

        const connectStomp = () => {
            const token = getAccessToken();
            
            const client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                connectHeaders: {
                    Authorization: `Bearer ${token}`
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
                onConnect: () => {
                    setIsConnected(true);
                    console.log(`Connected to WebSocket for Task ${taskId}`);
                    
                    // Subscribe to the specific task's event topic
                    client.subscribe(`/topic/tasks/${taskId}`, (message) => {
                        if (message.body) {
                            const eventDto = JSON.parse(message.body);
                            if (onEventReceived) {
                                onEventReceived(eventDto);
                            }
                        }
                    });
                },
                onDisconnect: () => {
                    setIsConnected(false);
                    console.log('Disconnected from WebSocket');
                },
                onStompError: (frame) => {
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                }
            });

            client.activate();
            clientRef.current = client;
        };

        connectStomp();

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [taskId]); // Reconnect if taskId changes

    return { isConnected };
};
