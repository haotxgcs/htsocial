<template>
  <div class="page">
    <h2>Profile</h2>
    <p>This is your profile page.</p>
  </div>
</template>

<script>
export default {
  name: "ProfilePage",
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
