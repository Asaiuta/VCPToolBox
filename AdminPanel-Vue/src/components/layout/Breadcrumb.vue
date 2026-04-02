<template>
  <nav class="breadcrumb" aria-label="面包屑导航">
    <ol>
      <li>
        <a href="#" @click.prevent="goToDashboard">
          <span class="material-symbols-outlined">home</span>
        </a>
      </li>
      <li v-if="currentPageTitle" class="breadcrumb-separator">
        <span class="material-symbols-outlined">chevron_right</span>
      </li>
      <li
        v-if="currentPageTitle"
        class="breadcrumb-current"
        aria-current="page"
      >
        {{ currentPageTitle }}
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { resolveRouteTitle } from "@/utils/navigation";

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const navItems = computed(() => appStore.navItems);
const plugins = computed(() => appStore.plugins);

const currentPageTitle = computed(() =>
  resolveRouteTitle(route, navItems.value, plugins.value)
);

function goToDashboard() {
  router.push({ name: "Dashboard" });
}
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 20px;
}

.breadcrumb ol {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 8px;
}

.breadcrumb li {
  display: flex;
  align-items: center;
}

.breadcrumb a {
  display: flex;
  align-items: center;
  color: var(--secondary-text);
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 6px;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.breadcrumb a:hover {
  background-color: var(--accent-bg);
  color: var(--primary-text);
}

.breadcrumb-separator {
  color: var(--secondary-text);
  display: flex;
  align-items: center;
}

.breadcrumb-separator .material-symbols-outlined {
  font-size: 18px;
}

.breadcrumb-current {
  color: var(--primary-text);
  font-weight: 500;
  padding: 6px 10px;
  background-color: var(--accent-bg);
  border-radius: 6px;
}

@media (max-width: 768px) {
  .breadcrumb {
    margin-bottom: 16px;
  }

  .breadcrumb ol {
    gap: 6px;
    min-width: 0;
  }

  .breadcrumb li {
    min-width: 0;
  }

  .breadcrumb a {
    padding: 6px 8px;
  }

  .breadcrumb-current {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
