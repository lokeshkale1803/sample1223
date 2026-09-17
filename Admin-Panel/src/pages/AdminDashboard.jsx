import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Users, Power, Lock, Database, UserPlus, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isVotingActive, toggleVoting, voters, blockchain, candidates, addCandidate } = useStore();

  const [newCandidate, setNewCandidate] = useState({ name: '', party: '', symbol: '', imageUrl: '' });
  const [searchVoterId, setSearchVoterId] = useState('');
  const [searchedVoter, setSearchedVoter] = useState(null);


  const handleSearchVoter = () => {
    const voter = voters.find(v => v.voter_id === searchVoterId);
    setSearchedVoter(voter || { notFound: true });
  };

  const handleToggleVoting = () => {
    if (!isVotingActive) {
      const address = prompt("Enter the deployed Sepolia Contract Address to start the election:");
      if (address && address.trim().length > 0) {
        toggleVoting(true, address.trim());
      } else {
        alert("Contract Address is required to start the election.");
      }
    } else {
      if (window.confirm("Are you sure you want to STOP the election?")) {
        toggleVoting(false);
      }
    }
  };

  const handleAddCandidate = (e) => {
    e.preventDefault();
    if (newCandidate.name && newCandidate.party && newCandidate.symbol) {
      addCandidate(newCandidate);
      setNewCandidate({ name: '', party: '', symbol: '', imageUrl: '' }); // Reset form
      // Reset file inputs manually
      document.getElementById('symbol-upload').value = '';
      document.getElementById('image-upload').value = '';
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCandidate(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Admin Dashboard</h2>
        <button 
          className="btn" 
          style={{ 
            background: isVotingActive ? 'var(--danger-color)' : 'var(--accent-color)',
            color: 'white',
            boxShadow: isVotingActive ? '0 4px 6px rgba(220, 38, 38, 0.2)' : '0 4px 6px rgba(22, 163, 74, 0.2)'
          }}
          onClick={handleToggleVoting}
        >
          {isVotingActive ? <Lock size={18} /> : <Power size={18} />}
          {isVotingActive ? 'Stop Voting' : 'Start Voting'}
        </button>
      </div>

      <div className="cards-grid">
        {/* Statistics Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Users color="var(--primary-color)" />
            <h3>Election Statistics</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Registered Voters</span>
              <span style={{ fontWeight: 'bold' }}>{voters.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Votes Cast</span>
              <span style={{ fontWeight: 'bold' }}>{voters.filter(v => v.has_voted).length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Voting Status</span>
              <span style={{ fontWeight: 'bold', color: isVotingActive ? 'var(--accent-color)' : 'var(--danger-color)' }}>
                {isVotingActive ? 'ACTIVE' : 'LOCKED'}
              </span>
            </div>
          </div>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', marginTop: '24px' }}
            onClick={() => navigate('/register')}
          >
            Register New Voter
          </button>
        </div>

        {/* Voter Lookup Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Users color="var(--primary-color)" />
            <h3>Voter Lookup</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input 
              className="input-field" 
              type="text" 
              placeholder="Enter Voter ID"
              value={searchVoterId}
              onChange={e => setSearchVoterId(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSearchVoter}>Search</button>
          </div>
          {searchedVoter && !searchedVoter.notFound && (
            <div style={{ padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: '8px', fontSize: '0.9rem' }}>
              <p style={{ margin: '4px 0' }}><strong>Name:</strong> {searchedVoter.name || 'N/A'}</p>
              <p style={{ margin: '4px 0' }}><strong>Voter ID:</strong> {searchedVoter.voter_id}</p>
              <p style={{ margin: '4px 0' }}><strong>Status:</strong> {searchedVoter.has_voted ? <span style={{color:'var(--accent-color)', fontWeight: 'bold'}}>Voted</span> : <span style={{color:'var(--danger-color)', fontWeight: 'bold'}}>Not Voted</span>}</p>
            </div>
          )}
          {searchedVoter && searchedVoter.notFound && (
            <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>Voter not found.</p>
          )}
        </div>

        {/* Voter Database Table */}
        <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Database color="var(--primary-color)" />
            <h3>Voter Database Records</h3>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Name</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Voter ID</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Fingerprint Hash ID</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Iris Hash ID</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {voters.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No records found.</td></tr>
                ) : (
                  voters.map(v => (
                    <tr key={v.voter_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{v.name || 'N/A'}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>{v.voter_id}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.has_fingerprint ? 'Registered' : 'Not Registered'}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.has_iris ? 'Registered' : 'Not Registered'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {v.has_voted ? <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Voted</span> : <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>Not Voted</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Candidate Management Card */}
        <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <UserPlus color="var(--primary-color)" />
            <h3>Manage Candidates</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <form onSubmit={handleAddCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                required
                className="input-field" 
                type="text" 
                placeholder="Candidate Name"
                value={newCandidate.name}
                onChange={e => setNewCandidate({...newCandidate, name: e.target.value})}
              />
              <input 
                required
                className="input-field" 
                type="text" 
                placeholder="Party Name"
                value={newCandidate.party}
                onChange={e => setNewCandidate({...newCandidate, party: e.target.value})}
              />
              <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '-8px' }}>Party Logo / Symbol</label>
              <input 
                id="symbol-upload"
                required
                className="input-field" 
                type="file" 
                accept="image/*"
                onChange={e => handleFileUpload(e, 'symbol')}
              />
              <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '-8px' }}>Candidate Image (Optional)</label>
              <input 
                id="image-upload"
                className="input-field" 
                type="file" 
                accept="image/*"
                onChange={e => handleFileUpload(e, 'imageUrl')}
              />
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>Add Candidate</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
              {candidates.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No candidates added yet.</p>}
              {candidates.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {c.photo_path && (
                      <img src={c.photo_path} alt={c.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                    )}
                    <div>
                      <span style={{ fontWeight: '600', display: 'block' }}>{c.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                        {c.party_logo_path && (
                          <img src={c.party_logo_path} alt="logo" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                        )}
                        <span>{c.party}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Blockchain Monitor Card */}
        <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Database color="var(--primary-color)" />
            <h3>Blockchain Monitor</h3>
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {blockchain.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No blocks minted yet or waiting for connection...</p>}
            {blockchain.map((block, idx) => (
              <div key={block.currentHash} style={{ 
                background: 'var(--bg-surface-hover)', 
                padding: '16px', 
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--primary-color)',
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Block #{block.blockId}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{block.timestamp}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Voter Hash: {block.voterHash}
                </div>
                <div style={{ color: 'var(--primary-color)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  TX Hash: <a href={`https://sepolia.etherscan.io/tx/${block.currentHash}`} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-color)'}}>{block.currentHash}</a>
                </div>
                <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                  Candidate ID: {block.candidateId}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
