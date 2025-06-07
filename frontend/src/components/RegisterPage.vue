<template>
  <div class="form-container">
    <h2>Sign Up</h2>
    <form @submit.prevent="handleRegister">
      <input v-model="firstname" placeholder="First Name" required />
      <input v-model="lastname" placeholder="Last Name" required />
      <input v-model="username" placeholder="Username" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Register</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>
  </div>
</template>

<script>
export default {
  name: 'RegisterPage',
  data() {
    return {
      firstname: '',
      lastname: '',
      username: '',
      email: '',
      password: '',
      error: '',
      success: ''
    };
  },
  methods: {
    async handleRegister() {
      this.error = '';
      this.success = '';
      try {
        const res = await fetch('http://localhost:3000/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstname: this.firstname,
            lastname: this.lastname,
            username: this.username,
            email: this.email,
            password: this.password
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Registration failed');

        this.success = 'Registration successful! Please check your email for the verification.';
        

      } catch (err) {
        this.error = err.message;
      }
    }
  }
};
</script>

<style scoped>
.form-container {
  max-width: 400px;
  margin: 100px auto;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
input {
  display: block;
  width: 100%;
  padding: 10px;
  margin: 12px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  padding: 10px;
  width: 100%;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
button:hover {
  background-color: #369870;
}
.error {
  color: red;
  margin-top: 10px;
}
.success {
  color: green;
  margin-top: 10px;
}
</style>
