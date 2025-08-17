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
  
  // 点赞图标 - 现代心形设计
  &-like {
    position: relative;
    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    
    &::before {
      content: '';
      position: absolute;
      top: 20%;
      left: 20%;
      width: 26%;
      height: 45%;
      background: var(--icon-color, #666);
      border-radius: 50% 50% 0 0;
      transform: rotate(-45deg);
      transform-origin: bottom center;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 20%;
      right: 20%;
      width: 26%;
      height: 45%;
      background: var(--icon-color, #666);
      border-radius: 50% 50% 0 0;
      transform: rotate(45deg);
      transform-origin: bottom center;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    // 激活状态 - 渐变红色效果  
    &.active {
      &::before,
      &::after {
        background: linear-gradient(135deg, #ff6b9d 0%, #ff8a56 100%) !important;
        filter: drop-shadow(0 2rpx 4rpx rgba(255, 107, 157, 0.3));
      }
    }
    
    // 点击时弹性缩放
    &:active {
      transform: scale(0.85);
    }
    
    // 悬停时轻微放大和旋转
    &:hover {
      transform: scale(1.1) rotate(-2deg);
    }
  }
  
  // 收藏图标 - 精美五角星
  &-favorite {
    position: relative;
    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 80%;
      height: 80%;
      background: var(--icon-color, #666);
      clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
      transform: translate(-50%, -50%);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    &.active {
      &::before {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
        filter: drop-shadow(0 2rpx 6rpx rgba(255, 215, 0, 0.4));
        transform: translate(-50%, -50%) scale(1.1);
      }
    }
    
    // 点击时弹性缩放
    &:active {
      transform: scale(0.85);
    }
    
    // 悬停时轻微放大
    &:hover {
      transform: scale(1.08);
    }
  }
  
  // 评论图标 - 现代聊天气泡
  &-comment {
    position: relative;
    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    
    &::before {
      content: '';
      position: absolute;
      top: 15%;
      left: 10%;
      width: 80%;
      height: 55%;
      background: var(--icon-color, #666);
      border-radius: 16rpx 16rpx 16rpx 4rpx;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 25%;
      left: 15%;
      width: 0;
      height: 0;
      border-left: 10rpx solid transparent;
      border-right: 10rpx solid transparent;
      border-top: 12rpx solid var(--icon-color, #666);
      border-radius: 2rpx;
      transition: all 0.3s ease;
    }
    
    // 悬停时颜色变化
    &:hover {
      transform: scale(1.08);
      
      &::before {
        background: #4ECDC4;
        filter: drop-shadow(0 2rpx 4rpx rgba(78, 205, 196, 0.2));
      }
      
      &::after {
        border-top-color: #4ECDC4;
      }
    }
    
    // 点击时弹性缩放
    &:active {
      transform: scale(0.88);
    }
  }
  
  // 分享图标 - 现代分享节点设计
  &-share {
    position: relative;
    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    
    // 中心节点
    &::before {
      content: '';
      position: absolute;
      top: 40%;
      left: 40%;
      width: 20%;
      height: 20%;
      background: var(--icon-color, #666);
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    // 左上角节点
    &::after {
      content: '';
      position: absolute;
      top: 15%;
      left: 15%;
      width: 16%;
      height: 16%;
      background: var(--icon-color, #666);
      border-radius: 50%;
      transition: all 0.3s ease;
    }
    
    // 使用额外元素创建右下角节点和连接线
    &:before {
      content: '';
      position: absolute;
      bottom: 15%;
      right: 15%;
      width: 16%;
      height: 16%;
      background: var(--icon-color, #666);
      border-radius: 50%;
      transition: all 0.3s ease;
      box-shadow: 
        -18rpx -18rpx 0 -14rpx var(--icon-color, #666),
        -12rpx -12rpx 0 -13rpx var(--icon-color, #666);
    }
    
    // 悬停时颜色变化和放大
    &:hover {
      transform: scale(1.1);
      
      &::before,
      &::after,
      &:before {
        background: #17a2b8;
        filter: drop-shadow(0 2rpx 4rpx rgba(23, 162, 184, 0.2));
      }
      
      &:before {
        box-shadow: 
          -18rpx -18rpx 0 -14rpx #17a2b8,
          -12rpx -12rpx 0 -13rpx #17a2b8;
      }
    }
    
    // 点击时弹性缩放
    &:active {
      transform: scale(0.85);
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
  
  // 火焰图标
  &-fire {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 20%;
      left: 25%;
      width: 50%;
      height: 60%;
      background: var(--icon-color, #FF6B6B);
      border-radius: 40rpx 40rpx 10rpx 10rpx;
      transform: rotate(-15deg);
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 40%;
      left: 40%;
      width: 30%;
      height: 40%;
      background: var(--icon-color, #FF6B6B);
      border-radius: 30rpx 30rpx 5rpx 5rpx;
      transform: rotate(10deg);
    }
  }
  
  // 消息圆圈图标
  &-message-circle {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 15%;
      left: 15%;
      width: 70%;
      height: 55%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #666);
      border-radius: 50%;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 15%;
      left: 25%;
      width: 0;
      height: 0;
      border-left: 6rpx solid transparent;
      border-right: 6rpx solid transparent;
      border-top: 8rpx solid var(--icon-color, #666);
    }
  }
  
  // 眼睛图标
  &-eye {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 30%;
      left: 15%;
      width: 70%;
      height: 40%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #666);
      border-radius: 50rpx 50rpx 50rpx 50rpx;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 40%;
      left: 40%;
      width: 20%;
      height: 20%;
      background: var(--icon-color, #666);
      border-radius: 50%;
    }
  }
  
  // 日历图标
  &-calendar {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 25%;
      left: 20%;
      width: 60%;
      height: 60%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #4ECDC4);
      border-radius: 4rpx;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 40%;
      left: 20%;
      width: 60%;
      height: 2rpx;
      background: var(--icon-color, #4ECDC4);
    }
  }
  
  // 星星图标
  &-star {
    position: relative;
    
    &::before {
      content: '★';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--icon-color, #FFD93D);
      font-size: 85%;
      line-height: 1;
    }
  }
  
  // 右箭头图标
  &-chevron-right {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 30%;
      left: 35%;
      width: 30%;
      height: 30%;
      border-right: 2rpx solid var(--icon-color, #6c757d);
      border-bottom: 2rpx solid var(--icon-color, #6c757d);
      transform: rotate(-45deg);
    }
  }
  
  // 地图定位图标
  &-map-pin {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 15%;
      left: 35%;
      width: 30%;
      height: 45%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #999);
      border-radius: 50rpx 50rpx 0 50rpx;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 25%;
      left: 42%;
      width: 16%;
      height: 16%;
      background: var(--icon-color, #999);
      border-radius: 50%;
    }
  }
  
  // 用户群组图标
  &-users {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 20%;
      left: 25%;
      width: 25%;
      height: 25%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #999);
      border-radius: 50%;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 20%;
      left: 50%;
      width: 25%;
      height: 25%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #999);
      border-radius: 50%;
    }
  }
  
  // 搜索图标
  &-search {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 15%;
      left: 15%;
      width: 50%;
      height: 50%;
      background: transparent;
      border: 2rpx solid var(--icon-color, #3498db);
      border-radius: 50%;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 20%;
      right: 20%;
      width: 25%;
      height: 2rpx;
      background: var(--icon-color, #3498db);
      transform: rotate(45deg);
      transform-origin: left center;
    }
  }
}
</style> 