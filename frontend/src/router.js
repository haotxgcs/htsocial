import { createRouter, createWebHistory } from 'vue-router';
import WelcomePage from './components/WelcomePage.vue';
import LoginPage from './components/LoginPage.vue';
import RegisterPage from './components/RegisterPage.vue';
import VerifyLinkPage from './components/VerifyLinkPage.vue';
import HomePage from './components/HomePage.vue';
import FriendPage from './components/FriendPage.vue';
import MarketplacePage from './components/MarketplacePage.vue';
import GroupPage from './components/GroupPage.vue';
import GamePage from './components/GamePage.vue';
import MessagePage from './components/MessagePage.vue';
import NotificationPage from './components/NotificationPage.vue';
import ProfilePage from './components/ProfilePage.vue';
import EditPostPage from './components/EditPostPage.vue';
import HiddenPosts from './components/HiddenPosts.vue';
import HiddenSharedPosts from './components/HiddenSharedPosts.vue';
import HiddenItems from './components/HiddenItems.vue'; // đường dẫn tuỳ bạn đặt



const routes = [
  { path: '/', component: WelcomePage },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/verify/:id', component: VerifyLinkPage },
  { path: '/home', component: HomePage },
  { path: '/friend', component: FriendPage },
  { path: '/marketplace', component: MarketplacePage },
  { path: '/group', component: GroupPage },
  { path: '/game', component: GamePage },
  { path: '/message', component: MessagePage },
  { path: '/notification', component: NotificationPage },
  { path: '/profile', component: ProfilePage },
  { path: '/posts/:id/edit', component: EditPostPage },
  { path: "/hidden-posts", component: HiddenPosts},
  {path: '/hidden-shares', component: HiddenSharedPosts},
  { path: '/hidden', component: HiddenItems}
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
