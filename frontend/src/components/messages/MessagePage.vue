<template>
  <div class="msg-container">

    <!-- ══ SIDEBAR ══════════════════════════════════════════════ -->
    <div v-if="mobileOpen" class="mobile-overlay" @click="mobileOpen = false"></div>
    <div class="sidebar" :class="{ 'mobile-open': mobileOpen }">
      <div class="sidebar-top">
        <h2 class="sidebar-title">{{ sidebarTab === 'chats' ? 'Chats' : 'Friends' }}</h2>
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
          Friends
          <span v-if="friends.length" class="tab-badge">{{ friends.length }}</span>
        </button>
      </div>

      <div class="search-wrap">
        <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="searchQuery" class="search-input" :placeholder="sidebarTab === 'chats' ? 'Search conversations...' : 'Search friends...'" />
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
                  <span v-else-if="c._reactedBy" class="reacted-prev">
                    {{ c._reactedBy }} reacted {{ c._reactEmoji }}
                  </span>
                  <span v-else-if="c.mediaUrls && c.mediaUrls.length && !c.content">
                    <span v-if="c.mediaUrls[0].type === 'video'">🎥 [video]</span>
                    <span v-else>🖼️ [image]</span>
                    <span v-if="c.mediaUrls.length > 1"> ×{{ c.mediaUrls.length }}</span>
                  </span>
                  <span v-else>{{ c.content || (c.mediaUrls && c.mediaUrls.length ? (c.mediaUrls[0].type === 'video' ? '[video]' : '[image]') : '—') }}</span>
                </span>
                <span v-if="isUnread(c)" class="unread-badge"></span>
              </div>
            </div>
          </div>
          <div v-if="filteredContacts.length === 0" class="empty-sidebar">
            <p>No conversations yet</p>
          </div>
        </div>
      </template>

      <!-- ── Friends Tab ── -->
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
                <span class="contact-preview">{{ f.email || 'Click to message' }}</span>
                <button class="chat-now-btn" @click.stop="startChatWithFriend(f)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div v-if="filteredFriends.length === 0 && !loadingFriends" class="empty-sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" width="36" height="36" style="margin-bottom:8px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p>No friends found</p>
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
                <div class="partner-name-row">
                  <span class="partner-name">{{ activePartner.firstname }} {{ activePartner.lastname }}</span>
                  <span v-if="!isPartnerFriend" class="stranger-label">Stranger</span>
                </div>
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
                      View Profile
                    </button>
                    <button v-if="blockStatus === 'you_blocked'" class="pp-btn pp-btn-warn" @click="unblockUser(activePartner)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
                      Unblock
                    </button>
                    <button v-else-if="blockStatus !== 'blocked_by'" class="pp-btn pp-btn-danger" @click="blockUser(activePartner)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                      Block
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <div class="chat-header-right">
            <button class="header-del-btn" @click="deleteConversation" title="Delete all messages">
              <span>Delete History</span>
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
              :data-msg-id="msg._id"
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

                  <!-- ✅ Emoji panel — nằm phía TRÊN bubble, không tràn ra ngoài màn hình -->
                  <transition name="fade">
                    <div
                      v-if="emojiFor === (msg._id || msg.tempId)"
                      class="emoji-panel"
                      :class="isMine(msg) ? 'emoji-above-right' : 'emoji-above-left'"
                      @click.stop
                    >
                      <span v-for="e in EMOJIS" :key="e" class="emoji-opt" @click.stop="reactTo(msg, e)">{{ e }}</span>
                    </div>
                  </transition>
                  <!-- Only show bubble if: recalled, failed, has text, has replyTo, or sending -->
                  <div
                    v-if="msg.recalled || msg.failed || msg.content || msg.replyTo || msg.sending || (!msg.mediaUrls || !msg.mediaUrls.length)"
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
                    <!-- Reply preview INSIDE bubble — click to scroll to original -->
                    <div v-if="msg.replyTo && !msg.recalled" class="reply-snip" :class="isMine(msg) ? 'reply-snip-mine' : 'reply-snip-theirs'" @click.stop="scrollToMsg(msg.replyTo._id || msg.replyTo)">
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
                    <template v-else>
                      <span v-if="msg.content" class="bubble-text">{{ msg.content }}</span>
                    </template>
                  </div>

                  <!-- Media grid — inside bubble-wrap so hover works -->
                  <div v-if="!msg.recalled && msg.mediaUrls && msg.mediaUrls.length" class="msg-media-grid" :class="['grid-' + Math.min(msg.mediaUrls.length, 4), isMine(msg) ? 'grid-mine' : 'grid-theirs']">
                    <div v-for="(m, mi) in msg.mediaUrls" :key="mi" class="msg-media-cell">
                      <img v-if="m.type === 'image'" :src="m.url" class="msg-media-img" @click.stop="openLightbox(m.url, msg)" />
                      <video v-else :src="m.url" class="msg-media-vid" controls playsinline @click.stop="openLightbox(m.url, msg)"></video>
                    </div>
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
                      </div>

                      <!-- Reply -->
                      <button class="act-btn" @click.stop="setReply(msg)" title="Reply">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                        <span class="act-label">Reply</span>
                      </button>

                      <!-- Recall -->
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
                <div v-if="msg.reactions?.length && !msg.recalled" class="react-bar" :class="isMine(msg) ? 'react-right' : 'react-left'">
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

        <!-- Block banners -->
        <div v-if="blockStatus === 'you_blocked'" class="block-banner block-banner-you">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <span>You blocked <strong>{{ activePartner.firstname }}</strong>. Unblock to send messages.</span>
          <button class="block-banner-btn" @click="unblockUser(activePartner)">Unblock</button>
        </div>
        <div v-else-if="blockStatus === 'blocked_by'" class="block-banner block-banner-by">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <span>You cannot send messages to this user.</span>
        </div>

        <template v-else>
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

          <!-- Media preview strip -->
          <div v-if="mediaFiles.length" class="media-strip">
            <div v-for="(f, i) in mediaFiles" :key="i" class="media-strip-item">
              <img v-if="f.type.startsWith('image')" :src="f.preview" class="strip-thumb" />
              <video v-else :src="f.preview" class="strip-thumb strip-video"></video>
              <button class="strip-remove" @click="removeMediaFile(i)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="10" height="10"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <button v-if="mediaFiles.length < 10" class="strip-add" @click="$refs.fileInput.click()" title="Add more">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>

          <!-- Input bar -->
          <div class="input-bar">
            <!-- Hidden file input (multiple) -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*,video/*"
              multiple
              style="display:none"
              @change="onFilesSelected"
            />

            <!-- Emoji picker -->
            <div class="emoji-trigger-wrap" @click.stop>
              <button class="emoji-trigger-btn" @click.stop="showEmojiPicker = !showEmojiPicker" title="Emoji">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </button>
              <div v-if="showEmojiPicker" class="emoji-picker-wrap">
                <EmojiPicker :native="true" @select="onEmojiSelect" />
              </div>
            </div>

            <!-- Media button -->
            <button class="media-btn" @click="$refs.fileInput.click()" title="Send photo/video" :disabled="mediaFiles.length >= 10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span v-if="mediaFiles.length" class="media-count-badge">{{ mediaFiles.length }}</span>
            </button>

            <textarea
              v-model="draft"
              ref="inputRef"
              class="input-field"
              placeholder="Type a message..."
              rows="1"
              @keydown.shift.enter.exact.prevent="insertNewline"
              @input="autoResize"
            ></textarea>
            <button class="send-btn" @click="send" :disabled="!draft.trim() && !mediaFiles.length">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </template>

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
  <!-- Lightbox -->
  <div v-if="lightboxImages.length" class="lightbox" @click.self="closeLightbox">
    <!-- Sender info top-left -->
    <div class="lightbox-sender">
      <img :src="resolveAvatar(lightboxImages[lightboxIndex].sender)" class="lb-av" @error="onImgError" />
      <div>
        <div class="lb-name">{{ lightboxImages[lightboxIndex].sender?.firstname }} {{ lightboxImages[lightboxIndex].sender?.lastname }}</div>
        <div class="lb-time">{{ fmtMsgTime(lightboxImages[lightboxIndex].createdAt) }}</div>
      </div>
    </div>

    <!-- Media: image or video -->
    <img v-if="lightboxImages[lightboxIndex].type === 'image'" :src="lightboxImages[lightboxIndex].url" class="lightbox-img" />
    <video v-else :src="lightboxImages[lightboxIndex].url" class="lightbox-vid" controls autoplay playsinline></video>

    <!-- Close -->
    <button class="lightbox-close" @click="closeLightbox">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>

    <!-- Prev -->
    <button v-if="lightboxImages.length > 1" class="lightbox-nav lightbox-prev" @click.stop="prevLightbox">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="24" height="24"><polyline points="15 18 9 12 15 6"/></svg>
    </button>

    <!-- Next -->
    <button v-if="lightboxImages.length > 1" class="lightbox-nav lightbox-next" @click.stop="nextLightbox">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="24" height="24"><polyline points="9 18 15 12 9 6"/></svg>
    </button>

    <!-- Counter -->
    <div v-if="lightboxImages.length > 1" class="lightbox-counter">
      {{ lightboxIndex + 1 }} / {{ lightboxImages.length }}
    </div>
  </div>

  <NotificationModal 
    :is-visible="notification.visible" 
    :type="notification.type" 
    :title="notification.title" 
    :message="notification.message" 
    @confirm="closeNotify" 
  />

  <ConfirmDialog 
  v-if="confirmVisible" 
  :message="confirmMessage" 
  @confirm="handleConfirmedAction" 
  @cancel="confirmVisible = false" 
  />

</template>

<script>
import { io } from "socket.io-client";
import EmojiPicker from "vue3-emoji-picker";
import "vue3-emoji-picker/css";
import NotificationModal from '../notifications/NotificationModal.vue';
import ConfirmDialog from '../common/ConfirmDialog.vue';

const EMOJIS = ["❤️","😂","😮","😢","😡","👍","🔥","👏"];
const API    = process.env.VUE_APP_API_URL || "http://localhost:3000";

export default {
  name: "MessagePage",
  components: { 
    EmojiPicker,
    NotificationModal,
    ConfirmDialog
  
  },

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

      blockStatus: null,
      checkingBlock: false,
      mediaFiles: [],       // [{file, preview, type}]
      lightboxImages: [],
      lightboxIndex: 0,
      showEmojiPicker: false,
      isPartnerFriend: false,

      notification: {
        visible: false,
        type: 'success', // 'success', 'error', 'warning'
        title: '',
        message: ''
      },

      itemToDeleteId: null,

      // confirm modal
      openMenuId: null,
      confirmVisible: false,
      confirmMessage: '',
      pendingConfirmMsg: null,
      pendingConfirmAction: null,
      pendingPartner: null


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
    document.addEventListener("click", this.closeEmojiPicker);
  },

  watch: {
    '$route.query.userId'(newId, oldId) {
      if (newId && newId !== oldId) {
        this.openChatWith(newId);
      }
    }
  },

  beforeUnmount() {
    this.socket?.disconnect();
    document.removeEventListener("click", this.closeEmoji);
    this.clearMediaFiles();
    document.removeEventListener("click", this.closeEmojiPicker);
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
        // Nếu partner react vào tin nhắn của mình → hiện trong sidebar
        if (!m) return;
        const partnerReaction = reactions.find(r =>
          String(r.user?._id || r.user) !== String(this.myId)
        );
        const contact = this.contacts.find(c => {
          const p = this.getPartner(c);
          return p && String(p._id) === String(this.activePartner?._id);
        });
        if (contact && partnerReaction) {
          contact._reactedBy = this.activePartner?.firstname || 'Someone';
          contact._reactEmoji = partnerReaction.emoji;
        }
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

    onFilesSelected(e) {
      const picked = Array.from(e.target.files);
      const MAX_SIZE = 100 * 1024 * 1024; // 100MB per file
      const remaining = 10 - this.mediaFiles.length;
      const toAdd = picked.slice(0, remaining);

      for (const file of toAdd) {
        if (file.size > MAX_SIZE) {
          this.showNotify("error", "Error", `${file.name} is too large (max 100MB).`);
          continue;
        }
        this.mediaFiles.push({
          file,
          preview: URL.createObjectURL(file),
          type: file.type
        });
      }
      if (picked.length > remaining) {
        this.showNotify("error", "Error", `Maximum 10 files. Only first ${remaining} file(s) added.`);
      }
      e.target.value = '';
    },

    removeMediaFile(index) {
      const f = this.mediaFiles[index];
      if (f?.preview) URL.revokeObjectURL(f.preview);
      this.mediaFiles.splice(index, 1);
    },

    clearMediaFiles() {
      this.mediaFiles.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
      this.mediaFiles = [];
    },

    openLightbox(url, sourceMsg) {
      // Thu thập TẤT CẢ media (ảnh + video) trong đoạn chat
      const allMedia = [];
      for (const msg of this.messages) {
        if (msg.recalled) continue;
        if (msg.mediaUrls && msg.mediaUrls.length) {
          for (const m of msg.mediaUrls) {
            allMedia.push({
              url: m.url,
              type: m.type,
              sender: msg.sender,
              createdAt: msg.createdAt
            });
          }
        }
      }
      if (!allMedia.length) {
        allMedia.push({
          url,
          type: sourceMsg?.mediaUrls?.find(m => m.url === url)?.type || 'image',
          sender: sourceMsg?.sender,
          createdAt: sourceMsg?.createdAt
        });
      }
      this.lightboxImages = allMedia;
      this.lightboxIndex  = allMedia.findIndex(m => m.url === url);
      if (this.lightboxIndex < 0) this.lightboxIndex = 0;
      this.$nextTick(() => document.addEventListener('keydown', this.onLightboxKey));
    },
    closeLightbox() {
      this.lightboxImages = [];
      this.lightboxIndex  = 0;
      document.removeEventListener('keydown', this.onLightboxKey);
    },
    prevLightbox() {
      this.lightboxIndex = (this.lightboxIndex - 1 + this.lightboxImages.length) % this.lightboxImages.length;
    },
    nextLightbox() {
      this.lightboxIndex = (this.lightboxIndex + 1) % this.lightboxImages.length;
    },
    onLightboxKey(e) {
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowLeft')  this.prevLightbox();
      if (e.key === 'ArrowRight') this.nextLightbox();
    },

    autoResize(e) {
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
      this.onTyping();
    },

    insertNewline() {
      // Shift+Enter = xuống dòng thủ công
      const el = this.$refs.inputRef;
      if (!el) return;
      const start = el.selectionStart;
      const end   = el.selectionEnd;
      this.draft = this.draft.slice(0, start) + '\n' + this.draft.slice(end);
      this.$nextTick(() => {
        el.selectionStart = el.selectionEnd = start + 1;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
      });
    },

    onEmojiSelect(emoji) {
      this.draft += emoji.i;
      // Không đóng picker — user có thể chọn tiếp
      // Chỉ đóng khi click ra ngoài
    },

    closeEmojiPicker(e) {
      if (!e.target.closest('.emoji-trigger-wrap')) {
        this.showEmojiPicker = false;
      }
    },

    async checkIsFriend() {
      if (!this.activePartner?._id) return;
      try {
        const myId = this.myId;
        const res = await fetch(
          `${API}/users/${myId}/friends?limit=999`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const list = data.items || [];
          this.isPartnerFriend = list.some(f => String(f._id) === String(this.activePartner._id));
        }
      } catch (e) { console.error("checkIsFriend:", e); }
    },

    async checkBlockStatus() {
      if (!this.activePartner?._id) return;
      try {
        const res = await fetch(`${API}/block/check/${this.activePartner._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          this.blockStatus = data.isBlocked ? data.reason : null;
        }
      } catch (e) { console.error("checkBlockStatus:", e); }
    },

    async blockUser(partner) {
      this.pendingConfirmAction = 'block';
      this.pendingPartner = partner;
      this.confirmMessage = `Block ${partner.firstname} ${partner.lastname}?`;
      this.confirmVisible = true;
    },

    async _blockUser(partner) {
      this.showPartnerMenu = false;
      try {
        const res = await fetch(`${API}/block`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ targetId: partner._id })
        });
        if (res.ok) {
          this.blockStatus = 'you_blocked';
        } else {
          const data = await res.json().catch(() => ({}));
          this.showNotify("error", "Error", data.msg || 'Unable to block this user.');
        }
      } catch (e) { console.error("blockUser:", e); }
    },

    async unblockUser(partner) {
      this.pendingConfirmAction = 'unblock';
      this.pendingPartner = partner;
      this.confirmMessage = `Unblock ${partner.firstname} ${partner.lastname}?`;
      this.confirmVisible = true;
    },

    async _unblockUser(partner) {
      this.showPartnerMenu = false;
      try {
        const res = await fetch(`${API}/block/unblock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ targetId: partner._id })
        });
        if (res.ok) {
          this.blockStatus = null;
        } else {
          const data = await res.json().catch(() => ({}));
          this.showNotify("error", "Error", data.msg || 'Unable to unblock.');
        }
      } catch (e) { console.error("unblockUser:", e); }
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
      this.mobileOpen = false;

      // Cập nhật URL để hiện tên thay vì ID
      const currentUserId = this.$route.query.userId;
      if (String(currentUserId) !== String(partner._id)) {
        this.$router.replace({
          path: '/messages',
          query: { userId: partner._id }
        });
      }

      if (this.activePartner) this.sendStopTyping();

      this.activePartner = partner;
      this.messages = [];
      this.currentPage = 1;
      this.hasMore = false;
      this.partnerTyping = false;
      this.replyingTo = null;
      this.draft = "";
      this.emojiFor = null;

      this.blockStatus = null;
      this.isPartnerFriend = false;
      await Promise.all([this.fetchMessages(1), this.checkBlockStatus(), this.checkIsFriend()]);
      this.$nextTick(() => { this.scrollBottom(); this.$refs.inputRef?.focus(); });
      this.markSeen();
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
      if (!text && !this.mediaFiles.length) return;
      if (!this.activePartner) return;

      if (this.mediaFiles.length) {
        this.sendWithMedia(text);
        return;
      }

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
          receiverId: this.activePartner._id, content: text,
          replyTo: replySnapshot?._id || null, tempId
        });
      } else {
        this.restSend(text, tempId);
      }
    },

    async sendWithMedia(text) {
      const files = [...this.mediaFiles];
      const replySnapshot = this.replyingTo ? { ...this.replyingTo } : null;
      this.draft = "";
      this.replyingTo = null;
      this.clearMediaFiles();

      // ── Gửi TEXT trước (nếu có) ──────────────────────────────
      if (text.trim()) {
        const textTempId = `tmp_txt_${Date.now()}`;
        this.messages.push({
          tempId: textTempId, content: text.trim(), sending: true,
          reactions: [], replyTo: replySnapshot,
          sender: { _id: this.myId }, receiver: { _id: this.activePartner._id },
          status: 'sent', createdAt: new Date().toISOString()
        });
        this.$nextTick(this.scrollBottom);
        if (this.socket?.connected) {
          this.socket.emit("message:send", {
            receiverId: this.activePartner._id,
            content: text.trim(),
            replyTo: replySnapshot?._id || null,
            tempId: textTempId
          });
        } else {
          this.restSend(text.trim(), textTempId);
        }
      }

      // ── Gửi MEDIA riêng (không kèm text) ────────────────────
      const mediaTempId = `tmp_media_${Date.now()}`;
      const optimisticMedia = files.map(f => ({
        url: f.preview,
        type: f.type.startsWith('image') ? 'image' : 'video'
      }));
      this.messages.push({
        tempId: mediaTempId, content: '', sending: true, reactions: [],
        replyTo: null,
        sender: { _id: this.myId }, receiver: { _id: this.activePartner._id },
        status: 'sent', createdAt: new Date().toISOString(),
        mediaUrls: optimisticMedia
      });
      this.$nextTick(this.scrollBottom);

      try {
        const fd = new FormData();
        fd.append('senderId', this.myId);
        fd.append('receiverId', this.activePartner._id);
        files.forEach(f => fd.append('media', f.file));

        const res = await fetch(`${API}/messages/media`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: fd
        });
        if (res.ok) {
          const data = await res.json();
          const msg = data.message || data;
          const idx = this.messages.findIndex(m => m.tempId === mediaTempId);
          if (idx !== -1) this.messages.splice(idx, 1, { ...msg, status: 'sent' });
          this.bumpContact(msg);
        } else {
          const m = this.messages.find(m => m.tempId === mediaTempId);
          if (m) { m.sending = false; m.failed = true; m.mediaUrls = []; }
        }
      } catch (e) {
        const m = this.messages.find(m => m.tempId === mediaTempId);
        if (m) { m.sending = false; m.failed = true; m.mediaUrls = []; }
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
      this.pendingConfirmAction = 'recall';
      this.pendingConfirmMsg = msg;
      this.confirmMessage = "Recall this message? Everyone will see it was recalled.";
      this.confirmVisible = true;
    },
    canRecall(msg) {
      return msg.createdAt && (Date.now() - new Date(msg.createdAt).getTime()) < 86400000;
    },
 
    // ── Delete ────────────────────────────────────────────────
    deleteMsg(msg) {
      this.pendingConfirmAction = 'delete';
      this.pendingConfirmMsg = msg;
      this.confirmMessage = "Delete this message? It will only be removed for you.";
      this.confirmVisible = true;
    },

    async deleteConversation() {
      this.pendingConfirmAction = 'deleteConversation';
      this.pendingConfirmMsg = null;
      this.confirmMessage = `Delete all chat history with ${this.activePartner.firstname}? This cannot be undone.`;
      this.confirmVisible = true;
    },
 
    async _doDeleteConversation() {
      const partnerId = this.activePartner._id;
      try {
        const res = await fetch(`${API}/messages/conversation/${partnerId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (!res.ok) {
          // Fallback: delete messages locally
          this.messages.forEach(m => {
            if (m._id) this.socket?.emit("message:delete", { messageId: m._id });
          });
        }
      } catch {
        this.messages.forEach(m => {
          if (m._id) this.socket?.emit("message:delete", { messageId: m._id });
        });
      } finally {
        // Luôn xóa khỏi sidebar và reset chat
        this.messages = [];
        const idx = this.contacts.findIndex(c => {
          const p = this.getPartner(c);
          return p && String(p._id) === String(partnerId);
        });
        if (idx !== -1) this.contacts.splice(idx, 1);
        this.activePartner = null;
      }
    },

    _doDeleteMsg(msg) {
      this.socket?.emit("message:delete", { messageId: msg._id });
      this.messages = this.messages.filter(m => (m._id || m.tempId) !== (msg._id || msg.tempId));
 
      const contactIdx = this.contacts.findIndex(c => {
        const p = this.getPartner(c);
        return p && String(p._id) === String(this.activePartner._id);
      });
      if (contactIdx !== -1) {
        const lastMsg = [...this.messages].reverse().find(m => !m.sending && !m.failed);
        if (lastMsg) {
          this.contacts.splice(contactIdx, 1, {
            ...lastMsg, _reactedBy: null, _reactEmoji: null
          });
        } else {
          this.contacts.splice(contactIdx, 1);
          this.activePartner = null;
        }
      }
    },
 
    // ── Thực thi recall sau khi confirm ───────────────────────
    _doRecallMsg(msg) {
      this.socket?.emit("message:recall", { messageId: msg._id, receiverId: this.activePartner._id });
      msg.recalled = true; msg.content = ""; msg.mediaUrls = [];
      const contact = this.contacts.find(c => {
        const p = this.getPartner(c);
        return p && String(p._id) === String(this.activePartner._id);
      });
      if (contact) { contact.recalled = true; contact.content = ""; }
    },
 
    // ── Handler chung sau khi user bấm Confirm ────────────────
    handleConfirmedAction() {
      this.confirmVisible = false;
      const action = this.pendingConfirmAction;
      const msg    = this.pendingConfirmMsg;
      const partner = this.pendingPartner;
      this.pendingConfirmAction = null;
      this.pendingConfirmMsg    = null;
      this.pendingPartner = null;
 
      if (action === 'delete' && msg)         this._doDeleteMsg(msg);
      if (action === 'recall' && msg)         this._doRecallMsg(msg);
      if (action === 'deleteConversation')    this._doDeleteConversation();
      if (action === 'block' && partner)         this._blockUser(partner);
      if (action === 'unblock' && partner)         this._unblockUser(partner);
    },

    // ── React ─────────────────────────────────────────────────
    reactTo(msg, emoji) {
      if (!msg._id) return;
      this.emojiFor = null;
      const current = this.myReaction(msg);
      const newEmoji = current === emoji ? "" : emoji;
      this.socket?.emit("message:react", {
        messageId: msg._id,
        emoji: newEmoji,
        partnerId: this.activePartner._id
      });

      // Cập nhật contacts trong MessagePage
      const contact = this.contacts.find(c => {
        const p = this.getPartner(c);
        return p && String(p._id) === String(this.activePartner._id);
      });
      if (contact) {
        contact._reactedBy = newEmoji ? 'You' : null;
        contact._reactEmoji = newEmoji || null;
      }

      // Thông báo cho Header qua window event
      window.dispatchEvent(new CustomEvent('msg:reacted', {
        detail: {
          partnerId: this.activePartner._id,
          reactedBy: newEmoji ? 'You' : null,
          emoji: newEmoji || null
        }
      }));
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
    closeEmoji(e) { if (!e.target.closest(".emoji-panel") && !e.target.closest(".act-wrap")) this.emojiFor = null; },

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
        // Reset react state khi có tin nhắn mới
        const c = {
          ...this.contacts[idx], ...msg,
          _reactedBy: null, _reactEmoji: null
        };
        this.contacts.splice(idx, 1);
        this.contacts.unshift(c);
      } else {
        this.contacts.unshift({ ...msg, _reactedBy: null, _reactEmoji: null });
      }
    },

    scrollBottom() {
      const el = this.$refs.msgsArea;
      if (el) el.scrollTop = el.scrollHeight;
    },

    scrollToMsg(msgId) {
      if (!msgId) return;
      const el = document.querySelector(`[data-msg-id="${msgId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash highlight
        el.classList.add('msg-highlight');
        setTimeout(() => el.classList.remove('msg-highlight'), 1500);
      }
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
    },

    showNotify(type, title, message) {
      this.notification.type = type;
      this.notification.title = title;
      this.notification.message = message;
      this.notification.visible = true;
    },

    closeNotify() {
      this.notification.visible = false;
    },
  }
};
</script>

<style scoped>
/* ── LAYOUT ── */
.msg-container {
  display: flex;
  height: calc(100vh - 60px);
  margin-top: 60px;
  width: 100%;
  padding: 16px 24px;
  box-sizing: border-box;
  background: var(--bg-body);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  gap: 0;
  transition: background-color 0.3s;
}

/* ── SIDEBAR ── */
.sidebar {
  width: 300px; flex-shrink: 0;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  border-radius: 16px 0 0 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.07);
  display: flex; flex-direction: column; overflow: hidden;
  transition: background-color 0.3s;
}

.sidebar-top { padding: 20px 18px 12px; }
.sidebar-title { margin: 0; font-size: 22px; font-weight: 800; color: var(--text-main); }

.search-wrap {
  display: flex; align-items: center; gap: 8px;
  margin: 0 14px 12px;
  background: var(--bg-input); border-radius: 12px; padding: 9px 14px;
  border: 1px solid var(--border-color);
  transition: background-color 0.3s;
}
.search-ico { width: 15px; height: 15px; color: var(--text-sub); flex-shrink: 0; }
.search-input {
  border: none; background: none; outline: none;
  flex: 1; font-size: 14px; color: var(--text-main);
}
.search-input::placeholder { color: var(--text-sub); }

/* Sidebar tabs */
.sidebar-tabs {
  display: flex; gap: 4px;
  padding: 0 14px 10px; flex-shrink: 0;
}
.tab-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 10px; border: none; border-radius: 10px; cursor: pointer;
  font-size: 13px; font-weight: 600; color: var(--text-sub);
  background: var(--bg-input); transition: all 0.15s;
}
.tab-btn:hover { background: var(--hover-bg); color: var(--text-main); }
.tab-btn.active { background: var(--hover-primary); color: #FF642F; }
.tab-badge {
  background: #FF642F; color: #fff;
  font-size: 10px; font-weight: 700;
  padding: 1px 5px; border-radius: 20px; line-height: 1.4;
}
.tab-badge-red { background: #ef4444; }

/* Contact list */
.contact-list { flex: 1; overflow-y: auto; }
.contact-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; cursor: pointer;
  transition: background 0.12s;
}
.contact-row:hover  { background: var(--hover-bg); }
.contact-row.active { background: var(--hover-primary); }

.contact-info { flex: 1; min-width: 0; }
.contact-top-row { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; }
.contact-name { font-size: 14px; font-weight: 600; color: var(--text-main); }
.contact-time { font-size: 11px; color: var(--text-sub); flex-shrink: 0; }
.contact-bottom-row { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.contact-preview { font-size: 13px; color: var(--text-sub); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.contact-preview.bold { font-weight: 700; color: var(--text-main); }
.you-label { color: var(--text-sub); }
.recalled-prev { font-style: italic; color: var(--text-sub); }
.reacted-prev { color: var(--text-sub); }
.unread-badge { width: 8px; height: 8px; border-radius: 50%; background: #FF642F; flex-shrink: 0; }

.empty-sidebar {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px 16px;
  color: var(--text-sub); font-size: 14px;
}

.online-label { font-size: 11px; font-weight: 600; color: #22c55e; }
.chat-now-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--hover-primary); border: none;
  cursor: pointer; color: #FF642F;
  transition: background 0.12s, transform 0.1s; flex-shrink: 0;
}
.chat-now-btn:hover { background: #FF642F; color: #fff; transform: scale(1.1); }

/* Skeletons */
.skel-list { padding: 8px 0; }
.skel-row  { display: flex; align-items: center; gap: 12px; padding: 10px 14px; }
.skel {
  background: linear-gradient(90deg, var(--border-color) 25%, var(--bg-input) 50%, var(--border-color) 75%);
  background-size: 200%; animation: shimmer 1.3s infinite; border-radius: 6px;
}
.skel-av   { width: 46px; height: 46px; border-radius: 50%; flex-shrink: 0; }
.skel-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.skel-name { height: 13px; width: 55%; }
.skel-prev { height: 11px; width: 80%; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── AVATARS ── */
.av { border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.av-sm { width: 28px; height: 28px; }
.av-md { width: 46px; height: 46px; }
.av-lg { width: 42px; height: 42px; }
.av-wrap { position: relative; }
.dot-online {
  position: absolute; bottom: 1px; right: 1px;
  width: 11px; height: 11px; border-radius: 50%;
  background: #22c55e; border: 2px solid var(--bg-card);
}

/* ── MAIN CHAT ── */
.chat-main {
  flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;
  border-radius: 0 16px 16px 0;
  background: var(--bg-card);
  box-shadow: 0 2px 16px rgba(0,0,0,0.07);
  transition: background-color 0.3s;
}

/* Chat Header */
.chat-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  transition: background-color 0.3s;
}
.chat-header-left { display: flex; align-items: center; gap: 12px; }

.partner-trigger {
  position: relative; display: flex; align-items: center; gap: 10px;
  cursor: pointer; border-radius: 10px; padding: 4px 8px; margin: -4px -8px;
  transition: background 0.15s;
}
.partner-trigger:hover { background: var(--hover-bg); }

/* Partner popup */
.partner-popup {
  position: absolute; top: calc(100% + 8px); left: 0;
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.14);
  z-index: 50; min-width: 220px; overflow: hidden;
  transition: background-color 0.3s;
}
.partner-popup-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border-color);
}
.pp-name { font-size: 14px; font-weight: 700; color: var(--text-main); }
.pp-status { font-size: 12px; color: var(--text-sub); margin-top: 2px; }
.pp-status.online { color: #22c55e; }
.partner-popup-actions { padding: 6px; display: flex; flex-direction: column; gap: 2px; }
.pp-btn {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 8px 12px; border: none; border-radius: 8px;
  background: none; cursor: pointer; font-size: 13px; font-weight: 500;
  color: var(--text-main); transition: background 0.12s; text-align: left;
}
.pp-btn:hover { background: var(--hover-bg); }
.pp-btn-danger { color: #ef4444; }
.pp-btn-danger:hover { background: #fee2e2; }
.pp-btn-warn { color: #d97706; }
.pp-btn-warn:hover { background: #fef3c7; }

/* Block banner */
.block-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 20px; font-size: 13px; flex-shrink: 0;
  border-top: 1px solid transparent;
}
.block-banner svg { flex-shrink: 0; }
.block-banner span { flex: 1; }
.block-banner-you { background: #fef3c7; color: #92400e; border-color: #fde68a; }
.block-banner-by  { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
.block-banner-btn {
  background: transparent; border: 1.5px solid currentColor;
  border-radius: 8px; padding: 4px 12px;
  font-size: 12px; font-weight: 600;
  cursor: pointer; color: inherit; transition: opacity 0.15s; flex-shrink: 0;
}
.block-banner-btn:hover { opacity: 0.7; }

.partner-name-row { display: flex; align-items: center; gap: 8px; }
.partner-name   { font-size: 16px; font-weight: 700; color: var(--text-main); }
.partner-status { font-size: 12px; color: var(--text-sub); }
.partner-status.online { color: #22c55e; font-weight: 500; }
.stranger-label {
  font-size: 11px; font-weight: 600; color: var(--text-sub);
  background: var(--bg-input); border: 1px solid var(--border-color);
  border-radius: 6px; padding: 2px 7px; letter-spacing: 0.3px;
}

/* Emoji picker */
.emoji-trigger-wrap { position: relative; flex-shrink: 0; }
.emoji-trigger-btn {
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: none; cursor: pointer; display: flex; align-items: center;
  justify-content: center; color: var(--text-sub); transition: background 0.12s, color 0.12s;
}
.emoji-trigger-btn:hover { background: var(--hover-bg); color: var(--text-main); }
.emoji-picker-wrap {
  position: absolute; bottom: calc(100% + 10px); left: 0;
  z-index: 100; box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  border-radius: 12px; overflow: hidden;
}

.chat-header-right { display: flex; align-items: center; gap: 8px; }
.header-del-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1.5px solid #fca5a5; border-radius: 10px;
  padding: 6px 12px; cursor: pointer; color: #ef4444;
  font-size: 13px; font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.header-del-btn:hover { background: #fee2e2; color: #dc2626; border-color: #f87171; }

/* Messages area */
.msgs-area {
  flex: 1; overflow-y: auto; overflow-x: visible; padding: 16px 20px 10px;
  display: flex; flex-direction: column; gap: 3px;
  scroll-behavior: smooth;
  background: var(--bg-body);
  transition: background-color 0.3s;
}
.msgs-area::-webkit-scrollbar { width: 4px; }
.msgs-area::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }

.load-older { text-align: center; margin-bottom: 12px; }
.load-older button {
  background: var(--bg-input); border: none; border-radius: 20px;
  padding: 6px 18px; font-size: 13px; color: var(--text-sub); cursor: pointer;
}
.load-older button:hover { background: var(--hover-bg); }

/* Date separator */
.date-sep {
  display: flex; align-items: center; gap: 10px;
  margin: 14px 0 6px; color: var(--text-sub);
  font-size: 11px; font-weight: 600;
}
.date-sep::before,.date-sep::after { content:""; flex:1; height:1px; background: var(--border-color); }

/* Message rows */
.msg-row { display: flex; align-items: flex-end; gap: 6px; }
.msg-row.mine   { flex-direction: row-reverse; }
.msg-row.theirs { flex-direction: row; }

.msg-av-wrap { flex-shrink: 0; width: 28px; display: flex; align-items: flex-end; }
.msg-av { margin-bottom: 18px; }
.av-spacer { width: 28px; }

.bubble-col { display: flex; flex-direction: column; max-width: 60%; }
.msg-row.mine .bubble-col   { align-items: flex-end; }
.msg-row.theirs .bubble-col { align-items: flex-start; }

.bubble-wrap { position: relative; display: inline-flex; flex-direction: column; align-items: flex-start; }

/* Reply snip */
.reply-snip {
  display: flex; align-items: stretch; gap: 8px;
  border-radius: 8px; padding: 6px 10px; margin-bottom: 6px;
  max-width: 100%; overflow: hidden; cursor: pointer;
}
.reply-snip:hover { opacity: 0.85; }
.reply-snip-mine   { background: rgba(0,0,0,0.18); }
.reply-snip-theirs { background: rgba(59,130,246,0.10); border: 1px solid rgba(59,130,246,0.15); }
.reply-accent { width: 3px; border-radius: 2px; flex-shrink: 0; align-self: stretch; }
.reply-snip-mine .reply-accent   { background: rgba(255,255,255,0.8); }
.reply-snip-theirs .reply-accent { background: #FF642F; }
.reply-snip-body { min-width: 0; }
.reply-snip-who { font-size: 11px; font-weight: 700; display: block; margin-bottom: 1px; }
.reply-snip-mine .reply-snip-who   { color: rgba(255,255,255,0.85); }
.reply-snip-theirs .reply-snip-who { color: #FF642F; }
.reply-snip-txt { font-size: 12px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.reply-snip-mine .reply-snip-txt   { color: rgba(255,255,255,0.7); }
.reply-snip-theirs .reply-snip-txt { color: var(--text-sub); }
.bubble-text { display: block; white-space: pre-wrap; word-break: break-word; }
.b-reply.b-mine   { border-radius: 18px 4px 4px 18px; }
.b-reply.b-theirs { border-radius: 4px 18px 18px 4px; }

/* Bubble */
.bubble {
  padding: 9px 14px; border-radius: 18px;
  font-size: 14px; line-height: 1.5; word-break: break-word; max-width: 100%;
}
.b-mine    { background: #FF642F; color: #fff; border-radius: 18px 18px 4px 18px; }
.b-theirs  { background: var(--bg-card); color: var(--text-main); border-radius: 18px 18px 18px 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
.b-recalled{ background: var(--bg-input) !important; color: var(--text-sub) !important; font-style: italic; border-radius: 18px !important; }
.b-sending { opacity: 0.55; }
.b-failed  { background: #fee2e2 !important; color: #991b1b !important; border-radius: 18px !important; }

@keyframes msg-flash { 0%,100% { background: transparent; } 50% { background: rgba(59,130,246,0.15); } }
.msg-highlight { animation: msg-flash 1.5s ease; border-radius: 12px; }

.recalled-txt { display: flex; align-items: center; gap: 5px; font-size: 13px; }
.failed-txt { font-size: 13px; }

.skel-bubble { height: 38px; width: 140px; border-radius: 18px; }

/* Reactions */
.react-bar { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px;}
.react-left  { justify-content: flex-start; }
.react-right { justify-content: flex-end; }
.react-chip {
  background: var(--bg-card); border: 1.5px solid var(--border-color);
  border-radius: 20px; padding: 2px 8px; font-size: 13px; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07); transition: transform 0.1s; line-height: 1.6;
}
.react-chip:hover  { transform: scale(1.1); background: var(--hover-bg); }
.react-chip.react-mine { border-color: #FF642F; background: var(--hover-primary); }

/* Meta */
.msg-meta { display: flex; align-items: center; gap: 3px; margin-top: 2px; }
.meta-right { justify-content: flex-end; }
.meta-left  { justify-content: flex-start; }
.msg-time   { font-size: 11px; color: var(--text-sub); }
.msg-tick   { font-size: 11px; }
.tick-pending { color: var(--text-sub); }
.tick-sent    { color: var(--text-sub); }
.tick-del     { color: var(--text-sub); letter-spacing: -1px; }
.tick-seen    { color: #FF642F; font-weight: 700; letter-spacing: -1px; }

/* Hover actions menu */
.msg-actions {
  display: flex; flex-direction: column; align-items: stretch; gap: 0;
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 4px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.13);
  position: absolute; top: 0; z-index: 20; min-width: 130px;
  transition: background-color 0.3s;
}
.acts-left  { right: calc(100% + 6px); }
.acts-right { left: calc(100% + 6px); }

.act-wrap { position: relative; }
.act-btn {
  background: none; border: none; cursor: pointer;
  width: 100%; padding: 7px 12px; border-radius: 8px;
  display: flex; align-items: center; gap: 8px;
  color: var(--text-main); font-size: 13px; font-weight: 500;
  transition: background 0.12s, color 0.12s; text-align: left;
}
.act-btn svg { flex-shrink: 0; color: var(--text-sub); }
.act-btn:hover { background: var(--hover-bg); }
.act-btn:hover svg { color: var(--text-main); }
.act-label { flex: 1; }
.act-del:hover { background: #fee2e2 !important; color: #ef4444 !important; }
.act-del:hover svg { color: #ef4444 !important; }

/* Emoji panel — hiện phía TRÊN bubble, căn theo mine/theirs */
.emoji-panel {
  position: absolute;
  bottom: calc(100% + 8px); /* ✅ Luôn nằm trên bubble-wrap */
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 14px; padding: 8px 10px;
  display: flex; gap: 4px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.14);
  z-index: 30; white-space: nowrap;
}
/* Mine (bên phải) → căn phải để không tràn trái */
.emoji-above-right { right: 0; }
/* Theirs (bên trái) → căn trái để không tràn phải */
.emoji-above-left  { left: 0; }
.emoji-opt { font-size: 22px; cursor: pointer; transition: transform 0.12s; }
.emoji-opt:hover { transform: scale(1.35); }

.fade-enter-active,.fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from,.fade-leave-to { opacity: 0; }

/* Typing */
.typing-row { margin-top: 4px; }
.typing-dots {
  display: flex; align-items: center; gap: 4px;
  background: var(--bg-card); border-radius: 18px; padding: 12px 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.typing-dots span {
  width: 6px; height: 6px; border-radius: 50%; background: var(--text-sub);
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
  background: var(--bg-card); border-top: 1px solid var(--border-color);
  padding: 8px 16px; flex-shrink: 0; gap: 10px;
}
.reply-bar-inner { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.reply-bar-accent { width: 3px; height: 34px; background: #FF642F; border-radius: 2px; flex-shrink: 0; }
.reply-bar-body { min-width: 0; }
.reply-bar-who { font-size: 12px; font-weight: 700; color: #FF642F; display: block; }
.reply-bar-txt { font-size: 13px; color: var(--text-sub); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.reply-close {
  background: none; border: none; cursor: pointer;
  color: var(--text-sub); padding: 4px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.reply-close:hover { background: var(--hover-bg); color: var(--text-main); }

/* Media strip */
.media-strip {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 16px;
  background: var(--bg-input);
  border-top: 1px solid var(--border-color);
}
.media-strip-item { position: relative; flex-shrink: 0; }
.strip-thumb {
  width: 72px; height: 72px; object-fit: cover;
  border-radius: 8px; border: 1px solid var(--border-color); display: block;
}
.strip-video { background: #000; }
.strip-remove {
  position: absolute; top: -6px; right: -6px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #ef4444; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.strip-add {
  width: 72px; height: 72px; border-radius: 8px;
  border: 2px dashed var(--border-color);
  background: var(--bg-input);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-sub); flex-shrink: 0;
}
.strip-add:hover { border-color: #FF642F; color: #FF642F; background: var(--hover-primary); }

.media-btn {
  position: relative; width: 36px; height: 36px; border-radius: 50%;
  border: none; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-sub); flex-shrink: 0; transition: background 0.12s;
}
.media-btn:hover { background: var(--hover-bg); color: var(--text-main); }
.media-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.media-count-badge {
  position: absolute; top: -2px; right: -2px;
  background: #FF642F; color: #fff; font-size: 10px; font-weight: 700;
  width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

/* Media grid */
.msg-media-grid {
  display: grid; gap: 3px; border-radius: 12px; overflow: hidden;
  max-width: 300px; margin-top: 4px;
  background: var(--bg-card);
  box-shadow: 0 1px 6px rgba(0,0,0,0.10);
}
.grid-mine  { align-self: flex-end; }
.grid-theirs { align-self: flex-start; }
.grid-1 { grid-template-columns: 1fr; }
.grid-2 { grid-template-columns: 1fr 1fr; }
.grid-3 { grid-template-columns: 1fr 1fr; }
.grid-4 { grid-template-columns: 1fr 1fr; }
.grid-3 .msg-media-cell:first-child,
.grid-4 .msg-media-cell:first-child { grid-column: 1 / -1; }
.msg-media-cell { overflow: hidden; background: var(--bg-input); }
.msg-media-img {
  width: 100%; height: 160px; object-fit: cover;
  display: block; cursor: zoom-in; transition: opacity 0.15s;
}
.msg-media-img:hover { opacity: 0.88; }
.grid-1 .msg-media-img { height: 220px; }
.msg-media-vid { width: 100%; max-height: 220px; display: block; background: #111; }

/* Lightbox */
.lightbox {
  position: fixed; inset: 0; background: rgba(0,0,0,0.88);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
}
.lightbox-img { max-width: 92vw; max-height: 90vh; border-radius: 10px; object-fit: contain; }
.lightbox-sender {
  position: absolute; top: 18px; left: 20px;
  display: flex; align-items: center; gap: 10px;
  background: rgba(0,0,0,0.45); border-radius: 12px; padding: 8px 14px;
  backdrop-filter: blur(4px);
}
.lb-av { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.3); }
.lb-name { font-size: 13px; font-weight: 700; color: #fff; }
.lb-time { font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 1px; }
.lightbox-vid { max-width: 92vw; max-height: 88vh; border-radius: 10px; background: #000; outline: none; }
.msg-media-vid { cursor: pointer; }
.lightbox-close {
  position: absolute; top: 20px; right: 20px;
  background: rgba(255,255,255,0.15); border: none; border-radius: 50%;
  width: 44px; height: 44px; display: flex; align-items: center;
  justify-content: center; cursor: pointer; color: #fff;
}
.lightbox-close:hover { background: rgba(255,255,255,0.3); }
.lightbox-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,0.15); border: none; border-radius: 50%;
  width: 48px; height: 48px; display: flex; align-items: center;
  justify-content: center; cursor: pointer; color: #fff; transition: background 0.15s;
}
.lightbox-nav:hover { background: rgba(255,255,255,0.35); }
.lightbox-prev { left: 20px; }
.lightbox-next { right: 20px; }
.lightbox-counter {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.5); color: #fff; font-size: 13px;
  padding: 4px 14px; border-radius: 20px;
}

/* Input bar */
.input-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0; transition: background-color 0.3s;
}
.input-field {
  flex: 1; border: 1.5px solid var(--border-color); border-radius: 18px;
  padding: 10px 18px; outline: none; font-size: 14px; color: var(--text-main);
  background: var(--bg-input);
  transition: border-color 0.2s, background 0.3s;
  box-sizing: border-box; resize: none; overflow-y: hidden;
  min-height: 42px; max-height: 120px; line-height: 1.5; font-family: inherit;
}
.input-field:focus { border-color: #FF642F; background: var(--bg-card); }
.input-field::placeholder { color: var(--text-sub); }

.send-btn {
  width: 42px; height: 42px; border-radius: 50%;
  background: #FF642F; border: none; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.15s, transform 0.1s;
}
.send-btn:hover    { background: #e0501a; transform: scale(1.05); }
.send-btn:disabled { background: var(--border-color); cursor: not-allowed; transform: none; }

/* Empty state */
.empty-chat {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; color: var(--text-sub); text-align: center;
  background: var(--bg-card);
}
.empty-chat-icon { margin-bottom: 16px; }
.empty-chat h3 { margin: 0 0 6px; font-size: 20px; color: var(--text-main); font-weight: 700; }
.empty-chat p  { font-size: 14px; margin: 0; }

/* ── RESPONSIVE ── */
.mobile-overlay { display: none; }
.back-btn {
  display: none; background: none; border: none; cursor: pointer;
  color: var(--text-sub); padding: 4px;
  align-items: center; justify-content: center;
}

@media (max-width: 768px) {
  .msg-container { padding: 0; background: var(--bg-card); }
  .sidebar {
    position: fixed; left: 0; top: 60px; bottom: 0;
    width: 280px; z-index: 100; border-radius: 0;
    box-shadow: 4px 0 20px rgba(0,0,0,0.15);
    transform: translateX(-100%); transition: transform 0.3s ease;
  }
  .sidebar.mobile-open { transform: translateX(0); }
  .chat-main { border-radius: 0; width: 100%; }
  .mobile-overlay {
    display: block; position: fixed; inset: 0;
    background: rgba(0,0,0,0.4); z-index: 99;
  }
  .back-btn { display: flex; }
}
</style>