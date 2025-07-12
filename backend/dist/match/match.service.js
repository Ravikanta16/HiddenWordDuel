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
const match_entity_1 = require("../entities/match.entity");
const typeorm_2 = require("typeorm");
const round_service_1 = require("../round/round.service");
let MatchService = MatchService_1 = class MatchService {
    matchRepository;
    roundService;
    logger = new common_1.Logger(MatchService_1.name);
    constructor(matchRepository, roundService) {
        this.matchRepository = matchRepository;
        this.roundService = roundService;
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
};
exports.MatchService = MatchService;
exports.MatchService = MatchService = MatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        round_service_1.RoundService])
], MatchService);
//# sourceMappingURL=match.service.js.map