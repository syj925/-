<template>
  <view class="comment-item">
    <!-- 评论内容区 -->
    <view class="comment-main">
      <view class="comment-avatar-wrapper" @tap="viewUserProfile">
        <image 
          class="comment-avatar" 
          :src="formatAvatarUrl(commentUser.avatar)"
          mode="aspectFill"
          @error="handleAvatarError"
          @load="handleAvatarLoad"
        />
        <!-- 加载指示器，在加载失败时显示感叹号图标 -->
        <text v-if="avatarLoadFailed" class="avatar-error-icon">!</text>
      </view>
      
      <view class="comment-content">
        <!-- 用户信息 -->
        <view class="comment-user" @tap="viewUserProfile">
          <!-- 匿名或正常用户信息显示 -->
          <text v-if="comment.isAnonymous">匿名用户</text>
          <text v-else>{{ commentUser.nickname || '未知用户' }}</text>
        </view>
        
        <!-- 评论内容 -->
        <view class="comment-text">{{ comment.content }}</view>
        
        <!-- 评论底部 -->
        <view class="comment-footer">
          <text class="comment-time">{{ formatTime(comment.createdAt) }}</text>
          
          <view class="comment-actions">
            <view 
              class="comment-action ripple" 
              :class="{'active': isLiked}" 
              @tap="handleLike"
            >
              <view class="custom-heart-icon" :class="{'active': isLiked}"></view>
              <text class="action-text">{{ comment.likes || 0 }}</text>
            </view>
            <view class="comment-action ripple" @tap="handleReply">
              <view class="custom-reply-icon" :class="{'active': isReplying}"></view>
              <text class="action-text">回复</text>
            </view>
            <view 
              v-if="comment.replies && comment.replies.length > 0" 
              class="comment-action refresh-action ripple" 
              :class="{'refreshing': isRefreshing}"
              @tap="refreshReplies"
            >
              <view class="refresh-icon"></view>
              <text class="action-text">刷新</text>
            </view>
          </view>
        </view>
        
        <!-- 添加内联回复输入框 -->
        <view class="reply-input-container" v-if="isReplying">
          <view class="reply-user-info">
            <text class="reply-to-label">回复 {{ comment.isAnonymous ? '匿名用户' : commentUser.nickname }}:</text>
          </view>
          <textarea 
            class="reply-input" 
            v-model="replyContent" 
            auto-height 
            focus
            cursor-spacing="140"
            :adjust-position="true"
            placeholder="写下你的回复..." 
            @blur="onInputBlur"
          />
          <view class="reply-actions-bar">
            <view class="reply-cancel" @tap="cancelReply">取消</view>
            <view class="reply-submit" @tap="submitReply">发送</view>
          </view>
        </view>
        
        <!-- 评论的回复区域 -->
        <view 
          class="replies" 
          v-if="showReplies && comment.replies && comment.replies.length > 0"
          :class="{'replies-expanding': isExpanding}"
        >
          <view 
            v-for="(reply, index) in displayedReplies" 
            :key="reply.id"
            class="reply-item"
            :class="{'appear': reply._animateIn}"
          >
            <view class="reply-content">
              <text class="reply-user" @tap="viewReplyUserProfile(reply)">{{ reply.isAnonymous ? '匿名用户' : getReplyUser(reply)?.nickname }}</text>
              <template v-if="reply.replyTo && reply.replyTo.id !== commentUser.id">
                <text class="reply-text"> 回复 </text>
                <text class="reply-to" @tap="viewUserProfile">{{ reply.replyTo?.nickname }}</text>
              </template>
              <text class="reply-text">: </text>
              <text class="reply-text">{{ reply.content }}</text>
            </view>
            
            <view class="reply-footer">
              <text class="reply-time">{{ formatTime(reply.createdAt) }}</text>
              
              <view class="reply-actions">
                <view 
                  class="reply-action ripple" 
                  :class="{'active': reply.isLiked}" 
                  @tap="handleReplyLike(reply)"
                >
                  <view class="custom-heart-icon" :class="{'active': reply.isLiked}"></view>
                  <text class="action-text">{{ reply.likes || 0 }}</text>
                </view>
                <view class="reply-action ripple" @tap="handleReplyToReply(reply)">
                  <view class="custom-reply-icon" :class="{'active': replyingToId === reply.id}"></view>
                  <text class="action-text">回复</text>
                </view>
              </view>
            </view>
            
            <!-- 内联对回复的回复输入框 -->
            <view 
              class="nested-reply-input-container"
              v-if="replyingToId === reply.id" 
            >
              <view class="reply-user-info">
                <text class="reply-to-label">回复 {{ reply.isAnonymous ? '匿名用户' : getReplyUser(reply)?.nickname }}:</text>
              </view>
              <textarea 
                class="reply-input" 
                v-model="replyContent" 
                auto-height 
                focus
                cursor-spacing="140"
                :adjust-position="true"
                placeholder="写下你的回复..." 
                @blur="onInputBlur"
              />
              <view class="reply-actions-bar">
                <view class="reply-cancel" @tap="cancelReply">取消</view>
                <view class="reply-submit" @tap="submitNestedReply">发送</view>
              </view>
            </view>
          </view>
          
          <!-- 加载更多回复 -->
          <view 
            class="view-more-replies ripple" 
            :class="{'expanded': isExpanded, 'loading': isLoading}"
            v-if="showLoadMoreButton && totalReplies > 2"
            @tap="toggleReplies"
          >
            <text>
              <text v-if="isLoading" class="loading-dots">加载中</text>
              <text v-else>{{ isExpanded ? '收起回复' : '查看更多回复' + (hiddenRepliesCount > 0 ? ` (${hiddenRepliesCount})` : '') }}</text>
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { formatTime } from '@/utils/time';
import config from '@/utils/config';

export default {
  name: 'CommentItem',
  props: {
    comment: {
      type: Object,
      required: true
    },
    // 是否显示回复
    showReplies: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      defaultAvatar: '/static/images/default-avatar.png',
      replyingToId: null,
      isReplying: false,
      isExpanded: false,
      showLoadMoreButton: false,
      displayedReplies: [],
      isExpanding: false,
      isLoading: false,
      isRefreshing: false,
      replyContent: '',
      avatarLoadFailed: false
    }
  },
  computed: {
    // 计算是否需要显示加载更多按钮
    shouldShowLoadMoreButton() {
      return this.comment.replies && this.comment.replies.length > 2;
    },
    
    // 计算评论是否被点赞
    isLiked() {
      return this.comment.isLiked || false;
    },
    
    // 计算总回复数
    totalReplies() {
      return this.comment.replies ? this.comment.replies.length : 0;
    },
    
    // 计算剩余隐藏的回复数量
    hiddenRepliesCount() {
      if (!this.isExpanded && this.comment.replies && this.comment.replies.length > 2) {
        return this.comment.replies.length - 2;
      }
      return 0;
    },
    
    // 获取评论作者信息，兼容user和author字段，并处理匿名状态
    commentUser() {
      // 添加调试日志
      console.log(`评论ID ${this.comment.id} 的处理开始，字段列表:`, Object.keys(this.comment));
      
      // 主动检测匿名字段 - 兼容驼峰和下划线命名，只有明确设置为true、1或'1'才认为是匿名
      const isAnonymous = this.comment.isAnonymous === true ||
                         this.comment.isAnonymous === 1 ||
                         this.comment.isAnonymous === '1' ||
                         this.comment.is_anonymous === true ||
                         this.comment.is_anonymous === 1 ||
                         this.comment.is_anonymous === '1';
      
      console.log(`评论ID ${this.comment.id} 的匿名状态:`, isAnonymous);
      
      // 如果评论是匿名的，返回匿名用户信息
      if (isAnonymous) {
        console.log('返回匿名用户信息');
        return {
          nickname: '匿名用户',
          avatar: '/static/images/anonymous-avatar.png',
          id: null
        };
      }
      
      // 调试所有用户信息相关属性
      console.log('完整评论对象:', JSON.stringify(this.comment, null, 2));
      
      // 检查是否为扁平结构 - 直接在评论对象上存在username和avatar字段
      if (this.comment.username) {
        console.log(`评论ID ${this.comment.id} 使用扁平结构字段:`, {
          username: this.comment.username,
          avatar: this.comment.avatar
        });
        
        return {
          id: this.comment.userId,
          nickname: this.comment.username, // 直接使用username作为nickname
          username: this.comment.username,
          avatar: this.comment.avatar || '/static/images/default-avatar.png'
        };
      }
      
      // 非匿名评论，获取正确的用户信息
      // 检查author对象
      if (this.comment.author) {
        console.log(`评论ID ${this.comment.id} 使用author对象:`, this.comment.author);
        console.log(`评论作者昵称:`, this.comment.author.nickname);
        console.log(`评论作者用户名:`, this.comment.author.username);
        
        return {
          id: this.comment.author.id,
          nickname: this.comment.author.nickname || this.comment.author.username || '用户名缺失',
          username: this.comment.author.username,
          avatar: this.comment.author.avatar || '/static/images/default-avatar.png'
        };
      }
      
      // 检查user对象
      if (this.comment.user) {
        console.log(`评论ID ${this.comment.id} 使用user对象:`, this.comment.user);
        
        return {
          id: this.comment.user.id,
          nickname: this.comment.user.nickname || this.comment.user.username || '用户名缺失',
          username: this.comment.user.username,
          avatar: this.comment.user.avatar || '/static/images/default-avatar.png'
        };
      }
      
      // 检查带点号格式的字段 (author.nickname 等)
      if (this.comment['author.id'] !== undefined) {
        console.log(`评论ID ${this.comment.id} 使用点号字段:`, {
          id: this.comment['author.id'],
          nickname: this.comment['author.nickname'] || this.comment['author.username']
        });
        
        // 这里是关键修改：直接使用后端返回的nickname值，不添加任何默认值
        return {
          id: this.comment['author.id'],
          nickname: this.comment['author.nickname'] || this.comment['author.username'] || '用户名缺失',
          username: this.comment['author.username'],
          avatar: this.comment['author.avatar'] || '/static/images/default-avatar.png'
        };
      }
      
      // 如果都没有，使用空对象，并输出警告
      console.warn(`评论ID ${this.comment.id} 无法找到作者信息，可能数据不完整`);
      // 返回一个基本的默认值
      return {
        nickname: '未知用户',
        avatar: '/static/images/default-avatar.png',
        id: this.comment.userId || null
      };
    }
  },
  watch: {
    // 监听评论对象的变化，重新初始化显示状态
    'comment.replies': {
      immediate: true,
      handler(newVal) {
        console.log('评论回复数据更新:', newVal);
        this.initRepliesDisplay();
      }
    },
    comment: {
      immediate: true,
      deep: true,
      handler(newVal) {
        console.log('评论数据更新:', newVal);
      }
    }
  },
  created() {
    this.initRepliesDisplay();
    console.log('CommentItem创建，接收到的评论数据:', this.comment);
    // 添加更多调试信息
    console.log('评论完整字段列表:', Object.keys(this.comment));
    console.log('评论的userId:', this.comment.userId);
    console.log('评论的isAnonymous字段值:', this.comment.isAnonymous);
    
    // 检查"author."格式的字段
    const authorFields = Object.keys(this.comment).filter(key => key.startsWith('author.'));
    if (authorFields.length > 0) {
      console.log('发现author.格式字段:', authorFields);
      console.log('author.nickname值:', this.comment['author.nickname']);
    }
    
    // 检查author对象
    if (this.comment.author) {
      console.log('发现author对象:', this.comment.author);
    }
    
    // 检查user对象
    if (this.comment.user) {
      console.log('发现user对象:', this.comment.user);
    }
    
    // 输出计算后的commentUser
    console.log('计算得到的commentUser:', this.commentUser);
  },
  methods: {
    formatTime,
    
    // 获取回复用户信息，处理匿名和扁平数据结构
    getReplyUser(reply) {
      // 添加调试日志
      console.log(`回复ID ${reply.id} 的处理开始，字段列表:`, Object.keys(reply));
      
      // 检查是否匿名
      const isAnonymous = reply.isAnonymous === true || 
                         reply.isAnonymous === 1 || 
                         reply.isAnonymous === '1';
                         
      console.log(`回复ID ${reply.id} 的匿名状态:`, isAnonymous);
      
      if (isAnonymous) {
        return {
          nickname: '匿名用户',
          avatar: '/static/images/anonymous-avatar.png',
          id: null
        };
      }
      
      // 检查是否为扁平结构 - 直接在回复对象上存在username和avatar字段
      if (reply.username) {
        console.log(`回复ID ${reply.id} 使用扁平结构字段:`, {
          username: reply.username,
          avatar: reply.avatar
        });
        
        return {
          id: reply.userId,
          nickname: reply.username, // 直接使用username作为nickname
          username: reply.username,
          avatar: reply.avatar || '/static/images/default-avatar.png'
        };
      }
      
      // 检查标准author对象
      if (reply.author) {
        console.log(`回复ID ${reply.id} 使用author对象:`, reply.author);
        return {
          id: reply.author.id,
          nickname: reply.author.nickname || reply.author.username,
          username: reply.author.username,
          avatar: reply.author.avatar || '/static/images/default-avatar.png'
        };
      }
      
      // 检查user对象
      if (reply.user) {
        console.log(`回复ID ${reply.id} 使用user对象:`, reply.user);
        // 直接返回原始对象，不进行任何修改
        return reply.user;
      }
      
      // 检查扁平结构字段
      if (reply['author.id'] !== undefined) {
        console.log(`回复ID ${reply.id} 使用点号字段:`, {
          id: reply['author.id'],
          nickname: reply['author.nickname'] || reply['author.username']
        });
        
        // 同样，直接使用后端返回的值
        return {
          id: reply['author.id'],
          nickname: reply['author.nickname'] || reply['author.username'],
          username: reply['author.username'],
          avatar: reply['author.avatar'] || '/static/images/default-avatar.png'
        };
      }
      
      // 使用默认值
      console.warn(`回复ID ${reply.id} 无法找到作者信息，可能数据不完整`);
      // 直接返回空昵称
      return {
        nickname: '未知用户',
        avatar: '/static/images/default-avatar.png',
        id: reply.userId || null
      };
    },
    
    // 初始化回复显示
    initRepliesDisplay() {
      try {
        if (!this.comment) {
          console.error('初始化回复失败：评论对象为空');
          this.displayedReplies = [];
          this.showLoadMoreButton = false;
          return;
        }
        
        if (this.comment.replies && Array.isArray(this.comment.replies) && this.comment.replies.length) {
          console.log(`初始化评论ID ${this.comment.id} 的回复显示，共 ${this.comment.replies.length} 条回复`);
          
          // 确保回复数组中的每个元素都是有效对象
          const validReplies = this.comment.replies.filter(reply => reply && typeof reply === 'object');
          
          if (validReplies.length !== this.comment.replies.length) {
            console.warn(`评论ID ${this.comment.id} 包含无效回复:`, 
              this.comment.replies.length - validReplies.length, '条被过滤');
          }
          
          // 默认只显示前2条回复
          this.displayedReplies = validReplies.slice(0, 2);
          // 如果回复数量超过2条，显示"查看更多"按钮
          this.showLoadMoreButton = validReplies.length > 2;
          this.isExpanded = false;
        } else {
          console.log(`评论ID ${this.comment.id || '未知'} 没有回复或回复为空`);
          this.displayedReplies = [];
          this.showLoadMoreButton = false;
        }
      } catch (error) {
        console.error('初始化回复显示时发生错误:', error);
        this.displayedReplies = [];
        this.showLoadMoreButton = false;
      }
    },
    
    // 点赞评论
    handleLike() {
      this.$emit('like', this.comment);
    },
    
    // 回复评论
    handleReply() {
      // 关闭其他可能打开的回复框
      this.replyingToId = null;
      // 打开当前回复框
      this.isReplying = true;
      this.replyContent = '';
      
      // 通知父组件
      this.$emit('reply', this.comment);
      
      // 确保输入框获得焦点
      this.$nextTick(() => {
        // 这里不需要做任何事情，因为我们使用了focus属性
      });
    },
    
    // 点赞回复
    handleReplyLike(reply) {
      this.$emit('reply-like', reply, this.comment);
    },
    
    // 回复其他回复
    handleReplyToReply(reply) {
      // 关闭评论回复框
      this.isReplying = false;
      // 设置当前正在回复的回复ID
      this.replyingToId = reply.id;
      this.replyContent = '';
      
      // 通知父组件
      this.$emit('reply-to-reply', reply, this.comment);
    },
    
    // 加载更多回复
    loadMoreReplies() {
      this.$emit('load-more-replies', this.comment);
    },
    
    // 查看用户资料
    viewUserProfile() {
      if (this.commentUser && this.commentUser.id) {
        this.$emit('view-profile', this.commentUser);
      }
    },
    
    // 查看回复用户资料
    viewReplyUserProfile(reply) {
      // 对匿名回复不进行操作
      if (reply.isAnonymous) {
        return;
      }
      
      // 获取用户信息
      const user = this.getReplyUser(reply);
      if (user && user.id) {
        this.$emit('view-profile', user);
      }
    },
    
    toggleReplies() {
      // 如果正在加载中，不执行任何操作
      if (this.isLoading) return;
      
      try {
        // 确保comment和replies存在
        if (!this.comment || !this.comment.replies || !Array.isArray(this.comment.replies)) {
          console.error('无法切换回复：评论或回复数据无效');
          uni.showToast({
            title: '数据加载失败',
            icon: 'none'
          });
          return;
        }
        
        // 展开时先显示加载状态
        if (!this.isExpanded) {
          this.isLoading = true;
        }
        
        this.isExpanded = !this.isExpanded;
        
        if (this.isExpanded) {
          // 标记正在展开
          this.isExpanding = true;
          
          // 模拟网络延迟，实际应用中可能是从API获取更多回复
          setTimeout(() => {
            this.isLoading = false;
            
            try {
              // 确保只使用有效回复
              const validReplies = this.comment.replies.filter(reply => reply && typeof reply === 'object');
              
              // 展开所有回复
              this.displayedReplies = validReplies.map((reply, index) => {
                const newReply = {...reply};
                if (index >= 2) {
                  newReply._animateIn = true;
                }
                return newReply;
              });
              
              // 短暂延迟后取消展开标记
              setTimeout(() => {
                this.isExpanding = false;
                
                // 再延迟移除动画标记
                setTimeout(() => {
                  try {
                    this.displayedReplies = this.displayedReplies.map(reply => {
                      if (reply) {
                        reply._animateIn = false;
                      }
                      return reply;
                    });
                  } catch (innerErr) {
                    console.error('移除动画标记时出错:', innerErr);
                  }
                }, 300);
              }, 100);
            } catch (expandError) {
              console.error('展开回复时出错:', expandError);
              this.isLoading = false;
              this.isExpanding = false;
            }
          }, 400); // 延长模拟加载时间以便看到效果
        } else {
          // 收起不需要加载
          this.isLoading = false;
          
          try {
            // 确保回复数组有效
            if (this.comment.replies && Array.isArray(this.comment.replies)) {
              // 过滤无效回复
              const validReplies = this.comment.replies.filter(reply => reply && typeof reply === 'object');
              // 收起到只显示前两条
              this.displayedReplies = validReplies.slice(0, 2);
            } else {
              this.displayedReplies = [];
            }
          } catch (collapseError) {
            console.error('收起回复时出错:', collapseError);
            this.displayedReplies = [];
          }
          
          this.isExpanding = false;
        }
        
        // 更新按钮显示状态
        this.showLoadMoreButton = this.comment.replies && Array.isArray(this.comment.replies) && this.comment.replies.length > 2;
      } catch (error) {
        console.error('切换回复显示时出错:', error);
        this.isLoading = false;
        this.isExpanding = false;
      }
    },
    
    // 刷新评论
    refreshReplies() {
      if (this.isRefreshing) return;
      
      this.isRefreshing = true;
      
      // 模拟网络请求刷新评论
      setTimeout(() => {
        // 实际应用中这里应该调用API获取最新回复
        // this.$emit('refresh-replies', this.comment);
        
        // 重新初始化回复显示
        this.initRepliesDisplay();
        
        // 500ms后取消刷新状态
        setTimeout(() => {
          this.isRefreshing = false;
          
          // 给用户提示刷新完成
          uni.showToast({
            title: '刷新成功',
            icon: 'none',
            duration: 1500
          });
        }, 500);
      }, 800);
    },
    
    // 取消回复
    cancelReply() {
      this.isReplying = false;
      this.replyingToId = null;
      this.replyContent = '';
    },
    
    // 提交回复
    submitReply() {
      if (!this.replyContent.trim()) {
        uni.showToast({
          title: '回复内容不能为空',
          icon: 'none'
        });
        return;
      }
      
      // 发送回复数据给父组件
      this.$emit('submit-reply', {
        commentId: this.comment.id,
        content: this.replyContent.trim()
      });
      
      // 清空输入框并关闭
      this.replyContent = '';
      this.isReplying = false;
    },
    
    // 提交嵌套回复
    submitNestedReply() {
      if (!this.replyContent.trim()) {
        uni.showToast({
          title: '回复内容不能为空',
          icon: 'none'
        });
        return;
      }
      
      // 查找回复的对象
      const replyTo = this.comment.replies.find(r => r.id === this.replyingToId);
      
      // 发送嵌套回复数据给父组件
      this.$emit('submit-nested-reply', {
        commentId: this.comment.id,
        replyId: this.replyingToId,
        replyToUserId: replyTo?.userId,
        content: this.replyContent.trim()
      });
      
      // 清空输入框并关闭
      this.replyContent = '';
      this.replyingToId = null;
    },
    
    // 处理输入框失焦
    onInputBlur() {
      // 延迟处理，避免点击取消/发送按钮时立即关闭面板
      setTimeout(() => {
        // 这里可以选择是否自动关闭输入框
        // this.cancelReply();
      }, 200);
    },
    
    // 格式化头像URL
    formatAvatarUrl(avatar) {
      if (!avatar) {
        console.log('头像为空，使用默认头像');
        return this.defaultAvatar;
      }
      
      console.log('原始头像URL:', avatar);
      
      try {
        // 如果已经是完整URL，直接返回
        if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
          console.log('使用完整URL:', avatar);
          return avatar;
        }
        
        // 如果是本地静态资源路径，直接返回
        if (avatar.startsWith('/static/')) {
          console.log('使用静态资源:', avatar);
          return avatar;
        }
        
        // 如果是上传文件路径，添加API基础URL
        if (avatar.startsWith('/uploads/')) {
          // 查看config获取值
          console.log('发现上传路径，配置基础URL为:', config.AVATAR_BASE_URL);
          const fullUrl = `${config.AVATAR_BASE_URL}${avatar}`;
          console.log('完整URL:', fullUrl);
          return fullUrl;
        }
        
        // 如果不是以/开头，添加/
        if (!avatar.startsWith('/')) {
          console.log('添加前缀斜杠:', '/' + avatar);
          return '/' + avatar;
        }
        
        console.log('无需处理的头像URL:', avatar);
        return avatar;
      } catch (error) {
        console.error('处理头像URL时出错:', error, '原始URL:', avatar);
        return this.defaultAvatar;
      }
    },
    
    // 处理头像加载错误
    handleAvatarError(e) {
      console.error('头像加载失败:', e.target.src);
      
      // 记录错误状态，用于显示错误标识
      this.avatarLoadFailed = true;
      
      // 检查是否是相对路径导致的问题
      const src = e.target.src;
      // 记录当前页面的 location.origin，帮助调试
      console.log('当前页面基础URL:', window.location.origin);
      console.log('当前页面完整URL:', window.location.href);
      
      // 尝试使用完整URL重试
      if (src && src.includes('/uploads/') && !src.startsWith(config.AVATAR_BASE_URL)) {
        const uploadPath = src.substring(src.indexOf('/uploads/'));
        const newSrc = `${config.AVATAR_BASE_URL}${uploadPath}`;
        console.log('尝试使用完整URL重新加载:', newSrc);
        e.target.src = newSrc;
        return; // 给重试的URL一个机会
      }
      
      // 设置为默认头像
      e.target.src = this.defaultAvatar;
      e.target.onerror = null; // 防止循环触发错误
    },
    
    // 处理头像加载成功
    handleAvatarLoad() {
      this.avatarLoadFailed = false;
    }
  }
}
</script>

<style>
.comment-item {
  margin-bottom: 30rpx;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 20rpx;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-main {
  display: flex;
}

.comment-avatar-wrapper {
  margin-right: 20rpx;
  flex-shrink: 0;
  position: relative;
}

.comment-avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background-color: #f0f0f0;
  border: 2rpx solid #ffffff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
}

/* 头像错误图标样式 */
.avatar-error-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20rpx;
  height: 20rpx;
  background-color: #ff5252;
  border-radius: 50%;
  font-size: 14rpx;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid white;
}

.comment-content {
  flex: 1;
  overflow: hidden;
}

.comment-user {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8rpx;
}

.comment-text {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
  margin-bottom: 16rpx;
  word-break: break-all;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
  margin-bottom: 12rpx;
}

.comment-time {
  font-size: 24rpx;
  color: #8E9AAA;
}

.comment-actions {
  display: flex;
  align-items: center;
}

.comment-action {
  display: flex;
  align-items: center;
  margin-left: 30rpx;
  font-size: 24rpx;
  color: #8E9AAA;
  padding: 6rpx 12rpx;
  border-radius: 20rpx;
  transition: all 0.3s ease;
}

.comment-action.active {
  color: #FF5252;
}

.comment-action .iconfont {
  margin-right: 8rpx;
  font-size: 28rpx;
}

.comment-action:active {
  background-color: rgba(74, 144, 226, 0.08);
}

/* 回复区域样式 */
.replies {
  background: #F8FAFC;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 10rpx;
  position: relative;
  border-left: 4rpx solid #E3F2FD;
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.replies:before {
  content: '';
  position: absolute;
  left: 30rpx;
  top: -16rpx;
  border: 8rpx solid transparent;
  border-bottom-color: #F8FAFC;
}

.replies-expanding {
  animation: expand-box 0.4s ease-out;
}

@keyframes expand-box {
  0% {
    max-height: 200rpx;
    opacity: 0.9;
  }
  100% {
    max-height: 1000rpx;
    opacity: 1;
  }
}

.reply-item {
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}

.reply-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.reply-item.appear {
  animation: fadeInUp 0.3s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reply-content {
  font-size: 26rpx;
  color: #333333;
  line-height: 1.6;
  word-break: break-all;
  padding: 4rpx 0;
}

.reply-user, .reply-to {
  color: #4A90E2;
  font-weight: 600;
}

.reply-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8rpx;
}

.reply-time {
  font-size: 22rpx;
  color: #8E9AAA;
}

.reply-actions {
  display: flex;
  align-items: center;
}

.reply-action {
  display: flex;
  align-items: center;
  margin-left: 20rpx;
  font-size: 22rpx;
  color: #8E9AAA;
  padding: 4rpx 10rpx;
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.reply-action.active {
  color: #FF5252;
}

.reply-action .iconfont {
  margin-right: 6rpx;
  font-size: 24rpx;
}

.reply-action:active {
  background-color: rgba(74, 144, 226, 0.08);
}

.view-more-replies {
  text-align: center;
  color: #4A90E2;
  font-size: 24rpx;
  padding: 10rpx 0;
  margin-top: 10rpx;
  border-radius: 8rpx;
  transition: all 0.3s ease;
  background-color: rgba(74, 144, 226, 0.1);
  border: 1px dashed rgba(74, 144, 226, 0.3);
  font-weight: 500;
}

.view-more-replies:active {
  background-color: rgba(74, 144, 226, 0.2);
}

.view-more-replies text {
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-more-replies text::before {
  content: "";
  display: inline-block;
  width: 24rpx;
  height: 24rpx;
  margin-right: 8rpx;
  background-image: linear-gradient(to bottom, #4A90E2, #5D9DEA);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z'/%3E%3C/svg%3E") no-repeat 50% 50%;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z'/%3E%3C/svg%3E") no-repeat 50% 50%;
  -webkit-mask-size: contain;
  mask-size: contain;
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

/* 当展开时，箭头向上 */
.view-more-replies.expanded text::before {
  transform: rotate(0deg);
}

/* 当加载中时，添加旋转动画 */
.view-more-replies.loading text::before {
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z'/%3E%3C/svg%3E") no-repeat 50% 50%;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z'/%3E%3C/svg%3E") no-repeat 50% 50%;
  animation: loading-spinner 1.2s linear infinite;
  transform: none;
}

@keyframes loading-spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 波纹效果 */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple:after {
  content: "";
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgba(74, 144, 226, 0.2) 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform 0.6s, opacity 1s;
}

.ripple:active:after {
  transform: scale(0, 0);
  opacity: 0.3;
  transition: 0s;
}

/* 自定义点赞心形图标 */
.custom-heart-icon {
  position: relative;
  width: 24rpx;
  height: 24rpx;
  transform: rotate(45deg);
  background-color: #8E9AAA;
  margin: 0 2rpx 0 0;
  box-shadow: 0 0 4rpx rgba(0, 0, 0, 0.1);
  border-radius: 2rpx;
  transition: all 0.3s ease;
}

.custom-heart-icon:before,
.custom-heart-icon:after {
  content: "";
  width: 24rpx;
  height: 24rpx;
  position: absolute;
  border-radius: 50%;
  background-color: #8E9AAA;
  transition: all 0.3s ease;
}

.custom-heart-icon:before {
  top: -12rpx;
  left: 0;
}

.custom-heart-icon:after {
  top: 0;
  left: -12rpx;
}

/* 点赞激活状态 */
.custom-heart-icon.active {
  background-color: #FF5252;
  animation: heart-beat 1.5s infinite;
  box-shadow: 0 0 8rpx rgba(255, 82, 82, 0.3);
}

.custom-heart-icon.active:before,
.custom-heart-icon.active:after {
  background-color: #FF5252;
  box-shadow: 0 0 8rpx rgba(255, 82, 82, 0.3);
}

@keyframes heart-beat {
  0% {
    transform: rotate(45deg) scale(1.0);
  }
  15% {
    transform: rotate(45deg) scale(1.25);
  }
  30% {
    transform: rotate(45deg) scale(1.0);
  }
  45% {
    transform: rotate(45deg) scale(1.25);
  }
  60% {
    transform: rotate(45deg) scale(1.0);
  }
  100% {
    transform: rotate(45deg) scale(1.0);
  }
}

/* 自定义回复图标 */
.custom-reply-icon {
  position: relative;
  width: 24rpx;
  height: 20rpx;
  border: 2rpx solid #8E9AAA;
  border-radius: 4rpx;
  margin: 2rpx 4rpx 0 0;
  background-color: transparent;
}

.custom-reply-icon:after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 6rpx 6rpx;
  border-color: transparent transparent #8E9AAA transparent;
  right: -4rpx;
  bottom: -4rpx;
}

.comment-action.active, .reply-action.active {
  color: #FF5252;
}

.action-text {
  font-size: 24rpx;
  line-height: 1;
  margin-left: 4rpx;
  color: inherit;
}

.reply-text {
  font-size: 26rpx;
  color: #333333;
  line-height: 1.6;
}

.custom-reply-icon.active {
  border-color: #FF5252;
  background-color: rgba(255, 82, 82, 0.1);
}

.custom-reply-icon.active:after {
  border-color: transparent transparent #FF5252 transparent;
}

/* 评论交互状态 */
.comment-action:active,
.reply-action:active {
  transform: scale(0.95);
  transition: transform 0.1s;
}

/* 用户名点击效果 */
.comment-user:active,
.reply-user:active,
.reply-to:active {
  opacity: 0.7;
  transition: opacity 0.1s;
}

/* 改进心跳动画 */
@keyframes heart-beat {
  0% {
    transform: rotate(45deg) scale(1.0);
  }
  15% {
    transform: rotate(45deg) scale(1.25);
  }
  30% {
    transform: rotate(45deg) scale(1.0);
  }
  45% {
    transform: rotate(45deg) scale(1.25);
  }
  60% {
    transform: rotate(45deg) scale(1.0);
  }
  100% {
    transform: rotate(45deg) scale(1.0);
  }
}

/* 回复列表动画 */
.reply-list-transition {
  transition: all 0.3s ease-out;
}

.view-more-replies.loading {
  background-color: rgba(74, 144, 226, 0.05);
  pointer-events: none;
  opacity: 0.8;
}

.loading-dots {
  display: inline-block;
  position: relative;
}

.loading-dots:after {
  content: '';
  animation: loading-dots 1.2s infinite;
}

@keyframes loading-dots {
  0%, 20% {
    content: '.';
  }
  40% {
    content: '..';
  }
  60%, 100% {
    content: '...';
  }
}

.refresh-icon {
  width: 24rpx;
  height: 24rpx;
  margin-right: 4rpx;
  background-image: linear-gradient(to bottom, #8E9AAA, #A1B0C2);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z'/%3E%3Cpath d='M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z'/%3E%3C/svg%3E") no-repeat 50% 50%;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z'/%3E%3Cpath d='M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z'/%3E%3C/svg%3E") no-repeat 50% 50%;
  -webkit-mask-size: contain;
  mask-size: contain;
  transition: all 0.3s ease;
}

.refresh-action.refreshing .refresh-icon {
  background-image: linear-gradient(to bottom, #4A90E2, #5D9DEA);
  animation: refresh-spin 1s linear infinite;
}

.refresh-action:active .refresh-icon {
  transform: scale(1.2);
}

@keyframes refresh-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 添加内联回复输入框样式 */
.reply-input-container,
.nested-reply-input-container {
  margin-top: 16rpx;
  padding: 16rpx;
  background-color: #F8FAFC;
  border-radius: 12rpx;
  border-left: 4rpx solid #E3F2FD;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reply-user-info {
  margin-bottom: 12rpx;
}

.reply-to-label {
  font-size: 24rpx;
  color: #4A90E2;
  font-weight: 500;
}

.reply-input {
  width: 100%;
  min-height: 80rpx;
  max-height: 240rpx;
  padding: 16rpx;
  background-color: #FFFFFF;
  border: 1px solid #E3F2FD;
  border-radius: 8rpx;
  font-size: 28rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.reply-actions-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.reply-cancel, .reply-submit {
  padding: 8rpx 24rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  transition: all 0.3s ease;
  margin-left: 20rpx;
}

.reply-cancel {
  color: #8E9AAA;
  background-color: #F0F2F5;
}

.reply-submit {
  background: linear-gradient(to right, #4A90E2, #5D9DEA);
  color: #FFFFFF;
  font-weight: 500;
  box-shadow: 0 4rpx 12rpx rgba(74, 144, 226, 0.2);
}

.reply-cancel:active {
  background-color: #E8EAED;
  transform: scale(0.98);
}

.reply-submit:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 6rpx rgba(74, 144, 226, 0.1);
}

.nested-reply-input-container {
  margin-top: 12rpx;
  padding: 12rpx;
  background-color: #F0F6FD;
  border-radius: 8rpx;
  border-left: 3rpx solid #C7E0FF;
  animation: fadeIn 0.3s ease-in-out;
}

.nested-reply-input-container .reply-input {
  background-color: #FFFFFF;
  border-color: #C7E0FF;
  font-size: 26rpx;
  min-height: 64rpx;
}
</style> 