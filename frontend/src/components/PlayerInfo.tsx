'use client';

import { useEffect, useState } from 'react';

export default function PlayerInfo({wins}: {wins: number}) {
  const [username, setUsername] = useState<string | null>(null);
  const [totalWins, setTotalWins] = useState<string | null>(null);
  
  useEffect(() => {
    setUsername(localStorage.getItem('username'));
    setTotalWins(localStorage.getItem('totalwins'));
    console.log('username and totalwins playeringo page', username, totalWins);
  }, [wins]);

  if (!username) {
    return null; 
  }

  return (
    <div className="absolute top-16 right-6 z-20 rounded-full bg-gray-200 p-3 shadow-md">
      <h3 className="flex justify-center items-center text-sm font-bold text-gray-800">{username}</h3>
      <p className="flex justify-center items-center text-xs text-blue-600">Wins: <span className="font-bold">{totalWins || 0}</span></p>
    </div>
  );
}
