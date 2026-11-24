<script setup>
import { useVisitsStore } from '../stores/visits'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, RouterLink } from 'vue-router'
import { visitStatusLabels } from '../data/demoVisits'
import { useVisitNotesStore } from '../stores/visitNotes'
import { useVisitPhotosStore } from '../stores/visitPhotos'
import { useVisitMaterialsStore } from '../stores/visitMaterials'

const visitsStore = useVisitsStore()
const route = useRoute()
const visitNotesStore = useVisitNotesStore()
const visitPhotosStore = useVisitPhotosStore()
const visitMaterialsStore = useVisitMaterialsStore()
const completionFormOpen = ref(false)
const completionDraft = reactive({ summary: '', outcome: '' })
const completionErrors = ref({})
const actionError = ref('')
const startSuccessMessage = ref('')
const completionSuccessMessage = ref('')
const completionSummaryInput = ref(null)
const completionOutcomeGroup = ref(null)
const completionActionButton = ref(null)
const completionResultHeading = ref(null)
const visit = computed(() => visitsStore.visitById(route.params.visitId))
const job = computed(() => visitsStore.jobById(visit.value?.jobId))
const scheduledDate = computed(() =>
  visit.value
    ? new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'full',
        timeZone: 'UTC',
      }).format(new Date(`${visit.value.start.slice(0, 10)}T00:00:00Z`))
    : '',
)
const timeRange = computed(() =>
  visit.value ? `${visit.value.start.slice(11)}–${visit.value.end}` : '',
)
const recordCounts = computed(() =>
  visit.value
    ? {
        notes: visitNotesStore.notesForVisit(visit.value.id).length,
        photos: visitPhotosStore.photosForVisit(visit.value.id).length,
        materials: visitMaterialsStore.materialsForVisit(visit.value.id).length,
      }
    : { notes: 0, photos: 0, materials: 0 },
)
const showVisitRecords = computed(
  () => visit.value?.status === 'IN_PROGRESS' || visit.value?.status === 'COMPLETED',
)
const actionLabel = computed(() => {
  if (visit.value?.status === 'SCHEDULED') return 'Start visit'
  if (visit.value?.status === 'IN_PROGRESS' && !completionFormOpen.value) return 'Complete visit'
  return ''
})
const hasUnsavedCompletionDraft = computed(
  () =>
    completionFormOpen.value &&
    (completionDraft.summary.length > 0 || completionDraft.outcome.length > 0),
)
const completionOutcomeLabel = computed(() => {
  if (visit.value?.completionOutcome === 'JOB_COMPLETE') return 'Job complete'
  if (visit.value?.completionOutcome === 'FOLLOW_UP_REQUIRED') return 'Follow-up required'
  return ''
})
const formattedCompletedAt = computed(() => {
  if (!visit.value?.completedAt) return ''
  const completedAt = new Date(visit.value.completedAt)
  if (Number.isNaN(completedAt.getTime())) return ''
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg',
  }).format(completedAt)
})
const hasCompletionMetadata = computed(
  () =>
    Boolean(visit.value?.completionSummary) ||
    Boolean(completionOutcomeLabel.value) ||
    Boolean(formattedCompletedAt.value),
)

function resetCompletionDraft() {
  completionDraft.summary = ''
  completionDraft.outcome = ''
  completionErrors.value = {}
  actionError.value = ''
}

function startVisit() {
  actionError.value = ''
  startSuccessMessage.value = ''
  completionSuccessMessage.value = ''
  const result = visitsStore.startVisit(visit.value.id)
  if (!result.ok) {
    actionError.value = result.error
    return
  }
  startSuccessMessage.value = 'Visit started. Notes, photos and materials are now available.'
}

function openCompletionForm() {
  actionError.value = ''
  startSuccessMessage.value = ''
  completionSuccessMessage.value = ''
  completionFormOpen.value = true
  nextTick(() => completionSummaryInput.value?.focus())
}

function clearCompletionError(field) {
  if (completionErrors.value[field]) {
    const errors = { ...completionErrors.value }
    delete errors[field]
    completionErrors.value = errors
  }
  actionError.value = ''
}

async function submitCompletion() {
  actionError.value = ''
  completionSuccessMessage.value = ''
  const errors = {}
  if (!completionDraft.summary.trim()) errors.summary = 'Enter a completion summary.'
  if (!completionDraft.outcome) errors.outcome = 'Select a visit outcome.'
  completionErrors.value = errors

  if (Object.keys(errors).length > 0) {
    await nextTick()
    if (errors.summary) completionSummaryInput.value?.focus()
    else completionOutcomeGroup.value?.querySelector('input')?.focus()
    return
  }

  const result = visitsStore.completeVisit(visit.value.id, {
    summary: completionDraft.summary,
    outcome: completionDraft.outcome,
  })
  if (!result.ok) {
    actionError.value = result.error
    return
  }

  completionFormOpen.value = false
  resetCompletionDraft()
  startSuccessMessage.value = ''
  completionSuccessMessage.value = 'Visit completed. Saved visit records are now read-only.'
  nextTick(() => completionResultHeading.value?.focus())
}

function cancelCompletion() {
  if (
    hasUnsavedCompletionDraft.value &&
    !window.confirm('This completion form has unsaved input. Discard it and close the form?')
  ) {
    return
  }

  completionFormOpen.value = false
  resetCompletionDraft()
  nextTick(() => completionActionButton.value?.focus())
}

function allowNavigation() {
  return (
    !hasUnsavedCompletionDraft.value ||
    window.confirm('This completion form has unsaved input. Leave this page anyway?')
  )
}

function protectReload(event) {
  if (!hasUnsavedCompletionDraft.value) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave(allowNavigation)
onBeforeRouteUpdate((to, from) => {
  if (to.params.visitId === from.params.visitId) return true
  return allowNavigation()
})
watch(
  () => route.params.visitId,
  () => {
    completionFormOpen.value = false
    resetCompletionDraft()
    startSuccessMessage.value = ''
    completionSuccessMessage.value = ''
  },
)
onMounted(() => window.addEventListener('beforeunload', protectReload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', protectReload))
</script>

<template>
  <main class="page-container details-page">
    <RouterLink class="back-link" :to="{ name: 'my-visits' }">Back to my visits</RouterLink>
    <article v-if="visit" class="visit-detail" :class="{ 'completion-open': completionFormOpen }">
      <header class="page-heading">
        <div class="title-stack">
          <h1>{{ job.title }}</h1>
          <p class="status" :class="{ active: visit.status === 'IN_PROGRESS' }">
            {{ visitStatusLabels[visit.status] }}
          </p>
        </div>
      </header>

      <div class="details-grid">
        <section class="details-section" aria-labelledby="appointment-heading">
          <h2 id="appointment-heading">Appointment</h2>
          <dl class="field-list">
            <div>
              <dt>Scheduled date</dt>
              <dd>{{ scheduledDate }}</dd>
            </div>
            <div>
              <dt>Appointment time</dt>
              <dd>
                <time :datetime="visit.start">{{ timeRange }}</time>
              </dd>
            </div>
          </dl>
        </section>

        <section class="details-section" aria-labelledby="work-heading">
          <h2 id="work-heading">Work details</h2>
          <dl class="field-list">
            <div>
              <dt>Customer</dt>
              <dd>{{ job.customer }}</dd>
            </div>
            <div>
              <dt>Service address</dt>
              <dd>{{ job.site }}</dd>
            </div>
            <div>
              <dt>Work description</dt>
              <dd class="description">{{ job.description }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section
        v-if="visit.status === 'COMPLETED' && hasCompletionMetadata"
        class="completion-details"
        aria-labelledby="completion-details-heading"
      >
        <h2 id="completion-details-heading" ref="completionResultHeading" tabindex="-1">
          Completion details
        </h2>
        <p
          v-if="completionSuccessMessage"
          class="completion-success"
          role="status"
          aria-live="polite"
        >
          {{ completionSuccessMessage }}
        </p>
        <dl class="completion-fields">
          <div v-if="visit.completionSummary">
            <dt>Completion summary</dt>
            <dd class="completion-summary-text">{{ visit.completionSummary }}</dd>
          </div>
          <div v-if="completionOutcomeLabel">
            <dt>Visit outcome</dt>
            <dd>{{ completionOutcomeLabel }}</dd>
          </div>
          <div v-if="formattedCompletedAt">
            <dt>Completed</dt>
            <dd><time :datetime="visit.completedAt">{{ formattedCompletedAt }}</time></dd>
          </div>
        </dl>
      </section>

      <section
        v-if="completionFormOpen"
        class="completion-form-section"
        aria-labelledby="completion-form-heading"
      >
        <div class="section-heading">
          <h2 id="completion-form-heading">Complete visit</h2>
          <p>Saving will complete this visit and apply the selected job outcome.</p>
        </div>
        <form class="completion-form" novalidate @submit.prevent="submitCompletion">
          <div class="completion-field">
            <label for="completion-summary">Completion summary</label>
            <textarea
              id="completion-summary"
              ref="completionSummaryInput"
              v-model="completionDraft.summary"
              rows="5"
              placeholder="Summarise the work completed and any findings."
              :aria-invalid="Boolean(completionErrors.summary)"
              :aria-describedby="
                completionErrors.summary ? 'completion-summary-error' : 'completion-summary-hint'
              "
              @input="clearCompletionError('summary')"
            ></textarea>
            <p id="completion-summary-hint" class="field-guidance">
              Describe the work completed or what further work is needed.
            </p>
            <p
              v-if="completionErrors.summary"
              id="completion-summary-error"
              class="field-error"
              role="alert"
            >
              {{ completionErrors.summary }}
            </p>
          </div>

          <fieldset
            ref="completionOutcomeGroup"
            class="outcome-fieldset"
            :aria-invalid="Boolean(completionErrors.outcome)"
            :aria-describedby="completionErrors.outcome ? 'completion-outcome-error' : null"
          >
            <legend>Visit outcome</legend>
            <label class="outcome-option">
              <input
                v-model="completionDraft.outcome"
                type="radio"
                name="completion-outcome"
                value="JOB_COMPLETE"
                @change="clearCompletionError('outcome')"
              />
              <span class="outcome-copy">
                <span class="outcome-title">Job complete</span>
                <span class="outcome-description">
                  All required work is finished. No further visit is needed.
                </span>
              </span>
            </label>
            <label class="outcome-option">
              <input
                v-model="completionDraft.outcome"
                type="radio"
                name="completion-outcome"
                value="FOLLOW_UP_REQUIRED"
                @change="clearCompletionError('outcome')"
              />
              <span class="outcome-copy">
                <span class="outcome-title">Follow-up required</span>
                <span class="outcome-description">
                  This appointment is finished, but more work is needed. A manager will arrange
                  another visit.
                </span>
              </span>
            </label>
            <p
              v-if="completionErrors.outcome"
              id="completion-outcome-error"
              class="field-error"
              role="alert"
            >
              {{ completionErrors.outcome }}
            </p>
          </fieldset>

          <p v-if="completionDraft.outcome" class="outcome-consequence" aria-live="polite">
            <template v-if="completionDraft.outcome === 'JOB_COMPLETE'">
              If submitted, this visit and the overall job will be completed.
            </template>
            <template v-else>
              If submitted, this visit will be completed and the job will require another
              appointment.
            </template>
            Saved visit records become read-only after completion. Selecting an outcome alone does
            not change any state.
          </p>

          <p v-if="actionError" class="field-error submission-error" role="alert">
            {{ actionError }}
          </p>
          <div class="completion-actions">
            <button class="primary-action" type="submit">Complete visit</button>
            <button class="secondary-action" type="button" @click="cancelCompletion">
              Cancel
            </button>
          </div>
        </form>
      </section>

      <section
        v-if="showVisitRecords"
        class="records-section"
        aria-labelledby="records-heading"
      >
        <div class="records-heading">
          <h2 id="records-heading">Visit records</h2>
          <p v-if="visit.status === 'COMPLETED'">Saved visit records are read-only.</p>
          <p v-else>Notes, photos and materials are temporary demonstration records.</p>
        </div>
        <ul class="record-list">
          <li class="record-row">
            <RouterLink
              class="record-link"
              :to="{ name: 'visit-notes', params: { visitId: visit.id } }"
            >
              <span>Notes</span>
              <span class="record-meta">
                <span class="record-count">{{ recordCounts.notes }}</span>
              </span>
            </RouterLink>
          </li>
          <li class="record-row">
            <RouterLink
              class="record-link"
              :to="{ name: 'visit-photos', params: { visitId: visit.id } }"
            >
              <span>Photos</span>
              <span class="record-meta">
                <span class="record-count">{{ recordCounts.photos }}</span>
              </span>
            </RouterLink>
          </li>
          <li class="record-row">
            <RouterLink
              class="record-link"
              :to="{ name: 'visit-materials', params: { visitId: visit.id } }"
            >
              <span>Materials</span>
              <span class="record-meta">
                <span class="record-count">{{ recordCounts.materials }}</span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <div v-if="actionLabel" class="action-section">
        <button
          v-if="visit.status === 'SCHEDULED'"
          class="primary-action"
          type="button"
          @click="startVisit"
        >
          Start visit
        </button>
        <button
          v-else
          ref="completionActionButton"
          class="primary-action"
          type="button"
          @click="openCompletionForm"
        >
          Complete visit
        </button>
        <p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p>
        <p v-if="startSuccessMessage" class="success-message" role="status" aria-live="polite">
          {{ startSuccessMessage }}
        </p>
      </div>
    </article>

    <section v-else class="not-found" aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">Visit not found</h1>
      <p>Visit {{ route.params.visitId }} could not be found in the demonstration appointments.</p>
    </section>
  </main>
</template>

<style scoped>
.details-page {
  padding-block: 24px 32px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  margin-left: -8px;
  margin-bottom: 12px;
  padding-inline: 8px;
  color: #315e48;
  font-size: 14px;
  text-decoration: none;
}
.back-link::before {
  width: 7px;
  height: 7px;
  border: solid currentColor;
  border-width: 0 0 1px 1px;
  content: '';
  transform: rotate(45deg);
}
.page-heading {
  grid-area: heading;
}
h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.045em;
  overflow-wrap: anywhere;
}
.status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0;
  color: #505d59;
  font-size: 14px;
}
.status::before {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #939c98;
  content: '';
}
.status.active::before {
  background: #4b7762;
}
.details-section {
  padding-block: 18px;
  border-bottom: 1px solid #d9ddda;
}
h2 {
  margin: 0 0 12px;
  font-size: 17px;
  font-weight: 500;
}
.field-list {
  display: grid;
  gap: 14px;
  margin: 0;
}
.details-grid {
  grid-area: details;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin-top: 16px;
  border-top: 1px solid #d9ddda;
}
dt {
  color: #606b65;
  font-size: 13px;
}
dd {
  margin: 4px 0 0;
  font-size: 16px;
  overflow-wrap: anywhere;
}
.description {
  max-width: 65ch;
}
.completion-form-section,
.completion-details {
  grid-area: completion;
  min-width: 0;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #d9ddda;
}
.completion-form-section h2,
.completion-details h2 {
  margin-bottom: 12px;
}
.completion-fields {
  display: grid;
  gap: 16px;
  margin: 0;
}
.completion-summary-text {
  max-width: 80ch;
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.completion-success {
  margin: 0 0 12px;
  color: #315e48;
  font-size: 14px;
}
.completion-form {
  display: grid;
  gap: 20px;
  max-width: 760px;
  margin-top: 16px;
}
.completion-field {
  display: grid;
  gap: 8px;
}
.completion-field label,
.outcome-fieldset legend {
  font-size: 14px;
  font-weight: 500;
}
.completion-field textarea {
  width: 100%;
  min-height: 140px;
  padding: 12px;
  border: 1px solid #c9d1cc;
  border-radius: 4px;
  background: white;
  color: inherit;
  font: inherit;
  line-height: 1.5;
  resize: vertical;
}
.completion-field textarea[aria-invalid='true'] {
  border-color: #9c3e36;
}
.completion-field textarea::placeholder {
  color: #707a75;
  opacity: 1;
}
.field-guidance,
.outcome-description {
  color: #606b65;
  font-size: 13px;
  line-height: 1.5;
}
.field-guidance {
  margin: 0;
}
.field-error,
.action-error {
  margin: 0;
  color: #9c3e36;
  font-size: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.outcome-fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.outcome-fieldset legend {
  margin-bottom: 8px;
  padding: 0;
}
.outcome-option {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  min-height: 56px;
  padding: 10px 0;
  border-bottom: 1px solid #d9ddda;
  cursor: pointer;
}
.outcome-option input {
  width: 20px;
  height: 20px;
  margin: 2px 0 0;
  accent-color: #355e4e;
}
.outcome-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.outcome-title {
  font-size: 15px;
  font-weight: 500;
}
.outcome-description {
  overflow-wrap: anywhere;
}
.outcome-consequence {
  margin: 0;
  padding: 10px 12px;
  border-left: 3px solid #8da296;
  color: #424d47;
  font-size: 14px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.submission-error {
  margin-top: -8px;
}
.completion-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.records-section {
  grid-area: records;
  margin-top: 0;
  padding-top: 16px;
}
.records-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 16px;
}
.records-heading h2 {
  margin-bottom: 0;
}
.records-heading p {
  margin: 0;
  color: #606b65;
  font-size: 13px;
}
.record-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
}
.record-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 48px;
  border-bottom: 1px solid #d9ddda;
}
.record-link {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 48px;
  color: inherit;
  text-decoration: none;
}
.record-meta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.record-meta::after {
  width: 7px;
  height: 7px;
  border: solid currentColor;
  border-width: 0 1px 1px 0;
  content: '';
  transform: rotate(-45deg);
}
.record-count {
  color: #606b65;
  font-size: 13px;
  text-align: right;
}
.action-section {
  grid-area: action;
  padding-top: 18px;
}
.action-error {
  margin-top: 8px;
}
.success-message {
  margin: 8px 0 0;
  color: #315e48;
  font-size: 13px;
}
.primary-action {
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  border: 0;
  border-radius: 4px;
  background: #355e4e;
  color: white;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.primary-action:hover {
  background: #2e5143;
}
.secondary-action {
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid #c9d1cc;
  border-radius: 4px;
  background: white;
  color: #424d47;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.action-section p,
.not-found p {
  margin: 8px 0 0;
  color: #606b65;
  font-size: 13px;
}
.visit-detail {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'heading'
    'details'
    'action'
    'completion'
    'records';
}
.visit-detail.completion-open {
  grid-template-areas:
    'heading'
    'details'
    'completion'
    'records';
}
.not-found {
  padding-block: 12px 24px;
}
@media (min-width: 768px) {
  .details-page {
    padding-block: 32px;
  }
  .visit-detail {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'heading action'
      'details details'
      'completion completion'
      'records records';
    column-gap: 32px;
  }
  .visit-detail.completion-open {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'heading'
      'details'
      'completion'
      'records';
  }
  .action-section {
    align-self: center;
    max-width: 320px;
    padding-top: 0;
    text-align: right;
  }
  .primary-action {
    width: auto;
  }
  .completion-actions {
    flex-direction: row;
    align-items: center;
  }
  .completion-actions .primary-action {
    min-width: 180px;
  }
  .secondary-action {
    width: auto;
    min-width: 120px;
  }
  .details-grid {
    grid-template-columns: minmax(0, 35fr) minmax(0, 65fr);
    gap: 32px;
    margin-top: 24px;
  }
  .page-heading {
    display: flex;
    align-items: flex-start;
  }
  h1 {
    font-size: 32px;
  }
}
</style>
