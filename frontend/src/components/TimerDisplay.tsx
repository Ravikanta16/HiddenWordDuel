'use client';

import { useState, useEffect } from 'react';

interface TimerDisplayProps {
  // A key that changes to reset the timer
  resetKey: any; 
  duration: number; // in seconds
  onTimeout: () => void;
}

export default function TimerDisplay({ resetKey, duration, onTimeout }: TimerDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration); // Reset time when the key changes

    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 0.1;
        if (newTime <= 0) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [resetKey, duration, onTimeout]);

  return (
    <h4 className="text-lg font-semibold">
      Next letter in: <span className="font-bold text-red-600">{timeLeft.toFixed(1)}</span>s
    </h4>
  );
}