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
exports.UpdateQuestionDto = exports.AnswerQuestionDto = exports.CreateQuestionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateQuestionDto {
    eventId;
    question;
    askedBy;
}
exports.CreateQuestionDto = CreateQuestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'e1', description: 'Event ID the question belongs to' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'What is the dress code for the event?', description: 'The question asked by the attendee' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'rahul.s@gmail.com', description: 'Email of the attendee asking the question' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "askedBy", void 0);
class AnswerQuestionDto {
    answer;
    answeredBy;
}
exports.AnswerQuestionDto = AnswerQuestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Smart casual attire is recommended.', description: 'The answer provided by the client or eventmanager' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AnswerQuestionDto.prototype, "answer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'u4', description: 'ID of the user providing the answer' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnswerQuestionDto.prototype, "answeredBy", void 0);
class UpdateQuestionDto {
    question;
}
exports.UpdateQuestionDto = UpdateQuestionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Is parking available at the venue?', description: 'Updated question text' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "question", void 0);
//# sourceMappingURL=qna.dto.js.map