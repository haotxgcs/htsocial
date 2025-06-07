<template>
  <div class="marketplace-container">
    <div class="marketplace-layout">
      <!-- Facebook-style Sidebar -->
      <div class="sidebar">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search Marketplace" v-model="searchQuery">
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
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <div class="content-header">
          <h1>Today's picks</h1>
          <div class="location-pill">
            Huyện Tân Hiệp • 65 km
          </div>
        </div>

        <!-- Products Grid -->
        <div class="products-grid">
          <div v-for="product in products" :key="product.id" class="product-card">
            <div class="product-image">
              <img :src="product.image" :alt="product.title">
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
          price: 'đ3,800,000',
          title: 'Samsung A73 5G zin mãn đẹp mượt,...',
          location: 'Long Xuyên',
          image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop'
        },
        {
          id: 2,
          price: 'đ1,200',
          title: 'Điện thoại redmi',
          location: 'Long Xuyên',
          image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop'
        },
        {
          id: 3,
          price: 'đ5,500,000',
          title: 'PASS Mac Pro 2017 i5/8/128',
          location: 'Long Xuyên',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop'
        },
        {
          id: 4,
          price: 'đ800,000',
          title: 'Oppo Reno 4 Ram 8/128gb màn lõ nút...',
          location: 'Thạnh Hóa, Cần Thơ, Vietnam',
          image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop'
        },
        {
          id: 5,
          price: 'đ2,500,000',
          title: 'Máy chơi game arcade stick',
          location: 'TP.HCM',
          image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=300&fit=crop'
        },
        {
          id: 6,
          price: 'đ15,000,000',
          title: 'Xe máy Honda Winner 150',
          location: 'Hà Nội',  
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop'
        },
        {
          id: 7,
          price: 'đ8,500,000',
          title: 'Laptop Dell Gaming',
          location: 'Đà Nẵng',
          image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=300&h=300&fit=crop'
        },
        {
          id: 8,
          price: 'đ1,200,000',
          title: 'Điện thoại iPhone cũ',
          location: 'Cần Thơ',
          image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop'
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
}

/* Sidebar - chính xác như Facebook */
.sidebar {
  width: 360px;
  background: #ffffff;
  min-height: 100vh;
  padding: 16px;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-bar {
  position: relative;
  margin-bottom: 8px;
}

.search-bar i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #65676b;
  font-size: 16px;
}

.search-bar input {
  width: 100%;
  padding: 8px 16px 8px 40px;
  border: none;
  border-radius: 20px;
  background-color: #f0f2f5;
  font-size: 15px;
  outline: none;
  color: #1c1e21;
}

.search-bar input::placeholder {
  color: #65676b;
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

.create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background-color: #42b883;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  margin: 16px 0;
  transition: background-color 0.2s;
}

.create-btn:hover {
  background-color: #369870;
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
  margin-left: 360px;
  padding: 16px 24px;
  background-color: #f0f2f5;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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
}

/* Products Grid - chính xác như Facebook */
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
  transition: transform 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.product-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: #f8f9fa;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .main-content {
    margin-left: 0;
    padding: 16px;
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