<template>
  <view class="topic-text-container">
    <block v-for="(segment, index) in parsedContent" :key="index">
      <text 
        v-if="segment.type === 'topic'" 
        class="topic-text"
        @tap="handleTopicClick(segment.content)"
      >#{{ segment.content }}</text>
      <text v-else class="normal-text">{{ segment.content }}</text>
    </block>
  </view>
</template>

<script>
export default {
  name: 'TopicText',
  props: {
    content: {
      type: String,
      default: ''
    }
  },
  computed: {
    parsedContent() {
      if (!this.content) return [];
      
      // 解析内容，将话题标签和普通文本分开
      const segments = [];
      const regex = /#([^\s#]+)/g;
      let lastIndex = 0;
      let match;
      
      // 查找所有话题标签
      while ((match = regex.exec(this.content)) !== null) {
        // 添加话题前的普通文本
        if (match.index > lastIndex) {
          segments.push({
            type: 'text',
            content: this.content.substring(lastIndex, match.index)
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
      if (lastIndex < this.content.length) {
        segments.push({
          type: 'text',
          content: this.content.substring(lastIndex)
        });
      }
      
      return segments;
    }
  },
  methods: {
    handleTopicClick(topicName) {
      console.log('话题点击:', topicName);
      
      // 跳转到话题详情页
      this.$emit('topic-click', topicName);
      
      // 直接跳转到话题页
      uni.navigateTo({
        url: `/pages/topic/topic-detail?name=${encodeURIComponent(topicName)}`
      });
    }
  }
}
</script>

<style>
.topic-text-container {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.topic-text {
  color: #4A90E2;
  font-weight: 600;
  padding: 0 2rpx;
}

.topic-text:active {
  opacity: 0.8;
}
</style> 