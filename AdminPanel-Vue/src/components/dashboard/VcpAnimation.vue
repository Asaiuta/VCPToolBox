<template>
  <div class="vcp-animation-container">
    <div class="vcp-logo-container">
      <img
        src="/VCPLogo2.png"
        alt="VCPToolBox Logo"
        class="vcp-logo"
        width="200"
        height="80"
        loading="eager"
      />
    </div>
    <canvas ref="canvas" id="vcp-animation-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useAppStore } from "@/stores/app";

const canvas = ref<HTMLCanvasElement | null>(null);
const appStore = useAppStore();
const animationsEnabled = computed(() => appStore.animationsEnabled);
const theme = computed(() => appStore.theme);

let animationCtx: CanvasRenderingContext2D | null = null;
let animationFrameId: number | null = null;
let isAnimating = false;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

let particles: Particle[] = [];

function stopAnimationLoop() {
  isAnimating = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function startAnimationLoop() {
  if (
    isAnimating ||
    !animationsEnabled.value ||
    !animationCtx ||
    !canvas.value
  ) {
    return;
  }

  isAnimating = true;
  animationFrameId = requestAnimationFrame(animate);
}

// 初始化 VCP 粒子动画
function initVCPAnimation() {
  if (!canvas.value) return;

  animationCtx = canvas.value.getContext("2d");
  if (!animationCtx) return;

  // 设置 canvas 尺寸
  const container = canvas.value.parentElement;
  if (container) {
    canvas.value.width = container.clientWidth;
    canvas.value.height = container.clientHeight;
  }

  // 初始化粒子
  initParticles();

  // 开始动画循环
  startAnimationLoop();
}

function initParticles() {
  if (!canvas.value) return;

  particles = [];
  const particleCount = Math.floor(
    (canvas.value.width * canvas.value.height) / 4000
  );

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.value.width,
      y: Math.random() * canvas.value.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
    });
  }
}

function animate() {
  if (
    !isAnimating ||
    !animationCtx ||
    !canvas.value ||
    !animationsEnabled.value
  ) {
    stopAnimationLoop();
    return;
  }

  const ctx = animationCtx;
  const width = canvas.value.width;
  const height = canvas.value.height;

  // 清空画布
  ctx.clearRect(0, 0, width, height);

  // 绘制粒子
  particles.forEach((particle) => {
    // 更新位置
    particle.x += particle.vx;
    particle.y += particle.vy;

    // 边界检测
    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > height) particle.vy *= -1;

    // 绘制粒子
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle =
      theme.value === "dark"
        ? `rgba(56, 189, 248, ${particle.alpha})`
        : `rgba(2, 132, 199, ${particle.alpha})`;
    ctx.fill();
  });

  // 绘制连接线
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle =
          theme.value === "dark"
            ? `rgba(56, 189, 248, ${0.1 * (1 - distance / 100)})`
            : `rgba(2, 132, 199, ${0.1 * (1 - distance / 100)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  animationFrameId = requestAnimationFrame(animate);
}

function handleResize() {
  if (!canvas.value) return;

  const container = canvas.value.parentElement;
  if (container) {
    canvas.value.width = container.clientWidth;
    canvas.value.height = container.clientHeight;
    initParticles();
  }
}

watch(animationsEnabled, (enabled) => {
  if (enabled) {
    startAnimationLoop();
    return;
  }

  stopAnimationLoop();
});

onMounted(() => {
  initVCPAnimation();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  stopAnimationLoop();
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.vcp-animation-container {
  position: relative;
  width: 100%;
  height: 250px;
  margin-bottom: 30px;
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--secondary-bg);
  border: 1px solid var(--border-color);
}

.vcp-logo-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  text-align: center;
}

.vcp-logo {
  max-width: 800px;
  max-height: 80%;
  height: auto;
  animation: laser-outline-orbit 4s infinite linear;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.vcp-logo:active {
  transform: scale(0.95);
}

@keyframes laser-outline-orbit {
  0% {
    filter: drop-shadow(0 -7px 4px var(--highlight-text));
  }
  25% {
    filter: drop-shadow(7px 0 4px var(--highlight-text));
  }
  50% {
    filter: drop-shadow(0 7px 4px var(--highlight-text));
  }
  75% {
    filter: drop-shadow(-7px 0 4px var(--highlight-text));
  }
  100% {
    filter: drop-shadow(0 -7px 4px var(--highlight-text));
  }
}

#vcp-animation-canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

@media (max-width: 768px) {
  .vcp-animation-container {
    height: 180px;
    margin-bottom: 20px;
  }

  .vcp-logo {
    max-width: 220px;
  }
}
</style>
