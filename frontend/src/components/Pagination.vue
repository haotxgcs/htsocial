<template>
  <div v-if="totalPages > 1" class="pagination">

    <!-- PREV -->
    <button
      class="page-btn"
      :disabled="currentPage === 1"
      @click="change(currentPage - 1)"
    >
      ‹ Prev
    </button>

    <!-- PAGES -->
    <template v-for="(page, index) in pagesToShow" :key="index">
      <span v-if="page === '...'" class="ellipsis">…</span>

      <button
        v-else
        class="page-btn"
        :class="{ active: page === currentPage }"
        @click="change(page)"
      >
        {{ page }}
      </button>
    </template>

    <!-- NEXT -->
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
    },
    pageRange: {
      type: Number,
      default: 2 // số trang trước & sau currentPage
    }
  },
  emits: ["update:page"],

  computed: {
    pagesToShow() {
      const pages = [];
      const { currentPage, totalPages, pageRange } = this;

      if (totalPages <= 7) {
        // Ít trang thì hiện hết
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
        return pages;
      }

      // Trang đầu
      pages.push(1);

      const start = Math.max(2, currentPage - pageRange);
      const end = Math.min(totalPages - 1, currentPage + pageRange);

      if (start > 2) pages.push("...");

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push("...");

      // Trang cuối
      pages.push(totalPages);

      return pages;
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

.ellipsis {
  padding: 0 8px;
  font-weight: 600;
  color: #999;
  user-select: none;
}
</style>
