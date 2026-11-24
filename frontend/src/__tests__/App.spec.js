import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'
import router from '../router'
import {
  demoVisitRecords,
  demoVisits,
  getVisitRecordCounts,
  visitsForGroup,
} from '../data/demoVisits'

describe('My visits', () => {
  it('opens through the default route and renders appointments in time order', async () => {
    await router.push('/')
    const wrapper = mount(App, { global: { plugins: [router] } })
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
    const wrapper = mount(App, { global: { plugins: [router] } })
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
    const wrapper = mount(App, { global: { plugins: [router] } })
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
    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.get('.records-section h2').text()).toBe('Visit records')
    expect(
      wrapper.findAll('.record-row').map((row) => [
        row.find('span').text(),
        row.find('.record-count').text(),
      ]),
    ).toEqual([
      ['Notes', '2 demonstration records'],
      ['Photos', '1 demonstration record'],
      ['Materials', '1 demonstration record'],
    ])
    expect(wrapper.find('.record-list button, .record-list a').exists()).toBe(false)
    expect(getVisitRecordCounts(101)).toEqual({ notes: 2, photos: 1, materials: 1 })
    expect(getVisitRecordCounts(104)).toEqual({ notes: 1, photos: 2, materials: 0 })
    expect(demoVisitRecords.every((record) => demoVisits.some((item) => item.id === record.visitId)))
      .toBe(true)

    await router.push('/my-visits/104')
    await flushPromises()
    expect(wrapper.find('.records-section').exists()).toBe(false)
    expect(wrapper.find('button.primary-action').text()).toBe('Start visit')
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
        wrapper = mount(App, { global: { plugins: [router] } })
        await router.push('/my-visits/101')
        await flushPromises()

        expect(wrapper.find('.primary-action').exists()).toBe(false)
        expect(wrapper.find('.records-section').exists()).toBe(false)
        expect(wrapper.find('button').exists()).toBe(false)
      } finally {
        if (wrapper) wrapper.unmount()
        visit.status = originalStatus
      }
    },
  )
})
