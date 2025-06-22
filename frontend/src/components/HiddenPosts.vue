<!-- src/views/HiddenPosts.vue -->
<template>
  <div class="hidden-posts-page">
    <h2>Hidden Posts</h2>

    <div v-if="hiddenPosts.length === 0">
      <p>You haven't hidden any posts.</p>
    </div>

    <div v-else class="post-list">
      <div v-for="post in hiddenPosts" :key="post._id" class="post-card">
        <div class="post-author">
          <strong>{{ post.author.firstname }} {{ post.author.lastname }}</strong>
        </div>
        <p>{{ post.content }}</p>

        <div v-if="post.media">
          <img
            v-if="post.mediaType === 'image'"
            :src="`http://localhost:3000/${post.media}`"
            class="post-media"
          />
          <video
            v-else-if="post.mediaType === 'video'"
            controls
            class="post-media"
          >
            <source :src="`http://localhost:3000/${post.media}`" />
          </video>
        </div>

        <button @click="undoHide(post._id)" class="btn-undo">Undo Hide</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HiddenPosts",
  data() {
    return {
      hiddenPosts: []
    };
  },
  async mounted() {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser) {
      this.$router.push("/login");
      return;
    }

    const res = await fetch(`http://localhost:3000/posts/hide-post/user/${savedUser.id}`);
    const data = await res.json();
    this.hiddenPosts = data;
  },
  methods: {
    async undoHide(postId) {
      const userId = JSON.parse(localStorage.getItem("user")).id;
      try {
        const res = await fetch(`http://localhost:3000/posts/unhide-post/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        });

        const data = await res.json();
        alert(data.msg);
        this.hiddenPosts = this.hiddenPosts.filter(p => p._id !== postId);
      } catch (err) {
        console.error("Undo hide error:", err);
        alert("Failed to undo hide post");
      }
    }
  }
};
</script>

<style scoped>
.hidden-posts-page {
  padding: 24px;
  max-width: 800px;
  margin: auto;
  font-family: Arial, sans-serif;
}

.post-card {
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease-in-out;
}
.post-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.post-author {
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.post-media {
  width: 100%;
  max-height: 360px;
  object-fit: cover;
  border-radius: 10px;
  margin-top: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

video.post-media {
  max-height: 400px;
}

.btn-undo {
  margin-top: 16px;
  background: #1976d2;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
}
.btn-undo:hover {
  background: #135ba1;
}

</style>
