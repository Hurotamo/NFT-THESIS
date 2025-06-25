import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface CountdownTimerProps {
  unlockTime: Date;
  lockPeriodMs: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ unlockTime, lockPeriodMs }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const unlock = unlockTime.getTime();
      const diff = unlock - now;
      setTimeLeft(diff > 0 ? diff : 0);
      setProgress(Math.max(0, Math.min(100, ((lockPeriodMs - diff) / lockPeriodMs) * 100)));
    }, 1000);
    return () => clearInterval(interval);
  }, [unlockTime, lockPeriodMs]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return 'Ready to unstake';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">Unlocks in:</span>
        <span className="text-xs font-mono text-white">{formatTime(timeLeft)}</span>
      </div>
      <Progress value={progress} />
    </div>
  );
};

export default CountdownTimer; 