<template>
  <view class="login-container">
    <!-- 背景装饰 -->
    <view class="bg-decoration top-right"></view>
    <view class="bg-decoration bottom-left"></view>
    
    <view class="login-content">
      <!-- Logo 区域 -->
      <view class="logo-section">
        <view class="logo-box">
          <text class="logo-emoji">🦴</text>
        </view>
        <text class="app-title">PetMaster</text>
        <text class="app-subtitle">爱宠智能管家</text>
      </view>

      <!-- 登录表单卡片 -->
      <view class="form-card">
        <!-- 用户名输入 -->
        <view class="input-group">
          <view class="input-icon">👤</view>
          <input
            type="text"
            v-model="formData.username"
            placeholder="账号 / 手机号"
            placeholder-class="input-placeholder"
            class="input-field"
          />
        </view>

        <!-- 密码输入 -->
        <view class="input-group">
          <view class="input-icon">🔒</view>
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="formData.password"
            placeholder="密码"
            placeholder-class="input-placeholder"
            class="input-field"
          />
          <view class="eye-btn" @click="togglePassword">
            <text class="eye-icon">{{ showPassword ? '👀' : '🙈' }}</text>
          </view>
        </view>

        <!-- 注册模式额外字段 -->
        <template v-if="isRegister">
          <view class="input-group">
            <view class="input-icon">📱</view>
            <input
              type="number"
              v-model="formData.mobile"
              placeholder="手机号（选填）"
              placeholder-class="input-placeholder"
              class="input-field"
              maxlength="11"
            />
          </view>
        </template>

        <!-- 提交按钮 -->
        <button 
          class="submit-btn" 
          :class="{ disabled: !formData.username || !formData.password }"
          :loading="loading" 
          @click="handleSubmit"
        >
          {{ isRegister ? '注册并登录' : '立即登录' }}
        </button>

        <!-- 切换模式 -->
        <view class="switch-mode" @click="toggleMode">
          <text class="switch-text">{{ isRegister ? '已有账号？' : '还没有账号？' }}</text>
          <text class="switch-link">{{ isRegister ? '去登录' : '去注册' }}</text>
        </view>
      </view>
    </view>

    <!-- #ifdef H5 -->
    <!-- reCAPTCHA v2 验证弹窗 -->
    <view v-show="showRecaptchaModal" class="recaptcha-modal" @click.self="showRecaptchaModal = false">
      <view class="recaptcha-content">
        <view class="recaptcha-header">
          <text class="recaptcha-title">安全验证</text>
          <text class="recaptcha-close" @click="showRecaptchaModal = false">✕</text>
        </view>
        <view id="recaptcha-container" class="recaptcha-wrapper"></view>
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
/**
 * @description 登录页面
 * 支持登录/注册模式切换，H5 平台集成 Google reCAPTCHA v2/v3 验证
 */

import { ref, reactive, watch, nextTick, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

// #ifdef H5
import { useRecaptcha } from '@/composables/useRecaptcha'
// #endif

/** 表单数据 */
const formData = reactive({
  username: '',
  password: '',
  mobile: ''
})

/** 是否显示密码 */
const showPassword = ref(false)

/** 是否注册模式 */
const isRegister = ref(false)

/** 加载状态 */
const loading = ref(false)

/** 用户Store */
const userStore = useUserStore()

// #ifdef H5
/** reCAPTCHA 相关 */
const { version: recaptchaVersion, renderV2, executeRecaptcha, resetV2, loadRecaptcha } = useRecaptcha()
const showRecaptchaModal = ref(false)
const v2WidgetId = ref<number | null>(null)

/** 预加载 reCAPTCHA 脚本 (v2 和 v3 都预加载) */
onMounted(async () => {
  try {
    await loadRecaptcha()
    console.log('reCAPTCHA 脚本预加载成功')
  } catch (error) {
    console.warn('reCAPTCHA 预加载失败:', error)
  }
})

/** 监听 v2 弹窗显示，渲染验证框 */
watch(showRecaptchaModal, async (visible) => {
  if (visible && recaptchaVersion === 'v2') {
    await nextTick()
    
    // 如果已经渲染过，只需重置验证状态
    if (v2WidgetId.value !== null) {
      resetV2(v2WidgetId.value)
      return
    }
    
    // 首次渲染验证框
    try {
      const widgetId = await renderV2('recaptcha-container', (_token) => {
        showRecaptchaModal.value = false
        handleSubmit()
      })
      v2WidgetId.value = widgetId
    } catch (error) {
      console.error('reCAPTCHA v2 渲染失败:', error)
      uni.showToast({ title: '验证码加载失败，请刷新重试', icon: 'none' })
    }
  }
})
// #endif

/**
 * 切换密码显示
 */
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

/**
 * 切换登录/注册模式
 */
const toggleMode = () => {
  isRegister.value = !isRegister.value
  formData.username = ''
  formData.password = ''
  formData.mobile = ''
}

/**
 * 表单验证
 */
const validateForm = (): boolean => {
  if (!formData.username.trim()) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return false
  }
  if (formData.username.length < 3) {
    uni.showToast({ title: '用户名至少3个字符', icon: 'none' })
    return false
  }
  if (!formData.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return false
  }
  if (formData.password.length < 6) {
    uni.showToast({ title: '密码至少6位', icon: 'none' })
    return false
  }
  return true
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!validateForm()) return

  // #ifdef H5
  // v2 特殊处理：如果未验证，显示弹窗
  if (recaptchaVersion === 'v2' && !isRegister.value) {
    try {
      await executeRecaptcha('login')
    } catch (_error) {
      showRecaptchaModal.value = true
      return
    }
  }
  // #endif

  loading.value = true
  try {
    if (isRegister.value) {
      // 注册
      const success = await userStore.register({
        username: formData.username,
        password: formData.password,
        mobile: formData.mobile || undefined
      })
      if (success) {
        isRegister.value = false
        formData.password = ''
      }
    } else {
      // 登录
      let recaptchaToken: string | undefined

      // #ifdef H5
      try {
        recaptchaToken = await executeRecaptcha('login')
      } catch (error: any) {
        console.error('reCAPTCHA error:', error)
        uni.showToast({ title: error.message || '验证码验证失败', icon: 'none' })
        loading.value = false
        return
      }
      // #endif

      const success = await userStore.login({
        username: formData.username,
        password: formData.password,
        recaptcha_token: recaptchaToken
      })
      if (success) {
        uni.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' })
        }, 1000)
      }
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.login-container {
  min-height: 100vh;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  
  &.top-right {
    top: -10%;
    right: -10%;
    width: 500rpx;
    height: 500rpx;
    background: radial-gradient(circle, rgba(254, 243, 199, 0.8) 0%, transparent 70%);
  }
  
  &.bottom-left {
    bottom: -10%;
    left: -10%;
    width: 500rpx;
    height: 500rpx;
    background: radial-gradient(circle, rgba(254, 215, 170, 0.6) 0%, transparent 70%);
  }
}

.login-content {
  width: 100%;
  max-width: 680rpx;
  position: relative;
  z-index: 1;
}

/* Logo 区域 */
.logo-section {
  text-align: center;
  margin-bottom: 80rpx;
}

.logo-box {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #FFD54F 0%, #FF8F00 100%);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
  box-shadow: 0 16rpx 40rpx rgba(245, 158, 11, 0.35);
  transform: rotate(3deg);
}

.logo-emoji {
  font-size: 80rpx;
  filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.1));
}

.app-title {
  display: block;
  font-size: 64rpx;
  font-weight: 900;
  color: #1F2937;
  letter-spacing: -2rpx;
  margin-bottom: 12rpx;
}

.app-subtitle {
  display: block;
  font-size: 28rpx;
  color: #9CA3AF;
  font-weight: 500;
}

/* 表单卡片 */
.form-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.input-group {
  display: flex;
  align-items: center;
  background: #F3F4F6;
  border-radius: 32rpx;
  padding: 0 32rpx;
  height: 100rpx;
  gap: 20rpx;
  transition: all 0.3s;
  
  &:focus-within {
    background: #FFFFFF;
    box-shadow: 0 0 0 4rpx rgba(251, 191, 36, 0.3);
  }
}

.input-icon {
  font-size: 36rpx;
  opacity: 0.6;
}

.input-field {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #1F2937;
}

.input-placeholder {
  color: #9CA3AF;
}

.eye-btn {
  padding: 16rpx;
  margin-right: -16rpx;
}

.eye-icon {
  font-size: 32rpx;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  border-radius: 32rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #1F2937;
  margin-top: 24rpx;
  border: none;
  box-shadow: 0 12rpx 32rpx rgba(251, 191, 36, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &::after {
    border: none;
  }
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 8rpx 24rpx rgba(251, 191, 36, 0.35);
  }
  
  &.disabled {
    opacity: 0.5;
    box-shadow: none;
  }
}

/* 切换模式 */
.switch-mode {
  text-align: center;
  padding: 32rpx 20rpx;
  
  .switch-text {
    font-size: 28rpx;
    color: #9CA3AF;
  }
  
  .switch-link {
    font-size: 28rpx;
    color: #FF8F00;
    font-weight: 600;
    margin-left: 8rpx;
  }
}

/* reCAPTCHA v2 验证弹窗 */
.recaptcha-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.recaptcha-content {
  background: #FFFFFF;
  border-radius: 40rpx;
  padding: 48rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
  width: 620rpx;
}

.recaptcha-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.recaptcha-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1F2937;
}

.recaptcha-close {
  font-size: 40rpx;
  color: #9CA3AF;
  line-height: 1;
  padding: 10rpx;
  
  &:active {
    color: #1F2937;
  }
}

.recaptcha-wrapper {
  display: flex;
  justify-content: center;
  min-height: 160rpx;
}
</style>
