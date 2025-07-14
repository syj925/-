import { createSSRApp } from '@dcloudio/uni-h5-vue'
import { createPinia } from 'pinia'
import App from './App'
import imagePathHelper from './utils/imagePathHelper'

export function createApp() {
	const app = createSSRApp(App)
	const pinia = createPinia()
	
	app.use(pinia)
	
	// 添加全局图片路径助手
	app.config.globalProperties.$imageHelper = imagePathHelper
	app.config.globalProperties.$getImage = imagePathHelper.getImage
	
	return {
		app
	}
}
