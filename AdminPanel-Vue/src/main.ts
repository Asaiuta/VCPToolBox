import { createApp } from "vue";
import { createPinia } from "pinia";
import "@fontsource/material-symbols-outlined/400.css";
import App from "./App.vue";
import router from "./router";
import "./style/index.css";

// 导入懒加载指令
import lazyDirective from "./directives/lazy";

const app = createApp(App);
const pinia = createPinia();

// 注册全局指令
app.directive("lazy", lazyDirective);

app.use(pinia);
app.use(router);
app.mount("#app");
