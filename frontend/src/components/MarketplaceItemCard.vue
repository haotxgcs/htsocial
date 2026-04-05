<template>
  <div class="item-card" @click="$router.push(`/marketplace/${item._id}`)">
    <div class="image-box" @click="$emit('open', item)">

      <!-- MENU 3 CHẤM -->
      <div
        v-if="isOwner"
        class="menu-wrapper"
        v-click-outside="closeMenu"
        @click.stop
      >
        <span class="menu-icon" @click.stop="toggleMenu">
          <Menu/>
        </span>

        <div v-if="showMenu" class="menu-dropdown" @click.stop>
          <button class="menu-item" @click.stop="editItem">
            <Pencil/>
            <span>Edit</span>
          </button>
          <button class="menu-item danger" @click.stop="deleteItem">
            <Trash2/>
            <span>Delete</span>
          </button>
        </div>
      </div>

      <img :src="imageUrl" />
      <span class="badge">{{ typeLabel }}</span>
    </div>

    <div class="content" @click="$emit('open', item)">
      <div class="price">{{ formatPrice(item.price) }}</div>
      <div class="title" :title="item.title">{{ item.title }}</div>
    <div class="rating-summary" v-if="item.rating.count > 0">
        <span class="avg-stars">
          <span v-for="s in 5" :key="s" class="avg-star" :class="{ full: s <= item.rating.average }">&#9733;</span>
        </span>
        <span class="avg-score">{{ item.rating.average }}</span>
        <span class="avg-count">({{ item.rating.count }} {{ item.rating.count === 1 ? 'review' : 'reviews' }})</span>
      </div>
    <div v-else class="no-review">No reviews yet.</div>
     
      <div class="seller">
        <img :src="avatarUrl" />
        <span>{{ item.seller?.firstname }} {{ item.seller?.lastname }}</span>
      </div>
    </div>
  </div>
</template>


<script>
import { Menu, Pencil, Trash2 } from 'lucide-vue-next';
  const clickOutside = {
    mounted(el, binding) {
      el._handler = (e) => {
        const path = e.composedPath();
        if (!path.includes(el)) {
          binding.value();
        }
      };
      document.addEventListener("click", el._handler);
    },
    unmounted(el) {
      document.removeEventListener("click", el._handler);
    }
  };

export default {
  name: "MarketplaceItemCard",
  components:{
    Menu,
    Pencil,
    Trash2
  },
  data() {
  return {
    showMenu: false,
    currentUser: JSON.parse(localStorage.getItem("user"))
  };
},
  props: {
    item: Object
  },
  directives: {
    clickOutside
  },
  computed: {
    isOwner() {
      if (!this.currentUser || !this.item?.seller) return false;

      return (
        this.item.seller._id ===
        (this.currentUser._id || this.currentUser.id)
      );
    },
    imageUrl() {
  if (!this.item.images?.length) {
    return "https://via.placeholder.com/300";
  }

  const img = this.item.images[0];

  // ✅ Nếu là ảnh Cloudinary (URL đầy đủ) thì dùng luôn
  if (img.startsWith("http")) {
    return img;
  }

  // ✅ Nếu là ảnh local (cũ) thì mới thêm localhost
  return `http://localhost:3000/${img}`;
},

    avatarUrl() {
      if (!this.item.seller.avatar) return 'http://localhost:3000/uploads/user.png';
      // Cloudinary URL đã có https:// → dùng thẳng, không prefix
      if (this.item.seller.avatar.startsWith('http')) return this.item.seller.avatar;
      return `http://localhost:3000/${this.item.seller.avatar}`;
    },

    typeLabel() {
    const map = {
      ingredient: "Ingredients",
      dish: "Dishes",
      tool: "Tools"
    };
    return map[this.item.type] || "Item";
  },
  

  },
  methods: {

    toggleMenu() {
      this.showMenu = !this.showMenu;
    },
    closeMenu() {
      this.showMenu = false;
    },
    editItem() {
      this.showMenu = false;
      this.$emit("edit", this.item); // 👉 để parent mở modal
    },
    deleteItem() {
      this.showMenu = false;
      this.$emit("delete", this.item); // 👉 để parent xử lý API
    },
    formatPrice(v) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(v);

    },
  }
};
</script>

<style scoped>
.item-card {
  width: 100%;
  background: var(--bg-card);
  border-radius: 16px;
  overflow: visible;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
}

.item-card:hover {
  transform: translateY(-3px);
}

.image-box {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background: var(--bg-input);
  border-radius: 16px 16px 0 0;
}

.image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px 16px 0 0;
}

.badge {
  position: absolute;
  top: 8px; left: 8px;
  background: #FF642F;
  color: white;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.content {
  padding: 12px;
}

.price {
  font-weight: 700;
  color: #FF642F;
  margin-bottom: 4px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.3;
  color: var(--text-main);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.review {
  font-size: 14px;
  font-weight: 500;
  color: #f5a623;
  font-style: italic;
  margin-bottom: 5px;
}

.no-review {
  font-size: 13px;
  color: var(--text-sub);
  font-style: italic;
  margin-bottom: 5px;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 6px;
}

.avg-stars { display: flex; gap: 1px; }
.avg-star { font-size: 18px; color: var(--border-color); }
.avg-star.full { color: #f5a623; }

.avg-score {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.avg-count {
  font-size: 13px;
  color: var(--text-sub);
}

.seller {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-sub);
}

.seller img {
  width: 26px; height: 26px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
}

/* ── MENU WRAPPER ── */
.menu-wrapper {
  position: absolute;
  top: 8px; right: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.item-card:hover .menu-wrapper {
  opacity: 1;
}

/* ── MENU ICON ── */
.menu-icon {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--bg-input);
  color: var(--text-sub);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.menu-icon:hover {
  background: var(--hover-bg);
  color: #FF642F;
}

/* ── MENU DROPDOWN ── */
.menu-dropdown {
  position: absolute;
  top: 34px; right: 0;
  background: var(--bg-card);
  border-radius: 10px;
  min-width: 140px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.15);
  border: 1px solid var(--border-color);
  overflow: hidden;
  animation: fadeDown 0.15s ease;
}

@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.menu-dropdown button {
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: var(--bg-card);
  color: var(--text-main);
  text-align: left;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.menu-dropdown button:hover {
  background: var(--hover-bg);
}

.menu-dropdown .danger {
  color: #ff4d4f;
}

/* ── MENU ITEM ── */
.menu-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 14px;
  border: none;
  background: var(--bg-card);
  color: var(--text-main);
  font-size: 14px; cursor: pointer;
  transition: background 0.15s;
}

.menu-item:hover { background: var(--hover-bg); }

.menu-item img {
  width: 24px !important; height: 24px !important;
  min-width: 24px; min-height: 24px;
  object-fit: contain; opacity: 0.75; flex-shrink: 0;
}

.menu-item.danger { color: #ff4d4f; }

.menu-item.danger .menu-icon-img {
  filter: brightness(0) saturate(100%) invert(33%) sepia(77%) saturate(3936%)
    hue-rotate(344deg) brightness(98%) contrast(101%);
}
</style>
