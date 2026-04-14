<template>
  <div class="settings-page">

    <!-- HEADER -->
    <div class="settings-header">
      <div class="settings-header-left">
        <h1 class="settings-title">Settings</h1>
        <p class="settings-sub">Manage your account information and preferences</p>
      </div>
    </div>

    <!-- HORIZONTAL TABS -->
    <div class="settings-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="settings-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- TAB CONTENT -->
    <div class="tab-content">

      <!-- ══════════════ PERSONAL INFO ══════════════ -->
      <div v-if="activeTab === 'info'" class="section-wrap">

        <!-- Avatar card -->
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-title">Profile Photo</span>
          </div>
          <!-- Thay thế toàn bộ avatar-section hiện tại -->
          <div class="avatar-section">
            <!-- Hidden file input -->
            <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarChange"/>

            <!-- Avatar với menu -->
            <div class="avatar-wrap" @click.stop="showAvatarMenu = !showAvatarMenu" >
              <img :src="getAvatarUrl()" class="avatar-large" @error="onAvErr" />
              <div class="avatar-cam">📷</div>

              <!-- Dropdown menu -->
              <div v-if="showAvatarMenu" class="avatar-menu" @click.stop >
                <div class="avatar-menu-item" @click="viewAvatar">
                  🔍 View Photo
                </div>
                <div class="avatar-menu-item" @click="triggerAvatarUpload">
                  ✏️ Update Photo
                </div>
                <div v-if="!isDefaultAvatar" class="avatar-menu-item danger" @click="removeAvatar">
                  🗑️ Remove Photo
                </div>
              </div>
            </div>

            <div class="avatar-details">
              <p class="avatar-name">{{ user.firstname }} {{ user.lastname }}</p>
              <p class="avatar-username">@{{ user.username }}</p>
              <p class="avatar-joined">Member since {{ fmtDate(user.createdAt) }}</p>
              <p class="avatar-hint">Click photo to change</p>
            </div>
          </div>

          <!-- Image preview overlay -->
          <div v-if="previewVisible" class="preview-overlay" @click="previewVisible = false">
            <img :src="getAvatarUrl()" class="preview-img" @click.stop/>
            <button class="preview-close" @click="previewVisible = false">✕</button>
          </div>
        </div>

        <!-- Info grid -->
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-title">Personal Details</span>
            <button class="btn-edit" @click="showEditProfile = true"> Edit Profile</button>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">First Name</span>
              <span class="info-value">{{ user.firstname || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Last Name</span>
              <span class="info-value">{{ user.lastname || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Username</span>
              <span class="info-value">@{{ user.username || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ user.email || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gender</span>
              <span class="info-value">{{ formatGender(user.gender) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Birthday</span>
              <span class="info-value">{{ formatBirthday(user.birthday) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Location</span>
              <span class="info-value">{{ user.location || '—' }}</span>
            </div>
            <div class="info-item full">
              <span class="info-label">Bio</span>
              <span class="info-value bio-val">{{ user.bio || 'No bio yet.' }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ══════════════ ACCOUNT & SECURITY ══════════════ -->
      <div v-if="activeTab === 'account'" class="section-wrap">

        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-title">Login & Security</span>
          </div>

          <div class="security-row">
            <div class="security-row-left">
              <span class="security-row-icon">✉️</span>
              <div>
                <p class="security-row-label">Email Address</p>
                <p class="security-row-value">{{ user.email || '—' }}</p>
                <p class="security-row-hint">Used for login and notifications</p>
              </div>
            </div>
            <button class="btn-action-outline" @click="openSecurity('email')">Change Email</button>
          </div>

          <div class="security-divider"></div>

          <div class="security-row">
            <div class="security-row-left">
              <span class="security-row-icon">🔑</span>
              <div>
                <p class="security-row-label">Password</p>
                <p class="security-row-value">••••••••••</p>
                <p class="security-row-hint">Last changed: {{ user.last_password_change ? fmtDate(user.last_password_change) : 'Never' }}</p>
              </div>
            </div>
            <button class="btn-action-outline" @click="openSecurity('password')" :disabled="sendingOtp">
              <span v-if="sendingOtp" class="spin-sm"></span>
              {{ sendingOtp ? 'Sending OTP...' : 'Change Password' }}
            </button>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-title">Account Info</span>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Account Status</span>
              <span class="status-badge active">Active</span>
            </div>
            <div class="info-item">
              <span class="info-label">Role</span>
              <span class="info-value">{{ user.role === 'admin' ? '🛡️ Admin' : '👤 User' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Member Since</span>
              <span class="info-value">{{ fmtDate(user.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Days as Member</span>
              <span class="info-value">{{ daysSince(user.createdAt) }} days</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ══════════════ CONTACT ADMIN ══════════════ -->
      <div v-if="activeTab === 'contact'" class="section-wrap">

        <div class="info-card" v-if="contactStep === 1">
          <div class="info-card-header">
            <span class="info-card-title">Send a Message to Admin</span>
          </div>
          <p class="contact-desc">Need help or have a concern? Our team will respond within 24–48 hours via email.</p>

          <div class="contact-form">
            <div class="contact-fields">
              <div class="contact-field">
                <label>Your Name <span class="req">*</span></label>
                <input v-model="contact.name" class="c-input" placeholder="Full name" />
              </div>
              <div class="contact-field">
                <label>Email <span class="req">*</span></label>
                <input v-model="contact.email" class="c-input" type="email" placeholder="your@email.com" />
              </div>
            </div>
            <div class="contact-field">
              <label>Subject</label>
              <input v-model="contact.subject" class="c-input" placeholder="e.g. Account issue, bug report..." />
            </div>
            <div class="contact-field">
              <label>Message <span class="req">*</span></label>
              <textarea v-model="contact.message" class="c-input c-textarea" placeholder="Describe your issue in detail..." rows="5" maxlength="1000"></textarea>
              <span class="c-count">{{ contact.message?.length || 0 }}/1000</span>
            </div>
            <p v-if="contactError" class="contact-error">{{ contactError }}</p>
          </div>

          <div class="card-footer-row">
            <button class="btn-primary" :disabled="contactSending" @click="sendContact">
              <span v-if="contactSending" class="spin-sm white"></span>
              {{ contactSending ? 'Sending...' : '✉️ Send Message' }}
            </button>
          </div>
        </div>

        <div class="info-card contact-success-card" v-else>
          <div class="success-blob">✅</div>
          <h3>Message Sent!</h3>
          <p>We've received your message and will get back to you via email shortly.</p>
          <button class="btn-action-outline" @click="resetContact">Send Another Message</button>
        </div>

      </div>

    </div>

    <!-- ══ EDIT PROFILE MODAL ══ -->
    <EditProfileModal
      :is-visible="showEditProfile"
      :user="user"
      @close="showEditProfile = false"
      @save="handleProfileSave"
    />

    <!-- ══ SECURITY MODAL ══ -->
    <SecurityModal
      ref="securityModal"
      :is-visible="showSecurity"
      :type="securityType"
      :current-email="user.email"
      @close="showSecurity = false"
      @submit-email-request="handleEmailRequest"
      @submit-email-verify="handleEmailVerify"
      @submit-password-verify="handlePasswordVerify"
      @resend-otp="resendOtp"
    />

    <NotificationModal
      :isVisible="notifModal.visible"
      :type="notifModal.type"
      :title="notifModal.title"
      :message="notifModal.message"
      buttonText="OK"
      @confirm="notifModal.visible = false"
    />

  </div>
</template>

<script>
import EditProfileModal from './EditProfileModal.vue';
import SecurityModal    from './SecurityModal.vue';
import NotificationModal from './NotificationModal.vue';

const API = process.env.VUE_APP_API_URL || 'http://localhost:3000';


export default {
  name: 'SettingsPage',
  components: { 
    EditProfileModal, 
    SecurityModal,
    NotificationModal 
  },

  data() {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      user: { ...u },
      activeTab: 'info',

      tabs: [
        { key: 'info',     label: 'Personal Info' },
        { key: 'account',  label: 'Account & Security' },
        { key: 'contact',  label: 'Contact Admin' },
      ],

      showEditProfile: false,

      showSecurity: false,
      securityType: 'password',
      sendingOtp: false,

      contact: {
        name:    `${u.firstname || ''} ${u.lastname || ''}`.trim(),
        email:   u.email || '',
        subject: '',
        message: '',
      },
      contactStep: 1,
      contactSending: false,
      contactError: '',

      notifModal: { visible: false, type: 'success', title: '', message: '' },

      showAvatarMenu: false,
      previewVisible: false,
    };
  },

  methods: {
    getAvatarUrl() {
      const av = this.user.avatar;
      if (!av) return `${API}/uploads/user.png`;
      return av.startsWith('http') ? av : `${API}/${av}`;
    },
    onAvErr(e) { e.target.src = `${API}/uploads/user.png`; },

    formatGender(g) {
      return { male: 'Male', female: 'Female', other: 'Other' }[g] || '—';
    },
    formatBirthday(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    fmtDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    daysSince(d) {
      if (!d) return 0;
      return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    },

    async handleProfileSave(updatedData) {
      try {
        const userId = this.user._id || this.user.id;
        const res = await fetch(`${API}/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
        if (res.ok) {
          const newUser = await res.json();
          this.user = { ...this.user, ...newUser };
          localStorage.setItem('user', JSON.stringify(this.user));
          this.showEditProfile = false;
          this.showNotif('Profile Updated', 'Profile updated successfully!');
          window.dispatchEvent(new Event('user-profile-updated'));
        } else {
          const d = await res.json();
          this.showNotif('Error', d.msg || 'Failed to update profile.', 'error');
        }
      } catch (e) {
        this.showNotif('Error', 'Network error. Please try again.', 'error');
      }
    },

// 1. Sửa openSecurity - gửi OTP trước khi mở modal
async openSecurity(type) {
  this.securityType = type;
  if (type === 'password') {
    await this.sendPasswordOtp(); // gửi OTP rồi mới mở modal bên trong
  } else {
    // email: mở modal ở step 1 trước, user nhập email mới rồi mới gửi OTP
    this.showSecurity = true;
  }
},

// 2. sendPasswordOtp - giữ nguyên, đã đúng
async sendPasswordOtp() {
  this.sendingOtp = true;
  try {
    const userId = this.user._id || this.user.id;
    const res = await fetch(`${API}/users/change-password/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (res.ok) {
      this.showSecurity = true;
      this.showNotif('Success', data.msg || 'OTP sent to your email!');
    } else {
      this.showNotif('Error', data.msg || 'Failed to send OTP.', 'error');
    }
  } catch (e) {
    this.showNotif('error', 'Network error.', 'error');
  } finally {
    this.sendingOtp = false;
  }
},

async handlePasswordVerify({ otp, newPassword }) {
  // Set loading trên modal
  this.$refs.securityModal?.setLoading(true);
  try {
    const userId = this.user._id || this.user.id;
    const res = await fetch(`${API}/users/change-password/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otp, newPassword }),
    });
    const data = await res.json();

    if (res.ok) {
      this.showSecurity = false;
      this.showNotif('success', 'Password changed! Logging out in 2s...');
      setTimeout(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.$router.push('/login');
      }, 2000);
    } else {
      this.$refs.securityModal?.setLoading(false);  // ← unlock nút
      this.showNotif('Error', data.msg || 'Invalid or expired OTP', 'error');
    }
  } catch (e) {
    this.$refs.securityModal?.setLoading(false);    // ← unlock nút
    this.showNotif('Error','Network error', 'error');
  }
},

// 3. resendOtp - phân biệt email vs password
resendOtp() {
  if (this.securityType === 'password') {
    this.sendPasswordOtp();
  } else {
    // Resend email OTP = gọi lại request với email đã lưu
    if (this._pendingNewEmail) {
      this.handleEmailRequest(this._pendingNewEmail);
    }
  }
},

// 4. handleEmailRequest - sau khi gửi OTP thành công, gọi nextStep trên SecurityModal
async handleEmailRequest(newEmail) {
  try {
    this._pendingNewEmail = newEmail; // lưu lại để resend dùng
    const token = localStorage.getItem('token');
    const userId = this.user._id || this.user.id;
    const res = await fetch(`${API}/users/change-email/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, newEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      // Báo cho SecurityModal chuyển sang step 2
      this.$refs.securityModal.nextStep();
      this.showNotif('success', data.msg || 'OTP sent to your new email!');
    } else {
      this.showNotif('Error',data.msg || 'Failed to send verification email.','error');
    }
  } catch (e) { 
    this.showNotif('Error', 'Network error', 'error');
   }
},

// 5. handleEmailVerify - giữ nguyên, đã đúng
async handleEmailVerify({ otp, newEmail }) {
  try {
    const token = localStorage.getItem('token');
    const userId = this.user._id || this.user.id;
    const res = await fetch(`${API}/users/change-email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, otp, newEmail }),
    });
    if (res.ok) {
      this.user.email = newEmail;
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.email = newEmail;
      localStorage.setItem('user', JSON.stringify(stored));
      this.showSecurity = false;
      this.showNotif('Success', 'Email updated successfully!');
    } else {
      const d = await res.json();
      alert(d.msg || 'Invalid OTP.');
    }
  } catch (e) { alert('Network error.'); }
},

    async sendContact() {
      this.contactError = '';
      if (!this.contact.name.trim())    return (this.contactError = 'Name is required.');
      if (!this.contact.email.trim())   return (this.contactError = 'Email is required.');
      if (!this.contact.message.trim()) return (this.contactError = 'Message is required.');
      this.contactSending = true;
      try {
        const res = await fetch(`${API}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.contact),
        });
        if (res.ok) {
          this.contactStep = 2;
        } else {
          const d = await res.json();
          this.contactError = d.msg || 'Failed to send.';
        }
      } catch (e) {
        this.contactError = 'Network error.';
      } finally {
        this.contactSending = false;
      }
    },

    resetContact() {
      this.contactStep = 1;
      this.contact.subject = '';
      this.contact.message = '';
      this.contactError = '';
    },

    triggerAvatarUpload() {
  this.showAvatarMenu = false;
  this.$refs.avatarInput.click();
},

viewAvatar() {
  this.showAvatarMenu = false;
  this.previewVisible = true;
},

async handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('avatar', file);
  try {
    const userId = this.user._id || this.user.id;
    const res = await fetch(`${API}/users/${userId}/avatar`, { method: 'POST', body: fd });
    if (res.ok) {
      const updated = await res.json();
      this.user.avatar = updated.avatar;
      // Cập nhật localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.avatar = updated.avatar;
      localStorage.setItem('user', JSON.stringify(stored));
      window.dispatchEvent(new Event('user-profile-updated'));
      this.showNotif('Success', 'Profile photo updated!');
    } else {
      this.showNotif('Error', 'Failed to upload photo.');
    }
  } catch (e) {
    this.showNotif('Error', 'Network error.');
  }
  event.target.value = null;
},

async removeAvatar() {
  if (!confirm('Remove your profile photo?')) return;
  this.showAvatarMenu = false;
  try {
    const userId = this.user._id || this.user.id;
    const res = await fetch(`${API}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: '' }),
    });
    if (res.ok) {
      const data = await res.json();
      this.user.avatar = data.user?.avatar || data.avatar || '';
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.avatar = this.user.avatar;
      localStorage.setItem('user', JSON.stringify(stored));
      window.dispatchEvent(new Event('user-profile-updated'));
      this.showNotif('Success', 'Profile photo removed.');
    }
  } catch (e) {
    this.showNotif('Error', 'Network error.');
  }
},

  async mounted() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = stored._id || stored.id;
  if (!userId) return;

  try {
    const res = await fetch(`${API}/users/${userId}/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      // Backend có thể trả về data.user hoặc thẳng object
      const fullUser = data.user || data;
      this.user = { ...stored, ...fullUser };
    }
  } catch (e) {
    console.error('Failed to fetch profile:', e);
  }
},

handleClickOutside() {
  this.showAvatarMenu = false;
},

showNotif(title, message, type='success') {
  this.notifModal = { visible: true, type, title, message };
},
  },





computed: {
  isDefaultAvatar() {
    const av = this.user.avatar;
    if (!av) return true;
    if (av.includes('cloudinary.com')) return false;
    const defaults = ['male_avatar.png', 'female_avatar.png', 'generic_avatar.png', 'admin_avatar.png', 'user.png'];
    return defaults.some(d => av.includes(d));
  }
},

mounted() {
  // Lắng nghe sự kiện cập nhật profile từ các modal con
  window.addEventListener('user-profile-updated', this.fetchUserProfile);   
  document.addEventListener('click', this.handleClickOutside);
},

beforeUnmount() {
  window.removeEventListener('user-profile-updated', this.fetchUserProfile);
  document.removeEventListener('click', this.handleClickOutside);
},

};

</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: var(--bg-body);
  color: var(--text-main);
  font-family: 'Segoe UI', system-ui, sans-serif;
  padding: 32px 40px 60px 360px;
}

.settings-header { margin-bottom: 24px; }
.settings-title { font-size: 24px; font-weight: 800; color: var(--text-main); margin: 0 0 4px; }
.settings-sub   { font-size: 13px; color: var(--text-sub); margin: 0; }

/* ── HORIZONTAL TABS ── */
.settings-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 28px;
}
.settings-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border: none;
  background: none;
  color: var(--text-sub);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.settings-tab:hover { color: var(--text-main); }
.settings-tab.active { color: #FF642F; border-bottom-color: #FF642F; }
.tab-icon { font-size: 15px; }

/* ── SECTION ── */
.section-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 700px;
  animation: fadeUp 0.2s ease;
}

/* ── CARD ── */
.info-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 22px 26px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.info-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.info-card-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-sub);
}

/* ── AVATAR ── */
.avatar-section { display: flex; align-items: center; gap: 20px; }
.avatar-large {
  width: 72px; height: 72px;
  border-radius: 50%; object-fit: cover;
  border: 3px solid var(--border-color); flex-shrink: 0;
}
.avatar-details { display: flex; flex-direction: column; gap: 3px; }
.avatar-name     { font-size: 18px; font-weight: 700; color: var(--text-main); margin: 0; }
.avatar-username { font-size: 13px; color: var(--text-sub); margin: 0; }
.avatar-joined   { font-size: 12px; color: var(--text-sub); margin: 0; }

/* ── INFO GRID ── */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-item.full { grid-column: 1 / -1; }
.info-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.4px;
  color: var(--text-sub);
}
.info-value { font-size: 14px; color: var(--text-main); font-weight: 500; }
.bio-val { line-height: 1.6; color: var(--text-sub); font-weight: 400; font-style: italic; }

/* ── SECURITY ── */
.security-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.security-row-left { display: flex; align-items: flex-start; gap: 14px; }
.security-row-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.security-row-label { font-size: 14px; font-weight: 700; color: var(--text-main); margin: 0 0 2px; }
.security-row-value { font-size: 14px; color: var(--text-main); margin: 0 0 2px; letter-spacing: 2px; }
.security-row-hint  { font-size: 12px; color: var(--text-sub); margin: 0; }
.security-divider   { height: 1px; background: var(--border-color); }

.status-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
.status-badge.active { background: #22c55e1a; color: #22c55e; }

/* ── CONTACT ── */
.contact-desc { font-size: 13px; color: var(--text-sub); margin: 0; line-height: 1.6; }
.contact-form { display: flex; flex-direction: column; gap: 14px; }
.contact-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.contact-field { display: flex; flex-direction: column; gap: 6px; }
.contact-field label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-sub); }
.req { color: #ef4444; }
.c-input {
  padding: 10px 14px; border-radius: 10px;
  border: 1.5px solid var(--border-color);
  background: var(--bg-input); color: var(--text-main);
  font-size: 13px; font-family: inherit; outline: none;
  transition: border-color 0.15s; width: 100%; box-sizing: border-box;
}
.c-input:focus { border-color: #FF642F; }
.c-input::placeholder { color: var(--text-sub); }
.c-textarea { resize: vertical; min-height: 100px; }
.c-count { font-size: 11px; color: var(--text-sub); text-align: right; }
.contact-error {
  font-size: 13px; color: #ef4444;
  padding: 10px 14px; border-radius: 8px;
  background: #fef2f2; border: 1px solid #fecaca; margin: 0;
}
.card-footer-row {
  display: flex; justify-content: flex-end;
  padding-top: 8px; border-top: 1px solid var(--border-color);
}
.contact-success-card { align-items: center; text-align: center; padding: 48px 26px; }
.success-blob { font-size: 52px; }
.contact-success-card h3 { font-size: 18px; font-weight: 800; color: var(--text-main); margin: 0; }
.contact-success-card p  { font-size: 14px; color: var(--text-sub); margin: 0; line-height: 1.6; max-width: 360px; }

/* ── BUTTONS ── */
.btn-edit {
  padding: 6px 16px; border-radius: 8px;
  border: 1.5px solid var(--border-color);
  background: none; color: var(--text-main);
  font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.15s;
}
.btn-edit:hover { border-color: #FF642F; color: #FF642F; }

.btn-action-outline {
  padding: 9px 20px; border-radius: 10px;
  border: 1.5px solid var(--border-color);
  background: none; color: var(--text-main);
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: 0.15s; white-space: nowrap;
  display: flex; align-items: center; gap: 6px;
}
.btn-action-outline:hover { border-color: #FF642F; color: #FF642F; }
.btn-action-outline:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary {
  padding: 10px 24px; border-radius: 10px; border: none;
  background: #FF642F; color: #fff;
  font-size: 13px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 8px; transition: 0.15s;
}
.btn-primary:hover:not(:disabled) { background: #e05522; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

/* ── SPINNER ── */
.spin-sm {
  width: 13px; height: 13px; border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.15);
  border-top-color: #FF642F;
  animation: spin 0.7s linear infinite; display: inline-block;
}
.spin-sm.white { border-color: rgba(255,255,255,0.3); border-top-color: #fff; }

/* Avatar menu */
.avatar-wrap {
  position: relative;
  width: 78px;
  height: 78px;
  flex-shrink: 0;
  cursor: pointer;
}
.avatar-cam {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  opacity: 0;
  transition: opacity 0.2s;
}
.avatar-wrap:hover .avatar-cam { opacity: 1; }

.avatar-hint { font-size: 11px; color: var(--text-sub); margin: 4px 0 0; font-style: italic; }

.avatar-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 100;
  min-width: 160px;
  animation: fadeUp 0.15s ease;
}
.avatar-menu-item {
  padding: 11px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  cursor: pointer;
  transition: background 0.12s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar-menu-item:hover { background: var(--hover-bg); }
.avatar-menu-item.danger { color: #ef4444; }
.avatar-menu-item.danger:hover { background: #fef2f2; }

/* Image preview */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-img {
  max-width: 80vw;
  max-height: 80vh;
  border-radius: 16px;
  object-fit: contain;
}
.preview-close {
  position: fixed;
  top: 20px;
  right: 24px;
  background: rgba(255,255,255,0.15);
  border: none;
  color: #fff;
  font-size: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-close:hover { background: rgba(255,255,255,0.3); }

@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
@keyframes spin   { to { transform: rotate(360deg); } }

@media (max-width: 1024px) { .settings-page { padding-left: 20px; padding-right: 20px; } }
@media (max-width: 768px) {
  .settings-page { padding: 80px 16px 60px; }
  .info-grid { grid-template-columns: 1fr; }
  .info-item.full { grid-column: 1; }
  .contact-fields { grid-template-columns: 1fr; }
  .security-row { flex-direction: column; align-items: flex-start; }
  .settings-tabs { overflow-x: auto; scrollbar-width: none; }
  .settings-tabs::-webkit-scrollbar { display: none; }
}
</style>