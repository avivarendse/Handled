<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, RouterLink, useRoute } from 'vue-router'
import { demoVisits, visitStatusLabels } from '../data/demoVisits'
import { useVisitMaterialsStore } from '../stores/visitMaterials'
import { validateMaterialDraft } from '../utils/visitMaterials'

const route = useRoute()
const visitMaterialsStore = useVisitMaterialsStore()
const draft = reactive({ name: '', quantity: '', unit: '' })
const validationErrors = ref({})
const confirmationMessage = ref('')
const visit = computed(() =>
  demoVisits.find((candidate) => String(candidate.id) === route.params.visitId),
)
const canAddMaterials = computed(() => visit.value?.status === 'IN_PROGRESS')
const visitMaterials = computed(() =>
  visit.value ? visitMaterialsStore.materialsForVisit(visit.value.id) : [],
)
const hasUnsavedInput = computed(
  () => draft.name !== '' || draft.quantity !== '' || draft.unit !== '',
)
const materialDateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function clearFieldError(field) {
  if (validationErrors.value[field]) {
    const errors = { ...validationErrors.value }
    delete errors[field]
    validationErrors.value = errors
  }
  confirmationMessage.value = ''
}

function addMaterial() {
  confirmationMessage.value = ''
  const { errors, material } = validateMaterialDraft(draft)
  validationErrors.value = errors
  if (!material || !visit.value || !canAddMaterials.value) return

  visitMaterialsStore.addMaterial(visit.value.id, material)
  draft.name = ''
  draft.quantity = ''
  draft.unit = ''
  validationErrors.value = {}
  confirmationMessage.value = `${material.name} added to this visit. Changes are temporary and reset when this app reloads.`
}

function allowNavigation() {
  return (
    !hasUnsavedInput.value ||
    window.confirm('This material has not been added. Leave this page anyway?')
  )
}

function protectReload(event) {
  if (!hasUnsavedInput.value) return
  event.preventDefault()
  event.returnValue = ''
}

function resetForm() {
  draft.name = ''
  draft.quantity = ''
  draft.unit = ''
  validationErrors.value = {}
  confirmationMessage.value = ''
}

onBeforeRouteLeave(allowNavigation)
onBeforeRouteUpdate((to, from) => {
  if (to.params.visitId === from.params.visitId) return true
  return allowNavigation()
})
watch(
  () => route.params.visitId,
  () => {
    resetForm()
  },
)
onMounted(() => window.addEventListener('beforeunload', protectReload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', protectReload))
</script>

<template>
  <main class="page-container materials-page">
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
      <header class="materials-header">
        <p class="eyebrow">Materials used</p>
        <h1>{{ visit.job.title }}</h1>
        <p class="customer">{{ visit.job.customer }}</p>
        <p class="visit-status">{{ visitStatusLabels[visit.status] }}</p>
      </header>

      <section class="materials-section" aria-labelledby="add-material-heading">
        <template v-if="canAddMaterials">
          <div class="section-heading">
            <h2 id="add-material-heading">Add material</h2>
            <p>
              Demonstration changes are temporary and reset when this app reloads. The in-progress
              check is prototype-only, not server authorization.
            </p>
          </div>

          <form class="material-form" novalidate @submit.prevent="addMaterial">
            <div class="field">
              <label for="material-name">Material name</label>
              <input
                id="material-name"
                v-model="draft.name"
                type="text"
                autocomplete="off"
                required
                :aria-invalid="Boolean(validationErrors.name)"
                :aria-describedby="validationErrors.name ? 'material-name-error' : 'material-name-hint'"
                @input="clearFieldError('name')"
              />
              <p id="material-name-hint" class="field-guidance">Up to 150 characters.</p>
              <p
                v-if="validationErrors.name"
                id="material-name-error"
                class="field-error"
                role="alert"
              >
                {{ validationErrors.name }}
              </p>
            </div>

            <div class="quantity-unit-fields">
              <div class="field">
                <label for="material-quantity">Quantity</label>
                <input
                  id="material-quantity"
                  v-model="draft.quantity"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  required
                  :aria-invalid="Boolean(validationErrors.quantity)"
                  :aria-describedby="
                    validationErrors.quantity
                      ? 'material-quantity-hint material-quantity-error'
                      : 'material-quantity-hint'
                  "
                  @input="clearFieldError('quantity')"
                />
                <p id="material-quantity-hint" class="field-guidance">
                  Positive quantity; up to two decimal places, maximum 99999999.99. Prototype
                  validation only.
                </p>
                <p
                  v-if="validationErrors.quantity"
                  id="material-quantity-error"
                  class="field-error"
                  role="alert"
                >
                  {{ validationErrors.quantity }}
                </p>
              </div>

              <div class="field">
                <label for="material-unit">Unit</label>
                <input
                  id="material-unit"
                  v-model="draft.unit"
                  type="text"
                  autocomplete="off"
                  required
                  :aria-invalid="Boolean(validationErrors.unit)"
                  :aria-describedby="validationErrors.unit ? 'material-unit-error' : 'material-unit-hint'"
                  @input="clearFieldError('unit')"
                />
                <p id="material-unit-hint" class="field-guidance">Free text, up to 30 characters.</p>
                <p
                  v-if="validationErrors.unit"
                  id="material-unit-error"
                  class="field-error"
                  role="alert"
                >
                  {{ validationErrors.unit }}
                </p>
              </div>
            </div>

            <button class="primary-action" type="submit">Add material</button>
            <p v-if="confirmationMessage" class="success-message" role="status" aria-live="polite">
              {{ confirmationMessage }}
            </p>
          </form>
        </template>
        <template v-else>
          <div class="section-heading">
            <h2 id="add-material-heading">Materials</h2>
            <p>Changes are temporary and reset when this app reloads.</p>
          </div>
          <p class="read-only-message">
            This prototype only permits recording materials while a visit is in progress; this is
            not server authorization. Existing records remain available to view.
          </p>
        </template>
      </section>

      <section class="recorded-section" aria-labelledby="recorded-heading">
        <div class="section-heading">
          <h2 id="recorded-heading">Recorded materials</h2>
        </div>
        <p v-if="visitMaterials.length === 0" class="empty-state">
          No materials have been recorded for this visit yet.
        </p>
        <ul v-else class="material-list" aria-label="Materials recorded for this visit">
          <li v-for="material in visitMaterials" :key="material.id" class="material-row">
            <span class="material-name">{{ material.name }}</span>
            <span class="material-measure">
              <span class="material-quantity">{{ material.quantity }}</span>
              <span class="material-unit">{{ material.unit }}</span>
            </span>
            <time class="material-date" :datetime="material.createdAt">
              {{ materialDateFormat.format(new Date(material.createdAt)) }}
            </time>
          </li>
        </ul>
      </section>
    </template>

    <section v-else class="not-found" aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">Visit not found</h1>
      <p>Visit {{ route.params.visitId }} could not be found in the demonstration appointments.</p>
    </section>
  </main>
</template>

<style scoped>
.materials-page {
  min-width: 0;
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
.materials-header {
  min-width: 0;
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
.materials-section,
.recorded-section {
  min-width: 0;
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
.section-heading > p,
.field-guidance,
.read-only-message {
  margin: 0;
  color: #606b65;
  font-size: 13px;
}
.material-form {
  display: grid;
  gap: 16px;
  max-width: 760px;
  margin-top: 16px;
}
.field {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 7px;
}
label {
  font-size: 14px;
  font-weight: 500;
}
input {
  width: 100%;
  min-width: 0;
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid #c9d1cc;
  border-radius: 4px;
  background: white;
  color: inherit;
  font: inherit;
  font-size: 16px;
}
input[aria-invalid='true'] {
  border-color: #9c3e36;
}
.quantity-unit-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}
.field-guidance {
  line-height: 1.45;
}
.field-error {
  margin: 0;
  color: #9c3e36;
  font-size: 14px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.primary-action {
  width: 100%;
  min-height: 48px;
  margin-top: 2px;
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
.read-only-message,
.empty-state {
  margin: 16px 0 0;
  line-height: 1.5;
}
.read-only-message {
  color: #606b65;
  font-size: 13px;
}
.material-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.material-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 5px 16px;
  min-width: 0;
  padding: 12px 0;
  border-bottom: 1px solid #d9ddda;
}
.material-name {
  min-width: 0;
  font-size: 15px;
  overflow-wrap: anywhere;
}
.material-measure {
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.material-quantity {
  white-space: nowrap;
}
.material-unit {
  max-width: 12ch;
  color: #52605c;
  overflow-wrap: anywhere;
}
.material-date {
  grid-column: 1 / -1;
  color: #606b65;
  font-size: 12px;
}
.not-found {
  padding-block: 12px 24px;
}
.not-found p {
  color: #606b65;
}
@media (min-width: 560px) {
  .quantity-unit-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 768px) {
  .materials-page {
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
  .material-row {
    grid-template-columns: minmax(0, 1fr) minmax(140px, 220px) minmax(150px, auto);
    align-items: center;
  }
  .material-date {
    grid-column: auto;
    text-align: right;
  }
}
</style>
