'use client';

import { useState, useEffect } from 'react';

interface TimerDisplayProps {
  resetKey: any;
  duration: number;
  onTimeout: () => void;
}

export default function TimerDisplay({ resetKey, duration, onTimeout }: TimerDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isFinished) {
      onTimeout();
    }
  }, [isFinished, onTimeout]);

  // This effect manages the countdown interval.
  useEffect(() => {
    setTimeLeft(duration);
    setIsFinished(false);

    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 0.1;
        if (newTime <= 0) {
          clearInterval(interval);
          setIsFinished(true);
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [resetKey, duration]); 

  return (
    <h4 className="text-lg font-semibold">
      Next letter in: <span className="font-bold text-red-600">{timeLeft.toFixed(1)}</span>s
    </h4>
  );
}