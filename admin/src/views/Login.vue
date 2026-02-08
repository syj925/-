<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-placeholder">校园墙</div>
        <h2>校园墙管理系统</h2>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            prefix-icon="User"
            placeholder="用户名"
            @keyup.enter="handleLogin">
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            prefix-icon="Lock"
            show-password
            placeholder="密码"
            @keyup.enter="handleLogin">
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="login-button"
            @click.prevent="handleLogin">
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

// 表单引用
const loginFormRef = ref(null);

// 加载状态
const loading = ref(false);

// 表单数据
const loginForm = reactive({
  username: '',
  password: '',
});

// 表单验证规则
const loginRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' },
  ],
});

// 如果已登录则跳转到首页
onMounted(() => {
  if (userStore.isAuthenticated) {
    router.push({ path: '/' });
  }
});

// 登录处理
const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      loading.value = true;

      const { username, password } = loginForm;
      const res = await api.login(username, password);

      if (res.success) {
        // 保存token和用户信息
        userStore.setAuth(res.data.token, res.data.user);

        ElMessage({
          message: '登录成功',
          type: 'success',
          duration: 2000,
        });

        // 跳转至首页
        router.push({ path: '/' });
      } else {
        ElMessage.error(res.message || '登录失败');
      }
    } catch (error) {
      ElMessage.error(error.message || '登录失败，请稍后再试');
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.logo-placeholder {
  width: 80px;
  height: 80px;
  background-color: #409eff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
}

h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.login-form {
  margin-top: 20px;
}

.login-button {
  width: 100%;
}
</style>
