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
const config_1 = require("@nestjs/config");
let GameGateway = GameGateway_1 = class GameGateway {
    gameService;
    guessService;
    jwtService;
    playerService;
    configService;
    server;
    logger = new common_1.Logger(GameGateway_1.name);
    constructor(gameService, guessService, jwtService, playerService, configService) {
        this.gameService = gameService;
        this.guessService = guessService;
        this.jwtService = jwtService;
        this.playerService = playerService;
        this.configService = configService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                this.logger.warn(`Client ${client.id} connected without a token.`);
                client.emit('error', 'Authentication token not provided.');
                return client.disconnect();
            }
            this.logger.debug(`Attempting to verify token for client ${client.id}`);
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET')
            });
            const player = await this.playerService.findById(payload.sub);
            if (!player) {
                this.logger.warn(`No player found for token payload: ${JSON.stringify(payload)}`);
                client.emit('error', 'Player not found');
                return client.disconnect();
            }
            client.player = player;
            this.logger.log(`Client ${client.id} authenticated as ${player.username}`);
        }
        catch (error) {
            this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
            client.emit('error', 'Authentication failed');
            return client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client ${client.id} disconnected.`);
        if (client.player) {
            this.gameService.removePlayerFromLobby(client);
        }
    }
    handleJoinLobby(client) {
        if (client.player) {
            this.gameService.addPlayerToLobby(client, client.player);
        }
    }
    async handleMakeGuess(data, client) {
        try {
            if (!client.player) {
                client.emit('error', 'Not authenticated');
                return;
            }
            this.logger.log(`Processing guess "${data.guess}" from player ${client.player.username}`);
            const result = await this.guessService.submitGuess(client.player, data.matchId, data.guess);
            const matchRoom = `match_${data.matchId}`;
            if (result.isCorrect) {
                this.server.to(matchRoom).emit('roundEnd', {
                    winner: client.player.username,
                    secretWord: result.secretWord
                });
            }
            client.emit('guessResult', {
                correct: result.isCorrect,
                message: result.isCorrect ? 'Correct guess!' : 'Incorrect guess'
            });
        }
        catch (error) {
            this.logger.error(`Error handling guess: ${error.message}`);
            client.emit('error', 'Failed to process guess');
        }
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
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*',
            credentials: true,
        } }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_service_1.GameService))),
    __metadata("design:paramtypes", [game_service_1.GameService,
        guess_service_1.GuessService,
        jwt_1.JwtService,
        player_service_1.PlayerService,
        config_1.ConfigService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map