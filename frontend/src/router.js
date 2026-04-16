import { createRouter, createWebHistory } from 'vue-router';
import WelcomePage from './components/layout/WelcomePage.vue';
import LoginPage from './components/auth/LoginPage.vue';
import RegisterPage from './components/auth/RegisterPage.vue';
import VerifyLinkPage from './components/auth/VerifyLinkPage.vue';
import HomePage from './components/feed/HomePage.vue';
import FriendPage from './components/auth/FriendPage.vue';
import MarketplacePage from './components/marketplace/MarketplacePage.vue';
import MarketplaceDetail from './components/marketplace/MarketplaceDetail.vue'; 
import MessagePage from './components/messages/MessagePage.vue';
import NotificationPage from './components/notifications/NotificationPage.vue';
import ProfilePage from './components/profile/ProfilePage.vue';
import HiddenItems from './components/feed/HiddenItems.vue';
import SavedPosts from './components/feed/SavedPosts.vue';
import CheckoutPage from './components/orders/Checkout.vue';
import OrderPage from './components/orders/OrderPage.vue';
import OrderDetailPage from './components/orders/OrderDetailPage.vue';
import PaymentPage from './components/orders/PaymentPage.vue';
import CartPage from './components/orders/CartPage.vue';
import SellerOrders from './components/orders/SellerOrders.vue';
import AdminPage from './components/admin/AdminPage.vue';
import SettingPage from './components/profile/SettingPage.vue';
 


const routes = [
  { path: '/', component: WelcomePage },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/verify/:id', component: VerifyLinkPage },
  { path: '/home', component: HomePage },
  { path: '/friend', component: FriendPage },
  { path: '/marketplace', component: MarketplacePage }, 
  { path: '/marketplace/:id', component: MarketplaceDetail },
  { path: '/messages', component: MessagePage },
  { path: '/notification', component: NotificationPage },
  { path: '/profile', component: ProfilePage },
  { path: '/profile/:id', component: ProfilePage },
  { path: '/hidden', component: HiddenItems},
  { path: '/saved', component: SavedPosts},
  { path: '/checkout', component: CheckoutPage },
  { path:'/orders', component: OrderPage },
  { path: '/orders/:id', component: OrderDetailPage },
  { path: "/seller-orders/:id", component: OrderDetailPage },
  { path: '/seller-orders', component: SellerOrders },
  { path: '/payment/:id', component: PaymentPage },
  { path: '/cart', component: CartPage },
  { path: '/admin', component: AdminPage},
  { path: '/settings', component: SettingPage }

];
 
const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
