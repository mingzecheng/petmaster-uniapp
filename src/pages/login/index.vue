<template>
  <view class="login-container">
    <!-- 登录卡片 -->
    <view class="login-card">
      <!-- Logo区域 -->
      <view class="logo-section">
        <view class="logo-icon">
          <text class="logo-emoji">🐕</text>
        </view>
        <text class="title">PetMaster</text>
        <text class="subtitle">专业宠物护理平台</text>
      </view>

      <!-- 表单区域 -->
      <view class="form-section">
        <!-- 用户名输入 -->
        <view class="input-group">
          <text class="input-label">用户名</text>
          <input
            type="text"
            v-model="formData.username"
            placeholder="请输入用户名"
            placeholder-class="input-placeholder"
            class="input-field"
          />
        </view>

        <!-- 密码输入 -->
        <view class="input-group">
          <text class="input-label">密码</text>
          <view class="password-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="formData.password"
              placeholder="请输入密码"
              placeholder-class="input-placeholder"
              class="input-field"
            />
            <view class="eye-icon" @click="togglePassword">
              <text>{{ showPassword ? '显示' : '隐藏' }}</text>
            </view>
          </view>
        </view>

        <!-- 注册模式额外字段 -->
        <template v-if="isRegister">
          <view class="input-group">
            <text class="input-label">手机号</text>
            <input
              type="text"
              v-model="formData.mobile"
              placeholder="请输入手机号（选填）"
              placeholder-class="input-placeholder"
              class="input-field"
            />
          </view>
        </template>

        <!-- 登录/注册按钮 -->
        <button class="submit-btn" :loading="loading" @click="handleSubmit">
          {{ isRegister ? '注册账号' : '立即登录' }}
        </button>

        <!-- 切换模式 -->
        <view class="switch-mode">
          <text class="switch-text">
            {{ isRegister ? '已有账号？' : '还没有账号？' }}
          </text>
          <text class="switch-link" @click="toggleMode">
            {{ isRegister ? '去登录' : '去注册' }}
          </text>
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
  background-color: $pet-bg-base;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 640rpx;
  background: #fff;
  border-radius: 40rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(0, 0, 0, 0.02);
}

/* Logo区域 */
.logo-section {
  text-align: center;
  margin-bottom: 60rpx;
}

.logo-icon {
  width: 140rpx;
  height: 140rpx;
  background: linear-gradient(135deg, $pet-primary, $pet-primary-dark);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
  box-shadow: 0 12rpx 32rpx rgba(255, 214, 0, 0.3);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 40rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.3);
  }
}

.logo-emoji {
  font-size: 72rpx;
}

.title {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  color: $pet-text-main;
  margin-bottom: 12rpx;
  letter-spacing: -1rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: $pet-text-secondary;
  font-weight: 500;
}

/* 表单区域 */
.form-section {
  margin-bottom: 20rpx;
}

.input-group {
  margin-bottom: 36rpx;
}

.input-label {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: $pet-text-main;
  margin-bottom: 16rpx;
}

.input-field {
  width: 100%;
  height: 96rpx;
  background: $pet-bg-hover;
  border: 2rpx solid transparent;
  border-radius: 24rpx;
  padding: 0 32rpx;
  font-size: 30rpx;
  color: $pet-text-main;
  transition: all 0.3s;
  box-sizing: border-box;
  
  &:focus {
    background: #fff;
    border-color: $pet-primary;
    box-shadow: 0 0 0 6rpx $pet-primary-fade;
  }
}

.input-placeholder {
  color: $pet-text-placeholder;
}

.password-wrapper {
  position: relative;
}

.eye-icon {
  position: absolute;
  right: 0;
  top: 0;
  height: 96rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  z-index: 2;
  
  text {
    font-size: 26rpx;
    color: $pet-secondary;
    font-weight: 600;
  }
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 100rpx;
  line-height: 100rpx;
  background: linear-gradient(135deg, $pet-primary, $pet-primary-dark);
  border: none;
  border-radius: 50rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: $pet-text-main;
  margin-top: 60rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 214, 0, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(255, 214, 0, 0.2);
  }
  
  &::after {
    border: none;
  }
}

/* 切换模式 */
.switch-mode {
  text-align: center;
  margin-top: 40rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12rpx;
}

.switch-text {
  font-size: 28rpx;
  color: $pet-text-secondary;
}

.switch-link {
  font-size: 28rpx;
  color: $pet-secondary;
  font-weight: 700;
}

/* reCAPTCHA v2 验证弹窗 */
.recaptcha-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.recaptcha-content {
  background: #fff;
  border-radius: 32rpx;
  padding: 48rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
  width: 600rpx;
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
  color: $pet-text-main;
}

.recaptcha-close {
  font-size: 44rpx;
  color: $pet-text-secondary;
  line-height: 1;
  padding: 10rpx;
  opacity: 0.6;
  
  &:active {
    opacity: 1;
  }
}

.recaptcha-wrapper {
  display: flex;
  justify-content: center;
  min-height: 160rpx;
}
</style>
