import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { HierarchyRepository } from '../../repositories/hierarchy.repository';
import { CreateIssueDto } from './dto/create-issue.dto';
import { AssignIssueDto } from './dto/assign-issue.dto';
import { EscalateIssueDto } from './dto/escalate-issue.dto';
import { ResolveIssueDto } from './dto/resolve-issue.dto';
import { NotificationHelperService } from '../notifications/notification-helper.service';

@Injectable()
export class HierarchyService {
  constructor(
    private readonly hierarchyRepo: HierarchyRepository,
    private readonly notificationHelper: NotificationHelperService,
  ) {}

  getOverview(user: any) {
    const userRole = (user.role || '').toUpperCase();
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'DEPARTMENT_MANAGER') {
      throw new ForbiddenException(
        'Access denied. Organization hierarchy authorization required.',
      );
    }

    const allUsers = this.hierarchyRepo.getAllUsers();

    const departments = {
      EVENT_MANAGEMENT: {
        id: 'EVENT_MANAGEMENT',
        name: 'Event Management',
        manager:
          allUsers.find(
            (u) =>
              u.role === 'DEPARTMENT_MANAGER' &&
              u.department === 'EVENT_MANAGEMENT',
          ) || null,
        members: allUsers
          .filter(
            (u) =>
              u.department === 'EVENT_MANAGEMENT' &&
              u.role !== 'DEPARTMENT_MANAGER' &&
              u.role !== 'SUPER_ADMIN',
          )
          .map((m) => this.hierarchyRepo.enrichMemberActivity(m)),
      },
      ONSITE_COORDINATION: {
        id: 'ONSITE_COORDINATION',
        name: 'Onsite Coordination',
        manager:
          allUsers.find(
            (u) =>
              u.role === 'DEPARTMENT_MANAGER' &&
              u.department === 'ONSITE_COORDINATION',
          ) || null,
        members: allUsers
          .filter(
            (u) =>
              u.department === 'ONSITE_COORDINATION' &&
              u.role !== 'DEPARTMENT_MANAGER' &&
              u.role !== 'SUPER_ADMIN',
          )
          .map((m) => this.hierarchyRepo.enrichMemberActivity(m)),
      },
      REVENUE: {
        id: 'REVENUE',
        name: 'Revenue Operations',
        manager:
          allUsers.find(
            (u) =>
              u.role === 'DEPARTMENT_MANAGER' && u.department === 'REVENUE',
          ) || null,
        members: allUsers
          .filter(
            (u) =>
              u.department === 'REVENUE' &&
              u.role !== 'DEPARTMENT_MANAGER' &&
              u.role !== 'SUPER_ADMIN',
          )
          .map((m) => this.hierarchyRepo.enrichMemberActivity(m)),
      },
      IT_SUPPORT: {
        id: 'IT_SUPPORT',
        name: 'IT Support',
        manager:
          allUsers.find(
            (u) =>
              u.role === 'DEPARTMENT_MANAGER' && u.department === 'IT_SUPPORT',
          ) || null,
        members: allUsers
          .filter(
            (u) =>
              u.department === 'IT_SUPPORT' &&
              u.role !== 'DEPARTMENT_MANAGER' &&
              u.role !== 'SUPER_ADMIN',
          )
          .map((m) => this.hierarchyRepo.enrichMemberActivity(m)),
      },
    };

    const superAdmin =
      allUsers.find((u) => u.role === 'SUPER_ADMIN') || null;

    const stats = this.hierarchyRepo.getIssueStats();

    return { superAdmin, departments, stats };
  }

  getTeam(user: any) {
    const role = (user.role || '').toUpperCase();
    if (role !== 'DEPARTMENT_MANAGER' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Access denied. Department Manager authorization required.',
      );
    }

    const dbUser = this.hierarchyRepo.getUserById(user.id);
    const dept =
      (dbUser && dbUser.department) || user.department || 'EVENT_MANAGEMENT';

    const membersRaw = this.hierarchyRepo.getDepartmentTeamRaw(role, dept);
    const members = membersRaw.map((m) =>
      this.hierarchyRepo.enrichMemberActivity(m),
    );

    const summary = {
      total: members.length,
      active: members.filter(
        (m) => m.status === 'IN_PROGRESS' || m.status === 'ACTIVE',
      ).length,
      available: members.filter((m) => m.status === 'AVAILABLE').length,
      escalated: members.filter((m) => m.status === 'ESCALATED').length,
    };

    return { department: dept, summary, members };
  }

  getIssues(user: any) {
    const role = (user.role || '').toUpperCase();
    const userDept = user.department;
    const issues = this.hierarchyRepo.getIssuesForUser(
      role,
      userDept,
      user.id,
    );
    return { issues };
  }

  createIssue(dto: CreateIssueDto, user: any) {
    if (!dto.description || !dto.description.trim()) {
      throw new BadRequestException('Issue description is required.');
    }

    const targetType = (dto.issueType || 'OPERATIONAL').toUpperCase();
    let targetDept = 'EVENT_MANAGEMENT';

    if (targetType === 'TECHNICAL') {
      targetDept = 'IT_SUPPORT';
    } else {
      const role = (user.role || '').toUpperCase();
      if (role === 'ONSITE_COORDINATOR') targetDept = 'ONSITE_COORDINATION';
      else if (role === 'REVENUE') targetDept = 'REVENUE';
      else if (user.department) targetDept = user.department;
      else targetDept = 'EVENT_MANAGEMENT';
    }

    let targetEventId = dto.eventId;
    if (!targetEventId) {
      targetEventId = this.hierarchyRepo.findFirstEventId();
    }

    const issueId = 'issue_' + crypto.randomBytes(8).toString('hex');
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const createdIssue = this.hierarchyRepo.createIssue({
      id: issueId,
      eventId: targetEventId,
      reporterUserId: user.id,
      reporterName: user.name || 'Staff User',
      category:
        dto.category ||
        (targetType === 'TECHNICAL'
          ? 'Technical System Error'
          : 'Operational Issue'),
      priority: dto.priority || 'Medium',
      description: dto.description.trim(),
      issueType: targetType,
      department: targetDept,
      nowStr,
    });

    try {
      const mgr = this.hierarchyRepo.findDepartmentManager(targetDept);
      if (mgr) {
        this.notificationHelper.createNotification({
          recipientUserId: mgr.id,
          type: 'OPERATIONAL_ISSUE',
          title: `New ${targetType} Issue Reported`,
          message: `A new ${targetType.toLowerCase()} issue was logged for ${targetDept}: "${dto.description.trim().substring(0, 40)}..."`,
          entityType: 'ISSUE',
          entityId: issueId,
        });
      }
    } catch (e) {}

    return {
      message: `${targetType === 'TECHNICAL' ? 'Technical' : 'Operational'} issue logged successfully.`,
      issue: createdIssue,
    };
  }

  assignIssue(id: string, dto: AssignIssueDto, user: any) {
    const issue = this.hierarchyRepo.findIssueById(id);
    if (!issue) {
      throw new NotFoundException('Issue not found.');
    }

    const targetAssigneeId = dto.assignedUserId || user.id;
    const assignee = this.hierarchyRepo.getUserById(targetAssigneeId);

    this.hierarchyRepo.assignIssue(id, targetAssigneeId);

    return {
      message: `Issue assigned to ${assignee?.name || 'staff member'}.`,
      status: 'IN_PROGRESS',
    };
  }

  escalateToManager(id: string, dto: EscalateIssueDto, user: any) {
    const issue = this.hierarchyRepo.findIssueById(id);
    if (!issue) {
      throw new NotFoundException('Issue not found.');
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reasonStr = dto.reason || 'Requires Department Manager assistance.';

    this.hierarchyRepo.escalateToManager(id, reasonStr, nowStr);

    try {
      const deptMgr = this.hierarchyRepo.findDepartmentManager(
        issue.department,
      );
      if (deptMgr) {
        this.notificationHelper.createNotification({
          recipientUserId: deptMgr.id,
          type: 'OPERATIONAL_ISSUE',
          title: 'Issue Escalated to Manager',
          message: `${user.name} escalated an issue in ${issue.department}: "${reasonStr || issue.description.substring(0, 40)}"`,
          entityType: 'ISSUE',
          entityId: id,
        });
      }
    } catch (e) {}

    return {
      message: 'Issue escalated to Department Manager.',
      status: 'ESCALATED_TO_MANAGER',
    };
  }

  escalateToAdmin(id: string, dto: EscalateIssueDto, user: any) {
    const role = (user.role || '').toUpperCase();
    if (role !== 'DEPARTMENT_MANAGER' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only Department Managers can escalate issues to the Super Admin.',
      );
    }

    const issue = this.hierarchyRepo.findIssueById(id);
    if (!issue) {
      throw new NotFoundException('Issue not found.');
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reasonStr =
      dto.reason || 'Unresolved departmental issue escalated to Super Admin.';

    this.hierarchyRepo.escalateToAdmin(id, reasonStr, nowStr);

    try {
      const superAdmin = this.hierarchyRepo.findSuperAdmin();
      if (superAdmin) {
        this.notificationHelper.createNotification({
          recipientUserId: superAdmin.id,
          type: 'OPERATIONAL_ISSUE',
          title: 'CRITICAL: Issue Escalated to Super Admin',
          message: `Department Manager ${user.name} escalated a critical issue in ${issue.department}: "${reasonStr || issue.description.substring(0, 40)}"`,
          entityType: 'ISSUE',
          entityId: id,
        });
      }
    } catch (e) {}

    return {
      message: 'Issue escalated to Super Admin.',
      status: 'ESCALATED_TO_ADMIN',
    };
  }

  resolveIssue(id: string, dto: ResolveIssueDto, user: any) {
    const issue = this.hierarchyRepo.findIssueById(id);
    if (!issue) {
      throw new NotFoundException('Issue not found.');
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const details = dto.resolutionDetails || 'Resolved by staff.';

    this.hierarchyRepo.resolveIssue(id, details, user.id, nowStr);

    try {
      if (issue.reporterUserId) {
        this.notificationHelper.createNotification({
          recipientUserId: issue.reporterUserId,
          type: 'OPERATIONAL_ISSUE',
          title: 'Issue Resolved',
          message: `Your reported issue "${issue.description.substring(0, 30)}..." has been resolved by ${user.name}.`,
          entityType: 'ISSUE',
          entityId: id,
        });
      }
    } catch (e) {}

    return {
      message: 'Issue resolved successfully.',
      status: 'RESOLVED',
    };
  }
}
