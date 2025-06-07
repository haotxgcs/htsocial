<template>
  <div v-if="visible" class="overlay">
    <div class="dialog">
      <p>{{ message }}</p>
      <div class="buttons">
        <button @click="confirm">Đồng ý</button>
        <button @click="cancel">Huỷ</button>
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
  background: rgba(0, 0, 0, 0.4);
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
}
.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
