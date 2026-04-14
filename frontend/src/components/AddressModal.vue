<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">

      <!-- ✅ HEADER -->
      <div class="modal-header">
        <h2>
          {{ mode === "edit" ? "Edit Address" : "Add New Address" }}
        </h2>

        <button class="close-btn" @click="$emit('close')">
          ✕
        </button>
      </div>

      <!-- ✅ FORM -->
      <div class="form-body">

        <div class="field">
          <label>Full Name</label>
          <input v-model="form.fullName" placeholder="Enter full name" />
        </div>

        <div class="field">
          <label>Phone</label>
          <input v-model="form.phone" placeholder="Enter phone number" />
        </div>

        <div class="field">
          <label>Address</label>
          <textarea
            v-model="form.address"
            placeholder="Street, district, city..."
          />
        </div>

        <!-- ✅ DEFAULT OPTION -->
        <label class="default-row">
          <input type="checkbox" v-model="form.isDefault" />
          Set as default address
        </label>
      </div>

      <!-- ✅ FOOTER -->
      <div class="modal-footer">
        <button class="cancel-btn" @click="$emit('close')">
          Cancel
        </button>

        <button class="save-btn" @click="submit" :disabled="loading">
          {{ loading ? "Saving..." : (mode === "edit" ? "Update" : "Create") }}
        </button>
      </div>
    </div>
  </div>
  <NotificationModal :is-visible="notification.visible" :type="notification.type" :title="notification.title" :message="notification.message" @confirm="closeNotify" />
</template>

<script>
import axios from "axios";
import NotificationModal from "../components/NotificationModal.vue";

export default {
  name: "AddressModal",
  components:{
    NotificationModal
  },

  props: {
    mode: {
      type: String,
      default: "create" // create | edit
    },

    address: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      loading: false,

      form: {
        fullName: "",
        phone: "",
        address: "",
        isDefault: false
      },

      notification: {
        visible: false,
        type: 'success', // 'success', 'error', 'warning'
        title: '',
        message: ''
      },
    };
  },

  mounted() {
    // ✅ Auto fill form if edit mode
    if (this.mode === "edit" && this.address) {
      this.form = {
        fullName: this.address.fullName,
        phone: this.address.phone,
        address: this.address.address,
        isDefault: this.address.isDefault || false
      };
    }
  },

  methods: {
    async submit() {
      const token = localStorage.getItem("token");
      if (!token) return alert("Login required");

      // ✅ Validate
      if (!this.form.fullName || !this.form.phone || !this.form.address) {
        return this.showNotify("error", "Error", "Please fill all fields");
        
      }

      this.loading = true;

      try {
        let res;

        // ✅ CREATE
        if (this.mode === "create") {
          res = await axios.post(
            "http://localhost:3000/user-address",
            this.form,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
        }

        // ✅ EDIT
        if (this.mode === "edit") {
          res = await axios.put(
            `http://localhost:3000/user-address/${this.address._id}`,
            this.form,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
        }

        // ✅ Notify parent
        this.showNotify("success", "Success", "Address saved successfully!");
        this.$emit("saved", res.data.addresses);

        
        this.$emit("close");

      } catch (err) {
        console.error("Address save error:", err.response?.data);
        
         this.showNotify("error", "Error", "Fail to save address");
      }

      this.loading = false;
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
/* ✅ Overlay giống modal comment */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 9999;
}

/* ✅ Modal box chuẩn Facebook */
.modal-box {
  width: 520px;
  border-radius: 18px;
  background: var(--bg-card);
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.25);
  overflow: hidden;

  animation: fadeUp 0.25s ease;
}

/* ✅ Header chuẩn modal comment */
.modal-header {
  height: 64px;
  border-bottom: 1px solid var(--border-color);

  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

/* ✅ Close button tròn giống comment modal */
.close-btn {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);

  width: 38px;
  height: 38px;
  border-radius: 50%;

  border: none;
  background: var(--bg-input);
  color: var(--text-sub);

  font-size: 20px;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  transition: 0.2s;
}

.close-btn:hover {
  background: var(--hover-bg);
}

/* ✅ Body spacing đẹp */
.form-body {
  padding: 22px 26px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  display: block;
  margin-bottom: 6px;
}

/* ✅ Input giống comment modal */
.field input,
.field textarea {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-sub);
  padding: 12px 14px;
  font-size: 15px;
  outline: none;
  transition: 0.2s;
}

.field input:focus,
.field textarea:focus {
  border-color: #ff642f;
  box-shadow: 0 0 0 2px rgba(255, 100, 47, 0.15);
  color: var(--text-main);
}

.field textarea {
  min-height: 85px;
  resize: none;
}

/* ✅ Default row */
.default-row {
  display: flex;
  align-items: center;
  gap: 10px;

  font-size: 14px;
  font-weight: 500;
  margin-top: 10px;
  color: var(--text-main);
}

.default-row input[type="checkbox"] {
  width: auto;
  height: auto;
  border-radius: 4px;
  accent-color: var(--primary);
}

/* ✅ Footer giống comment modal */
.modal-footer {
  border-top: 1px solid var(--border-color);
  padding: 16px 22px;

  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Cancel button */
.cancel-btn {
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid #ddd;
  background: white;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.cancel-btn:hover {
  background: #f8f8f8;
}

/* Save button */
.save-btn {
  padding: 10px 20px;
  border-radius: 12px;
  border: none;

  background: #ff642f;
  color: white;
  font-weight: 700;
  cursor: pointer;

  transition: 0.2s;
}

.save-btn:hover {
  opacity: 0.9;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ✅ Animation giống modal comment */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ✅ Responsive */
@media (max-width: 600px) {
  .modal-box {
    width: 95%;
  }

  .form-body {
    padding: 18px;
  }

  .modal-header h2 {
    font-size: 18px;
  }
}

</style>
