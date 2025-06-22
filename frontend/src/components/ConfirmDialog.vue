<template>
  <div v-if="visible" class="overlay">
    <div class="dialog">
      <p>{{ message }}</p>
      <div class="buttons">
        <button class="confirm-btn" @click="confirm">Yes</button>
        <button class="cancel-btn" @click="cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['message'],
  emits: ['confirm', 'cancel'],
  data() {
    return {
      visible: true
    };
  },
  methods: {
    confirm() {
      this.visible = false;
      this.$emit('confirm');
    },
    cancel() {
      this.visible = false;
      this.$emit('cancel');
    }
  }
};
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.dialog {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.confirm-btn {
  background-color: rgb(0, 0, 254);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}
</style>
