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
exports.ReviewPendingRequestDto = exports.CreatePendingRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreatePendingRequestDto {
    name;
    location;
    expected;
    client;
    clientEmail;
    date;
    description;
    type;
}
exports.CreatePendingRequestDto = CreatePendingRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Tech Innovation Summit 2026', description: 'Proposed event name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePendingRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pune, Maharashtra', description: 'Proposed event location' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePendingRequestDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 500, description: 'Expected number of attendees' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePendingRequestDto.prototype, "expected", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Priya Sharma', description: 'Client / requester name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePendingRequestDto.prototype, "client", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'priya.s@techcorp.com', description: 'Client email' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreatePendingRequestDto.prototype, "clientEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-05-15', description: 'Desired event date (YYYY-MM-DD)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePendingRequestDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Annual technology conference featuring AI and blockchain workshops', description: 'Event description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePendingRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'In-Person', enum: ['In-Person', 'Virtual', 'Hybrid'], description: 'Event type' }),
    (0, class_validator_1.IsIn)(['In-Person', 'Virtual', 'Hybrid']),
    __metadata("design:type", String)
], CreatePendingRequestDto.prototype, "type", void 0);
class ReviewPendingRequestDto {
    decision;
    managerId;
    managerName;
    rejectionReason;
}
exports.ReviewPendingRequestDto = ReviewPendingRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'approved', enum: ['approved', 'rejected'], description: 'Approval decision' }),
    (0, class_validator_1.IsIn)(['approved', 'rejected']),
    __metadata("design:type", String)
], ReviewPendingRequestDto.prototype, "decision", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'u1', description: 'Manager ID to assign (required when approving)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewPendingRequestDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Rajesh Kumar', description: 'Manager name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewPendingRequestDto.prototype, "managerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Budget constraints', description: 'Reason for rejection' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewPendingRequestDto.prototype, "rejectionReason", void 0);
//# sourceMappingURL=pending-request.dto.js.map