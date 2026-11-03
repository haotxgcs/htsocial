<template>
  <div class="new-page">
    <div class="newpage__content">
      <h1 class="newpage__title">New Page</h1>
      <p class="newpage__message">Sub title</p>
      <router-link to="/home" class="newpage__link">Go back to Home</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NewPage',
};
</script>

<style>
.new-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.newpage__content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>