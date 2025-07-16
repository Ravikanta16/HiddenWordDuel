'use client';

interface GameInfoProps {
  opponent: string | null;
  matchId: string | null;
}

export default function GameInfo({ opponent, matchId }: GameInfoProps) {
    if (!opponent) return null;

    return (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            {/* <h2 className="text-xl font-semibold">Match Details</h2> */}
            <p><strong>Opponent:</strong> {opponent}</p>
            {/* <p className="truncate text-xs text-gray-500"><strong>Match ID:</strong> {matchId}</p> */}
        </div>
    );
}
