import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'
import router from '../router'
import { demoVisits } from '../data/demoVisits'
import { useVisitMaterialsStore } from '../stores/visitMaterials'
import { validateMaterialDraft } from '../utils/visitMaterials'

const mountedWrappers = []

function mountApp() {
  const pinia = createPinia()
  const wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: [pinia, router] },
  })
  mountedWrappers.push(wrapper)
  return { wrapper, store: useVisitMaterialsStore(pinia) }
}

function validDraft(overrides = {}) {
  return { name: 'Pump gasket set', quantity: '1.25', unit: 'set', ...overrides }
}

afterEach(() => {
  for (const wrapper of mountedWrappers) wrapper.unmount()
  mountedWrappers.length = 0
  vi.restoreAllMocks()
})

describe('material draft validation', () => {
  it('requires trimmed material names, quantities and units', () => {
    const result = validateMaterialDraft({ name: '  ', quantity: '', unit: '\t' })

    expect(result.material).toBeNull()
    expect(result.errors).toEqual({
      name: 'Enter a material name.',
      quantity: 'Enter a quantity.',
      unit: 'Enter a unit.',
    })
  })

  it('trims valid text and accepts positive fractional values through the DECIMAL limit', () => {
    for (const quantity of ['0.01', '1', '1.25', '99999999.99']) {
      expect(
        validateMaterialDraft(validDraft({ name: ' Pump gasket set ', quantity, unit: ' set ' }))
          .material,
      ).toEqual({ name: 'Pump gasket set', quantity, unit: 'set' })
    }
  })

  it.each([
    ['0', 'greater than zero'],
    ['0.00', 'greater than zero'],
    ['-1.25', 'greater than zero'],
    ['1.001', 'no more than two places'],
    ['1e2', 'decimal using digits'],
    ['100000000', 'cannot exceed'],
    ['99999999.991', 'no more than two places'],
    ['Infinity', 'decimal using digits'],
  ])('rejects invalid quantity %s', (quantity, message) => {
    expect(validateMaterialDraft(validDraft({ quantity })).errors.quantity).toContain(message)
  })

  it('enforces name and unit character limits', () => {
    expect(validateMaterialDraft(validDraft({ name: 'x'.repeat(151) })).errors.name).toContain(
      '150 characters',
    )
    expect(validateMaterialDraft(validDraft({ unit: 'x'.repeat(31) })).errors.unit).toContain(
      '30 characters',
    )
    expect(validateMaterialDraft(validDraft({ name: 'x'.repeat(150), unit: 'x'.repeat(30) })).errors)
      .toEqual({})
  })
})

describe('visit materials page', () => {
  it('shows demonstration materials and adds a trimmed fractional record', async () => {
    await router.push('/my-visits/101/materials')
    const { wrapper, store } = mountApp()

    expect(wrapper.get('h1').text()).toBe('Booster pump service')
    expect(wrapper.text()).toContain('Cedar House')
    expect(wrapper.text()).toContain('In progress')
    expect(wrapper.findAll('.material-row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Pump gasket set')

    await wrapper.get('#material-name').setValue('  Pump packing  ')
    await wrapper.get('#material-quantity').setValue('0.75')
    await wrapper.get('#material-unit').setValue(' metres ')
    await wrapper.get('.material-form').trigger('submit')

    expect(wrapper.findAll('.material-row')).toHaveLength(2)
    expect(wrapper.text()).toContain('Pump packing')
    expect(wrapper.text()).toContain('0.75')
    expect(wrapper.text()).toContain('metres')
    expect(wrapper.get('[role="status"]').text()).toContain('temporary')
    expect(wrapper.get('#material-name').element.value).toBe('')
    expect(wrapper.get('#material-quantity').element.value).toBe('')
    expect(wrapper.get('#material-unit').element.value).toBe('')
    expect(store.materialsForVisit(101).at(-1)).toMatchObject({
      id: 11,
      visitId: 101,
      name: 'Pump packing',
      quantity: '0.75',
      unit: 'metres',
    })
  })

  it('shows field-specific errors and preserves values after invalid submission', async () => {
    await router.push('/my-visits/101/materials')
    const { wrapper } = mountApp()
    await wrapper.get('#material-name').setValue('   ')
    await wrapper.get('#material-quantity').setValue('1.234')
    await wrapper.get('#material-unit').setValue('')
    await wrapper.get('.material-form').trigger('submit')

    expect(wrapper.get('#material-name-error').text()).toContain('material name')
    expect(wrapper.get('#material-quantity-error').text()).toContain('two places')
    expect(wrapper.get('#material-unit-error').text()).toContain('unit')
    expect(wrapper.get('#material-name').element.value).toBe('   ')
    expect(wrapper.get('#material-quantity').element.value).toBe('1.234')
    expect(wrapper.get('#material-unit').element.value).toBe('')
    expect(wrapper.findAll('.material-row')).toHaveLength(1)
  })

  it('keeps new records isolated by visit, even for visits sharing the same job', async () => {
    await router.push('/my-visits/101/materials')
    const { store } = mountApp()
    store.addMaterial(101, validDraft({ name: 'Only on visit 101' }))

    expect(store.materialsForVisit(101).map((material) => material.name)).toContain(
      'Only on visit 101',
    )
    expect(store.materialsForVisit(104).map((material) => material.name)).not.toContain(
      'Only on visit 101',
    )
  })

  it('updates the Details count and preserves added records during navigation', async () => {
    await router.push('/my-visits/101/materials')
    const { wrapper } = mountApp()
    await wrapper.get('#material-name').setValue('Pipe insulation')
    await wrapper.get('#material-quantity').setValue('2')
    await wrapper.get('#material-unit').setValue('m')
    await wrapper.get('.material-form').trigger('submit')

    await wrapper.get('.back-link').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/my-visits/101')
    expect(wrapper.get('a[href="/my-visits/101/materials"] .record-count').text()).toBe('2')

    await wrapper.get('a[href="/my-visits/101/materials"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Pipe insulation')
    expect(wrapper.findAll('.material-row')).toHaveLength(2)
  })

  it('starts fresh with demonstration materials in a new Pinia instance', async () => {
    const pinia = createPinia()
    const store = useVisitMaterialsStore(pinia)
    store.addMaterial(101, validDraft({ name: 'Temporary material' }))

    const reloadedStore = useVisitMaterialsStore(createPinia())
    expect(store.materialsForVisit(101)).toHaveLength(2)
    expect(reloadedStore.materialsForVisit(101)).toHaveLength(1)
    expect(reloadedStore.materialsForVisit(101).map((material) => material.name)).not.toContain(
      'Temporary material',
    )
  })

  it.each(['SCHEDULED', 'COMPLETED', 'CANCELLED'])(
    'does not provide entry controls for %s visits',
    async (status) => {
      const visit = demoVisits.find((candidate) => candidate.id === 101)
      const originalStatus = visit.status
      visit.status = status
      try {
        await router.push('/my-visits/101/materials')
        const { wrapper } = mountApp()

        expect(wrapper.find('.material-form').exists()).toBe(false)
        expect(wrapper.find('.primary-action').exists()).toBe(false)
        expect(wrapper.find('button').exists()).toBe(false)
        expect(wrapper.text()).toContain('Existing records remain available to view')
        expect(wrapper.text()).toContain('Pump gasket set')
      } finally {
        visit.status = originalStatus
      }
    },
  )

  it('handles unknown visit IDs without exposing an entry form', async () => {
    await router.push('/my-visits/not-a-visit/materials')
    const { wrapper } = mountApp()

    expect(wrapper.get('h1').text()).toBe('Visit not found')
    expect(wrapper.find('.material-form').exists()).toBe(false)
    expect(wrapper.get('.back-link').attributes('href')).toBe('/my-visits')
  })

  it('protects unsaved values when navigating away', async () => {
    await router.push('/my-visits/101/materials')
    const { wrapper } = mountApp()
    await wrapper.get('#material-name').setValue('Unsaved gasket')
    await wrapper.get('#material-quantity').setValue('3')
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    await wrapper.get('.back-link').trigger('click')
    await flushPromises()
    expect(confirm).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.path).toBe('/my-visits/101/materials')
    expect(wrapper.get('#material-name').element.value).toBe('Unsaved gasket')

    confirm.mockReturnValue(true)
    await wrapper.get('.back-link').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/my-visits/101')
  })
})
