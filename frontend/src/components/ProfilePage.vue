<template>
  <div class="profile-wrapper" v-if="user && (user._id || user.id)">
    
    <div class="profile-header">
      <input type="file" ref="coverInput" accept="image/*" style="display: none" @change="handleCoverChange" />
      <input type="file" ref="avatarInput" accept="image/*" style="display: none" @change="handleAvatarChange" />

      <div class="cover-container" @click.stop="toggleCoverMenu">
        <img :src="resolveCoverUrl(user.coverPhoto)" class="cover-image clickable"/>
        <div class="cover-overlay"></div>
        
        <div
          v-if="showCoverMenu"
          class="image-options-menu cover-menu"
          v-click-outside="closeMenus"
          @click.stop
        >
          <!-- VIEW: ai cũng thấy -->
          <div class="menu-item" @click="openImageViewer(resolveCoverUrl(user.coverPhoto))">
            <img src="../assets/view-image.png" class="menu-icon" /> View Cover
          </div>

          <!-- UPDATE: chỉ chủ profile -->
          <div
            v-if="isMyProfile"
            class="menu-item"
            @click.stop="triggerCoverUpload"
          >
            <img src="../assets/update.png" class="menu-icon" /> Update Cover
          </div>

          <!-- DELETE: chỉ chủ profile & không phải cover mặc định -->
          <div
            v-if="isMyProfile && !isDefaultCover"
            class="menu-item delete"
            @click.stop="deleteCoverPhoto"
          >
            <img src="../assets/delete.png" class="menu-icon" /> Remove
          </div>
        </div>

      </div>

      <div class="user-identity-card">
        <div class="avatar-wrapper">
          <img :src="getAvatarUrl(user)" class="profile-avatar clickable" @click.stop="toggleAvatarMenu"/>
          <div
  v-if="showAvatarMenu"
  class="image-options-menu avatar-menu"
  v-click-outside="closeMenus"
>
  <!-- VIEW: ai cũng thấy -->
  <div class="menu-item" @click="openImageViewer(getAvatarUrl(user))">
    <img src="../assets/view-image.png" class="menu-icon" /> View Avatar
  </div>

  <!-- UPDATE: chỉ chủ profile -->
  <div
    v-if="isMyProfile"
    class="menu-item"
    @click.stop="triggerAvatarUpload"
  >
    <img src="../assets/update.png" class="menu-icon" /> Update Avatar
  </div>

  <!-- DELETE: chỉ chủ profile & không phải avatar mặc định -->
  <div
    v-if="isMyProfile && !isDefaultAvatar"
    class="menu-item delete"
    @click.stop="deleteAvatar"
  >
    <img src="../assets/delete.png" class="menu-icon" /> Remove
  </div>
</div>

        </div>
        
        <div class="identity-content">
          <h1 class="user-name">{{ user.firstname }} {{ user.lastname }}</h1>
          <p class="user-bio-short" v-if="user.bio">{{ user.bio }}</p>
          
          <div class="stats-row">
            <div class="stat-item"><span class="stat-val">{{ postStats.totalPosts }}</span><span class="stat-label">Posts</span></div>
            <div class="stat-divider"></div>
            <div class="stat-item"><span class="stat-val">{{ user.friends?.length || 0 }}</span><span class="stat-label">Friends</span></div>
            <div class="stat-divider"></div>
            <div class="stat-item"><span class="stat-val">{{ postStats.totalPhotos }}</span><span class="stat-label">Photos</span></div>
          </div>

          <div class="action-buttons">
            <!-- Chủ profile -->
            <button v-if="isMyProfile" class="btn-primary-gradient" @click="openEditProfileModal">
              ✏️ Edit Profile
            </button>

            <!-- Other users viewing -->
            <template v-if="!isMyProfile && friendStatus !== 'self'">
              <!-- Message — hidden when blocked -->
              <button v-if="!blockStatus" class="btn-action btn-chat" @click="goToChat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Message
              </button>
              <!-- Add/Unfriend — hidden when blocked -->
              <button v-if="!blockStatus"
                class="btn-primary-gradient"
                :class="friendStatus"
                @click="handleFriendAction"
                :disabled="loadingFriend"
              >{{ friendButtonText }}</button>
              <!-- Block — only shown when not blocking anyone -->
              <button v-if="!blockStatus" class="btn-action btn-block" @click="handleBlock" :disabled="loadingBlock">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                Block
              </button>
            </template>
          </div>

        </div>
      </div>
    </div>

    <!-- Block wall: hide all content when blocked -->
    <div v-if="!isMyProfile && blockStatus" class="block-wall">
      <div class="block-wall-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
      </div>
      <h3 v-if="blockStatus === 'you_blocked'">You've blocked this user</h3>
      <h3 v-else>Content not available</h3>
      <p v-if="blockStatus === 'you_blocked'">
        Unblock <strong>{{ user?.firstname }} {{ user?.lastname }}</strong> to view their profile and interact with them.
      </p>
      <p v-else>
        You can't view this user's content.
      </p>
      <button v-if="blockStatus === 'you_blocked'" class="btn-action btn-unblock" @click="handleUnblock" :disabled="loadingBlock">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
        Unblock
      </button>
    </div>

    <template v-if="isMyProfile || !blockStatus">
    <div class="nav-wrapper">
      <div class="glass-nav">
        <button v-for="tab in tabs" :key="tab.id" :class="['nav-pill', { active: activeTab === tab.id }]" @click="activeTab = tab.id">{{ tab.label }}</button>
      </div>
    </div>

    <div class="main-layout">
      
      <template v-if="activeTab === 'posts'">
        <div class="layout-feed">
          <div v-if="isMyProfile" class="create-post">
            <h3>Create your post</h3>
            <input type="text" @click="openCreatePostModal" :placeholder="`What's on your mind, ${user?.firstname} ${user?.lastname}?`"/>
          </div>

          <div class="content-body">
            <LoadingOverlay v-if="loadingPosts" />
          <div v-if="userPosts.length" class="post-list">
            <div v-for="post in userPosts" :key="post._id" class="post-item card">

              <div v-if="post.type === 'post' || post.type === 'original'">
                <div class="post-header">
                  <div class="post-author-info">
                    <img :src="getAvatarUrl(post.author)" class="avatar-small" />
                    <div class="author-details">
                      <strong>{{ post.author.firstname }} {{ post.author.lastname }}</strong>
                      <p class="time">
                        {{ formatTime(post.createdAt) }}
                        <span v-if="post.audience === 'public'">🌍</span>
                        <span v-else-if="post.audience === 'friends'">👥</span>
                        <span v-else>🔒</span>
                      </p>
                    </div>
                  </div>
                  <div class="post-menu-wrapper" v-click-outside="closeAllMenus">
                    <img src="../assets/menu.png" class="menu-post-icon" @click.stop="toggleMenu(post._id)" />
                    <div v-if="openMenuId === post._id" class="dropdown-menu">
                      <button v-if="isMyPost(post)" @click="editPost(post)"><img src="../assets/edit.png" class="menu-icon-left"/> Edit Post</button>
                      <button v-if="!isMyPost(post)" @click="hideThisPost(post._id)"><img src="../assets/hide.png" class="menu-icon-left"/> Hide Post</button>
                      <button v-if="isMyPost(post)" @click="deletePost(post._id)" style="color: red"><img src="../assets/delete.png" class="menu-icon-left"/> Delete Post</button>
                    </div>
                  </div>
                </div> 

                <div class="post-content-wrapper">
                  <h3 class="recipe-title">{{ post.title }}</h3>
                  <span class="recipe-category">{{ post.category }}</span>
                  <div class="recipe-body">
                    <div v-if="!expandedPosts[post._id]">
                       <p class="recipe-section-header">Ingredients:</p>
                       <p class="post-text">{{ getTruncatedText(post.ingredients) }}</p>
                    </div>
                    <div v-else>
                       <p class="recipe-section-header">Ingredients:</p>
                       <p class="post-text">{{ post.ingredients }}</p>
                       <p class="recipe-section-header">Instructions:</p>
                       <p class="post-text">{{ post.instructions }}</p>
                    </div>
                  </div>
                  <button v-if="shouldShowReadMore(post)" @click="togglePostContent(post._id)" class="read-more-btn">
                    {{ expandedPosts[post._id] ? 'Show Less' : 'Show More' }}
                  </button>
                </div>

                <div v-if="post.media" class="post-media">
                  <img v-if="post.mediaType === 'image'" :src="resolveMediaUrl(post.media)" class="post-image" />
                  <video v-else controls class="post-video"><source :src="resolveMediaUrl(post.media)" /></video>
                </div>

                            <!-- 🔗 LINKED ITEMS -->
            <div
              v-if="post.linkedItems && post.linkedItems.length"
              class="linked-items-in-post"
            >
              <div class="linked-items-title">
                🛒 Ingredients & Tools
                <span>({{ post.linkedItems.length }})</span>
              </div>

              <div class="linked-item-card carousel">
                <!-- ITEM -->
                <template v-if="currentItem(post)">
                  <img
                    v-if="currentItem(post).images?.length"
                    :src="getItemImage(currentItem(post).images)"
                    class="linked-item-thumb"
                  />

                  <div class="linked-item-info">
                    <div class="linked-item-title" :title="currentItem(post).title">
                      {{ currentItem(post).title }}
                    </div>

                    <div class="linked-item-meta">
                      {{ currentItem(post).type }}

                      <span
                        v-if="currentItem(post).type === 'tool' && currentItem(post).condition"
                      >
                        · {{ currentItem(post).condition }}
                      </span>
                      
                      <span
                        v-if="currentItem(post).seller?._id === (user._id || user.id)"
                        class="own-item-badge"
                      >
                        YOUR ITEM
                      </span>

                      <button
                      class="view-item-btn"
                      @click="openItem(currentItem(post)._id)"
                    >
                      View item
                    </button>
                    </div>

                  </div>
                </template>

                <!-- ARROWS GROUP -->
                <div
                  v-if="post.linkedItems.length > 1"
                  class="carousel-arrows"
                >
                  <button
                    class="carousel-arrow"
                    :disabled="getItemIndex(post._id) === 0"
                    @click="prevItem(post._id)"
                  >
                    ‹
                  </button>

                  <button
                    class="carousel-arrow"
                    :disabled="getItemIndex(post._id) === post.linkedItems.length - 1"
                    @click="nextItem(post._id)"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div class="carousel-indicator">
                {{ getItemIndex(post._id) + 1 }} / {{ post.linkedItems.length }}
              </div>
            </div>

                <div v-if="post.totalRatings > 0" class="rating-statistics">
                  <div class="rating-summary">
                    <div class="average-rating">
                      <span class="rating-number">{{ post.averageRating }}</span>
                      <div class="stars-display"><span v-for="star in 5" :key="star" class="star-icon" :class="{ filled: star <= Math.round(post.averageRating) }">★</span></div>
                    </div>
                    <div class="rating-count"><span>{{ post.totalRatings }} {{ post.totalRatings > 1 ? 'ratings' : 'rating' }}</span></div>
                  </div>
                </div>

                <div class="post-stats">
                  <span v-if="post.likes?.length > 0">{{ post.likes.length }} liked</span>
                  <span v-if="(post.commentCount || 0) + (post.replyCommentCount || 0) > 0">{{ (post.commentCount || 0) + (post.replyCommentCount || 0) }} commented</span>
                  <span v-if="post.sharesCount > 0">{{ post.sharesCount }} shared</span>
                  <span v-if="getPostSaveCount(post) > 0">{{ getPostSaveCount(post) }} saved</span>
                </div>

                <div class="post-actions">
                  <button @click="toggleLike(post)" :class="{ active: isLiked(post) }"><img :src="isLiked(post) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" /> <span>Like</span></button>
                  <button @click="openCommentModal(post)"><img src="../assets/comment.png" class="action-icon" /> <span>Comment</span></button>
                  <button @click="openShareModal(post)"><img src="../assets/share.png" class="action-icon" /> <span>Share</span></button>
                  <button @click="toggleSavePost(post)" :class="{ active: isSaved(post) }"><img :src="isSaved(post) ? require('../assets/saved.png') : require('../assets/save.png')" class="action-icon" /> <span>{{ isSaved(post) ? 'Saved' : 'Save' }}</span></button>
                </div>
              </div>

              <div v-else-if="post.type === 'share'" class="post shared-post">

          <div class="post-header">
            <div class="post-author-info">
              <img :src="getAvatarUrl(post.username)" alt="avatar" />
              <div class="author-details">
                <strong>{{ post.username?.firstname }} {{ post.username?.lastname }}</strong>
                
                <p class="time">
                  {{ formatTime(post.createdAt) }} • Shared a post
                  
                  <span v-if="post.audience === 'public'" title="Public" style="margin-left: 4px;">🌍</span>
                  <span v-else-if="post.audience === 'friends'" title="Friends" style="margin-left: 4px;">👥</span>
                  <span v-else-if="post.audience === 'private'" title="Private" style="margin-left: 4px;">🔒</span>
                </p>
                </div>
            </div>

            <div class="post-menu-wrapper" v-click-outside="closeAllMenus">
              <img src="../assets/menu.png" class="menu-post-icon" @click.stop="toggleMenu(post._id)" />
              <div v-if="openMenuId === post._id" class="dropdown-menu" @click.stop>
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

          <div v-if="post.content" class="post-content-wrapper">
            <p class="post-text" :class="{ 'content-collapsed': shouldShowReadMore(post) && !expandedPosts[post._id] }">
              <i>{{ getDisplayedContent(post, post._id) }}</i>
            </p>
            <button 
              v-if="shouldShowReadMore(post)" 
              @click="togglePostContent(post._id)" 
              class="read-more-btn"
            >
              {{ expandedPosts[post._id] ? 'Show Less' : 'Show More' }}
            </button>
          </div>

          <div class="shared-content-box">
                <template v-if="post.originalPostMeta && post.originalPostMeta.author && post.post">

                   <template v-if="post.canViewPost === false">
                      <div class="origin-post-author-info">
                        <img :src="getAvatarUrl(post.originalPostMeta.author)" alt="avatar" />
                        <div class="origin-author-details">
                          <strong>{{ post.originalPostMeta.author.firstname }} {{ post.originalPostMeta.author.lastname }}</strong>
                          
                          <p class="origin-post-time">
                            {{ formatTime(post.originalPostMeta.createdAt) }}
                            
                            <span v-if="post.originalPostMeta.audience === 'friends'">👥</span>
                              <span v-else-if="post.originalPostMeta.audience === 'private'">🔒</span>
                          </p>
                          </div>
                      </div>
                        <p class="notice-message">{{ getPostAccessMessage(post.originalPostMeta) }}</p>
                   </template>

                   <template v-else>
                      <div class="share-post-header small origin-post">
                          <div class="post-author-info">
                            <img :src="getAvatarUrl(post.originalPostMeta.author)" class="avatar-small" />
                            <div class="author-details">
                                <strong>{{ post.originalPostMeta.author.firstname }} {{ post.originalPostMeta.author.lastname }}</strong>
                                <p class="time">
                                  {{ formatTime(post.originalPostMeta.createdAt) }}
                                  <span v-if="post.originalPostMeta.audience === 'public'" title="Public">🌍</span>
                                  <span v-else-if="post.originalPostMeta.audience === 'friends'" title="Friends">👥</span>
                                  <span v-else-if="post.originalPostMeta.audience === 'private'" title="Private">🔒</span>
                                </p>
                            </div>
                          </div>
                      </div>

                      <div class="share-post-content-wrapper" v-if="post.post">
                          <h3 class="recipe-title small">{{ post.post.title }}</h3>
                          <span class="recipe-category small">{{ post.post.category }}</span>

                          <div class="recipe-body">
                             <div v-if="!expandedPosts[post._id + '_shared']">
                                <p class="recipe-section-header">Ingredients:</p>
                                <p class="post-text">{{ getTruncatedText(post.post.ingredients) }}</p>
                             </div>
                             <div v-else>
                                <p class="recipe-section-header">Ingredients:</p>
                                <p class="post-text">{{ post.post.ingredients }}</p>
                                <p class="recipe-section-header">Instructions:</p>
                                <p class="post-text">{{ post.post.instructions }}</p>
                             </div>
                          </div>

                          <button 
                            v-if="post.post && shouldShowReadMore(post.post)" 
                            @click="togglePostContent(post._id + '_shared')" 
                            class="read-more-btn"
                          >
                            {{ expandedPosts[post._id + '_shared'] ? 'Show Less' : 'Show More' }}
                          </button>
                          <div v-if="post.post && post.post.media" class="post-media">
                          <img v-if="post.post.mediaType === 'image'" :src="resolveMediaUrl(post.post.media)" class="post-image" />
                          <video v-else controls class="post-video"><source :src="resolveMediaUrl(post.post.media)" /></video>
                      </div>

                      </div>

                      <div class="post-actions">
                          <button @click="openCommentModal(post.post)">
                              <img src="../assets/arrow.png" class="action-icon"/> Open Origin Post
                          </button>
                      </div>
                   </template>
                </template>
                
                <div v-else class="restricted-post-warning">
                   <div class="restricted-content">
                      <p class="notice-message" style="margin: 0; font-style: italic; color: #dc3545;">
                        This content is currently unavailable.
                      </p>
                   </div>
                </div>
             
             </div>
        </div>

            </div>
          </div>
          
          <div v-if="!loadingPosts && !userPosts.length" class="empty-feed">
             <p>No posts available.</p>
          </div>
          
          <Pagination
          v-if="!loadingPosts "
          :currentPage="pagePosts"
          :totalPages="totalPostsPages"
          @update:page="onPostPageChange"
        />
        </div>
        
      </div>

      </template>

      <template v-else-if="activeTab === 'about'">
        <div class="about-container-modern">
          <div class="about-card">
            <h2>About Me</h2>
            <div class="bio-large">{{ user.bio || "No bio yet." }}</div>
            <div class="details-grid">
              <div class="detail-box"><span class="label">Email</span><span class="value">{{ user.email }}</span></div>
              <div class="detail-box"><span class="label">Username</span><span class="value">@{{ user.username }}</span></div>
              <div class="detail-box"><span class="label">Gender</span><span class="value">{{ formatGender(user.gender) }}</span></div>
              <div class="detail-box"><span class="label">Birthday</span><span class="value">{{ formatBirthday(user.birthday) }}</span></div>
              <div class="detail-box"><span class="label">Joined date</span><span class="value">{{ joinDateFormatted }}</span></div>
              <div class="detail-box"><span class="label">Location</span><span class="value">{{ user.location }}</span></div>
            </div>
          </div>
        </div> 
      </template> 

      <template v-else-if="activeTab === 'photos'">
        <div class="photos-container-modern">

          <!-- HEADER -->
          <div class="photos-header-card">
            <h2>Media</h2>
            <span class="photo-count">{{ mediaCount }}
          {{ mediaTab === 'videos'
              ? 'Videos'
              : mediaTab === 'photos'
                ? 'Photos'
                : 'Media'
          }}</span>
          </div>

          <!-- MEDIA TAB -->
           <div class="media-nav-wrapper">
          <div class="glass-nav" style="margin-bottom:16px">
            <button
              class="nav-pill"
              :class="{ active: mediaTab === 'all' }"
              @click="mediaTab = 'all'"
            >
              All
            </button>

            <button
              class="nav-pill"
              :class="{ active: mediaTab === 'photos' }"
              @click="mediaTab = 'photos'"
            >
              Photos
            </button>

            <button
              class="nav-pill"
              :class="{ active: mediaTab === 'videos' }"
              @click="mediaTab = 'videos'"
            >
              Videos
            </button>
          </div>
        </div>

        <div class="content-body">
        <LoadingOverlay v-if="loadingMedia"/>
          <!-- GRID -->
          <div v-if="displayedMedia.length" class="photos-grid-large">
            <div
              v-for="item in displayedMedia"
              :key="item._id"
              class="photo-card"
              @click="item.mediaType === 'image' && openMediaPost(item)" 
            >
              <img
                v-if="item.mediaType === 'image'"
                :src="resolveMediaUrl(item.media)"
                class="photo-large"
              />

              <video
                v-else
                controls
                class="photo-large"
                @click="item.mediaType === 'video' && openMediaPost(item)"
              >
                <source :src="resolveMediaUrl(item.media)" />
              </video>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>No media to show.</p>
          </div>
          </div>
        <Pagination
          v-if="!loadingMedia"
          :currentPage="pageMedia" 
          :totalPages="totalMediaPages"
          @update:page="onMediaPageChange"
        />
        </div>

      </template>

      <template v-else-if="activeTab === 'friends'">
        <div class="friends-tab-wrapper">
          <div class="friends-header-card">
            <h2>Friends</h2>
            <span class="friend-count">{{ friendsList.length }} Friends</span>
          </div>
          <div class="content-body">
            <LoadingOverlay v-if="loadingFriends"/>
          <div v-if="friendsList.length === 0" class="empty-state"><p>No friends yet.</p></div>
          <div v-else class="modern-grid">
            <div v-for="friend in friendsList" :key="friend._id" class="modern-card">
              <div class="card-image-wrapper"><img :src="getAvatarUrl(friend)" class="card-img" /></div>
              <div class="card-body">
                <h4>{{ friend.firstname }} {{ friend.lastname }}</h4>
                <p class="username">@{{ friend.username }}</p>
                <!-- Nếu là chính mình → View Profile, ngược lại → Message -->
                <button
                  v-if="isCurrentViewer(friend._id)"
                  class="btn-secondary full-width"
                  @click="goToOwnProfile()"
                >
                  View Profile
                </button>
                <button
                  v-else
                  class="btn-secondary full-width"
                  @click="goToMessageWith(friend._id)"
                >
                  Message
                </button>
              </div>
            </div>
          </div>
          </div>
          <Pagination
          v-if="!loadingFriends"
          :currentPage="pageFriends"
          :totalPages="totalFriendsPages"
          @update:page="onFriendPageChange"
        />
        </div>

      </template> 
    </div>

    </template><!-- end v-if="isMyProfile || !blockStatus" -->

    <CreatePostModal :is-visible="createPostModalVisible" :user="user" @close="closeCreatePostModal" @posted="handlePostCreated" />
    <ConfirmDialog v-if="confirmVisible" :message="confirmMessage" @confirm="handleConfirmedDelete" @cancel="confirmVisible = false" />
    <EditPostModal :is-visible="editModalVisible" :post="editPostData" :user="user" @close="closeEditModal" @updated="handlePostUpdated" />
    <CommentModal :is-visible="commentModalVisible" :post="selectedPost" :user="user" @close="closeCommentModal" @liked="handlePostLiked" @share="openShareModal" @comment-count-updated="handleCommentCountUpdated" @rating-updated="handleRatingUpdated" />
    <ShareModal v-if="shareModalVisible" :post="sharedPost" :user="user" @close="closeShareModal" @shared="handlePostShared" />
    <EditShareModal v-if="showEditShareModal" :share="editedShare" @close="showEditShareModal = false" @updated="fetchUserPosts" />
    <EditProfileModal :is-visible="editProfileModalVisible" :user="user" @close="closeEditProfileModal" @save="handleProfileSave" />
    <ImagePreviewModal :is-visible="imagePreviewVisible" :image-url="previewImageUrl" @close="closeImagePreview" />
    <NotificationModal :is-visible="notification.visible" :type="notification.type" :title="notification.title" :message="notification.message" @confirm="closeNotify" />
    <ConfirmDialog v-if="confirmFriendVisible" :message="confirmFriendMessage" @confirm="confirmFriendAction" @cancel="confirmFriendVisible = false"
/>

  </div>
</template>

<script>
import ConfirmDialog from './ConfirmDialog.vue';
import EditShareModal from './EditShareModal.vue';
import CommentModal from './CommentModal.vue';
import ShareModal from './ShareModal.vue';
import EditPostModal from './EditPostModal.vue';
import CreatePostModal from './CreatePostModal.vue';
import EditProfileModal from './EditProfileModal.vue';
import ImagePreviewModal from './ImagePreviewModal.vue';
import NotificationModal from './NotificationModal.vue';
import LoadingOverlay from './LoadingOverlay.vue';
import Pagination from './Pagination.vue'

// 1. ĐỊNH NGHĨA DIRECTIVE CLICK OUTSIDE (MỚI)
const clickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event, el);
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent);
  },
};

export default {
  name: "ProfilePage",
  // Đăng ký directive
  directives: {
    clickOutside: clickOutside
  },
  components: {
    ConfirmDialog,
    EditShareModal,
    CommentModal,
    ShareModal,
    EditPostModal,
    CreatePostModal,
    EditProfileModal,
    ImagePreviewModal,
    NotificationModal,
    LoadingOverlay,
    Pagination

  },
  data() {
    return {
      user: {},
      userPosts: [],
      friendsList: [],
      openMenuId: null,
      confirmVisible: false,
      confirmMessage: '',
      postToDeleteId: null,
      deleteType: null,

      // Edit post
      editModalVisible: false,
      editPostData: null,

      createPostModalVisible: false,
      activeTab: "posts",
      tabs: [
        { id: "posts", label: "Posts" },
        { id: "about", label: "About" },
        { id: "friends", label: "Friends" },
        { id: "photos", label: "Photos" }
      ],
      defaultAvatar: "uploads/user.png",
      defaultCover: "uploads/cover.png",
   
      // ===== Modal Comment =====
      commentModalVisible: false,
      selectedPost: null,

      // ===== Modal Share =====
      shareModalVisible: false,
      sharedPost: null,
      showEditShareModal: false,
      editedShare: null,

      // Save posts functionality
      savedPosts: [],
      postSaveCounts: {},

      // Expand posts functionality
      expandedPosts: {},

      editProfileModalVisible: false,

      // 2. THÊM DATA QUẢN LÝ MENU ẢNH (MỚI)
      showAvatarMenu: false,
      showCoverMenu: false,

      imagePreviewVisible: false, // Biến bật tắt modal
      previewImageUrl: "",

      notification: {
        visible: false,
        type: 'success', // 'success', 'error', 'warning'
        title: '',
        message: ''
      },

      profileUser: null,
      friendStatus: 'none', // 'none' | 'sent' | 'received' | 'friends'
      loadingFriend: false,

      blockStatus: null,    // null | 'you_blocked' | 'blocked_by'
      loadingBlock: false,

      confirmFriendVisible: false,
      confirmFriendMessage: '',
      pendingFriendAction: null, // 'cancel' | 'unfriend'

      postStats: {
        totalPosts: 0,
        totalPhotos: 0
      },

      mediaTab: "all", // 'all' | 'photos' | 'videos'

      media: {
        all: [],
        photos: [],
        videos: []
      },

      mediaStats: {
        totalMedia: 0,
        totalPhotos: 0,
        totalVideos: 0
      },

      itemIndexMap: {},
      
      // loading state 
      loadingPosts:false,
      loadingFriends:false,
      loadingMedia:false,

      // ===== PAGINATION STATE =====
      pagePosts: 1,
      pageFriends: 1,
      pageMedia: 1,

      limitPosts: 10,
      limitFriends: 3,
      limitMedia: 6,

      totalPostsPages: 1,
      totalFriendsPages: 1,
      totalMediaPages: 1,

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

    isDefaultAvatar() {
      if (!this.user || !this.user.avatar) return true;
      // Ảnh Cloudinary (do user tự upload) → không phải mặc định
      if (this.user.avatar.includes('cloudinary.com')) return false;
      const defaultFiles = ['male_avatar.png', 'female_avatar.png', 'generic_avatar.png', 'admin_avatar.png'];
      return defaultFiles.some(def => this.user.avatar.includes(def));
    },

    // 2. Logic kiểm tra Cover mặc định
    isDefaultCover() {
      if (!this.user || !this.user.coverPhoto) return true;
      if (this.user.coverPhoto.includes('cloudinary.com')) return false;
      return this.user.coverPhoto.includes('cover.png');
    },

    isMyProfile() {
  const viewer = JSON.parse(localStorage.getItem("user"));
  const viewerId = viewer?._id || viewer?.id;
  return viewerId && viewerId === this.profileUser?._id;
},

friendButtonText() {
  switch (this.friendStatus) {
    case 'self': return '';
    case 'friends': return 'Unfriend';
    case 'sent': return 'Cancel Request';
    case 'received': return 'Accept Friend';
    default: return 'Add Friend';
  }
},

    displayedMedia() {
    return this.media.all;
  },

    mediaCount() {
      if (!this.mediaStats) return 0;

      switch (this.mediaTab) {
        case 'photos':
          return this.mediaStats.totalPhotos || 0;
        case 'videos':
          return this.mediaStats.totalVideos || 0;
        default:
          return this.mediaStats.totalMedia || 0;
      }
    },

  },
  methods: {
    getItemImage(images) {
      if (!images?.length) return "";
      const img = images[0];
      return img.startsWith("http") ? img : `http://localhost:3000/${img}`;
    },

    // === CÁC METHOD CŨ GIỮ NGUYÊN ===
    getDefaultAvatarPath(user) {
      if (!user) return "uploads/generic_avatar.png";

      if (user.role === "admin") {
        return "uploads/admin_avatar.png";
      }

      const g = user.gender ? user.gender.toLowerCase() : "";
      if (g === "male" || g === "nam") return "uploads/male_avatar.png";
      if (g === "female" || g === "nữ") return "uploads/female_avatar.png";
      
      return "uploads/generic_avatar.png";
    },

    resolveMediaUrl(media) {
      if (!media) return '';
      if (media.startsWith('http')) return media;
      return `http://localhost:3000/${media}`;
    },

    // 2. getAvatarUrl: Cloudinary URL đã đầy đủ, local path cần prefix
    getAvatarUrl(user) {
      if (user && user.avatar) {
        // Cloudinary URL đã có https:// → dùng thẳng
        if (user.avatar.startsWith('http')) return user.avatar;
        return `http://localhost:3000/${user.avatar}`;
      }
      const defaultPath = this.getDefaultAvatarPath(user);
      return `http://localhost:3000/${defaultPath}`;
    },

    // Helper resolve cover URL
    resolveCoverUrl(coverPhoto) {
      if (!coverPhoto) return `http://localhost:3000/${this.defaultCover}`;
      if (coverPhoto.startsWith('http')) return coverPhoto;
      return `http://localhost:3000/${coverPhoto}`;
    },

    formatTime(dateStr) {
      return new Date(dateStr).toLocaleString();
    },

    formatBirthday(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    },
    
    formatGender(gender) {
      if (!gender) return '';
      const genderMap = {
        'male': 'Male',
        'female': 'Female',
        'other': 'Other'
      };
      return genderMap[gender] || gender;
    },

    toggleMenu(postId) {
      this.openMenuId = this.openMenuId === postId ? null : postId;
    },

    closeAllMenus() {
      this.openMenuId = null;
    },

    // 2. [MỚI] Hàm xử lý khi lướt (scroll) -> Đóng menu ngay lập tức
    handleScroll() {
      if (this.openMenuId) {
        this.openMenuId = null;
      }
    },

    // ... (Giữ nguyên các hàm fetchFriends, fetchUserProfile, fetchUserPosts, isMyPost) ...
async fetchFriends(page = 1) {
  try {
    const userId = this.getProfileUserId();
    if (!userId) return;
    this.loadingFriends = true;

    const res = await fetch(`http://localhost:3000/users/${userId}/friends?page=${page}&limit=${this.limitFriends}`);
    const data = await res.json();

    // THỬ CÁC TRƯỜNG HỢP CẤU TRÚC DỮ LIỆU KHÁC NHAU
    // Backend của bạn có thể trả về 'items', hoặc 'friends', hoặc chính nó là mảng
    if (Array.isArray(data)) {
        this.friendsList = data; // Trường hợp API trả về thẳng 1 mảng
        this.totalFriendsPages = 1;
    } else {
        // Trường hợp API trả về object có phân trang
        this.friendsList = data.items || data.friends || []; 
        this.pageFriends = data.currentPage || 1;
        this.totalFriendsPages = data.totalPages || 1;
    }

  } catch (err) {
    console.error("Get friends error:", err);
  } finally{
    this.loadingFriends = false;
  }
},

    async fetchUserProfile() {
      try {
        const userId = this.getProfileUserId();
        if (!userId) return;

        const viewer = JSON.parse(localStorage.getItem("user"));
        const viewerId = viewer?._id || viewer?.id;
        const res = await fetch(
          `http://localhost:3000/users/${userId}?viewerId=${viewerId}`
        );
        if (!res.ok) throw new Error("User not found");

        const data = await res.json();
        this.user = data;
        this.profileUser = data; // ⭐ BẮT BUỘC
        this.friendStatus = data.friendStatus;
      } catch (err) {
        console.error("Get user error:", err);
        this.user = null;
      } 
    }, 

    async fetchUserPosts(page = 1) {
      try {
        const profileUserId = this.getProfileUserId();
        if (!profileUserId) return;
        this.loadingPosts = true;

        const viewer = JSON.parse(localStorage.getItem("user"));
        const viewerId = viewer?._id || viewer?.id;

        const res = await fetch(
          `http://localhost:3000/feeds/users/${profileUserId}` +
          `?page=${page}&limit=${this.limitPosts}&viewerId=${viewerId}`
        );

        const data = await res.json();

        this.userPosts = data.items || [];
        this.totalPostsPages = data.totalPages;

        if (data.stats) {
          this.postStats.totalPosts = data.stats.totalPosts;
          this.postStats.totalPhotos = data.stats.totalPhotos;
        }
      } catch (err) {
        console.error("User feed error:", err);
        this.userPosts = [];
      } finally {
        this.loadingPosts = false;
      }
    }, 

    isMyPost(post) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!savedUser || !post?.author) return false;

  const savedUserId = savedUser._id || savedUser.id;
  return post.author._id === savedUserId;
    },
    
    // --- Điều khiển Menu ---
    toggleAvatarMenu() {
      this.showAvatarMenu = !this.showAvatarMenu;
      this.showCoverMenu = false; // Đóng menu kia nếu đang mở
    },
    toggleCoverMenu() {
      this.showCoverMenu = !this.showCoverMenu;
      this.showAvatarMenu = false;
    },
    closeMenus() {
      this.showAvatarMenu = false;
      this.showCoverMenu = false;
    },

    // --- Xem ảnh ---
    openImageViewer(imageUrl) {
      this.closeMenus();
      if (!imageUrl) {
        alert("No image to preview!");
        return;
      }
      // URL đã được resolve trước khi truyền vào
      this.previewImageUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `http://localhost:3000/${imageUrl}`;
      this.imagePreviewVisible = true;
    },

    closeImagePreview() {
      this.imagePreviewVisible = false;
      this.previewImageUrl = "";
    },

    // --- Upload ảnh (Kích hoạt Input ẩn) ---
    triggerAvatarUpload() {
      if (!this.isMyProfile) return;
      // Cần có ref="avatarInput" ở thẻ input trong template
      if(this.$refs.avatarInput) this.$refs.avatarInput.click();
      this.closeMenus();
    },

    triggerCoverUpload() {
      if (!this.isMyProfile) return;
      // Cần có ref="coverInput" ở thẻ input trong template
      if(this.$refs.coverInput) this.$refs.coverInput.click();
      this.closeMenus();
    },

    // --- Xử lý sự kiện Change của Input File ---
    async handleAvatarChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("avatar", file);

      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        const res = await fetch(`http://localhost:3000/users/${savedUser.id}/avatar`, {
          method: "POST",
          body: formData,
        });
        
        if (res.ok) {
          const updatedUser = await res.json();
          // avatar giờ là Cloudinary URL đầy đủ
          this.updateLocalAvatar(updatedUser.avatar);
          this.showNotify("success", "Success!", "Profile picture updated.");
        } else {
          this.showNotify("error", "Failed", "Unable to upload image. Please try again.");
        }
      } catch (err) {
        console.error(err);
        this.showNotify("error", "Lỗi mạng", "Không thể kết nối đến máy chủ.");
      }
      event.target.value = null; 
    },

    async handleCoverChange(event) {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("coverPhoto", file);

      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        const res = await fetch(`http://localhost:3000/users/${savedUser.id}/cover`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const updatedUser = await res.json();
          // coverPhoto giờ là Cloudinary URL đầy đủ
          this.user.coverPhoto = updatedUser.coverPhoto;
          this.showNotify("success", "Success!", "Cover photo updated.");
        } else {
          this.showNotify("error", "Failed", "Unable to upload cover photo.");
        }
      } catch (err) {
        console.error(err);
      }
      event.target.value = null;
    },

    // --- Xóa ảnh ---
    async deleteAvatar() {
      if (!this.isMyProfile) return;
      if (!confirm("Bạn có chắc muốn gỡ ảnh đại diện?")) return;
      this.closeMenus();
      
      try {
         const savedUser = JSON.parse(localStorage.getItem("user"));
         const res = await fetch(`http://localhost:3000/users/${savedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: "" }) 
         });
         
         if(res.ok) {
             const data = await res.json(); // Nhận data từ backend (chứa ảnh mặc định mới)
             
             // === [SỬA ĐOẠN NÀY] ===
             // Đồng bộ avatar mới (hoặc avatar mặc định) vào list post
             this.updateLocalAvatar(data.user.avatar);
             
             this.showNotify("success", "Đã gỡ ảnh", "Ảnh đại diện đã trở về mặc định.");
         }
      } catch(err) {
          console.error(err);
      }
    },

    async deleteCoverPhoto() {
      if (!this.isMyProfile) return;
      if (!confirm("Bạn có chắc muốn gỡ ảnh bìa?")) return;
      this.closeMenus();

      try {
         const savedUser = JSON.parse(localStorage.getItem("user"));
         const res = await fetch(`http://localhost:3000/users/${savedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coverPhoto: "" }) 
         });
         
         if(res.ok) {
             this.user.coverPhoto = ""; 
             this.showNotify("success", "Đã gỡ ảnh", "Ảnh bìa đã được gỡ bỏ.");
         }
      } catch(err) {
          console.error(err);
      }
    },

    // --- HÀM ĐỒNG BỘ AVATAR TRÊN GIAO DIỆN ---
    updateLocalAvatar(newAvatarUrl) {
      const currentUserId = this.user._id || this.user.id;

      // 1. Cập nhật Avatar chính trên Profile
      this.user = { ...this.user, avatar: newAvatarUrl };

      // 2. Cập nhật LocalStorage
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (savedUser) {
        savedUser.avatar = newAvatarUrl;
        localStorage.setItem("user", JSON.stringify(savedUser));
      }

      // 3. Replace từng post bằng object mới để Vue detect reactivity
      // Mutation trực tiếp vào nested object (post.post.author.avatar) không trigger re-render
      this.userPosts = this.userPosts.map(post => {
        let updated = { ...post };

        // Bài viết thường: cập nhật author
        if (post.author && (post.author._id === currentUserId || post.author.id === currentUserId)) {
          updated = { ...updated, author: { ...post.author, avatar: newAvatarUrl } };
        }

        // Bài share: cập nhật người chia sẻ (username)
        if (post.type === 'share' && post.username &&
            (post.username._id === currentUserId || post.username.id === currentUserId)) {
          updated = { ...updated, username: { ...post.username, avatar: newAvatarUrl } };
        }

        // Bài share: cập nhật author của bài gốc bên trong
        if (post.post && post.post.author &&
            (post.post.author._id === currentUserId || post.post.author.id === currentUserId)) {
          updated = {
            ...updated,
            post: {
              ...post.post,
              author: { ...post.post.author, avatar: newAvatarUrl }
            }
          };
        }

        return updated;
      });

      window.dispatchEvent(new Event('user-profile-updated'));
    },

    // ... (Các method còn lại của Post, Like, Share giữ nguyên bên dưới) ...
    // ===== CREATE POST =====
    openCreatePostModal() {
      this.createPostModalVisible = true;
    },
    
    closeCreatePostModal() {
      this.createPostModalVisible = false;
    },
    
    async handlePostCreated() {
      this.closeCreatePostModal();
      await this.fetchUserPosts();
    },

    // Edit Post
    editPost(post) {
      this.editPostData = post;
      this.editModalVisible = true;
      this.openMenuId = null;
    },

    closeEditModal() {
      this.editModalVisible = false;
      this.editPostData = null;
    },

    async handlePostUpdated() {
      this.closeEditModal();
      await this.fetchUserPosts();
    },

    // Delete Post
    deletePost(postId) {
      this.postToDeleteId = postId;
      this.deleteType = 'post'; // Đánh dấu là xóa bài viết gốc
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa bài viết này không?';
      this.confirmVisible = true;
    },

    async handleConfirmedDelete() {
      this.confirmVisible = false; // Đóng modal trước

      if (!this.postToDeleteId) return;

      try {
        // TRƯỜNG HỢP 1: XÓA SHARE
        if (this.deleteType === 'share') {
          const res = await fetch(`http://localhost:3000/shares/${this.postToDeleteId}`, {
            method: 'DELETE'
          });
          
          if (res.ok) {
            // Cập nhật lại danh sách bài viết (Load lại hoặc filter bỏ đi)
            await this.fetchUserPosts(); 
            this.showNotify("success", "Thành công", "Đã xóa bài chia sẻ.");
          } else {
            this.showNotify("error", "Lỗi", "Không thể xóa bài chia sẻ.");
          }
        } 
        
        // TRƯỜNG HỢP 2: XÓA POST GỐC
        else if (this.deleteType === 'post') {
          const res = await fetch(`http://localhost:3000/posts/${this.postToDeleteId}`, {
            method: 'DELETE'
          });

          if (res.ok) {
            this.userPosts = this.userPosts.filter(p => p._id !== this.postToDeleteId);
            await this.fetchUserPosts();

            this.openMenuId = null;
            this.showNotify("success", "Thành công", "Đã xóa bài viết.");
          } else {
            this.showNotify("error", "Lỗi", "Không thể xóa bài viết.");
          }
        }

      } catch (err) {
        console.error("Lỗi khi xóa:", err);
        this.showNotify("error", "Lỗi", "Lỗi kết nối server.");
      }

      // Reset biến tạm
      this.postToDeleteId = null;
      this.deleteType = null;
    },

    // ===== COMMENT MODAL =====
    openCommentModal(post) {
      this.selectedPost = post;
      this.commentModalVisible = true;
    },

    closeCommentModal() {
      this.commentModalVisible = false;
      this.selectedPost = null;
    },

    handlePostLiked({ postId, likes }) {
      const post = this.userPosts.find(p => p._id === postId);
      if (post) {
        post.likes = likes;
      }
    },

    handleCommentCountUpdated({ postId, count }) {
      const post = this.userPosts.find(p => p._id === postId);
      if (post) {
        post.commentCount = count;
      }
    },

    handleRatingUpdated({ postId, totalRatings, averageRating }) {
      const post = this.userPosts.find(p => p._id === postId);
      if (post) {
        post.totalRatings = totalRatings;
        post.averageRating = averageRating;
      }
    },

    // ===== SHARE MODAL =====
    openShareModal(post) {
      this.shareModalVisible = true;
      this.sharedPost = post;
    },
    
    closeShareModal() {
      this.shareModalVisible = false;
      this.sharedPost = null;
    },
    
    async handlePostShared() {
      this.closeShareModal();
      await this.fetchUserPosts(); 
      alert('Post shared successfully!');
    },

    isMyShare(share) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      const userId = savedUser?._id || savedUser?.id;
      return userId && share.username?._id === userId;
    },

    deleteShare(shareId) {
      // Bỏ confirm mặc định, dùng Modal Confirm
      this.postToDeleteId = shareId;
      this.deleteType = 'share'; // Đánh dấu là xóa bài chia sẻ
      this.confirmMessage = "Bạn có chắc chắn muốn xóa bài chia sẻ này không?";
      this.confirmVisible = true;
    },

    editShare(share) {
      this.editedShare = share;
      this.showEditShareModal = true;
    },

    async hideThisPost(postId) {
  const viewer = JSON.parse(localStorage.getItem("user"));
  if (!viewer) return;

  try {
    await fetch(`http://localhost:3000/posts/hide-post/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: viewer.id })
    });

    // ✅ cập nhật UI ngay, KHÔNG reload
    this.userPosts = this.userPosts.filter(p => p._id !== postId);
  } catch (err) {
    console.error("Hide post error:", err);
  }
    },

    async hideThisShare(shareId) {
      const viewer = JSON.parse(localStorage.getItem("user"));
      if (!viewer) return;

      try {
        await fetch(`http://localhost:3000/shares/hide-share/${shareId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: viewer.id })
        });

        this.userPosts = this.userPosts.filter(p => p._id !== shareId);
      } catch (err) {
        console.error("Hide share error:", err);
      }
    },

    canViewSharedPost(post) {
      if (!post || !post.author || !this.user) return false;
      const authorId = post.author._id || post.author.id;
      const viewerId = this.user._id || this.user.id;
      const isAuthor = authorId === viewerId;
      const isFriend = post.author.friends?.includes(viewerId);
      switch (post.audience) {
        case 'public': return true;
        case 'friends': return isAuthor || isFriend;
        case 'private': return isAuthor;
        default: return false;
      }
    },

    getPostAccessMessage(post) {
      if (post.audience === 'private') return 'This post is private';
      else if (post.audience === 'friends') return 'Only friends of this user can see';
      else return '';
    },

    // ===== LIKE POST =====
    async toggleLike(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please login");
      try {
        const res = await fetch(`http://localhost:3000/posts/${post._id}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: savedUser.username })
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
      const userId = savedUser?._id || savedUser?.id;
      return userId && post.likes?.includes(userId);
    },

    // ===== SAVE POST =====
    async loadSavedPosts() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (!savedUser) return;
        const res = await fetch(`http://localhost:3000/feeds/users/${savedUser.id}/saved-items`);
        if (res.ok) {
          const data = await res.json();
          this.savedPosts = data.savedItems || [];
        }
      } catch (err) {
        console.error("Failed to load saved posts:", err);
      }
    },

    async fetchPostSaveCount(postId) {
      if (this.postSaveCounts[postId] !== undefined) return this.postSaveCounts[postId];
      try {
        const res = await fetch(`http://localhost:3000/posts/${postId}/saves-count`);
        if (res.ok) {
          const data = await res.json();
          this.postSaveCounts[postId] = data.savesCount || 0;
          return this.postSaveCounts[postId];
        }
      } catch (err) {
        console.error("Cannot fetch save count:", err);
      }
      this.postSaveCounts[postId] = 0;
      return 0;
    },

    getPostSaveCount(post) {
      if (!post || !post._id) return 0;
      if (post.savesCount !== undefined) return post.savesCount;
      if (this.postSaveCounts[post._id] !== undefined) return this.postSaveCounts[post._id];
      this.fetchPostSaveCount(post._id);
      return 0;
    },

    updatePostSaveCount(postId, increment = false) {
      if (this.postSaveCounts[postId] === undefined) this.postSaveCounts[postId] = 0;
      if (increment) this.postSaveCounts[postId]++;
      else this.postSaveCounts[postId] = Math.max(0, this.postSaveCounts[postId] - 1);
      
      const postIndex = this.userPosts.findIndex(p => p._id === postId || (p.post && p.post._id === postId));
      if (postIndex !== -1) {
        const post = this.userPosts[postIndex];
        if (post.post) post.post.savesCount = this.postSaveCounts[postId];
        else post.savesCount = this.postSaveCounts[postId];
      }
    },

    async fetchAllSaveCounts() {
      const postIds = [];
      this.userPosts.forEach(post => {
        if (post.type === 'original') postIds.push(post._id);
        else if (post.type === 'share' && post.post) postIds.push(post.post._id);
      });
      for (const postId of postIds) {
        if (this.postSaveCounts[postId] === undefined) this.fetchPostSaveCount(postId);
      }
    },

    async toggleSavePost(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please login to save posts");
      try {
        const postId = post._id;
        const isSaved = this.savedPosts.includes(postId);
        const res = await fetch(`http://localhost:3000/feeds/save/${postId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: savedUser.id, action: isSaved ? 'unsave' : 'save' })
        });
        const data = await res.json();
        if (res.ok) {
          if (isSaved) {
            this.savedPosts = this.savedPosts.filter(id => id !== postId);
            this.updatePostSaveCount(postId, false);
            alert(data.msg || 'Item unsaved successfully');
          } else {
            this.savedPosts.push(postId);
            this.updatePostSaveCount(postId, true);
            alert(data.msg || 'Item saved successfully');
          }
        } else {
          alert(data.msg || 'Failed to save/unsave item');
        }
      } catch (err) {
        console.error("Cannot save/unsave item:", err);
        alert("Unable to save/unsave item");
      }
    },

    isSaved(post) {
      return this.savedPosts.includes(post._id);
    },

    // ===== EXPAND POST (LOGIC MỚI CHO 4 TRƯỜNG) =====
    
    // 1. Hàm cắt ngắn text (Dùng cho Ingredients khi chưa mở rộng)
    getTruncatedText(text) {
      if (!text) return '';
      
      const lines = text.split('\n');
      
      // Lấy tối đa 3 dòng đầu tiên
      if (lines.length > 3) {
        return lines.slice(0, 3).join('\n') + '...';
      }
      
      // Hoặc lấy tối đa 150 ký tự
      if (text.length > 150) {
        return text.substring(0, 150) + '...';
      }
      
      return text;
    },

    // 2. Kiểm tra xem có cần hiện nút "Show More" không
    shouldShowReadMore(post) {
      if (!post) return false;
      
      // --- SỬA ĐOẠN NÀY ---
      // Cộng nội dung Ingredients và Instructions lại để kiểm tra độ dài
      const text = (post.ingredients || '') + (post.instructions || '');
      const lines = text.split('\n');
      
      // Nếu tổng cộng quá 5 dòng hoặc quá 200 ký tự thì hiện nút Show More
      return lines.length > 5 || text.length > 200;
    },

    // 3. Toggle trạng thái Mở/Đóng
    togglePostContent(postId) {
      // Tạo object mới để Vue nhận diện thay đổi (Reactivity)
      const newExpanded = { ...this.expandedPosts };
      newExpanded[postId] = !newExpanded[postId];
      this.expandedPosts = newExpanded;
    },

    // 4. Hiển thị nội dung Caption (Cho bài share)
    getDisplayedContent(post) {
      if (!post?.content) return '';
      
      const postId = post._id;
      // Nếu đã bấm Show More hoặc nội dung ngắn -> Hiện hết
      if (this.expandedPosts[postId] || !this.shouldShowReadMore(post)) {
        return post.content;
      }
      
      // Nếu chưa bấm -> Cắt ngắn
      const lines = post.content.split('\n');
      if (lines.length > 3) return lines.slice(0, 3).join('\n') + '...';
      return post.content.substring(0, 200) + '...';
    },

    switchTab(tabId) {
      this.activeTab = tabId;
      const navElement = this.$el.querySelector('.profile-nav') || this.$el.querySelector('.nav-wrapper');
      if (navElement) {
        navElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 

    openEditProfileModal() {
      this.editProfileModalVisible = true;
    },

    closeEditProfileModal() {
      this.editProfileModalVisible = false;
    },

    async handleProfileSave(updatedData) {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        const res = await fetch(`http://localhost:3000/users/${savedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });

        if (res.ok) {
          const newUser = await res.json();
          this.user = newUser; 
          localStorage.setItem("user", JSON.stringify({ ...savedUser, ...newUser }));
          this.closeEditProfileModal();
          this.showNotify("success", "Đã lưu", "Cập nhật thông tin cá nhân thành công!");
        } else {
          this.showNotify("error", "Lỗi", "Không thể cập nhật thông tin.");
        }
      } catch (err) {
        console.error(err);
        this.showNotify("error", "Lỗi mạng", "Không thể kết nối đến máy chủ.");
      }
    },

    showNotify(type, title, message) {
      this.notification.type = type;
      this.notification.title = title;
      this.notification.message = message;
      this.notification.visible = true;
    },

    // Hàm đóng thông báo
    closeNotify() {
      this.notification.visible = false;
    },

    getProfileUserId() {
  const routeId = this.$route.params.id;
  if (routeId && routeId !== 'undefined') return routeId;

  const savedUser = JSON.parse(localStorage.getItem("user"));
  return savedUser?._id || savedUser?.id || null;
    },

    addFriendToList(friend) {
      // Tránh thêm trùng
      const exists = this.friendsList.some(f => f._id === friend._id);
      if (!exists) {
        this.friendsList.unshift(friend);
      }

    },

    removeFriendFromList(friendId) {
      this.friendsList = this.friendsList.filter(f => f._id !== friendId);
    },

async handleFriendAction() {
  const viewer = JSON.parse(localStorage.getItem("user"));
  if (!viewer || !this.profileUser?._id) return;

  const viewerId = viewer._id || viewer.id;
  if (this.friendStatus === 'self') return;

  if (this.friendStatus === 'sent') {
    this.confirmFriendMessage = 'Do you want to cancel this friend request?';
    this.pendingFriendAction = 'cancel';
    this.confirmFriendVisible = true;
    return;
  }

  if (this.friendStatus === 'friends') {
    this.confirmFriendMessage = 'Do you want to unfriend this user?';
    this.pendingFriendAction = 'unfriend';
    this.confirmFriendVisible = true;
    return;
  }

  this.loadingFriend = true;

  try {
    // ADD FRIEND
    if (this.friendStatus === 'none') {
      await fetch("http://localhost:3000/users/friend-request/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: viewerId,
          toUserId: this.profileUser._id
        })
      });
    }

    // ACCEPT FRIEND
    else if (this.friendStatus === 'received') {
      await fetch("http://localhost:3000/users/friend-request/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: viewerId,
          requesterId: this.profileUser._id
        })
      });
    }

    await this.fetchUserProfile();
    await this.fetchFriends(this.pageFriends);
    window.dispatchEvent(new Event('friend-status-changed'));

  } catch (err) {
    console.error("Friend action error:", err);
  } finally {
    this.loadingFriend = false;
  }
}, 

async confirmFriendAction() {
  const viewer = JSON.parse(localStorage.getItem("user"));
  if (!viewer || !this.profileUser?._id) return;

  const viewerId = viewer._id || viewer.id;
  this.loadingFriend = true;

  try {
    if (this.pendingFriendAction === 'cancel') {
      await fetch("http://localhost:3000/users/friend-request/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: viewerId,
          toUserId: this.profileUser._id
        })
      });
    }

    else if (this.pendingFriendAction === 'unfriend') {
      await fetch("http://localhost:3000/users/unfriend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: viewerId,
          friendId: this.profileUser._id
        })
      });
    }

    await this.fetchUserProfile();
    await this.fetchFriends(this.pageFriends);
    window.dispatchEvent(new Event('friend-status-changed'));

  } catch (err) {
    console.error("Confirm friend action error:", err);
  } finally {
    this.loadingFriend = false;
    this.confirmFriendVisible = false;
    this.pendingFriendAction = null;
  }
}
,
 
    // ===== BLOCK =====
    async fetchBlockStatus() {
      if (this.isMyProfile) return;
      const viewer = JSON.parse(localStorage.getItem("user"));
      const viewerId = viewer?._id || viewer?.id;
      const profileId = this.getProfileUserId();
      if (!viewerId || !profileId || viewerId === profileId) return;
      try {
        const res = await fetch(`http://localhost:3000/block/check/${profileId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          this.blockStatus = data.isBlocked ? data.reason : null;
        }
      } catch (err) { console.error("fetchBlockStatus:", err); }
    },

    async handleBlock() {
      if (!confirm(`Block ${this.profileUser?.firstname} ${this.profileUser?.lastname}?`)) return;
      this.loadingBlock = true;
      try {
        const res = await fetch("http://localhost:3000/block", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ targetId: this.profileUser._id })
        });
        if (res.ok) {
          this.blockStatus = 'you_blocked';
          this.showNotify("success", "Blocked", `${this.profileUser?.firstname} ${this.profileUser?.lastname} has been blocked.`);
        } else {
          const d = await res.json().catch(() => ({}));
          this.showNotify("error", "Error", d.msg || "Unable to block this user.");
        }
      } catch (err) {
        console.error("handleBlock:", err);
        this.showNotify("error", "Network error", "Unable to connect to server.");
      } finally { this.loadingBlock = false; }
    },

    async handleUnblock() {
      if (!confirm(`Unblock ${this.profileUser?.firstname} ${this.profileUser?.lastname}?`)) return;
      this.loadingBlock = true;
      try {
        const res = await fetch("http://localhost:3000/block/unblock", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ targetId: this.profileUser._id })
        });
        if (res.ok) {
          this.blockStatus = null;
          this.showNotify("success", "Unblocked", `${this.profileUser?.firstname} ${this.profileUser?.lastname} has been unblocked.`);
        } else {
          const d = await res.json().catch(() => ({}));
          this.showNotify("error", "Error", d.msg || "Unable to unblock this user.");
        }
      } catch (err) {
        console.error("handleUnblock:", err);
        this.showNotify("error", "Network error", "Unable to connect to server.");
      } finally { this.loadingBlock = false; }
    },

    goToChat() {
      if (!this.profileUser?._id) return;
      this.$router.push(`/messages?userId=${this.profileUser._id}`);
    },

    isCurrentViewer(userId) {
      const viewer = JSON.parse(localStorage.getItem('user'));
      const viewerId = viewer?._id || viewer?.id;
      return viewerId && String(viewerId) === String(userId);
    },

    goToOwnProfile() {
      const viewer = JSON.parse(localStorage.getItem('user'));
      const id = viewer?._id || viewer?.id;
      if (id) this.$router.push(`/profile/${id}`);
    },

    goToMessageWith(userId) {
      this.$router.push(`/messages?userId=${userId}`);
    },

    async initProfile() {
        await this.fetchUserProfile();
        await Promise.all([
          this.fetchUserPosts(1),
          this.fetchFriends(1),
          this.fetchUserMedia(1),
          this.fetchBlockStatus(),
        ]);
    },

// Thay thế hàm fetchUserMedia cũ
async fetchUserMedia(page = 1) {
  try {
    const userId = this.getProfileUserId();
    if (!userId) return;
    this.loadingMedia = true;

    // 👇 XÁC ĐỊNH TYPE DỰA TRÊN TAB HIỆN TẠI
    let typeParam = '';
    if (this.mediaTab === 'photos') typeParam = '&type=image';
    else if (this.mediaTab === 'videos') typeParam = '&type=video';
    // 'all' thì không cần truyền type

    const res = await fetch(
      `http://localhost:3000/feeds/users/${userId}/media?page=${page}&limit=${this.limitMedia}${typeParam}`
    );
    const data = await res.json();

    // Gán dữ liệu vào media.all (Dùng chung 1 biến cho hiển thị)
    // Vì backend đã lọc sẵn rồi, ta không cần chia ra media.photos/videos nữa
    this.media.all = data.items || [];
    
    // Cập nhật stats
    this.mediaStats = data.stats || { totalMedia: 0, totalPhotos: 0, totalVideos: 0 };

    this.pageMedia = data.currentPage || 1;
    this.totalMediaPages = data.totalPages || 1;

  } catch (err) {
    console.error("Fetch user media error:", err);
  } finally{
    this.loadingMedia = false;
  }
},

    async openMediaPost(mediaItem) {
    try {
      const res = await fetch(
        `http://localhost:3000/posts/${mediaItem._id}`
      );

      if (!res.ok) throw new Error("Cannot load post");

      const fullPost = await res.json();

      this.selectedPost = fullPost;
      this.commentModalVisible = true;
    } catch (err) {
      console.error("Open media post error:", err);
      alert("Cannot open this post");
    }
    },

        openItem(itemId) {
      window.open(`/marketplace/${itemId}`, '_blank');
    },

    getItemIndex(postId) {
  return this.itemIndexMap[postId] ?? 0;
},

currentItem(post) {
  const index = this.getItemIndex(post._id);
  return post.linkedItems[index] || null;
},

nextItem(postId) {
  const current = this.getItemIndex(postId);
  this.$set
    ? this.$set(this.itemIndexMap, postId, current + 1)
    : (this.itemIndexMap[postId] = current + 1);
},

prevItem(postId) {
  const current = this.getItemIndex(postId);
  this.$set
    ? this.$set(this.itemIndexMap, postId, current - 1)
    : (this.itemIndexMap[postId] = current - 1);
},

onPostPageChange(page) {
    this.pagePosts = page;
    this.fetchUserPosts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  onFriendPageChange(page) {
  this.pageFriends = page;
  this.fetchFriends(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
},

  onMediaPageChange(page) {
  this.pageMedia = page;
  this.fetchUserMedia(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
},

  },

  mounted() {
  this.initProfile();
  this.loadSavedPosts();
  window.addEventListener('scroll', this.handleScroll, true);
},
  beforeUnmount() {
    // 4. [MỚI] Dọn dẹp sự kiện khi rời trang
    window.removeEventListener('scroll', this.handleScroll, true);
  },
watch: {
  '$route.params.id'(newId, oldId) {
    if (newId !== oldId) {
      this.activeTab = 'posts';
      this.userPosts = [];
      this.friendsList = [];
      this.blockStatus = null;
      this.initProfile();
    }
  },

  // 1. Giữ nguyên activeTab
  activeTab(tab) {
    if (tab === 'posts') {
      this.pagePosts = 1;
      this.fetchUserPosts(1);
    }
    if (tab === 'friends') {
      this.pageFriends = 1;
      this.fetchFriends(1);
    }
    if (tab === 'photos') { // Nên dùng biến 'tab' thay vì 'this.activeTab' cho chuẩn
      this.pageMedia = 1;
      this.fetchUserMedia(1);
    }
  },

  // 2. 👇 THÊM ĐOẠN NÀY VÀO (QUAN TRỌNG NHẤT) 👇
  mediaTab() {
    // Khi bấm nút 'All' / 'Photos' / 'Videos', gọi lại API để lọc dữ liệu
    this.pageMedia = 1; // Reset về trang 1
    this.fetchUserMedia(1);
  }
}

};
</script>

<style scoped>
/* --- 1. GLOBAL & HEADER NEW STYLE --- */
:root {
  --primary-color: var(--primary);
  
}

.profile-wrapper {
  background-color: var(--bg-body);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  padding-bottom: 60px;
  
  padding-left: 320px; /* Tạo khoảng trống 320px cho Sidebar bên trái */
  padding-right: 20px; /* Khoảng hở bên phải cho cân đối */
  padding-top: 20px;
}

/* HEADER GLASSMORPHISM */
.profile-header {
  background: var(--bg-card);
  padding-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03); /* Shadow nhẹ giống post */
  position: relative;
  
  /* ⭐ THAY ĐỔI QUAN TRỌNG ⭐ */
  max-width: 750px;       /* Giới hạn chiều rộng bằng Feed */
  margin: 0 auto 24px;    /* Căn giữa màn hình và cách dưới 24px */
  border-radius: 0 0 20px 20px; /* Bo tròn 2 góc dưới (hoặc bo cả 4 nếu muốn tách biệt hẳn) */
  /* Nếu muốn nó tách hẳn lề trên như một cái Card riêng biệt thì dùng dòng dưới: */
  border-radius: 16px; 
  overflow: hidden;       /* Đảm bảo ảnh bìa không bị tràn ra ngoài góc bo */
}

.cover-container {
  height: 250px; /* ⭐ Giảm chiều cao xuống chút cho cân đối với chiều rộng 750px */
  position: relative;
  overflow: hidden;
}
.cover-image { width: 100%; height: 100%; object-fit: cover; }
.cover-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.5)); pointer-events: none;}
.edit-cover { position: absolute; bottom: 20px; right: 30px; z-index: 5; }

.user-identity-card {
  display: flex; flex-direction: column; align-items: center;
  margin-top: -75px; position: relative; z-index: 10; padding: 0 20px;
}
.avatar-wrapper { position: relative; }
.profile-avatar {
  width: 160px; height: 160px; border-radius: 50%; border: 5px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); object-fit: cover; background: var(--bg-card);
}
.edit-avatar {
  position: absolute; bottom: 10px; right: 10px; background: var(--bg-input); border: 2px solid white;
  width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}

.identity-content { text-align: center; margin-top: 12px; max-width: 700px; }
.user-name { font-size: 32px; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0; }
.user-bio-short { color: var(--primary); font-style:italic; margin: 0 auto 20px; font-size: 16px; }

.stats-row {
  display: inline-flex; justify-content: center; align-items: center; gap: 24px;
  margin-bottom: 24px; background: var(--bg-card); padding: 12px 32px;
  border-radius: 20px;  border: 1px solid var(--border-color);
}
.stat-item { text-align: center; display: flex; flex-direction: column; }
.stat-val { font-weight: 800; font-size: 20px; color: var(--text-main); }
.stat-label { font-size: 12px; color: var(--primary); text-transform: uppercase; font-weight: 600; }
.stat-divider { width: 1px; height: 30px;  }
.action-buttons { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; align-items: center; }

.btn-action {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 24px; border: none;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
}
.btn-chat    { background: var(--hover-primary); color: var(--primary); border: 1.5px solid var(--border-color); }
.btn-chat:hover { background: var(--primary); color: #fff; }
.btn-block   { background: var(--bg-card)1f2; color: #e11d48; border: 1.5px solid #fecdd3; }
.btn-block:hover { background: #e11d48; color: #fff; }
.btn-unblock { background: color-mix(in srgb, #d97706 10%, var(--bg-card)); color: #d97706; border: 1.5px solid color-mix(in srgb, #d97706 25%, transparent); }
.btn-unblock:hover { background: #d97706; color: #fff; }
.btn-action:disabled { opacity: 0.6; cursor: not-allowed; }

/* Block wall */
.block-wall {
  max-width: 480px; margin: 40px auto; text-align: center;
  background: var(--bg-card); border-radius: 20px; padding: 48px 32px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid var(--border-color);
}
.block-wall-icon {
  width: 80px; height: 80px; border-radius: 50%;
  background: var(--bg-card)1f2; color: #e11d48;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.block-wall h3 { font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0 0 10px; }
.block-wall p  { font-size: 14px; color: var(--text-sub); margin: 0 0 24px; line-height: 1.6; }

.edit-profile-btn {
  background: var(--primary); color: white; border: none; 
  border-radius: 20px;  font-weight: 600; cursor: pointer;
  height: 40px; /* Cố định chiều cao cho bằng input */
  align-items: center; justify-content: center;
  padding: 10px 24px;
}

/* BUTTONS NEW */
.btn-glass { background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: 600; }
.btn-primary-gradient { background: var(--primary); color: white; border: none; padding: 10px 28px; border-radius: 24px; font-weight: 600; cursor: pointer; }
.btn-glass-dark {  color: var(--text-main); border: 1px solid var(--border-color); padding: 10px 24px; border-radius: 24px; font-weight: 600; cursor: pointer; }

/* NAV NEW */
.nav-wrapper { display: flex; justify-content: center; margin-bottom: 32px; position: sticky; top: 60px; z-index: 90; padding: 10px 0; }
.media-nav-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 20px;
}
.glass-nav {  background: var(--bg-card); backdrop-filter: blur(16px); padding: 6px; border-radius: 100px; display: flex; gap: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid var(--border-color); }
.nav-pill { text-align: center; justify-content: center; display:flex; padding: 10px 28px; border-radius: 40px; border: none; background: transparent; color: var(--text-sub); font-weight: 600; cursor: pointer; transition: all 0.3s; }
.nav-pill.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

/* MAIN LAYOUT */
/* --- MAIN LAYOUT (ĐÃ SỬA: CĂN GIỮA, 1 CỘT) --- */
.main-layout {
  max-width: 750px; /* Giống Homepage */
  margin: 0 auto;   /* Căn giữa */
  display: flex;    /* Flex 1 cột */
  flex-direction: column;
  padding: 0 16px;
  gap: 24px;
}
/* Tìm và thay thế đoạn này */
.layout-sidebar { display: none; }

/* Ẩn thanh cuộn trên Chrome/Safari */
.layout-sidebar::-webkit-scrollbar {
  display: none;
}

/* WIDGETS NEW */
.widget-card { background: var(--bg-card); border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid var(--border-color); }
.widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.widget-header h3 { 
  font-size: 18px; 
  font-weight: 800; 
  margin: 0; 
  color: var(--text-main); 
  display: flex;      /* Để căn chỉnh text và số */
  align-items: center;
  gap: 6px;
}

.see-all { color: var(--primary); font-size: 14px; font-weight: 600; cursor: pointer; }
.info-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; color: var(--text-sub); font-size: 15px; }
.mini-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; border-radius: 12px; overflow: hidden; }
.mini-photo img { width: 100%; aspect-ratio: 1; object-fit: cover; cursor: pointer; }
.mini-grid-friends { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.mini-friend { text-align: center; cursor: pointer; }
.mini-friend img { width: 100%; aspect-ratio: 1; border-radius: 12px; object-fit: cover; margin-bottom: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.friend-name-mini { font-size: 12px; font-weight: 600; display: block; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* --- 2. CLASSIC FEED STYLES (RESTORED FROM OLD CODE) --- */

/* Create Post Box */
.create-post {
  background: var(--bg-card); padding: 15px; border-radius: 10px; margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1); /* Thêm shadow nhẹ cho hợp với nền mới */
}
.create-post input {
  width: 100%; padding: 12px; font-size: 15px; border: 1px solid var(--border-color); border-radius: 8px; box-sizing: border-box;
  background: var(--hover-bg); /* Nền input hơi xám nhẹ */
}

/* Post Item */
.post-item {
  background: var(--bg-card); padding: 15px; border-radius: 10px; margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* --- RECIPE CONTENT STYLES (MỚI) --- */
.recipe-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 5px 0;
  color: var(--text-main);
}

.recipe-category {
  display: inline-block;
  font-size: 13px;
  background: var(--hover-primary); /* Nền cam nhạt */
  color: var(--primary);       /* Chữ cam đậm */
  padding: 2px 8px;
  border-radius: 12px;
  margin-bottom: 12px;
  font-weight: 600;
}

.recipe-body {
  margin-top: 12px;
}

.recipe-section-header {
  font-weight: 700;
  margin: 0 0 10px 0;
  font-size: 13px;
  color: var(--text-main);
}

/* Post Header */
/* Tìm đoạn này trong <style scoped> */
.post-header {
  display: flex;
  align-items: center;
  
  /* SỬA DÒNG NÀY: Chuyển từ space-between (hoặc mặc định) thành flex-start */
  justify-content: flex-start !important; 
  
  /* Thêm khoảng cách giữa Avatar và Tên */
  gap: 12px; 
  
  margin-bottom: 12px;
}
.share-post-header { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
.post-author-info { display: flex; align-items: flex-start; flex: 1; gap: 10px; }
.post-author-info img, .avatar-small { width: 40px; height: 40px; border-radius: 50%; margin-right: 0px; object-fit: cover; flex-shrink: 0; }
.author-details { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.author-details strong { font-size: 15px; font-weight: 600; color: var(--text-main); line-height: 1.2; }
.author-details .time { font-size: 12px; color: var(--text-sub); margin-top: 2px; line-height: 1.2; }

/* Menu Dropdown */
/* --- MENU POST STYLES (Dùng chung cho cả HomePage và ProfilePage) --- */

/* Wrapper cho menu */
.post-menu-wrapper { 
  position: relative; 
  display: flex;
  align-items: center;
}

/* Icon Menu (3 chấm) */
.menu-post-icon {
  width: 20px;  /* Đặt cứng kích thước */
  height: 20px;
  cursor: pointer;
  padding: 8px; /* Vùng bấm rộng */
  border-radius: 50%;
  transition: background 0.2s;
  object-fit: contain; /* Giữ tỉ lệ icon */
  opacity: 0.6; /* Làm mờ nhẹ */
}

.menu-post-icon:hover {
  background: var(--bg-input);
  opacity: 1;
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: 100%; /* Hiện ngay dưới */
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100; /* Đủ cao để đè lên post */
  min-width: 200px;
  overflow: hidden;
  padding: 4px 0;
  margin-top: 4px; /* Cách icon một chút */
}

/* Dropdown Item */
.dropdown-menu button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px; /* Cỡ chữ chuẩn */
  font-weight: 500;
  color: var(--text-main);
  gap: 12px; /* Khoảng cách giữa icon và chữ */
  transition: background 0.1s;
}

.dropdown-menu button:hover { 
  background-color: var(--bg-input); 
}

/* Icon nhỏ bên trong menu (Edit, Hide, Delete) */
.menu-icon-left {
  width: 18px;  /* Icon nhỏ hơn chữ một chút */
  height: 18px;
  object-fit: contain;
  margin: 0;
  opacity: 0.7;
}

/* Content */
.post-content-wrapper { margin: 10px 0; }
.share-post-content-wrapper { padding: 4px 16px 12px 16px; }
.post-text { margin: 10px 0; font-size: 14px; white-space: pre-line; word-wrap: break-word; color: var(--text-main); line-height: 1.4; }
.read-more-btn { border: none; background: none; color: var(--primary); font-weight: 600; font-size: 13px; cursor: pointer; padding: 0; margin-top: 5px; }
.read-more-btn:hover { text-decoration: underline; }

/* ===== Post Media ===== */
/* Giữ nguyên cho container và ảnh */
.post-media,
.post-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 12px;
  margin-top: 10px;
  display: block;
}

.post-video {
  width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; background-color:black;
}

/* Rating */
.rating-statistics { background: var(--hover-primary); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 16px; margin: 12px 0; }
.rating-summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.average-rating { display: flex; align-items: center; gap: 8px; }
.rating-number { font-size: 28px; font-weight: bold; color: #f57c00; }
.stars-display { display: flex; gap: 2px; }
.star-icon { font-size: 18px; color: var(--border-color); }
.star-icon.filled { color: #ffc107; }
.rating-count { font-size: 14px; color: var(--text-sub); font-weight: 600; }

/* Stats & Actions */
.post-stats { display: flex; gap: 16px; margin: 16px 0 12px 0; font-size: 14px; color: var(--text-sub); }
.post-actions {  display: flex; justify-content: space-around; margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 10px; }
.post-actions button { background: none; border: none; color: var(--text-sub); cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px; flex: 1; justify-content: center; padding: 8px; border-radius: 6px; transition: all 0.2s; }
.post-actions button:hover { background: var(--bg-body); color: var(--primary); }
.action-icon { width: 20px; height: 20px; }

/* Shared Post */
/* --- SHARED POST SPECIFICS (CẬP NHẬT) --- */

/* Khung bao ngoài bài gốc */
.shared-content-box { 
  border: 1px solid var(--border-color); 
  border-radius: 12px; 
  margin: 0 0px 0px; 
  overflow: hidden; 
  background-color: var(--bg-card);

}

.origin-post-author-info { display: flex; align-items: center; gap: 12px; }
.origin-post-author-info img { margin-left:20px; margin-top:10px; width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); }
.origin-author-details strong { margin-top:10px; display: block; font-size: 14px; color: var(--text-main); }
.origin-author-details .origin-post-time { font-size: 12px; color: var(--text-sub); margin-top: 2px; }

.restricted-post-warning { 
  padding: 15px; 
  display: flex; 
  align-items: center; /* Căn giữa dọc */
  gap: 12px; 
  border-bottom: 1px solid var(--border-color);
  
}

/* Nội dung cảnh báo */
.restricted-content {

  display: block; font-size: 14px; color: var(--text-main);
}

.notice-message { 
  font-size: 13px; 
  color: #dc3545; 
  font-style: italic; 
  margin: 4px 0 0 0; 
  padding:10px;
  margin-left:15px;
}

.empty-feed{
  text-align: center; 
  color: var(--primary); 
  font-size: 16px; 
  margin-top: 40px;
}

.empty-state{
  text-align: center; 
  color: var(--primary); 
  font-size: 16px; 
  margin-top: 40px;
}

/* Media bài gốc */
 .post-media-container { width: 100%; aspect-ratio: 1 / 1; background: var(--bg-card); display: flex; align-items: center; justify-content: center; overflow: hidden; }

/* Other Tabs (About/Friends) - NEW STYLE */
.about-container-modern { grid-column: 1 / -1; }
.about-card { background: var(--bg-card); border-radius: 24px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);}
.about-card h2 { font-size: 20px; font-weight: 800; margin-bottom: 32px; }
.bio-large { font-size: 20px; color: var(--primary); font-style:italic; margin-bottom: 40px; background: var(--bg-body); padding: 24px; border-radius: 16px; border: 1px solid var(--border-color) }
.details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.detail-box { background: var(--bg-body); border: 1px solid var(--border-color); padding: 20px; border-radius: 16px; }
.detail-box .label { display: block; font-size: 12px; color: var(--primary); margin-bottom: 6px; font-weight: 700; text-transform: uppercase; }
.detail-box .value { font-size: 16px; font-weight: 600; color: var(--text-main); }

.friends-container-modern { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.friend-card-modern { background: var(--bg-card); border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center; padding-bottom: 20px; border: 1px solid var(--border-color); }
.friend-card-modern img { width: 100%; height: 220px; object-fit: cover; }
.friend-card-modern .info { padding: 16px; }
.friend-card-modern h4 { margin: 0 0 12px; font-size: 18px; font-weight: 700; }
.friend-card-modern button { background: var(--hover-primary); color: var(--primary); border: none; padding: 8px 24px; border-radius: 30px; font-weight: 600; cursor: pointer; }

.photos-grid-large {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.photo-card {
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  transition: transform 0.2s;
}

.photo-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.photo-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-wrapper {
  position: relative;
  display: inline-block; /* Đảm bảo wrapper ôm sát ảnh */
}

/* Thêm hiệu ứng hover vào ảnh để người dùng biết có thể bấm */
.profile-avatar.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.profile-avatar.clickable:hover {
  filter: brightness(0.9); /* Làm tối nhẹ khi di chuột vào */
  transform: scale(1.02);  /* Phóng to cực nhẹ */
}

/* Menu Dropdown chung (Giữ nguyên hoặc chỉnh lại chút width) */
.image-options-menu {
  position: absolute;
  background: var(--bg-card);
  border-radius: 12px; /* Bo góc mềm mại hơn */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); /* Shadow đậm hơn chút cho nổi */
  padding: 8px;
  width: 220px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
}

/* Vị trí Menu Avatar: Căn giữa bên dưới ảnh */
.avatar-menu {
  top: 110%; /* Nằm dưới ảnh một khoảng nhỏ */
  left: 50%; 
  transform: translateX(-50%); /* Căn giữa menu so với avatar */
}

/* Mũi tên nhỏ trỏ lên trên (Optional - cho đẹp giống tooltip) */
.avatar-menu::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 6px 6px 6px;
  border-style: solid;
  border-color: transparent transparent white transparent;
}

/* Style cho từng dòng menu */
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-main);
  transition: background 0.2s;
}

.menu-item:hover {
  background-color: var(--bg-input);
}

.menu-item span {
  font-size: 18px; /* Icon nhỏ lại chút cho tinh tế */
}

.menu-item.delete {
  color: #dc3545;
}
.menu-item.delete:hover {
  background-color: color-mix(in srgb, #dc3545 15%, transparent);
}

.cover-image.clickable {
  cursor: pointer;
}

/* Định vị Container để làm chuẩn cho absolute */
.cover-container {
  position: relative; 
  /* ... các thuộc tính cũ giữ nguyên */
}

/* SỬA LẠI VỊ TRÍ MENU ẢNH BÌA */
.cover-menu {
  /* Cách 1: Hiện ở chính giữa ảnh bìa */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.menu-icon {
  width: 20px;  /* Kích thước icon */
  height: 20px;
  object-fit: contain; /* Giữ tỉ lệ ảnh không bị méo */
  opacity: 0.8; /* Làm mờ nhẹ cho đỡ gắt (tuỳ chọn) */
}

.menu-item:hover {
  background-color: var(--bg-input);
}

/* Hiệu ứng khi hover vào dòng menu thì icon đậm lên */
.menu-item:hover .menu-icon {
  opacity: 1;
}

/* --- CSS CHO THẺ BẠN BÈ (COPY TỪ FRIEND PAGE) --- */

.friends-tab-wrapper {
  grid-column: 1 / -1; /* Chiếm toàn bộ chiều ngang */
}

.photos-container-modern {
  grid-column: 1 / -1; /* Chiếm toàn bộ chiều ngang */
}

/* Grid Layout */
.modern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* Kích thước thẻ tự động */
  gap: 20px;
}

/* Card Style */
.modern-card {
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid var(--border-color);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.modern-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

/* Phần ảnh Card */
.card-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%; /* Tạo khung vuông tỉ lệ 1:1 */
}

.card-img {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: var(--bg-input);
}

/* Badge Online */
.status-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: #10b981;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Phần Body Card */
.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Để căn đều chiều cao */
}

.card-body h4 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.username {
  color: var(--text-sub);
  font-size: 13px;
  margin: 0 0 16px;
  font-weight: 500;
}

/* Buttons */
.btn-secondary {
  background: var(--bg-body); 
  color: var(--primary);      
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: auto; /* Đẩy nút xuống đáy thẻ */
}

.full-width {
  width: 100%;
}

/* --- CSS CHO HEADER TAB BẠN BÈ --- */

.friends-header-card {
  background: var(--bg-card);
  padding: 20px 24px;
  border-radius: 16px;
  margin-bottom: 24px; /* Khoảng cách với lưới bạn bè */
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between; /* Đẩy tiêu đề sang trái, số lượng sang phải */
  border: 1px solid var(--border-color);
}

.friends-header-card h2 {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
}

.photos-header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;

  background: var(--bg-card);
  padding: 20px 24px;
  border-radius: 16px;
  margin-bottom: 20px;

  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid var(--border-color);
}

.photos-header-card h2 {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
}

.photo-count {
  background: var(--bg-body);
  color: var(--primary);
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.glass-nav {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 24px;

  backdrop-filter: blur(16px);

  padding: 6px;
  border-radius: 999px;

  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  border: 1px solid rgba(255,255,255,0.6);
}

.nav-pill:hover {
  background: var(--bg-body);
  color: var(--primary);
}

.nav-pill.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 12px rgba(255,100,47,0.35);
}

.friend-count {
  background: var(--bg-body);
  color: var(--primary);
  padding: 6px 16px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 700;
}

/* ==========================================================================
   7. LINKED ITEMS IN POST STYLES
   ========================================================================== */
.linked-items-in-post {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}

.linked-items-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

/* ===== CAROUSEL ITEM ===== */

.linked-item-card.carousel {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--hover-bg);
}

/* GROUP ARROWS */
.carousel-arrows {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  display: flex;
  gap: 6px;
}

/* SINGLE ARROW */
.carousel-arrow {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-arrow:hover:not(:disabled) {
  background: var(--bg-card)7ed;
  border-color: var(--primary);
  color: var(--primary);
}

.carousel-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-indicator {
  margin-top: 6px;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub);
  background: var(--bg-input);
  padding: 3px 10px;
  border-radius: 999px;
  width: fit-content;
}

/* CHỪA CHỖ BÊN PHẢI CHO ARROW */
.linked-item-info {
  padding-right: 70px;
}

.linked-item-card {
  display: flex;
  gap: 10px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--hover-bg);
}

.linked-item-thumb {
  width: 42px;
  height: 42px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.linked-item-info {
  flex: 1;
  min-width: 0;
}

.linked-item-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.linked-item-meta {
  font-size: 12px;
  color: var(--primary);
  margin-top: 2px;
}

.own-item-badge {
  margin-left: 6px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  background: #e6f9ee;
  color: #15803d;
  text-transform: uppercase;
}

.view-item-btn {
  margin-left:10px;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  cursor: pointer;
}

.view-item-btn:hover {
  background: var(--bg-card)7ed;
  border-color: var(--primary);
  color: var(--primary);
}

.content-body{
  position: relative; /* Để làm mốc cho LoadingOverlay */
  min-height: 200px;
}

/* Responsive */
@media (max-width: 1024px) { 
  .main-layout { grid-template-columns: 300px 1fr; gap: 20px; } 
  .profile-wrapper {
    padding-left: 0;  /* Trên màn hình nhỏ/mobile thì bỏ khoảng trống này đi */
    padding-right: 0;
    padding-top: 60px; /* Đẩy xuống một chút nếu có header fixed trên mobile */
  }
}

@media (max-width: 900px) {
  .main-layout { grid-template-columns: 1fr; }
  .layout-sidebar { display: none; }
  .profile-avatar { width: 120px; height: 120px; }
  .user-identity-card { margin-top: -60px; }
}
</style>