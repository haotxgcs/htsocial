<template>
  <div class="page-container">
    <h2>Nhóm</h2>
    <p>Bạn chưa tham gia nhóm nào. Hãy tham gia nhóm để kết nối với nhiều người hơn!</p>
  </div>
</template>

<script>
export default {
  name: "GroupPage",
  mounted() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return this.$router.push("/login");
  }
};
</script>

<style scoped>
.page-container { padding: 20px; max-width: 800px; margin: 0 auto; }
</style>