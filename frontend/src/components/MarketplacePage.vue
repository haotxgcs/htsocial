<template>
  <div class="page-container">
    <h2>Marketplace</h2>
    <p>Chào mừng bạn đến với chợ online HT Social! Đang phát triển...</p>
  </div>
</template>

<script>
export default {
  name: "MarketplacePage",
  mounted() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return this.$router.push("/login");
  }
};
</script>

<style scoped>
.page-container { padding: 20px; max-width: 800px; margin: 0 auto; }
</style>