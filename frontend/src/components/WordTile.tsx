'use client';

interface WordTileProps {
  letter: string | null;
}

export default function WordTile({ letter }: WordTileProps) {
  const isRevealed = letter !== null;
  return (
    <div
      className={`
        flex h-16 w-16 items-center justify-center rounded-md border-2 
        border-primary text-3xl font-bold uppercase
        ${isRevealed ? 'bg-blue-100 text-gray-800' : 'bg-white'}
      `}
    >
      {letter}
    </div>
  );
}
