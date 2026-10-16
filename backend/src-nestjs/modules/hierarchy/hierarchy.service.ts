import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { HierarchyRepository } from '../../repositories/hierarchy.repository';
import { CreateIssueDto } from './dto/create-issue.dto';
import { AssignIssueDto } from './dto/assign-issue.dto';
import { EscalateIssueDto } from './dto/escalate-issue.dto';
import { ResolveIssueDto } from './dto/resolve-issue.dto';
import { EventAttendeeQueryDto } from './dto/event-attendee-query.dto';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import {
  getEventManagerMaxAssignedEvents,
  getEventManagerWorkloadThreshold,
  getEventManagerMaxCapacity,
} from '../../common/constants/event-manager-capacity.constant';

@Injectable()
export class HierarchyService {
  private static readonly assignmentLocks: Set<string> = new Set();

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
    const staff = this.hierarchyRepo.getDetailedStaffActivity();

    const revenueEvents = this.hierarchyRepo.getRevenueEvents();
    const totalQuotationRevenue = revenueEvents.reduce((acc, evt) => acc + (Number(evt.quotationValue) || 0), 0);
    const totalTicketSalesRevenue = revenueEvents.reduce((acc, evt) => acc + (Number(evt.ticketSalesRevenue) || 0), 0);
    const totalCombinedRevenue = totalQuotationRevenue + totalTicketSalesRevenue;
    const totalTicketsSold = revenueEvents.reduce((acc, evt) => acc + (Number(evt.ticketsSold) || 0), 0);
    const totalCapacity = revenueEvents.reduce((acc, evt) => acc + (Number(evt.totalCapacity || evt.expectedAttendance) || 0), 0);
    const overallSoldPercentage = totalCapacity > 0 ? Math.round((totalTicketsSold / totalCapacity) * 100) : 0;

    const revenue = {
      totalQuotationRevenue,
      totalTicketSalesRevenue,
      totalCombinedRevenue,
      totalTicketsSold,
      totalCapacity,
      overallSoldPercentage,
      events: revenueEvents,
    };

    return { superAdmin, departments, stats, staff, revenue };
  }

  getStaffActivity(filters: { search?: string; department?: string; role?: string }) {
    const staff = this.hierarchyRepo.getDetailedStaffActivity(
      filters.search,
      filters.department,
      filters.role,
    );
    return { staff };
  }

  getRevenueEvents() {
    const events = this.hierarchyRepo.getRevenueEvents();
    return { events };
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
      if (role === 'ONSITE_COORDINATOR') targetDept = 'EVENT_MANAGEMENT';
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

    if (issue.status === 'RESOLVED') {
      throw new BadRequestException('Resolved issues cannot be assigned or reassigned.');
    }

    if (issue.status === 'ESCALATED_TO_ADMIN') {
      throw new BadRequestException(
        'Issues escalated to Super Admin cannot be reassigned at department level.',
      );
    }

    const userRole = (user.role || '').toUpperCase();
    const userDept = user.department || '';

    const targetAssigneeId = dto.assignedUserId || user.id;

    // Authorization checks:
    if (userRole === 'DEPARTMENT_MANAGER') {
      const issueDept =
        issue.department ||
        (issue.issueType === 'TECHNICAL' ? 'IT_SUPPORT' : 'EVENT_MANAGEMENT');
      if (userDept !== issueDept && issueDept !== 'IT_SUPPORT') {
        throw new ForbiddenException(
          'Access denied. You can only assign issues within your department.',
        );
      }
    } else if (userRole === 'IT_SUPPORT') {
      // IT Support staff can self-assign (take ticket)
      if (targetAssigneeId !== user.id) {
        throw new ForbiddenException(
          'IT Support staff can only take tickets for themselves.',
        );
      }
    } else if (userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Access denied. Department Manager authorization required.',
      );
    }

    const assignee = this.hierarchyRepo.getUserById(targetAssigneeId);
    if (!assignee) {
      throw new NotFoundException('Selected staff member not found.');
    }

    // Role / department check for assignee
    const issueDept =
      issue.department ||
      (issue.issueType === 'TECHNICAL' ? 'IT_SUPPORT' : 'EVENT_MANAGEMENT');
    if (issueDept === 'IT_SUPPORT') {
      if (assignee.department !== 'IT_SUPPORT' && assignee.role !== 'IT_SUPPORT') {
        throw new BadRequestException(
          'Selected staff member does not belong to the IT Support department.',
        );
      }
    }

    // Exclude Department Manager from regular staff assignment
    if (assignee.role === 'DEPARTMENT_MANAGER') {
      throw new BadRequestException(
        'Issues must be assigned to staff members, not the Department Manager.',
      );
    }

    // Availability validation on backend
    const memberWithActivity = this.hierarchyRepo.enrichMemberActivity(assignee);
    if (!memberWithActivity.isAvailable) {
      throw new BadRequestException(
        `Staff member ${assignee.name} is currently unavailable (${memberWithActivity.availabilityReason || 'Busy'}).`,
      );
    }

    const wasAlreadyAssigned = issue.assignedUserId === targetAssigneeId;

    this.hierarchyRepo.assignIssue(id, targetAssigneeId, assignee.name);

    if (!wasAlreadyAssigned) {
      try {
        this.notificationHelper.createNotification({
          recipientUserId: targetAssigneeId,
          type: 'OPERATIONAL_ISSUE',
          title: 'New Issue Assigned',
          message: `New issue assigned to you: ${issue.category} - "${issue.description.substring(0, 50)}"`,
          entityType: 'ISSUE',
          entityId: id,
        });
      } catch (e) {}
    }

    const updatedIssue = this.hierarchyRepo.findIssueById(id);

    return {
      success: true,
      message: `Issue successfully assigned to ${assignee.name}.`,
      status: 'IN_PROGRESS',
      issue: updatedIssue,
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

  getAwaitingAssignmentEvents(user: any) {
    const role = (user.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN' && !(role === 'DEPARTMENT_MANAGER' && user.department === 'EVENT_MANAGEMENT')) {
      throw new ForbiddenException('Access denied. Event Management Head authorization required.');
    }
    const events = this.hierarchyRepo.getAwaitingAssignmentEvents();
    return { events };
  }

  getAssignedEvents(user: any) {
    const role = (user.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN' && !(role === 'DEPARTMENT_MANAGER' && user.department === 'EVENT_MANAGEMENT')) {
      throw new ForbiddenException('Access denied. Event Management Head authorization required.');
    }
    const events = this.hierarchyRepo.getAssignedEvents();
    return { events };
  }

  getStaffAvailability(user: any, eventDate?: string, startTime?: string, endTime?: string) {
    const role = (user.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN' && !(role === 'DEPARTMENT_MANAGER' && user.department === 'EVENT_MANAGEMENT')) {
      throw new ForbiddenException('Access denied. Event Management Head authorization required.');
    }
    const staff = this.hierarchyRepo.findStaffWithAvailability(eventDate, startTime, endTime);
    return { staff };
  }

  assignStaff(id: string, dto: { eventManagerUserId?: string; onsiteCoordinatorUserId?: string }, user: any) {
    const role = (user.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN' && !(role === 'DEPARTMENT_MANAGER' && user.department === 'EVENT_MANAGEMENT')) {
      throw new ForbiddenException('Access denied. Event Management Head authorization required.');
    }

    const existingReq = this.hierarchyRepo.findEventRequestById(id);
    if (!existingReq) {
      throw new NotFoundException('Event Request not found.');
    }

    // Concurrency protection safeguard
    const lockKey = dto.eventManagerUserId || dto.onsiteCoordinatorUserId;
    if (lockKey && HierarchyService.assignmentLocks.has(lockKey)) {
      throw new ConflictException(
        'A staff assignment operation is currently in progress for this staff member. Please retry momentarily.',
      );
    }
    if (lockKey) {
      HierarchyService.assignmentLocks.add(lockKey);
    }

    let eventReq: any;
    try {
      // Authoritative Event Manager Capacity & Conflict Validation
      if (dto.eventManagerUserId) {
        const managerUser = this.hierarchyRepo.getUserById(dto.eventManagerUserId);
        if (!managerUser || managerUser.role !== 'EVENT_MANAGER') {
          throw new BadRequestException('Selected user is not a valid Event Manager.');
        }

        // Check capacity only if assigning a new manager or reassigning from another manager
        const isSameManager = existingReq.eventManagerUserId === dto.eventManagerUserId;
        if (!isSameManager) {
          const maxCapacity = getEventManagerMaxAssignedEvents(); // Hard Limit: 7
          const workloadThreshold = getEventManagerWorkloadThreshold(); // Workload Threshold: 15
          const currentActiveCount = this.hierarchyRepo.getManagerActiveAssignmentsCount(dto.eventManagerUserId, id);

          // Rule B (Maximum Capacity): Hard maximum of 7 assigned active events
          if (currentActiveCount >= maxCapacity) {
            throw new BadRequestException(
              `Event Manager ${managerUser.name} has reached maximum event capacity (${currentActiveCount}/${maxCapacity} active events). Cannot assign additional events.`,
            );
          }

          // Rule A (Workload Threshold): Workload threshold of 15
          const currentWorkload = this.hierarchyRepo.getManagerWorkload(dto.eventManagerUserId, id);
          if (currentWorkload.totalWorkload >= workloadThreshold) {
            throw new BadRequestException(
              `Event Manager ${managerUser.name} has reached the workload threshold (${currentWorkload.totalWorkload}/${workloadThreshold} workload points). Cannot assign additional work.`,
            );
          }

          // Validate date/time conflict
          if (existingReq.eventDate) {
            const conflict = this.hierarchyRepo.checkScheduleConflict(
              dto.eventManagerUserId,
              existingReq.eventDate,
              existingReq.startTime,
              existingReq.endTime,
              id,
            );
            if (conflict) {
              throw new BadRequestException(
                `Event Manager ${managerUser.name} is already assigned to "${conflict.eventName}" on ${existingReq.eventDate}.`,
              );
            }
          }
        }
      }

      // Authoritative Onsite Coordinator Validation
      if (dto.onsiteCoordinatorUserId) {
        const coordUser = this.hierarchyRepo.getUserById(dto.onsiteCoordinatorUserId);
        if (!coordUser || coordUser.role !== 'ONSITE_COORDINATOR') {
          throw new BadRequestException('Selected user is not a valid Onsite Coordinator.');
        }

        const isSameCoord = existingReq.onsiteCoordinatorUserId === dto.onsiteCoordinatorUserId;
        if (!isSameCoord && existingReq.eventDate) {
          const conflict = this.hierarchyRepo.checkScheduleConflict(
            dto.onsiteCoordinatorUserId,
            existingReq.eventDate,
            existingReq.startTime,
            existingReq.endTime,
            id,
          );
          if (conflict) {
            throw new BadRequestException(
              `Onsite Coordinator ${coordUser.name} is already assigned to "${conflict.eventName}" on ${existingReq.eventDate}.`,
            );
          }
        }
      }

      eventReq = this.hierarchyRepo.assignStaff(id, dto.eventManagerUserId, dto.onsiteCoordinatorUserId);
      if (!eventReq) {
        throw new NotFoundException('Event Request not found.');
      }
    } finally {
      if (lockKey) {
        HierarchyService.assignmentLocks.delete(lockKey);
      }
    }

    try {
      if (dto.eventManagerUserId) {
        this.notificationHelper.createNotification({
          recipientUserId: dto.eventManagerUserId,
          type: 'EVENT_MANAGER_ASSIGNED',
          title: 'New Event Assignment',
          message: `You have been assigned as Event Manager for "${eventReq.eventName}".`,
          entityType: 'EVENT_REQUEST',
          entityId: id,
        });
      }
      if (dto.onsiteCoordinatorUserId) {
        this.notificationHelper.createNotification({
          recipientUserId: dto.onsiteCoordinatorUserId,
          type: 'ONSITE_COORDINATOR_ASSIGNED',
          title: 'New Onsite Assignment',
          message: `You have been assigned as Onsite Coordinator for "${eventReq.eventName}".`,
          entityType: 'EVENT_REQUEST',
          entityId: id,
        });
      }
    } catch (notifErr) {
      // Ignore notification failures
    }

    return {
      success: true,
      message: 'Staff assigned/reassigned successfully.',
      eventRequest: eventReq,
    };
  }

  async getEventAttendees(
    eventId: string,
    query: EventAttendeeQueryDto,
    user: any,
  ) {
    const userRole = (user?.role || '').toUpperCase();
    if (userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        `Access denied. Super Admin role authorization required. Provided role: '${user?.role || 'NONE'}'.`,
      );
    }

    if (!eventId || !eventId.trim()) {
      throw new BadRequestException('A valid eventId parameter is required.');
    }

    const data = this.hierarchyRepo.getEventAttendees(eventId, query);
    if (!data) {
      throw new NotFoundException(`Event with ID '${eventId}' was not found.`);
    }

    return data;
  }
}
