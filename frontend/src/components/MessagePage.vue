<template>
  <div class="page">
    <h2>Messages</h2>
    <p>This is your message center. No messages yet.</p>
  </div>
</template>

<script>
export default {
  name: "MessagePage",
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
