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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const polls_service_1 = require("./polls.service");
const poll_dto_1 = require("./dto/poll.dto");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let PollsController = class PollsController {
    pollsService;
    constructor(pollsService) {
        this.pollsService = pollsService;
    }
    findAll(eventId, status) {
        return this.pollsService.findAll(eventId, status);
    }
    findOne(id) {
        return this.pollsService.findOne(id);
    }
    getResults(id) {
        return this.pollsService.getResults(id);
    }
    create(dto) {
        return this.pollsService.create(dto);
    }
    vote(id, dto) {
        return this.pollsService.vote(id, dto);
    }
    update(id, dto) {
        return this.pollsService.update(id, dto);
    }
    close(id) {
        return this.pollsService.close(id);
    }
    remove(id) {
        return this.pollsService.remove(id);
    }
};
exports.PollsController = PollsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.OSC, role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get all polls', description: 'Returns polls, optionally filtered by event or status. Accessible by client, eventmanager, osc, attendee, and superuser.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc | attendee', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'eventId', required: false, description: 'Filter by event ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['open', 'closed'], description: 'Filter by poll status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Polls list returned' }),
    __param(0, (0, common_1.Query)('eventId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PollsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.OSC, role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get poll by ID' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc | attendee', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Poll ID (e.g. poll1)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Poll details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Poll not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PollsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/results'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.OSC, role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get poll results with vote percentages', description: 'Returns vote counts and percentage breakdown per option.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc | attendee', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Poll ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Poll results with percentages' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Poll not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PollsController.prototype, "getResults", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new poll', description: 'Client or eventmanager creates a poll for an event. Requires at least 2 options.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | client | eventmanager', required: true, example: 'client' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Poll created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [poll_dto_1.CreatePollDto]),
    __metadata("design:returntype", void 0)
], PollsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/vote'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: 'Vote on a poll', description: 'Attendee votes on an open poll. Each attendee (by email) can vote only once per poll.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: attendee', required: true, example: 'attendee' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Poll ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Vote registered successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Poll is closed or invalid option' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already voted' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, poll_dto_1.VotePollDto]),
    __metadata("design:returntype", void 0)
], PollsController.prototype, "vote", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update poll (question, options, or status)', description: 'Client or eventmanager can update a poll. Updating options resets vote counts.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | client | eventmanager', required: true, example: 'client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Poll ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Poll updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Poll not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, poll_dto_1.UpdatePollDto]),
    __metadata("design:returntype", void 0)
], PollsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Close a poll (stop accepting votes)', description: 'Client or eventmanager closes the poll.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | client | eventmanager', required: true, example: 'client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Poll ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Poll closed' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Poll not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PollsController.prototype, "close", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a poll', description: 'Client or eventmanager permanently removes a poll.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | client | eventmanager', required: true, example: 'client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Poll ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Poll deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Poll not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PollsController.prototype, "remove", null);
exports.PollsController = PollsController = __decorate([
    (0, swagger_1.ApiTags)('Polls'),
    (0, swagger_1.ApiSecurity)('role-header'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('polls'),
    __metadata("design:paramtypes", [polls_service_1.PollsService])
], PollsController);
//# sourceMappingURL=polls.controller.js.map