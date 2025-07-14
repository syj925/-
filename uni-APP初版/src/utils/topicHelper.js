/**
 * 话题处理工具函数
 */

/**
 * 解析文本内容中的话题标签
 * @param {string} content - 要解析的文本内容
 * @returns {Array} - 解析后的片段数组，每个片段包含类型和内容
 */
export const parseTopics = (content) => {
  if (!content) return [];
  
  const segments = [];
  const regex = /#([^\s#]+)/g;
  let lastIndex = 0;
  let match;
  
  // 查找所有话题标签
  while ((match = regex.exec(content)) !== null) {
    // 添加话题前的普通文本
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }
    
    // 添加话题
    segments.push({
      type: 'topic',
      content: match[1], // 不包含#号
      fullMatch: match[0] // 包含#号的完整匹配
    });
    
    // 更新lastIndex为匹配结束位置
    lastIndex = match.index + match[0].length;
  }
  
  // 添加最后一段普通文本
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }
  
  return segments;
};

/**
 * 从内容中提取话题名称数组
 * @param {string} content - 要解析的文本内容
 * @returns {Array} - 话题名称数组
 */
export const extractTopics = (content) => {
  if (!content) return [];
  
  const topics = [];
  const regex = /#([^\s#]+)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    topics.push(match[1]);
  }
  
  return topics;
};

/**
 * 将话题标签应用特殊样式
 * @param {string} content - 包含话题标签的文本内容
 * @returns {string} - 应用样式后的HTML字符串
 */
export const highlightTopics = (content) => {
  if (!content) return '';
  
  return content.replace(/#([^\s#]+)/g, '<span class="topic-tag">#$1</span>');
};

/**
 * 在富文本中渲染带样式的话题标签
 * @param {string} content - 包含话题标签的文本内容
 * @returns {string} - 富文本HTML字符串
 */
export const renderRichText = (content) => {
  if (!content) return '';
  
  // 将换行符转换为<br>
  const withLineBreaks = content.replace(/\n/g, '<br>');
  
  // 高亮话题标签
  return highlightTopics(withLineBreaks);
};

export default {
  parseTopics,
  extractTopics,
  highlightTopics,
  renderRichText
}; 