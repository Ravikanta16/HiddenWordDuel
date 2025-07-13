"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RoundService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoundService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const game_gateway_1 = require("../game/game.gateway");
const match_entity_1 = require("../entities/match.entity");
const round_entity_1 = require("../entities/round.entity");
const typeorm_2 = require("typeorm");
const WORD_LIST = ['ABCD', 'EFGH', 'IJKL', 'MNOP', 'QRST', 'UVWX', 'YZ'];
const TICK_RATE_MS = 10000;
const DRAW_GRACE_PERIOD_MS = 2000;
let RoundService = RoundService_1 = class RoundService {
    roundRepository;
    gameGateway;
    logger = new common_1.Logger(RoundService_1.name);
    guessesThisTick = new Map();
    gracePeriodTimers = new Map();
    firstCorrectGuessers = new Map();
    constructor(roundRepository, gameGateway) {
        this.roundRepository = roundRepository;
        this.gameGateway = gameGateway;
    }
    async createRound(match) {
        const secretWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
        const round = this.roundRepository.create({
            match,
            secretWord,
            revealedLetters: [],
            status: 'ongoing',
        });
        await this.roundRepository.save(round);
        this.logger.log(`New round created for match ${match.id} with word: ${secretWord}`);
        const updatedMatch = await this.roundRepository.manager.findOne(match_entity_1.Match, {
            where: { id: match.id },
            relations: ['rounds'],
        });
        this.startRound(round, updatedMatch?.rounds.length || 0);
        return round;
    }
    startRound(round, roundNumber) {
        this.guessesThisTick.set(round.id, new Set());
        const matchRoom = `match_${round.match.id}`;
        this.gameGateway.server.to(matchRoom).emit('newRound', {
            roundId: round.id,
            wordLength: round.secretWord.length,
            roundNumber: roundNumber,
        });
        this.scheduleNextLetterReveal(round.id);
    }
    scheduleNextLetterReveal(roundId) {
        setTimeout(async () => {
            const round = await this.getActiveRoundById(roundId);
            if (!round)
                return;
            this.guessesThisTick.set(roundId, new Set());
            const revealedCount = round.revealedLetters.length;
            if (revealedCount >= round.secretWord.length) {
                this.endRound(round, null);
                return;
            }
            let revealIndex;
            do {
                revealIndex = Math.floor(Math.random() * round.secretWord.length);
            } while (round.revealedLetters.includes(revealIndex));
            round.revealedLetters.push(revealIndex);
            await this.roundRepository.save(round);
            const matchRoom = `match_${round.match.id}`;
            this.gameGateway.server.to(matchRoom).emit('letterReveal', {
                index: revealIndex,
                letter: round.secretWord[revealIndex],
            });
            this.logger.log(`Revealed letter at index ${revealIndex} for round ${round.id}. Players can now guess.`);
            this.scheduleNextLetterReveal(roundId);
        }, TICK_RATE_MS);
    }
    initiateRoundEnd(round, guesser) {
        if (this.gracePeriodTimers.has(round.id)) {
            this.logger.log(`Second correct guess received for round ${round.id}. It's a draw!`);
            clearTimeout(this.gracePeriodTimers.get(round.id));
            this.gracePeriodTimers.delete(round.id);
            this.endRound(round, null);
        }
        else {
            this.logger.log(`First correct guess by ${guesser.username}. Starting draw grace period.`);
            this.firstCorrectGuessers.set(round.id, guesser);
            const timer = setTimeout(() => {
                this.logger.log(`Grace period ended. ${guesser.username} is the sole winner.`);
                this.endRound(round, guesser);
            }, DRAW_GRACE_PERIOD_MS);
            this.gracePeriodTimers.set(round.id, timer);
        }
    }
    async endRound(round, winner) {
        if (round.status !== 'ongoing')
            return;
        this.gracePeriodTimers.delete(round.id);
        this.firstCorrectGuessers.delete(round.id);
        this.guessesThisTick.delete(round.id);
        round.status = 'finished';
        round.winner = winner;
        await this.roundRepository.save(round);
        const matchRoom = `match_${round.match.id}`;
        this.gameGateway.server.to(matchRoom).emit('roundEnd', {
            winner: winner ? winner.username : null,
            secretWord: round.secretWord,
        });
        this.logger.log(`Round ${round.id} ended. Winner: ${winner?.username || 'None (Draw)'}`);
    }
    async forceStopRound(roundId) {
        const round = await this.getActiveRoundById(roundId);
        if (round) {
            this.logger.log(`Force stopping round ${round.id} due to forfeit.`);
            round.status = 'finished';
            await this.roundRepository.save(round);
            this.guessesThisTick.delete(round.id);
        }
    }
    async getActiveRoundForMatch(matchId) {
        return this.roundRepository.findOne({
            where: { match: { id: matchId }, status: 'ongoing' },
            relations: ['match'],
        });
    }
    async getActiveRoundById(roundId) {
        return this.roundRepository.findOne({
            where: { id: roundId, status: 'ongoing' },
            relations: ['match'],
        });
    }
    canPlayerGuess(roundId, playerId) {
        const playersWhoGuessed = this.guessesThisTick.get(roundId);
        return playersWhoGuessed ? !playersWhoGuessed.has(playerId) : false;
    }
    recordGuess(roundId, playerId) {
        this.guessesThisTick.get(roundId)?.add(playerId);
    }
};
exports.RoundService = RoundService;
exports.RoundService = RoundService = RoundService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(round_entity_1.Round)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        game_gateway_1.GameGateway])
], RoundService);
//# sourceMappingURL=round.service.js.map