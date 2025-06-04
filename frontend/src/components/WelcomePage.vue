<template>
  <div class="welcome-container">
    <h1>Welcome to My Social Network</h1>
    <p>This is a modern social media web app where you can post, like, and comment.</p>

    <div class="buttons">
      <router-link to="/login">
        <button>Login</button>
      </router-link>
      <router-link to="/register">
        <button>Sign Up</button>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "WelcomePage"
};
</script>

<style scoped>
.welcome-container {
  text-align: center;
  padding: 50px;
}
.buttons button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 16px;
}
</style>
