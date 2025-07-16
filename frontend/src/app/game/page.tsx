'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import WordTile from '@/components/WordTile';
import GameInfo from '@/components/GameInfo';
import TimerDisplay from '@/components/TimerDisplay';
import PlayerInfo from '@/components/PlayerInfo';

// --- Type Definitions ---
interface Log { type: 'event' | 'error' | 'warn' | 'success' | 'game-over' | 'user'; message: string; time?: string; }
type GameState = 'lobby' | 'waiting' | 'in-progress' | 'round-over' | 'game-over';
const TICK_SECONDS = 10.0;

export default function GamePage() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  
  // --- State Hooks ---
  const [logs, setLogs] = useState<Log[]>([]);
  const [guess, setGuess] = useState('');
  const [controlsDisabled, setControlsDisabled] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [wordTiles, setWordTiles] = useState<(string | null)[]>([]);
  const [roundEndInfo, setRoundEndInfo] = useState<{ word: string, winner: string } | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<{ winner: string, reason: string } | null>(null);
  const [wins, setWins] = useState(0);
  const [playerName, setPlayerName] = useState('');

  const addLog = useCallback((message: string, type: Log['type'] = 'event') => {
    setLogs(prevLogs => [{ type, message, time: new Date().toLocaleTimeString() }, ...prevLogs]);
  }, []);

  const handleTimeout = useCallback(() => {
    addLog('Time is up! Waiting for next letter.', 'warn');
    setControlsDisabled(true);
  }, [addLog]);

  const resetGameState = useCallback(() => {
    setMatchId(null);
    setOpponent(null);
    setWordTiles([]);
    setRoundEndInfo(null);
    setGameOverInfo(null);
    setGameState('lobby');
  }, []);

  useEffect(() => { 
    const storedUsername = localStorage.getItem('username');
    if (!localStorage.getItem('jwt_token') || !storedUsername){
      router.push('/login');
    } else {
      setPlayerName(storedUsername);
    } 
  }, [router]);

  useEffect(() => {
    if (!socket) return;
    const onMatchStart = (data: { opponent: string; matchId: string }) => {
      resetGameState(); // Ensure we start fresh
      addLog(`Match started! Opponent: ${data.opponent}.`, 'success');
      setMatchId(data.matchId);
      setOpponent(data.opponent);
      setGameState('in-progress');
    };
    const onNewRound = (data: { wordLength: number }) => {
      setGameState('in-progress');
      setWordTiles(Array(data.wordLength).fill(null));
      setControlsDisabled(false);
      setRoundEndInfo(null);
      setTimerKey(prev => prev + 1);
    };
    const onLetterReveal = (data: { letter: string; index: number }) => {
      setWordTiles(prev => {
        const newTiles = [...prev];
        newTiles[data.index] = data.letter;
        return newTiles;
      });
      setControlsDisabled(false);
      setGuess('');
      setTimerKey(prev => prev + 1);
    };
    const onGuessResult = (data: { correct: boolean; message: string }) => {
      addLog(data.message, data.correct ? 'success' : 'warn');
      if (data.correct) setControlsDisabled(true);
    };
    const onRoundEnd = (data: { secretWord: string; winner: string | null }) => {
      if (data.winner === playerName) {
        const currentWins = parseInt(localStorage.getItem('totalwins') || '0',10);
        localStorage.setItem('totalwins', (currentWins + 1).toString());
        setWins(prev => prev + 1);
      }
      setGameState('round-over');
      setRoundEndInfo({ word: data.secretWord, winner: data.winner || 'None' });
      setControlsDisabled(true);
    };
    const onGameOver = (data: { winner: string; reason: string }) => {
      addLog(`GAME OVER! Winner: ${data.winner}.`, 'game-over');
      if (data.winner === playerName) {
        const currentWins = parseInt(localStorage.getItem('totalwins') || '0',10);
        localStorage.setItem('totalwins', (currentWins + 1).toString());
        setWins(prev => prev + 1);
      }
      setGameOverInfo(data);
      setGameState('game-over');
      setRoundEndInfo(null);
      setMatchId(null);
    };
    const onError = (err: any) => addLog(err.message || err, 'error');
    
    socket.on('matchStart', onMatchStart);
    socket.on('newRound', onNewRound);
    socket.on('letterReveal', onLetterReveal);
    socket.on('guessResult', onGuessResult);
    socket.on('roundEnd', onRoundEnd);
    socket.on('gameOver', onGameOver);
    socket.on('error', onError);

    return () => {
      socket.off('matchStart');
      socket.off('newRound');
      socket.off('letterReveal');
      socket.off('guessResult');
      socket.off('roundEnd');
      socket.off('gameOver');
      socket.off('error');
    };
  }, [socket, addLog, resetGameState, playerName]);

  const handleJoinLobby = () => {
    if (!socket?.connected) return;
    resetGameState();
    socket.emit('joinLobby');
    setGameState('waiting');
  };
  
  const handleMakeGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !matchId || guess.length !== wordTiles.length) return;
    socket.emit('makeGuess', { guess: guess.toUpperCase(), matchId });
    setControlsDisabled(true);
  };

  const renderGameContent = () => {
    if (gameOverInfo) {
      return (<div className="text-center">
        <h2 className="text-4xl font-bold text-dark-game-over">Game Over!</h2>
        <p className="mt-2 text-3xl text-green-500">Winner: {gameOverInfo.winner}</p>
        <p className="text-2xl text-red-500">Reason: {gameOverInfo.reason}</p>
        <button onClick={handleJoinLobby} className="text-3xl mt-6 rounded-lg px-6 border-2 border-gray-300 bg-blue-500 py-2 font-bold text-white hover:bg-primary-hover">Find New Match</button>
      </div>);
    }
    if (roundEndInfo) {
      return (<div className="my-4 text-center">
        <h2 className="text-4xl font-bold text-dark-game-over">Game Over!</h2>
        <p className="text-3xl">The word was: <strong className="text-xl">{roundEndInfo.word}</strong></p>
        <p className="text-3xl text-green-500">Round Winner: <strong className="text-xl text-green-500">{roundEndInfo.winner}</strong></p>
        <p className="text-xl mt-2 animate-pulse text-red-500">Waiting for next round...</p>
        <button onClick={handleJoinLobby} className="mt-4 text-3xl text-blue-500 hover:underline">Find a New Match</button>
      </div>);
    }
    if (matchId) {
      return (<div>
        <GameInfo opponent={opponent} matchId={matchId} />
        {gameState === 'in-progress' && <TimerDisplay resetKey={timerKey} duration={TICK_SECONDS} onTimeout={handleTimeout} />}
        <div className="my-6 flex justify-center gap-2">
          {wordTiles.map((letter, index) => <WordTile key={index} letter={letter} />)}
        </div>
        <form onSubmit={handleMakeGuess} className="mt-4 flex gap-2">
          <input type="text" value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Enter your guess" maxLength={wordTiles.length} disabled={controlsDisabled} className="flex-grow rounded-md border border-gray-300 p-2 text-lg focus:border-primary focus:ring-primary disabled:bg-gray-200" />
          <button type="submit" disabled={controlsDisabled} className="rounded-md bg-green-500 px-6 py-2 font-bold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-400">Guess</button>
        </form>
      </div>);
    }
    return (<button onClick={handleJoinLobby} disabled={!isConnected || gameState === 'waiting'} className="rounded-md bg-primary px-6 py-2 font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-400">
        {gameState === 'waiting' ? 'Waiting for Opponent...' : 'Join Lobby'}
    </button>);
  }

  return (
    <div className="flex justify-center items-center h-screen w-full gap-4 bg-gray-100 p-4 flex-col rounded-lg bg-white shadow-md">
        <PlayerInfo wins={wins}/>
        <h1 className="flex justify-center items-center w-full mb-4 text-3xl bg-gray-200 font-bold border border-gray-300 bg-gray-200 text-gray-600 pb-2 rounded-lg">Guess Word</h1>
        <div className="flex-grow mt-4">{renderGameContent()}</div>
    </div>
  );
}