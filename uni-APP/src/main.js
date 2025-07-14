import { createSSRApp } from "vue";
import App from "./App.vue";
import api from './api/index';
import utils from './utils';

export function createApp() {
	const app = createSSRApp(App);
	
	// 添加全局API
	app.config.globalProperties.$api = api;
	app.config.globalProperties.$utils = utils;
	
	return {
		app
	};
}
