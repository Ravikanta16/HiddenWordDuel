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
var GameGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const game_service_1 = require("./game.service");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const player_service_1 = require("../player/player.service");
const guess_service_1 = require("../guess/guess.service");
let GameGateway = GameGateway_1 = class GameGateway {
    gameService;
    guessService;
    jwtService;
    playerService;
    server;
    logger = new common_1.Logger(GameGateway_1.name);
    constructor(gameService, guessService, jwtService, playerService) {
        this.gameService = gameService;
        this.guessService = guessService;
        this.jwtService = jwtService;
        this.playerService = playerService;
    }
    async handleConnection(client) {
        const token = client.handshake.auth.token;
        if (!token) {
            this.logger.warn(`Client ${client.id} connected without a token. Disconnecting.`);
            return client.disconnect();
        }
        try {
            const payload = this.jwtService.verify(token);
            const player = await this.playerService.findById(payload.sub);
            if (!player) {
                this.logger.warn(`Player not found for token payload. Disconnecting.`);
                return client.disconnect();
            }
            client.player = player;
            this.logger.log(`Client ${client.id} authenticated as ${player.username}`);
            this.gameService.handleReconnect(player, client);
        }
        catch (error) {
            this.logger.error(`Authentication failed for ${client.id}: ${error.message}. Disconnecting.`);
            return client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client ${client.id} disconnected.`);
        this.gameService.handleDisconnect(client);
    }
    handleJoinLobby(client) {
        if (client.player) {
            this.gameService.addPlayerToLobby(client, client.player);
        }
    }
    async handleMakeGuess(data, client) {
        if (!client.player) {
            return;
        }
        const result = await this.guessService.submitGuess(client.player, data.matchId, data.guess);
        client.emit('guessResult', {
            correct: result.isCorrect,
            message: result.isCorrect ? 'Correct guess! Waiting for draw/win...' : 'Incorrect guess.',
        });
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinLobby'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleJoinLobby", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('makeGuess'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleMakeGuess", null);
exports.GameGateway = GameGateway = GameGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_service_1.GameService))),
    __metadata("design:paramtypes", [game_service_1.GameService,
        guess_service_1.GuessService,
        jwt_1.JwtService,
        player_service_1.PlayerService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map