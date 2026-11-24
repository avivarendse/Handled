<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <header class="app-header">
    <div class="brand page-container">
      <span class="mark" aria-hidden="true">H</span>
      Handled
    </div>
  </header>
  <RouterView />
</template>

<style>
:root {
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #26322c;
  background: #fafaf8;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
button {
  font: inherit;
}
:focus-visible {
  outline: 3px solid #33705b;
  outline-offset: 3px;
}
.app-header {
  border-bottom: 1px solid #d9ddda;
  background: white;
}
.page-container {
  width: 100%;
  max-width: 1600px;
  margin-inline: auto;
  padding-inline: 16px;
}
.brand {
  display: flex;
  gap: 9px;
  align-items: center;
  height: 60px;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.7px;
}
.mark {
  display: grid;
  place-items: center;
  background: #355e4e;
  color: white;
  border-radius: 5px;
  width: 25px;
  height: 25px;
  font:
    500 18px Georgia,
    serif;
}
@media (min-width: 768px) {
  .page-container {
    padding-inline: 24px;
  }
}
@media (min-width: 1200px) {
  .page-container {
    padding-inline: 32px;
  }
}
</style>
