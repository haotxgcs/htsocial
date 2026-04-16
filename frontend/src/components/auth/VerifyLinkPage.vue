<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <!-- Title -->
      <h2 class="title">HT Social</h2>
      <p class="subtitle">Account Verification</p>

      <!-- Loading -->
      <div v-if="loading" class="loading-box">
        <div class="spinner"></div>
        <p>Verifying your account...</p>
      </div>

      <!-- Success -->
      <p v-if="success" class="success-msg">
        ✅ Account verified successfully!
      </p>

      <!-- Error -->
      <p v-if="error" class="error-msg">
        ❌ {{ error }}
      </p>

      <!-- Button -->
      <router-link v-if="success" to="/login">
        <button class="login-btn">
          Go to Login
        </button>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "VerifyLinkPage",
  data() {
    return {
      loading: true,
      success: false,
      error: ""
    };
  },

  async mounted() {
    const userId = this.$route.params.id;

    try {
      const res = await fetch(
        `http://localhost:3000/users/verify/${userId}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || "Verification failed");

      // ✅ Success
      this.success = true;

      // Auto redirect after 2s
      setTimeout(() => {
        this.$router.push("/login");
      }, 2500);

    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
/* ===============================
   BACKGROUND
================================ */
.auth-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom right, #fff3ee, #ffffff);
  font-family: "Inter", sans-serif;
}

/* ===============================
   CARD
================================ */
.auth-card {
  width: 420px;
  padding: 60px 50px;
  border-radius: 22px;
  background: white;
  text-align: center;
  box-shadow: 0px 12px 28px rgba(0, 0, 0, 0.12);
}

/* ===============================
   TITLE
================================ */
.title {
  font-size: 36px;
  font-weight: 800;
  color: #ff642f;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 35px;
}

/* ===============================
   LOADING BOX
================================ */
.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #444;
}

/* Spinner */
.spinner {
  width: 45px;
  height: 45px;
  border: 5px solid #eee;
  border-top: 5px solid #ff642f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

/* ===============================
   SUCCESS + ERROR
================================ */
.success-msg {
  color: green;
  font-size: 15px;
  font-weight: 600;
  margin-top: 15px;
}

.error-msg {
  color: red;
  font-size: 15px;
  font-weight: 600;
  margin-top: 15px;
}

/* ===============================
   BUTTON
================================ */
.login-btn {
  width: 100%;
  height: 52px;
  margin-top: 30px;
  border: none;
  border-radius: 14px;
  background: #ff642f;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.25s;
}

.login-btn:hover {
  background: #e85522;
}

/* Responsive */
@media (max-width: 500px) {
  .auth-card {
    width: 90%;
    padding: 45px 25px;
  }
}
</style>
