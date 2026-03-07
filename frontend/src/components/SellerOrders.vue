<template>
  <div class="seller-orders">

    <h2>Seller Orders</h2>

    <!-- TABS -->
    <div class="tabs">
      <button :class="{ active: tab === 'orders' }" @click="tab = 'orders'">
        <strong>Orders
        <span v-if="orders.length > 0" class="count">({{ orders.length }})</span></strong>
      </button>
      <button :class="{ active: tab === 'refunds' }" @click="tab = 'refunds'">
        <strong>
          Refund Requests
          <span v-if="refunds.length > 0" class="count">({{ refunds.length }})</span>
        </strong>
      </button>
    </div>

    <!-- ERROR -->
    <div v-if="error" class="error-msg">
      ⚠️ {{ error }}
    </div>

    <!-- LOADING -->
    <LoadingOverlay v-if="loading" />

    <!-- ========================= -->
    <!-- ORDERS TABLE              -->
    <!-- ========================= -->
    <div class="table-wrapper">
      <table v-if="!loading && tab === 'orders'" class="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Buyer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order._id">

            <td>#{{ order._id.slice(-6) }}</td>

            <td>{{ order.buyer?.firstname }} {{ order.buyer?.lastname }}</td>

            <td>
              <div class="item-scroll">
              <div v-for="item in order.items" :key="item._id" class="item-row">
                {{ item.itemSnapshot?.title }} x{{ item.quantity }}
              </div>
              </div>
            </td>

            <td>
              <strong class="total-price">${{ order.subtotal }}</strong>
            </td>

            <td>
              <span class="status" :class="order.status">{{ order.status }}</span>
            </td>

            <td class="action-cell">
              <button
                class="btn-view"
                @click="$router.push(`/seller-orders/${order._id}`)"
              >View</button>

              <button
                v-if="['pending','confirmed','shipping'].includes(order.status)"
                @click="openStatusModal(order)"
              >Update</button>
            </td>

          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && tab === 'orders' && orders.length === 0" class="empty">
      No orders yet
    </div>

    <!-- ========================= -->
    <!-- REFUNDS TABLE             -->
    <!-- ========================= -->
    <table v-if="!loading && tab === 'refunds'" class="table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Buyer</th>
          <th>Reason</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="refund in refunds" :key="refund.orderId">
          <td>#{{ refund.orderId.slice(-6) }}</td>
          <td>{{ refund.buyer?.firstname }} {{ refund.buyer?.lastname }}</td>
          <td>{{ refund.refund?.reason }}</td>
          <td>{{ refund.refund?.status }}</td>
          <td>
            <button @click="openRefundModal(refund)">View</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && tab === 'refunds' && refunds.length === 0" class="empty">
      No refund requests
    </div>

    <!-- ========================= -->
    <!-- ACTION MODAL              -->
    <!-- Thay toàn bộ inline modal -->
    <!-- bằng component ActionModal-->
    <!-- ========================= -->
    <ActionModal
      v-if="modal.visible"
      :type="modal.type"
      :order="modal.order"
      :refund="modal.refund"
      @cancel="modal.visible = false"
      @confirm="handleModalConfirm"
    />

  </div>
</template>


<script>
import LoadingOverlay from "./LoadingOverlay.vue";
import ActionModal from "./ActionModal.vue";

export default {
  components: {
    LoadingOverlay,
    ActionModal
  },

  data() {
    return {
      tab: "orders",
      orders: [],
      refunds: [],
      loading: false,
      error: null,

      modal: {
        visible: false,
        type: "",       // "status" | "refund"
        order: null,
        refund: null
      }
    };
  },

  mounted() {
    this.fetchOrders();
    this.fetchRefunds();
  },

  methods: {

    /* ========================= */
    /* FETCH ORDERS              */
    /* ========================= */
    async fetchOrders() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/orders/seller`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) {
          this.error = data.msg || "Failed to load orders";
          return;
        }
        this.orders = data.orders || [];
      } catch (err) {
        console.error("Fetch orders error:", err);
        this.error = "Network error. Could not load orders.";
      } finally {
        this.loading = false;
      }
    },

    /* ========================= */
    /* FETCH REFUNDS             */
    /* ========================= */
    async fetchRefunds() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/refund/seller-refunds`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) {
          console.error("Fetch refunds failed:", data.msg);
          return;
        }
        this.refunds = data.refunds || [];
      } catch (err) {
        console.error("Fetch refunds error:", err);
      }
    },

    /* ========================= */
    /* MỞ MODAL STATUS           */
    /* ========================= */
    openStatusModal(order) {
      this.modal = { visible: true, type: "status", order, refund: null };
    },

    /* ========================= */
    /* MỞ MODAL REFUND           */
    /* ========================= */
    openRefundModal(refund) {
      this.modal = { visible: true, type: "refund", order: null, refund };
    },

    /* ========================= */
    /* NHẬN EMIT "confirm"       */
    /* từ ActionModal:           */
    /*  type=status → payload = status string  */
    /*  type=refund → payload = "approve"|"reject" */
    /* ========================= */
    async handleModalConfirm(payload) {
      if (this.modal.type === "status") {
        await this.updateStatus(payload);
      } else if (this.modal.type === "refund") {
        if (payload === "approve") await this.approveRefund();
        else if (payload === "reject") await this.rejectRefund();
      }
    },

    /* ========================= */
    /* UPDATE STATUS             */
    /* ========================= */
    async updateStatus(status) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/orders/${this.modal.order._id}/seller-status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status })
          }
        );
        const data = await res.json();
        if (!res.ok) { alert(data.msg || "Failed to update status"); return; }
        this.modal.visible = false;
        await this.fetchOrders();
      } catch (err) {
        console.error("Update status error:", err);
        alert("Network error. Please try again.");
      }
    },

    /* ========================= */
    /* APPROVE REFUND            */
    /* ========================= */
    async approveRefund() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/refund/approve/${this.modal.refund.orderId}`,
          { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) { alert(data.msg || "Failed to approve refund"); return; }
        this.modal.visible = false;
        await this.fetchRefunds();
      } catch (err) {
        console.error("Approve refund error:", err);
        alert("Network error. Please try again.");
      }
    },

    /* ========================= */
    /* REJECT REFUND             */
    /* ========================= */
    async rejectRefund() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/refund/reject/${this.modal.refund.orderId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ rejectReason: "" })
          }
        );
        const data = await res.json();
        if (!res.ok) { alert(data.msg || "Failed to reject refund"); return; }
        this.modal.visible = false;
        await this.fetchRefunds();
      } catch (err) {
        console.error("Reject refund error:", err);
        alert("Network error. Please try again.");
      }
    }

  }
};
</script>



<style scoped>

.seller-orders {
  margin-left: 320px;
  padding: 100px 40px;
  max-width: 1100px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tabs button {
  padding: 8px 16px;
  border: none;
  background: #eee;
  color: #65676b;
  cursor: pointer;
  border-radius: 6px;
}

.tabs .active {
  background: #FF642F;
  color: white;
}

.error-msg {
  background: #fdecea;
  color: #c0392b;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
}

.table-wrapper {
  max-height: 500px;
  overflow-y: auto;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.table-wrapper::-webkit-scrollbar { width: 6px; }
.table-wrapper::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
.table-wrapper::-webkit-scrollbar-thumb:hover { background: #bbb; }

.table thead {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.table th,
.table td {
  padding: 14px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.total-price{
  font-size: 16px;
  font-weight: 600;
  color: #ee4d2d;
  margin-left: 8px;
}

.status {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  text-transform: capitalize;
}

.status.pending   { background: #e2e3e5; }
.status.confirmed { background: #fff3cd; }
.status.shipping  { background: #cce5ff; }
.status.completed { background: #d4edda; }
.status.cancelled { background: #f8d7da; }
.status.refunded  { background: #f0d9f5; }

.item-scroll{
max-height: 35px;
overflow-y: auto;
}

.item-scroll::-webkit-scrollbar { width: 4px; }
.item-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px}
.item-scroll::-webkit-scrollbar-thumb:hover { background: #bbb; }

.item-row {
  font-size: 13px;
  margin-bottom: 4px;
}

.action-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-view {
  background: white;
  color: #FF642F;
  border: 1px solid #FF642F;
}

.btn-view:hover {
  background: #fff4f1;
}

button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #FF642F;
  color: white;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #888;
}

@media (max-width: 992px) {
  .seller-orders {
    margin-left: 0;
    padding: 100px 20px;
  }
}

</style>