export declare class Round {
    id: string;
    matchId: string;
    word: string;
    revealedTiles: boolean[];
    winnerId: string | null;
    roundNumber: number;
    createdAt: Date;
    endedAt: Date;
}
