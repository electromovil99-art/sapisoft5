
import { io } from 'socket.io-client';

// *** URL DEL SERVIDOR REMOTO ***
export const BACKEND_URL = 'https://api.sapi-soft.com';

export const socket = io(BACKEND_URL, { 
    transports: ['websocket', 'polling'], // Se cambió el orden para priorizar websocket
    withCredentials: true,
    forceNew: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 2000,
    extraHeaders: { "ngrok-skip-browser-warning": "true" } 
});

export const checkConnection = () => {
    console.log("Estado Socket:", socket.connected, "ID:", socket.id);
    if (socket.connected) {
        alert(`✅ Conectado a ${BACKEND_URL}\nID: ${socket.id}`);
    } else {
        alert(`⚠️ Desconectado.\nIntentando reconectar a ${BACKEND_URL}...`);
        socket.connect();
    }
};
