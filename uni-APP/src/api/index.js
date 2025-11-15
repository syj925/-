/**
 * API入口文件
 */
import { http, updateBaseUrl, resetBaseUrl } from './request';

// 导入API模块
import userApi from './modules/user';
import postApi from './modules/post';
import commentApi from './modules/comment';
import messageApi from './modules/message';
import privateMessageApi from './modules/private-message';
import followApi from './modules/follow';
import likeApi from './modules/like';
import favoriteApi from './modules/favorite';
import topicApi from './modules/topic';
import categoryApi from './modules/category';
import uploadApi from './modules/upload';
import searchApi from './modules/search';
import eventApi from './modules/event';
import bannerApi from './modules/banner';
import badgeApi from './modules/badge';
import tagApi from './modules/tag';

// 创建API实例
const userApiInstance = userApi(http);
const postApiInstance = postApi(http);
const commentApiInstance = commentApi(http);
const messageApiInstance = messageApi(http);
const privateMessageApiInstance = privateMessageApi(http);
const followApiInstance = followApi(http);
const likeApiInstance = likeApi(http);
const favoriteApiInstance = favoriteApi(http);
const topicApiInstance = topicApi(http);
const categoryApiInstance = categoryApi(http);
const uploadApiInstance = uploadApi(http);
const searchApiInstance = searchApi(http);
const eventApiInstance = eventApi;
const bannerApiInstance = bannerApi(http);
const badgeApiInstance = badgeApi(http);
const tagApiInstance = tagApi(http);

// 命名导出
export {
  http,
  updateBaseUrl,
  resetBaseUrl,
  userApiInstance as userApi,
  postApiInstance as postApi,
  commentApiInstance as commentApi,
  messageApiInstance as messageApi,
  privateMessageApiInstance as privateMessageApi,
  followApiInstance as followApi,
  likeApiInstance as likeApi,
  favoriteApiInstance as favoriteApi,
  topicApiInstance as topicApi,
  categoryApiInstance as categoryApi,
  uploadApiInstance as uploadApi,
  searchApiInstance as searchApi,
  eventApiInstance as eventApi,
  bannerApiInstance as bannerApi,
  badgeApiInstance as badgeApi,
  tagApiInstance as tagApi
};

// 默认导出
export default {
  http, // 导出http实例，便于访问baseURL和直接调用请求方法
  updateBaseUrl, // 导出更新服务器地址方法
  resetBaseUrl, // 导出重置服务器地址方法
  user: userApiInstance,
  post: postApiInstance,
  comment: commentApiInstance,
  message: messageApiInstance,
  privateMessage: privateMessageApiInstance,
  follow: followApiInstance,
  like: likeApiInstance,
  favorite: favoriteApiInstance,
  topic: topicApiInstance,
  category: categoryApiInstance,
  upload: uploadApiInstance,
  search: searchApiInstance,
  event: eventApiInstance,
  banner: bannerApiInstance,
  badge: badgeApiInstance,
  tag: tagApiInstance
};