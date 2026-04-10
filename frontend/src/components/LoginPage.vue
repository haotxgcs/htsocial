<template>
  <div class="auth-wrapper">
    <!-- Login Card -->
    <div class="auth-card">
      <!-- Title -->
      <h2 class="title">HT Social</h2>
      <p class="subtitle">Login with Username or Email</p>

      <!-- Form -->
      <form class="auth-form" @submit.prevent="handleLogin">
        <!-- Username / Email -->
        <div class="input-group">
          <input
            v-model="identifier"
            type="text"
            placeholder="Username or Email"
            required
          />
        </div>

        <!-- Password -->
        <div class="input-group password-group">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            required
          />

          <!-- Eye Icon -->
          <span class="eye-btn" @click="togglePassword">
            <img
              :src="
                showPassword
                  ? require('../assets/hide.png')
                  : require('../assets/show.png')
              "
              alt="toggle password"
            />
          </span>
        </div>

        <button @click="openSecurity">Forgot password?</button>

        <!-- Login Button -->
        <button type="submit" class="login-btn">
          Login
        </button>
      </form>

      <!-- Switch -->
      <p class="switch">
        Don’t have an account?
        <router-link to="/register">Register</router-link>
      </p>

      <!-- Thêm vào cuối form -->
    <div class="contact-wrap">
      <span class="contact-hint">Account suspended?</span>
      <button type="button" class="contact-link" @click="showContact = true">Contact Admin here</button>
    </div>

    </div>

    

    <ContactModal
      :is-visible="showContact"
      @close="showContact = false"
    />

    <!-- ✅ Notification Modal (Outside Card) -->
    <NotificationModal
      :isVisible="showModal"
      :message="modalMessage"
      :type="modalType"
      title="Notification"
      buttonText="OK"
      @confirm="showModal = false"
    />

    <SecurityModal :is-visible="showSecurity" @close="showSecurity = false" />

  </div>
</template>

<script>
import NotificationModal from "../components/NotificationModal.vue";
import ContactModal from './ContactModal.vue';
import SecurityModal from './SecurityModal.vue';

export default {
  name: "LoginPage",
  components: { 
    NotificationModal,
    ContactModal,
    SecurityModal 
  },

  data() {
    return {
      identifier: "",
      password: "",
      showPassword: false,

      // Modal state
      showModal: false,
      modalMessage: "",
      modalType: "success",

      showContact: false,

      showSecurity: false
    };
  },

  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword;
    },

    async handleLogin() {
      try {
        const res = await fetch("http://localhost:3000/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: this.identifier,
            password: this.password
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || "Login failed");
        }

        // ✅ Save login session
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // ✅ Show success modal
        this.modalType = "success";
        this.modalMessage = "Login successful! Redirecting...";
        this.showModal = true;
        

        // Redirect after 1.8s
        setTimeout(() => {
          this.$router.push("/home");
        }, 1800);

      } catch (err) {
        // ✅ Show error modal
        this.modalType = "error";
        this.modalMessage = "" + err.message;
        this.showModal = true;
      }
    },

    openSecurity() {
      this.showSecurity = true;
    }
  }
};
</script>

<style scoped>
/* ===============================
   PAGE BACKGROUND
================================ */
.auth-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  /* ✅ Mobile safe spacing */
  padding: 0 18px;

  background: linear-gradient(to bottom right, #fff3ee, #ffffff);
  font-family: "Inter", sans-serif;
}

/* ===============================
   LOGIN CARD
================================ */
.auth-card {
  width: 420px;
  max-width: 100%;
  padding: 55px 50px;

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
  margin-bottom: 38px;
}

/* ===============================
   INPUT GROUP
================================ */
.input-group {
  width: 100%;
  margin-bottom: 20px;
  position: relative;
}

/* ===============================
   INPUT FIELD
================================ */
input {
  width: 100%;
  height: 52px;
  padding: 0 16px;

  border-radius: 14px;
  border: 1.5px solid #ddd;
  font-size: 15px;

  outline: none;
  box-sizing: border-box;
  transition: 0.25s;
}

input:focus {
  border-color: #ff642f;
  box-shadow: 0 0 0 3px rgba(255, 100, 47, 0.25);
}

/* ===============================
   PASSWORD ICON IMAGE
================================ */
.password-group input {
  padding-right: 55px;
}

.eye-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.eye-btn img {
  width: 20px;
  height: 20px;
  opacity: 0.75;
  transition: 0.2s;
}

.eye-btn img:hover {
  opacity: 1;
}

/* ===============================
   BUTTON
================================ */
.login-btn {
  width: 100%;
  height: 52px;

  border: none;
  border-radius: 14px;
  background: #ff642f;

  color: white;
  font-size: 16px;
  font-weight: 700;

  cursor: pointer;
  transition: 0.25s;
}

.login-btn:hover {
  background: #e85522;
}

/* ===============================
   SWITCH LINK
================================ */
.switch {
  margin-top: 28px;
  font-size: 14px;
}

.switch a {
  color: #ff642f;
  font-weight: bold;
  text-decoration: none;
}

.switch a:hover {
  text-decoration: underline;
}

/* Contact form */
.contact-wrap { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 16px; font-size: 13px; }
.contact-hint { color: #9ca3af; }
.contact-link { background: none; border: none; color: #f59e0b; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: underline; }

/* ===============================
   RESPONSIVE
================================ */
@media (max-width: 480px) {
  .auth-card {
    width: 100%;
    padding: 42px 24px;
    border-radius: 18px;
  }

  .title {
    font-size: 30px;
  }
}
</style>
