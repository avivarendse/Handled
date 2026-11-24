<script setup>
import { RouterLink } from 'vue-router'
import { visitStatusLabels } from '../data/demoVisits'

defineProps({ job: { type: Object, required: true }, visit: { type: Object, required: true } })
</script>

<template>
  <li class="visit" :class="{ active: visit.status === 'IN_PROGRESS' }">
    <time :datetime="visit.start">{{ visit.start.slice(11) }}</time>
    <div class="work">
      <h3>{{ job.title }}</h3>
      <p>{{ job.customer }}</p>
    </div>
    <span class="status">{{ visitStatusLabels[visit.status] }}</span>
    <RouterLink class="view-link" :to="{ name: 'visit-details', params: { visitId: visit.id } }">
      View visit
    </RouterLink>
  </li>
</template>

<style scoped>
.visit {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: 6px 12px;
  padding: 12px;
  border-bottom: 1px solid #d9ddda;
  color: inherit;
  border-bottom-color: #d9ddda;
}
.active {
  background: #edf4ef;
  box-shadow: inset 3px 0 #4b7762;
}
time {
  font-variant-numeric: tabular-nums;
  font-size: 18px;
  font-weight: 500;
}
.work {
  grid-column: 1 / -1;
  overflow-wrap: anywhere;
}
h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}
p {
  font-size: 14px;
  color: #52605c;
  margin: 4px 0 0;
}
.status {
  grid-area: 1 / 2;
  justify-self: end;
  font-size: 13px;
  color: #505d59;
}
.status::before {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #939c98;
  margin-right: 7px;
}
.active .status::before {
  background: #4b7762;
}
.view-link {
  grid-column: 1 / -1;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-size: 14px;
  color: #315e48;
  text-decoration: none;
}
.view-link::after {
  content: '';
  width: 6px;
  height: 6px;
  border: solid currentColor;
  border-width: 0 1px 1px 0;
  transform: rotate(-45deg);
}
@media (min-width: 768px) {
  .visit {
    grid-template-columns: 90px minmax(0, 1fr) 120px 112px;
    align-items: center;
    gap: 0 20px;
    padding: 8px 16px;
  }
  .work {
    grid-column: 2;
    min-width: 0;
  }
  h3 {
    font-size: 16px;
  }
  .work p {
    font-size: 13px;
  }
  time {
    font-size: 16px;
  }
  .status {
    grid-area: 1 / 3;
  }
  .view-link {
    grid-column: 4;
  }
}
</style>
