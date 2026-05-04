import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiSecurity,
} from '@nestjs/swagger';
import { QnaService } from './qna.service';
import { CreateQuestionDto, AnswerQuestionDto } from './dto/qna.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Q&A')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('qna')
export class QnaController {
  constructor(private readonly qnaService: QnaService) {}

  // ─── GET ALL Q&A ─────────────────────────────────────────────────────────────
  @Get()
  @Roles(Role.CLIENT, Role.EVENTMANAGER, Role.ATTENDEE)
  @ApiOperation({ summary: 'Get all Q&A items', description: 'Returns all questions, optionally filtered by eventId or status. Accessible by client, eventmanager, attendee, and superuser.' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | attendee', required: true })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter by event ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['unanswered', 'answered'], description: 'Filter by answer status' })
  @ApiResponse({ status: 200, description: 'Q&A list returned' })
  findAll(@Query('eventId') eventId?: string, @Query('status') status?: string) {
    return this.qnaService.findAll(eventId, status);
  }

  // ─── GET MY QUESTIONS (ATTENDEE) ─────────────────────────────────────────────
  @Get('my')
  @Roles(Role.ATTENDEE)
  @ApiOperation({ summary: "Get my questions", description: 'Attendee fetches all questions they have asked across events.' })
  @ApiHeader({ name: 'role', description: 'Must be: attendee', required: true, example: 'attendee' })
  @ApiQuery({ name: 'email', required: true, description: 'Attendee email' })
  @ApiResponse({ status: 200, description: 'Questions asked by this attendee' })
  findMyQuestions(@Query('email') email: string) {
    return this.qnaService.findByAttendee(email);
  }

  // ─── GET Q&A STATS FOR EVENT ─────────────────────────────────────────────────
  @Get('stats/:eventId')
  @Roles(Role.CLIENT, Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Get Q&A statistics for an event', description: 'Returns total, answered, and unanswered counts.' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client', required: true })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Q&A stats' })
  getStats(@Param('eventId') eventId: string) {
    return this.qnaService.getStats(eventId);
  }

  // ─── GET ONE Q&A ITEM ────────────────────────────────────────────────────────
  @Get(':id')
  @Roles(Role.CLIENT, Role.EVENTMANAGER, Role.ATTENDEE)
  @ApiOperation({ summary: 'Get Q&A item by ID' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | attendee', required: true })
  @ApiParam({ name: 'id', description: 'Q&A item ID (e.g. qna1)' })
  @ApiResponse({ status: 200, description: 'Q&A item details' })
  @ApiResponse({ status: 404, description: 'Q&A item not found' })
  findOne(@Param('id') id: string) {
    return this.qnaService.findOne(id);
  }

  // ─── ASK A QUESTION (ATTENDEE) ───────────────────────────────────────────────
  @Post()
  @Roles(Role.ATTENDEE)
  @ApiOperation({ summary: 'Ask a question about an event', description: 'Attendee submits a question for the client/eventmanager to answer.' })
  @ApiHeader({ name: 'role', description: 'Must be: attendee', required: true, example: 'attendee' })
  @ApiResponse({ status: 201, description: 'Question submitted successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateQuestionDto) {
    return this.qnaService.create(dto);
  }

  // ─── ANSWER A QUESTION (CLIENT / EVENTMANAGER) ───────────────────────────────
  @Patch(':id/answer')
  @Roles(Role.CLIENT, Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Answer an attendee question', description: 'Client or eventmanager provides an answer to an attendee question.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | client | eventmanager', required: true, example: 'client' })
  @ApiParam({ name: 'id', description: 'Q&A item ID' })
  @ApiResponse({ status: 200, description: 'Question answered successfully' })
  @ApiResponse({ status: 404, description: 'Q&A item not found' })
  answer(@Param('id') id: string, @Body() dto: AnswerQuestionDto) {
    return this.qnaService.answer(id, dto);
  }


  // ─── DELETE QUESTION ─────────────────────────────────────────────────────────
  @Delete(':id')
  @Roles(Role.CLIENT, Role.ATTENDEE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a Q&A item', description: 'Attendee can delete their own question. Client and superuser can delete any question.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | attendee | client', required: true, example: 'attendee' })
  @ApiParam({ name: 'id', description: 'Q&A item ID' })
  @ApiResponse({ status: 200, description: 'Q&A item deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only superuser, attendee, or client can delete questions' })
  @ApiResponse({ status: 404, description: 'Q&A item not found' })
  remove(@Param('id') id: string) {
    return this.qnaService.remove(id);
  }
}
