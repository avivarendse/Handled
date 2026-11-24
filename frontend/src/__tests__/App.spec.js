import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'
import router from '../router'
import { useVisitNotesStore } from '../stores/visitNotes'
import { useVisitPhotosStore } from '../stores/visitPhotos'
import {
  demoVisitRecords,
  demoVisits,
  getVisitRecordCounts,
  visitsForGroup,
} from '../data/demoVisits'

const mountedWrappers = []
const mountApp = () => {
  const wrapper = mount(App, { global: { plugins: [createPinia(), router] } })
  mountedWrappers.push(wrapper)
  return wrapper
}

afterEach(() => {
  for (const wrapper of mountedWrappers) wrapper.unmount()
  mountedWrappers.length = 0
})

describe('My visits', () => {
  it('opens through the default route and renders appointments in time order', async () => {
    await router.push('/')
    const wrapper = mountApp()
    expect(router.currentRoute.value.path).toBe('/my-visits')
    expect(wrapper.get('h1').text()).toBe('My visits')
    expect(wrapper.findAll('time').map((time) => time.text())).toEqual(['08:30', '11:00', '13:30'])
    const row = wrapper.get('li')
    for (const field of ['Booster pump service', 'Cedar House', 'In progress', 'View visit']) {
      expect(row.text()).toContain(field)
    }
    expect(wrapper.findAll('li a').map((link) => link.attributes('href'))).toEqual([
      '/my-visits/101',
      '/my-visits/102',
      '/my-visits/103',
    ])
    const [, upcoming, completed] = wrapper.findAll('button')
    await upcoming.trigger('click')
    expect(wrapper.get('h2').text()).toContain('25 November')
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.get('li a').attributes('href')).toBe('/my-visits/104')
    await completed.trigger('click')
    expect(completed.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('h2').text()).toBe('No completed visits')
    expect(wrapper.findAll('li')).toHaveLength(0)
  })

  it('groups by appointment date and keeps finished visits in Completed', () => {
    const visits = [
      { id: 1, start: '2026-11-24T07:00', status: 'SCHEDULED' },
      { id: 2, start: '2026-11-23T09:00', status: 'COMPLETED' },
      { id: 3, start: '2026-11-22T12:00', status: 'COMPLETED' },
      { id: 4, start: '2026-11-23T11:00', status: 'CANCELLED' },
    ]
    const ids = (group) => visitsForGroup(visits, group, '2026-11-23').map((visit) => visit.id)
    expect(ids('Today')).toEqual([4])
    expect(ids('Upcoming')).toEqual([1])
    expect(ids('Completed')).toEqual([3, 2])
  })

  it('loads the selected visit from its URL and provides a working back link', async () => {
    await router.push('/my-visits')
    const wrapper = mountApp()
    await wrapper.get('a[href="/my-visits/101"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Booster pump service')
    expect(wrapper.text()).toContain('In progress')
    expect(wrapper.text()).toContain('Monday, 23 November 2026')
    expect(wrapper.text()).toContain('08:30–10:00')
    expect(wrapper.text()).toContain('18 Oak Avenue, Rosebank')
    expect(wrapper.text()).toContain('Inspect pump operation')
    expect(wrapper.get('.primary-action').text()).toBe('Complete visit')

    await router.push('/my-visits/104')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Booster pump service')
    expect(wrapper.text()).toContain('Wednesday, 25 November 2026')
    expect(wrapper.text()).toContain('09:00–09:45')
    expect(wrapper.text()).toContain('Scheduled')
    expect(wrapper.get('.primary-action').text()).toBe('Start visit')

    await wrapper.get('.back-link').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/my-visits')
    expect(wrapper.get('h1').text()).toBe('My visits')
  })

  it('shows a useful not-found page for an unknown visit ID', async () => {
    await router.push('/my-visits/unknown-visit')
    const wrapper = mountApp()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Visit not found')
    expect(wrapper.text()).toContain(
      'Visit unknown-visit could not be found in the demonstration appointments.',
    )
    await wrapper.get('.back-link').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/my-visits')
  })

  it('shows visit-specific demonstration records only for in-progress visits', async () => {
    await router.push('/my-visits/101')
    const wrapper = mountApp()
    await flushPromises()

    expect(wrapper.get('.records-section h2').text()).toBe('Visit records')
    expect(
      wrapper.findAll('.record-row').map((row) => [
        row.find('span').text(),
        row.find('.record-count').text(),
      ]),
    ).toEqual([
      ['Notes', '2'],
      ['Photos', '1'],
      ['Materials', '1'],
    ])
    expect(wrapper.get('.record-link').attributes('href')).toBe('/my-visits/101/notes')
    expect(wrapper.findAll('.record-link').map((link) => link.attributes('href'))).toEqual([
      '/my-visits/101/notes',
      '/my-visits/101/photos',
      '/my-visits/101/materials',
    ])
    expect(getVisitRecordCounts(101)).toEqual({ notes: 2, photos: 1, materials: 1 })
    expect(getVisitRecordCounts(104)).toEqual({ notes: 1, photos: 2, materials: 0 })
    expect(demoVisitRecords.every((record) => demoVisits.some((item) => item.id === record.visitId)))
      .toBe(true)

    await router.push('/my-visits/104')
    await flushPromises()
    expect(wrapper.find('.records-section').exists()).toBe(false)
    expect(wrapper.find('button.primary-action').text()).toBe('Start visit')
  })

  it('opens the selected visit photos and updates its count after adding photos', async () => {
    await router.push('/my-visits/101')
    const wrapper = mountApp()
    const photosStore = useVisitPhotosStore()
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:added-photo')
    URL.revokeObjectURL = vi.fn()

    try {
      await wrapper.get('a[href="/my-visits/101/photos"]').trigger('click')
      await flushPromises()
      expect(wrapper.get('h1').text()).toBe('Booster pump service')
      expect(wrapper.text()).toContain('Cedar House')
      expect(wrapper.findAll('.confirmed-grid .photo-card')).toHaveLength(1)

      const file = new File(['image'], 'repair.jpg', { type: 'image/jpeg' })
      const input = wrapper.get('input[type="file"]')
      Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
      await input.trigger('change')
      await flushPromises()
      expect(wrapper.findAll('.pending-grid .photo-card')).toHaveLength(1)

      await wrapper.get('.primary-action').trigger('click')
      expect(wrapper.get('[role="status"]').text()).toContain('1 photo added')
      expect(photosStore.photosForVisit(101)).toHaveLength(2)
      expect(photosStore.photosForVisit(104)).toHaveLength(2)

      await wrapper.get('.back-link').trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/my-visits/101')
      expect(wrapper.get('.record-link[href="/my-visits/101/photos"] .record-count').text()).toBe(
        '2',
      )
    } finally {
      if (originalCreateObjectURL) URL.createObjectURL = originalCreateObjectURL
      else delete URL.createObjectURL
      if (originalRevokeObjectURL) URL.revokeObjectURL = originalRevokeObjectURL
      else delete URL.revokeObjectURL
    }
  })

  it.each(['COMPLETED', 'CANCELLED'])(
    'keeps %s visits read-only',
    async (status) => {
      const visit = demoVisits.find((candidate) => candidate.id === 101)
      const originalStatus = visit.status
      visit.status = status
      let wrapper
      try {
        await router.push('/my-visits')
        wrapper = mountApp()
        await router.push('/my-visits/101')
        await flushPromises()

        expect(wrapper.find('.primary-action').exists()).toBe(false)
        expect(wrapper.find('.records-section').exists()).toBe(false)
        expect(wrapper.find('button').exists()).toBe(false)

        await router.push('/my-visits/101/notes')
        await flushPromises()
        expect(wrapper.find('textarea').exists()).toBe(false)
        expect(wrapper.find('button').exists()).toBe(false)

        await router.push('/my-visits/101/materials')
        await flushPromises()
        expect(wrapper.find('.material-form').exists()).toBe(false)
        expect(wrapper.find('button').exists()).toBe(false)
      } finally {
        if (wrapper) wrapper.unmount()
        visit.status = originalStatus
      }
    },
  )

  it('adds a temporary note, validates input and updates the visit count', async () => {
    await router.push('/my-visits/101')
    const wrapper = mountApp()
    await wrapper.get('.record-link').trigger('click')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Booster pump service')
    expect(wrapper.text()).toContain('Cedar House')
    expect(wrapper.findAll('.note-text').map((note) => note.text())).toEqual([
      'Adjusted the pressure setting and confirmed the pump restarted.',
      'Checked pump pressure and seals; no leaks observed.',
    ])

    const textarea = wrapper.get('textarea')
    const invalidDraft = ' \n  '
    await textarea.setValue(invalidDraft)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toBe('Enter a note before adding it.')
    expect(textarea.element.value).toBe(invalidDraft)
    expect(textarea.attributes('aria-invalid')).toBe('true')

    await textarea.setValue('  Rechecked the pressure after restart.  ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.findAll('.note-text')[0].text()).toBe('Rechecked the pressure after restart.')
    expect(textarea.element.value).toBe('')
    expect(wrapper.get('[role="status"]').text()).toContain('Changes are temporary')

    await wrapper.get('.back-link').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/my-visits/101')
    expect(wrapper.get('.record-link .record-count').text()).toBe('3')
  })

  it('keeps notes isolated for visits belonging to the same job', async () => {
    await router.push('/my-visits/101/notes')
    const wrapper = mountApp()
    await wrapper.get('textarea').setValue('Only for visit 101')
    await wrapper.get('form').trigger('submit')
    await router.push('/my-visits/104/notes')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Booster pump service')
    expect(wrapper.text()).toContain('Previous visit: checked the pump controller')
    expect(wrapper.text()).not.toContain('Only for visit 101')
    expect(wrapper.findAll('.note-text')).toHaveLength(1)
    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  it('protects an unsaved note when navigating away', async () => {
    await router.push('/my-visits/101/notes')
    const wrapper = mountApp()
    await wrapper.get('textarea').setValue('A draft that has not been added')
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    try {
      await wrapper.get('.back-link').trigger('click')
      await flushPromises()
      expect(confirm).toHaveBeenCalledOnce()
      expect(router.currentRoute.value.path).toBe('/my-visits/101/notes')
      expect(wrapper.get('textarea').element.value).toBe('A draft that has not been added')

      confirm.mockReturnValue(true)
      await wrapper.get('.back-link').trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/my-visits/101')
    } finally {
      confirm.mockRestore()
    }
  })

  it('shows an empty state and handles unknown note routes', async () => {
    await router.push('/my-visits/103/notes')
    const wrapper = mountApp()
    expect(wrapper.get('.empty-state').text()).toContain('No notes have been recorded')
    expect(wrapper.find('textarea').exists()).toBe(false)

    await router.push('/my-visits/999/notes')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Visit not found')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.get('.back-link').attributes('href')).toBe('/my-visits')
  })

  it('resets added notes when a fresh Pinia instance is created', () => {
    const store = useVisitNotesStore(createPinia())
    store.addNote(101, 'Temporary note')
    expect(store.notesForVisit(101)).toHaveLength(3)

    const reloadedStore = useVisitNotesStore(createPinia())
    expect(reloadedStore.notesForVisit(101)).toHaveLength(2)
    expect(reloadedStore.notesForVisit(101).map((note) => note.text)).not.toContain(
      'Temporary note',
    )
  })

  it('resets added photos when a fresh Pinia instance is created', () => {
    const store = useVisitPhotosStore(createPinia())
    store.addPhotos(101, [{ name: 'Temporary photo', url: 'blob:temporary-photo' }])
    expect(store.photosForVisit(101)).toHaveLength(2)

    const reloadedStore = useVisitPhotosStore(createPinia())
    expect(reloadedStore.photosForVisit(101)).toHaveLength(1)
  })
})
