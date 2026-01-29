/**
 * Unicode表情映射配置
 * 格式：[code] → emoji字符
 * 
 * 使用方式：
 * 1. 评论输入：用户点击表情插入 [笑哭] 到内容
 * 2. 数据库存储：content = "今天很开心[笑哭]"
 * 3. 前端渲染：将 [笑哭] 替换为 😂 emoji字符显示
 */

export const EMOJI_MAP = {
  // 基础表情
  '[笑哭]': '😂',
  '[大笑]': '😄',
  '[微笑]': '😊',
  '[害羞]': '😳',
  '[可爱]': '🥰',
  '[亲亲]': '😘',
  '[色]': '😍',
  '[调皮]': '😜',
  '[吐舌]': '😛',
  '[坏笑]': '😏',
  
  // 手势表情
  '[点赞]': '👍',
  '[加油]': '💪',
  '[胜利]': '✌️',
  '[OK]': '👌',
  '[拳头]': '👊',
  '[握手]': '🤝',
  '[鼓掌]': '👏',
  '[祈祷]': '🙏',
  '[比心]': '🫶',
  '[爱你]': '🤟',
  
  // 爱心系列
  '[爱心]': '❤️',
  '[心碎]': '💔',
  '[红心]': '♥️',
  '[粉心]': '💗',
  '[闪心]': '💖',
  
  // 情绪表情
  '[测试]': '😊',
  '[开心]': '😄',
  '[哈哈]': '😆',
  '[嘻嘻]': '😁',
  '[呵呵]': '😊',
  '[嘿嘿]': '😏',
  '[嘘]': '🤫',
  '[惊讶]': '😮',
  '[震惊]': '😱',
  '[晕]': '😵',
  '[流汗]': '😅',
  '[尴尬]': '😓',
  '[无语]': '😑',
  '[无奈]': '😔',
  '[疑问]': '🤔',
  '[思考]': '🤔',
  
  // 负面情绪
  '[生气]': '😠',
  '[愤怒]': '😡',
  '[难过]': '😢',
  '[哭]': '😭',
  '[流泪]': '😿',
  '[委屈]': '🥺',
  '[失望]': '😞',
  '[郁闷]': '😔',
  
  // 其他表情
  '[睡觉]': '😴',
  '[困]': '😪',
  '[生病]': '🤒',
  '[口罩]': '😷',
  '[恶魔]': '😈',
  '[天使]': '😇',
  '[鬼]': '👻',
  '[外星人]': '👽',
  
  // 符号表情
  '[感叹]': '❗',
  '[问号]': '❓',
  '[星星]': '⭐',
  '[火]': '🔥',
  '[庆祝]': '🎉',
  '[礼物]': '🎁',
  '[气球]': '🎈',
  '[蛋糕]': '🎂',
  
  // 动物
  '[狗]': '🐶',
  '[猫]': '🐱',
  '[熊]': '🐻',
  '[兔子]': '🐰',
  '[猪]': '🐷',
  '[猴]': '🐵',
  '[鸡]': '🐔',
  '[企鹅]': '🐧',
  
  // 食物
  '[西瓜]': '🍉',
  '[苹果]': '🍎',
  '[香蕉]': '🍌',
  '[咖啡]': '☕',
  '[蛋糕]': '🍰',
  '[汉堡]': '🍔',
  '[披萨]': '🍕',
  '[啤酒]': '🍺',
  
  // 数字/特殊
  '[666]': '👍👍👍',
  '[强]': '💪',
  '[弱]': '👎',
  '[耶]': '✌️'
};

/**
 * 获取所有emoji列表（用于表情面板展示）
 */
export function getEmojiList() {
  return Object.entries(EMOJI_MAP).map(([code, emoji]) => ({
    code,
    emoji,
    name: code.replace(/[\[\]]/g, '')
  }));
}

/**
 * 根据关键字搜索emoji
 */
export function searchEmoji(keyword) {
  if (!keyword) return getEmojiList();
  
  return getEmojiList().filter(item => 
    item.name.includes(keyword) || 
    item.code.includes(keyword)
  );
}

/**
 * 渲染文本中的emoji代码
 * @param {string} text - 原始文本
 * @returns {string} - 渲染后的文本
 */
export function renderEmoji(text) {
  if (!text) return text;
  
  let result = text;
  for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
    result = result.replaceAll(code, emoji);
  }
  return result;
}

/**
 * 解析文本为节点数组（用于rich-text组件）
 * @param {string} text - 原始文本
 * @returns {Array} - 节点数组
 */
export function parseEmojiToNodes(text) {
  if (!text) return [{ type: 'text', text: '' }];
  
  // 构建正则表达式匹配所有emoji代码
  const codes = Object.keys(EMOJI_MAP).map(code => 
    code.replace(/[[\]]/g, '\\$&')
  ).join('|');
  const regex = new RegExp(`(${codes})`, 'g');
  
  const nodes = [];
  let lastIndex = 0;
  let match;
  
  regex.lastIndex = 0;
  
  while ((match = regex.exec(text)) !== null) {
    // 添加匹配前的文本
    if (match.index > lastIndex) {
      nodes.push({
        type: 'text',
        text: text.substring(lastIndex, match.index)
      });
    }
    
    // 添加emoji字符
    const emoji = EMOJI_MAP[match[0]];
    nodes.push({
      type: 'text',
      text: emoji,
      attrs: {
        style: 'font-size: 1.2em;'
      }
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // 添加剩余文本
  if (lastIndex < text.length) {
    nodes.push({
      type: 'text',
      text: text.substring(lastIndex)
    });
  }
  
  return nodes.length > 0 ? nodes : [{ type: 'text', text }];
}

// 反向映射：emoji字符 → [code]
// 用于发送时将输入的emoji转换回code格式存储
export const EMOJI_REVERSE_MAP = Object.fromEntries(
  Object.entries(EMOJI_MAP).map(([code, emoji]) => [emoji, code])
);

/**
 * 将文本中的emoji字符转换为[code]格式
 * @param {string} text 包含emoji字符的文本
 * @returns {string} 转换后的文本
 */
export function emojiToCode(text) {
  if (!text) return text;
  let result = text;
  for (const [emoji, code] of Object.entries(EMOJI_REVERSE_MAP)) {
    result = result.split(emoji).join(code);
  }
  return result;
}

export default {
  EMOJI_MAP,
  EMOJI_REVERSE_MAP,
  getEmojiList,
  searchEmoji,
  renderEmoji,
  parseEmojiToNodes,
  emojiToCode
};
