<template>
  <div class="page-container">
    <h2>Trò chơi</h2>
    <p>Không có trò chơi nào đang chờ. Hãy quay lại sau!</p>
  </div>
</template>

<script>
export default {
  name: "GamePage",

  mounted() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return this.$router.push("/login");
  }
};

</script>

<style scoped>
.page-container { padding: 20px; max-width: 800px; margin: 0 auto; }
</style>