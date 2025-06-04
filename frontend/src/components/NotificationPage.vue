<template>
  <div class="page">
    <h2>Notifications</h2>
    <p>You have no new notifications.</p>
  </div>
</template>

<script>
export default {
  name: "NotificationPage",
  mounted() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return this.$router.push("/login");
  }
};
</script>

<style scoped>
.page {
  padding: 40px;
  font-family: Arial, sans-serif;
}
</style>
