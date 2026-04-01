<template>
  <div class="login-page">
    <div class="background-animation"></div>

    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <img src="/VCPLogo2.png" alt="VCP Logo" @error="onImageError" />
          <p>控制中心管理面板</p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="username">用户名</label>
            <div class="input-wrapper">
              <input
                type="text"
                id="username"
                v-model="username"
                placeholder="请输入用户名"
                autocomplete="username"
                name="username"
                required
              />
              <span class="icon" aria-hidden="true">👤</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">密码</label>
            <div class="input-wrapper">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="password"
                placeholder="请输入密码"
                autocomplete="current-password"
                name="password"
                required
              />
              <span class="icon" aria-hidden="true">🔒</span>
              <button
                type="button"
                class="password-toggle"
                @click="togglePassword"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                :aria-pressed="showPassword"
              >
                <span aria-hidden="true">{{ showPassword ? "🙈" : "👁" }}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="login-button"
            :disabled="isLoading"
            :class="{ loading: isLoading }"
          >
            <span class="spinner"></span>
            <span class="btn-text">登 录</span>
          </button>

          <div v-if="message" :class="['message', messageType]">
            {{ message }}
          </div>
        </form>

        <p class="footer-text">安全连接 · 仅限授权管理员访问</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { ROUTES } from "@/constants/routes";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const isLoading = ref(false);
const message = ref("");
const messageType = ref<"error" | "success">("error");

function onImageError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = "none";
}

function togglePassword() {
  showPassword.value = !showPassword.value;
}

function resolveSafeRedirect(target: unknown): string {
  if (typeof target !== "string" || !target.startsWith("/")) {
    return ROUTES.DASHBOARD;
  }

  const resolved = router.resolve(target);
  if (!resolved.matched.length || resolved.name === "Login") {
    return ROUTES.DASHBOARD;
  }

  return resolved.fullPath;
}

async function handleLogin() {
  if (!username.value || !password.value) {
    message.value = "请输入用户名和密码";
    messageType.value = "error";
    return;
  }

  isLoading.value = true;
  message.value = "";

  try {
    const result = await authStore.login(username.value, password.value);

    if (result.success) {
      message.value = "登录成功，正在跳转…";
      messageType.value = "success";

      // 等待状态更新后跳转
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 优先回跳到登录前目标页（无效 redirect 自动回退到仪表盘）
      const redirect = resolveSafeRedirect(route.query.redirect);
      router.push(redirect);
    } else {
      message.value = result.message || "用户名或密码错误";
      messageType.value = "error";
    }
  } catch (error) {
    console.error("Login error:", error);
    message.value = "连接服务器失败，请检查网络";
    messageType.value = "error";
  } finally {
    isLoading.value = false;
  }
}

// 页面加载时检查是否已登录（异步执行）
if (!authStore.isLoading && authStore.isAuthenticated) {
  router.push({ name: "Dashboard" });
} else if (!authStore.isLoading) {
  // 仅在未加载时检查一次
  authStore.checkAuth().then((isAuth) => {
    if (isAuth) {
      router.push({ name: "Dashboard" });
    }
  });
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary, #0d1117);
  overflow: hidden;
  position: relative;
}

.background-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.5;
}

.background-animation::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
      circle at 20% 80%,
      rgba(88, 166, 255, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 20%,
      rgba(136, 87, 255, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 40% 40%,
      rgba(63, 185, 80, 0.05) 0%,
      transparent 40%
    );
  animation: backgroundFloat 20s ease-in-out infinite;
}

@keyframes backgroundFloat {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(2%, 2%) rotate(1deg);
  }
  50% {
    transform: translate(0, 4%) rotate(0deg);
  }
  75% {
    transform: translate(-2%, 2%) rotate(-1deg);
  }
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.login-card {
  background: var(--bg-secondary, #161b22);
  border: 1px solid var(--border-color, #30363d);
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-section img {
  max-width: 200px;
  height: auto;
  margin-bottom: 8px;
  filter: drop-shadow(0 4px 12px rgba(88, 166, 255, 0.3));
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.logo-section p {
  color: var(--text-secondary, #8b949e);
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #e6edf3);
}

.input-wrapper {
  position: relative;
}

.input-wrapper .icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #8b949e);
  font-size: 18px;
  pointer-events: none;
  transition: color 0.2s;
}

.form-group input {
  width: 100%;
  padding: 14px 14px 14px 44px;
  background: var(--bg-tertiary, #21262d);
  border: 1px solid var(--border-color, #30363d);
  border-radius: 8px;
  font-size: 15px;
  color: var(--text-primary, #e6edf3);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus-visible {
  outline: 2px solid var(--accent-color, #58a6ff);
  outline-offset: 2px;
  border-color: var(--accent-color, #58a6ff);
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
}

.form-group input:focus:not(:focus-visible) {
  border-color: var(--accent-color, #58a6ff);
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
}

.password-toggle {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary, #8b949e);
  cursor: pointer;
  padding: 4px;
  font-size: 18px;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: var(--text-primary, #e6edf3);
}

.login-button {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, var(--accent-color, #58a6ff), #7c3aed);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.2s ease;
  position: relative;
  overflow: hidden;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(88, 166, 255, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-button .spinner {
  display: none;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

.login-button.loading .spinner {
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.error {
  background: rgba(248, 81, 73, 0.15);
  border: 1px solid rgba(248, 81, 73, 0.4);
  color: var(--error-color, #f85149);
}

.message.success {
  background: rgba(63, 185, 80, 0.15);
  border: 1px solid rgba(63, 185, 80, 0.4);
  color: var(--success-color, #3fb950);
}

.footer-text {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: var(--text-secondary, #8b949e);
}

@media (max-width: 480px) {
  .login-page {
    align-items: stretch;
    overflow-y: auto;
    padding: 16px 0;
  }

  .login-container {
    max-width: none;
    padding: 16px;
  }

  .login-card {
    padding: 32px 24px;
    border-radius: 14px;
  }

  .logo-section {
    margin-bottom: 24px;
  }

  .logo-section img {
    max-width: 160px;
  }

  .logo-section p {
    font-size: 13px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group input {
    padding: 13px 42px 13px 42px;
    font-size: 14px;
  }

  .input-wrapper .icon {
    left: 12px;
    font-size: 16px;
  }

  .password-toggle {
    right: 12px;
  }

  .login-button {
    padding: 13px 20px;
    font-size: 15px;
  }

  .message {
    padding: 10px 12px;
    font-size: 13px;
  }

  .footer-text {
    margin-top: 20px;
    line-height: 1.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .background-animation::before,
  .logo-section img,
  .login-button .spinner,
  .message {
    animation: none;
  }

  .form-group input,
  .password-toggle,
  .login-button {
    transition: none;
  }
}
</style>
