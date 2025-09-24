<template>
  <div class="emoji-picker" @click.stop>
    <!-- Categories -->
    <div class="emoji-categories">
      <button 
        v-for="category in emojiCategories" 
        :key="category.name"
        @click="selectedCategory = category.name"
        :class="{ active: selectedCategory === category.name }"
        class="emoji-category-btn"
      >
        {{ category.icon }}
      </button>
    </div>

    <!-- Emoji list -->
    <div class="emoji-grid">
      <button 
        v-for="emoji in getCurrentCategoryEmojis()" 
        :key="emoji"
        @click="$emit('select', emoji)"
        class="emoji-item"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "EmojiPicker",
  data() {
    return {
      selectedCategory: "Smileys",
      emojiCategories: [
        { name: "Smileys", icon: "😊", emojis: ["😀","😁","😂","🤣","😅","😍","😘","😎","😭","😡"] },
        { name: "Animals", icon: "🐶", emojis: ["🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁"] },
        { name: "Food", icon: "🍔", emojis: ["🍎","🍌","🍇","🍉","🍓","🍔","🍟","🍕","🌮","🍩"] },
        { name: "Activities", icon: "⚽", emojis: ["⚽","🏀","🏈","🎾","🏐","🎱","🏓","🥊","🎯","🏆"] },
        { name: "Travel", icon: "✈️", emojis: ["🚗","🚕","🚙","🚌","🚎","🏍","🚲","🚢","✈️","🚀"] }
      ]
    };
  },
  methods: {
    getCurrentCategoryEmojis() {
      const category = this.emojiCategories.find(c => c.name === this.selectedCategory);
      return category ? category.emojis : [];
    }
  }
};
</script>

<style scoped>
.emoji-picker {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px;
  width: 240px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.emoji-categories {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.emoji-category-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
.emoji-category-btn.active {
  background: #eee;
  border-radius: 6px;
}
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}
.emoji-item {
  font-size: 20px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
}
.emoji-item:hover {
  background: #f0f0f0;
  border-radius: 6px;
}
</style>
