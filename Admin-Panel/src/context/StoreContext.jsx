import React, { createContext, useState, useContext, useEffect } from 'react';
import { JsonRpcProvider, Contract, keccak256, toUtf8Bytes } from 'ethers';
import abi from '../abi.json';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const [isVotingActive, setIsVotingActive] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  
  const [voters, setVoters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [blockchain, setBlockchain] = useState([]);
  const [contractAddress, setContractAddress] = useState('');

  const API_BASE = 'http://127.0.0.1:5000';
  const RPC_URL = 'https://sepolia.infura.io/v3/6fd59a6f1ef14962990807736297b6b9';

  const fetchData = async () => {
    try {
      const [votersRes, statusRes, candidatesRes] = await Promise.all([
        fetch(`${API_BASE}/api/voters`, { cache: 'no-store' }).then(res => res.json()),
        fetch(`${API_BASE}/api/settings/voting_active`, { cache: 'no-store' }).then(res => res.json()),
        fetch(`${API_BASE}/api/candidates`, { cache: 'no-store' }).then(res => res.json())
      ]);

      if (votersRes.status === 'success') setVoters(votersRes.voters || []);
      if (statusRes.status === 'success') {
        setIsVotingActive(statusRes.isVotingActive);
        if (statusRes.contractAddress) {
          setContractAddress(statusRes.contractAddress);
        }
      }
      if (candidatesRes.status === 'success') setCandidates(candidatesRes.candidates || []);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId);
  }, []);

  const [activeElectionCandidates, setActiveElectionCandidates] = useState([]);

  // Web3 Event Listener for Live Results and Candidates
  useEffect(() => {
    if (isVotingActive && contractAddress) {
      const provider = new JsonRpcProvider(RPC_URL);
      const contract = new Contract(contractAddress, abi, provider);
      
      const fetchInitialData = async () => {
        try {
          // 1. Fetch Events
          const currentBlock = await provider.getBlockNumber();
          const fromBlock = Math.max(0, currentBlock - 9000); // Last ~30 hours to avoid Infura block range limits
          const events = await contract.queryFilter('VoteRecorded', fromBlock, 'latest');
          const formattedBlocks = events.map(e => ({
            blockId: e.blockNumber,
            timestamp: e.args.timestamp ? new Date(Number(e.args.timestamp) * 1000).toISOString() : new Date().toISOString(),
            previousHash: '...', 
            currentHash: e.transactionHash,
            voterHash: e.args.hashedVoterId,
            candidateId: e.args.candidateId.toString()
          })).reverse();
          setBlockchain(formattedBlocks);

          // 2. Fetch Candidates
          const count = await contract.candidatesCount();
          let fetchedCands = [];
          for (let i = 1; i <= Number(count); i++) {
            const c = await contract.candidates(i);
            fetchedCands.push({
              id: c[0].toString(), // id is the first returned value
              name: c[1],          // name is the second
              voteCount: Number(c[2]) // voteCount is the third
            });
          }
          
          setActiveElectionCandidates(fetchedCands);
        } catch (e) {
          console.error("Error fetching Web3 data", e);
        }
      };

      fetchInitialData();

      contract.on("VoteRecorded", (hashedVoterId, candidateId, timestamp, event) => {
        const newBlock = {
          blockId: event.log.blockNumber, // in v6 event data is inside event.log
          timestamp: new Date(Number(timestamp) * 1000).toISOString(),
          previousHash: '...',
          currentHash: event.log.transactionHash,
          voterHash: hashedVoterId,
          candidateId: candidateId.toString()
        };
        setBlockchain(prev => [newBlock, ...prev]);
        
        // Update vote count locally
        setActiveElectionCandidates(prev => prev.map(c => 
          c.id === candidateId.toString() ? { ...c, voteCount: c.voteCount + 1 } : c
        ));

        fetchData(); // Refresh local DB voters status
      });

      return () => {
        contract.removeAllListeners("VoteRecorded");
      };
    } else {
      setBlockchain([]);
      setActiveElectionCandidates([]);
    }
  }, [isVotingActive, contractAddress]);

  const addCandidate = async (candidateData) => {
    try {
      const payload = {
        name: candidateData.name,
        party: candidateData.party,
        photo_path: candidateData.imageUrl,
        party_logo_path: candidateData.symbol
      };
      const res = await fetch(`${API_BASE}/api/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchData(); // Refresh immediately
      } else {
        console.error("Failed to add candidate:", data.message);
      }
    } catch (err) {
      console.error("Error adding candidate:", err);
    }
  };

  const toggleVoting = async (status, address = null) => {
    try {
      if (status === true && address) {
        // Post the address to the backend first
        await fetch(`${API_BASE}/api/settings/contract_address`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });
        setContractAddress(address);
      }

      const formData = new URLSearchParams();
      const newStatus = status ?? !isVotingActive;
      formData.append('active', newStatus);
      const res = await fetch(`${API_BASE}/api/settings/voting_active`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsVotingActive(data.isVotingActive);
      }
    } catch (err) {
      console.error("Failed to toggle voting status", err);
    }
  };

  const registerVoter = (voterData) => {
    setVoters(prev => [...prev, voterData]);
  };

  const votersWithVoteStatus = voters.map(v => {
    try {
      const hashed = keccak256(toUtf8Bytes(v.voter_id));
      return { ...v, has_voted: blockchain.some(b => b.voterHash === hashed) };
    } catch (e) {
      return v;
    }
  });

  return (
    <StoreContext.Provider value={{
      isAdminLoggedIn, setIsAdminLoggedIn,
      isVotingActive, toggleVoting,
      voters: votersWithVoteStatus, registerVoter,
      candidates, addCandidate,
      blockchain, contractAddress,
      activeElectionCandidates
    }}>
      {children}
    </StoreContext.Provider>
  );
};
