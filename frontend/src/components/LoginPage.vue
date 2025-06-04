<template>
  <div class="form-container">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="username" placeholder="Username" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      error: ''
    }
  },
  methods: {
    async handleLogin() {
      try {
        const res = await fetch('http://localhost:3000/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: this.username, password: this.password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Login failed');
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // ✅ THÊM DÒNG NÀY
        alert('Login successful!');
        this.$router.push('/home');


      } catch (err) {
        this.error = err.message;
      }
    }
  }
}
</script>

<style scoped>
.form-container {
  max-width: 400px;
  margin: 100px auto;
  background: white;
  padding: 30px;
  border-radius: 8px;
}
input {
  display: block;
  width: 100%;
  padding: 10px;
  margin: 12px 0;
}
button {
  padding: 10px;
  width: 100%;
  background-color: #42b983;
}
</style>
