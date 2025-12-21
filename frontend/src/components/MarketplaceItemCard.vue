<template>
  <div class="item-card" @click="$emit('open', item)">
    <div class="image-box">
      <img :src="imageUrl" />
      <span class="badge">{{ typeLabel }}</span>
    </div>

    <div class="content">
      <div class="price">{{ formatPrice(item.price) }}</div>
      <div class="title">{{ item.title }}</div>
      <div class="seller">
        <img :src="avatarUrl" />
        <span>{{ item.seller?.firstname }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MarketplaceItemCard",
  props: {
    item: Object
  },
  computed: {
    imageUrl() {
      if (this.item.images?.length) {
        return `http://localhost:3000/${this.item.images[0]}`;
      }
      return "https://via.placeholder.com/300";
    },
    avatarUrl() {
      if (this.item.seller?.avatar) {
        return `http://localhost:3000/${this.item.seller.avatar}`;
      }
      return "https://via.placeholder.com/40";
    },

    typeLabel() {
    const map = {
      ingredient: "Ingredients",
      dish: "Dishes",
      tool: "Tools"
    };
    return map[this.item.type] || "Item";
  }

  },
  methods: {
    formatPrice(v) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(v);

    }
  }
};
</script>

<style scoped>
.item-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  
}

.item-card:hover {
  transform: translateY(-3px);
}

.image-box {
  position: relative;
  height: 180px;
}

.image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ff642f;
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
  color: #ff642f;
  margin-bottom: 4px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.seller {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.seller img {
  width: 26px;
  height: 26px;
  border-radius: 50%;
}
</style>
