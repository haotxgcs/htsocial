<template>
  <div id="app">
    <!-- Chỉ hiển thị Header nếu không phải là login/register/welcome -->
    <MainHeader v-if="showHeader" />
    <router-view />
  </div>
</template>

<script>
import MainHeader from './components/Header.vue'

export default {
  components: {
    MainHeader
  },
  computed: {
    showHeader() {
      // Lấy đường dẫn hiện tại
      const path = this.$route.path
      // Hide header in login, register, and welcome pages
      return !['/login', '/register', '/'].includes(path) &&
           !path.startsWith('/verify');
    }
  }
}
</script>


<style>
body {
  font-family: 'Segoe UI', sans-serif;
  margin: 0;
  background-color: #f4f4f4;
}
</style>
