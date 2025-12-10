const TEAMS = require('../data/teams');
const PLAYERS = require('../data/players');

class Lobby {
    constructor(io, code) {
        this.io = io;
        this.code = code;
        this.teams = JSON.parse(JSON.stringify(TEAMS));
        this.players = JSON.parse(JSON.stringify(PLAYERS));
        this.connectedUsers = new Map(); // socketId -> { name, teamId, id }
        this.adminSocketId = null;

        this.auctionState = {
            status: 'WAITING',
            currentPlayerIndex: -1,
            currentBid: 0,
            currentBidder: null,
            timer: null,
            timerEndTime: null,
            pausedTimeRemaining: null
        };
    }

    broadcast(event, data) {
        this.io.to(this.code).emit(event, data);
    }

    sendState(socket) {
        // Create a clean auction state without the timer object
        const { timer, ...cleanAuctionState } = this.auctionState;

        const state = {
            code: this.code,
            teams: this.teams,
            players: this.players, // Send full player list
            adminSocketId: this.adminSocketId,
            auctionState: {
                ...cleanAuctionState,
                currentPlayer: this.auctionState.currentPlayerIndex >= 0 ? this.players[this.auctionState.currentPlayerIndex] : null,
                timerEndTime: this.auctionState.timerEndTime
            },
            connectedUsers: Array.from(this.connectedUsers.values())
        };
        if (socket) {
            socket.emit('game_state', state);
        } else {
            this.broadcast('game_state', state);
        }
    }

    handleJoin(socket, name) {
        socket.join(this.code);

        // First user becomes admin
        if (this.connectedUsers.size === 0) {
            this.adminSocketId = socket.id;
        }

        this.connectedUsers.set(socket.id, { name, teamId: null, id: socket.id });
        this.sendState(socket);
    }

    handleJoinTeam(socket, teamId) {
        const user = this.connectedUsers.get(socket.id);
        if (!user) return;

        const isTaken = Array.from(this.connectedUsers.values()).some(u => u.teamId === teamId);
        if (isTaken) {
            socket.emit('error', 'Team already taken');
            return;
        }

        user.teamId = teamId;
        this.connectedUsers.set(socket.id, user);
        this.sendState();
    }

    handleStartAuction(socket) {
        if (socket.id !== this.adminSocketId) return;
        if (this.auctionState.status !== 'WAITING' && this.auctionState.status !== 'PAUSED') return;

        if (this.auctionState.status === 'PAUSED') {
            this.resumeAuction();
        } else {
            this.nextPlayer();
        }
    }

    handlePauseAuction(socket) {
        if (socket.id !== this.adminSocketId) return;
        if (this.auctionState.status !== 'BIDDING') return;

        this.auctionState.status = 'PAUSED';
        if (this.auctionState.timer) clearTimeout(this.auctionState.timer);

        // Calculate remaining time to resume later
        if (this.auctionState.timerEndTime) {
            this.auctionState.pausedTimeRemaining = Math.max(0, this.auctionState.timerEndTime - Date.now());
        }
        this.auctionState.timerEndTime = null;
        this.sendState();
    }

    resumeAuction() {
        this.auctionState.status = 'BIDDING';
        const duration = this.auctionState.pausedTimeRemaining || 15000;
        this.startTimer(duration);
        this.sendState();
    }

    nextPlayer() {
        this.auctionState.currentPlayerIndex++;
        if (this.auctionState.currentPlayerIndex >= this.players.length) {
            this.auctionState.status = 'COMPLETED';
            this.sendState();
            return;
        }

        const player = this.players[this.auctionState.currentPlayerIndex];
        this.auctionState.status = 'BIDDING';
        this.auctionState.currentBid = player.basePrice;
        this.auctionState.currentBidder = null;
        this.startTimer(15000); // Start timer for 15s
        this.sendState();
    }

    handlePlaceBid(socket, amount) {
        if (this.auctionState.status !== 'BIDDING') return;

        const user = this.connectedUsers.get(socket.id);
        if (!user || !user.teamId) return;

        const team = this.teams.find(t => t.id === user.teamId);
        if (!team) return;

        const newBid = this.auctionState.currentBid + amount;

        if (team.purse < newBid) {
            socket.emit('error', 'Insufficient purse');
            return;
        }
        if (team.slots <= 0) {
            socket.emit('error', 'No slots remaining');
            return;
        }
        const currentPlayer = this.players[this.auctionState.currentPlayerIndex];
        if (currentPlayer.country !== 'India' && team.overseasSlots <= 0) {
            socket.emit('error', 'No overseas slots remaining');
            return;
        }

        this.auctionState.currentBid = newBid;
        this.auctionState.currentBidder = user.teamId;

        this.startTimer(15000); // Reset to full 15s on bid
        this.sendState();
    }

    startTimer(duration) {
        if (this.auctionState.timer) clearTimeout(this.auctionState.timer);

        this.auctionState.timerEndTime = Date.now() + duration;

        this.auctionState.timer = setTimeout(() => {
            this.sellPlayer();
        }, duration);
    }

    sellPlayer() {
        if (!this.auctionState.currentBidder) {
            this.auctionState.status = 'UNSOLD';
            this.broadcast('auction_event', { type: 'UNSOLD', player: this.players[this.auctionState.currentPlayerIndex] });
        } else {
            const team = this.teams.find(t => t.id === this.auctionState.currentBidder);
            const player = this.players[this.auctionState.currentPlayerIndex];

            team.purse -= this.auctionState.currentBid;
            team.slots -= 1;
            if (player.country !== 'India') team.overseasSlots -= 1;
            team.players.push({ ...player, soldPrice: this.auctionState.currentBid });

            this.auctionState.status = 'SOLD';
            this.broadcast('auction_event', { type: 'SOLD', player, team, price: this.auctionState.currentBid });
        }

        this.sendState();

        setTimeout(() => {
            this.nextPlayer();
        }, 5000); // 5s pause before next player
    }

    handleDisconnect(socket) {
        this.connectedUsers.delete(socket.id);
        if (socket.id === this.adminSocketId) {
            // Assign new admin if available
            if (this.connectedUsers.size > 0) {
                this.adminSocketId = this.connectedUsers.keys().next().value;
            } else {
                this.adminSocketId = null;
            }
        }
        this.sendState();
    }
}

module.exports = Lobby;
