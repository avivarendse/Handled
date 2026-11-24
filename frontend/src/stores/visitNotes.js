import { ref } from 'vue'
import { defineStore } from 'pinia'
import { demoVisitRecords } from '../data/demoVisits'

export const useVisitNotesStore = defineStore('visit-notes', () => {
  const notes = ref(
    demoVisitRecords
      .filter((record) => record.category === 'notes')
      .map(({ id, visitId, text, createdAt }) => ({ id, visitId, text, createdAt })),
  )
  let nextId = Math.max(0, ...demoVisitRecords.map((record) => record.id)) + 1

  function notesForVisit(visitId) {
    return notes.value
      .filter((note) => note.visitId === Number(visitId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
  }

  function addNote(visitId, text) {
    const note = {
      id: nextId++,
      visitId: Number(visitId),
      text,
      createdAt: new Date().toISOString(),
    }
    notes.value.push(note)
    return note
  }

  return { notesForVisit, addNote }
})
