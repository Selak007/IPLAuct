import React from 'react';

const TeamSelector = ({ teams, onSelectTeam, connectedUsers }) => {
    return (
        <div className="team-selector">
            <h2>Select Your Team</h2>
            <div className="teams-grid">
                {teams.map(team => {
                    const takenBy = connectedUsers.find(u => u.teamId === team.id);
                    return (
                        <div
                            key={team.id}
                            className={`team-card ${takenBy ? 'taken' : ''}`}
                            style={{
                                borderColor: team.colors?.primary,
                                background: `linear-gradient(135deg, ${team.colors?.primary}22, ${team.colors?.secondary}22)`
                            }}
                            onClick={() => !takenBy && onSelectTeam(team.id)}
                        >
                            <h3 style={{ color: team.colors?.primary }}>{team.name}</h3>
                            <p>Purse: ₹{(team.purse / 10000000).toFixed(2)} Cr</p>
                            <p>Slots: {team.slots}</p>
                            {takenBy && <p className="taken-badge">Taken by {takenBy.name}</p>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeamSelector;
