import {
  Controller,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { QaService } from './qa.service';
import { SubmitQuestionDto } from './dto/submit-question.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Q&A')
@Controller('events')
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Post(':id/questions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-role', required: false, description: 'User role (ATTENDEE / CLIENT)' })
  @ApiOperation({ summary: 'Submit Q&A Question', description: 'Submit attendee question for moderation and display' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Question submitted and pending moderation' })
  @ApiResponse({ status: 403, description: 'Access denied. Must be registered for event' })
  async submitQuestion(
    @Param('id') id: string,
    @Body() dto: SubmitQuestionDto,
    @Req() req: any,
  ) {
    return this.qaService.submitQuestion(id, dto, req.user);
  }

  @Post('questions/:id/upvote')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-role', required: false, description: 'User role' })
  @ApiOperation({ summary: 'Upvote Q&A Question', description: 'Increment question upvote count with duplicate protection' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question upvoted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async upvoteQuestion(@Param('id') id: string, @Req() req: any) {
    return this.qaService.upvoteQuestion(id, req.user);
  }
}
