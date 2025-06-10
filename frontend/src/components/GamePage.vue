<template>
  <div class="game-container">
    <div class="game-layout">
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="title-section">
            <h1 class="game-title">Game</h1>
            <!-- <button class="settings-btn">
              <i class="fas fa-cog"></i>
            </button> -->
          </div>
          <div class="search-section">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Search Game" v-model="searchQuery">
          </div>
        </div>

        <div class="menu-list">
          <div class="menu-item active">
            <div class="menu-icon blue-bg">
              <i class="fas fa-gamepad"></i>
            </div>
            <span>Play Game</span>
          </div>
          
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-chart-line"></i>
            </div>
            <span>Gaming Activity</span>
          </div>
          
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-bell"></i>
            </div>
            <span>Notifications</span>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>Categories</h3>
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-th-large"></i>
            </div>
            <span>All Games</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-fist-raised"></i>
            </div>
            <span>Action</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-map"></i>
            </div>
            <span>Adventure</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-rocket"></i>
            </div>
            <span>Arcade</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="menu-item">
            <div class="menu-icon gray-bg">
              <i class="fas fa-sword"></i>
            </div>
            <span>Battle</span>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Hot Games Section -->
        <div class="content-header">
          <h1>🔥 Hot Games</h1>
        </div>

        <div class="game-grid">
          <div v-for="game in hotGames" :key="game.id" class="game-card">
            <div class="game-image">
              <img :src="require(`@/assets/games/${game.image}`)" :alt="game.title">
              <div class="game-overlay" v-if="game.condition">
                <span class="condition-badge">{{ game.condition }}</span>
              </div>
              <div class="play-button">
                <i class="fas fa-play"></i>
              </div>
            </div>
            <div class="game-info">
              <div class="game-title">{{ game.title }}</div>
              <div class="game-genre">{{ game.genre }}</div>
            </div>
          </div>
        </div>

        <!-- All Games Section -->
        <div class="content-header section-spacing">
          <h1>🎮 All Games</h1>
        </div>

        <div class="game-grid">
          <div v-for="game in allGames" :key="game.id" class="game-card">
            <div class="game-image">
              <img :src="require(`@/assets/games/${game.image}`)" :alt="game.title">
              <div class="game-overlay" v-if="game.condition">
                <span class="condition-badge">{{ game.condition }}</span>
              </div>
              <div class="play-button">
                <i class="fas fa-play"></i>
              </div>
            </div>
            <div class="game-info">
              <div class="game-title">{{ game.title }}</div>
              <div class="game-genre">{{ game.genre }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "GamePage",
  data() {
    return {
      searchQuery: '',
      hotGames: [
        {
          id: 1,
          title: 'Krunker',
          image: 'krunker.png',
          genre: 'FPS',
          condition: 'Hot'
        },
        {
          id: 2,
          title: 'Call of Duty',
          image: 'cod.png',
          genre: 'FPS'
        },
        {
          id: 3,
          title: 'Minecraft',
          image: 'minecraft.png',
          genre: 'Sandbox'
        },
        {
          id: 4,
          title: 'Fortnite',
          image: 'fortnite.png',
          genre: 'Battle Royale'
        },
        {
          id: 5,
          title: 'League of Legends',
          image: 'lol.png',
          genre: 'MOBA'
        },
        {
          id: 6,
          title: 'Apex Legends',
          image: 'apex.png',
          genre: 'Battle Royale'
        }
      ],
      allGames: [
        {
          id: 7,
          title: 'Valorant',
          image: 'valorant.png',
          genre: 'FPS'
        },
        {
          id: 8,
          title: 'Among Us',
          image: 'amongus.png',
          genre: 'Social Deduction'
        },
        {
          id: 9,
          title: 'Rocket League',
          image: 'rocketleague.png',
          genre: 'Sports'
        },
        {
          id: 10,
          title: 'Fall Guys',
          image: 'fallguys.png',
          genre: 'Party'
        },
        {
          id: 11,
          title: 'CS:GO',
          image: 'csgo.png',
          genre: 'FPS'
        },
        {
          id: 12,
          title: 'Overwatch',
          image: 'overwatch.png',
          genre: 'FPS'
        },
        {
          id: 13,
          title: 'Roblox',
          image: 'roblox.png',
          genre: 'Platform'
        },
        {
          id: 14,
          title: 'Genshin Impact',
          image: 'genshin.png',
          genre: 'RPG'
        },
        {
          id: 15,
          title: 'FIFA 24',
          image: 'fifa.png',
          genre: 'Sports'
        },
        {
          id: 16,
          title: 'Grand Theft Auto V',
          image: 'gta5.png',
          genre: 'Action'
        },
        {
          id: 17,
          title: 'Dota 2',
          image: 'dota2.png',
          genre: 'MOBA'
        },
        {
          id: 18,
          title: 'PUBG',
          image: 'pubg.png',
          genre: 'Battle Royale'
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

.game-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.game-layout {
  display: flex;
  max-width: 1920px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
}

/* Sidebar Styling */
.sidebar {
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  height: fit-content;
  position: sticky;
  top: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f2f5;
}

.title-section {
  size: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.game-title {
  font-size: 36px;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.settings-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.settings-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.search-section {
  position: relative;
}

.search-section i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #667eea;
  font-size: 16px;
}

.search-section input {
  width: 100%;
  padding: 12px 20px 12px 48px;
  border: 2px solid #e8ecf4;
  border-radius: 25px;
  background-color: #f8fafc;
  font-size: 15px;
  outline: none;
  color: #1a202c;
  transition: all 0.3s ease;
}

.search-section input:focus {
  border-color: #667eea;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  transform: translateX(4px);
}

.menu-item.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.menu-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.blue-bg {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.gray-bg {
  background: #e8ecf4;
  color: #667eea;
}

.menu-item span {
  font-size: 15px;
  font-weight: 600;
  flex: 1;
}

.menu-item.active span {
  color: white;
}

.sidebar-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #f0f2f5;
}

.sidebar-section h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 12px;
}

/* Main Content */
.main-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.content-header {
  margin-bottom: 24px;
}

.content-header h1 {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-spacing {
  margin-top: 48px;
}

/* Game Grid - 6 games per row */
.game-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
}

.game-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  position: relative;
}

.game-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.game-image {
  width: 100%;
  height: 160px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
}

.game-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.game-card:hover .game-image img {
  transform: scale(1.1);
}

.game-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
}

.condition-badge {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.play-button {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: all 0.3s ease;
  transform: translateY(20px);
}

.game-card:hover .play-button {
  opacity: 1;
  transform: translateY(0);
}

.game-info {
  padding: 16px;
}

.game-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 4px;
  line-height: 1.3;
}

.game-genre {
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive Design */
@media (max-width: 1600px) {
  .game-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 1400px) {
  .game-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1200px) {
  .game-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .game-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    position: static;
  }
}

@media (max-width: 768px) {
  .game-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .game-container {
    padding: 16px;
  }
  
  .content-header h1 {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .game-grid {
    grid-template-columns: 1fr;
  }
  
  .game-image {
    height: 200px;
  }
}
</style>