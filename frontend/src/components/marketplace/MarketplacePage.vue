<template>
  <div class="marketplace-wrapper" @click="closeHistory">
    <div class="marketplace-container" >
    <!-- SEARCH + FILTER -->
    <div class="marketplace-header" >
      <div class="search-box" @click.stop>
        <input
          v-model="search"
          placeholder="Search ingredients, dishes, tools..."
          @focus="openHistory"
          @keyup.enter="handleSearch"
          @click.stop
        />

        <span v-if="search" class="clear-icon" @click.stop="clearSearch">
              ✕
            </span>


        <button @click="handleSearch">Search</button>

        <!-- 🔽 SEARCH HISTORY DROPDOWN -->
        <div
          v-if="showHistory && searchHistory.length"
          class="search-history-dropdown"
        >
          <div class="history-header">
            <span>Recent</span>
            <span class="clear-btn" @click="clearAllHistory">
              Clear All
            </span>
          </div>

          <ul class="history-list">
            <li v-for="(item, index) in searchHistory" :key="index" class="history-item" @click="searchFromHistory(item)">
              <div class="history-item-content">
                  <span class="clock-icon">🕒</span>
                  <span class="history-text">{{ item }}</span>
                </div>
              
              <span class="remove-btn" @click.stop="removeHistoryItem(item)" >
                ✕
              </span>
            </li>
          </ul>
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
          v-for="item in paginatedItems"
          :key="item._id"
          :item="item"
          @open="openItem"
          @edit="openEditModal"
          @delete="confirmDelete"
        />
      </div>
    </div>

    <!-- PAGINATION -->
     <Pagination 
      v-if="totalPages > 1" 
      :current-page="currentPage" 
      :total-pages="totalPages" 
      @update:page="changePage"
    />


    </div>

    

    <!-- MODAL -->
    <MarketplaceCreateModal
      v-if="showCreateModal"
      :isVisible="showCreateModal"
      :user="currentUser"
      @close="showCreateModal = false"
      @created="onItemCreated"
    />

    <MarketplaceEditModal
      v-if="showEditModal"
      :isVisible="showEditModal"
      :item="editingItem"
      :user="currentUser"
      @close="closeEdit"
      @updated="fetchItems"
    />

    <NotificationModal 
      :is-visible="notification.visible" 
      :type="notification.type" 
      :title="notification.title" 
      :message="notification.message" 
      @confirm="closeNotify" 
    />

      <ConfirmDialog 
        v-if="confirmVisible" 
        :message="confirmMessage" 
        @confirm="handleConfirmedAction" 
        @cancel="confirmVisible = false" 
      />



  </div>
</template>


<script>
import MarketplaceItemCard from "../marketplace/MarketplaceItemCard.vue";
import MarketplaceCreateModal from "../marketplace/MarketplaceCreateModal.vue";
import MarketplaceEditModal from "../marketplace/MarketplaceEditModal.vue"
import LoadingOverlay from "../layout/LoadingOverlay.vue";
import Pagination from "../layout/Pagination.vue";
import NotificationModal from "../notifications/NotificationModal.vue";
import ConfirmDialog from "../common/ConfirmDialog.vue";


export default {
  name: "MarketplacePage",
  components: {
    MarketplaceItemCard,
    MarketplaceCreateModal,
    MarketplaceEditModal,
    LoadingOverlay,
    Pagination,
    NotificationModal,
    ConfirmDialog

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
      ],

      showEditModal: false,
      editingItem: null,
      
      // pagination
      currentPage: 1,
      itemsPerPage: 12,

      notification: {
        visible: false,
        type: 'success',
        title: '',
        message: ''
      },

      openMenuId: null,
      confirmVisible: false,
      confirmMessage: '',
      pendingConfirmMsg: null,
      pendingConfirmAction: null,
      pendingItem: null

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

    // 🔐 nếu backend trả lỗi (401, 403, 500...)
    if (!res.ok) {
      this.items = [];
      return;
    }

    const data = await res.json();

    // ✅ LUÔN đảm bảo items là ARRAY
    this.items = Array.isArray(data) ? data : [];

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

  } catch (err) {
    console.error("Fetch marketplace items error:", err);
    this.items = []; // 🛡️ fallback an toàn
  } finally {
    this.loading = false;
  }
},


closeEdit() {
  this.showEditModal = false;
  this.editingItem = null;
},


    changeCategory(cat) {
      this.category = cat;
      this.showMine = false;
      this.currentPage = 1;
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

  this.currentPage = 1;
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
  const query = this.search.trim();
  if (!query) return;

  this.currentPage = 1;

  // 1️⃣ UPDATE UI NGAY (QUAN TRỌNG)
  const index = this.searchHistory.indexOf(query);
  if (index !== -1) {
    this.searchHistory.splice(index, 1);
  }
  this.searchHistory.unshift(query);
  if (this.searchHistory.length > 10) {
    this.searchHistory.pop();
    
  }

  // 2️⃣ ĐÓNG DROPDOWN
  this.showHistory = false;

  // 3️⃣ SEARCH + LƯU BACKEND
  this.fetchItems({ saveHistory: true });
},

  searchFromHistory(keyword) {
    this.search = keyword;
    this.showHistory = false;
    this.currentPage = 1;
    this.fetchItems({saveHistory:false}); // 🔥 không lưu lại lịch sử khi search từ lịch sử
  },

  async removeHistoryItem(keyword) {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (!user || !token) return;

    await fetch(
      `http://localhost:3000/users/${user.id || user._id}/search-history?context=marketplace`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: keyword , context: "marketplace"})
      }
    );

    await this.fetchSearchHistory();

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
},

openHistory() {
  this.showHistory = this.searchHistory.length > 0;
},

closeHistory() {
  this.showHistory = false;
},

clearSearch() {
  this.search = "";
},

openEditModal(item) {
  this.editingItem = JSON.parse(JSON.stringify(item)); // 👈 CLONE
  this.showEditModal = true;
},

 async confirmDelete(item) {
    this.pendingConfirmAction = 'item-delete';
    this.pendingItem = item;
    this.confirmMessage = "Delete this item?";
    this.confirmVisible = true;
  },

  async _confirmDelete(item) {

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login required");
    return;
  }

  const res = await fetch(
    `http://localhost:3000/marketplace/${item._id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) {
    const err = await res.text();
    this.showNotify("error", "Error", "Delete failed");
    console.error(err);
    return;
  }

  // ✅ XÓA NGAY TRÊN UI (UX tốt hơn)
  this.items = this.items.filter(i => i._id !== item._id);
},

handleConfirmedAction() {
      this.confirmVisible = false;
      const action = this.pendingConfirmAction;
      const item = this.pendingItem;
      this.pendingConfirmAction = null;
      this.pendingConfirmMsg    = null;
      this.pendingItem = null;
 
      if (action === 'item-delete' && item)         this._confirmDelete(item);
    },

changePage(page) {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;

    // UX: scroll lên đầu
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  },

  closeNotify() {
    this.notification.visible = false;
  },

  showNotify(type, title, message) {
    this.notification = { visible: true, type, title, message };
  },

  },

  computed: {
    filteredItems() {
      return this.items;

    },

    totalPages() {
      return Math.ceil(this.filteredItems.length / this.itemsPerPage);
    },

    paginatedItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredItems.slice(start, start + this.itemsPerPage);
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

  min-height: 100vh;
  margin-bottom:40px;
  background-color: var(--bg-body);
  color: var(--text-main);
  transition: background-color 0.3s, color 0.3s;
}

.marketplace-container {
  max-width: 750px;     /* 👈 giống Home */
  margin: 0 auto;       /* 👈 canh giữa */
}


.marketplace-header {
  background: var(--bg-card);
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
  border: 1px solid var(--border-color);
  background: var(--bg-input); /* Thay nền input */
  color: var(--text-main);
}

.search-box input:focus {
  outline: none;
  border-color: #ff642f;
  box-shadow: 0 0 0 2px rgba(255, 100, 47, 0.1);
  background: var(--bg-card);
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
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-sub);
  cursor: pointer;
}

.filters button.active {
  background: #ff642f;
  color: white;
  border-color: #ff642f;
}

.create-box {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
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
  background: var(--bg-input);
  color: var(--text-sub) ;
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
  top: 100%; /* Nằm ngay dưới input */
  left: 0;
  width: 85%; /* Rộng bằng input */
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border: 1px solid var(--border-color);
  z-index: 100;
  margin-top: 6px;
  overflow: hidden;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.history-header {
display: flex; justify-content: space-between;
  padding: 8px 16px;
  background: var(--hover-bg);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub);
  border-bottom: 1px solid var(--border-color);
}

.clear-btn {
  cursor: pointer; color: #FF642F; font-size: 11px;
}

.clear-btn:hover{
  text-decoration: underline;
}

.history-list {
  list-style: none; padding: 0; margin: 0;
  max-height: 250px; overflow-y: auto;
}

.history-list li:hover{
  background: var(--hover-primary);
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

.history-item-content {
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; color: var(--text-main);
}


.clock-icon { font-size: 12px; opacity: 0.6; color: var(--text-sub);}

.history-text {
  font-size: 14px;
}

.remove-btn {
font-size: 14px; color: #ddd; padding: 4px; border-radius: 50%;
}

.remove-btn:hover {
  color: #ff642f;
}


.clear-icon {
  position: absolute;
  right: 110px;
  color: var(--text-sub);
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 8px;
}
.clear-icon:hover { color: #FF642F; }


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

