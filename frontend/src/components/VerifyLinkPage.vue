<template>
  <div class="container">
    <h2>Verifying your account...</h2>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>
  </div>
</template>

<script>
export default {
  name: "VerifyLinkPage",
  data() {
    return {
      error: '',
      success: ''
    };
  },
  async mounted() {
    const userId = this.$route.params.id;
    try {
      const res = await fetch(`http://localhost:3000/users/verify/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Verification failed");

      this.success = "✅ Account verified successfully!";
      setTimeout(() => this.$router.push("/login"), 2000);
    } catch (err) {
      this.error = err.message;
    }
  }
}
</script>

<style scoped>
.container {
  text-align: center;
  padding: 100px;
}
.error {
  color: red;
  margin-top: 20px;
}
.success {
  color: green;
  margin-top: 20px;
}
</style>
