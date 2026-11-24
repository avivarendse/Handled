// Fictional appointments assigned to one technician, in local wall-clock time.
export const demoToday = '2026-11-23'
export const visitStatusLabels = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export function createDemoJobs() {
  return [
    {
      id: 1,
      status: 'IN_PROGRESS',
      title: 'Booster pump service',
      customer: 'Cedar House',
      site: '18 Oak Avenue, Rosebank',
      description:
        'Inspect pump operation, check seals and pressure settings, and record any maintenance required.',
    },
    {
      id: 2,
      status: 'SCHEDULED',
      title: 'Distribution board inspection',
      customer: 'Parkview Dental',
      site: '42 Tyrone Avenue, Parkview',
      description:
        'Inspect the distribution board, test protective devices, and document any faults found.',
    },
    {
      id: 3,
      status: 'SCHEDULED',
      title: 'Air conditioner maintenance',
      customer: 'Mokoena Family',
      site: '7 Pine Road, Linden',
      description:
        'Service the air-conditioning unit, clean filters, and verify cooling performance.',
    },
  ]
}

export function createDemoVisits() {
  return [
    { id: 103, jobId: 2, start: '2026-11-23T13:30', end: '14:30', status: 'SCHEDULED' },
    { id: 101, jobId: 1, start: '2026-11-23T08:30', end: '10:00', status: 'IN_PROGRESS' },
    {
      id: 104,
      jobId: 1,
      start: '2026-11-20T11:30',
      end: '12:15',
      status: 'COMPLETED',
      completionSummary:
        'Checked the pump controller. Return to inspect seals and pressure settings.',
      completedAt: '2026-11-20T10:15:00.000Z',
      completionOutcome: 'FOLLOW_UP_REQUIRED',
    },
    { id: 102, jobId: 3, start: '2026-11-23T11:00', end: '12:00', status: 'SCHEDULED' },
  ]
}

export const demoVisitRecords = [
  {
    id: 1,
    visitId: 101,
    category: 'notes',
    text: 'Checked pump pressure and seals; no leaks observed.',
    createdAt: '2026-11-23T09:05:00.000Z',
  },
  {
    id: 2,
    visitId: 101,
    category: 'notes',
    text: 'Adjusted the pressure setting and confirmed the pump restarted.',
    createdAt: '2026-11-23T09:15:00.000Z',
  },
  { id: 3, visitId: 101, category: 'photos' },
  {
    id: 4,
    visitId: 101,
    category: 'materials',
    name: 'Pump gasket set',
    quantity: '1',
    unit: 'set',
    createdAt: '2026-11-23T09:20:00.000Z',
  },
  {
    id: 5,
    visitId: 102,
    category: 'notes',
    text: 'Customer requested the filter replacement be noted for follow-up.',
    createdAt: '2026-11-23T11:30:00.000Z',
  },
  {
    id: 6,
    visitId: 102,
    category: 'materials',
    name: 'Washable air filters',
    quantity: '2',
    unit: 'each',
    createdAt: '2026-11-23T11:40:00.000Z',
  },
  { id: 7, visitId: 103, category: 'photos' },
  {
    id: 8,
    visitId: 104,
    category: 'notes',
    text: 'Previous visit: checked the pump controller and recorded its settings.',
    createdAt: '2026-11-20T10:00:00.000Z',
  },
  { id: 9, visitId: 104, category: 'photos' },
  { id: 10, visitId: 104, category: 'photos' },
]

export function getVisitRecordCounts(visitId) {
  const counts = { notes: 0, photos: 0, materials: 0 }
  for (const record of demoVisitRecords) {
    if (record.visitId === visitId) counts[record.category] += 1
  }
  return counts
}

export function visitsForGroup(visits, group, today) {
  return visits
    .filter((visit) => {
      if (group === 'Completed') return visit.status === 'COMPLETED'
      if (visit.status === 'COMPLETED') return false
      const day = visit.start.slice(0, 10)
      return group === 'Today' ? day === today : day > today
    })
    .sort((a, b) => a.start.localeCompare(b.start) || a.id - b.id)
}
