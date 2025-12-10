import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import LandingPage from './components/LandingPage';
import TeamSelector from './components/TeamSelector';
import AuctionCard from './components/AuctionCard';
import BiddingControls from './components/BiddingControls';
import TeamDashboard from './components/TeamDashboard';
import PlayerList from './components/PlayerList';
import './App.css';

const socket = io('http://localhost:3000');

function App() {
    const [gameState, setGameState] = useState(null);
    const [lobbyCode, setLobbyCode] = useState(null);
    const [myTeamId, setMyTeamId] = useState(null);
    const [error, setError] = useState(null);
    const [isInLobby, setIsInLobby] = useState(false);
    const [showPlayerList, setShowPlayerList] = useState(false);

    useEffect(() => {
        socket.on('connect', () => console.log('Connected to server'));

        socket.on('lobby_created', ({ code }) => {
            setLobbyCode(code);
            setIsInLobby(true);
        });

        socket.on('lobby_joined', ({ code }) => {
            setLobbyCode(code);
            setIsInLobby(true);
        });

        socket.on('game_state', (state) => {
            console.log('Received Game State:', state);
            setGameState(state);
        });

        socket.on('error', (msg) => {
            setError(msg);
            setTimeout(() => setError(null), 3000);
        });

        return () => {
            socket.off('connect');
            socket.off('lobby_created');
            socket.off('lobby_joined');
            socket.off('game_state');
            socket.off('error');
        };
    }, []);

    // Dynamic Theming
    useEffect(() => {
        if (gameState && myTeamId) {
            const team = gameState.teams.find(t => t.id === myTeamId);
            if (team && team.colors) {
                document.documentElement.style.setProperty('--primary', team.colors.primary);
                document.documentElement.style.setProperty('--accent', team.colors.secondary);
                // Adjust hover slightly
                document.documentElement.style.setProperty('--primary-hover', team.colors.secondary);
            }
        }
    }, [gameState, myTeamId]);

    const handleCreateLobby = (name) => {
        socket.emit('create_lobby', { name });
    };

    const handleJoinLobby = (code, name) => {
        socket.emit('join_lobby', { code, name });
    };

    const handleSelectTeam = (teamId) => {
        socket.emit('join_team', { code: lobbyCode, teamId });
        setMyTeamId(teamId);
    };

    const handleStartAuction = () => {
        socket.emit('start_auction', { code: lobbyCode });
    };

    const handlePauseAuction = () => {
        socket.emit('pause_auction', { code: lobbyCode });
    };

    const handleBid = (amount) => {
        socket.emit('place_bid', { code: lobbyCode, amount });
    };

    if (!isInLobby) {
        return (
            <>
                {error && <div className="error-toast">{error}</div>}
                <LandingPage onCreateLobby={handleCreateLobby} onJoinLobby={handleJoinLobby} />
            </>
        );
    }

    if (!gameState) return <div className="loading">Loading Game State...</div>;

    const myTeam = gameState.teams.find(t => t.id === myTeamId);
    const { auctionState, connectedUsers, adminSocketId } = gameState;
    const isAdmin = socket.id === adminSocketId;

    return (
        <div className="app-container">
            <header>
                <div className="header-left">
                    <h1>IPL Auction 2025</h1>
                    <span className="lobby-badge">Lobby: {lobbyCode}</span>
                    {isAdmin && <span className="admin-badge">ADMIN</span>}
                </div>
                <div className="header-right">
                    <button className="secondary-btn" onClick={() => setShowPlayerList(!showPlayerList)}>
                        {showPlayerList ? 'Back to Auction' : 'View Players'}
                    </button>
                </div>
                {error && <div className="error-toast">{error}</div>}
            </header>

            <main>
                {!myTeamId ? (
                    <TeamSelector
                        teams={gameState.teams}
                        onSelectTeam={handleSelectTeam}
                        connectedUsers={connectedUsers}
                    />
                ) : showPlayerList ? (
                    <div className="player-list-view">
                        <PlayerList players={gameState.players || []} teams={gameState.teams} />
                    </div>
                ) : (
                    <div className="auction-room">
                        <div className="main-area">
                            <div className="auction-center">
                                {auctionState.status === 'WAITING' ? (
                                    <div className="waiting-screen">
                                        <h2>Waiting for Auction to Start</h2>
                                        {isAdmin ? (
                                            <button className="primary-btn" onClick={handleStartAuction}>Start Auction</button>
                                        ) : (
                                            <p>Waiting for admin to start...</p>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {isAdmin && (
                                            <div className="admin-controls">
                                                {auctionState.status === 'PAUSED' ? (
                                                    <button className="primary-btn" onClick={handleStartAuction}>Resume Auction</button>
                                                ) : (
                                                    <button className="secondary-btn" onClick={handlePauseAuction}>Pause Auction</button>
                                                )}
                                            </div>
                                        )}

                                        {auctionState.status === 'PAUSED' && (
                                            <div className="paused-overlay">
                                                <div style={{ textAlign: 'center' }}>
                                                    <h2>Auction Paused</h2>
                                                    {isAdmin && <button className="primary-btn" onClick={handleStartAuction} style={{ marginTop: '1rem' }}>Resume Auction</button>}
                                                </div>
                                            </div>
                                        )}

                                        <AuctionCard
                                            player={auctionState.currentPlayer}
                                            currentBid={auctionState.currentBid}
                                            currentBidder={auctionState.currentBidder}
                                            status={auctionState.status}
                                            teams={gameState.teams}
                                            timerRemaining={auctionState.timerEndTime}
                                        />
                                        <BiddingControls
                                            onBid={handleBid}
                                            disabled={auctionState.status !== 'BIDDING' || auctionState.currentBidder === myTeamId}
                                            myTeam={myTeam}
                                        />
                                    </>
                                )}
                            </div>
                            <TeamDashboard team={myTeam} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
