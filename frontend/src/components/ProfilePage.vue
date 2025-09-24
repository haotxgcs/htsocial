<template>
  <div class="profile-container">
    <!-- Cover Section -->
    <div class="cover-section">
      <div class="cover-photo">
        <img 
          :src="user.coverPhoto ? `http://localhost:3000/${user.coverPhoto}` : defaultCover" 
          alt="Cover Photo"
          class="cover-image"
        />
        <button class="edit-cover-btn">Chỉnh sửa ảnh bìa</button>
      </div>

      <div class="profile-info-bar">
        <div class="profile-main-info">
          <div class="avatar-container">
            <img 
              :src="user.avatar ? `http://localhost:3000/${user.avatar}` : defaultAvatar" 
              alt="Profile Picture"
              class="profile-avatar"
            />
            <button class="edit-avatar-btn">📷</button>
          </div>

          <div class="user-info">
            <h1 class="user-name">{{ user.firstname }} {{ user.lastname }}</h1>
            <p class="friends-count">{{ user.friends?.length || 0 }} bạn bè</p>
          </div>
        </div>

        <div class="profile-actions">
          <button class="btn btn-secondary">Chỉnh sửa trang cá nhân</button>
          <button class="btn btn-icon">⋯</button>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="profile-nav">
      <div class="nav-container">
        <div class="nav-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['nav-tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Profile Content -->
    <div class="profile-content">
      <!-- Left Column -->
      <div class="content-left">
        <!-- Giới thiệu -->
        <div class="intro-card card">
          <h3>Bio</h3>
          <div class="intro-item">
            <i class="icon-calendar"></i>
            <span>Joined at {{ joinDateFormatted }}</span>
          </div>
        </div>

        <!-- Ảnh -->
        <div class="photos-card card">
          <h3>Ảnh</h3>
          <div class="photos-grid">
            <div 
              v-for="photo in postsWithImages" 
              :key="photo._id"
              class="photo-item"
            >
              <img :src="`http://localhost:3000/${photo.media}`" alt="Post image" />
            </div>
          </div>
        </div>

        <!-- Bạn bè -->
        <div class="friends-card card">
          <h3>Bạn bè</h3>
          <div v-if="user.friends?.length" class="friends-grid">
            <div v-for="friend in user.friends" :key="friend._id" class="friend-item">
              <img :src="`http://localhost:3000/${friend.avatar}`" />
              <span>{{ friend.firstname }} {{ friend.lastname }}</span>
            </div>
          </div>
          <p v-else class="no-friends">Bạn chưa có bạn bè nào</p>
        </div>
      </div>

      <!-- Right Column -->
      <div class="content-right">
        <!-- Create Post -->
        <div class="create-post">
        <h3>Create your post</h3>
        <input type="text" @click="openCreatePostModal" :placeholder="`What's is on your mind, ${user?.firstname} ${user?.lastname}?`"/>
      </div>

        <!-- Create Post Modal -->
      <div v-if="createPostModalVisible" class="create-post-modal-overlay" @click="closeCreatePostModal">
        <div class="create-post-modal-content" @click.stop>
          <!-- Header modal -->
          <div class="create-post-modal-header">
            <h3>Create a post</h3>
            <button class="close-btn" @click="closeCreatePostModal">&times;</button>
          </div>

          <!-- User info -->
          <div class="post-creator-info">
            <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="creator-avatar" />
            <div class="creator-details">
              <strong>{{ user?.firstname }} {{ user?.lastname }}</strong>
              <div class="privacy-selector">
                <select v-model="postPrivacy">
                  <option value="public">🌐 Public</option>
                  <option value="friends">👥 Friends</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Post content -->
          <div class="post-content-area">
            <textarea 
              v-model="newPostContent" 
              :placeholder="`${user?.firstname} ${user?.lastname} , what's on your mind?`"
              class="post-textarea"
              ref="postTextarea"
              @input="adjustTextareaHeight"
            ></textarea>
            
            <div class="add-options">
              <button @click="toggleEmojiPicker" class="add-option">
                  <span class="option-icon"><img src="../assets/emoji.png"></span>
                  <span>Icon</span>
                </button>

              <label class="add-option">
                <input type="file" @change="handleMediaSelect" accept="image/*,video/*" style="display: none;">
                <span class="option-icon"><img src="../assets/media.png"></span>
                <span>Media</span>
              </label>

                
            
            </div>
                
              <div v-if="showEmojiPicker" class="emoji-picker">
                <div class="emoji-categories">
                  <button 
                    v-for="category in emojiCategories" 
                    :key="category.name"
                    @click="selectedEmojiCategory = category.name"
                    :class="{ active: selectedEmojiCategory === category.name }"
                    class="emoji-category-btn"
                  >
                    {{ category.icon }}
                  </button>
                </div>
                <div class="emoji-grid">
                  <button 
                    v-for="emoji in getCurrentCategoryEmojis()" 
                    :key="emoji"
                    @click="insertEmoji(emoji)"
                    class="emoji-item"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </div>
          </div>

          <!-- Media preview -->
          <div v-if="selectedMedia" class="media-preview">
            <div class="media-preview-container">
              <img v-if="isImageFile(selectedMedia)" :src="mediaPreviewUrl" class="preview-image" />
              <video v-else-if="isVideoFile(selectedMedia)" :src="mediaPreviewUrl" class="preview-video" controls></video>
              <button @click="removeMedia" class="remove-media-btn">&times;</button>
            </div>
          </div>

          <!-- Post button -->
          <div class="post-actions-footer">
            <button 
              @click="submitNewPost" 
              :disabled="!canPost"
              class="post-submit-btn"
              :class="{ disabled: !canPost }"
            >
              Post
            </button>
          </div>
        </div>
      </div>

  <ConfirmDialog
  v-if="confirmVisible"
  :message="confirmMessage"
  @confirm="handleConfirmedDelete"
  @cancel="confirmVisible = false"
  />
  


      <!-- Edit Post Modal -->
      <div v-if="editModalVisible" class="modal-overlay">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Edit Post</h3>
            <button class="close-btn" @click="editModalVisible = false">&times;</button>
          </div>

          <!-- Post author -->
          <div class="post-creator-info">
            <img :src="getAvatarUrl(user)" class="creator-avatar" />
            <div class="creator-details">
              <strong>{{ user.firstname }} {{ user.lastname }}</strong>

              <div class="privacy-selector">
                <select v-model="editPrivacy">
                  <option value="public">🌐 Public</option>
                  <option value="friends">👥 Friends</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Content -->
          <textarea
            v-model="editContent"
            class="post-textarea"
            placeholder="What are you thinking?"
            ref="editTextarea"
            @input="adjustTextareaHeightEdit"
          ></textarea>

          <!-- Existing media -->
          <div v-if="editMediaPreview" class="media-preview-container">
            <img
              v-if="editMediaType === 'image'"
              :src="editMediaPreview"
              class="preview-image"
            />
            <video
              v-else-if="editMediaType === 'video'"
              controls
              class="preview-video"
            >
              <source :src="editMediaPreview" type="video/mp4" />
            </video>
            <button class="remove-media-btn" @click="removeEditMedia">&times;</button>
          </div>

          <!-- Add emoji and media -->
          <div class="add-options">
            <button @click="toggleEditEmojiPicker" class="add-option">
              <span class="option-icon"><img src="../assets/emoji.png"></span>
              <span>Emoji</span>
            </button>

            <label class="add-option">
              <input type="file" @change="handleEditFile" accept="image/*,video/*" style="display: none;">
              <span class="option-icon"><img src="../assets/media.png"></span>
              <span>Media</span>
            </label>
          </div>

          <!-- Emoji Picker -->
          <div v-if="showEditEmojiPicker" class="emoji-picker edit-emoji-picker">
            <div class="emoji-categories">
              <button 
                v-for="category in emojiCategories" 
                :key="category.name"
                @click="selectedEditEmojiCategory = category.name"
                :class="{ active: selectedEditEmojiCategory === category.name }"
                class="emoji-category-btn"
              >
                {{ category.icon }}
              </button>
            </div>
            <div class="emoji-grid">
              <button 
                v-for="emoji in getCurrentEditCategoryEmojis()" 
                :key="emoji"
                @click="insertEditEmoji(emoji)"
                class="emoji-item"
              >
                {{ emoji }}
              </button>
            </div>
          </div>

          <!-- Save buttons -->
          <div style="margin-top: 12px; text-align: right;">
            <button @click="editModalVisible = false" class="btn btn-secondary">Cancel</button>
            <button @click="submitEditPost" class="btn btn-primary" style="margin-left: 8px;">Save</button>
          </div>
        </div>
      </div>

      <!-- Modal Comment -->
      <div v-if="commentModalVisible" class="comment-modal-overlay" @click="closeCommentModal">
        <div class="comment-modal-content" @click.stop>
          <!-- Header modal -->
          <div class="comment-modal-header">
            <h3>{{ selectedPost?.author?.firstname }} {{ selectedPost?.author?.lastname }}'s Post</h3>
            <button class="close-btn" @click="closeCommentModal">&times;</button>
          </div>

          <!-- Nội dung bài viết -->
          <div class="post-detail">
            <div class="post-author-info">
              <img :src="getAvatarUrl(selectedPost?.author.avatar)" alt="avatar" class="user-avatar" />
              <div class="author-details">
                <strong>{{ selectedPost?.author.firstname }} {{ selectedPost?.author.lastname }}</strong>
                <p class="time">{{ formatTime(selectedPost?.createdAt) }}</p>
              </div>
            </div>
            
            <p class="post-content">{{ selectedPost?.content }}</p>
            
            <!-- Media trong modal -->
            <div v-if="selectedPost?.media" class="post-media-modal">
              <img
                v-if="selectedPost.mediaType === 'image'"
                :src="`http://localhost:3000/${selectedPost.media}`"
                class="post-image-modal"
              />
              <video
                v-else-if="selectedPost.mediaType === 'video'"
                controls
                class="post-video-modal"
              >
                <source :src="`http://localhost:3000/${selectedPost.media}`" type="video/mp4" />
              </video>
            </div>

            <!-- Thống kê like/comment -->
            <div class="post-stats">
              <span v-if="selectedPost?.likes?.length > 0">{{ selectedPost.likes.length }} likes</span>
              <span v-if="postCommentCounts[selectedPost._id]">{{ postCommentCounts[selectedPost._id] }} comments</span>
              <span v-if="selectedPost?.sharesCount > 0">{{ selectedPost.sharesCount }} shares</span>
            </div>

            <!-- Action buttons -->
            <div class="post-actions-modal">
              <button @click="toggleLike(selectedPost)" class="action-btn">
                <img :src="isLiked(selectedPost) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" />
                <span>Like</span>
              </button>
              <button class="action-btn" disabled>
                <img src="../assets/comment.png" alt="Comment" class="action-icon" />
                <span>Comment</span>
              </button>
              <button @click="openShareModal(selectedPost)" class="action-btn">
                <img src="../assets/share.png" alt="Share" class="action-icon" />
                <span>Share</span>
              </button>
            </div>
          </div>

          <!-- Danh sách comments -->
      <div class="comments-section">
        <div class="comments-list">
          <div v-if="comments.length === 0" class="no-comments">
            <div class="no-comments-icon">💬</div>
            <p>No comments yet.</p>
            <p class="sub-text">Be the first to comment.</p>
          </div>
          
          <div v-else>
            <div v-for="comment in comments" :key="comment._id" class="comment-item">
              <img :src="`http://localhost:3000/${comment.author?.avatar || 'uploads/user.png'}`" alt="avatar" class="user-avatar" />

              <div class="comment-content">
                <div class="comment-bubble">
                  <strong class="comment-author">
                  {{ comment.author?.firstname }} {{ comment.author?.lastname }}
                  <span v-if="comment.author._id === selectedPost.author._id" class="author-label">Author</span>
                  </strong>

                  <!-- Nếu đang chỉnh sửa comment này -->
                  <div v-if="editingCommentId === comment._id">
                    <textarea v-model="editedContent" class="edit-textarea"></textarea>
                    <div class="edit-actions">
                      <button @click="saveComment(comment._id)" class="save-btn">Save</button>
                      <button @click="cancelEdit()" class="cancel-btn">Cancel</button>
                    </div>
                  </div>

                  <p v-else class="comment-text">{{ comment.content }}</p>
                </div>

                <div class="comment-actions">
                  <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                  
                  <button @click="toggleCommentLike(comment)" class="comment-action-btn">
                    <img :src="isCommentLiked(comment) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon-small">
                    <span>{{ comment.likes?.length || 0 }}</span>
                  </button>
                  
                  <button v-if="!isMyComment(comment)" @click="toggleReply(comment._id, comment.author)" class="comment-action-btn">
                    <img src="../assets/reply.png" class="action-icon-small">Reply
                  </button>
                  
                  <button v-if="isMyComment(comment)" @click="editComment(comment)" class="comment-action-btn">
                    <img src="../assets/edit.png" class="action-icon-small">Edit
                  </button>
                  
                  <button v-if="isMyComment(comment)" @click="deleteComment(comment._id)" class="comment-action-btn">
                    <img src="../assets/delete.png" class="action-icon-small">Delete
                  </button>
                </div>

                <!-- Form reply -->
                <div v-if="replyInputs[comment._id] !== undefined" class="reply-section">
                  <div class="reply-input-wrapper">
                    <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="user-avatar-small" />
                    <input 
                      v-model="replyInputs[comment._id]" 
                      @keypress.enter="submitReply(comment._id)"
                      placeholder="Write a reply..."
                      class="reply-input"
                    />
                    <button @click="submitReply(comment._id)" class="send-reply-btn" :disabled="!replyInputs[comment._id]?.trim()">➤</button>
                    
                  </div>
                </div>

                <!-- Hiển thị replies -->
                <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
                  <button @click="toggleRepliesVisibility(comment._id)" class="toggle-replies-btn">
                    {{ showReplies[comment._id] ? 'Hide' : 'View' }} {{ comment.replies.length }} replies
                  </button>
                  
                  <div v-if="showReplies[comment._id]" class="replies-list">
                    <div v-for="reply in comment.replies" :key="reply?._id" class="reply-item">
                      <img :src="`http://localhost:3000/${reply?.author?.avatar || 'uploads/user.png'}`" alt="avatar" class="user-avatar-small" />
                      <div class="reply-content">
                        <div class="reply-bubble">
                          <strong>
                            {{ reply?.author?.firstname }} {{ reply?.author?.lastname }}
                            <span v-if="reply.author._id === selectedPost.author._id" class="author-label">Author</span>
                          </strong>
                          
                          <div v-if="editingReplyId === reply._id">
                          <input 
                            v-model="editedReplyContent" 
                            class="edit-reply-input"
                            @keypress.enter="startEditReply(comment._id, reply._id)"
                          />
                          <div class="edit-actions">
                            <button @click="saveReply(comment._id, reply._id)" class="save-btn">Save</button>
                            <button @click="cancelEditReply()" class="cancel-btn">Cancel</button>
                          </div>
                        </div>

                        <div v-else>
                          <p class="reply-content">
                            <span v-if="reply?.replyTo?.firstname" class="reply-to-name">
                              @{{ reply?.replyTo?.firstname }} {{ reply?.replyTo?.lastname }}
                            </span>
                            <span v-if="reply?.replyTo?.firstname">&nbsp;</span>{{ reply.content }}
                          </p>
                        </div>

                        </div>
                        <div class="reply-actions">
                          <span class="reply-time">{{ formatTime(reply?.createdAt) }}</span>
                          <button @click="toggleReplyLike(reply, comment._id)" class="comment-action-btn">
                          <img :src="isReplyLiked(reply) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon-small">
                          <span>{{ reply?.likes.length || 0 }}</span>
                        </button>
                        <button v-if="isMyReply(reply)" @click="startEditReply(reply)" class="comment-action-btn">
                          <img src="../assets/edit.png" class="action-icon-small">Edit
                        </button>

                        <button v-if="!isMyReply(reply)" @click="startReplyingToReply(comment._id, reply,reply.author)" class="comment-action-btn">
                        <img src="../assets/reply.png" class="action-icon-small">Reply
                      </button>

                        <button v-if="isMyReply(reply)" @click="deleteReply(comment._id, reply?._id)" class="comment-action-btn">
                            <img src="../assets/delete.png" class="action-icon-small">Delete
                          </button>
                        </div>

                        <!-- Reply to a reply form -->
                        <div v-if="replyInputsReply[reply._id] !== undefined" class="reply-to-reply-input-wrapper">
                          <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" class="user-avatar-small" />
                          <input
                            v-model="replyInputsReply[reply._id]"
                            placeholder="Write a reply..."
                            class="reply-input"
                            @keypress.enter="submitReplyToReply(comment._id, reply._id)"
                          />
                          <button
                            @click="submitReplyToReply(comment._id, reply._id)"
                            class="send-reply-btn"
                            :disabled="!replyInputsReply[reply._id]?.trim()"
                          >➤
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

            <!-- Form thêm comment -->
            <div class="add-comment-section">
              <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="user-avatar" />
              <div class="comment-input-wrapper">
                <input 
                  v-model="newComment" 
                  @keypress.enter="submitComment"
                  placeholder="Write a comment..."
                  class="comment-input"
                />
                <button @click="submitComment" class="send-comment-btn" :disabled="!newComment.trim()">
                  ➤
                </button>
              </div>
            </div>





          </div>
          
        </div>
      </div>
      
      <!-- Modal Share Post -->
      <div v-if="shareModalVisible" class="share-modal-overlay" @click="closeShareModal">
        <div class="share-modal-content" @click.stop>
          <!-- Header -->
          <div class="share-modal-header">
            <h3>Share Post</h3>
            <button class="close-btn" @click="closeShareModal">&times;</button>
          </div>

          <!-- Người chia sẻ -->
          <div class="post-creator-info" v-if="user && user.firstname">
            <img :src="getAvatarUrl(user)" alt="avatar" class="creator-avatar" />
            <div class="creator-details">
              <strong>{{ user.firstname }} {{ user.lastname }}</strong>
              <div class="privacy-selector">
                <select v-model="shareAudience">
                  <option value="public">🌐 Public</option>
                  <option value="friends">👥 Friends</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Nội dung người chia sẻ viết -->
          <textarea
            v-model="shareContent"
            class="post-textarea"
            placeholder="Say something about this post..."
            ref="shareTextarea"
            @input="adjustTextareaHeightShare"
          ></textarea>

          <!-- Xem trước bài gốc -->
          <div class="shared-post-preview" v-if="sharedPost && sharedPost.author">
            <div class="shared-post-header">
              <img :src="getAvatarUrl(sharedPost.author)" alt="avatar" class="creator-avatar-small" />
              <div class="creator-details-small">
                <strong>{{ sharedPost.author.firstname }} {{ sharedPost.author.lastname }}</strong>
                <p class="time">{{ formatTime(sharedPost.createdAt) }}</p>
              </div>
            </div>
            <p class="shared-post-content">{{ sharedPost.content }}</p>
            <div v-if="sharedPost.media" class="shared-post-media">
              <img
                v-if="sharedPost.mediaType === 'image'"
                :src="`http://localhost:3000/${sharedPost.media}`"
                class="preview-image"
              />
              <video
                v-else-if="sharedPost.mediaType === 'video'"
                controls
                class="preview-video"
              >
                <source :src="`http://localhost:3000/${sharedPost.media}`" type="video/mp4" />
              </video>
            </div>
          </div>

          <!-- Nút chia sẻ -->
          <div class="post-actions-footer">
            <button @click="closeShareModal" class="btn btn-secondary">Cancel</button>
            <button @click="submitSharePost" class="btn btn-primary" style="margin-left: 8px;">Share</button>
          </div>
        </div>
      </div>
      
        <!-- User Posts -->
        <div v-if="userPosts.length" class="post-list">
          <div v-for="post in userPosts" :key="post._id" class="post-item card">

            <!-- ===== ORIGINAL POST ===== -->
            <div v-if="post.type === 'original'">
              <div class="post-header">
                <div class="post-author-info">
                  <img :src="getAvatarUrl(post.author)" class="avatar-small" />
                  <div class="author-details">
                    <strong>{{ post.author.firstname }} {{ post.author.lastname }}</strong>
                    <p class="time">
                      {{ formatTime(post.createdAt) }}
                      <span v-if="post.audience === 'public'">🌐</span>
                      <span v-else-if="post.audience === 'friends'">👥</span>
                      <span v-else-if="post.audience === 'private'">🔒</span>
                    </p>
                  </div>
                </div>

                <!-- menu icon -->
                <div class="post-menu-wrapper">
                  <img src="../assets/menu.png" class="menu-post-icon" @click="toggleMenu(post._id)" />
                  <div v-if="openMenuId === post._id" class="dropdown-menu">
                    <button v-if="isMyPost(post)" @click="editPost(post)">
                      <img src="../assets/edit.png" class="menu-icon-left"/> Edit Post
                    </button>
                    <button v-if="!isMyPost(post)" @click="hideThisPost(post._id)">
                      <img src="../assets/hide.png" class="menu-icon-left"/> Hide this Post
                    </button>
                    <button v-if="isMyPost(post)" @click="deletePost(post._id)" style="color: red">
                      <img src="../assets/delete.png" class="menu-icon-left"/> Delete Post
                    </button>
                  </div>
                </div>
              </div>

              <p v-if="post.content" class="post-content">{{ post.content }}</p>

              <div v-if="post.media">
                <img v-if="post.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" class="post-image" />
                <video v-else controls class="post-video">
                  <source :src="`http://localhost:3000/${post.media}`" type="video/mp4" />
                </video>
              </div>

              <!-- ===== POST STATS ===== -->
            <div class="post-stats">
              <span v-if="post.likes?.length">{{ post.likes.length }} likes</span>
              <span v-if="post.commentCount + post.replyCommentCount">{{ post.commentCount + post.replyCommentCount }} comments</span>
              <span v-if="post.sharesCount">{{ post.sharesCount }} shares</span>
            </div>

            <!-- ===== POST ACTIONS ===== -->
            <div class="post-actions">
              <button @click="toggleLike(post)">
                <img :src="isLiked(post) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" />
                <span>Like</span>
              </button>
              <button @click="openCommentModal(post)">
                <img src="../assets/comment.png" class="action-icon" />
                <span>Comment</span>
              </button>
              <button @click="openShareModal(post)">
                <img src="../assets/share.png" class="action-icon" />
                <span>Share</span>
              </button>
            </div>

            </div>

            <!-- ===== SHARE POST ===== -->
            <div v-else-if="post.type === 'share'" class="shared-post">

  <!-- Người chia sẻ -->
  <div class="post-header">
    <div class="post-author-info">
      <img :src="getAvatarUrl(post.username)" alt="avatar" />
      <div class="author-details">
        <strong>{{ post.username?.firstname }} {{ post.username?.lastname }}</strong>
        <p class="time">
        {{ formatTime(post.createdAt) }} • Shared a post
        <span v-if="post.audience === 'public'" title="Public">🌐</span>
        <span v-else-if="post.audience === 'friends'" title="Friends">👥</span>
        <span v-else-if="post.audience === 'private'" title="Private">🔒</span>
        </p>
      </div>
    </div>

    <!-- menu share -->
    <div class="post-menu-wrapper">
      <img src="../assets/menu.png" class="menu-post-icon" @click="toggleMenu(post._id)" />
      <div v-if="openMenuId === post._id" class="dropdown-menu">
        <button v-if="isMyShare(post)" @click="editShare(post)">
          <img src="../assets/edit.png" class="menu-icon-left"/> Edit Share
        </button>
        <button v-if="!isMyShare(post)" @click="hideThisShare(post._id)">
          <img src="../assets/hide.png" class="menu-icon-left"/> Hide Share
        </button>
        <button v-if="isMyShare(post)" @click="deleteShare(post._id)" style="color: red">
          <img src="../assets/delete.png" class="menu-icon-left"/> Delete Share
        </button>
      </div>
    </div>
  </div>

  <p class="post-text" v-if="post.content"><i>{{ post.content }}</i></p>

  <!-- ======= BÀI GỐC (bên trong share) ======= -->
  <!-- Shared post content box -->
<div class="shared-box">
  <template v-if="post.post">
    <!-- Nếu viewer không được xem -->
    <template v-if="!canViewSharedPost(post.post)">
      <div class="restricted-post-warning">
        <img :src="getAvatarUrl(post.post.author)" class="avatar-small" />
        <div class="restricted-content">
          <strong>{{ post.post.author.firstname }} {{ post.post.author.lastname }}</strong>
          <p class="time">
            {{ formatTime(post.post.createdAt) }}
            <span v-if="post.post.audience === 'public'">🌐</span>
            <span v-else-if="post.post.audience === 'friends'">👥</span>
            <span v-else-if="post.post.audience === 'private'">🔒</span>
          </p>
          <p class="notice-message">{{ getPostAccessMessage(post.post) }}</p>
        </div>
      </div>
    </template>

    <!-- Nếu được phép xem -->
    <template v-else>
      <div class="post-header">
        <img :src="getAvatarUrl(post.post.author)" class="avatar-small" />
        <div class="author-details">
          <strong>{{ post.post.author.firstname }} {{ post.post.author.lastname }}</strong>
          <p class="time">
            {{ formatTime(post.post.createdAt) }}
            <span v-if="post.post.audience === 'public'">🌐</span>
            <span v-else-if="post.post.audience === 'friends'">👥</span>
            <span v-else-if="post.post.audience === 'private'">🔒</span>
          </p>
        </div>
      </div>
      <p>{{ post.post.content }}</p>
      <div v-if="post.post.media">
        <img v-if="post.post.mediaType === 'image'" :src="`http://localhost:3000/${post.post.media}`" class="post-image" />
        <video v-else controls class="post-video">
          <source :src="`http://localhost:3000/${post.post.media}`" type="video/mp4" />
        </video>
      </div>
      <!-- Like/Comment/Share count -->
      <div class="post-stats">
        <span v-if="post.post.likes?.length > 0">{{ post.post.likes.length }} likes</span>
        <span v-if="(post.post.commentCount || 0) + (post.post.replyCommentCount || 0) > 0">
          {{ (post.post.commentCount || 0) + (post.post.replyCommentCount || 0) }} comments
        </span>
        <span v-if="post.post.sharesCount > 0">{{ post.post.sharesCount }} shares</span>
      </div>

      <!-- Actions -->
      <div class="post-actions">
        <button @click="toggleLike(post.post)">
          <img :src="isLiked(post.post) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" />
          <span>Like</span>
        </button>
        <button @click="openCommentModal(post.post)">
          <img src="../assets/comment.png" class="action-icon" />
          <span>Comment</span>
        </button>
        <button @click="openShareModal(post.post)">
          <img src="../assets/share.png" class="action-icon" />
          <span>Share</span>
        </button>
      </div>
    </template>
  </template>

  <!-- Nếu bài gốc đã xoá -->
  <template v-else>
    <div class="restricted-post-warning">
      <p class="notice-message">This post is deleted</p>
    </div>
  </template>
</div>
</div>

            
          </div>
        </div>

        <!-- Nếu không có bài -->
        <p v-else class="no-posts">Người dùng chưa có bài viết nào</p>
      </div>

    </div>
  </div>

    <EditShareModal
  v-if="showEditShareModal"
  :share="editedShare"
  @close="showEditShareModal = false"
  @updated="fetchUserPosts"
/>

</template>


<script>
import ConfirmDialog from './ConfirmDialog.vue';
import EditShareModal from './EditShareModal.vue';

export default {
  name: "ProfilePage",
  components: {
    ConfirmDialog,
    EditShareModal
  },
  data() {
    return {
      user: {},
      userPosts: [],
      openMenuId: null,
      confirmVisible:false,
      confirmMessage: '',
      postToDeleteId: null,

      // Edit post
      editModalVisible: false,
      editContent: '',
      editPostId: null, 
      editMediaType: '',
      editMediaPreview: '',
      editMediaFile: null,
      editPrivacy: 'public',

      newPostContent: "",
      selectedMedia: null,
      mediaPreviewUrl: null,
      postPrivacy: "public",
      activeTab: "posts",
      tabs: [
        { id: "posts", label: "Bài viết" },
        { id: "about", label: "Giới thiệu" },
        { id: "friends", label: "Bạn bè" }
      ],
      defaultAvatar: "uploads/user.png",
      defaultCover: "uploads/cover.png",
      createPostModalVisible: false,

      // ===== Modal Comment =====
      commentModalVisible: false,
      selectedPost: null,
      comments: [],
      newComment: "",
      editingCommentId: null,
      editedContent: "",
      replyInputs: {},
      replyInputsReply: {},
      editingReplyId: null,
      editedReplyContent: "",
      showReplies: {},
      

      // ===== Modal Share =====
      shareModalVisible: false,
      sharedPost: null,
      shareAudience: "public",
      shareContent: "",
      showEditShareModal: false,
      editedShare: null,

      // Emoji picker data
      showEmojiPicker: false,
      selectedEmojiCategory: 'smileys',
      showEditEmojiPicker: false,
      selectedEditEmojiCategory: 'smileys',
      emojiCategories: [
        { name: 'smileys', icon: '😀' },
        { name: 'people', icon: '👋' },
        { name: 'nature', icon: '🌸' },
        { name: 'food', icon: '🍕' },
        { name: 'activities', icon: '⚽' },
        { name: 'travel', icon: '🏠' },
        { name: 'objects', icon: '💡' },
        { name: 'symbols', icon: '❤️' }
      ],
      emojis: {
        smileys: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳'],
        people: ['👋','🤚','🖐️','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏'],
        nature: ['🌸','💐','🌹','🥀','🌺','🌻','🌼','🌷','🌱','🌲','🌳','🌴','🌵','🌶️','🍄','🌾','💮','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️'],
        food: ['🍕','🍔','🍟','🌭','🥪','🌮','🌯','🥙','🧆','🥚','🍳','🥘','🍲','🥗','🍿','🧈','🧂','🥯','🍞','🥖','🥨','🧀','🥞','🧇','🥓','🥩','🍗','🍖'],
        activities: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽'],
        travel: ['🏠','🏡','🏘️','🏚️','🏗️','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🛕','🕍','🕋','⛩️','🛤️','🛣️','🗾'],
        objects: ['💡','🔦','🏮','🪔','📱','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💽','💾','💿','📀','🧮','🎥','🎞️','📽️','🎬','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️'],
        symbols: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎']
      },
    };
  },
  computed: {
    joinDateFormatted() {
      return this.user.createdAt
        ? new Date(this.user.createdAt).toLocaleDateString()
        : "N/A";
    },
    postsWithImages() {
      return this.userPosts.filter(p => p.mediaType === "image");
    },
    canPost() {
      return this.newPostContent.trim() || this.selectedMedia;
    },
    postCommentCounts() {
    const counts = {};
    for (const comment of this.comments) {
      if (!counts[comment.post]) {
        counts[comment.post] = 0;
      }
      counts[comment.post] += 1 + (comment.replies?.length || 0);
    }
    return counts;
  }

     
    
  },
  methods: {
    getAvatarUrl(author) {
      return author.avatar
        ? `http://localhost:3000/${author.avatar}`
        : `http://localhost:3000/${this.defaultAvatar}`;
    },
    formatTime(dateStr) {
      return new Date(dateStr).toLocaleString();
    },
    toggleMenu(postId) {
      this.openMenuId = this.openMenuId === postId ? null : postId;
    },

    async fetchUserProfile() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (!savedUser) return this.$router.push("/login");
        const res = await fetch(`http://localhost:3000/users/${savedUser.id}`);
        this.user = await res.json();
      } catch (err) {
        console.error("Lỗi tải thông tin user:", err);
      }
    },

    async fetchUserPosts() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (!savedUser) return;
        const res = await fetch(`http://localhost:3000/feeds/users/${savedUser.id}`);
        const data = await res.json();
        this.userPosts = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("Lỗi tải bài viết:", err);
        this.userPosts = [];
      }
    }, 

    isMyPost(post) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  return savedUser && post.author._id === savedUser.id;
  },

  





    // ===== CREATE POST =====
    openCreatePostModal() {
      this.createPostModalVisible = true;
      this.newPostContent = "";
      this.selectedMedia = null;
      this.mediaPreviewUrl = null;
    },
    closeCreatePostModal() {
      this.createPostModalVisible = false;
    },
    handleMediaSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedMedia = file;
        this.mediaPreviewUrl = URL.createObjectURL(file);
      }
    },
    removeMedia() {
      if (this.mediaPreviewUrl) URL.revokeObjectURL(this.mediaPreviewUrl);
      this.selectedMedia = null;
      this.mediaPreviewUrl = null;
    },
    async submitNewPost() {
      if (!this.canPost) return;
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Vui lòng đăng nhập");
      try {
        const formData = new FormData();
        formData.append('content', this.newPostContent);
        formData.append('author', savedUser.username);
        formData.append('audience', this.postPrivacy);
        if (this.selectedMedia) {
          formData.append('image', this.selectedMedia);
        }
        const res = await fetch('http://localhost:3000/posts', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        await this.fetchUserPosts();
        this.closeCreatePostModal();
        alert('Đăng bài thành công!');
      } catch (err) {
        console.error("Không thể tạo bài viết:", err);
        alert("Không thể đăng bài viết: " + err.message);
      }
    },

    // Edit Post
    adjustTextareaHeightEdit() {
  const textarea = this.$refs.editTextarea;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }
    },

    handleEditFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.editMediaFile = file;
      this.editMediaType = file.type.startsWith('video') ? 'video' : 'image';
      this.editMediaPreview = URL.createObjectURL(file);
    },

    removeEditMedia() {
      this.editMediaPreview = '';
      this.editMediaFile = null;
      this.editMediaType = '';
    },

    editPost(post) {
      this.editModalVisible = true;
      this.openMenuId = null;
      this.editPostId = post._id;
      this.editContent = post.content;
      this.editMediaType = post.mediaType;
      this.editMediaPreview = `http://localhost:3000/${post.media}`;
      this.editMediaFile = null;
      this.editPrivacy = post.privacy || 'public';

      this.$nextTick(() => {
        if (this.$refs.editTextarea) {
          this.adjustTextareaHeightEdit();
          this.$refs.editTextarea.focus();
        }
      });
    },

    async submitEditPost() {
      try {
        const formData = new FormData();
        formData.append('content', this.editContent);
        formData.append('audience', this.editPrivacy);
        if (this.editMediaFile) {
          formData.append('image', this.editMediaFile);
        }

        await this.$axios.put(`/posts/${this.editPostId}`, formData);
        alert('Update successfully!');
        this.editModalVisible = false;
        this.fetchUserPosts(); // reload lại danh sách bài viết
      } catch (err) {
        console.error("Error to update post:", err);
        alert("Unable to update post!");
      }
    },

    // Delete Post
    deletePost(postId) {
  this.confirmMessage = 'Are you sure to delete this post?';
  this.postToDeleteId = postId;
  this.confirmVisible = true;
    }, 

    async handleConfirmedDelete() {
      try {
        const res = await fetch(`http://localhost:3000/posts/${this.postToDeleteId}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          this.posts = this.posts.filter(p => p._id !== this.postToDeleteId);
          this.openMenuId = null;
        }
      } catch (err) {
        console.error("Fail to delete post:", err);
      }
      this.confirmVisible = false;
    },

    // ===== COMMENT MODAL =====
    async openCommentModal(post) {
    this.selectedPost = post;
    this.commentModalVisible = true;
    await this.fetchComments(post._id);
  },

  closeCommentModal() {
    this.commentModalVisible = false;
    this.selectedPost = null;
    this.comments = [];
    this.newComment = '';
  },

  async fetchComments(postId) {
  try {
    const res = await fetch(`http://localhost:3000/comments/posts/${postId}`);
    const data = await res.json();
    console.log(data); // 👈 kiểm tra author có tồn tại không
    this.comments = data;
  } catch (err) {
    console.error("Error to fetch comments:", err);
    this.comments = [];
  }
},

  async submitComment() {
  if (!this.newComment.trim()) return;

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !this.selectedPost) return;

  try {
    const res = await fetch(`http://localhost:3000/comments/posts/${this.selectedPost._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: this.newComment,
        authorId: user.id   
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Submit comment fail");

    this.comments.push(data.comment);  // add new comment to the list
    this.newComment = "";              // Reset input
  } catch (err) {
    console.error("Error to send comment:", err);
    alert("Unable to send comment: " + err.message);
  }
},

// Like comment
async toggleCommentLike(comment) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!savedUser) return alert("Please log in to like comments");

  try {
    const res = await fetch(`http://localhost:3000/comments/like/${comment._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: savedUser.id })
    });

    const data = await res.json();
    if (res.ok && data.comment) {
      const commentIndex = this.comments.findIndex(c => c._id === comment._id);
      if (commentIndex !== -1) {
        // Chỉ update likes và likeCount để giữ nguyên nội dung mention
        this.comments[commentIndex].likes = data.comment.likes;
        if (data.comment.likeCount !== undefined) {
          this.comments[commentIndex].likeCount = data.comment.likeCount;
        }
      }
    }
  } catch (err) {
    console.error("Error to like comment:", err);
  }
},

// Check if comment is liked by user
isCommentLiked(comment) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  return comment.likes && comment.likes.includes(savedUser.id);
},

// Edit comment
editComment(comment) {
  this.editingCommentId = comment._id;
  this.editedContent = comment.content;
},

// Save edited comment
async saveComment(commentId) {
  if (!this.editedContent.trim()) return;

  try {
    const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: this.editedContent })
    });

    if (res.ok) {
      const commentIndex = this.comments.findIndex(c => c._id === commentId);
      if (commentIndex !== -1) {
        this.comments[commentIndex].content = this.editedContent;
      }
      this.cancelEdit();
    }
  } catch (err) {
    console.error("Error to update comment:", err);
    alert("Unable to update comment");
  }
},

// Cancel edit
cancelEdit() {
  this.editingCommentId = null;
  this.editedContent = '';
},

// Delete comment
async deleteComment(commentId) {
  if (!confirm("Are you sure to delete this comment")) return;

  try {
    const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      this.comments = this.comments.filter(c => c._id !== commentId);
    }
  } catch (err) {
    console.error("Error to delete comment:", err);
    alert("Unable to delete comment");
  }
},

// Check if comment is authored by user
isMyComment(comment) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  return savedUser && comment.author._id === savedUser.id;
},

// Toggle reply input
toggleReply(commentId) {
  if (this.replyInputs[commentId] !== undefined) {
    delete this.replyInputs[commentId];
    delete this.replyingTo[commentId];
  } else {
    const comment = this.comments.find(c => c._id === commentId);
    this.replyInputs[commentId] = '';
    this.replyingTo[commentId] = comment.author;
  }
},

// Submit reply
async submitReply(commentId) {
  const replyContent = this.replyInputs[commentId];
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const replyTo = this.replyingTo[commentId];
  const replyToReply = this.replyingToReply[commentId];

  if (!replyContent?.trim()) return;

  try {
    const res = await fetch(`http://localhost:3000/comments/reply/${commentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: replyContent,
        authorId: savedUser.id,
        replyToUserId: replyTo?._id || null,
        replyToReplyId: replyToReply?._id || null 
      })
    });

    const data = await res.json();
    if (res.ok && data.reply) {
      const comment = this.comments.find(c => c._id === commentId);
      if (comment) {
        comment.replies.push(data.reply);
        this.showReplies[commentId] = true;
      }
      delete this.replyInputs[commentId];
      delete this.replyingTo[commentId];
      delete this.replyingToReply[commentId];
    }
  } catch (err) {
    console.error("Unable to reply:", err);
  }
}
,

// Toggle replies visibility
toggleRepliesVisibility(commentId) {
  this.showReplies[commentId] = !this.showReplies[commentId];
},

// Like reply
async toggleReplyLike(reply, commentId) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!savedUser) return alert("Please log in to like replies");

  try {
    const res = await fetch(`http://localhost:3000/comments/reply/${commentId}/${reply._id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: savedUser.id })
    });

    const data = await res.json();
    if (res.ok) {
      const comment = this.comments.find(c => c._id === commentId);
      if (comment) {
        const replyIndex = comment.replies.findIndex(r => r._id === reply._id);
        if (replyIndex !== -1) {
          comment.replies[replyIndex] = data.reply;
        }
      }
    }
  } catch (err) {
    console.error("Error to like reply:", err);
  }
},

// Check if reply is liked by user
isReplyLiked(reply) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  return reply?.likes?.includes(savedUser.id);
},

// Check if reply is authored by user
isMyReply(reply) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  return reply?.author?._id === savedUser?.id;
},

// Delete reply
async deleteReply(commentId, replyId) {
  if (!confirm("Do you want to delete this reply?")) return;

  try {
    const res = await fetch(`http://localhost:3000/comments/reply/${commentId}/${replyId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      // Remove reply from the reply list of the corresponding comment
      const comment = this.comments.find(c => c._id === commentId);
      if (comment) {
        comment.replies = comment.replies.filter(r => r._id !== replyId);
      }
    } else {
      const err = await res.json();
      alert(err.msg || "Fail to delete reply");
    }
  } catch (err) {
    console.error("Error to delete reply:", err);
    alert("Unable to delete reply");
  }
}
,
startReplyingTo(commentId, user,reply) {
  this.replyInputs[commentId] = '';
  this.replyingTo[commentId] = user; 
  this.replyingToReply[commentId] = reply;
  this.showReplies[commentId] = true;
},

startEditReply(reply) {
  this.editingReplyId = reply._id;
  this.editedReplyContent = reply.content;
},

cancelEditReply() {
  this.editingReplyId = null;
  this.editedReplyContent = '';
}
,
async saveReply(commentId, replyId) {
  try {
    const res = await fetch(`http://localhost:3000/comments/reply/${commentId}/${replyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: this.editedReplyContent })
    });

    const data = await res.json();
    if (res.ok) {
      const comment = this.comments.find(c => c._id === commentId);
      if (comment) {
        const idx = comment.replies.findIndex(r => r._id === replyId);
        if (idx !== -1) {
          comment.replies[idx] = data.reply;
        }
      }
      this.cancelEditReply();
    }
  } catch (err) {
    console.error("Error to update reply:", err);
  }
},

startReplyingToReply(commentId, reply) {
  this.replyInputsReply[reply._id] = '';
  this.replyingToReply[reply._id] = reply.author;
  this.showReplies[commentId] = true;
},

async submitReplyToReply(commentId, replyId) {
  const content = this.replyInputsReply[replyId];
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const replyTo = this.replyingToReply[replyId];

  if (!content?.trim()) return;

  try {
    const res = await fetch(`http://localhost:3000/comments/reply/${commentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        authorId: savedUser.id,
        replyToUserId: replyTo?._id || null
      })
    });

    const data = await res.json();
    if (res.ok && data.reply) {
      const comment = this.comments.find(c => c._id === commentId);
      if (comment) {
        comment.replies.push(data.reply);
      }
      delete this.replyInputsReply[replyId];
      delete this.replyingToReply[replyId];
    }
  } catch (err) {
    console.error("Lỗi khi reply trong reply:", err);
  }
},


    // ===== SHARE MODAL =====
    openShareModal(post) {
      this.shareModalVisible = true;
      this.sharedPost = post;
      this.shareAudience = "public";
      this.shareContent = "";
    },
    closeShareModal() {
      this.shareModalVisible = false;
    },
    async submitSharePost() {
  if (!this.shareContent.trim()) return;

  try {
    const res = await fetch(`http://localhost:3000/shares/${this.sharedPost._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.user.username, 
        content: this.shareContent,
        audience: this.shareAudience,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      this.$toast?.success("Post shared successfully!");
      this.shareModalVisible = false;
      this.shareContent = '';
      this.postToShare = null; 
      
      await this.fetchUserPosts(); 

    } else {
      this.$toast?.error(data.msg || "Failed to share post");
    }
  } catch (err) {
    console.error("Error sharing post:", err);
    this.$toast?.error("Server error while sharing");
  }
    },

    isMyShare(share) {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    return savedUser && share.username._id === savedUser.id;
    },

    async deleteShare(shareId) {
      if (confirm("Are you sure you want to delete this shared post?")) {
        await this.$axios.delete(`/shares/${shareId}`);
        this.fetchUserPosts();
      }
    },

    editShare(share) {
      this.editedShare = share;
      this.showEditShareModal = true;
    },

  canViewSharedPost(post) {
  if (!post || !post.author || !this.user) return false;

  const authorId = post.author._id || post.author.id;
  const viewerId = this.user._id || this.user.id;

  const isAuthor = authorId === viewerId;
  const isFriend = post.author.friends?.includes(viewerId);

  switch (post.audience) {
    case 'public':
      return true;
    case 'friends':
      return isAuthor || isFriend;
    case 'private':
      return isAuthor;
    default:
      return false;
  }
}
,
  getPostAccessMessage(post) {
    if (post.audience === 'private') {
      return 'This post is private';
    } else if (post.audience === 'friends') {
      return 'Only friends of this user can see';
    } else {
      return '';
    }
  },

    // ===== LIKE POST =====
    async toggleLike(post) {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser) return alert("Please login");

    try {
      const res = await fetch(`http://localhost:3000/posts/${post._id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: savedUser.username
        })
      });

      const data = await res.json();
      post.likes = data.likes;
    } catch (err) {
      console.error("Cannot like this post:", err);
      alert("Unable to like this post");
    }
  },
    isLiked(post) {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    return post.likes && post.likes.includes(savedUser.id);
  },

    // ===== EMOJI PICKER =====
    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
    },
    getCurrentCategoryEmojis() {
      return this.emojis[this.selectedEmojiCategory] || [];
    },
    insertEmoji(emoji) {
      const textarea = this.$refs.postTextarea;
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      this.newPostContent =
        this.newPostContent.substring(0, startPos) + emoji + this.newPostContent.substring(endPos);
      this.$nextTick(() => {
        textarea.focus();
        textarea.setSelectionRange(startPos + emoji.length, startPos + emoji.length);
      });
      this.adjustTextareaHeight();
    },
    toggleEditEmojiPicker() {
      this.showEditEmojiPicker = !this.showEditEmojiPicker;
    },
    getCurrentEditCategoryEmojis() {
      return this.emojis[this.selectedEditEmojiCategory] || [];
    },
    insertEditEmoji(emoji) {
      const textarea = this.$refs.editTextarea;
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      this.editContent =
        this.editContent.substring(0, startPos) + emoji + this.editContent.substring(endPos);
      this.$nextTick(() => {
        textarea.focus();
        textarea.setSelectionRange(startPos + emoji.length, startPos + emoji.length);
      });
      this.adjustTextareaHeightEdit();
    },

    isImageFile(file) {
      return file && file.type.startsWith('image/');
    },
    isVideoFile(file) {
      return file && file.type.startsWith('video/');
    },
    adjustTextareaHeight() {
      this.$nextTick(() => {
        const textarea = this.$refs.postTextarea;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
      });
    },
    
  },
  mounted() {
    this.fetchUserProfile();
    this.fetchUserPosts();
  }
};
</script>




<style scoped>
/* ===== General Profile Layout ===== */
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  background: #f0f2f5;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* ===== Cover Section ===== */
.cover-section {
  background: white;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 16px;
}

.cover-photo {
  position: relative;
  height: 360px;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-cover-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(255,255,255,0.9);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

/* ===== Profile Info ===== */
.profile-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 16px 24px;
  position: relative;
}

.profile-main-info {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.avatar-container {
  position: relative;
  margin-top: -50px;
}

.profile-avatar {
  width: 168px;
  height: 168px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: #e4e6ea;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  padding-bottom: 8px;
}

.user-name {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  color: #1c1e21;
}

.friends-count {
  color: #65676b;
  margin: 4px 0;
  font-size: 15px;
}

/* ===== Profile Actions ===== */
.profile-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #1877f2;
  color: white;
}

.btn-secondary,
.btn-icon {
  background: #e4e6ea;
  color: #1c1e21;
}

.btn-icon {
  padding: 8px;
  width: 36px;
  height: 36px;
  justify-content: center;
}

/* ===== Navigation Tabs ===== */
.profile-nav {
  background: white;
  border-top: 1px solid #dadde1;
  border-bottom: 1px solid #dadde1;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;

}

.nav-tabs {
  display: flex;
}

.nav-tab {
  background: none;
  border: none;
  padding: 16px 24px;
  font-weight: 600;
  color: #65676b;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.nav-tab.active {
  color: #1877f2;
  border-bottom-color: #1877f2;
}

.nav-tab:hover {
  background: #f2f2f2;
}

/* ===== Main Content Layout ===== */
.profile-content {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  padding: 16px 24px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 16px;
}

/* ===== Photos Section ===== */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  border-radius: 8px;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  cursor: pointer;
}

/* ===== Friends Section ===== */
.friends-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
}

.friend-item:hover {
  background: #f2f2f2;
}

.friend-item img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}






/* ===== Post Item ===== */
.post-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  padding: 12px 16px;
  margin-bottom: 16px;
}

/* Post Header */
.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-details strong {
  font-size: 14px;
  color: #050505;
}

.time {
  font-size: 12px;
  color: #65676b;
}

/* Post Content */
.post-content {
  font-size: 15px;
  margin: 8px 0;
  color: #050505;
  white-space: pre-line;
}

/* Post Media */
.post-image,.post-video {
  width: 100%;
  border-radius: 8px;
  margin-top: 8px;
  aspect-ratio: 1/1;
}

/* Post Stats */
.post-stats {
  display: flex;

  padding: 8px 0;
  font-size: 13px;
  color: #65676b;
  border-bottom: 1px solid #ddd;
}


/* Post Actions */
.post-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 4px;
}

.post-actions button {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 500;
  color: #65676b;
  border-radius: 4px;
}

.post-actions button:hover {
  color: #1877f2;
}

.action-icon {
  width: 18px;
  height: 18px;
}

/* shared post  */
.shared-post {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  margin-bottom: 1rem;
  padding: 10px;
  border-radius: 10px;
}

.shared-box {
  background: white;
  padding: 10px;
  border-left: 3px solid #ccc;
  margin-top: 10px;
  border-radius: 6px;
}


.restricted-post-warning {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background-color: #f2f2f2;
  border-radius: 10px;
  border: 1px solid #ddd;
  margin-top: 10px;
}

.restricted-post-warning .avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
}

.restricted-content {
  flex: 1;
}

.restricted-content .time {
  font-size: 12px;
  color: #888;
  margin: 2px 0 8px 0;
}

.notice-message {
  color: #555;
  font-style: italic;
  font-size: 14px;
  margin-top: 4px;
}

.shared-box .post-header {
  display: flex;
  align-items: center;
  gap: 8px; 
  margin-bottom: 12px;
  justify-content: flex-start; 
}

.shared-box .avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0; 
  margin-right: 0; 
}

.shared-box .author-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
  min-width: 0;
}

.shared-box .author-details strong {
  font-size: 14px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0;
  line-height: 1.2;
}

.shared-box .author-details .time {
  font-size: 12px;
  color: #65676b;
  margin: 0;
  line-height: 1.2;
}

.restricted-post-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 12px;
  border: 1px solid #fef2f2;
  margin-top: 16px;
  box-shadow: 0 2px 6px rgba(255, 193, 7, 0.1);
}

.restricted-post-warning .avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-right: 0; 
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.restricted-content {
  flex: 1;
  min-width: 0;
}

.restricted-content strong {
  font-size: 14px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0 0 4px 0;
  display: block;
}

.restricted-content .time {
  font-size: 12px;
  color: #6c757d;
  margin: 0 0 8px 0;
  font-weight: 500;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; 
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* Modal Content */
.modal-content {
  background: white;
  padding: 16px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.modal-content h2 {
  margin-top: 0;
}

.media-preview {
  margin-top: 10px;
  position: relative;
}

.media-preview img,
.media-preview video {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.media-preview button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 50%;
  cursor: pointer;
}

/* Post Modal Textfield */
.create-post {
  background: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.create-post input {
  width: 95%;
  padding: 12px;
  font-size: 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.post-options {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
}

.post-options button {
  background: #eee;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.post {
  background: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
   margin-top: 10px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.post-header img {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  margin-right: 10px;
}

.post-header .time {
  font-size: 12px;
  color: gray;
  margin-top: 2px;
}

.post-text {
  margin: 10px 0;
  font-size: 14px;
}

.post-image {
  width: 100%;
  border-radius: 10px;
  margin-top: 10px;
}

/* Create Post Modal Overlay */
.create-post-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.create-post-modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

/* Modal Header */
.create-post-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e6ea;
  position: relative;
}

.create-post-modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1c1e21;
  text-align: center;
  flex: 1;
}

.close-btn {
  position: absolute;
  right: 16px;
  background: #f0f2f5;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #8a8d91;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #e4e6ea;
}

/* Post Creator Info */
.post-creator-info {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  gap: 12px;
}

.creator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.creator-details {
  flex: 1;
}

.creator-details strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 4px;
}

.privacy-selector select {
  background: #f0f2f5;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
  color: #65676b;
  cursor: pointer;
}

/* Post Content Area */
.post-content-area {
  padding: 0 24px;
  position: relative;
}

.post-textarea {
  width: 100%;
  min-height: 120px;
  border: none;
  outline: none;
  resize: none;
  font-size: 24px;
  font-family: inherit;
  line-height: 1.2;
  color: #1c1e21;
  background: transparent;
  padding: 0;
  margin-bottom: 16px;
}

.post-textarea::placeholder {
  color: #8a8d91;
  font-weight: 400;
}

/* Emoji Toolbar */
.emoji-toolbar {
  position: relative;
  margin-bottom: 16px;
}

.emoji-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.emoji-btn:hover {
  background: #f0f2f5;
}

/* Emoji Picker */
.emoji-picker {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e4e6ea;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 320px;
  max-height: 300px;
  overflow: hidden;
  z-index: 1001;
  animation: slideDown 0.2s ease-out;
}

.emoji-categories {
  display: flex;
  padding: 8px;
  border-bottom: 1px solid #e4e6ea;
  background: #f8f9fa;
}

.emoji-category-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
}

.emoji-category-btn:hover,
.emoji-category-btn.active {
  background: #e4e6ea;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-item {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-item:hover {
  background: #f0f2f5;
}

/* Media Preview */
.media-preview {
  padding: 0 24px 16px;
}

.media-preview-container {
  position: relative;
  border: 1px solid #e4e6ea;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
}

.preview-image,
.preview-video {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  display: block;
}

.remove-media-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
}

.remove-media-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* Add to Post Options */
.add-to-post {
  padding: 16px 24px;
  border: 1px solid #e4e6ea;
  border-radius: 12px;
  margin: 0 24px 16px;
}

.add-to-post-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 12px;
}

.add-options {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0 24px;
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
}

.add-option {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
  background: #f0f2f5;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  white-space: nowrap;
}

.add-option:hover {
  background: #e4e6ea;
}

.option-icon img {
  width: 20px;
  height: 20px;
}


/* Post Actions Footer */
.post-actions-footer {
  padding: 16px 24px;
  border-top: 1px solid #e4e6ea;
}

.post-submit-btn {
  width: 100%;
  padding: 12px;
  background: #1877f2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.post-submit-btn:hover:not(.disabled) {
  background: #166fe5;
}

.post-submit-btn.disabled {
  background: #e4e6ea;
  color: #bcc0c4;
  cursor: not-allowed;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* post menu dropdown  */
.menu-post-icon {
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.post-menu-wrapper {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 40px;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  z-index: 1000;
  min-width: 240px;
}

.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 15px;
}

.dropdown-menu button:hover {
  background-color: #f0f2f5;
}

.post-author-info {
  display: flex;
  align-items: center;
}

.post-author-info img {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  margin-right: 10px;
  object-fit: cover;
}

.author-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.author-details strong {
  font-size: 15px;
  font-weight: bold;
}

.author-details .time {
  font-size: 12px;
  color: gray;
  margin-top: 2px;
}

/* Comment Modal Styles - Fixed Layout */
.comment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
  box-sizing: border-box;
}

.comment-modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  height: 85vh;
  max-height: 800px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow-y: auto; 
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE, Edge */
}

.comment-modal-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Modal Header - Fixed at top */
.comment-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e6eb;
  background: white;
  flex-shrink: 0; 
  position: sticky;
  top: 0;
  z-index: 10;
}

.comment-modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1c1e21;
}

.close-btn {
  background: #f0f2f5;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 20px;
  color: #606770;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e4e6ea;
  color: #1c1e21;
}

.comments-section {
  flex: 1;
  padding: 10px;
  background-color: #f9f9f9;
}

/* Post Detail Section - Scrollable */
.post-detail {
  padding: 20px 24px;
  border-bottom: 1px solid #e4e6eb;
  flex-shrink: 0; 
  overflow-y: auto; 
  max-height: 300px;
}

.post-author-info {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.author-details strong {
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
}

.author-details .time {
  font-size: 13px;
  color: #65676b;
  margin-top: 2px;
}

.post-content {
  font-size: 15px;
  line-height: 1.4;
  color: #1c1e21;
  margin: 12px 0;
  word-wrap: break-word;
}

/* Media in Modal - Fixed sizing */
.post-media-modal {
  margin: 16px 0;
  text-align: center;
}

.post-image-modal,
.post-video-modal {
  width: 100%;
  max-width: 100%;
  max-height: 200px; 
  object-fit: contain; 
  border-radius: 8px;
  display: block;
}

/* Post Stats */
.post-stats {
  display: flex;
  gap: 16px;
  margin: 16px 0 12px 0;
  font-size: 14px;
  color: #65676b;
}

/* Action Buttons in Modal */
.post-actions-modal {
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  border-top: 1px solid #e4e6eb;
  margin-top: 12px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #65676b;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
}

.action-btn:hover {
  background: #f0f2f5;
  color: #1877f2;
}

.action-icon {
  width: 20px;
  height: 20px;
}



/* No Comments State */
.no-comments {
  text-align: center;
  padding: 40px 20px;
  color: #65676b;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 150px;
}

.no-comments-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-comments p {
  margin: 8px 0;
  font-size: 17px;
  font-weight: 600;
}

.sub-text {
  font-size: 14px;
  font-weight: normal !important;
  opacity: 0.8;
}

/* Comment Items */
.comment-item {
  display: flex;
  margin-bottom: 16px;
  padding: 8px 4px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0; 
}

.comment-bubble {
  background: #f0f2f5;
  border-radius: 16px;
  padding: 8px 12px;
  display: inline-block;
  max-width: 100%;
  word-wrap: break-word;
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #1c1e21;
  display: block;
  margin-bottom: 2px;
}

.comment-text {
  font-size: 14px;
  color: #1c1e21;
  margin: 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  margin-left: 12px;
}

.comment-time {
  font-size: 12px;
  color: #65676b;
}

.comment-action-btn {
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #65676b;
  cursor: pointer;
  padding: 0;
}

.comment-action-btn:hover {
  text-decoration: underline;
  color: #1877f2;
}

/* Add Comment Section - Fixed at bottom */
.add-comment-section {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #e4e6eb;
  background: white;
  gap: 8px;
  flex-shrink: 0; 
  position: sticky;
  bottom: 0;
  z-index: 20;
  margin-bottom: 8px;

  
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  background: #f0f2f5;
  border-radius: 20px;
  padding: 8px 12px;
}

.comment-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  padding: 0;
  color: #1c1e21;
}

.comment-input::placeholder {
  color: #65676b;
}

.send-comment-btn {
  background: none;
  border: none;
  color: #1877f2;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  margin-left: 8px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-comment-btn:hover:not(:disabled) {
  transform: scale(1.1);
  color: #166fe5;
}

.send-comment-btn:disabled {
  color: #bcc0c4;
  cursor: not-allowed;
}

.comments-list,
.post-detail {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE, Edge */
}

.comments-list::-webkit-scrollbar,
.post-detail::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}


/* Responsive Design */
@media (max-width: 768px) {
  .comment-modal-overlay {
    padding: 10px;
  }
  
  .comment-modal-content {
    height: 90vh; 
    max-height: none;
  }
  
  .post-detail {
    max-height: 250px; 
  }
  
  .comments-list {
    padding: 0 16px;
  }
  
  .add-comment-section {
    padding: 12px 16px;
  }
}
/* ===== Share Modal ===== */
.share-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.share-modal-content {
  background: #fff;
  border-radius: 10px;
  width: 500px;
  max-width: 95%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.share-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
}

.share-modal-header h3 {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #555;
}

.post-creator-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
}

.creator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.privacy-selector select {
  border: 1px solid #ddd;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 14px;
}

.post-textarea {
  width: 100%;
  border: none;
  resize: none;
  outline: none;
  font-size: 15px;
  padding: 8px 16px;
}

.shared-post-preview {
  background: #f0f2f5;
  border-radius: 10px;
  padding: 12px;
  margin: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shared-post-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.creator-avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.shared-post-content {
  font-size: 15px;
  color: #050505;
  line-height: 1.4;
}

.shared-post-media {
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
}

.shared-post-media img.preview-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
}

.shared-post-media video.preview-video {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.shared-post-media img.preview-image,
.shared-post-media video.preview-video {
  margin-top: 6px;
  width: 100%;
  border-radius: 6px;
  object-fit: cover;
  max-height: 300px;
}

.post-actions-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #ddd;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  border: none;
}

.btn-primary {
  background: #1877f2;
  color: white;
}

.btn-secondary {
  background: #e4e6eb;
  color: #050505;
}

/* Edit post modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  max-width: 500px;
  width: 100%;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  position: relative;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  flex: 1;
}

.creator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.media-preview-container {
  position: relative;
  margin-top: 12px;
}

.preview-image, .preview-video {
  max-width: 100%;
  border-radius: 8px;
}

.remove-media-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(170, 167, 167, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.btn-primary {
  background: #1877f2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-secondary {
  background: #e4e6eb;
  color: #050505;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

textarea.post-textarea {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  resize: none;
  background: #f0f2f5;
  font-size: 15px;
  min-height: 80px;
}

.post-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px 16px;
  margin-top: 12px;
  font-size: 15px;
  border-radius: 10px;
  background: #f0f2f5;
  border: none;
  resize: none;
  box-sizing: border-box;
}

/* Comment actions styling */
.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
}

.comment-action-btn {
  background: none;
  border: none;
  color: #65676b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.comment-action-btn:hover {
  background-color: #f0f2f5;
}

.action-icon-small {
  width: 14px;
  height: 14px;
}

/* Edit comment styling */
.edit-textarea, .edit-reply-input {
  width: 90%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
}

.edit-reply-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 4px;
}





.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.save-btn, .cancel-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.save-btn {
  background-color: #1877f2;
  color: white;
}

.cancel-btn {
  background-color: #e4e6ea;
  color: #1c1e21;
}

/* Reply section styling */
.reply-section {
  margin-top: 8px;
  padding-left: 20px;
}

.reply-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.reply-to-reply-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.reply-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}

.send-reply-btn {
  background-color: #1877f2;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-reply-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Replies section styling */
.replies-section {
  margin-top: 12px;
  padding-left: 20px;
}

.toggle-replies-btn {
  background: none;
  border: none;
  color: #1877f2;
  cursor: pointer;
  font-size: 12px;
  margin-bottom: 8px;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.reply-content {
  flex: 1;
}

.reply-bubble {
  background-color: #f0f2f5;
  padding: 8px 12px;
  border-radius: 16px;
  display: inline-block;
  max-width: 100%;
}

.reply-bubble strong {
  font-size: 13px;
  color: #050505;
  margin-bottom: 2px;
  display: block;
}

.reply-bubble p {
  margin: 0;
  font-size: 13px;
  color: #050505;
}

.reply-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
}

.reply-time {
  color: #65676b;
  font-size: 11px;
}

/* reply to name */
.reply-to-name {
  color: #1876f2;
  font-weight: 500;
  margin-right: 4px;
}

/* author label */
.author-label {
  background-color: #1876f2;
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  margin-left: 6px;
  border-radius: 4px;
  
}


</style>



