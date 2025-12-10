const Lobby = require('./lib/Lobby');

class GameManager {
    constructor(io) {
        this.io = io;
        this.lobbies = new Map(); // code -> Lobby
    }

    createLobby(code) {
        if (this.lobbies.has(code)) return null;
        const lobby = new Lobby(this.io, code);
        this.lobbies.set(code, lobby);
        return lobby;
    }

    getLobby(code) {
        return this.lobbies.get(code);
    }

    handleConnection(socket) {
        console.log('User connected:', socket.id);

        socket.on('create_lobby', ({ name }) => {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const lobby = this.createLobby(code);
            lobby.handleJoin(socket, name);
            socket.emit('lobby_created', { code });
        });

        socket.on('join_lobby', ({ code, name }) => {
            const lobby = this.getLobby(code);
            if (!lobby) {
                socket.emit('error', 'Lobby not found');
                return;
            }
            lobby.handleJoin(socket, name);
            socket.emit('lobby_joined', { code });
        });

        // Proxy other events to the correct lobby
        // We need to know which lobby the socket is in. 
        // Since socket.rooms contains the lobby code, we can use that, 
        // or store it in a map in GameManager.
        // For simplicity, let's assume the client sends the code or we look it up.
        // Actually, socket.io rooms are perfect.

        socket.on('join_team', ({ code, teamId }) => {
            const lobby = this.getLobby(code);
            if (lobby) lobby.handleJoinTeam(socket, teamId);
        });

        socket.on('start_auction', ({ code }) => {
            const lobby = this.getLobby(code);
            if (lobby) lobby.handleStartAuction(socket);
        });

        socket.on('pause_auction', ({ code }) => {
            const lobby = this.getLobby(code);
            if (lobby) lobby.handlePauseAuction(socket);
        });

        socket.on('place_bid', ({ code, amount }) => {
            const lobby = this.getLobby(code);
            if (lobby) lobby.handlePlaceBid(socket, amount);
        });

        socket.on('disconnect', () => {
            // Find which lobby this user was in
            for (const lobby of this.lobbies.values()) {
                if (lobby.connectedUsers.has(socket.id)) {
                    lobby.handleDisconnect(socket);
                }
            }
        });
    }
}

module.exports = GameManager;
