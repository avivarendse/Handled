import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useVisitsStore } from '../stores/visits'
import { useVisitNotesStore } from '../stores/visitNotes'
import { useVisitPhotosStore } from '../stores/visitPhotos'
import { useVisitMaterialsStore } from '../stores/visitMaterials'

const completion = { summary: '  Pump tested.  ', outcome: 'JOB_COMPLETE' }
const rejection = { ok: false, error: expect.any(String) }
const fresh = () => useVisitsStore(createPinia())

function runWithoutMutation(store, action) {
  const before = JSON.stringify(store.$state)
  const result = action()
  expect(JSON.stringify(store.$state)).toBe(before)
  return result
}

afterEach(() => vi.useRealTimers())

describe('demonstration lifecycle', () => {
  it('seeds independent state with consistent assignments to shared jobs', () => {
    const store = fresh()
    for (const visit of store.visits) expect(store.jobById(visit.jobId)).toBeDefined()
    for (const job of store.jobs) {
      const outstanding = store.visits.filter(
        (visit) => visit.jobId === job.id && ['SCHEDULED', 'IN_PROGRESS'].includes(visit.status),
      )
      expect(outstanding.length).toBeLessThanOrEqual(1)
      expect(outstanding.every((visit) => visit.status === job.status)).toBe(true)
    }
    expect(store.visitById(101).jobId).toBe(store.visitById(104).jobId)
    store.startVisit(102)
    expect(fresh().visitById(102).status).toBe('SCHEDULED')
    expect(fresh().jobById(store.visitById(102).jobId).status).toBe('SCHEDULED')
  })

  it.each(['2026-11-01', '2026-12-01'])('starts independently of the current date %s', (date) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(date))
    const store = fresh()
    expect(store.startVisit('102')).toEqual({ ok: true })
    const visit = store.visitById(102)
    expect(visit.status).toBe('IN_PROGRESS')
    expect(store.jobById(visit.jobId).status).toBe('IN_PROGRESS')
    expect(runWithoutMutation(store, () => store.startVisit(102))).toEqual(rejection)
  })

  describe.each([
    ['start', 102, (store, id) => store.startVisit(id)],
    ['complete', 101, (store, id) => store.completeVisit(id, completion)],
  ])('%s eligibility', (_, id, act) => {
    it('rejects unknown visits and missing jobs', () => {
      const store = fresh()
      expect(runWithoutMutation(store, () => act(store, 'unknown'))).toEqual(rejection)
      store.visitById(id).jobId = -1
      expect(runWithoutMutation(store, () => act(store, id))).toEqual(rejection)
    })
    it('rejects invalid visit and job source states', () => {
      const store = fresh()
      const visit = store.visitById(id)
      store.jobById(visit.jobId).status = 'COMPLETED'
      expect(runWithoutMutation(store, () => act(store, id))).toEqual(rejection)
      store.jobById(visit.jobId).status = visit.status
      visit.status = 'CANCELLED'
      expect(runWithoutMutation(store, () => act(store, id))).toEqual(rejection)
    })
    it.each(['SCHEDULED', 'IN_PROGRESS'])('rejects a %s sibling', (status) => {
      const store = fresh()
      store.visits.push({ ...store.visitById(id), id: 900, status })
      expect(runWithoutMutation(store, () => act(store, id))).toEqual(rejection)
    })
  })

  it.each([
    ['JOB_COMPLETE', 'COMPLETED'],
    ['FOLLOW_UP_REQUIRED', 'FOLLOW_UP_REQUIRED'],
  ])('applies %s and preserves history', (outcome, jobStatus) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-23T10:00:00Z'))
    const store = fresh()
    const history = JSON.stringify(store.visitById(104))
    expect(store.completeVisit(101, { ...completion, outcome })).toEqual({ ok: true })
    const visit = store.visitById(101)
    expect(visit).toMatchObject({
      status: 'COMPLETED',
      completionOutcome: outcome,
      completionSummary: 'Pump tested.',
      completedAt: '2026-11-23T10:00:00.000Z',
    })
    expect(store.jobById(visit.jobId).status).toBe(jobStatus)
    expect(JSON.stringify(store.visitById(104))).toBe(history)
    expect(store.visits).toHaveLength(4)
    vi.setSystemTime(new Date('2026-11-24'))
    expect(runWithoutMutation(store, () => store.completeVisit(101, completion))).toEqual(rejection)
  })

  it.each([
    {},
    null,
    { ...completion, summary: '' },
    { ...completion, summary: '  ' },
    { ...completion, summary: 7 },
    { summary: 'Done' },
    { ...completion, outcome: 'completed' },
  ])('rejects invalid completion details %j', (details) => {
    const store = fresh()
    expect(runWithoutMutation(store, () => store.completeVisit(101, details))).toEqual(rejection)
  })

  it('completes a visit with no records', () => {
    const pinia = createPinia()
    const store = useVisitsStore(pinia)
    store.visits.push({ id: 800, jobId: 800, status: 'IN_PROGRESS' })
    store.jobs.push({ id: 800, status: 'IN_PROGRESS' })
    expect(useVisitNotesStore(pinia).notesForVisit(800)).toEqual([])
    expect(useVisitMaterialsStore(pinia).materialsForVisit(800)).toEqual([])
    expect(useVisitPhotosStore(pinia).photosForVisit(800)).toEqual([])
    expect(store.completeVisit(800, completion)).toEqual({ ok: true })
  })

  it('preserves visit records and rejects additions after completion', () => {
    const pinia = createPinia()
    const store = useVisitsStore(pinia)
    const notes = useVisitNotesStore(pinia)
    const photos = useVisitPhotosStore(pinia)
    const materials = useVisitMaterialsStore(pinia)
    const records = () =>
      [101, 104].map((id) => [
        notes.notesForVisit(id),
        photos.photosForVisit(id),
        materials.materialsForVisit(id),
      ])
    const before = JSON.stringify(records())
    expect(store.completeVisit(101, completion).ok).toBe(true)
    expect(notes.addNote(101, 'Late note')).toBeNull()
    expect(photos.addPhotos(101, [{ name: 'Late photo', url: 'blob:late' }])).toBeNull()
    expect(materials.addMaterial(101, { name: 'Pipe', quantity: '1', unit: 'm' })).toBeNull()
    expect(JSON.stringify(records())).toBe(before)
  })
})
