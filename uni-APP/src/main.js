import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import api from './api/index';
import utils from './utils';
import logger from './utils/logger';

export function createApp() {
	const app = createSSRApp(App);
	
	// 创建并使用Pinia状态管理
	const pinia = createPinia();
	app.use(pinia);
	
	// 添加全局API
	app.config.globalProperties.$api = api;
	app.config.globalProperties.$utils = utils;
	app.config.globalProperties.$logger = logger;
	
	return {
		app,
		pinia
	};
}
