'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import WordTile from '@/components/WordTile';
import GameInfo from '@/components/GameInfo';
import TimerDisplay from '@/components/TimerDisplay';

// Define types for better type safety
interface Log { type: 'event' | 'error' | 'warn' | 'success' | 'game-over' | 'user'; message: string; }
type GameState = 'lobby' | 'in-progress' | 'round-over' | 'game-over';
const TICK_SECONDS = 10.0;

export default function GamePage() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  
  // UI State
  const [logs, setLogs] = useState<Log[]>([]);
  const [guess, setGuess] = useState('');
  const [controlsDisabled, setControlsDisabled] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // Key to force-reset the timer
  
  // Game State
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [wordTiles, setWordTiles] = useState<(string | null)[]>([]);
  const [roundEndInfo, setRoundEndInfo] = useState<{ word: string, winner: string } | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<{ winner: string, reason: string } | null>(null);

  const addLog = useCallback((message: string, type: Log['type'] = 'event') => {
    setLogs(prevLogs => [...prevLogs, { type, message }]);
  }, []);

  // Effect for route protection
  useEffect(() => { if (!localStorage.getItem('jwt_token')) router.push('/login'); }, [router]);
  
  // Main effect for handling all socket events
  useEffect(() => {
    if (!socket) return;
    
    // --- Event Handlers ---
    const onMatchStart = (data: { opponent: string; matchId: string }) => {
      addLog(`Match started! Opponent: ${data.opponent}.`, 'success');
      setMatchId(data.matchId);
      setOpponent(data.opponent);
    };

    const onNewRound = (data: { wordLength: number }) => {
      addLog(`New round! Word has ${data.wordLength} letters.`);
      setGameState('in-progress');
      setWordTiles(Array(data.wordLength).fill(null));
      setControlsDisabled(false);
      setRoundEndInfo(null);
      setTimerKey(prev => prev + 1); // Reset timer
    };
    
    const onLetterReveal = (data: { letter: string; index: number }) => {
      addLog(`Letter revealed: '${data.letter}'`);
      setWordTiles(prev => {
        const newTiles = [...prev];
        newTiles[data.index] = data.letter;
        return newTiles;
      });
      setControlsDisabled(false);
      setGuess('');
      setTimerKey(prev => prev + 1); // Reset timer
    };

    const onGuessResult = (data: { correct: boolean; message: string }) => {
        addLog(data.message, data.correct ? 'success' : 'warn');
        if (data.correct) {
            setControlsDisabled(true); // Disable controls after a correct guess
        }
    };
    
    const onRoundEnd = (data: { secretWord: string; winner: string | null }) => {
        addLog(`Round over! The word was: ${data.secretWord}. Winner: ${data.winner || 'None'}`, 'event');
        setGameState('round-over');
        setRoundEndInfo({ word: data.secretWord, winner: data.winner || 'None' });
        setControlsDisabled(true);
    };

    const onGameOver = (data: { winner: string; reason: string }) => {
        addLog(`GAME OVER! Winner: ${data.winner}. Reason: ${data.reason}`, 'game-over');
        setGameState('game-over');
        setGameOverInfo(data);
        setControlsDisabled(true);
    };

    // --- Register Listeners ---
    socket.on('matchStart', onMatchStart);
    socket.on('newRound', onNewRound);
    socket.on('letterReveal', onLetterReveal);
    socket.on('guessResult', onGuessResult);
    socket.on('roundEnd', onRoundEnd);
    socket.on('gameOver', onGameOver);
    socket.on('error', (err: any) => addLog(err.message || err, 'error'));

    // --- Cleanup ---
    return () => {
      socket.off('matchStart');
      socket.off('newRound');
      socket.off('letterReveal');
      socket.off('guessResult');
      socket.off('roundEnd');
      socket.off('gameOver');
      socket.off('error');
    };
  }, [socket, addLog]);

  const handleJoinLobby = () => {
    if (!socket?.connected) return;
    socket.emit('joinLobby');
    addLog('Joining lobby...', 'user');
  };
  
  const handleMakeGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket?.connected || !matchId || guess.length !== wordTiles.length) {
        addLog('Guess must have the same length as the word.', 'error');
        return;
    }
    socket.emit('makeGuess', { guess: guess.toUpperCase(), matchId });
    setControlsDisabled(true);
    addLog(`Submitted guess: ${guess.toUpperCase()}`, 'user');
  };

  const renderGameContent = () => {
    if (gameState === 'game-over' && gameOverInfo) {
      return <div className="text-center">
        <h2 className="text-3xl font-bold text-dark-game-over">Game Over!</h2>
        <p className="mt-2 text-xl">Winner: {gameOverInfo.winner}</p>
        <p>Reason: {gameOverInfo.reason}</p>
        <button onClick={handleJoinLobby} className="mt-6 rounded-md bg-primary px-6 py-2 font-bold text-white hover:bg-primary-hover">
          Find New Match
        </button>
      </div>
    }

    if (matchId) {
      return <div>
        <GameInfo opponent={opponent} matchId={matchId} />
        {gameState === 'in-progress' && <TimerDisplay key={timerKey} duration={TICK_SECONDS} onTimeout={() => {}} />}
        <div className="my-6 flex justify-center gap-2">
          {wordTiles.map((letter, index) => <WordTile key={index} letter={letter} />)}
        </div>
        {roundEndInfo && <div className="my-4 text-center">
            <p>The word was: <strong className="text-xl">{roundEndInfo.word}</strong></p>
            <p>Round Winner: <strong className="text-xl">{roundEndInfo.winner}</strong></p>
            <p className="mt-2 animate-pulse">Waiting for next round...</p>
        </div>}
        <form onSubmit={handleMakeGuess} className="mt-4 flex gap-2">
          <input 
            type="text" value={guess} onChange={(e) => setGuess(e.target.value)}
            placeholder="Enter your guess" maxLength={wordTiles.length}
            disabled={controlsDisabled || gameState !== 'in-progress'}
            className="flex-grow rounded-md border border-gray-300 p-2 text-lg focus:border-primary focus:ring-primary disabled:bg-gray-200"
          />
          <button type="submit" disabled={controlsDisabled || gameState !== 'in-progress'} className="rounded-md bg-green-500 px-6 py-2 font-bold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-400">
            Guess
          </button>
        </form>
      </div>;
    }
    
    return <button onClick={handleJoinLobby} disabled={!isConnected} className="rounded-md bg-primary px-6 py-2 font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-400">
        {gameState === 'lobby' ? 'Waiting for Opponent...' : 'Join Lobby'}
    </button>
  }

  return (
    <div className="flex h-screen w-full gap-4 bg-gray-100 p-4">
      {/* Left Panel */}
      <div className="flex w-3/4 flex-col rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-3xl font-bold">Hidden Word Duel</h1>
        <div className="flex-grow">{renderGameContent()}</div>
      </div>
      {/* Right Panel: Logs */}
      <div className="flex w-1/4 flex-col rounded-lg bg-dark-bg p-4 text-white shadow-md">
        <h2 className="mb-2 text-xl font-bold">Game Logs</h2>
        <div className="flex-grow space-y-2 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => <div key={index}><span className="text-dark-time mr-2">...</span><span className={`font-bold ${log.type === 'error' ? 'text-dark-error' : 'text-dark-text'}`}>{log.message}</span></div>)}
        </div>
      </div>
    </div>
  );
}