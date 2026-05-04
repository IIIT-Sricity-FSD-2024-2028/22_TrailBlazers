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
exports.UpdatePollDto = exports.VotePollDto = exports.CreatePollDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreatePollDto {
    eventId;
    question;
    options;
    createdBy;
}
exports.CreatePollDto = CreatePollDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'e1', description: 'Event ID this poll belongs to' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePollDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Which session did you enjoy most?', description: 'The poll question' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePollDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['Keynote', 'Workshop A', 'Workshop B'], description: 'List of answer options (min 2)' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePollDto.prototype, "options", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'c1', description: 'Client ID who created the poll' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePollDto.prototype, "createdBy", void 0);
class VotePollDto {
    option;
    voterEmail;
}
exports.VotePollDto = VotePollDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Workshop A', description: 'The option the attendee is voting for' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VotePollDto.prototype, "option", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'rahul.s@gmail.com', description: 'Voter email (attendee)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VotePollDto.prototype, "voterEmail", void 0);
class UpdatePollDto {
    question;
    options;
    status;
}
exports.UpdatePollDto = UpdatePollDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated question text?', description: 'Update the poll question' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdatePollDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Option A', 'Option B', 'Option C'], description: 'Update poll options' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdatePollDto.prototype, "options", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'open', enum: ['open', 'closed'], description: 'Poll status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['open', 'closed']),
    __metadata("design:type", String)
], UpdatePollDto.prototype, "status", void 0);
//# sourceMappingURL=poll.dto.js.map