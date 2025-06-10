<template>
  <div class="messenger-container">
    <!-- Left Sidebar - Chat List -->
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <h2>Chats</h2>
        <div class="header-actions">
          <button class="icon-btn">
            <i class="dots-icon">⋯</i>
          </button>
          <button class="icon-btn">
            <i class="edit-icon">✏️</i>
          </button>
        </div>
      </div>
      
      <div class="search-container">
        <div class="search-box">
          <i class="search-icon">🔍</i>
          <input type="text" placeholder="Search Messenger" />
        </div>
      </div>

      <div class="contact-avatars">
        <div v-for="contact in quickContacts" :key="contact.id" class="contact-avatar">
          <img :src="contact.avatar" :alt="contact.name" />
          <span class="online-indicator" v-if="contact.online"></span>
        </div>
      </div>

      <div class="chat-tabs">
        <button class="tab-btn active">Inbox</button>
        <button class="tab-btn">Communities</button>
      </div>

      <div class="chat-list">
        <div 
          v-for="chat in chatList" 
          :key="chat.id" 
          class="chat-item"
          :class="{ active: selectedChat?.id === chat.id }"
          @click="selectChat(chat)"
        >
          <div class="chat-avatar">
            <img :src="chat.avatar" :alt="chat.name" />
            <span class="online-indicator" v-if="chat.online"></span>
          </div>
          <div class="chat-info">
            <div class="chat-header">
              <h4>{{ chat.name }}</h4>
              <span class="chat-time">{{ chat.time }}</span>
            </div>
            <p class="chat-preview">{{ chat.lastMessage }}</p>
          </div>
          <div class="chat-indicators">
            <span class="unread-badge" v-if="chat.unread">{{ chat.unread }}</span>
            <i class="message-status" v-if="chat.sent">✓</i>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="chat-main">
      <div v-if="selectedChat" class="chat-container">
        <!-- Chat Header -->
        <div class="chat-header-bar">
          <div class="chat-header-info">
            <img :src="selectedChat.avatar" :alt="selectedChat.name" class="header-avatar" />
            <div>
              <h3>{{ selectedChat.name }}</h3>
              <span class="online-status" v-if="selectedChat.online">Active now</span>
            </div>
          </div>
          <div class="chat-header-actions">
            <button class="icon-btn">📞</button>
            <button class="icon-btn">📹</button>
            <button class="icon-btn">ℹ️</button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="messages-container">
          <div class="messages-list">
            <div v-for="message in selectedChat.messages" :key="message.id" 
                 :class="['message', message.sender === 'me' ? 'sent' : 'received']">
              <div v-if="message.type === 'game'" class="game-message">
                <img :src="message.gameImage" alt="Game" class="game-image" />
                <div class="game-info">
                  <p>{{ message.text }}</p>
                  <small>{{ message.gameName }}</small>
                </div>
              </div>
              <div v-else class="text-message">
                {{ message.text }}
              </div>
              <div class="message-time">{{ message.time }}</div>
            </div>
          </div>
        </div>

        <!-- Message Input -->
        <div class="message-input-container">
          <div class="input-actions">
            <button class="icon-btn">➕</button>
            <button class="icon-btn">📷</button>
            <button class="icon-btn">🎤</button>
            <button class="icon-btn">😊</button>
          </div>
          <div class="message-input">
            <input 
              type="text" 
              v-model="newMessage"
              placeholder="Aa"
              @keypress.enter="sendMessage"
            />
          </div>
          <div class="send-actions">
            <button class="icon-btn">😊</button>
            <button class="icon-btn send-btn" @click="sendMessage">👍</button>
          </div>
        </div>
      </div>

      <div v-else class="no-chat-selected">
        <div class="welcome-message">
          <h2>Messages</h2>
          <p>This is your message center. Select a chat to start messaging.</p>
        </div>
      </div>
    </div>

    <!-- Right Sidebar - Chat Info -->
    <div class="info-sidebar" v-if="selectedChat">
      <div class="info-header">
        <h3>Tran Hao</h3>
        <span class="encryption-badge">🔒 End-to-end encrypted</span>
      </div>
      
      <div class="info-actions">
        <button class="info-action-btn">
          <i>👤</i>
          <span>Profile</span>
        </button>
        <button class="info-action-btn">
          <i>🔕</i>
          <span>Mute</span>
        </button>
        <button class="info-action-btn">
          <i>🔍</i>
          <span>Search</span>
        </button>
      </div>

      <div class="info-sections">
        <div class="info-section">
          <h4>Chat info</h4>
          <span class="expand-icon">⌄</span>
        </div>
        <div class="info-section">
          <h4>Customize chat</h4>
          <span class="expand-icon">⌄</span>
        </div>
        <div class="info-section">
          <h4>Media & files</h4>
          <span class="expand-icon">⌄</span>
        </div>
        <div class="info-section">
          <h4>Privacy & support</h4>
          <span class="expand-icon">⌄</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MessagePage",
  data() {
    return {
      selectedChat: null,
      newMessage: '',
      quickContacts: [
        { id: 1, name: 'Phan', avatar: 'https://via.placeholder.com/40/4267B2/white?text=P', online: true },
        { id: 2, name: 'Tran', avatar: 'https://via.placeholder.com/40/42B883/white?text=T', online: true },
        { id: 3, name: 'Vps', avatar: 'https://via.placeholder.com/40/000000/white?text=V', online: false },
        { id: 4, name: 'Phi', avatar: 'https://via.placeholder.com/40/FF6B6B/white?text=P', online: false },
        { id: 5, name: 'Ngoc', avatar: 'https://via.placeholder.com/40/4ECDC4/white?text=N', online: false }
      ],
      chatList: [
        {
          id: 1,
          name: 'Krunker FRVR',
          avatar: 'https://via.placeholder.com/50/FF6B35/white?text=K',
          lastMessage: 'Krunker FRVR sent an attachment.',
          time: '1h',
          online: false,
          unread: 0,
          messages: [
            { id: 1, text: 'Hey! Want to play Krunker?', sender: 'them', time: '10:30 AM' },
            { id: 2, text: 'Sure! Let me join', sender: 'me', time: '10:32 AM' }
          ]
        },
        {
          id: 2,
          name: 'Facebook user',
          avatar: 'https://via.placeholder.com/50/4267B2/white?text=F',
          lastMessage: 'Facebook user sent an attachment...',
          time: '1d',
          online: false,
          unread: 1,
          messages: [
            { id: 1, text: 'Check out this cool feature!', sender: 'them', time: '2:00 PM' }
          ]
        },
        {
          id: 3,
          name: '12C8',
          avatar: 'https://via.placeholder.com/50/42B883/white?text=12',
          lastMessage: 'Lê Diệp Minh Thu left the group.',
          time: '7w',
          online: false,
          unread: 0,
          messages: [
            { id: 1, text: 'Lê Diệp Minh Thu left the group.', sender: 'system', time: '3:00 PM' }
          ]
        },
        {
          id: 4,
          name: 'Tran Hao',
          avatar: 'https://via.placeholder.com/50/6C5CE7/white?text=T',
          lastMessage: 'You sent an attachment.',
          time: '8w',
          online: true,
          unread: 0,
          messages: [
            { 
              id: 1, 
              type: 'game',
              text: 'Hào đã mời bạn chơi',
              gameName: 'Tiến Lên Miền Nam Cybergame',
              gameImage: 'https://via.placeholder.com/300x150/FF6B6B/white?text=Game',
              sender: 'them', 
              time: '10:04 AM' 
            },
            { id: 2, text: 'Sounds fun! I\'ll join in a bit', sender: 'me', time: '10:05 AM' }
          ]
        },
        {
          id: 5,
          name: 'Facebook user',
          avatar: 'https://via.placeholder.com/50/A0A0A0/white?text=F',
          lastMessage: 'Mình cũng chưa nhận được',
          time: '12w',
          online: false,
          unread: 0,
          messages: [
            { id: 1, text: 'Mình cũng chưa nhận được', sender: 'them', time: '1:00 PM' }
          ]
        }
      ]
    }
  },
  mounted() {
    // Simulate user check without localStorage
    const user = { name: 'Current User', id: 1 };
    if (!user) {
      // In a real app, you would redirect to login
      console.log('Would redirect to login');
    }
  },
  methods: {
    selectChat(chat) {
      this.selectedChat = chat;
    },
    sendMessage() {
      if (this.newMessage.trim() && this.selectedChat) {
        const message = {
          id: Date.now(),
          text: this.newMessage,
          sender: 'me',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.selectedChat.messages.push(message);
        this.selectedChat.lastMessage = this.newMessage;
        this.newMessage = '';
      }
    }
  }
};
</script>

<style scoped>
.messenger-container {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #fff;
}

/* Left Sidebar */
.chat-sidebar {
  width: 360px;
  border-right: 1px solid #e4e6ea;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e6ea;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: #f0f2f5;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
}

.icon-btn:hover {
  background: #e4e6ea;
}

.search-container {
  padding: 16px 20px;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f0f2f5;
  border-radius: 20px;
  padding: 8px 16px;
}

.search-box input {
  border: none;
  background: none;
  outline: none;
  margin-left: 8px;
  flex: 1;
}

.contact-avatars {
  display: flex;
  gap: 12px;
  padding: 0 20px 16px;
  overflow-x: auto;
}

.contact-avatar {
  position: relative;
  flex-shrink: 0;
}

.contact-avatar img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background: #42b883;
  border: 2px solid white;
  border-radius: 50%;
}

.chat-tabs {
  display: flex;
  border-bottom: 1px solid #e4e6ea;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 600;
  color: #65676b;
}

.tab-btn.active {
  color: #1877f2;
  border-bottom: 2px solid #1877f2;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  gap: 12px;
}

.chat-item:hover {
  background: #f0f2f5;
}

.chat-item.active {
  background: #e7f3ff;
}

.chat-avatar {
  position: relative;
  flex-shrink: 0;
}

.chat-avatar img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.chat-header h4 {
  margin: 0;
  font-weight: 600;
  font-size: 15px;
}

.chat-time {
  font-size: 13px;
  color: #65676b;
}

.chat-preview {
  margin: 0;
  color: #65676b;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-indicators {
  display: flex;
  align-items: center;
  gap: 4px;
}

.unread-badge {
  background: #1877f2;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
}

/* Main Chat Area */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-chat-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.welcome-message {
  text-align: center;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e4e6ea;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.chat-header-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.online-status {
  font-size: 12px;
  color: #42b883;
}

.chat-header-actions {
  display: flex;
  gap: 8px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.message.sent {
  align-items: flex-end;
}

.message.received {
  align-items: flex-start;
}

.text-message {
  background: #f0f2f5;
  padding: 8px 16px;
  border-radius: 18px;
  max-width: 70%;
  word-wrap: break-word;
}

.message.sent .text-message {
  background: #1877f2;
  color: white;
}

.game-message {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f0f2f5;
  padding: 12px;
  border-radius: 12px;
  max-width: 400px;
}

.game-image {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.message-time {
  font-size: 11px;
  color: #65676b;
  margin-top: 4px;
}

.message-input-container {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e4e6ea;
  gap: 8px;
}

.input-actions, .send-actions {
  display: flex;
  gap: 4px;
}

.message-input {
  flex: 1;
}

.message-input input {
  width: 100%;
  border: 1px solid #e4e6ea;
  border-radius: 20px;
  padding: 8px 16px;
  outline: none;
}

.send-btn {
  background: #1877f2;
  color: white;
}

/* Right Sidebar */
.info-sidebar {
  width: 320px;
  border-left: 1px solid #e4e6ea;
  padding: 20px;
}

.info-header {
  text-align: center;
  margin-bottom: 24px;
}

.info-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.encryption-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
  color: #65676b;
}

.info-actions {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
}

.info-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
}

.info-action-btn:hover {
  background: #f0f2f5;
}

.info-action-btn i {
  font-size: 24px;
}

.info-action-btn span {
  font-size: 12px;
  color: #65676b;
}

.info-sections {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.info-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  cursor: pointer;
}

.info-section:hover {
  background: #f0f2f5;
}

.info-section h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
}

.expand-icon {
  color: #65676b;
  font-size: 18px;
}
</style>