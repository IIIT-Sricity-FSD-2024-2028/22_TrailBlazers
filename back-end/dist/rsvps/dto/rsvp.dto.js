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
exports.UpdateRsvpDto = exports.CreateRsvpDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateRsvpDto {
    eventId;
    name;
    email;
    phone;
}
exports.CreateRsvpDto = CreateRsvpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'e1', description: 'Event ID to RSVP for' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRsvpDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rahul Sharma', description: 'Attendee full name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRsvpDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'rahul.sharma@gmail.com', description: 'Attendee email' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateRsvpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9876543210', description: 'Phone number — must be exactly 10 digits' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits' }),
    __metadata("design:type", String)
], CreateRsvpDto.prototype, "phone", void 0);
class UpdateRsvpDto {
    status;
    name;
    email;
}
exports.UpdateRsvpDto = UpdateRsvpDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'confirmed', enum: ['pending', 'confirmed', 'cancelled', 'attended'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['pending', 'confirmed', 'cancelled', 'attended']),
    __metadata("design:type", String)
], UpdateRsvpDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Rahul Sharma' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRsvpDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'new.email@gmail.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateRsvpDto.prototype, "email", void 0);
//# sourceMappingURL=rsvp.dto.js.map