import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import adminWebSocket from '@/utils/websocket';
import { useUserStore } from '@/stores/user';

export function useWebSocket() {
  const userStore = useUserStore();
  const isConnected = ref(false);
  const onlineCount = ref(0);

  const connect = () => {
    const token = userStore.token;
    if (token) {
      adminWebSocket.connect(token);
      
      adminWebSocket.on('onlineCountUpdate', (data) => {
        onlineCount.value = data.count;
        
        ElMessage({
          message: `在线人数更新: ${data.count}`,
          type: 'info',
          duration: 1500,
          showClose: false
        });
      });
      
      adminWebSocket.on('connected', () => {
        isConnected.value = true;
      });
      
      adminWebSocket.on('disconnected', () => {
        isConnected.value = false;
      });
      
      adminWebSocket.on('error', (data) => {
        console.error('[useWebSocket] WebSocket error:', data);
      });
    }
  };

  const disconnect = () => {
    adminWebSocket.off('onlineCountUpdate');
    adminWebSocket.off('connected');
    adminWebSocket.off('disconnected');
    adminWebSocket.off('error');
    adminWebSocket.disconnect();
    isConnected.value = false;
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    onlineCount
  };
}
