<template>
  <div class="msg-container">

    <!-- ══ SIDEBAR ══════════════════════════════════════════════ -->
    <div v-if="mobileOpen" class="mobile-overlay" @click="mobileOpen = false"></div>
    <div class="sidebar" :class="{ 'mobile-open': mobileOpen }">
      <div class="sidebar-top">
        <h2 class="sidebar-title">{{ sidebarTab === 'chats' ? 'Chats' : 'Bạn bè' }}</h2>
      </div>

      <!-- Tabs -->
      <div class="sidebar-tabs">
        <button class="tab-btn" :class="{ active: sidebarTab === 'chats' }" @click="sidebarTab = 'chats'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Chats
          <span v-if="unreadCount > 0" class="tab-badge tab-badge-red">{{ unreadCount }}</span>
        </button>
        <button class="tab-btn" :class="{ active: sidebarTab === 'friends' }" @click="switchToFriends">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Bạn bè
          <span v-if="friends.length" class="tab-badge">{{ friends.length }}</span>
        </button>
      </div>

      <div class="search-wrap">
        <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="searchQuery" class="search-input" :placeholder="sidebarTab === 'chats' ? 'Tìm cuộc trò chuyện...' : 'Tìm bạn bè...'" />
      </div>

      <!-- ── Tab Chats ── -->
      <template v-if="sidebarTab === 'chats'">
        <div v-if="loadingContacts" class="skel-list">
          <div v-for="i in 5" :key="i" class="skel-row">
            <div class="skel skel-av"></div>
            <div class="skel-info">
              <div class="skel skel-name"></div>
              <div class="skel skel-prev"></div>
            </div>
          </div>
        </div>
        <div v-else class="contact-list">
          <div
            v-for="c in filteredContacts" :key="c._id"
            class="contact-row"
            :class="{ active: activePartner?._id === getPartner(c)?._id }"
            @click="selectPartner(getPartner(c))"
          >
            <div class="av-wrap">
              <img :src="resolveAvatar(getPartner(c))" class="av av-md" @error="onImgError" />
              <span v-if="isOnline(getPartner(c)?._id)" class="dot-online"></span>
            </div>
            <div class="contact-info">
              <div class="contact-top-row">
                <span class="contact-name">{{ getPartner(c)?.firstname }} {{ getPartner(c)?.lastname }}</span>
                <span class="contact-time">{{ fmtTime(c.createdAt) }}</span>
              </div>
              <div class="contact-bottom-row">
                <span class="contact-preview" :class="{ bold: isUnread(c) }">
                  <span v-if="isMine(c)" class="you-label">You: </span>
                  <span v-if="c.recalled" class="recalled-prev">recalled a message</span>
                  <span v-else>{{ c.content || '—' }}</span>
                </span>
                <span v-if="isUnread(c)" class="unread-badge"></span>
              </div>
            </div>
          </div>
          <div v-if="filteredContacts.length === 0" class="empty-sidebar">
            <p>Chưa có cuộc trò chuyện</p>
          </div>
        </div>
      </template>

      <!-- ── Tab Bạn bè ── -->
      <template v-else>
        <div v-if="loadingFriends" class="skel-list">
          <div v-for="i in 4" :key="i" class="skel-row">
            <div class="skel skel-av"></div>
            <div class="skel-info">
              <div class="skel skel-name"></div>
              <div class="skel skel-prev"></div>
            </div>
          </div>
        </div>
        <div v-else class="contact-list">
          <div
            v-for="f in filteredFriends" :key="f._id"
            class="contact-row friend-row"
            :class="{ active: activePartner?._id === f._id }"
            @click="startChatWithFriend(f)"
          >
            <div class="av-wrap">
              <img :src="resolveAvatar(f)" class="av av-md" @error="onImgError" />
              <span v-if="isOnline(f._id)" class="dot-online"></span>
            </div>
            <div class="contact-info">
              <div class="contact-top-row">
                <span class="contact-name">{{ f.firstname }} {{ f.lastname }}</span>
                <span v-if="isOnline(f._id)" class="online-label">Online</span>
              </div>
              <div class="contact-bottom-row">
                <span class="contact-preview">{{ f.email || 'Nhấn để nhắn tin' }}</span>
                <button class="chat-now-btn" @click.stop="startChatWithFriend(f)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div v-if="filteredFriends.length === 0 && !loadingFriends" class="empty-sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" width="36" height="36" style="margin-bottom:8px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p>Không có bạn bè nào</p>
          </div>
        </div>
      </template>
    </div>

    <!-- ══ MAIN ══════════════════════════════════════════════════ -->
    <div class="chat-main">
      <template v-if="activePartner">

        <!-- Header -->
        <div class="chat-header">
          <div class="chat-header-left">
            <button class="back-btn" @click="mobileOpen = true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            <!-- Avatar + tên: hover để hiện popup -->
            <div
              class="partner-trigger"
              @mouseenter="showPartnerMenu = true"
              @mouseleave="showPartnerMenu = false"
            >
              <div class="av-wrap">
                <img :src="resolveAvatar(activePartner)" class="av av-lg" @error="onImgError" />
                <span v-if="isOnline(activePartner._id)" class="dot-online"></span>
              </div>
              <div>
                <div class="partner-name">{{ activePartner.firstname }} {{ activePartner.lastname }}</div>
                <div class="partner-status" :class="{ online: isOnline(activePartner._id) }">
                  {{ isOnline(activePartner._id) ? 'Active now' : 'Offline' }}
                </div>
              </div>

              <!-- Popup menu -->
              <transition name="fade">
                <div v-if="showPartnerMenu" class="partner-popup">
                  <div class="partner-popup-head">
                    <img :src="resolveAvatar(activePartner)" class="av av-md" @error="onImgError" />
                    <div>
                      <div class="pp-name">{{ activePartner.firstname }} {{ activePartner.lastname }}</div>
                      <div class="pp-status" :class="{ online: isOnline(activePartner._id) }">
                        {{ isOnline(activePartner._id) ? '● Online' : '○ Offline' }}
                      </div>
                    </div>
                  </div>
                  <div class="partner-popup-actions">
                    <button class="pp-btn" @click="viewProfile(activePartner)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Xem trang cá nhân
                    </button>
                    <button class="pp-btn pp-btn-danger" @click="blockUser(activePartner)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                      Chặn người dùng
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <div class="chat-header-right">
            <button class="header-del-btn" @click="deleteConversation" title="Xóa toàn bộ tin nhắn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              <span>Xóa lịch sử</span>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="msgs-area" ref="msgsArea">

          <div v-if="hasMore" class="load-older">
            <button @click="loadMore" :disabled="loadingMore">
              {{ loadingMore ? 'Loading...' : '↑ Load older messages' }}
            </button>
          </div>

          <!-- Skeleton -->
          <template v-if="loadingMsgs">
            <div v-for="i in 5" :key="i" class="msg-row" :class="i % 2 === 0 ? 'mine' : 'theirs'">
              <div class="skel skel-bubble"></div>
            </div>
          </template>

          <template v-for="(msg, idx) in messages" :key="msg._id || msg.tempId">

            <!-- Date separator -->
            <div v-if="showDateSep(idx)" class="date-sep">
              <span>{{ fmtDateSep(msg.createdAt) }}</span>
            </div>

            <div
              class="msg-row"
              :class="isMine(msg) ? 'mine' : 'theirs'"
            >
              <!-- Avatar (received only, show on last of group) -->
              <div class="msg-av-wrap" v-if="!isMine(msg)">
                <img
                  v-if="isLastInGroup(idx)"
                  :src="resolveAvatar(activePartner)"
                  class="av av-sm msg-av"
                  @error="onImgError"
                />
                <div v-else class="av-spacer"></div>
              </div>

              <div class="bubble-col">

                <!-- Bubble + hover actions wrapped together -->
                <div class="bubble-wrap"
                  @mouseenter="hoveredMsg = msg._id || msg.tempId"
                  @mouseleave="hoveredMsg = null"
                >
                  <div
                    class="bubble"
                    :class="{
                      'b-mine':    isMine(msg),
                      'b-theirs':  !isMine(msg),
                      'b-recalled': msg.recalled,
                      'b-sending':  msg.sending,
                      'b-failed':   msg.failed,
                      'b-reply':    !!msg.replyTo && !msg.recalled
                    }"
                  >
                    <!-- Reply preview INSIDE bubble -->
                    <div v-if="msg.replyTo && !msg.recalled" class="reply-snip" :class="isMine(msg) ? 'reply-snip-mine' : 'reply-snip-theirs'">
                      <span class="reply-accent"></span>
                      <div class="reply-snip-body">
                        <span class="reply-snip-who">{{ getReplyName(msg.replyTo) }}</span>
                        <span class="reply-snip-txt">{{ msg.replyTo.recalled ? 'Recalled message' : msg.replyTo.content }}</span>
                      </div>
                    </div>

                    <span v-if="msg.recalled" class="recalled-txt">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                      Message recalled
                    </span>
                    <span v-else-if="msg.failed" class="failed-txt">Failed to send ⚠️</span>
                    <span v-else class="bubble-text">{{ msg.content }}</span>
                  </div>

                  <!-- Hover actions — anchored next to bubble -->
                  <transition name="fade">
                    <div
                      v-if="hoveredMsg === (msg._id || msg.tempId) && !msg.recalled && !msg.sending"
                      class="msg-actions"
                      :class="isMine(msg) ? 'acts-left' : 'acts-right'"
                      @mouseenter="hoveredMsg = msg._id || msg.tempId"
                    >
                      <!-- React -->
                      <div class="act-wrap" @click.stop>
                        <button class="act-btn" @click="toggleEmoji(msg._id || msg.tempId)" title="React">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                          <span class="act-label">React</span>
                        </button>
                        <div v-if="emojiFor === (msg._id || msg.tempId)" class="emoji-panel" :class="isMine(msg) ? 'emoji-panel-left' : 'emoji-panel-right'">
                          <span v-for="e in EMOJIS" :key="e" class="emoji-opt" @click.stop="reactTo(msg, e)">{{ e }}</span>
                        </div>
                      </div>

                      <!-- Reply -->
                      <button class="act-btn" @click.stop="setReply(msg)" title="Reply">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                        <span class="act-label">Reply</span>
                      </button>

                      <!-- Recall (mine, within 10 min) -->
                      <button v-if="isMine(msg) && canRecall(msg)" class="act-btn" @click.stop="recallMsg(msg)" title="Recall">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                        <span class="act-label">Recall</span>
                      </button>

                      <!-- Delete -->
                      <button class="act-btn act-del" @click.stop="deleteMsg(msg)" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        <span class="act-label">Delete</span>
                      </button>
                    </div>
                  </transition>
                </div>

                <!-- Reactions -->
                <div v-if="msg.reactions?.length" class="react-bar" :class="isMine(msg) ? 'react-right' : 'react-left'">
                  <span
                    v-for="r in groupReactions(msg.reactions)"
                    :key="r.emoji"
                    class="react-chip"
                    :class="{ 'react-mine': myReaction(msg) === r.emoji }"
                    :title="r.names"
                    @click.stop="reactTo(msg, r.emoji)"
                  >{{ r.emoji }}{{ r.count > 1 ? ' ' + r.count : '' }}</span>
                </div>

                <!-- Meta -->
                <div class="msg-meta" :class="isMine(msg) ? 'meta-right' : 'meta-left'">
                  <span class="msg-time">{{ fmtMsgTime(msg.createdAt) }}</span>
                  <span v-if="isMine(msg) && !msg.recalled" class="msg-tick">
                    <span v-if="msg.sending" class="tick-pending">⏱</span>
                    <span v-else-if="msg.status === 'seen'"      class="tick-seen">✓✓</span>
                    <span v-else-if="msg.status === 'delivered'" class="tick-del">✓✓</span>
                    <span v-else                                 class="tick-sent">✓</span>
                  </span>
                </div>
              </div>

            </div>
          </template>

          <!-- Typing -->
          <div v-if="partnerTyping" class="msg-row theirs typing-row">
            <div class="msg-av-wrap">
              <img :src="resolveAvatar(activePartner)" class="av av-sm msg-av" @error="onImgError" />
            </div>
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Reply bar -->
        <div v-if="replyingTo" class="reply-bar">
          <div class="reply-bar-inner">
            <span class="reply-bar-accent"></span>
            <div class="reply-bar-body">
              <span class="reply-bar-who">Replying to {{ getReplyName(replyingTo) }}</span>
              <span class="reply-bar-txt">{{ replyingTo.content }}</span>
            </div>
          </div>
          <button class="reply-close" @click="replyingTo = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Input bar -->
        <div class="input-bar">
          <input
            v-model="draft"
            ref="inputRef"
            class="input-field"
            type="text"
            placeholder="Type a message..."
            @keydown.enter.prevent="send"
            @input="onTyping"
          />
          <button class="send-btn" @click="send" :disabled="!draft.trim()">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>

      </template>

      <!-- Empty state -->
      <div v-else class="empty-chat">
        <div class="empty-chat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" width="64" height="64"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <h3>Your Messages</h3>
        <p>Select a conversation to start chatting</p>
      </div>
    </div>

  </div>
</template>

<script>
import { io } from "socket.io-client";

const EMOJIS = ["❤️","😂","😮","😢","😡","👍","🔥","👏"];
const API    = process.env.VUE_APP_API_URL || "http://localhost:3000";

export default {
  name: "MessagePage",

  data() {
    return {
      EMOJIS,
      socket: null,
      currentUser: null,

      contacts: [],
      messages: [],
      activePartner: null,

      draft: "",
      searchQuery: "",
      replyingTo: null,

      loadingContacts: true,
      loadingMsgs: false,
      loadingMore: false,
      hasMore: false,
      currentPage: 1,

      onlineUserIds: new Set(),
      partnerTyping: false,
      typingTimer: null,
      isTypingSent: false,

      hoveredMsg: null,
      emojiFor: null,
      mobileOpen: false,

      sidebarTab: 'chats',
      friends: [],
      loadingFriends: false,

      unreadCount: 0,
      showPartnerMenu: false,
    };
  },

  computed: {
    myId() {
      return this.currentUser?._id || this.currentUser?.id;
    },
    filteredContacts() {
      if (!this.searchQuery.trim()) return this.contacts;
      const q = this.searchQuery.toLowerCase();
      return this.contacts.filter(c => {
        const p = this.getPartner(c);
        return `${p?.firstname || ""} ${p?.lastname || ""}`.toLowerCase().includes(q);
      });
    },
    filteredFriends() {
      if (!this.searchQuery.trim()) return this.friends;
      const q = this.searchQuery.toLowerCase();
      return this.friends.filter(f =>
        `${f.firstname || ""} ${f.lastname || ""} ${f.email || ""}`.toLowerCase().includes(q)
      );
    }
  },

  async mounted() {
    this.currentUser = JSON.parse(localStorage.getItem("user") || "null");
    if (!this.currentUser) { this.$router.push("/login"); return; }

    await this.fetchContacts();
    this.fetchUnreadCount();
    this.initSocket();

    const targetId = this.$route.query.userId;
    if (targetId) await this.openChatWith(targetId);

    document.addEventListener("click", this.closeEmoji);
  },

  beforeUnmount() {
    this.socket?.disconnect();
    document.removeEventListener("click", this.closeEmoji);
    clearTimeout(this.typingTimer);
  },

  methods: {

    // ── Socket ────────────────────────────────────────────────
    initSocket() {
      this.socket = io(API, { transports: ["websocket"] });

      this.socket.on("connect", () => {
        this.socket.emit("user:online", this.myId);
      });

      this.socket.on("users:online", ids => {
        this.onlineUserIds = new Set(ids.map(String));
      });

      this.socket.on("user:status", ({ userId, online }) => {
        const set = new Set(this.onlineUserIds);
        online ? set.add(String(userId)) : set.delete(String(userId));
        this.onlineUserIds = set;
      });

      // My message confirmed
      this.socket.on("message:sent", ({ tempId, message }) => {
        const idx = this.messages.findIndex(m => m.tempId === tempId);
        if (idx !== -1) this.messages.splice(idx, 1, message);
        else this.messages.push(message);
        this.bumpContact(message);
        this.$nextTick(this.scrollBottom);
      });

      // Incoming message
      this.socket.on("message:new", message => {
        const pid = this.activePartner?._id;
        const sid = message.sender?._id || message.sender;
        if (pid && String(sid) === String(pid)) {
          this.messages.push(message);
          this.$nextTick(this.scrollBottom);
          this.socket.emit("message:seen", {
            messageIds: [message._id],
            senderId: pid
          });
        }
        this.bumpContact(message);
      });

      // Status updates
      this.socket.on("message:status", ({ messageId, status, seenAt }) => {
        const m = this.messages.find(m => m._id === messageId);
        if (m) { m.status = status; if (seenAt) m.seenAt = seenAt; }
      });

      this.socket.on("message:status_bulk", ({ messageIds, status, seenAt }) => {
        messageIds.forEach(id => {
          const m = this.messages.find(m => m._id === id);
          if (m) { m.status = status; if (seenAt) m.seenAt = seenAt; }
        });
      });

      this.socket.on("message:recalled", ({ messageId }) => {
        const m = this.messages.find(m => m._id === messageId);
        if (m) { m.recalled = true; m.content = ""; }
      });

      this.socket.on("message:reacted", ({ messageId, reactions }) => {
        const m = this.messages.find(m => m._id === messageId);
        if (m) m.reactions = reactions;
      });

      this.socket.on("message:deleted", ({ messageId }) => {
        this.messages = this.messages.filter(m => m._id !== messageId);
      });

      this.socket.on("typing:start", ({ senderId }) => {
        if (String(senderId) === String(this.activePartner?._id)) {
          this.partnerTyping = true;
          this.$nextTick(this.scrollBottom);
        }
      });

      this.socket.on("typing:stop", ({ senderId }) => {
        if (String(senderId) === String(this.activePartner?._id))
          this.partnerTyping = false;
      });

      this.socket.on("message:error", ({ tempId }) => {
        const m = this.messages.find(m => m.tempId === tempId);
        if (m) { m.sending = false; m.failed = true; }
      });
    },

    // ── Data ──────────────────────────────────────────────────
    async openChatWith(userId) {
      try {
        const res  = await fetch(`${API}/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          const user = data.user || data;
          if (user?._id) { await this.selectPartner(user); return; }
        }
      } catch (e) { console.error("openChatWith:", e); }
      await this.selectPartner({ _id: userId, firstname: "User", lastname: "", avatar: "" });
    },

    async fetchContacts() {
      try {
        const res = await fetch(`${API}/messages/contacts`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) this.contacts = data.contacts;
        }
      } catch (e) { console.error("fetchContacts:", e); }
      finally { this.loadingContacts = false; }
    },

    async fetchFriends() {
      if (this.friends.length) return;
      this.loadingFriends = true;
      try {
        // Endpoint đúng: GET /users/:userId/friends
        // Response shape: { items: [...], totalItems, totalPages, currentPage }
        // Dùng limit=999 để lấy hết 1 lần, tránh phân trang
        const res = await fetch(`${API}/users/${this.myId}/friends?limit=999`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Backend trả về { items: [...] }
          const list = data.items || [];
          this.friends = list.filter(u => u && String(u._id) !== String(this.myId));
        }
      } catch (e) { console.error("fetchFriends:", e); }
      finally { this.loadingFriends = false; }
    },

    async fetchUnreadCount() {
      try {
        const res = await fetch(`${API}/messages/unread-count`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          this.unreadCount = data.count || 0;
        }
      } catch (e) { console.error("fetchUnreadCount:", e); }
    },

    viewProfile(partner) {
      this.showPartnerMenu = false;
      this.$router.push(`/profile/${partner._id}`);
    },

    async blockUser(partner) {
      this.showPartnerMenu = false;
      if (!confirm(`Chặn ${partner.firstname} ${partner.lastname}?\nHọ sẽ không thể nhắn tin cho bạn.`)) return;
      try {
        const res = await fetch(`${API}/users/block`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ targetId: partner._id })
        });
        if (res.ok) {
          alert(`Đã chặn ${partner.firstname} ${partner.lastname}`);
          this.activePartner = null;
          await this.fetchContacts();
        } else {
          alert('Không thể chặn người dùng này.');
        }
      } catch (e) {
        console.error("blockUser:", e);
      }
    },

    switchToFriends() {
      this.sidebarTab = 'friends';
      this.searchQuery = '';
      this.fetchFriends();
    },

    async startChatWithFriend(friend) {
      this.sidebarTab = 'chats';
      this.searchQuery = '';
      await this.selectPartner(friend);
    },

    async selectPartner(partner) {
      if (!partner?._id) return;
      if (String(this.activePartner?._id) === String(partner._id)) {
        this.mobileOpen = false; return;
      }
      this.mobileOpen = false;  // close sidebar on mobile after selecting

      if (this.activePartner) this.sendStopTyping();

      this.activePartner = partner;
      this.messages = [];
      this.currentPage = 1;
      this.hasMore = false;
      this.partnerTyping = false;
      this.replyingTo = null;
      this.draft = "";
      this.emojiFor = null;

      await this.fetchMessages(1);
      this.$nextTick(() => { this.scrollBottom(); this.$refs.inputRef?.focus(); });
      this.markSeen();
      // cập nhật lại unread count sau khi mở chat
      setTimeout(() => this.fetchUnreadCount(), 800);
    },

    async fetchMessages(page) {
      if (page === 1) this.loadingMsgs = true;
      else this.loadingMore = true;
      try {
        const res  = await fetch(
          `${API}/messages/${this.myId}/${this.activePartner._id}?page=${page}&limit=30`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        const data = await res.json();
        const msgs = Array.isArray(data) ? data : (data.messages || []);
        if (page === 1) this.messages = msgs;
        else this.messages = [...msgs, ...this.messages];
        this.hasMore  = data.hasMore || false;
        this.currentPage = page;
      } catch (e) { console.error("fetchMessages:", e); }
      finally { this.loadingMsgs = false; this.loadingMore = false; }
    },

    async loadMore() {
      if (this.loadingMore) return;
      const prev = this.$refs.msgsArea?.scrollHeight;
      await this.fetchMessages(this.currentPage + 1);
      this.$nextTick(() => {
        const el = this.$refs.msgsArea;
        if (el) el.scrollTop = el.scrollHeight - prev;
      });
    },

    // ── Send ──────────────────────────────────────────────────
    send() {
      const text = this.draft.trim();
      if (!text || !this.activePartner) return;
      this.draft = "";
      this.sendStopTyping();

      const tempId = `tmp_${Date.now()}`;
      const replySnapshot = this.replyingTo ? { ...this.replyingTo } : null;
      this.messages.push({
        tempId, content: text, sending: true, reactions: [], replyTo: replySnapshot,
        sender: { _id: this.myId }, receiver: { _id: this.activePartner._id },
        status: "sent", createdAt: new Date().toISOString()
      });
      this.replyingTo = null;
      this.$nextTick(this.scrollBottom);

      if (this.socket?.connected) {
        this.socket.emit("message:send", {
          receiverId: this.activePartner._id,
          content: text,
          replyTo: replySnapshot?._id || null,
          tempId
        });
      } else {
        this.restSend(text, tempId);
      }
    },

    async restSend(text, tempId) {
      try {
        const res = await fetch(`${API}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ senderId: this.myId, receiverId: this.activePartner._id, content: text })
        });
        if (res.ok) {
          const data = await res.json();
          const msg  = data.message || data;
          const idx  = this.messages.findIndex(m => m.tempId === tempId);
          if (idx !== -1) this.messages.splice(idx, 1, { ...msg, status: "sent" });
          this.bumpContact(msg);
        } else {
          const m = this.messages.find(m => m.tempId === tempId);
          if (m) { m.sending = false; m.failed = true; }
        }
      } catch (e) {
        const m = this.messages.find(m => m.tempId === tempId);
        if (m) { m.sending = false; m.failed = true; }
      }
    },

    // ── Typing ────────────────────────────────────────────────
    onTyping() {
      if (!this.isTypingSent) {
        this.isTypingSent = true;
        this.socket?.emit("typing:start", { receiverId: this.activePartner?._id });
      }
      clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(this.sendStopTyping, 2000);
    },
    sendStopTyping() {
      if (this.isTypingSent) {
        this.isTypingSent = false;
        this.socket?.emit("typing:stop", { receiverId: this.activePartner?._id });
      }
      clearTimeout(this.typingTimer);
    },

    // ── Recall ────────────────────────────────────────────────
    recallMsg(msg) {
      if (!confirm("Recall this message?")) return;
      this.socket?.emit("message:recall", { messageId: msg._id, receiverId: this.activePartner._id });
      msg.recalled = true; msg.content = "";
    },
    canRecall(msg) {
      return msg.createdAt && (Date.now() - new Date(msg.createdAt).getTime()) < 600000;
    },

    // ── Delete ────────────────────────────────────────────────
    deleteMsg(msg) {
      if (!confirm("Delete this message for you?")) return;
      this.socket?.emit("message:delete", { messageId: msg._id });
      this.messages = this.messages.filter(m => (m._id || m.tempId) !== (msg._id || msg.tempId));
    },

     async deleteConversation() {
      if (!confirm(`Xóa toàn bộ lịch sử chat với ${this.activePartner.firstname}?\nHành động này không thể hoàn tác.`)) return;
      try {
        const res = await fetch(`${API}/messages/conversation/${this.activePartner._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          this.messages = [];
        } else {
          // Fallback: xóa từng tin nhắn local nếu API chưa có endpoint này
          this.messages.forEach(m => {
            if (m._id) this.socket?.emit("message:delete", { messageId: m._id });
          });
          this.messages = [];
        }
      } catch {
        this.messages.forEach(m => {
          if (m._id) this.socket?.emit("message:delete", { messageId: m._id });
        });
        this.messages = [];
      }
    },

    // ── React ─────────────────────────────────────────────────
    reactTo(msg, emoji) {
      if (!msg._id) return;
      this.emojiFor = null;
      const current = this.myReaction(msg);
      this.socket?.emit("message:react", {
        messageId: msg._id,
        emoji: current === emoji ? "" : emoji,
        partnerId: this.activePartner._id
      });
    },
    myReaction(msg) {
      return msg.reactions?.find(r => String(r.user?._id || r.user) === String(this.myId))?.emoji;
    },
    groupReactions(reactions) {
      const map = {};
      reactions.forEach(r => {
        if (!map[r.emoji]) map[r.emoji] = { emoji: r.emoji, count: 0, names: [] };
        map[r.emoji].count++;
        map[r.emoji].names.push(r.user?.firstname || "");
      });
      return Object.values(map);
    },

    // ── Reply ─────────────────────────────────────────────────
    setReply(msg) {
      this.replyingTo = msg;
      this.$refs.inputRef?.focus();
    },
    getReplyName(msg) {
      const sid = msg.sender?._id || msg.sender;
      return String(sid) === String(this.myId)
        ? "You"
        : `${msg.sender?.firstname || ""} ${msg.sender?.lastname || ""}`.trim() || "User";
    },

    // ── Mark seen ─────────────────────────────────────────────
    markSeen() {
      const ids = this.messages
        .filter(m => !this.isMine(m) && m.status !== "seen" && m._id)
        .map(m => m._id);
      if (ids.length) {
        this.socket?.emit("message:seen", { messageIds: ids, senderId: this.activePartner._id });
      }
    },

    // ── Emoji picker ──────────────────────────────────────────
    toggleEmoji(msgId) { this.emojiFor = this.emojiFor === msgId ? null : msgId; },
    closeEmoji(e) { if (!e.target.closest(".act-wrap")) this.emojiFor = null; },

    // ── Helpers ───────────────────────────────────────────────
    getPartner(msg) {
      if (!msg) return null;
      const sid = msg.sender?._id || msg.sender;
      return String(sid) === String(this.myId) ? (msg.receiver || null) : (msg.sender || null);
    },

    isMine(msg) {
      const sid = msg.sender?._id || msg.sender;
      return String(sid) === String(this.myId);
    },

    isOnline(userId) {
      return !!userId && this.onlineUserIds.has(String(userId));
    },

    isUnread(msg) {
      const sid = msg.sender?._id || msg.sender;
      return String(sid) !== String(this.myId) && msg.status !== "seen";
    },

    // Avatar: handle relative path, cloudinary URL, and missing avatar
    resolveAvatar(user) {
      if (!user) return this.defaultAvatar();
      const av = user.avatar;
      if (!av) return this.defaultAvatar();
      if (av.startsWith("http")) return av;
      // relative path e.g. "uploads/abc.jpg" or "/uploads/abc.jpg"
      const clean = av.replace(/^\//, "");
      return `${API}/${clean}`;
    },

    defaultAvatar() {
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e4e6ea'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%23bcc0c4'/%3E%3Cellipse cx='20' cy='35' rx='12' ry='8' fill='%23bcc0c4'/%3E%3C/svg%3E`;
    },

    onImgError(e) { e.target.src = this.defaultAvatar(); },

    isLastInGroup(idx) {
      const next = this.messages[idx + 1];
      if (!next) return true;
      return this.isMine(next) !== this.isMine(this.messages[idx]);
    },

    showDateSep(idx) {
      if (idx === 0) return true;
      const prev = new Date(this.messages[idx - 1]?.createdAt);
      const curr = new Date(this.messages[idx]?.createdAt);
      return prev.toDateString() !== curr.toDateString();
    },

    bumpContact(msg) {
      const myId = String(this.myId);
      const sid  = String(msg.sender?._id || msg.sender);
      const rid  = String(msg.receiver?._id || msg.receiver);
      const partnerId = sid === myId ? rid : sid;

      const idx = this.contacts.findIndex(c => {
        const p = this.getPartner(c);
        return String(p?._id || p) === partnerId;
      });
      if (idx !== -1) {
        const c = { ...this.contacts[idx], ...msg };
        this.contacts.splice(idx, 1);
        this.contacts.unshift(c);
      } else {
        this.contacts.unshift(msg);
      }
    },

    scrollBottom() {
      const el = this.$refs.msgsArea;
      if (el) el.scrollTop = el.scrollHeight;
    },

    fmtTime(d) {
      if (!d) return "";
      const date = new Date(d);
      const diff = Math.floor((Date.now() - date) / 86400000);
      if (diff === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (diff === 1) return "Yesterday";
      if (diff < 7)  return date.toLocaleDateString([], { weekday: "short" });
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    },

    fmtMsgTime(d) {
      if (!d) return "";
      return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },

    fmtDateSep(d) {
      if (!d) return "";
      const date = new Date(d);
      const diff = Math.floor((Date.now() - date) / 86400000);
      if (diff === 0) return "Today";
      if (diff === 1) return "Yesterday";
      return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    }
  }
};
</script>

<style scoped>
/* ─── Layout ─────────────────────────────────────────────────── */
.msg-container {
  display: flex;
  height: calc(100vh - 60px);
  margin-top: 60px;
  margin-left: 0;
  width: 100%;
  padding: 16px 24px;
  box-sizing: border-box;
 background: #fff3ee;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  gap: 0;
}

/* ─── Sidebar ────────────────────────────────────────────────── */
.sidebar {
  width: 300px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #eef0f2;
  border-radius: 16px 0 0 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-top { padding: 20px 18px 12px; }
.sidebar-title { margin: 0; font-size: 22px; font-weight: 800; color: #111; }

.search-wrap {
  display: flex; align-items: center; gap: 8px;
  margin: 0 14px 12px;
  background: #f3f4f6; border-radius: 12px; padding: 9px 14px;
}
.search-ico { width: 15px; height: 15px; color: #9ca3af; flex-shrink: 0; }
.search-input { border: none; background: none; outline: none; flex: 1; font-size: 14px; color: #374151; }
.search-input::placeholder { color: #9ca3af; }

/* Sidebar tabs */
.sidebar-tabs {
  display: flex; gap: 4px;
  padding: 0 14px 10px; flex-shrink: 0;
}
.tab-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 10px; border: none; border-radius: 10px; cursor: pointer;
  font-size: 13px; font-weight: 600; color: #6b7280;
  background: #f3f4f6; transition: all 0.15s;
}
.tab-btn:hover { background: #e5e7eb; color: #374151; }
.tab-btn.active { background: #eff6ff; color: #3b82f6; }
.tab-badge {
  background: #3b82f6; color: #fff; font-size: 10px; font-weight: 700;
  padding: 1px 5px; border-radius: 20px; line-height: 1.4;
}
.tab-badge-red { background: #ef4444; }

/* Contact list */
.contact-list { flex: 1; overflow-y: auto; }
.contact-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; cursor: pointer;
  transition: background 0.12s; border-radius: 0;
}
.contact-row:hover  { background: #f9fafb; }
.contact-row.active { background: #eff6ff; }

.contact-info { flex: 1; min-width: 0; }
.contact-top-row { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; }
.contact-name { font-size: 14px; font-weight: 600; color: #111827; }
.contact-time { font-size: 11px; color: #9ca3af; flex-shrink: 0; }
.contact-bottom-row { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.contact-preview { font-size: 13px; color: #6b7280; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.contact-preview.bold { font-weight: 700; color: #111827; }
.you-label { color: #9ca3af; }
.recalled-prev { font-style: italic; color: #9ca3af; }
.unread-badge { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; }

/* Empty sidebar */
.empty-sidebar { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 16px; color: #9ca3af; font-size: 14px; }

.online-label { font-size: 11px; font-weight: 600; color: #22c55e; }
.chat-now-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 50%;
  background: #eff6ff; border: none; cursor: pointer; color: #3b82f6;
  transition: background 0.12s, transform 0.1s; flex-shrink: 0;
}
.chat-now-btn:hover { background: #3b82f6; color: #fff; transform: scale(1.1); }

/* Skeletons */
.skel-list { padding: 8px 0; }
.skel-row  { display: flex; align-items: center; gap: 12px; padding: 10px 14px; }
.skel { background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%); background-size: 200%; animation: shimmer 1.3s infinite; border-radius: 6px; }
.skel-av   { width: 46px; height: 46px; border-radius: 50%; flex-shrink: 0; }
.skel-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.skel-name { height: 13px; width: 55%; }
.skel-prev { height: 11px; width: 80%; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ─── Avatars ────────────────────────────────────────────────── */
.av { border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.av-sm { width: 28px; height: 28px; }
.av-md { width: 46px; height: 46px; }
.av-lg { width: 42px; height: 42px; }

.av-wrap { position: relative; }
.dot-online {
  position: absolute; bottom: 1px; right: 1px;
  width: 11px; height: 11px; border-radius: 50%;
  background: #22c55e; border: 2px solid #fff;
}

/* ─── Main chat ──────────────────────────────────────────────── */
.chat-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; border-radius: 0 16px 16px 0; background: #fff; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }

/* Header */
.chat-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; background: #fff; border-bottom: 1px solid #eef0f2;
  flex-shrink: 0;
}
.chat-header-left { display: flex; align-items: center; gap: 12px; }

/* Partner hover trigger */
.partner-trigger {
  position: relative; display: flex; align-items: center; gap: 10px;
  cursor: pointer; border-radius: 10px; padding: 4px 8px; margin: -4px -8px;
  transition: background 0.15s;
}
.partner-trigger:hover { background: #f3f4f6; }

/* Partner popup */
.partner-popup {
  position: absolute; top: calc(100% + 8px); left: 0;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.14); z-index: 50; min-width: 220px;
  overflow: hidden;
}
.partner-popup-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px 12px; border-bottom: 1px solid #f3f4f6;
}
.pp-name { font-size: 14px; font-weight: 700; color: #111827; }
.pp-status { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.pp-status.online { color: #22c55e; }
.partner-popup-actions { padding: 6px; display: flex; flex-direction: column; gap: 2px; }
.pp-btn {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 8px 12px; border: none; border-radius: 8px;
  background: none; cursor: pointer; font-size: 13px; font-weight: 500;
  color: #374151; transition: background 0.12s; text-align: left;
}
.pp-btn:hover { background: #f3f4f6; }
.pp-btn-danger { color: #ef4444; }
.pp-btn-danger:hover { background: #fee2e2; }
.partner-name   { font-size: 16px; font-weight: 700; color: #111827; }
.partner-status { font-size: 12px; color: #9ca3af; }
.partner-status.online { color: #22c55e; font-weight: 500; }

.chat-header-right { display: flex; align-items: center; gap: 8px; }
.header-del-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1.5px solid #fca5a5; border-radius: 10px;
  padding: 6px 12px; cursor: pointer; color: #ef4444; font-size: 13px; font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.header-del-btn:hover { background: #fee2e2; color: #dc2626; border-color: #f87171; }

/* Messages area */
.msgs-area {
  flex: 1; overflow-y: auto; padding: 16px 20px 10px;
  display: flex; flex-direction: column; gap: 3px;
  scroll-behavior: smooth;
}
.msgs-area::-webkit-scrollbar { width: 4px; }
.msgs-area::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

.load-older { text-align: center; margin-bottom: 12px; }
.load-older button {
  background: #f3f4f6; border: none; border-radius: 20px; padding: 6px 18px;
  font-size: 13px; color: #6b7280; cursor: pointer;
}
.load-older button:hover { background: #e5e7eb; }

/* Date separator */
.date-sep {
  display: flex; align-items: center; gap: 10px;
  margin: 14px 0 6px; color: #9ca3af; font-size: 11px; font-weight: 600;
}
.date-sep::before,.date-sep::after { content:""; flex:1; height:1px; background:#f3f4f6; }

/* Message rows */
.msg-row {
  display: flex; align-items: flex-end; gap: 6px;
}
.msg-row.mine   { flex-direction: row-reverse; }
.msg-row.theirs { flex-direction: row; }

.msg-av-wrap { flex-shrink: 0; width: 28px; display: flex; align-items: flex-end; }
.msg-av { margin-bottom: 18px; }
.av-spacer { width: 28px; }

.bubble-col { display: flex; flex-direction: column; max-width: 60%; }
.msg-row.mine .bubble-col   { align-items: flex-end; }
.msg-row.theirs .bubble-col { align-items: flex-start; }

/* Bubble wrapper — anchor for hover menu */
.bubble-wrap { position: relative; display: inline-flex; }

/* Reply snip — embedded INSIDE bubble */
.reply-snip {
  display: flex; align-items: stretch; gap: 8px;
  border-radius: 8px; padding: 6px 10px; margin-bottom: 6px;
  max-width: 100%; overflow: hidden;
}
.reply-snip-mine   { background: rgba(0,0,0,0.18); }
.reply-snip-theirs { background: rgba(59,130,246,0.10); border: 1px solid rgba(59,130,246,0.15); }
.reply-accent { width: 3px; border-radius: 2px; flex-shrink: 0; align-self: stretch; }
.reply-snip-mine .reply-accent   { background: rgba(255,255,255,0.8); }
.reply-snip-theirs .reply-accent { background: #3b82f6; }
.reply-snip-body { min-width: 0; }
.reply-snip-who { font-size: 11px; font-weight: 700; display: block; margin-bottom: 1px; }
.reply-snip-mine .reply-snip-who   { color: rgba(255,255,255,0.85); }
.reply-snip-theirs .reply-snip-who { color: #3b82f6; }
.reply-snip-txt { font-size: 12px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.reply-snip-mine .reply-snip-txt   { color: rgba(255,255,255,0.7); }
.reply-snip-theirs .reply-snip-txt { color: #6b7280; }
/* bubble text sits below the quote */
.bubble-text { display: block; }
/* bubble with reply: reduce top border-radius to connect visually */
.b-reply.b-mine   { border-radius: 18px 4px 4px 18px; }
.b-reply.b-theirs { border-radius: 4px 18px 18px 4px; }

/* Bubble */
.bubble {
  padding: 9px 14px; border-radius: 18px;
  font-size: 14px; line-height: 1.5; word-break: break-word;
  max-width: 100%;
}
.b-mine    { background: #3b82f6; color: #fff; border-radius: 18px 18px 4px 18px; }
.b-theirs  { background: #fff; color: #111827; border-radius: 18px 18px 18px 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
.b-recalled{ background: #f3f4f6 !important; color: #9ca3af !important; font-style: italic; border-radius: 18px !important; }
.b-sending { opacity: 0.55; }
.b-failed  { background: #fee2e2 !important; color: #991b1b !important; border-radius: 18px !important; }

.recalled-txt {
  display: flex; align-items: center; gap: 5px; font-size: 13px;
}
.failed-txt { font-size: 13px; }

/* Skel bubble */
.skel-bubble { height: 38px; width: 140px; border-radius: 18px; }

/* Reactions */
.react-bar { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
.react-left  { justify-content: flex-start; }
.react-right { justify-content: flex-end; }
.react-chip {
  background: #fff; border: 1.5px solid #e5e7eb; border-radius: 20px;
  padding: 2px 8px; font-size: 13px; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07); transition: transform 0.1s;
  line-height: 1.6;
}
.react-chip:hover  { transform: scale(1.1); background: #f9fafb; }
.react-chip.react-mine { border-color: #3b82f6; background: #eff6ff; }

/* Meta */
.msg-meta { display: flex; align-items: center; gap: 3px; margin-top: 2px; }
.meta-right { justify-content: flex-end; }
.meta-left  { justify-content: flex-start; }
.msg-time   { font-size: 11px; color: #9ca3af; }
.msg-tick   { font-size: 11px; }
.tick-pending { color: #9ca3af; }
.tick-sent    { color: #9ca3af; }
.tick-del     { color: #9ca3af; letter-spacing: -1px; }
.tick-seen    { color: #3b82f6; font-weight: 700; letter-spacing: -1px; }

/* Hover actions — vertical dropdown menu beside bubble */
.msg-actions {
  display: flex; flex-direction: column; align-items: stretch; gap: 0;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 4px; box-shadow: 0 6px 20px rgba(0,0,0,0.13);
  position: absolute; top: 0; z-index: 20; min-width: 130px;
}
.acts-left  { right: calc(100% + 6px); }
.acts-right { left: calc(100% + 6px); }

.act-wrap { position: relative; }
.act-btn {
  background: none; border: none; cursor: pointer;
  width: 100%; padding: 7px 12px; border-radius: 8px;
  display: flex; align-items: center; gap: 8px;
  color: #374151; font-size: 13px; font-weight: 500;
  transition: background 0.12s, color 0.12s; text-align: left;
}
.act-btn svg { flex-shrink: 0; color: #6b7280; }
.act-btn:hover { background: #f3f4f6; color: #111827; }
.act-btn:hover svg { color: #374151; }
.act-label { flex: 1; }
.act-del:hover { background: #fee2e2 !important; color: #ef4444 !important; }
.act-del:hover svg { color: #ef4444 !important; }

/* Emoji panel */
.emoji-panel {
  position: absolute; top: 0;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 14px;
  padding: 8px 10px; display: flex; gap: 4px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.14); z-index: 30; white-space: nowrap;
}
.emoji-panel-left  { right: calc(100% + 6px); }
.emoji-panel-right { left: calc(100% + 6px); }
.emoji-opt { font-size: 22px; cursor: pointer; transition: transform 0.12s; }
.emoji-opt:hover { transform: scale(1.35); }

/* Fade transition */
.fade-enter-active,.fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from,.fade-leave-to { opacity: 0; }

/* Typing */
.typing-row { margin-top: 4px; }
.typing-dots {
  display: flex; align-items: center; gap: 4px;
  background: #fff; border-radius: 18px; padding: 12px 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.typing-dots span {
  width: 6px; height: 6px; border-radius: 50%; background: #9ca3af;
  animation: tdot 1.3s infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes tdot {
  0%,80%,100% { transform: scale(0.7); opacity: 0.4; }
  40%          { transform: scale(1.1); opacity: 1; }
}

/* Reply bar */
.reply-bar {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border-top: 1px solid #eef0f2; padding: 8px 16px;
  flex-shrink: 0; gap: 10px;
}
.reply-bar-inner { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.reply-bar-accent { width: 3px; height: 34px; background: #ff642f; border-radius: 2px; flex-shrink: 0; }
.reply-bar-body { min-width: 0; }
.reply-bar-who { font-size: 12px; font-weight: 700; color: #ff642f; display: block; }
.reply-bar-txt { font-size: 13px; color: #6b7280; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.reply-close {
  background: none; border: none; cursor: pointer;
  color: #9ca3af; padding: 4px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.reply-close:hover { background: #f3f4f6; color: #374151; }

/* Input bar */
.input-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; background: #fff; border-top: 1px solid #eef0f2;
  flex-shrink: 0;
}
.input-field {
  flex: 1; border: 1.5px solid #e5e7eb; border-radius: 24px;
  padding: 10px 18px; outline: none; font-size: 14px; color: #111827;
  background: #f9fafb; transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
}
.input-field:focus { border-color: #3b82f6; background: #fff; }
.input-field::placeholder { color: #9ca3af; }

.send-btn {
  width: 42px; height: 42px; border-radius: 50%;
  background: #3b82f6; border: none; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.15s, transform 0.1s;
}
.send-btn:hover    { background: #2563eb; transform: scale(1.05); }
.send-btn:disabled { background: #d1d5db; cursor: not-allowed; transform: none; }

/* Empty state */
.empty-chat {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; color: #9ca3af; text-align: center;
}
.empty-chat-icon { margin-bottom: 16px; }
.empty-chat h3 { margin: 0 0 6px; font-size: 20px; color: #374151; font-weight: 700; }
.empty-chat p  { font-size: 14px; margin: 0; }

/* Responsive */
/* Mobile overlay */
.mobile-overlay {
  display: none;
}
.back-btn {
  display: none;
  background: none; border: none; cursor: pointer;
  color: #6b7280; padding: 4px;
  align-items: center; justify-content: center;
}

@media (max-width: 768px) {
  .msg-container {
    padding: 0;
    background: #fff;
  }
  .sidebar {
    position: fixed;
    left: 0; top: 60px; bottom: 0;
    width: 280px;
    z-index: 100;
    border-radius: 0;
    box-shadow: 4px 0 20px rgba(0,0,0,0.15);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  .chat-main {
    border-radius: 0;
    width: 100%;
  }
  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 99;
  }
  .back-btn { display: flex; }
}

</style>