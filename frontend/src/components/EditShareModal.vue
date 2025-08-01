<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-box">
      <h3>Edit Shared Post</h3>

      <!-- Thông tin người chia sẻ -->
      <div class="user-info">
        <img :src="getAvatarUrl(share?.username)" class="avatar" />
        <div>
          <strong>{{ share?.username?.firstname }} {{ share?.username?.lastname }}</strong>
          <p class="timestamp">{{ formatTime(share?.createdAt) }}</p>
        </div>
      </div>

      <!-- Chọn trạng thái hiển thị -->
      <div class="audience-select">
        <label for="audience">Audience:</label>
        <select id="audience" v-model="audience">
          <option value="public">🌐 Public</option>
          <option value="friends">👥 Friends</option>
          <option value="private">🔒 Private</option>
        </select>
      </div>

      <!-- Nội dung -->
      <textarea
        v-model="editedContent"
        placeholder="Say something about the shared post..."
      ></textarea>

      <!-- Nút hành động -->
      <div class="modal-actions">
        <button class="btn save" @click="submit">Save</button>
        <button class="btn cancel" @click="close">Cancel</button>
      </div>
    </div>
  </div>
</template>


<script>
export default {
  props: {
    share: Object,
  },
  data() {
    return {
      editedContent: this.share?.content || "",
      audience: this.share?.audience || "public",
    };
  },
  watch: {
    share(newVal) {
      this.editedContent = newVal?.content || "";
      this.audience = newVal?.audience || "public";
    }
  },
  methods: {
    async submit() {
      try {
        await this.$axios.put(`/shares/${this.share._id}`, {
          content: this.editedContent,
          audience: this.audience,
        });
        this.$emit("updated");
        this.close();
      } catch (err) {
        console.error("Edit share failed", err);
        alert("Failed to update shared post.");
      }
    },
    close() {
      this.$emit("close");
    },
    formatTime(date) {
      return new Date(date).toLocaleString();
    },
    getAvatarUrl(user) {
      return user?.avatar
        ? `http://localhost:3000/${user.avatar}`
        : require("@/assets/user.png");
    },
  },
};
</script>


<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  padding: 20px;
  width: 450px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  max-width: 90%;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}

.audience-select {
  margin-bottom: 12px;
}

.audience-select label {
  font-weight: bold;
  margin-right: 6px;
}

.audience-select select {
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

textarea {
  width: 100%;
  height: 100px;
  resize: none;
  border-radius: 8px;
  border: 1.5px solid #ccc;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  box-sizing: border-box;
  margin-bottom: 15px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.btn.save {
  background-color: #0d6efd;
  color: white;
  margin-right: 8px;
}

.btn.cancel {
  background-color: #e0e0e0;
}
</style>

