<template>
  <div class="auth-wrapper">
    <!-- Register Card -->
    <div class="auth-card">
      <!-- Title -->
      <h2 class="title">HT Social</h2>
      <p class="subtitle">Create your account</p>

      <!-- Register Form -->
      <form class="auth-form" @submit.prevent="handleRegister">
        <!-- First + Last -->
        <div class="row">
          <input v-model="firstname" placeholder="First Name" required />
          <input v-model="lastname" placeholder="Last Name" required />
        </div>

        <!-- Username -->
        <div class="input-group">
          <input v-model="username" placeholder="Username" required />
        </div>

        <!-- Email -->
        <div class="input-group">
          <input v-model="email" type="email" placeholder="Email" required />
        </div>

        <!-- Password -->
        <div class="input-group password-group">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            required
          />

          <span class="eye-btn" @click="showPassword = !showPassword">
            <img
              :src="
                showPassword
                  ? require('../assets/hide.png')
                  : require('../assets/show.png')
              "
              alt="toggle"
            />
          </span>
        </div>

        <!-- Confirm Password -->
        <div class="input-group password-group">
          <input
            v-model="confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            placeholder="Confirm Password"
            required
          />

          <span class="eye-btn" @click="showConfirm = !showConfirm">
            <img
              :src="
                showConfirm
                  ? require('../assets/hide.png')
                  : require('../assets/show.png')
              "
              alt="toggle"
            />
          </span>
        </div>

        <!-- Gender + Birthday -->
        <div class="row">
          <select v-model="gender" required>
            <option disabled value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <input v-model="birthday" type="date" required />
        </div>

        <!-- Location -->
        <div class="input-group">
          <input v-model="location" placeholder="Location (optional)" />
        </div>

        <!-- Bio -->
        <div class="input-group">
          <textarea v-model="bio" placeholder="Short bio..."></textarea>
        </div>

        <!-- Register Button -->
        <button type="submit" class="register-btn">
          Register
        </button>
      </form>

      <!-- Switch -->
      <p class="switch">
        Already have an account?
        <router-link to="/login">Login</router-link>
      </p>
    </div>

    <!-- ✅ Notification Modal -->
    <NotificationModal
      :isVisible="showModal"
      :type="modalType"
      :title="modalTitle"
      :message="modalMessage"
      buttonText="OK"
      @confirm="showModal = false"
    />
  </div>
</template>

<script>
import NotificationModal from "../components/NotificationModal.vue";

export default {
  name: "RegisterPage",
  components: { NotificationModal },

  data() {
    return {
      firstname: "",
      lastname: "",
      username: "",
      email: "",

      password: "",
      confirmPassword: "",

      gender: "",
      birthday: "",
      location: "",
      bio: "",

      showPassword: false,
      showConfirm: false,

      // ✅ Modal state
      showModal: false,
      modalType: "success",
      modalTitle: "",
      modalMessage: ""
    };
  },

  methods: {
    async handleRegister() {
      // ✅ Password match check
      if (this.password !== this.confirmPassword) {
        this.modalType = "error";
        this.modalTitle = "Registration Error";
        this.modalMessage = " Passwords do not match!";
        this.showModal = true;
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstname: this.firstname,
            lastname: this.lastname,
            username: this.username,
            email: this.email,
            password: this.password,
            gender: this.gender,
            birthday: this.birthday,
            location: this.location,
            bio: this.bio
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || "Registration failed");

        // ✅ Success Modal
        this.modalType = "success";
        this.modalTitle = "Account Created";
        this.modalMessage =
          "Registered successfully! Please check your email to verify.";
        this.showModal = true;

        // Redirect after 2s
        setTimeout(() => {
          this.$router.push("/login");
        }, 2200);

      } catch (err) {
        // ✅ Error Modal
        this.modalType = "error";
        this.modalTitle = "Registration Failed";
        this.modalMessage = err.message;
        this.showModal = true;
      }
    }
  }
};
</script>

<style scoped>
/* ✅ CSS giữ nguyên của bạn */
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 70px 18px;
  background: linear-gradient(to bottom right, #fff3ee, #ffffff);
  font-family: "Inter", sans-serif;
}

.auth-card {
  width: 520px;
  max-width: 100%;
  padding: 55px 60px;
  border-radius: 22px;
  background: white;
  text-align: center;
  box-shadow: 0px 12px 28px rgba(0, 0, 0, 0.12);
}

.title {
  font-size: 38px;
  font-weight: 800;
  color: #ff642f;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 35px;
}

.row {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
}

.row input,
.row select {
  flex: 1;
}

.input-group {
  width: 100%;
  margin-bottom: 20px;
  position: relative;
}

input,
select,
textarea {
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

textarea {
  height: 90px;
  padding-top: 14px;
  resize: none;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #ff642f;
  box-shadow: 0 0 0 3px rgba(255, 100, 47, 0.25);
}

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

.register-btn {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 14px;
  background: #ff642f;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.register-btn:hover {
  background: #e85522;
}

.switch {
  margin-top: 25px;
  font-size: 14px;
  color:var(--text-sub);
}

.switch a {
  color: #ff642f;
  font-weight: bold;
  text-decoration: none;
}
</style>
