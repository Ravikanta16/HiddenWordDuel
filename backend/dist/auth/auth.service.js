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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const player_service_1 = require("../player/player.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    playerService;
    jwtService;
    constructor(playerService, jwtService) {
        this.playerService = playerService;
        this.jwtService = jwtService;
    }
    async validatePlayer(username, pass) {
        const player = await this.playerService.findOne(username);
        if (player && (await bcrypt.compare(pass, player.password))) {
            const { password, ...result } = player;
            return result;
        }
        return null;
    }
    async login(player) {
        const payload = { username: player.username, sub: player.id };
        return {
            player: player,
            access_token: this.jwtService.sign(payload),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [player_service_1.PlayerService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map