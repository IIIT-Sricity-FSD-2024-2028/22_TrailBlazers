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
exports.QnaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const qna_service_1 = require("./qna.service");
const qna_dto_1 = require("./dto/qna.dto");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let QnaController = class QnaController {
    qnaService;
    constructor(qnaService) {
        this.qnaService = qnaService;
    }
    findAll(eventId, status) {
        return this.qnaService.findAll(eventId, status);
    }
    findMyQuestions(email) {
        return this.qnaService.findByAttendee(email);
    }
    getStats(eventId) {
        return this.qnaService.getStats(eventId);
    }
    findOne(id) {
        return this.qnaService.findOne(id);
    }
    create(dto) {
        return this.qnaService.create(dto);
    }
    answer(id, dto) {
        return this.qnaService.answer(id, dto);
    }
    update(id, dto) {
        return this.qnaService.update(id, dto);
    }
    remove(id) {
        return this.qnaService.remove(id);
    }
};
exports.QnaController = QnaController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.OSC, role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get all Q&A items', description: 'Returns all questions, optionally filtered by eventId or status. Accessible by client, eventmanager, osc, attendee, and superuser.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc | attendee', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'eventId', required: false, description: 'Filter by event ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['unanswered', 'answered'], description: 'Filter by answer status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Q&A list returned' }),
    __param(0, (0, common_1.Query)('eventId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QnaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: "Get my questions", description: 'Attendee fetches all questions they have asked across events.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: attendee', required: true, example: 'attendee' }),
    (0, swagger_1.ApiQuery)({ name: 'email', required: true, description: 'Attendee email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Questions asked by this attendee' }),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QnaController.prototype, "findMyQuestions", null);
__decorate([
    (0, common_1.Get)('stats/:eventId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Get Q&A statistics for an event', description: 'Returns total, answered, and unanswered counts.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true }),
    (0, swagger_1.ApiParam)({ name: 'eventId', description: 'Event ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Q&A stats' }),
    __param(0, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QnaController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.OSC, role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get Q&A item by ID' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc | attendee', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Q&A item ID (e.g. qna1)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Q&A item details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Q&A item not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QnaController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: 'Ask a question about an event', description: 'Attendee submits a question for the client/eventmanager to answer.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: attendee', required: true, example: 'attendee' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Question submitted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [qna_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", void 0)
], QnaController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/answer'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Answer an attendee question', description: 'Client or eventmanager provides an answer to an attendee question.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | client | eventmanager', required: true, example: 'client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Q&A item ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Question answered successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Q&A item not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, qna_dto_1.AnswerQuestionDto]),
    __metadata("design:returntype", void 0)
], QnaController.prototype, "answer", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ATTENDEE, role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update a question', description: 'Attendee can edit their own question text; client/eventmanager can also update.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | attendee | client | eventmanager', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Q&A item ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Q&A item updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, qna_dto_1.UpdateQuestionDto]),
    __metadata("design:returntype", void 0)
], QnaController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a Q&A item', description: 'Client or eventmanager permanently removes a Q&A entry.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | client | eventmanager', required: true, example: 'client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Q&A item ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Q&A item deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QnaController.prototype, "remove", null);
exports.QnaController = QnaController = __decorate([
    (0, swagger_1.ApiTags)('Q&A'),
    (0, swagger_1.ApiSecurity)('role-header'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('qna'),
    __metadata("design:paramtypes", [qna_service_1.QnaService])
], QnaController);
//# sourceMappingURL=qna.controller.js.map