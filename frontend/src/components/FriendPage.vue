<template>
  <div class="friend-page">
    <h2>Friend</h2>

    <div class="friend-list">
      <div class="friend-card" v-for="friend in friends" :key="friend.id">
        <img :src="friend.avatar || defaultAvatar" class="avatar" />
        <div class="info">
          <h4>{{ friend.firstname }} {{ friend.lastname }}</h4>
          <p>{{ friend.username }}</p>
        </div>
        <button class="remove-btn" @click="removeFriend(friend.id)">Hủy kết bạn</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FriendPage",
  data() {
    return {
      friends: [],
      defaultAvatar: require('../assets/user.png'),
    };
  },
  mounted() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return this.$router.push("/login");

    // Gọi API lấy danh sách bạn bè
    fetch(`http://localhost:3000/users/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.friends && data.friends.length > 0) {
          Promise.all(
            data.friends.map(id =>
              fetch(`http://localhost:3000/users/${id}`).then(res => res.json())
            )
          ).then(friendsData => {
            this.friends = friendsData;
          });
        }
      });
  },
  methods: {
    async removeFriend(friendId) {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;

      try {
        const res = await fetch("http://localhost:3000/users/unfriend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, friendId })
        });
        const result = await res.json();
        if (res.ok) {
          this.friends = this.friends.filter(f => f.id !== friendId);
          alert("Đã hủy kết bạn!");
        } else {
          alert(result.msg || "Lỗi khi hủy kết bạn");
        }
      } catch (err) {
        console.error("Unfriend error:", err);
      }
    }
  }
};
</script>

<style scoped>
.friend-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
h2 {
  margin-bottom: 20px;
}
.friend-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.friend-card {
  display: flex;
  align-items: center;
  background: white;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 999px;
  margin-right: 15px;
  object-fit: cover;
}
.info h4 {
  margin: 0;
}
.info p {
  color: gray;
  font-size: 13px;
}
.remove-btn {
  margin-left: auto;
  background: #ff4d4f;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.remove-btn:hover {
  background: #d9363e;
}
</style>
