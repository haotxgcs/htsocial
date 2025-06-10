<template>
  <div class="marketplace-container">
    <div class="marketplace-layout">
      <!-- Facebook-style Sidebar with Title and Search -->
      <div class="sidebar">
        <!-- Marketplace Title and Search moved to sidebar -->
        <div class="sidebar-header">
          <div class="title-section">
            <h1 class="marketplace-title">Marketplace</h1>
            <button class="settings-btn">
              <i class="fas fa-cog"></i>
            </button>
          </div>
          <div class="search-section">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Search Marketplace" v-model="searchQuery">
          </div>
        </div>

        <div class="menu-list">
          <div class="menu-item active">
            <div class="menu-icon blue-bg">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <span>Browse all</span>
          </div>
          
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-bell"></i>
            </div>
            <span>Notifications</span>
          </div>
          
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-inbox"></i>
            </div>
            <span>Inbox</span>
          </div>
          
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-shield-alt"></i>
            </div>
            <span>Marketplace access</span>
          </div>
          
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-shopping-bag"></i>
            </div>
            <span>Buying</span>
          </div>
          
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-tag"></i>
            </div>
            <span>Selling</span>
          </div>
        </div>

        <div class="create-btn">
          <i class="fas fa-plus"></i>
          Create new listing
        </div>

        <div class="sidebar-section">
          <h3>Location</h3>
          <p>Kiên Tân, Kiên Giang, Vietnam • Within 65 km</p>
        </div>

        <div class="sidebar-section">
          <h3>Categories</h3>
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-car"></i>
            </div>
            <span>Vehicles</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-tv"></i>
            </div>
            <span>Electronics</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-home"></i>
            </div>
            <span>Home & Garden</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-tshirt"></i>
            </div>
            <span>Fashion</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-utensils"></i>
            </div>
            <span>Food & Drink</span>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <div class="content-header">
          <h1>Today's picks</h1>
          <div class="location-pill">
            <i class="fas fa-map-marker-alt"></i>
            Huyện Tân Hiệp • 65 km
          </div>
        </div>

        <!-- Products Grid -->
        <div class="products-grid">
          <div v-for="product in products" :key="product.id" class="product-card">
            <div class="product-image">
              <img :src="product.image" :alt="product.title">
              <div class="product-overlay" v-if="product.condition">
                <span class="condition-badge">{{ product.condition }}</span>
              </div>
            </div>
            <div class="product-info">
              <div class="product-price">{{ product.price }}</div>
              <div class="product-title">{{ product.title }}</div>
              <div class="product-location">{{ product.location }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MarketplacePage",
  data() {
    return {
      searchQuery: '',
      products: [
        {
          id: 1,
          price: 'đ5,500,000',
          title: 'Reno11 5G 12/256GB 2sim máy zin đẹp full box',
          location: 'Cần Thơ',
          image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop'
        },
        {
          id: 2,
          price: 'đ9,990,000',
          title: 'asus rog g15 g512 zin đẹp 97%',
          location: 'Cần Thơ',
          image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=300&h=300&fit=crop'
        },
        {
          id: 3,
          price: 'đ4,200,000',
          title: 'Bán Honor 80',
          location: 'Long Xuyên',
          image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop'
        },
        {
          id: 4,
          price: 'đ150,000',
          title: 'Lại Vung',
          location: 'Cần Thơ',
          image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=300&fit=crop'
        },
        {
          id: 5,
          price: 'đ8,500,000',
          title: 'iPhone 14 Pro Max 256GB Deep Purple',
          location: 'Long Xuyên',
          image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop'
        },
        {
          id: 6,
          price: 'đ3,200,000',
          title: 'Đồng hồ nam da Louis Vuitton',
          location: 'Cần Thơ',
          image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=300&fit=crop'
        },
        {
          id: 7,
          price: 'đ12,500,000',
          title: 'iPad Pro M2 11inch 128GB WiFi',
          location: 'Long Xuyên',
          image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop'
        },
        {
          id: 8,
          price: 'đ6,800,000',
          title: 'Galaxy Quantum2 - Máy zin đẹp',
          location: 'Cần Thơ',
          image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
          condition: '31°C'
        }
      ]
    }
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.marketplace-container {
  background-color: #f0f2f5;
  min-height: 100vh;
  font-family: Segoe UI Historic, Segoe UI, Helvetica, Arial, sans-serif;
}

.marketplace-layout {
  display: flex;
  max-width: 1920px;
  margin: 0 auto;
  padding-top: 16px;
}

/* Sidebar with header content */
.sidebar {
  width: 360px;
  background: #ffffff;
  min-height: calc(100vh - 32px);
  padding: 16px;
  position: sticky;
  top: 16px;
  overflow-y: auto;
  border-radius: 8px;
  margin-right: 16px;
  margin-left: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Sidebar Header with Title and Search */
.sidebar-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e6ea;
}

.title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.marketplace-title {
  font-size: 24px;
  font-weight: 700;
  color: #1c1e21;
}

.settings-btn {
  background: #e4e6ea;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #65676b;
  font-size: 16px;
}

.settings-btn:hover {
  background: #d8dadf;
}

.search-section {
  position: relative;
  width: 100%;
}

.search-section i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #65676b;
  font-size: 16px;
}

.search-section input {
  width: 100%;
  padding: 8px 16px 8px 40px;
  border: 1px solid #dddfe2;
  border-radius: 20px;
  background-color: #f0f2f5;
  font-size: 15px;
  outline: none;
  color: #1c1e21;
}

.search-section input::placeholder {
  color: #65676b;
}

.search-section input:focus {
  border-color: #1877f2;
  background-color: #ffffff;
}

.menu-list {
  margin-bottom: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 2px;
  position: relative;
}

.menu-item:hover {
  background-color: #f2f2f2;
}

.menu-item.active {
  background-color: #e7f3ff;
}

.menu-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.blue-bg {
  background-color: #1877f2;
  color: white;
}

.gray-bg {
  background-color: #e4e6ea;
  color: #65676b;
}

.menu-item span {
  font-size: 15px;
  color: #1c1e21;
  font-weight: 500;
  flex: 1;
}

.menu-item .fa-chevron-down {
  color: #65676b;
  font-size: 12px;
  margin-left: auto;
}

.create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background-color: #1877f2;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  margin: 16px 0;
  transition: background-color 0.2s;
}

.create-btn:hover {
  background-color: #166fe5;
}

.create-btn i {
  margin-right: 8px;
  font-size: 16px;
}

.sidebar-section {
  margin-bottom: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e6ea;
}

.sidebar-section:first-of-type {
  border-top: none;
  padding-top: 0;
}

.sidebar-section h3 {
  font-size: 17px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 8px;
}

.sidebar-section p {
  font-size: 14px;
  color: #65676b;
  line-height: 1.4;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 0 16px 16px 0;
  background-color: #f0f2f5;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.content-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1c1e21;
}

.location-pill {
  background-color: #dbeafe;
  color: #1d4ed8;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #93c5fd;
  display: flex;
  align-items: center;
  gap: 6px;
}

.location-pill i {
  font-size: 12px;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
}

.product-card {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: #f8f9fa;
  position: relative;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
}

.condition-badge {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.product-info {
  padding: 8px 12px 12px 12px;
}

.product-price {
  font-size: 16px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 4px;
}

.product-title {
  font-size: 14px;
  color: #1c1e21;
  line-height: 1.3;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 36px;
}

.product-location {
  font-size: 12px;
  color: #65676b;
  line-height: 1.2;
}

/* Responsive */
@media (max-width: 1400px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .marketplace-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    margin: 0;
    margin-bottom: 16px;
    position: static;
  }
  
  .main-content {
    padding: 0 16px 16px 16px;
  }
  
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .content-header h1 {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .product-image {
    height: 180px;
  }
}
</style>