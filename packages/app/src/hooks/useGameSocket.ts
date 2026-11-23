import { useCallback, useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';

export function useGameSocket<T>(path: string) {
    const [data, setData] = useState<T | null>(null);
    const [closed, setClosed] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${location.host}${path}`);
        const onMessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data as string) as T | { error: string };
            if (typeof message === 'object' && message !== null && 'error' in message) {
                notifications.show({ color: 'red', message: message.error });
                return;
            }
            setData(message as T);
        };
        const onClose = () => {
            setClosed(true);
        };
        socket.addEventListener('message', onMessage);
        socket.addEventListener('close', onClose);
        socketRef.current = socket;
        return () => {
            socket.removeEventListener('message', onMessage);
            socket.removeEventListener('close', onClose);
            socket.close();
        };
    }, [path]);

    const send = useCallback((message: object) => {
        socketRef.current?.send(JSON.stringify(message));
    }, []);

    return { data, closed, send };
}
