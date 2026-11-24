<script setup>
import { computed, ref } from 'vue'
import VisitListItem from '../components/VisitListItem.vue'
import { demoToday, demoVisits, visitsForGroup } from '../data/demoVisits'

const groups = ['Today', 'Upcoming', 'Completed']
const selected = ref('Today')
const days = computed(() => {
  const result = new Map()
  for (const visit of visitsForGroup(demoVisits, selected.value, demoToday)) {
    const day = visit.start.slice(0, 10)
    if (!result.has(day)) result.set(day, [])
    result.get(day).push(visit)
  }
  return [...result]
})
const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: 'UTC' })
</script>

<template>
  <main class="page-container">
    <h1>My visits</h1>
    <div class="filters" role="group" aria-label="Visit group">
      <button
        v-for="group in groups"
        :key="group"
        :aria-pressed="selected === group"
        @click="selected = group"
      >
        {{ group }}
      </button>
    </div>
    <section v-for="[day, visits] in days" :key="day">
      <div class="day">
        <h2>{{ dateFormat.format(new Date(day + 'T00:00:00Z')) }}</h2>
        <span>{{ visits.length }} {{ visits.length === 1 ? 'visit' : 'visits' }}</span>
      </div>
      <ul>
        <VisitListItem v-for="visit in visits" :key="visit.id" :visit="visit" />
      </ul>
    </section>
    <section v-if="!days.length" class="empty">
      <h2>No {{ selected.toLowerCase() }} visits</h2>
      <p>
        {{
          selected === 'Completed'
            ? 'Finished visits will appear here.'
            : 'There are no appointments assigned for this period.'
        }}
      </p>
    </section>
    <footer>Demonstration data · 23 Nov 2026</footer>
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 61px);
  min-height: calc(100dvh - 61px);
  padding-block: 24px 16px;
}
h1 {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.045em;
}
@media (min-width: 768px) {
  h1 {
    font-size: 32px;
  }
}
.filters {
  display: flex;
  border-bottom: 1px solid #d9ddda;
  gap: clamp(8px, 2vw, 24px);
}
button {
  background: transparent;
  color: #56605c;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0 5px;
  min-height: 44px;
  cursor: pointer;
}
button[aria-pressed='true'] {
  color: #315e48;
  border-color: currentColor;
  font-weight: 500;
}
.day {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin: 22px 0 8px;
}
h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 500;
}
.day span,
footer {
  font-size: 13px;
  color: #606b65;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid #d9ddda;
}
.empty {
  padding: 36px 0;
  border-bottom: 1px solid #d9ddda;
}
.empty p {
  color: #56605c;
}
footer {
  margin-top: auto;
}
</style>
