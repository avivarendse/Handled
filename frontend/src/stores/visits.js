import { defineStore } from 'pinia'
import { createDemoJobs, createDemoVisits } from '../data/demoVisits'

function isOutstanding(visit) {
  return visit.status === 'SCHEDULED' || visit.status === 'IN_PROGRESS'
}

export const useVisitsStore = defineStore('visits', {
  state: () => ({ jobs: createDemoJobs(), visits: createDemoVisits() }),

  getters: {
    visitById: (state) => (id) => state.visits.find((visit) => String(visit.id) === String(id)),
    jobById: (state) => (id) => state.jobs.find((job) => job.id === id),
    eligibilityError() {
      return (visitId, requiredStatus) => {
        const visit = this.visitById(visitId)
        if (!visit) return 'Visit not found.'
        const job = this.jobById(visit.jobId)
        if (!job) return 'Parent job not found.'
        if (visit.status !== requiredStatus) return `Visit must be ${requiredStatus}.`
        if (job.status !== requiredStatus) return `Parent job must be ${requiredStatus}.`
        if (
          this.visits.some(
            (other) => other.id !== visit.id && other.jobId === job.id && isOutstanding(other),
          )
        )
          return 'Another visit is outstanding for this job.'
        return null
      }
    },
    canAddRecords() {
      return (visitId) => !this.eligibilityError(visitId, 'IN_PROGRESS')
    },
  },

  actions: {
    startVisit(visitId) {
      const error = this.eligibilityError(visitId, 'SCHEDULED')
      if (error) return { ok: false, error }

      const visit = this.visitById(visitId)
      this.$patch(() => {
        visit.status = 'IN_PROGRESS'
        this.jobById(visit.jobId).status = 'IN_PROGRESS'
      })
      return { ok: true }
    },

    completeVisit(visitId, details) {
      const error = this.eligibilityError(visitId, 'IN_PROGRESS')
      if (error) return { ok: false, error }
      const summary = details?.summary
      if (typeof summary !== 'string' || !summary.trim()) {
        return { ok: false, error: 'Enter a completion summary.' }
      }
      const outcome = details?.outcome
      if (outcome !== 'JOB_COMPLETE' && outcome !== 'FOLLOW_UP_REQUIRED') {
        return { ok: false, error: 'Select a valid completion outcome.' }
      }

      const visit = this.visitById(visitId)
      const completedAt = new Date().toISOString()
      this.$patch(() => {
        visit.status = 'COMPLETED'
        visit.completionSummary = summary.trim()
        visit.completedAt = completedAt
        // Prototype-only outcome identifies the visit that completed the job for later sign-off.
        visit.completionOutcome = outcome
        this.jobById(visit.jobId).status =
          outcome === 'JOB_COMPLETE' ? 'COMPLETED' : 'FOLLOW_UP_REQUIRED'
      })
      return { ok: true }
    },
  },
})
