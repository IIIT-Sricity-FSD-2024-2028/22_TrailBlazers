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
exports.UpdateNotificationDto = exports.CreateNotificationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateNotificationDto {
    title;
    desc;
    priority;
    reporter;
    eventId;
}
exports.CreateNotificationDto = CreateNotificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Scanner Error', description: 'Notification title' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'QR scanner at Gate 2 is offline', description: 'Notification description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "desc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'high', enum: ['low', 'medium', 'high', 'critical'], description: 'Priority level' }),
    (0, class_validator_1.IsIn)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Alex Thompson', description: 'Person reporting the issue' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "reporter", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'e1', description: 'Associated event ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "eventId", void 0);
class UpdateNotificationDto {
    isRead;
    status;
}
exports.UpdateNotificationDto = UpdateNotificationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, description: 'Mark as read' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationDto.prototype, "isRead", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'resolved', enum: ['open', 'resolved'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['open', 'resolved']),
    __metadata("design:type", String)
], UpdateNotificationDto.prototype, "status", void 0);
//# sourceMappingURL=notification.dto.js.map