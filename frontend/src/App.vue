<template>
  <div id="app">
    <MainHeader v-if="showHeader" />
    <router-view />
  </div>
</template>

<script>
import MainHeader from './components/layout/Header.vue'

export default {
  components: { MainHeader },
  computed: {
    showHeader() {
      const path = this.$route.path
      return !['/login', '/register', '/', '/admin'].includes(path) &&
             !path.startsWith('/verify');
    }
  }
}
</script>

<style>
/* ── LIGHT (default) ── */
:root {
  --primary:       #FF642F;
  --bg-body:       #fdf4f0;
  --bg-card:       #ffffff;
  --bg-sidebar:    #ffffff;
  --bg-input:      #f8f9fa;
  --text-main:     #111827;
  --text-sub:      #6b7280;
  --border-color:  #eaeaea;
  --hover-bg:      #f9fafb;
  --hover-primary: #fff0e6;
}

/* ── DARK ── */
html[data-theme="dark"] {
  --bg-body:       #0f172a;
  --bg-card:       #1e293b;
  --bg-sidebar:    #1e293b;
  --bg-input:      #334155;
  --text-main:     #f1f5f9;
  --text-sub:      #94a3b8;
  --border-color:  #334155;
  --hover-bg:      #273549;
  --hover-primary: #2d1f14;
}

/* * { 
  box-sizing: border-box; 
  margin: 0; 
  padding: 0; 
} */

html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
}

body {
  font-family: 'Segoe UI', sans-serif;
  background-color: var(--bg-body);
  color: var(--text-main);
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>