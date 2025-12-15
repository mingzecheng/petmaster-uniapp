<template>
  <view class="login-container">
    <!-- 背景装饰：柔和的品牌色光晕 -->
    <view class="bg-orb top-right"></view>
    <view class="bg-orb bottom-left"></view>
    
    <view class="login-content">
      <!-- Logo 区域：增强品牌展示 -->
      <view class="logo-section">
        <view class="logo-box">
          <text class="logo-emoji">🦴</text>
        </view>
        <view class="title-group">
          <text class="app-title">PetMaster</text>
          <text class="app-subtitle">让养宠生活更美好</text>
        </view>
      </view>

      <!-- 登录表单卡片：悬浮质感 -->
      <view class="form-card">
        <text class="form-title">{{ isRegister ? '创建账号' : '欢迎回来' }}</text>
        
        <!-- 用户名输入 -->
        <view class="input-group" :class="{ 'focused': focusedField === 'username' }">
          <view class="input-icon-box">
            <text class="input-icon">👤</text>
          </view>
          <input
            type="text"
            v-model="formData.username"
            placeholder="账号 / 手机号"
            placeholder-class="input-placeholder"
            class="input-field"
            @focus="focusedField = 'username'"
            @blur="focusedField = ''"
          />
        </view>

        <!-- 密码输入 -->
        <view class="input-group" :class="{ 'focused': focusedField === 'password' }">
          <view class="input-icon-box">
            <text class="input-icon">🔒</text>
          </view>
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="formData.password"
            placeholder="密码"
            placeholder-class="input-placeholder"
            class="input-field"
            @focus="focusedField = 'password'"
            @blur="focusedField = ''"
          />
          <view class="eye-btn" @click="togglePassword">
            <text class="eye-icon" :class="{ active: showPassword }">{{ showPassword ? '👀' : '🙈' }}</text>
          </view>
        </view>

        <!-- 注册模式额外字段 -->
        <template v-if="isRegister">
          <view class="input-group" :class="{ 'focused': focusedField === 'mobile' }">
            <view class="input-icon-box">
              <text class="input-icon">📱</text>
            </view>
            <input
              type="number"
              v-model="formData.mobile"
              placeholder="手机号（选填）"
              placeholder-class="input-placeholder"
              class="input-field"
              maxlength="11"
              @focus="focusedField = 'mobile'"
              @blur="focusedField = ''"
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
          {{ isRegister ? '立即注册' : '登 录' }}
        </button>

        <!-- 切换模式 -->
        <view class="switch-mode" @click="toggleMode">
          <text class="switch-text">{{ isRegister ? '已有账号？' : '新用户？' }}</text>
          <text class="switch-link">{{ isRegister ? '去登录' : '注册账号' }}</text>
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

/** 当前聚焦的输入框 */
const focusedField = ref('')

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
        uni.showToast({ title: '注册成功，请登录', icon: 'success' })
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
  background: #FFF8E1; /* 极淡的暖黄色背景 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  position: relative;
  overflow: hidden;
}

/* 背景光晕 */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  
  &.top-right {
    top: -200rpx;
    right: -200rpx;
    width: 600rpx;
    height: 600rpx;
    background: #FFD54F; /* Amber 300 */
  }
  
  &.bottom-left {
    bottom: -100rpx;
    left: -100rpx;
    width: 500rpx;
    height: 500rpx;
    background: #FFCA28; /* Amber 400 */
  }
}

.login-content {
  width: 100%;
  max-width: 640rpx;
  position: relative;
  z-index: 10;
}

/* Logo 区域 */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.logo-box {
  width: 140rpx;
  height: 140rpx;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  box-shadow: 0 20rpx 40rpx rgba(255, 143, 0, 0.25);
  transform: rotate(-6deg);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  &:active {
    transform: scale(0.95) rotate(-6deg);
  }
}

.logo-emoji {
  font-size: 72rpx;
  filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.1));
}

.title-group {
  text-align: center;
}

.app-title {
  display: block;
  font-size: 56rpx;
  font-weight: 900;
  color: #1F2937;
  letter-spacing: -1rpx;
  margin-bottom: 8rpx;
}

.app-subtitle {
  font-size: 28rpx;
  color: #6B7280;
  font-weight: 500;
  letter-spacing: 2rpx;
}

/* 表单卡片 */
.form-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 48rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.05);
  border: 2rpx solid rgba(255, 255, 255, 0.8);
}

.form-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #1F2937;
  margin-bottom: 48rpx;
  padding-left: 8rpx;
}

/* 输入框样式 */
.input-group {
  display: flex;
  align-items: center;
  background: #F9FAFB;
  border: 2rpx solid transparent; /* 预留边框位置 */
  border-radius: 24rpx;
  padding: 0 24rpx;
  height: 110rpx;
  margin-bottom: 24rpx;
  transition: all 0.3s ease;
  
  &.focused {
    background: #FFFFFF;
    border-color: #FFBF00;
    box-shadow: 0 8rpx 24rpx rgba(255, 191, 0, 0.15);
    transform: translateY(-2rpx);
    
    .input-icon {
      opacity: 1;
      transform: scale(1.1);
    }
  }
}

.input-icon-box {
  width: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.input-icon {
  font-size: 40rpx; // 稍微调大 emoji 尺寸
  opacity: 0.5;
  transition: all 0.3s;
}

.input-field {
  flex: 1;
  height: 100%;
  font-size: 32rpx;
  color: #1F2937;
  font-weight: 500;
  
  &::placeholder {
     color: #9CA3AF;
     font-weight: 400;
  }
}

.input-placeholder {
  color: #9CA3AF;
  font-weight: 400;
}

.eye-btn {
  padding: 20rpx;
  margin-right: -12rpx;
  
  .eye-icon {
    font-size: 36rpx;
    opacity: 0.4;
    transition: all 0.3s;
    
    &.active {
      opacity: 0.8;
    }
  }
}

/* 提交按钮 */
.submit-btn {
  margin-top: 48rpx;
  width: 100%;
  height: 110rpx;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 700;
  color: #1F2937;
  border: none;
  box-shadow: 0 16rpx 32rpx rgba(255, 143, 0, 0.3);
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &::after { border: none; }
  
  &:active {
    transform: scale(0.96);
    box-shadow: 0 8rpx 16rpx rgba(255, 143, 0, 0.2);
  }
  
  &.disabled {
    background: #E5E7EB;
    color: #9CA3AF;
    box-shadow: none;
    opacity: 1; /* 覆盖默认 opacity */
  }
}

/* 切换模式链接 */
.switch-mode {
  text-align: center;
  padding-top: 40rpx;
  
  .switch-text {
    font-size: 28rpx;
    color: #9CA3AF;
  }
  
  .switch-link {
    font-size: 28rpx;
    color: #FF8F00;
    font-weight: 700;
    margin-left: 12rpx;
    position: relative;
    padding-bottom: 4rpx;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2rpx;
      background: currentColor;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    &:active {
      opacity: 0.7;
    }
  }
}

/* reCAPTCHA v2 验证弹窗 (保持原有功能样式，稍作视觉调整) */
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
