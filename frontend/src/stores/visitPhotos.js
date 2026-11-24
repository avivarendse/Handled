import { onScopeDispose, ref } from 'vue'
import { defineStore } from 'pinia'

const demoPhotos = [
  {
    id: 1,
    visitId: 101,
    name: 'Pump inspection',
    url: '/demo-photos/pump-inspection.svg',
    isDemo: true,
  },
  {
    id: 2,
    visitId: 103,
    name: 'Distribution board',
    url: '/demo-photos/distribution-board.svg',
    isDemo: true,
  },
  {
    id: 3,
    visitId: 104,
    name: 'Pump controls',
    url: '/demo-photos/pump-controls.svg',
    isDemo: true,
  },
  {
    id: 4,
    visitId: 104,
    name: 'Pump service',
    url: '/demo-photos/pump-inspection.svg',
    isDemo: true,
  },
]

export const useVisitPhotosStore = defineStore('visit-photos', () => {
  const photos = ref(demoPhotos.map((photo) => ({ ...photo })))
  const ownedObjectUrls = new Set()
  let nextId = Math.max(...demoPhotos.map((photo) => photo.id)) + 1

  function photosForVisit(visitId) {
    return photos.value.filter((photo) => photo.visitId === Number(visitId))
  }

  function addPhotos(visitId, pendingPhotos) {
    const addedPhotos = pendingPhotos.map((photo) => {
      ownedObjectUrls.add(photo.url)
      return {
        id: nextId++,
        visitId: Number(visitId),
        name: photo.name,
        url: photo.url,
        isDemo: false,
      }
    })
    photos.value.push(...addedPhotos)
    return addedPhotos
  }

  function resetPhotos() {
    for (const url of ownedObjectUrls) URL.revokeObjectURL(url)
    ownedObjectUrls.clear()
    photos.value = demoPhotos.map((photo) => ({ ...photo }))
    nextId = Math.max(...demoPhotos.map((photo) => photo.id)) + 1
  }

  onScopeDispose(() => {
    for (const url of ownedObjectUrls) URL.revokeObjectURL(url)
    ownedObjectUrls.clear()
  })

  return { photosForVisit, addPhotos, resetPhotos }
})
