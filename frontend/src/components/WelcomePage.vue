<template>
  <div class="welcome-wrapper">
    <!-- Light Overlay -->
    <div class="overlay"></div>

    <!-- Hero Card -->
    <div class="hero-content">
      <h1 class="title">
        Share Your Best <span>Recipes</span>
      </h1>

      <p class="subtitle">
        HT Social is a cooking community where you can discover, share, and save
        delicious recipes from food lovers around the world.
      </p>

      <!-- Buttons -->
      <div class="buttons">
        <router-link to="/login">
          <button class="btn primary">Login</button>
        </router-link>

        <router-link to="/register">
          <button class="btn secondary">Sign Up</button>
        </router-link>
      </div>

      <!-- Quote -->
      <p class="quote">
        Cooking tastes better when shared ❤️
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "WelcomePage"
};
</script>

<style scoped>
/* ===============================
   FULL BACKGROUND FOOD HERO
================================ */
.welcome-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  /* ✅ FIX mobile dính sát */
  padding: 0 18px;

  /* ✅ Food Background */
  background-image: url("https://images.unsplash.com/photo-1504674900247-0877df9cc836");
  background-size: cover;
  background-position: center;

  position: relative;
  overflow: hidden;
  font-family: "Inter", sans-serif;
}

/* ===============================
   LIGHT OVERLAY (BRIGHT)
================================ */
.overlay {
  position: absolute;
  inset: 0;

  /* ✅ Bright overlay instead of dark */
  background: rgba(255, 255, 255, 0.45);

  /* ✅ Blur effect for Pinterest vibe */
  backdrop-filter: blur(4px);
}

/* ===============================
   HERO CONTENT CARD
================================ */
.hero-content {
  position: relative;
  z-index: 2;

  max-width: 750px;
  width: 100%;

  padding: 75px 65px;
  text-align: center;
  border-radius: 30px;

  /* ✅ Clean white card */
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0px 18px 45px rgba(0, 0, 0, 0.18);

  animation: fadeUp 1s ease;
}

/* ===============================
   TITLE
================================ */
.title {
  font-size: 52px;
  font-weight: 900;
  margin-bottom: 20px;
  color: #222;
}

.title span {
  color: #ff642f;
}

/* ===============================
   SUBTITLE
================================ */
.subtitle {
  font-size: 17px;
  line-height: 1.7;
  color: #555;
  margin-bottom: 45px;
}

/* ===============================
   BUTTONS
================================ */
.buttons {
  display: flex;
  justify-content: center;
  gap: 18px;
}

.btn {
  min-width: 175px;
  height: 54px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s ease;
  border: none;
}

/* Primary Button */
.primary {
  background: #ff642f;
  color: white;
}

.primary:hover {
  background: #e85522;
  transform: translateY(-3px);
}

/* Secondary Button */
.secondary {
  background: white;
  border: 2px solid #ff642f;
  color: #ff642f;
}

.secondary:hover {
  background: #ff642f;
  color: white;
  transform: translateY(-3px);
}

/* ===============================
   QUOTE
================================ */
.quote {
  margin-top: 40px;
  font-size: 14px;
  color: #777;
  font-style: italic;
}

/* ===============================
   ANIMATION
================================ */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(35px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===============================
   RESPONSIVE FIX PERFECT
================================ */
@media (max-width: 750px) {
  .hero-content {
    padding: 55px 22px;
    border-radius: 22px;
  }

  .title {
    font-size: 34px;
  }

  .subtitle {
    font-size: 15px;
  }

  .buttons {
    flex-direction: column;
    gap: 14px;
  }

  .btn {
    width: 100%;
  }
}

/* Extra small mobile */
@media (max-width: 420px) {
  .hero-content {
    padding: 45px 18px;
  }

  .title {
    font-size: 28px;
  }
}
</style>
