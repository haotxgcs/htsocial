<template>
  <div class="hidden-shares-page">
    <h2>Hidden Shared Posts</h2>

    <div v-if="hiddenShares.length === 0">
      <p>You haven't hidden any shared posts.</p>
    </div>

    <!-- Loop through each hidden shared post -->
    <div
      v-for="share in hiddenShares"
      :key="share._id"
      class="share-card"
    >
      <!-- Shared by -->
      <div class="share-header">
        <img :src="getAvatarUrl(share.username)" class="avatar" />
        <div>
          <strong>{{ share.username.firstname }} {{ share.username.lastname }}</strong>
          <div class="time">{{ formatTime(share.createdAt) }}</div>
        </div>
      </div>

      <!-- Shared content -->
      <div class="share-content">
        <p>{{ share.content }}</p>

        <!-- Original post being shared -->
        <div v-if="share.post" class="original-post">
          <!-- Original author -->
          <div class="post-header">
            <img :src="getAvatarUrl(share.post.author)" class="avatar small" />
            <div>
              <strong>{{ share.post.author?.firstname }} {{ share.post.author?.lastname }}</strong>
              <div class="time">{{ formatTime(share.post.createdAt) }}</div>
            </div>
          </div>

          <!-- Original post content and media -->
          <div class="post-body">
            <p>{{ share.post.content }}</p>

            <!-- Media (image or video) -->
            <template v-if="share.post.media">
              <!-- Image -->
              <img
                v-if="share.post.mediaType === 'image'"
                :src="getMediaUrl(share.post.media)"
                class="post-media"
                alt="Post media"
              />

              <!-- Video -->
              <video
                v-else-if="share.post.mediaType === 'video'"
                controls
                class="post-media"
              >
                <source :src="getMediaUrl(share.post.media)" type="video/mp4" />
                Your browser does not support video playback.
              </video>
            </template>
          </div>
        </div>
      </div>

      <!-- Button to unhide the shared post -->
      <button @click="unhideShare(share._id)">Unhide</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "HiddenShares",
  data() {
    return {
      userId: null,
      hiddenShares: []
    };
  },
  methods: {
    // Load hidden shares when component mounts
    async fetchHiddenShares() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return this.$router.push("/login");

        this.userId = user.id || user._id;

        const res = await fetch(`http://localhost:3000/feeds/hidden-shares/${this.userId}`);
        const data = await res.json();
        this.hiddenShares = data;
      } catch (err) {
        console.error("Failed to fetch hidden shares:", err);
        alert("Could not load hidden shared posts.");
      }
    },

    // Send request to unhide the shared post
    async unhideShare(shareId) {
      try {
        const res = await fetch(`http://localhost:3000/shares/unhide-share/${shareId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: this.userId })
        });

        const data = await res.json();
        alert(data.msg || "Shared post unhidden successfully");

        // Remove unhidden post from list
        this.hiddenShares = this.hiddenShares.filter(s => s._id !== shareId);
      } catch (err) {
        console.error("Error un-hiding shared post:", err);
        alert("Failed to unhide the shared post.");
      }
    },

    // Get user avatar URL
    getAvatarUrl(user) {
      if (!user || !user.avatar) return 'http://localhost:3000/uploads/user.png';
      return `http://localhost:3000/${user.avatar}`;
    },

    // Get media (image/video) URL
    getMediaUrl(path) {
      if (!path) return '';
      return `http://localhost:3000/${path}`;
    },

    // Format timestamp to readable string
    formatTime(dateStr) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? '' : date.toLocaleString();
    }
  },
  mounted() {
    this.fetchHiddenShares();
  }
};
</script>

<style scoped>
.hidden-shares-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.share-card {
  border: 1px solid #ccc;
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.share-header,
.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
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

.original-post {
  background: #eee;
  padding: 10px;
  border-radius: 6px;
  margin-top: 10px;
}

.post-media {
  width: 100%;
  aspect-ratio: 1 / 1;        /* Square shape */
  object-fit: cover;
  border-radius: 8px;
  margin-top: 8px;
  background-color: #000;
  display: block;
}

/* Styled button */
button {
  margin-top: 12px;
  padding: 8px 16px;
  background-color: #1d4ed8;  /* Blue */
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #2563eb; /* Darker on hover */
}

button:active {
  transform: scale(0.98);    /* Press effect */
}
</style>
