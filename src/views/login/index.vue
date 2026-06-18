<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="bg-pattern"></div>
    </div>
    <div class="login-box">
      <div class="login-header">
        <el-icon class="logo-icon" :size="48"><Monitor /></el-icon>
        <h1 class="login-title">市级综治中心级联指挥平台</h1>
        <p class="login-subtitle">Cascade Command Platform</p>
      </div>
      <el-form :model="loginForm" class="login-form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <div class="captcha-row">
            <el-input
              v-model="loginForm.captcha"
              placeholder="请输入验证码"
              size="large"
              prefix-icon="Key"
              style="flex: 1;"
            />
            <div class="captcha-img" @click="refreshCaptcha">
              <span>{{ captchaText }}</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <p>© 2024 市级综治中心 版权所有</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const loginForm = ref({
  username: '',
  password: '',
  captcha: '',
  remember: false
})

const captchaText = ref('')

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let text = ''
  for (let i = 0; i < 4; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaText.value = text
}

const refreshCaptcha = () => {
  generateCaptcha()
}

const handleLogin = () => {
  if (!loginForm.value.username) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!loginForm.value.password) {
    ElMessage.warning('请输入密码')
    return
  }
  if (!loginForm.value.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }
  if (loginForm.value.captcha.toUpperCase() !== captchaText.value) {
    ElMessage.error('验证码错误')
    generateCaptcha()
    return
  }
  ElMessage.success('登录成功')
  router.push('/dashboard')
}

onMounted(() => {
  generateCaptcha()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.login-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0b1e3f 0%, #071428 50%, #0b1e3f 100%);
  
  .bg-pattern {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(24, 144, 255, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(24, 144, 255, 0.1) 0%, transparent 50%),
      linear-gradient(rgba(24, 144, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(24, 144, 255, 0.03) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 50px 50px, 50px 50px;
  }
}

.login-box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  padding: 40px;
  background: rgba(11, 30, 63, 0.8);
  border: 1px solid $border-color;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 40px rgba(24, 144, 255, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  
  .logo-icon {
    color: $primary-color;
    margin-bottom: 12px;
  }
}

.login-title {
  font-size: 22px;
  color: $text-primary;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.login-subtitle {
  font-size: 13px;
  color: $text-muted;
  margin: 0;
  letter-spacing: 2px;
}

.login-form {
  .el-form-item {
    margin-bottom: 20px;
  }
}

.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-img {
  width: 110px;
  height: 40px;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.2), rgba(24, 144, 255, 0.05));
  border: 1px solid $border-color;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  
  span {
    font-size: 18px;
    font-weight: bold;
    color: $primary-color;
    letter-spacing: 4px;
    font-style: italic;
  }
  
  &:hover {
    border-color: $primary-color;
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  border: none;
  
  &:hover {
    background: linear-gradient(135deg, #40a9ff, #1890ff);
  }
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  
  p {
    color: $text-muted;
    font-size: 12px;
    margin: 0;
  }
}
</style>
