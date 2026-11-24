// Fictional appointments assigned to one technician, in local wall-clock time.
export const demoToday = '2026-11-23'
export const visitStatusLabels = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const pumpJob = {
  title: 'Booster pump service',
  customer: 'Cedar House',
  site: '18 Oak Avenue, Rosebank',
  description:
    'Inspect pump operation, check seals and pressure settings, and record any maintenance required.',
}

export const demoVisits = [
  {
    id: 103,
    job: {
      title: 'Distribution board inspection',
      customer: 'Parkview Dental',
      site: '42 Tyrone Avenue, Parkview',
      description:
        'Inspect the distribution board, test protective devices, and document any faults found.',
    },
    start: '2026-11-23T13:30',
    end: '14:30',
    status: 'SCHEDULED',
  },
  { id: 101, job: pumpJob, start: '2026-11-23T08:30', end: '10:00', status: 'IN_PROGRESS' },
  { id: 104, job: pumpJob, start: '2026-11-25T09:00', end: '09:45', status: 'SCHEDULED' },
  {
    id: 102,
    job: {
      title: 'Air conditioner maintenance',
      customer: 'Mokoena Family',
      site: '7 Pine Road, Linden',
      description:
        'Service the air-conditioning unit, clean filters, and verify cooling performance.',
    },
    start: '2026-11-23T11:00',
    end: '12:00',
    status: 'SCHEDULED',
  },
]

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
