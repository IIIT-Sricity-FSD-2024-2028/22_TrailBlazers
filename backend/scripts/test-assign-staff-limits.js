const assert = require('assert');
const { InMemoryStore } = require('../dist-nestjs/repositories/in-memory.store');
const { HierarchyRepository } = require('../dist-nestjs/repositories/hierarchy.repository');
const { HierarchyService } = require('../dist-nestjs/modules/hierarchy/hierarchy.service');

async function testUnitLimits() {
  console.log('=== UNIT TESTING BACKEND ENFORCEMENT OF BOTH LIMITS ===');

  const store = new InMemoryStore();
  const repo = new HierarchyRepository(store);
  const service = new HierarchyService(store, repo, null, null, null);

  // 1. Test when manager has 7 active events
  console.log('Testing limit: Max 7 active events');
  const mockManagerId = 'mock_mgr_at_limit';
  // Mock repo.getManagerWorkload to return 7 active events, 7 workload
  repo.getManagerWorkload = () => ({
    activeEventsCount: 7,
    openIssuesCount: 0,
    quotationsCount: 0,
    totalWorkload: 7,
  });

  // Mock store event request
  store.getById = (col, id) => {
    if (col === 'eventRequests') {
      return { id: 'evt_test_1', title: 'Test Event', status: 'COMMERCIAL_APPROVED' };
    }
    if (col === 'users') {
      return { id: mockManagerId, name: 'Mock Manager', role: 'EVENT_MANAGER', department: 'EVENT_MANAGEMENT' };
    }
    return null;
  };

  let rejected7 = false;
  try {
    await service.assignStaff('evt_test_1', { eventManagerUserId: mockManagerId }, { id: 'dept_mgr_1', role: 'DEPARTMENT_MANAGER', department: 'EVENT_MANAGEMENT' });
  } catch (err) {
    if (err.message && err.message.includes('maximum allowed active assignments (7 active events)')) {
      rejected7 = true;
      console.log('PASS: Assignment rejected when manager has 7 active events:', err.message);
    } else {
      console.error('Unexpected error:', err.message);
    }
  }
  assert.strictEqual(rejected7, true, 'Should reject assignment when manager has 7 active events');

  // 2. Test when manager has 15 workload points (e.g. 5 active events, 10 open issues)
  console.log('\nTesting limit: Workload threshold 15');
  repo.getManagerWorkload = () => ({
    activeEventsCount: 5,
    openIssuesCount: 10,
    quotationsCount: 0,
    totalWorkload: 15,
  });

  let rejected15 = false;
  try {
    await service.assignStaff('evt_test_1', { eventManagerUserId: mockManagerId }, { id: 'dept_mgr_1', role: 'DEPARTMENT_MANAGER', department: 'EVENT_MANAGEMENT' });
  } catch (err) {
    if (err.message && err.message.includes('workload capacity threshold (current workload: 15, threshold: 15)')) {
      rejected15 = true;
      console.log('PASS: Assignment rejected when manager is at workload threshold 15:', err.message);
    } else {
      console.error('Unexpected error:', err.message);
    }
  }
  assert.strictEqual(rejected15, true, 'Should reject assignment when manager is at workload threshold 15');

  // 3. Test when manager has 6 active events and 14 workload (Both below limit)
  console.log('\nTesting eligibility: Below both limits');
  repo.getManagerWorkload = () => ({
    activeEventsCount: 6,
    openIssuesCount: 8,
    quotationsCount: 0,
    totalWorkload: 14,
  });
  store.update = (col, id, updates) => ({ id, ...updates });

  let accepted = false;
  try {
    const res = await service.assignStaff('evt_test_1', { eventManagerUserId: mockManagerId }, { id: 'dept_mgr_1', role: 'DEPARTMENT_MANAGER', department: 'EVENT_MANAGEMENT' });
    if (res && res.eventRequest) {
      accepted = true;
      console.log('PASS: Assignment succeeded when manager is below both limits (6 active events, 14 workload).');
    }
  } catch (err) {
    console.error('Unexpected error for eligible manager:', err.message);
  }
  assert.strictEqual(accepted, true, 'Should accept assignment when manager is below both limits');

  console.log('\n=== ALL CAPACITY UNIT TESTS PASSED PERFECTLY ===');
}

testUnitLimits().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
