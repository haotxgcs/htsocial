<template>
  <div class="modal-overlay">
    <div class="modal">

      <!-- ===================== -->
      <!-- STATUS UPDATE -->
      <!-- ===================== -->

      <div v-if="type === 'status'">

        <h3>Update Order Status</h3>

        <p class="order-id">
          Order #{{ order._id.slice(-6) }}
        </p>

        <p class="current">
          Current Status: {{ order.status }}
        </p>

        <select v-model="status">
          <option disabled value="">Select status</option>
          <option value="confirmed">Confirm</option>
          <option value="shipping">Ship</option>
          <option value="completed">Complete</option>
        </select>

        <div class="actions">
          <button class="cancel" @click="$emit('cancel')">
            Cancel
          </button>

          <button
            class="confirm"
            :disabled="!status"
            @click="$emit('confirm', status)"
          >
            Update
          </button>
        </div>

      </div>



      <!-- ===================== -->
      <!-- REFUND -->
      <!-- ===================== -->

      <div v-if="type === 'refund'">

        <h3>Refund Request</h3>

        <p>
          Order #{{ refund.orderId.slice(-6) }}
        </p>

        <p class="reason">
          Reason: {{ refund.refund.reason }}
        </p>

        <div class="actions">

          <button
            class="reject"
            @click="$emit('confirm','reject')"
          >
            Reject
          </button>

          <button
            class="approve"
            @click="$emit('confirm','approve')"
          >
            Approve
          </button>

        </div>

      </div>



      <!-- ===================== -->
      <!-- ===================== -->
      <!-- REQUEST REFUND       -->
      <!-- ===================== -->

      <div v-if="type === 'request-refund'">

        <h3>Request Refund</h3>

        <p>Order #{{ order._id.slice(-6) }}</p>

        <div class="field">
          <label>Reason <span class="required">*</span></label>
          <textarea
            v-model="refundReason"
            placeholder="Describe the issue..."
          ></textarea>
        </div>

        <div class="field">
          <label>Evidence <span v-if="requireEvidence" class="required">* required</span><span v-else class="optional">(optional)</span></label>
          <div
            class="upload-area"
            @click="$refs.fileInput.click()"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            <div v-if="!previewFiles.length" class="upload-placeholder">
              📎 Click or drag images/videos here
            </div>
            <div v-else class="preview-list">
              <div v-for="(f, i) in previewFiles" :key="i" class="preview-item">
                <img v-if="f.type.startsWith('image')" :src="f.url" class="preview-img" />
                <span v-else class="preview-video">🎥 {{ f.name }}</span>
                <button class="remove-file" @click.stop="removeFile(i)">✕</button>
              </div>
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*,video/*"
            style="display:none"
            @change="onFileChange"
          />
        </div>

        <div class="actions">
          <button class="cancel" @click="$emit('cancel')">Close</button>
          <button
            class="confirm"
            :disabled="!refundReason || (requireEvidence && !previewFiles.length)"
            @click="submitRefund"
          >Submit Refund</button>
        </div>

      </div>

      <!-- CANCEL ORDER -->
      <!-- ===================== -->

      <div v-if="type === 'cancel'">

        <h3>Cancel Order</h3>

        <p>
          Order #{{ order._id.slice(-6) }}
        </p>

        <textarea
          v-model="reason"
          placeholder="Enter cancel reason"
        ></textarea>

        <div class="actions">

          <button
            class="cancel"
            @click="$emit('cancel')"
          >
            Close
          </button>

          <button
            class="danger"
            :disabled="!reason"
            @click="$emit('confirm', reason)"
          >
            Confirm Cancel
          </button>

        </div>

      </div>

    </div>
  </div>
</template>

<script>

export default {

name:"ActionModal",

props:{
type:String,
order:Object,
refund:Object,
requireEvidence: { type: Boolean, default: false }
},

data(){
return{
status:"",
reason:"",
refundReason:"",
previewFiles:[]
}
},

methods:{
  onFileChange(e){
    const files = Array.from(e.target.files)
    this.addFiles(files)
  },
  onDrop(e){
    const files = Array.from(e.dataTransfer.files)
    this.addFiles(files)
  },
  addFiles(files){
    files.forEach(f => {
      this.previewFiles.push({
        file: f,
        name: f.name,
        type: f.type,
        url: f.type.startsWith("image") ? URL.createObjectURL(f) : null
      })
    })
  },
  removeFile(i){
    this.previewFiles.splice(i, 1)
  },
  submitRefund(){
    this.$emit("confirm", {
      reason: this.refundReason,
      files: this.previewFiles.map(f => f.file)
    })
  }
}

}

</script>

<style scoped>

.modal-overlay{
position:fixed;
inset:0;
background:rgba(0,0,0,0.5);
display:flex;
justify-content:center;
align-items:center;
z-index:9999;
}

.modal{
background:white;
padding:30px;
border-radius:10px;
width:360px;
}

.order-id{
margin-bottom:10px;
}

.current{
margin-bottom:10px;
}

select{
width:100%;
padding:8px;
margin-top:10px;
}

textarea{
width:100%;
min-height:90px;
padding:10px;
margin-top:12px;
border-radius:6px;
border:1px solid #ddd;
resize:none;
}

.reason{
margin:15px 0;
}

.actions{
display:flex;
gap:10px;
justify-content:flex-end;
margin-top:20px;
}

.cancel{
background:#eee;
border:none;
padding:8px 14px;
cursor:pointer;
}

.confirm{
background:#FF642F;
color:white;
border:none;
padding:8px 14px;
cursor:pointer;
}

.reject{
background:#e74c3c;
color:white;
border:none;
padding:8px 14px;
cursor:pointer;
}

.approve{
background:#2ecc71;
color:white;
border:none;
padding:8px 14px;
cursor:pointer;
}

.danger{
background:#e74c3c;
color:white;
border:none;
padding:8px 14px;
cursor:pointer;
}

button:disabled{
opacity:0.5;
cursor:not-allowed;
}

.field{
margin-top:14px;
}

.field label{
display:block;
font-size:13px;
font-weight:600;
margin-bottom:6px;
color:#444;
}

.required{ color:#e74c3c; margin-left:2px; }
.optional{ color:#aaa; font-weight:400; margin-left:4px; }

.upload-area{
border:2px dashed #ddd;
border-radius:8px;
padding:14px;
cursor:pointer;
min-height:70px;
display:flex;
align-items:center;
justify-content:center;
transition:border-color 0.2s;
}

.upload-area:hover{ border-color:#FF642F; }

.upload-placeholder{
color:#aaa;
font-size:13px;
}

.preview-list{
display:flex;
flex-wrap:wrap;
gap:8px;
}

.preview-item{
position:relative;
}

.preview-img{
width:64px;
height:64px;
object-fit:cover;
border-radius:6px;
border:1px solid #eee;
}

.preview-video{
font-size:12px;
background:#f5f5f5;
padding:4px 8px;
border-radius:6px;
display:flex;
align-items:center;
}

.remove-file{
position:absolute;
top:-6px;
right:-6px;
width:18px;
height:18px;
border-radius:50%;
background:#e74c3c;
color:white;
border:none;
cursor:pointer;
font-size:10px;
display:flex;
align-items:center;
justify-content:center;
padding:0;
}



</style>