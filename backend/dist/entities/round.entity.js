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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Round = void 0;
const typeorm_1 = require("typeorm");
const match_entity_1 = require("./match.entity");
const player_entity_1 = require("./player.entity");
const guess_entity_1 = require("./guess.entity");
let Round = class Round {
    id;
    match;
    secretWord;
    revealedLetters;
    status;
    winner;
    guesses;
    createdAt;
    endedAt;
};
exports.Round = Round;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Round.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => match_entity_1.Match, match => match.rounds),
    __metadata("design:type", match_entity_1.Match)
], Round.prototype, "match", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Round.prototype, "secretWord", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { array: true, default: [] }),
    __metadata("design:type", Array)
], Round.prototype, "revealedLetters", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['ongoing', 'finished'], default: 'ongoing' }),
    __metadata("design:type", String)
], Round.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => player_entity_1.Player, { nullable: true }),
    __metadata("design:type", Object)
], Round.prototype, "winner", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => guess_entity_1.Guess, guess => guess.round),
    __metadata("design:type", Array)
], Round.prototype, "guesses", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Round.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Round.prototype, "endedAt", void 0);
exports.Round = Round = __decorate([
    (0, typeorm_1.Entity)()
], Round);
//# sourceMappingURL=round.entity.js.map