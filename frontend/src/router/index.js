import { createRouter, createWebHistory } from 'vue-router'
import MyVisitsView from '../views/MyVisitsView.vue'
import VisitDetailsView from '../views/VisitDetailsView.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'my-visits' } },
    { path: '/my-visits', name: 'my-visits', component: MyVisitsView },
    { path: '/my-visits/:visitId', name: 'visit-details', component: VisitDetailsView },
  ],
})
