import { useVisitsStore } from './visits'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { demoVisitRecords } from '../data/demoVisits'

const demoMaterials = demoVisitRecords
  .filter((record) => record.category === 'materials')
  .map(({ id, visitId, name, quantity, unit, createdAt }) => ({
    id,
    visitId,
    name,
    quantity,
    unit,
    createdAt,
  }))

export const useVisitMaterialsStore = defineStore('visit-materials', () => {
  const visitsStore = useVisitsStore()
  const materials = ref(demoMaterials.map((material) => ({ ...material })))
  let nextId = Math.max(0, ...demoVisitRecords.map((record) => record.id)) + 1

  function materialsForVisit(visitId) {
    return materials.value
      .filter((material) => material.visitId === Number(visitId))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
  }

  function addMaterial(visitId, material) {
    if (!visitsStore.canAddRecords(visitId)) return null
    const record = {
      id: nextId++,
      visitId: Number(visitId),
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      createdAt: new Date().toISOString(),
    }
    materials.value.push(record)
    return record
  }

  return { materialsForVisit, addMaterial }
})
