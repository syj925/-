<template>
  <view class="emoji-text">
    <!-- 使用rich-text渲染 -->
    <rich-text v-if="useRichText" :nodes="parsedNodes" :space="space" />
    
    <!-- 使用普通文本+图片渲染 -->
    <view v-else class="text-wrapper">
      <template v-for="(node, index) in parsedItems" :key="index">
        <text v-if="node.type === 'text'" class="text-node" :selectable="selectable">{{ node.text }}</text>
        <image 
          v-else-if="node.type === 'emoji'" 
          class="emoji-image" 
          :src="node.url" 
          :style="emojiStyle"
          mode="aspectFit"
        />
      </template>
    </view>
  </view>
</template>

<script>
import { useEmojiStore } from '@/stores/emoji';

export default {
  name: 'EmojiText',
  props: {
    content: {
      type: String,
      default: ''
    },
    useRichText: {
      type: Boolean,
      default: true
    },
    emojiSize: {
      type: [String, Number],
      default: 24
    },
    space: {
      type: String,
      default: 'nbsp'
    },
    selectable: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const emojiStore = useEmojiStore();
    return { emojiStore };
  },
  computed: {
    emojiStyle() {
      const size = typeof this.emojiSize === 'number' ? `${this.emojiSize}px` : this.emojiSize;
      return {
        width: size,
        height: size,
        verticalAlign: 'middle',
        margin: '0 2px'
      };
    },

    parsedNodes() {
      if (!this.content) return [];
      return this.emojiStore.parseEmojiToNodes(this.content);
    },

    parsedItems() {
      if (!this.content) return [];
      
      const items = [];
      const regex = this.emojiStore.emojiRegex;
      
      if (!regex) {
        return [{ type: 'text', text: this.content }];
      }
      
      let lastIndex = 0;
      let match;
      const re = new RegExp(regex.source, 'g');
      
      while ((match = re.exec(this.content)) !== null) {
        if (match.index > lastIndex) {
          items.push({
            type: 'text',
            text: this.content.slice(lastIndex, match.index)
          });
        }
        
        const code = match[0];
        const url = this.emojiStore.getEmojiUrl(code);
        
        if (url) {
          items.push({
            type: 'emoji',
            code,
            url
          });
        } else {
          items.push({
            type: 'text',
            text: code
          });
        }
        
        lastIndex = re.lastIndex;
      }
      
      if (lastIndex < this.content.length) {
        items.push({
          type: 'text',
          text: this.content.slice(lastIndex)
        });
      }
      
      return items;
    }
  },
  mounted() {
    this.ensureInitialized();
  },
  methods: {
    async ensureInitialized() {
      if (!this.emojiStore.initialized) {
        await this.emojiStore.initialize();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.emoji-text {
  display: inline;
  word-wrap: break-word;
  word-break: break-all;
}

.text-wrapper {
  display: inline;
}

.text-node {
  display: inline;
}

.emoji-image {
  display: inline-block;
  vertical-align: middle;
}
</style>
