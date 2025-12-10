import React from 'react';

const PlayerList = ({ players, teams }) => {
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : '-';
    };

    return (
        <div className="player-list-container">
            <h3>Player Auction Status</h3>
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Set</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Country</th>
                            <th>Status</th>
                            <th>Sold Price</th>
                            <th>Team</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player, index) => {
                            // Find if player is sold in any team
                            let status = 'WAITING';
                            let soldPrice = '-';
                            let soldTo = '-';
                            let statusClass = 'waiting';

                            // Check if sold
                            for (const team of teams) {
                                const soldPlayer = team.players.find(p => p.name === player.name);
                                if (soldPlayer) {
                                    status = 'SOLD';
                                    soldPrice = `₹${(soldPlayer.soldPrice / 10000000).toFixed(2)} Cr`;
                                    soldTo = team.name;
                                    statusClass = 'sold';
                                    break;
                                }
                            }

                            // Check if unsold (we need to track this in player object or infer)
                            // Since we don't modify the original players array in Lobby.js to mark UNSOLD, 
                            // we might need to rely on the fact that if they are passed in index but not in a team, they are unsold?
                            // Actually, Lobby.js doesn't explicitly mark players as UNSOLD in the players array, 
                            // it just broadcasts the event. 
                            // IMPROVEMENT: We should probably update the players array in Lobby.js to reflect status.
                            // For now, let's assume if not sold and index < currentPlayerIndex, it might be unsold? 
                            // But strictly, we don't have that info in the `players` prop passed here unless we update backend.
                            // Let's stick to Sold/Waiting for now, or update backend to track status in players list.

                            return (
                                <tr key={index} className={statusClass}>
                                    <td>{player.set}</td>
                                    <td>{player.name}</td>
                                    <td>{player.role}</td>
                                    <td>{player.country}</td>
                                    <td><span className={`status-pill ${statusClass}`}>{status}</span></td>
                                    <td>{soldPrice}</td>
                                    <td>{soldTo}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlayerList;
