<template>
  <view :class="['app-icon', `app-icon-${name}`, sizeClass, customClass]" :style="iconStyle"></view>
</template>

<script>
export default {
  name: 'AppIcon',
  props: {
    // 图标名称
    name: {
      type: String,
      required: true
    },
    // 图标大小
    size: {
      type: [String, Number],
      default: 'md',
      validator: (value) => {
        // 支持预定义尺寸或数字（包括字符串形式的数字）
        if (typeof value === 'number') return value > 0;
        if (typeof value === 'string') {
          // 检查是否是预定义尺寸
          if (['xs', 'sm', 'md', 'lg', 'xl'].includes(value)) return true;
          // 检查是否是数字字符串
          const numValue = Number(value);
          return !isNaN(numValue) && numValue > 0;
        }
        return false;
      }
    },
    // 图标颜色
    color: {
      type: String,
      default: ''
    },
    // 自定义类名
    customClass: {
      type: String,
      default: ''
    }
  },
  computed: {
    sizeClass() {
      // 如果是数字或数字字符串，不添加尺寸类，通过样式控制
      if (typeof this.size === 'number') {
        return '';
      }
      if (typeof this.size === 'string' && !isNaN(Number(this.size))) {
        return '';
      }
      return `app-icon-${this.size}`;
    },
    iconStyle() {
      const style = {};

      // 设置颜色
      if (this.color) {
        style['--icon-color'] = this.color;
      }

      // 设置数字尺寸（支持数字和数字字符串）
      if (typeof this.size === 'number' || (typeof this.size === 'string' && !isNaN(Number(this.size)))) {
        const numSize = typeof this.size === 'number' ? this.size : Number(this.size);
        const sizeValue = `${numSize * 2}rpx`; // 转换为rpx单位
        style.width = sizeValue;
        style.height = sizeValue;
      }

      return style;
    }
  }
}
</script>

<style lang="scss">
.app-icon {
  display: inline-block;
  position: relative;
  box-sizing: border-box;
  
  // 图标尺寸
  &-xs {
    width: 16rpx;
    height: 16rpx;
  }
  
  &-sm {
    width: 24rpx;
    height: 24rpx;
  }
  
  &-md {
    width: 32rpx;
    height: 32rpx;
  }
  
  &-lg {
    width: 40rpx;
    height: 40rpx;
  }
  
  &-xl {
    width: 48rpx;
    height: 48rpx;
  }
  
  // 点赞图标
  &-like {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 10%;
      left: 15%;
      width: 70%;
      height: 60%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #666);
      border-top-left-radius: 50px;
      border-top-right-radius: 50px;
      transform: rotate(-45deg);
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 10%;
      left: 15%;
      width: 35%;
      height: 60%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #666);
      border-top-left-radius: 50px;
      border-bottom-left-radius: 50px;
      transform: rotate(-45deg);
      border-right: 0;
    }
    
    &.active::before,
    &.active::after {
      border-color: var(--icon-color, #FF6B6B);
      background-color: var(--icon-color, #FF6B6B);
    }
  }
  
  // 收藏图标
  &-favorite {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 10%;
      left: 50%;
      width: 50%;
      height: 50%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #666);
      transform: rotate(-45deg) translate(-50%, 0);
      transform-origin: 0 0;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 10%;
      left: 50%;
      width: 50%;
      height: 50%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #666);
      transform: rotate(45deg) translate(0, 0);
      transform-origin: 0 0;
      border-left: 0;
      border-bottom: 0;
    }
    
    &.active::before,
    &.active::after {
      border-color: var(--icon-color, #FFCE54);
      background-color: var(--icon-color, #FFCE54);
    }
  }
  
  // 评论图标
  &-comment {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 15%;
      left: 15%;
      width: 70%;
      height: 60%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #666);
      border-radius: 6rpx;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 10%;
      left: 30%;
      width: 15%;
      height: 15%;
      background: var(--icon-color, #666);
      transform: rotate(45deg);
    }
  }
  
  // 分享图标
  &-share {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 30%;
      left: 20%;
      width: 60%;
      height: 2rpx;
      background: var(--icon-color, #666);
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 30%;
      right: 25%;
      width: 10rpx;
      height: 10rpx;
      border-top: 2rpx solid var(--icon-color, #666);
      border-right: 2rpx solid var(--icon-color, #666);
      transform: rotate(45deg);
    }
  }
  
  // 更多图标
  &-more {
    display: flex;
    align-items: center;
    justify-content: center;
    
    &::before {
      content: '';
      width: 4rpx;
      height: 4rpx;
      background: var(--icon-color, #666);
      box-shadow: -8rpx 0 0 var(--icon-color, #666), 8rpx 0 0 var(--icon-color, #666);
      border-radius: 50%;
    }
  }
  
  // 添加图标
  &-add {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 25%;
      width: 50%;
      height: 2rpx;
      background: var(--icon-color, #666);
      transform: translateY(-50%);
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 25%;
      left: 50%;
      width: 2rpx;
      height: 50%;
      background: var(--icon-color, #666);
      transform: translateX(-50%);
    }
  }
  
  // 返回图标
  &-back {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 30%;
      width: 40%;
      height: 40%;
      border-left: 2rpx solid var(--icon-color, #666);
      border-bottom: 2rpx solid var(--icon-color, #666);
      transform: translateY(-50%) rotate(45deg);
    }
  }
  
  // 关闭图标
  &-close {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 70%;
      height: 2rpx;
      background: var(--icon-color, #666);
      transform: translate(-50%, -50%) rotate(45deg);
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 70%;
      height: 2rpx;
      background: var(--icon-color, #666);
      transform: translate(-50%, -50%) rotate(-45deg);
    }
  }
}
</style> 