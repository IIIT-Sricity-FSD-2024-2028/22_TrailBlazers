import {
  Controller,
  Get,
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
import { HierarchyService } from './hierarchy.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { AssignIssueDto } from './dto/assign-issue.dto';
import { EscalateIssueDto } from './dto/escalate-issue.dto';
import { ResolveIssueDto } from './dto/resolve-issue.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Hierarchy & Operational Issues')
@Controller('hierarchy')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (SUPER_ADMIN, EVENT_MANAGER, ONSITE_COORDINATOR, etc.)' })
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get Operational Hierarchy Overview', description: 'Retrieve high-level organizational issue summary metrics' })
  @ApiResponse({ status: 200, description: 'Hierarchy overview returned' })
  async getOverview(@Req() req: any) {
    return this.hierarchyService.getOverview(req.user);
  }

  @Get('team')
  @ApiOperation({ summary: 'Get Team Hierarchy Structure', description: 'Retrieve team organizational structure and assigned staff' })
  @ApiResponse({ status: 200, description: 'Team hierarchy returned' })
  async getTeam(@Req() req: any) {
    return this.hierarchyService.getTeam(req.user);
  }

  @Get('issues')
  @ApiOperation({ summary: 'Get Escalated Issues List', description: 'Retrieve active operational and technical issues scoped to user role' })
  @ApiResponse({ status: 200, description: 'Issues list returned' })
  async getIssues(@Req() req: any) {
    return this.hierarchyService.getIssues(req.user);
  }

  @Post('issues/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Operational Issue', description: 'Report a new organizational or technical issue' })
  @ApiResponse({ status: 201, description: 'Issue created successfully' })
  async createIssue(@Body() dto: CreateIssueDto, @Req() req: any) {
    return this.hierarchyService.createIssue(dto, req.user);
  }

  @Post('issues/:id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign Issue', description: 'Assign an operational issue to a staff member' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue assigned' })
  async assignIssue(
    @Param('id') id: string,
    @Body() dto: AssignIssueDto,
    @Req() req: any,
  ) {
    return this.hierarchyService.assignIssue(id, dto, req.user);
  }

  @Post('issues/:id/escalate-to-manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Escalate Issue to Event Manager', description: 'Escalate issue to Event Manager level' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue escalated to Event Manager' })
  async escalateToManager(
    @Param('id') id: string,
    @Body() dto: EscalateIssueDto,
    @Req() req: any,
  ) {
    return this.hierarchyService.escalateToManager(id, dto, req.user);
  }

  @Post('issues/:id/escalate-to-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Escalate Issue to Super Admin', description: 'Escalate issue to Super Admin level' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue escalated to Super Admin' })
  async escalateToAdmin(
    @Param('id') id: string,
    @Body() dto: EscalateIssueDto,
    @Req() req: any,
  ) {
    return this.hierarchyService.escalateToAdmin(id, dto, req.user);
  }

  @Post('issues/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve Operational Issue', description: 'Mark an issue as resolved' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue resolved' })
  async resolveIssue(
    @Param('id') id: string,
    @Body() dto: ResolveIssueDto,
    @Req() req: any,
  ) {
    return this.hierarchyService.resolveIssue(id, dto, req.user);
  }
}
