<template>
  <div class="hidden-items-page">
    <h2>Hidden Posts & Shared Posts</h2>

    <!-- Filter Controls -->
    <div class="filter-buttons">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">All</button>
      <button :class="{ active: filter === 'post' }" @click="filter = 'post'">Posts</button>
      <button :class="{ active: filter === 'share' }" @click="filter = 'share'">Shares</button>
    </div>

    <div v-if="filteredItems.length === 0">
      <p>You haven't hidden any content.</p>
    </div>

    <div
      v-for="item in filteredItems"
      :key="item._id"
      class="item-card"
    >
      <!-- Hidden Original Post -->
      <div v-if="item.type === 'post'" class="original-post">
        <div class="post-header">
          <img :src="getAvatarUrl(item.author)" class="avatar" />
          <div>
            <strong>{{ item.author.firstname }} {{ item.author.lastname }}</strong>
            <div class="meta">
              <span class="time">{{ formatTime(item.createdAt) }}</span>
              <span class="audience-icon">{{ getAudienceIcon(item.audience) }}</span>
            </div>
          </div>
        </div>

        <div class="post-body">
          <p>{{ item.content }}</p>
          <template v-if="item.media">
            <img
              v-if="item.mediaType === 'image'"
              :src="getMediaUrl(item.media)"
              class="post-media"
            />
            <video
              v-else-if="item.mediaType === 'video'"
              controls
              class="post-media"
            >
              <source :src="getMediaUrl(item.media)" type="video/mp4" />
              Your browser does not support video playback.
            </video>
          </template>
        </div>

        <button @click="unhidePost(item._id)"> Unhide Post</button>
      </div>

      <!-- Hidden Shared Post -->
      <div v-else class="shared-post">
        <div class="share-header">
          <img :src="getAvatarUrl(item.username)" class="avatar" />
          <div>
            <strong>{{ item.username.firstname }} {{ item.username.lastname }}</strong>
            <div class="meta">
              <span class="time">{{ formatTime(item.createdAt) }}</span>
              <span class="audience-icon">{{ getAudienceIcon(item.audience) }}</span>
            </div>
          </div>
        </div>

        <div class="share-body">
          <p>{{ item.content }}</p>

          <div v-if="item.post" class="original-post">
            <div class="post-header">
              <img :src="getAvatarUrl(item.post.author)" class="avatar small" />
              <div>
                <strong>{{ item.post.author.firstname }} {{ item.post.author.lastname }}</strong>
                <div class="meta">
                  <span class="time">{{ formatTime(item.post.createdAt) }}</span>
                  <span class="audience-icon">{{ getAudienceIcon(item.post.audience) }}</span>
                </div>
              </div>
            </div>

            <div class="post-body">
              <p>{{ item.post.content }}</p>
              <template v-if="item.post.media">
                <img
                  v-if="item.post.mediaType === 'image'"
                  :src="getMediaUrl(item.post.media)"
                  class="post-media"
                />
                <video
                  v-else-if="item.post.mediaType === 'video'"
                  controls
                  class="post-media"
                >
                  <source :src="getMediaUrl(item.post.media)" type="video/mp4" />
                </video>
              </template>
            </div>
          </div>
        </div>

        <button @click="unhideShare(item._id)"> Unhide Share</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HiddenItems",
  data() {
    return {
      userId: null,
      hiddenItems: [],
      filter: 'all'
    };
  },
  computed: {
    filteredItems() {
      if (this.filter === 'all') return this.hiddenItems;
      return this.hiddenItems.filter(i => i.type === this.filter);
    }
  },
  methods: {
    async fetchHiddenItems() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return this.$router.push("/login");
        this.userId = user.id || user._id;

        const [postsRes, sharesRes] = await Promise.all([
          fetch(`http://localhost:3000/feeds/hidden-posts/${this.userId}`),
          fetch(`http://localhost:3000/feeds/hidden-shares/${this.userId}`)
        ]);

        const posts = await postsRes.json();
        const shares = await sharesRes.json();

        const allItems = [
          ...posts.map(p => ({ ...p, type: "post" })),
          ...shares.map(s => ({ ...s, type: "share" }))
        ];

        this.hiddenItems = allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } catch (err) {
        console.error("Error loading hidden content:", err);
        alert("Failed to load hidden content.");
      }
    },
    async unhidePost(postId) {
      try {
        await fetch(`http://localhost:3000/posts/unhide-post/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: this.userId })
        });
        this.hiddenItems = this.hiddenItems.filter(i => i._id !== postId);
      } catch (err) {
        alert("Failed to unhide post.");
      }
    },
    async unhideShare(shareId) {
      try {
        await fetch(`http://localhost:3000/shares/unhide-share/${shareId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: this.userId })
        });
        this.hiddenItems = this.hiddenItems.filter(i => i._id !== shareId);
      } catch (err) {
        alert("Failed to unhide share.");
      }
    },
    getAvatarUrl(user) {
      if (!user || !user.avatar) return "http://localhost:3000/uploads/user.png";
      return `http://localhost:3000/${user.avatar}`;
    },
    getMediaUrl(path) {
      return `http://localhost:3000/${path}`;
    },
    formatTime(dateStr) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? "" : date.toLocaleString();
    },
    getAudienceIcon(audience) {
      switch (audience) {
        case "public": return "🌐";
        case "friends": return "👥";
        case "private": return "🔒";
        default: return "❓";
      }
    }
  },
  mounted() {
    this.fetchHiddenItems();
  }
};
</script>

<style scoped>
.hidden-items-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
.item-card {
  border: 1px solid #ccc;
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 8px;
  background-color: #f9f9f9;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}
.avatar.small {
  width: 30px;
  height: 30px;
}
.post-media {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
  margin-top: 8px;
  background-color: #000;
  display: block;
}
button {
  margin-top: 12px;
  padding: 8px 16px;
  background-color: #1d4ed8;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
}
button:hover {
  background-color: #2563eb;
}
button:active {
  transform: scale(0.98);
}
.share-header,
.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.filter-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.filter-buttons button {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  background-color: #ddd;
  cursor: pointer;
}
.filter-buttons button.active {
  background-color: #1d4ed8;
  color: white;
  font-weight: bold;
}
.meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.9em;
  color: #666;
}
</style>
