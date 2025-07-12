"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModule = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("./game.service");
const game_gateway_1 = require("./game.gateway");
const match_module_1 = require("../match/match.module");
const player_module_1 = require("../player/player.module");
const auth_module_1 = require("../auth/auth.module");
const jwt_1 = require("@nestjs/jwt");
const guess_module_1 = require("../guess/guess.module");
const common_2 = require("@nestjs/common");
const round_module_1 = require("../round/round.module");
let GameModule = class GameModule {
};
exports.GameModule = GameModule;
exports.GameModule = GameModule = __decorate([
    (0, common_1.Module)({
        imports: [
            match_module_1.MatchModule,
            player_module_1.PlayerModule,
            auth_module_1.AuthModule,
            jwt_1.JwtModule,
            guess_module_1.GuessModule,
            (0, common_2.forwardRef)(() => round_module_1.RoundModule),
        ],
        providers: [game_service_1.GameService, game_gateway_1.GameGateway],
        exports: [game_service_1.GameService, game_gateway_1.GameGateway],
    })
], GameModule);
//# sourceMappingURL=game.module.js.map