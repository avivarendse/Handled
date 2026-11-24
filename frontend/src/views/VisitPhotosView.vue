<script setup>
import { useVisitsStore } from '../stores/visits'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, RouterLink, useRoute } from 'vue-router'
import { visitStatusLabels } from '../data/demoVisits'
import { useVisitPhotosStore } from '../stores/visitPhotos'
import { MAX_PENDING_PHOTOS, validatePhotoFile } from '../utils/visitPhotos'

const visitsStore = useVisitsStore()
const route = useRoute()
const visitPhotosStore = useVisitPhotosStore()
const fileInput = ref(null)
const pendingPhotos = ref([])
const validationMessages = ref([])
const confirmationMessage = ref('')
const previewPhoto = ref(null)
const previewCloseButton = ref(null)
const previewTrigger = ref(null)
const unavailablePhotoIds = ref(new Set())
let nextPendingId = 1

const visit = computed(() => visitsStore.visitById(route.params.visitId))
const job = computed(() => visitsStore.jobById(visit.value?.jobId))
const canAddPhotos = computed(() => visitsStore.canAddRecords(route.params.visitId))
const visitPhotos = computed(() =>
  visit.value ? visitPhotosStore.photosForVisit(visit.value.id) : [],
)
const pendingCount = computed(() => pendingPhotos.value.length)

function clearFeedback() {
  validationMessages.value = []
  confirmationMessage.value = ''
}

function addValidationMessage(message) {
  validationMessages.value = [...validationMessages.value, message]
}

async function selectFiles(event) {
  clearFeedback()
  const files = Array.from(event.currentTarget.files || [])
  event.currentTarget.value = ''

  for (const file of files) {
    if (pendingPhotos.value.length >= MAX_PENDING_PHOTOS) {
      addValidationMessage(`You can select up to ${MAX_PENDING_PHOTOS} photos at a time.`)
      break
    }

    const error = validatePhotoFile(file)
    if (error) {
      addValidationMessage(error)
      continue
    }

    try {
      pendingPhotos.value.push({
        id: nextPendingId++,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      })
    } catch {
      addValidationMessage(
        `${file.name}: Your browser could not create a local preview. Try another image.`,
      )
    }
  }
}

function removePendingPhoto(photo, errorMessage = '') {
  const index = pendingPhotos.value.findIndex((pending) => pending.id === photo.id)
  if (index < 0) return

  const [removed] = pendingPhotos.value.splice(index, 1)
  URL.revokeObjectURL(removed.url)
  if (errorMessage) addValidationMessage(errorMessage)
}

function discardPendingPhotos() {
  for (const photo of pendingPhotos.value) URL.revokeObjectURL(photo.url)
  pendingPhotos.value = []
}

function addPhotos() {
  clearFeedback()
  if (!visit.value || !canAddPhotos.value || pendingPhotos.value.length === 0) return

  const count = pendingPhotos.value.length
  visitPhotosStore.addPhotos(visit.value.id, pendingPhotos.value)
  pendingPhotos.value = []
  confirmationMessage.value = `${count} ${count === 1 ? 'photo' : 'photos'} added to this visit. Photos are temporary and are not uploaded to a server.`
}

function allowNavigation() {
  if (pendingPhotos.value.length && !window.confirm('Discard photos that have not been added?')) {
    return false
  }

  discardPendingPhotos()
  previewPhoto.value = null
  previewTrigger.value = null
  return true
}

function protectReload(event) {
  if (pendingPhotos.value.length === 0) return
  event.preventDefault()
  event.returnValue = ''
}

function openPreview(photo, event) {
  previewPhoto.value = photo
  previewTrigger.value = event.currentTarget
  nextTick(() => previewCloseButton.value?.focus())
}

function closePreview() {
  const trigger = previewTrigger.value
  previewPhoto.value = null
  previewTrigger.value = null
  nextTick(() => {
    if (trigger?.isConnected) trigger.focus()
  })
}

function focusPreviewClose() {
  previewCloseButton.value?.focus()
}

function markPhotoUnavailable(photo) {
  unavailablePhotoIds.value = new Set(unavailablePhotoIds.value).add(photo.id)
}

function isPhotoUnavailable(photo) {
  return unavailablePhotoIds.value.has(photo.id)
}

function handlePendingImageError(photo) {
  removePendingPhoto(photo, `${photo.name}: This image could not be decoded. Choose another image.`)
}

onBeforeRouteLeave(allowNavigation)
onBeforeRouteUpdate((to, from) => {
  if (to.params.visitId === from.params.visitId) return true
  return allowNavigation()
})
watch(
  () => route.params.visitId,
  () => {
    clearFeedback()
    unavailablePhotoIds.value = new Set()
  },
)
onMounted(() => window.addEventListener('beforeunload', protectReload))
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', protectReload)
  discardPendingPhotos()
})
</script>

<template>
  <main class="page-container photos-page">
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
      <header class="photos-header">
        <p class="eyebrow">Visit photos</p>
        <h1>{{ job.title }}</h1>
        <p class="customer">{{ job.customer }}</p>
        <p class="visit-status">{{ visitStatusLabels[visit.status] }}</p>
      </header>

      <section class="photos-section" aria-labelledby="photos-heading">
        <div class="section-heading">
          <h2 id="photos-heading">Photos</h2>
          <p>Temporary demonstration only. Photos are not uploaded to a server.</p>
        </div>

        <p v-if="visitPhotos.length === 0" class="empty-state">
          No photos have been added to this visit yet.
        </p>
        <ul v-else class="photo-grid confirmed-grid" aria-label="Photos attached to this visit">
          <li v-for="photo in visitPhotos" :key="photo.id" class="photo-card">
            <button
              class="photo-preview"
              type="button"
              :aria-label="`View ${photo.name} at a larger size`"
              @click="openPreview(photo, $event)"
            >
              <img
                v-if="!isPhotoUnavailable(photo)"
                :src="photo.url"
                :alt="photo.isDemo ? `Demonstration photo: ${photo.name}` : `Added photo: ${photo.name}`"
                @error="markPhotoUnavailable(photo)"
              />
              <span v-else class="image-unavailable">Photo preview unavailable</span>
            </button>
            <p class="photo-name">{{ photo.name }}</p>
            <p v-if="photo.isDemo" class="photo-badge">Demonstration photo</p>
          </li>
        </ul>

        <section v-if="canAddPhotos" class="pending-section" aria-labelledby="pending-heading">
          <div class="section-heading pending-heading">
            <h2 id="pending-heading">Add photos</h2>
            <p class="selected-count" aria-live="polite">
              {{ pendingCount }} of {{ MAX_PENDING_PHOTOS }} selected
            </p>
          </div>

          <input
            id="visit-photo-files"
            ref="fileInput"
            class="file-input"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            multiple
            :disabled="pendingCount >= MAX_PENDING_PHOTOS"
            aria-describedby="photo-guidance"
            @change="selectFiles"
          />
          <label class="file-picker" for="visit-photo-files">Choose photos</label>
          <p id="photo-guidance" class="field-guidance">
            Select up to five JPEG, PNG or WebP images, each 10 MB or smaller. Your browser's
            native file picker may vary by device; camera access is not guaranteed. File checks
            here are for this prototype only and do not provide production upload security.
          </p>

          <ul
            v-if="pendingPhotos.length"
            class="photo-grid pending-grid"
            aria-label="Photos selected but not yet added"
          >
            <li v-for="photo in pendingPhotos" :key="photo.id" class="photo-card pending-card">
              <div class="photo-preview pending-preview">
                <img
                  :src="photo.url"
                  :alt="`Pending photo: ${photo.name}`"
                  @error="handlePendingImageError(photo)"
                />
              </div>
              <p class="photo-name">{{ photo.name }}</p>
              <span class="photo-badge pending-badge">Pending</span>
              <button
                class="remove-photo"
                type="button"
                :aria-label="`Remove ${photo.name} from selected photos`"
                @click="removePendingPhoto(photo)"
              >
                Remove
              </button>
            </li>
          </ul>

          <div v-if="validationMessages.length" class="validation-errors" role="alert">
            <p>Some photos could not be selected:</p>
            <ul>
              <li v-for="message in validationMessages" :key="message">{{ message }}</li>
            </ul>
          </div>

          <button
            class="primary-action"
            type="button"
            :disabled="pendingCount === 0"
            @click="addPhotos"
          >
            Add {{ pendingCount || '' }} {{ pendingCount === 1 ? 'photo' : 'photos' }}
          </button>
          <p v-if="confirmationMessage" class="success-message" role="status" aria-live="polite">
            {{ confirmationMessage }}
          </p>
        </section>
        <p v-else class="read-only-message">
          Photos can only be added while a visit is in progress. Existing photos remain available
          to view.
        </p>
      </section>
    </template>

    <section v-else class="not-found" aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">Visit not found</h1>
      <p>Visit {{ route.params.visitId }} could not be found in the demonstration appointments.</p>
    </section>

    <div
      v-if="previewPhoto"
      class="preview-backdrop"
      role="presentation"
      @click.self="closePreview"
    >
      <section
        class="preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-heading"
        tabindex="-1"
        @keydown.esc.prevent.stop="closePreview"
        @keydown.tab.prevent="focusPreviewClose"
      >
        <div class="preview-dialog-heading">
          <h2 id="preview-heading">{{ previewPhoto.name }}</h2>
          <button
            ref="previewCloseButton"
            class="close-preview"
            type="button"
            aria-label="Close photo preview"
            @click="closePreview"
          >
            Close
          </button>
        </div>
        <img
          v-if="!isPhotoUnavailable(previewPhoto)"
          class="large-preview"
          :src="previewPhoto.url"
          :alt="previewPhoto.isDemo ? `Demonstration photo: ${previewPhoto.name}` : `Added photo: ${previewPhoto.name}`"
          @error="markPhotoUnavailable(previewPhoto)"
        />
        <p v-else class="image-unavailable">This photo preview could not be loaded.</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.photos-page {
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
.photos-header {
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
.photos-section {
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
.empty-state {
  margin: 16px 0;
  color: #52605c;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 12px;
  list-style: none;
  margin: 0;
  padding: 16px 0 0;
}
.photo-card {
  min-width: 0;
  overflow-wrap: anywhere;
}
.photo-preview {
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 112px;
  aspect-ratio: 4 / 3;
  place-items: center;
  overflow: hidden;
  padding: 0;
  border: 1px solid #d9ddda;
  border-radius: 4px;
  background: #edf1ed;
  color: #52605c;
  cursor: pointer;
}
.photo-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-name {
  margin: 7px 0 0;
  font-size: 14px;
  font-weight: 500;
}
.photo-badge {
  margin: 4px 0 0;
  color: #606b65;
  font-size: 12px;
}
.pending-section {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid #d9ddda;
}
.pending-heading {
  padding-bottom: 12px;
}
.selected-count {
  font-variant-numeric: tabular-nums;
}
.file-picker {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  margin-top: 14px;
  padding-inline: 16px;
  border: 1px solid #8da296;
  border-radius: 4px;
  color: #315e48;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.file-picker:hover {
  background: #edf4ef;
}
.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}
.file-input:focus-visible + .file-picker {
  outline: 3px solid #33705b;
  outline-offset: 3px;
}
.file-input:disabled + .file-picker {
  color: #606b65;
  cursor: not-allowed;
}
.field-guidance {
  max-width: 78ch;
  margin-top: 8px;
  line-height: 1.5;
}
.pending-grid {
  padding-top: 18px;
}
.pending-preview {
  cursor: default;
}
.pending-badge {
  display: inline-block;
  padding: 3px 7px;
  border-radius: 3px;
  background: #edf4ef;
  color: #315e48;
}
.remove-photo {
  min-width: 88px;
  min-height: 48px;
  margin-top: 6px;
  padding: 0 10px;
  border: 1px solid #c9d1cc;
  border-radius: 4px;
  background: white;
  color: #424d47;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.validation-errors {
  margin-top: 16px;
  padding: 12px;
  border-left: 3px solid #9c3e36;
  background: #f9eeec;
  color: #762f29;
  font-size: 14px;
}
.validation-errors p {
  margin: 0;
  font-weight: 500;
}
.validation-errors ul {
  margin: 6px 0 0;
  padding-left: 20px;
}
.primary-action {
  width: 100%;
  min-height: 48px;
  margin-top: 18px;
  padding: 0 16px;
  border: 0;
  border-radius: 4px;
  background: #355e4e;
  color: white;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.primary-action:hover:not(:disabled) {
  background: #2e5143;
}
.primary-action:disabled {
  background: #e4e9e5;
  color: #56605c;
  cursor: not-allowed;
}
.success-message {
  margin: 12px 0 0;
  color: #315e48;
  font-size: 14px;
}
.read-only-message {
  margin-top: 16px;
  line-height: 1.5;
}
.image-unavailable {
  padding: 12px;
  color: #606b65;
  font-size: 14px;
  text-align: center;
}
.not-found {
  padding-block: 12px 24px;
}
.not-found p {
  color: #606b65;
}
.preview-backdrop {
  position: fixed;
  z-index: 10;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(25 34 29 / 72%);
}
.preview-dialog {
  width: min(100%, 900px);
  max-height: 100%;
  overflow: auto;
  padding: 16px;
  border-radius: 6px;
  background: #fafaf8;
  box-shadow: 0 8px 32px rgb(0 0 0 / 24%);
}
.preview-dialog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.preview-dialog-heading h2 {
  overflow-wrap: anywhere;
}
.close-preview {
  min-width: 72px;
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid #c9d1cc;
  border-radius: 4px;
  background: white;
  color: #26322c;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.large-preview {
  display: block;
  max-width: 100%;
  max-height: 72vh;
  margin-inline: auto;
  object-fit: contain;
}
@media (min-width: 768px) {
  .photos-page {
    padding-block: 32px;
  }
  h1 {
    font-size: 32px;
  }
  .photo-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
  }
  .primary-action {
    width: auto;
    min-width: 180px;
  }
}
</style>
