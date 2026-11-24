<script setup>
import { useVisitsStore } from '../stores/visits'
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { visitStatusLabels } from '../data/demoVisits'
import { useVisitNotesStore } from '../stores/visitNotes'
import { useVisitPhotosStore } from '../stores/visitPhotos'
import { useVisitMaterialsStore } from '../stores/visitMaterials'

const visitsStore = useVisitsStore()
const route = useRoute()
const visitNotesStore = useVisitNotesStore()
const visitPhotosStore = useVisitPhotosStore()
const visitMaterialsStore = useVisitMaterialsStore()
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
const actionLabel = computed(() => {
  if (visit.value?.status === 'SCHEDULED') return 'Start visit'
  if (visit.value?.status === 'IN_PROGRESS') return 'Complete visit'
  return ''
})
</script>

<template>
  <main class="page-container details-page">
    <RouterLink class="back-link" :to="{ name: 'my-visits' }">Back to my visits</RouterLink>
    <article v-if="visit" class="visit-detail">
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
        v-if="visit.status === 'IN_PROGRESS'"
        class="records-section"
        aria-labelledby="records-heading"
      >
        <div class="records-heading">
          <h2 id="records-heading">Visit records</h2>
          <p>Notes, photos and materials are temporary demonstration records.</p>
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
        <button class="primary-action" type="button" disabled aria-describedby="demo-action-note">
          {{ actionLabel }}
        </button>
        <p id="demo-action-note">
          Demonstration only. This action will not change the visit status.
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
}
.primary-action:disabled {
  border: 1px solid #c9d1cc;
  background: #e4e9e5;
  color: #56605c;
  cursor: not-allowed;
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
    'records'
    'action';
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
      'records records';
    column-gap: 32px;
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
