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
      // lấy đường dẫn hiện tại
      const path = this.$route.path
      // Hide header in login, register, and welcome pages
      return !['/login', '/register', '/'].includes(path) &&
           !path.startsWith('/verify');
    }
  }
}
</script>


<style>
:root {
  --bg-body: #f0f2f5;
  --bg-card: #ffffff;
  --text-main: #050505;
  --text-sub: #65676b;
  --border-color: #ddd;
  --hover-color: #f2f2f2;
  --input-bg: #f0f2f5;
}

/* 2. Định nghĩa màu cho DARK MODE */
/* Khi thẻ html có class="dark" (do VueUse tự thêm) */
html.dark {
  --bg-body: #18191a;       /* Màu nền đen xám của Facebook */
  --bg-card: #242526;       /* Màu nền thẻ card */
  --text-main: #e4e6eb;     /* Chữ trắng đục */
  --text-sub: #b0b3b8;      /* Chữ xám nhạt */
  --border-color: #3e4042;  /* Viền tối */
  --hover-color: #3a3b3c;   /* Màu khi hover */
  --input-bg: #3a3b3c;      /* Nền ô input */
}

body {
  font-family: 'Segoe UI', sans-serif;
  margin: 0;
  background-color: var(--bg-body);
  color: var(--text-main);
  transition: background-color 0.3s, color 0.3s;
}
</style>
