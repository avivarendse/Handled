<script setup>
import { useVisitsStore } from '../stores/visits'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, RouterLink, useRoute } from 'vue-router'
import { visitStatusLabels } from '../data/demoVisits'
import { useVisitNotesStore } from '../stores/visitNotes'

const visitsStore = useVisitsStore()
const route = useRoute()
const visitNotesStore = useVisitNotesStore()
const draft = ref('')
const validationMessage = ref('')
const confirmationMessage = ref('')
const visit = computed(() => visitsStore.visitById(route.params.visitId))
const job = computed(() => visitsStore.jobById(visit.value?.jobId))
const canAddNotes = computed(() => visitsStore.canAddRecords(route.params.visitId))
const visitNotes = computed(() =>
  visit.value ? visitNotesStore.notesForVisit(visit.value.id) : [],
)
const noteDateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function clearFeedback() {
  validationMessage.value = ''
  confirmationMessage.value = ''
}

function addNote() {
  clearFeedback()
  const text = draft.value.trim()
  if (!text) {
    validationMessage.value = 'Enter a note before adding it.'
    return
  }

  if (!visitNotesStore.addNote(visit.value?.id, text)) return
  draft.value = ''
  confirmationMessage.value = 'Note added. Changes are temporary and reset when this app reloads.'
}

function allowNavigation() {
  return draft.value.length === 0 || window.confirm('This note has not been added. Leave anyway?')
}

function protectReload(event) {
  if (draft.value.length === 0) return
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
    draft.value = ''
    clearFeedback()
  },
)
onMounted(() => window.addEventListener('beforeunload', protectReload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', protectReload))
</script>

<template>
  <main class="page-container notes-page">
    <RouterLink
      v-if="visit"
      class="back-link"
      :to="{ name: 'visit-details', params: { visitId: visit.id } }"
    >
      Back to visit
    </RouterLink>
    <RouterLink v-else class="back-link" :to="{ name: 'my-visits' }">
      Back to my visits
    </RouterLink>

    <template v-if="visit">
      <header class="notes-header">
        <p class="eyebrow">Visit notes</p>
        <h1>{{ job.title }}</h1>
        <p class="customer">{{ job.customer }}</p>
        <p class="visit-status">{{ visitStatusLabels[visit.status] }}</p>
      </header>

      <section class="notes-section" aria-labelledby="notes-heading">
        <div class="section-heading">
          <h2 id="notes-heading">Notes</h2>
          <p>Changes are temporary and reset when this app reloads.</p>
        </div>

        <p v-if="!visitNotes.length" class="empty-state">
          {{
            canAddNotes
              ? 'No notes yet. Add the first note below.'
              : 'No notes have been recorded for this visit.'
          }}
        </p>
        <ol v-else class="notes-list">
          <li v-for="note in visitNotes" :key="note.id" class="note-entry">
            <time :datetime="note.createdAt">{{ noteDateFormat.format(new Date(note.createdAt)) }}</time>
            <p class="note-text">{{ note.text }}</p>
          </li>
        </ol>

        <form v-if="canAddNotes" class="note-form" novalidate @submit.prevent="addNote">
          <label for="note-draft">Add a note</label>
          <textarea
            id="note-draft"
            v-model="draft"
            rows="4"
            :aria-invalid="Boolean(validationMessage)"
            :aria-describedby="
              validationMessage ? 'note-guidance note-error' : 'note-guidance'
            "
            @input="clearFeedback"
          ></textarea>
          <p id="note-guidance" class="field-guidance">
            Unsaved text is protected when you navigate away.
          </p>
          <p v-if="validationMessage" id="note-error" class="field-error" role="alert">
            {{ validationMessage }}
          </p>
          <button class="primary-action" type="submit">Add note</button>
          <p v-if="confirmationMessage" class="success-message" role="status" aria-live="polite">
            {{ confirmationMessage }}
          </p>
        </form>
        <p v-else class="read-only-message">
          Notes can only be added while a visit is in progress.
        </p>
      </section>
    </template>

    <section v-else class="not-found" aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">Visit not found</h1>
      <p>Visit {{ route.params.visitId }} could not be found in the demonstration appointments.</p>
    </section>
  </main>
</template>

<style scoped>
.notes-page {
  padding-block: 24px 32px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
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
.notes-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #d9ddda;
}
.eyebrow,
.customer,
.visit-status {
  margin: 0;
  color: #606b65;
  font-size: 14px;
}
.eyebrow {
  margin-bottom: 4px;
  font-size: 13px;
}
h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.045em;
  overflow-wrap: anywhere;
}
.customer {
  margin-top: 6px;
  color: #26322c;
}
.visit-status {
  margin-top: 6px;
}
.notes-section {
  padding-top: 18px;
}
.section-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #d9ddda;
}
h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}
.section-heading p,
.field-guidance,
.read-only-message {
  margin: 0;
  color: #606b65;
  font-size: 13px;
}
.notes-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.note-entry {
  padding: 16px 0;
  border-bottom: 1px solid #d9ddda;
}
.note-entry time {
  color: #606b65;
  font-size: 13px;
}
.note-text {
  max-width: 70ch;
  margin: 6px 0 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.empty-state {
  margin: 16px 0;
  color: #52605c;
}
.note-form {
  display: grid;
  gap: 8px;
  max-width: 72ch;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #d9ddda;
}
label {
  font-size: 14px;
  font-weight: 500;
}
textarea {
  width: 100%;
  min-height: 128px;
  padding: 12px;
  border: 1px solid #c9d1cc;
  border-radius: 4px;
  background: white;
  color: inherit;
  font: inherit;
  line-height: 1.5;
  resize: vertical;
}
textarea[aria-invalid='true'] {
  border-color: #9c3e36;
}
.field-error {
  margin: 0;
  color: #9c3e36;
  font-size: 14px;
}
.primary-action {
  width: 100%;
  min-height: 48px;
  margin-top: 4px;
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
.success-message {
  margin: 0;
  color: #315e48;
  font-size: 14px;
}
.read-only-message {
  margin-top: 16px;
}
.not-found {
  padding-block: 12px 24px;
}
.not-found p {
  color: #606b65;
}
@media (min-width: 768px) {
  .notes-page {
    padding-block: 32px;
  }
  h1 {
    font-size: 32px;
  }
  .primary-action {
    width: auto;
    min-width: 160px;
    justify-self: start;
  }
}
</style>
