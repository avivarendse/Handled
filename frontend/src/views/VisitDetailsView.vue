<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { demoVisits, visitStatusLabels } from '../data/demoVisits'

const route = useRoute()
const visit = computed(() =>
  demoVisits.find((candidate) => String(candidate.id) === route.params.visitId),
)
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
          <h1>{{ visit.job.title }}</h1>
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
              <dd>{{ visit.job.customer }}</dd>
            </div>
            <div>
              <dt>Service address</dt>
              <dd>{{ visit.job.site }}</dd>
            </div>
            <div>
              <dt>Work description</dt>
              <dd class="description">{{ visit.job.description }}</dd>
            </div>
          </dl>
        </section>
      </div>

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
      'details details';
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
