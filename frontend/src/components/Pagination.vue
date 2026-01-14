<template>
  <div v-if="totalPages > 1" class="pagination">

    <button
      class="page-btn"
      :disabled="currentPage === 1"
      @click="change(currentPage - 1)"
    >
      ‹ Prev
    </button>

    <button
      v-for="page in totalPages"
      :key="page"
      class="page-btn"
      :class="{ active: page === currentPage }"
      @click="change(page)"
    >
      {{ page }}
    </button>

    <button
      class="page-btn"
      :disabled="currentPage === totalPages"
      @click="change(currentPage + 1)"
    >
      Next ›
    </button>

  </div>
</template>

<script>
export default {
  name: "PaginationMain",
  props: {
    currentPage: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    }
  },
  methods: {
    change(page) {
      if (page < 1 || page > this.totalPages) return;
      this.$emit("update:page", page);
    }
  }
};
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 30px 0;
}

.page-btn {
  min-width: 36px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #eee;
  background: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.page-btn.active {
  background: #ff642f;
  color: white;
  border-color: #ff642f;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
