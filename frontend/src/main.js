import { createApp } from 'vue';
import App from './App.vue';
import router from './router.js';
import axios from "axios";

// 1. Configure Base URL
axios.defaults.baseURL = "http://localhost:3000";

// 2. Add Response Interceptor (Global Gatekeeper)
// This runs for every response received from the backend
axios.interceptors.response.use(
  (response) => {
    // If the response is successful (status 200-299), just return the data
    return response;
  },
  (error) => {
    // If an error occurs
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or logged out from another device (401).");

      // Step 1: Clear local storage
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Step 2: Redirect to Login page
      // We check if the user is not already on the login page to avoid loops
      if (router.currentRoute.value.path !== '/login') {
         router.push('/login');
      }
    }
    
    // Pass the error back to the specific component (in case they want to handle it too)
    return Promise.reject(error);
  }
);

const app = createApp(App);

app.use(router);

// Attach axios to global properties
app.config.globalProperties.$axios = axios;

app.mount('#app');