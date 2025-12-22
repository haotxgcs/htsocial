<template>
  <div class="marketplace-wrapper" @click="showHistory = false">
    <div class="marketplace-container">
    <!-- SEARCH + FILTER -->
    <div class="marketplace-header">
      <div class="search-box" @click.stop>
        <input
          v-model="search"
          placeholder="Search ingredients, dishes, tools..."
          @focus="showHistory = true"
        />

        <button @click="handleSearch">Search</button>

        <!-- 🔽 SEARCH HISTORY DROPDOWN -->
        <div
          v-if="showHistory && searchHistory.length"
          class="search-history-dropdown"
        >
          <div class="history-header">
            <span>Recent</span>
            <button class="clear-btn" @click="clearAllHistory">
              Clear All
            </button>
          </div>

          <div class="history-list">
            <div
              v-for="(item, index) in searchHistory"
              :key="index"
              class="history-item"
              @click="searchFromHistory(item)"
            >
              <span class="history-text">{{ item }}</span>
              <button
                class="remove-btn"
                @click.stop="removeHistoryItem(item)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>


      <div class="filters">
        <button
          v-for="f in filters"
          :key="f.value"
          :disabled="loading"
          :class="{ active: category === f.value && !showMine }"
          @click="changeCategory(f.value)"
        >
          {{ f.label }}
        </button>

        <!-- MY ITEMS -->
        <button
          v-if="currentUser"
          :class="{ active: showMine }"
          @click="toggleMyItems"
        >
          My items
        </button>

      </div>
    </div> 
    

    <!-- CREATE LISTING -->
    <div class="create-box" >
      
      <input @click="showCreateModal = true" placeholder="Create a marketplace listing..." />
    </div>

    <div class="items-wrapper">
      <!-- LOADING OVERLAY -->
      <LoadingOverlay v-if="loading" />

      <!-- EMPTY -->
      <div v-if="!loading && items.length === 0" class="empty">
        No items found
      </div>

      <!-- ITEMS -->
      <div v-if="!loading" class="items-grid">
        <MarketplaceItemCard
          v-for="item in items"
          :key="item._id"
          :item="item"
          @open="openItem"
        />
      </div>
    </div>


    </div>

    

    <!-- MODAL -->
    <MarketplaceCreateModal
      v-if="showCreateModal"
      :isVisible="showCreateModal"
      :user="currentUser"
      @close="showCreateModal = false"
      @created="onItemCreated"
    />
  </div>
</template>


<script>
import MarketplaceItemCard from "../components/MarketplaceItemCard.vue";
import MarketplaceCreateModal from "../components/MarketplaceCreateModal.vue";
import LoadingOverlay from "../components/LoadingOverlay.vue";


export default {
  name: "MarketplacePage",
  components: {
    MarketplaceItemCard,
    MarketplaceCreateModal,
    LoadingOverlay
  },
  data() {
    return {
      search: "",

      searchHistory: [],
      showHistory: false,

      category: "all",
      showMine: false, 
      loading: false,
      items: [],
      currentUser: JSON.parse(localStorage.getItem("user")),
      showCreateModal: false,
      filters: [
        { label: "All", value: "all" },
        { label: "Ingredients", value: "ingredient" },
        { label: "Dishes", value: "dish" },
        { label: "Tools", value: "tool" }
      ]
    };
  },
  methods: {
async fetchItems({ saveHistory = false } = {}) {
  this.loading = true;

  try {
    const params = new URLSearchParams();

    if (this.search) {
      params.append("search", this.search);
    }

    if (this.category !== "all") {
      params.append("type", this.category);
    }

    if (this.showMine) {
      params.append("mine", "true");
    }

    const headers = {};
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(
      `http://localhost:3000/marketplace?${params.toString()}`,
      { headers }
    );

    this.items = await res.json();

    // ✅ CHỈ LƯU KHI USER SEARCH
    if (saveHistory && user && token && this.search.trim()) {
      fetch(
        `http://localhost:3000/users/${user.id || user._id}/search-history?context=marketplace`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            query: this.search.trim(),
            context: "marketplace"
          })
        }
      );
    }

  } finally {
    this.loading = false;
  }
},

    changeCategory(cat) {
      this.category = cat;
      this.showMine = false;
      this.fetchItems();
    },

    onItemCreated() {
      this.showCreateModal = false;
      this.fetchItems();
    },

toggleMyItems() {
  if (!this.currentUser) {
    alert("Please login to view your items");
    return;
  }

  this.showMine = !this.showMine;

  if (this.showMine) {
    this.category = "all";
  }

  this.fetchItems();
},

async fetchSearchHistory() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) return;

  try {
    const res = await fetch(
      `http://localhost:3000/users/${user.id || user._id}/search-history?context=marketplace`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();
    this.searchHistory = (data.history || []).filter(
      h => h.context === "marketplace"
    ).map(h => h.query);

  } catch (err) {
    console.error("Fetch search history error", err);
  }
},

handleSearch() {
    this.showHistory = false;
    this.fetchItems(); // 🔥 chỉ search khi click
  },

  searchFromHistory(keyword) {
    this.search = keyword;
    this.showHistory = false;
    this.fetchItems();
  },

  async removeHistoryItem(keyword) {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (!user || !token) return;

    await fetch(
      `http://localhost:3000/users/${user.id || user._id}/search-history`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: keyword , context: "marketplace"})
      }
    );

    this.searchHistory = this.searchHistory.filter(
      q => q !== keyword
    );
  },

  async clearAllHistory() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  if (!user || !token) return;

  await fetch(
    `http://localhost:3000/users/${user.id || user._id}/search-history/all`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        context: "marketplace"
      })
    }
  );

  this.searchHistory = [];
}




  },
   
  mounted() {
  this.fetchItems();

  if (this.currentUser) {
    this.fetchSearchHistory();
  }
}
 
};
</script>


<style scoped>
.marketplace-wrapper {
  padding-left: 320px;
  padding-top: 20px;
  padding-right: 20px;
  background: #fcf8f5;
  min-height: 100vh;
}

.marketplace-container {
  max-width: 750px;     /* 👈 giống Home */
  margin: 0 auto;       /* 👈 canh giữa */
}


.marketplace-header {
  background: white;
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  gap: 12px;
  position: relative;
}

.search-box input {
  flex: 1;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid #eee;
}

.search-box button {
  background: #ff642f;
  color: white;
  border: none;
  padding: 0 24px;
  border-radius: 999px;
  font-weight: 600;
}

.filters {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filters button {
  border-radius: 999px;
  padding: 6px 16px;
  border: 1px solid #eee;
  background: white;
  cursor: pointer;
}

.filters button.active {
  background: #ff642f;
  color: white;
  border-color: #ff642f;
}

.create-box {
  background: white;
  padding: 14px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  cursor: pointer;
}

.create-box input {
  width: 100%;
  border: none;
  background: #f3f4f6;
  padding: 10px 16px;
  border-radius: 999px;
}


.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  align-items: stretch;     /* 👈 card cao bằng nhau */
  padding: 0;          /* 👈 không để grid có padding riêng */
  margin: 0;
}

.empty {
  text-align: center;
  color: #ff642f;
  margin-top: 40px;
}

.items-wrapper {
  position: relative;       /* 👈 cho LoadingOverlay bám */
  min-height: 300px;        /* 👈 tránh layout nhảy */
  max-width: 750px;         /* 👈 đồng bộ với search */
  margin: 0 auto;           /* 👈 canh giữa */
}

/* search history dropdown */
.search-history-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  margin-top: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  z-index: 20;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #eee;
}

.clear-btn {
  background: none;
  border: none;
  color: #ff642f;
  cursor: pointer;
  font-weight: 600;
}

.history-list {
  max-height: 260px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
}

.history-item:hover {
  background: #f9f9f9;
}

.history-text {
  font-size: 14px;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #aaa;
  cursor: pointer;
}

.remove-btn:hover {
  color: #ff642f;
}



@media (max-width: 1024px) {
  .marketplace-wrapper {
    padding-top: 64px;
    padding-left: 0;
  }
}


@media (max-width: 768px) {
  .marketplace-wrapper {
    padding-top: 64px; /* đủ né menu */
    padding-left: 16px;           /* ✅ padding đều 2 bên */
    padding-right: 16px;
  }

  .search-box {
    gap: 8px;
  }

  .search-box input {
    min-width: 0; /* QUAN TRỌNG – tránh vỡ flex */
  }

  .search-box button {
    padding: 0 18px;
    white-space: nowrap;
  }
}



@media (max-width: 480px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
}



</style>

