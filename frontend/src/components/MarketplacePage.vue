<template>
  <div class="marketplace-wrapper">
    <div class="marketplace-container">
    <!-- SEARCH + FILTER -->
    <div class="marketplace-header">
      <div class="search-box">
        <input
          v-model="search"
          placeholder="Search ingredients, dishes, tools..."
        />
        <button @click="fetchItems">Search</button>
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
    </div>

    <!-- CREATE LISTING -->
    <div class="create-box" >
      
      <input @click="showCreateModal = true" placeholder="Create a marketplace listing..." />
    </div>

    <!-- ITEMS -->
    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="items.length === 0" class="empty">
      No items found
    </div>

    <div class="items-grid">
      <MarketplaceItemCard
        v-for="item in items"
        :key="item._id"
        :item="item"
        @open="openItem"
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
  </div>
</template>


<script>
import MarketplaceItemCard from "../components/MarketplaceItemCard.vue";
import MarketplaceCreateModal from "../components/MarketplaceCreateModal.vue";

export default {
  name: "MarketplacePage",
  components: {
    MarketplaceItemCard,
    MarketplaceCreateModal
  },
  data() {
    return {
      search: "",
      searchTimeout: null,
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
async fetchItems() {
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

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(
      `http://localhost:3000/marketplace?${params.toString()}`,
      { headers }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch marketplace items");
    }

    this.items = await res.json();
  } catch (err) {
    console.error("Fetch marketplace error", err);
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
}


  },
  watch: {
  search() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.fetchItems();
    }, 400);
  }
}, 
  mounted() {
    this.fetchItems();
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
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  cursor: pointer;
  max-width: 750px; 
  margin: 0 auto;
  margin-bottom: 20px;
}

.create-box input {
  flex: 1;
  border: none;
  background: #f3f4f6;
  padding: 10px 16px;
  border-radius: 999px;
  max-width: 750px; 
  margin: 0 auto;
   
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.empty {
  text-align: center;
  color: #ff642f;
  margin-top: 40px;
}

@media (max-width: 1024px) {
  .marketplace-wrapper {
    padding-left: 0;
  }
}

@media (max-width: 768px) {
  .marketplace-header {
    padding: 12px;
  }

  .search-box {
    flex-direction: column;
  }

  .search-box button {
    width: 100%;
  }

  .items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
}


</style>

