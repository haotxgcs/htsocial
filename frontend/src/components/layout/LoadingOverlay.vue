<template>
  <div class="loading-overlay">
    <div class="spinner"></div>
    </div>
</template>

<script>
export default {
  name: "LoadingOverlay",
  // Có thể mở rộng props nếu cần
  // props: { text: String } 
};
</script>

<style scoped>
.loading-overlay {
  position: absolute; /* Quan trọng: Để phủ lên cha có position: relative */
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 50; /* Đủ cao để che nội dung */
  

}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #FF642F; /* Màu chính */
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* .loading-text { margin-top: 10px; color: #65676b; font-weight: 600; } */

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>