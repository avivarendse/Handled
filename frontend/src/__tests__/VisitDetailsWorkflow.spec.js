import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'
import router from '../router'
import { useVisitsStore } from '../stores/visits'

const mountedWrappers = []

function mountApp(pinia = createPinia()) {
  const wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: [pinia, router] },
  })
  mountedWrappers.push(wrapper)
  return { wrapper, store: useVisitsStore(pinia), pinia }
}

async function openCompletion(wrapper) {
  await wrapper.get('button.primary-action').trigger('click')
  await flushPromises()
}

afterEach(() => {
  for (const wrapper of mountedWrappers) wrapper.unmount()
  mountedWrappers.length = 0
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Visit Details lifecycle actions', () => {
  it('starts an eligible scheduled visit through the lifecycle store', async () => {
    await router.push('/my-visits/102')
    const { wrapper, store } = mountApp()
    const startVisit = vi.spyOn(store, 'startVisit')
    const confirm = vi.spyOn(window, 'confirm')

    await wrapper.get('button.primary-action').trigger('click')
    await flushPromises()

    expect(startVisit).toHaveBeenCalledWith(102)
    expect(store.visitById(102).status).toBe('IN_PROGRESS')
    expect(store.jobById(store.visitById(102).jobId).status).toBe('IN_PROGRESS')
    expect(wrapper.get('.status').text()).toBe('In progress')
    expect(wrapper.find('.records-section').exists()).toBe(true)
    expect(wrapper.get('button.primary-action').text()).toBe('Complete visit')
    expect(wrapper.get('[role="status"]').text()).toContain('Visit started')
    expect(confirm).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/my-visits/102')
  })

  it('shows rejected start errors without changing the visit', async () => {
    await router.push('/my-visits/102')
    const { wrapper, store } = mountApp()
    vi.spyOn(store, 'startVisit').mockReturnValue({
      ok: false,
      error: 'Another visit is outstanding for this job.',
    })

    await wrapper.get('button.primary-action').trigger('click')

    expect(wrapper.get('[role="alert"]').text()).toContain('Another visit is outstanding')
    expect(store.visitById(102).status).toBe('SCHEDULED')
    expect(store.jobById(store.visitById(102).jobId).status).toBe('SCHEDULED')
    expect(wrapper.find('.records-section').exists()).toBe(false)
  })

  it('opens the completion form with no outcome selected and focuses the summary', async () => {
    await router.push('/my-visits/101')
    const { wrapper, store } = mountApp()

    await openCompletion(wrapper)

    expect(wrapper.findAll('button.primary-action')).toHaveLength(1)
    expect(wrapper.get('textarea#completion-summary').exists()).toBe(true)
    expect(wrapper.findAll('input[type="radio"]:checked')).toHaveLength(0)
    expect(document.activeElement).toBe(wrapper.get('#completion-summary').element)
    expect(store.visitById(101).status).toBe('IN_PROGRESS')
  })

  it('validates summary and outcome independently while preserving the draft', async () => {
    await router.push('/my-visits/101')
    const { wrapper, store } = mountApp()
    await openCompletion(wrapper)

    await wrapper.get('#completion-summary').setValue(' \n ')
    await wrapper.get('.completion-form').trigger('submit')

    expect(wrapper.get('#completion-summary-error').text()).toContain('completion summary')
    expect(wrapper.get('#completion-outcome-error').text()).toContain('outcome')
    expect(wrapper.get('#completion-summary').element.value).toBe(' \n ')
    expect(wrapper.findAll('input[type="radio"]:checked')).toHaveLength(0)
    expect(document.activeElement).toBe(wrapper.get('#completion-summary').element)
    expect(store.visitById(101).status).toBe('IN_PROGRESS')

    await wrapper.get('#completion-summary').setValue('Work checked and tested.')
    await wrapper.get('.completion-form').trigger('submit')
    expect(wrapper.find('#completion-summary-error').exists()).toBe(false)
    expect(wrapper.get('#completion-outcome-error').exists()).toBe(true)
    expect(wrapper.get('#completion-summary').element.value).toBe('Work checked and tested.')
    expect(document.activeElement).toBe(wrapper.get('input[value="JOB_COMPLETE"]').element)
  })

  it.each([
    ['JOB_COMPLETE', 'Job complete', 'COMPLETED'],
    ['FOLLOW_UP_REQUIRED', 'Follow-up required', 'FOLLOW_UP_REQUIRED'],
  ])('completes with the %s outcome and presents saved details', async (outcome, label, jobStatus) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-24T12:15:00.000Z'))
    await router.push('/my-visits/101')
    const { wrapper, store } = mountApp()
    const completeVisit = vi.spyOn(store, 'completeVisit')
    const historicalVisit = JSON.stringify(store.visitById(104))

    await openCompletion(wrapper)
    await wrapper.get('#completion-summary').setValue('  Pump tested successfully.\nPressure is stable.  ')
    await wrapper.get(`input[value="${outcome}"]`).setValue()
    expect(wrapper.get('.outcome-consequence').text()).toContain(
      outcome === 'JOB_COMPLETE'
        ? 'visit and the overall job will be completed'
        : 'job will require another appointment',
    )
    expect(store.visitById(101).status).toBe('IN_PROGRESS')

    await wrapper.get('.completion-form').trigger('submit')
    await flushPromises()

    expect(completeVisit).toHaveBeenCalledWith(101, {
      summary: '  Pump tested successfully.\nPressure is stable.  ',
      outcome,
    })
    expect(store.visitById(101)).toMatchObject({
      status: 'COMPLETED',
      completionSummary: 'Pump tested successfully.\nPressure is stable.',
      completionOutcome: outcome,
      completedAt: '2026-11-24T12:15:00.000Z',
    })
    expect(store.jobById(store.visitById(101).jobId).status).toBe(jobStatus)
    expect(JSON.stringify(store.visitById(104))).toBe(historicalVisit)
    expect(wrapper.find('.completion-form').exists()).toBe(false)
    expect(wrapper.findAll('button.primary-action')).toHaveLength(0)
    expect(wrapper.get('.completion-summary-text').text()).toBe(
      'Pump tested successfully.\nPressure is stable.',
    )
    expect(wrapper.text()).toContain(label)
    expect(wrapper.get('time[datetime="2026-11-24T12:15:00.000Z"]').text()).toBe(
      new Intl.DateTimeFormat('en-ZA', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Johannesburg',
      }).format(new Date('2026-11-24T12:15:00.000Z')),
    )
    expect(wrapper.get('[role="status"]').text()).toContain('read-only')
    expect(wrapper.findAll('.record-link')).toHaveLength(3)
    expect(router.currentRoute.value.path).toBe('/my-visits/101')

    await wrapper.get('.record-link[href="/my-visits/101/notes"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.findAll('.note-entry')).toHaveLength(2)
    expect(wrapper.text()).toContain('Notes can only be added while a visit is in progress.')
  })

  it('shows store rejection feedback and preserves completion input', async () => {
    await router.push('/my-visits/101')
    const { wrapper, store } = mountApp()
    vi.spyOn(store, 'completeVisit').mockReturnValue({
      ok: false,
      error: 'Visit must be IN_PROGRESS.',
    })
    await openCompletion(wrapper)
    await wrapper.get('#completion-summary').setValue('Still working')
    await wrapper.get('input[value="FOLLOW_UP_REQUIRED"]').setValue()

    await wrapper.get('.completion-form').trigger('submit')

    expect(wrapper.get('[role="alert"]').text()).toContain('Visit must be IN_PROGRESS.')
    expect(wrapper.get('#completion-summary').element.value).toBe('Still working')
    expect(wrapper.get('input[value="FOLLOW_UP_REQUIRED"]').element.checked).toBe(true)
    expect(store.visitById(101).status).toBe('IN_PROGRESS')
    expect(wrapper.find('.completion-form').exists()).toBe(true)
  })

  it('cancels without state changes and protects a populated form', async () => {
    await router.push('/my-visits/101')
    const { wrapper, store } = mountApp()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await openCompletion(wrapper)
    await wrapper.get('#completion-summary').setValue('Unsaved completion')
    await wrapper.get('input[value="JOB_COMPLETE"]').setValue()

    await wrapper.get('.secondary-action').trigger('click')
    expect(confirm).toHaveBeenCalledOnce()
    expect(wrapper.find('.completion-form').exists()).toBe(true)
    expect(wrapper.get('#completion-summary').element.value).toBe('Unsaved completion')
    expect(store.visitById(101).status).toBe('IN_PROGRESS')

    confirm.mockReturnValue(true)
    await wrapper.get('.secondary-action').trigger('click')
    await flushPromises()
    expect(wrapper.find('.completion-form').exists()).toBe(false)
    expect(wrapper.get('button.primary-action').text()).toBe('Complete visit')
    expect(document.activeElement).toBe(wrapper.get('button.primary-action').element)
    expect(store.visitById(101).status).toBe('IN_PROGRESS')
  })

  it('protects unsaved drafts on route changes and beforeunload', async () => {
    await router.push('/my-visits/101')
    const { wrapper } = mountApp()
    await openCompletion(wrapper)
    await wrapper.get('input[value="FOLLOW_UP_REQUIRED"]').setValue()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    const beforeUnload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(beforeUnload)
    expect(beforeUnload.defaultPrevented).toBe(true)

    await router.push('/my-visits/102')
    await flushPromises()
    expect(confirm).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.path).toBe('/my-visits/101')
    expect(wrapper.get('input[value="FOLLOW_UP_REQUIRED"]').element.checked).toBe(true)

    confirm.mockReturnValue(true)
    await router.push('/my-visits/102')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/my-visits/102')
    expect(wrapper.find('.completion-form').exists()).toBe(false)
    expect(wrapper.get('button.primary-action').text()).toBe('Start visit')
  })

  it('keeps historical completed visits read-only with their existing metadata and records', async () => {
    await router.push('/my-visits/104')
    const { wrapper } = mountApp()

    expect(wrapper.get('.completion-summary-text').text()).toBe(
      'Checked the pump controller. Return to inspect seals and pressure settings.',
    )
    expect(wrapper.text()).toContain('Follow-up required')
    expect(wrapper.get('time[datetime="2026-11-20T10:15:00.000Z"]').exists()).toBe(true)
    expect(wrapper.find('.completion-form').exists()).toBe(false)
    expect(wrapper.findAll('.record-link')).toHaveLength(3)
    expect(wrapper.text()).toContain('Saved visit records are read-only.')
  })
})
