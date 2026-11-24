import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'
import router from '../router'
import { demoVisits } from '../data/demoVisits'
import { useVisitPhotosStore } from '../stores/visitPhotos'
import {
  MAX_PENDING_PHOTOS,
  MAX_PHOTO_FILE_SIZE,
  validatePhotoFile,
} from '../utils/visitPhotos'

const mountedWrappers = []
const originalUrlMethods = {
  createObjectURL: Object.getOwnPropertyDescriptor(URL, 'createObjectURL'),
  revokeObjectURL: Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL'),
}
let objectUrlIndex = 0

function mountPhotos() {
  const wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: [createPinia(), router] },
  })
  mountedWrappers.push(wrapper)
  return wrapper
}

function imageFile(name, type = 'image/jpeg', size = 4) {
  return { name, type, size }
}

async function selectFiles(wrapper, files) {
  const input = wrapper.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: files })
  await input.trigger('change')
  await flushPromises()
  return input
}

beforeEach(() => {
  objectUrlIndex = 0
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn((file) => `blob:${file.name}:${++objectUrlIndex}`),
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  })
})

afterEach(() => {
  for (const wrapper of mountedWrappers) wrapper.unmount()
  mountedWrappers.length = 0
  for (const method of ['createObjectURL', 'revokeObjectURL']) {
    if (originalUrlMethods[method]) {
      Object.defineProperty(URL, method, originalUrlMethods[method])
    } else {
      delete URL[method]
    }
  }
  vi.restoreAllMocks()
})

describe('visit photo file validation', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts %s files', (type) => {
    expect(validatePhotoFile(imageFile('photo', type))).toBe('')
  })

  it('reports empty, unsupported and oversized files', () => {
    expect(validatePhotoFile(imageFile('empty.jpg', 'image/jpeg', 0))).toContain('empty')
    expect(validatePhotoFile(imageFile('limit.jpg', 'image/jpeg', MAX_PHOTO_FILE_SIZE))).toBe('')
    expect(validatePhotoFile(imageFile('notes.txt', 'text/plain'))).toContain(
      'JPEG, PNG or WebP',
    )
    expect(
      validatePhotoFile(imageFile('large.png', 'image/png', MAX_PHOTO_FILE_SIZE + 1)),
    ).toContain('10 MB or smaller')
  })
})

describe('visit photos', () => {
  it('keeps valid pending files when other files fail and removes pending previews', async () => {
    await router.push('/my-visits/101/photos')
    const wrapper = mountPhotos()
    const valid = imageFile('valid.jpg')
    const input = await selectFiles(wrapper, [
      valid,
      imageFile('unsupported.gif', 'image/gif'),
      imageFile('too-large.png', 'image/png', MAX_PHOTO_FILE_SIZE + 1),
    ])

    expect(input.element.value).toBe('')
    expect(wrapper.findAll('.pending-grid .photo-card')).toHaveLength(1)
    expect(wrapper.get('[role="alert"]').text()).toContain('unsupported.gif')
    expect(wrapper.get('[role="alert"]').text()).toContain('too-large.png')
    expect(wrapper.get('.selected-count').text()).toBe('1 of 5 selected')

    await wrapper.get('.remove-photo').trigger('click')
    expect(wrapper.find('.pending-grid').exists()).toBe(false)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:valid.jpg:1')
  })

  it('limits each pending batch to five files', async () => {
    await router.push('/my-visits/101/photos')
    const wrapper = mountPhotos()
    await selectFiles(
      wrapper,
      Array.from({ length: MAX_PENDING_PHOTOS + 1 }, (_, index) =>
        imageFile(`photo-${index}.jpg`),
      ),
    )

    expect(wrapper.findAll('.pending-grid .photo-card')).toHaveLength(MAX_PENDING_PHOTOS)
    expect(wrapper.get('[role="alert"]').text()).toContain('up to 5 photos')
  })

  it('confirms photos, updates counts and retains confirmed URLs through navigation', async () => {
    await router.push('/my-visits/101/photos')
    const wrapper = mountPhotos()
    await selectFiles(wrapper, [imageFile('new.jpg')])
    const url = 'blob:new.jpg:1'

    await wrapper.get('.primary-action').trigger('click')
    await flushPromises()
    expect(wrapper.find('.pending-grid').exists()).toBe(false)
    expect(wrapper.findAll('.confirmed-grid .photo-card')).toHaveLength(2)
    expect(wrapper.get('[role="status"]').text()).toContain('not uploaded to a server')
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(url)

    await wrapper.get('.back-link').trigger('click')
    await flushPromises()
    expect(wrapper.get('.record-link[href="/my-visits/101/photos"] .record-count').text()).toBe(
      '2',
    )
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(url)

    const store = useVisitPhotosStore()
    store.resetPhotos()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(url)
  })

  it('isolates photos by visit even when visits share a job', async () => {
    await router.push('/my-visits/101/photos')
    const wrapper = mountPhotos()
    await selectFiles(wrapper, [imageFile('visit-101.jpg')])
    await wrapper.get('.primary-action').trigger('click')

    const store = useVisitPhotosStore()
    expect(store.photosForVisit(101).map((photo) => photo.name)).toContain('visit-101.jpg')
    expect(store.photosForVisit(104).map((photo) => photo.name)).not.toContain('visit-101.jpg')
  })

  it.each(['SCHEDULED', 'COMPLETED', 'CANCELLED'])(
    'does not expose photo-editing controls for %s visits',
    async (status) => {
      const visit = demoVisits.find((candidate) => candidate.id === 101)
      const originalStatus = visit.status
      visit.status = status
      try {
        await router.push('/my-visits/101/photos')
        const wrapper = mountPhotos()
        expect(wrapper.find('input[type="file"]').exists()).toBe(false)
        expect(wrapper.find('.primary-action').exists()).toBe(false)
        expect(wrapper.find('.remove-photo').exists()).toBe(false)
        expect(wrapper.text()).toContain('Existing photos remain available to view')
      } finally {
        visit.status = originalStatus
      }
    },
  )

  it('shows a useful empty state and handles unknown visit routes', async () => {
    await router.push('/my-visits/102/photos')
    const wrapper = mountPhotos()
    expect(wrapper.get('.empty-state').text()).toContain('No photos have been added')

    await router.push('/my-visits/unknown/photos')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Visit not found')
    expect(wrapper.find('input[type="file"]').exists()).toBe(false)
    expect(wrapper.get('.back-link').attributes('href')).toBe('/my-visits')
  })

  it('protects pending photos when navigating away and releases discarded URLs', async () => {
    await router.push('/my-visits/101/photos')
    const wrapper = mountPhotos()
    await selectFiles(wrapper, [imageFile('pending.jpg')])
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    await wrapper.get('.back-link').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/my-visits/101/photos')
    expect(wrapper.findAll('.pending-grid .photo-card')).toHaveLength(1)

    confirm.mockReturnValue(true)
    await wrapper.get('.back-link').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/my-visits/101')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:pending.jpg:1')
  })

  it('dismisses the enlarged preview with Escape and restores focus', async () => {
    await router.push('/my-visits/101/photos')
    const wrapper = mountPhotos()
    const trigger = wrapper.get('.confirmed-grid .photo-preview')
    await trigger.trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="dialog"]').exists()).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('.close-preview').element)
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('revokes confirmed object URLs when the store is explicitly disposed', () => {
    const store = useVisitPhotosStore(createPinia())
    store.addPhotos(101, [{ name: 'confirmed.png', url: 'blob:confirmed' }])

    store.$dispose()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:confirmed')
  })

  it('removes an image that cannot be decoded and reports the failure', async () => {
    await router.push('/my-visits/101/photos')
    const wrapper = mountPhotos()
    await selectFiles(wrapper, [imageFile('broken.jpg')])

    await wrapper.get('.pending-preview img').trigger('error')

    expect(wrapper.find('.pending-grid').exists()).toBe(false)
    expect(wrapper.get('[role="alert"]').text()).toContain('could not be decoded')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:broken.jpg:1')
  })
})
