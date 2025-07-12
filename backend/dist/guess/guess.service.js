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
var GuessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuessService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const guess_entity_1 = require("../entities/guess.entity");
const round_service_1 = require("../round/round.service");
const typeorm_2 = require("typeorm");
let GuessService = GuessService_1 = class GuessService {
    guessRepository;
    roundService;
    logger = new common_1.Logger(GuessService_1.name);
    constructor(guessRepository, roundService) {
        this.guessRepository = guessRepository;
        this.roundService = roundService;
    }
    async submitGuess(player, matchId, word) {
        try {
            const round = await this.roundService.getActiveRoundForMatch(matchId);
            if (!round) {
                this.logger.warn(`No active round found for match ${matchId}`);
                return { isCorrect: false, secretWord: '' };
            }
            const normalizedGuess = word.toUpperCase().trim();
            const normalizedSecret = round.secretWord.toUpperCase().trim();
            const guess = this.guessRepository.create({
                player,
                round,
                word: normalizedGuess,
            });
            await this.guessRepository.save(guess);
            const isCorrect = normalizedSecret === normalizedGuess;
            this.logger.log(`Player ${player.username} guessed "${word}" - ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
            if (isCorrect) {
                await this.roundService.endRound(round, player);
            }
            return { isCorrect, secretWord: round.secretWord };
        }
        catch (error) {
            this.logger.error(`Error submitting guess: ${error.message}`);
            return { isCorrect: false, secretWord: '' };
        }
    }
};
exports.GuessService = GuessService;
exports.GuessService = GuessService = GuessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(guess_entity_1.Guess)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => round_service_1.RoundService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        round_service_1.RoundService])
], GuessService);
//# sourceMappingURL=guess.service.js.map