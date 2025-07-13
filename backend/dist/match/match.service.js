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
var MatchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const game_gateway_1 = require("../game/game.gateway");
const game_service_1 = require("../game/game.service");
const match_entity_1 = require("../entities/match.entity");
const typeorm_2 = require("typeorm");
const round_service_1 = require("../round/round.service");
const RECONNECTION_TIMEOUT_MS = 10000;
let MatchService = MatchService_1 = class MatchService {
    matchRepository;
    roundService;
    gameService;
    gameGateway;
    logger = new common_1.Logger(MatchService_1.name);
    forfeitTimers = new Map();
    constructor(matchRepository, roundService, gameService, gameGateway) {
        this.matchRepository = matchRepository;
        this.roundService = roundService;
        this.gameService = gameService;
        this.gameGateway = gameGateway;
    }
    async createMatch(player1, player2) {
        this.logger.log(`Creating match between ${player1.username} and ${player2.username}`);
        const newMatch = this.matchRepository.create({
            players: [player1, player2],
            status: 'ongoing',
        });
        await this.matchRepository.save(newMatch);
        this.roundService.createRound(newMatch);
        return newMatch;
    }
    handlePlayerDisconnect(matchId, disconnectedPlayerId) {
        const matchRoom = `match_${matchId}`;
        this.gameGateway.server.to(matchRoom).emit('playerDisconnected', {
            message: `A player has disconnected. The game will end in ${RECONNECTION_TIMEOUT_MS / 1000} seconds if they don't reconnect.`
        });
        const timer = setTimeout(() => {
            this.awardWinByForfeit(matchId, disconnectedPlayerId);
        }, RECONNECTION_TIMEOUT_MS);
        this.forfeitTimers.set(matchId, timer);
    }
    async awardWinByForfeit(matchId, disconnectedPlayerId) {
        this.forfeitTimers.delete(matchId);
        const activeRound = await this.roundService.getActiveRoundForMatch(matchId);
        if (activeRound) {
            await this.roundService.forceStopRound(activeRound.id);
        }
        const match = await this.matchRepository.findOne({ where: { id: matchId }, relations: ['players'] });
        if (!match || match.status !== 'ongoing') {
            return;
        }
        const winningPlayer = match.players.find(p => p.id !== disconnectedPlayerId);
        if (!winningPlayer)
            return;
        this.logger.log(`Player ${winningPlayer.username} wins match ${matchId} by forfeit.`);
        match.status = 'completed';
        match.winnerId = winningPlayer.id;
        await this.matchRepository.save(match);
        const matchRoom = `match_${matchId}`;
        this.gameGateway.server.to(matchRoom).emit('gameOver', {
            winner: winningPlayer.username,
            reason: `Opponent disconnected and failed to reconnect.`
        });
        this.gameService.concludeMatch(matchId);
    }
    handlePlayerReconnect(matchId, playerId) {
        const timer = this.forfeitTimers.get(matchId);
        if (timer) {
            clearTimeout(timer);
            this.forfeitTimers.delete(matchId);
            this.logger.log(`Player ${playerId} reconnected to match ${matchId}. Forfeit averted.`);
            const matchRoom = `match_${matchId}`;
            this.gameGateway.server.to(matchRoom).emit('playerReconnected', {
                message: 'Opponent has reconnected!'
            });
        }
    }
};
exports.MatchService = MatchService;
exports.MatchService = MatchService = MatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_service_1.GameService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        round_service_1.RoundService,
        game_service_1.GameService,
        game_gateway_1.GameGateway])
], MatchService);
//# sourceMappingURL=match.service.js.map