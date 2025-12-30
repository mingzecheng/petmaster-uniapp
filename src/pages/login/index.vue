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
        
        <!-- 登录方式切换 -->
        <view class="login-type-tabs">
          <view 
            class="tab-item" 
            :class="{ active: loginType === 'password' }"
            @click="switchLoginType('password')"
          >
            <text class="tab-icon">🔑</text>
            <text class="tab-text">账号密码</text>
          </view>
          <view 
            class="tab-item" 
            :class="{ active: loginType === 'email' }"
            @click="switchLoginType('email')"
          >
            <text class="tab-icon">📧</text>
            <text class="tab-text">邮箱验证</text>
          </view>
        </view>
        
        <!-- 账号密码登录方式 -->
        <template v-if="loginType === 'password'">
        <!-- 用户名输入 -->
        <view class="input-wrapper">
          <view class="input-group" :class="{ 'focused': focusedField === 'username', 'error': errors.username }">
            <view class="input-icon-box">
              <text class="input-icon">👤</text>
            </view>
            <input
              type="text"
              v-model="formData.username"
              placeholder="用户名"
              placeholder-class="input-placeholder"
              class="input-field"
              @focus="focusedField = 'username'"
              @blur="validateField('username')"
              @input="clearError('username')"
            />
          </view>
          <text v-if="errors.username" class="error-text">{{ errors.username }}</text>
        </view>

        <!-- 密码输入 -->
        <view class="input-wrapper">
          <view class="input-group" :class="{ 'focused': focusedField === 'password', 'error': errors.password }">
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
              @blur="validateField('password')"
              @input="clearError('password')"
            />
            <view class="eye-btn" @click="togglePassword">
              <text class="eye-icon" :class="{ active: showPassword }">{{ showPassword ? '👀' : '🙈' }}</text>
            </view>
          </view>
          <text v-if="errors.password" class="error-text">{{ errors.password }}</text>
        </view>

        <template v-if="isRegister">
          <view class="input-wrapper">
            <view class="input-group" :class="{ 'focused': focusedField === 'registerEmail', 'error': errors.registerEmail }">
              <view class="input-icon-box">
                <text class="input-icon">📧</text>
              </view>
              <input
                type="text"
                v-model="formData.registerEmail"
                placeholder="邮箱"
                placeholder-class="input-placeholder"
                class="input-field"
                @focus="focusedField = 'registerEmail'"
                @blur="validateField('registerEmail')"
                @input="clearError('registerEmail')"
              />
            </view>
            <text v-if="errors.registerEmail" class="error-text">{{ errors.registerEmail }}</text>
          </view>
        </template>

        </template>
        
        <!-- 邮箱验证码登录方式 -->
        <template v-else-if="loginType === 'email'">
          <!-- 邮箱输入 -->
          <view class="input-wrapper">
            <view class="input-group" :class="{ 'focused': focusedField === 'email', 'error': errors.email }">
              <view class="input-icon-box">
                <text class="input-icon">📧</text>
              </view>
              <input
                type="text"
                v-model="emailFormData.email"
                placeholder="邮箱地址"
                placeholder-class="input-placeholder"
                class="input-field"
                @focus="focusedField = 'email'"
                @blur="validateEmailField('email')"
                @input="clearEmailError('email')"
              />
            </view>
            <text v-if="errors.email" class="error-text">{{ errors.email }}</text>
          </view>

          <!-- 验证码输入 -->
          <view class="input-wrapper">
            <view class="input-group" :class="{ 'focused': focusedField === 'code', 'error': errors.code }">
              <view class="input-icon-box">
                <text class="input-icon">🔢</text>
              </view>
              <input
                type="number"
                v-model="emailFormData.code"
                placeholder="验证码"
                placeholder-class="input-placeholder"
                class="input-field"
                maxlength="6"
                @focus="focusedField = 'code'"
                @blur="validateEmailField('code')"
                @input="clearEmailError('code')"
              />
              <view 
                class="code-btn" 
                :class="{ disabled: codeSending || countdown > 0 || !isEmailValid }"
                @click="sendCode"
              >
                <text class="code-text">{{ codeButtonText }}</text>
              </view>
            </view>
            <text v-if="errors.code" class="error-text">{{ errors.code }}</text>
          </view>
        </template>
        
        <!-- 提交按钮 -->
        <button 
          class="submit-btn" 
          :class="{ disabled: !isFormValid }"
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

import { ref, reactive, watch, nextTick, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { sendEmailCode } from '@/api/auth'

// #ifdef H5
import { useRecaptcha } from '@/composables/useRecaptcha'
// #endif

/** 表单数据 */
const formData = reactive({
  username: '',
  password: '',
  registerEmail: ''  // 注册时的邮箱（可选）
})

/** 表单错误信息 */
const errors = reactive({
  username: '',
  password: '',
  registerEmail: '',  // 注册时邮箱的错误
  email: '',
  code: ''
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

/** 登录方式：password=账号密码, email=邮箱验证码 */
const loginType = ref<'password' | 'email'>('password')

/** 邮箱表单数据 */
const emailFormData = reactive({
  email: '',
  code: ''
})

/** 验证码发送状态 */
const codeSending = ref(false)

/** 验证码倒计时 */
const countdown = ref(0)

/** 倒计时定时器 */
let countdownTimer: number | null = null

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
  // 清空所有表单
  formData.username = ''
  formData.password = ''
  formData.registerEmail = ''
  emailFormData.email = ''
  emailFormData.code = ''
  // 清除所有错误
  errors.username = ''
  errors.password = ''
  errors.registerEmail = ''
  errors.email = ''
  errors.code = ''
  // 停止倒计时
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 0
}

/** 正则表达式 */
const REGEX = {
  /** 用户名：字母开头，3-20位字母、数字、下划线 */
  username: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/,
  /** 密码：6-20位，必须包含字母和数字 */
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,20}$/,
  /** 邮箱 */
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
}

/**
 * 切换登录方式
 */
const switchLoginType = (type: 'password' | 'email') => {
  if (loginType.value === type) return
  loginType.value = type
  // 清空所有表单
  formData.username = ''
  formData.password = ''
  formData.registerEmail = ''
  emailFormData.email = ''
  emailFormData.code = ''
  // 清除所有错误
  errors.username = ''
  errors.password = ''
  errors.registerEmail = ''
  errors.email = ''
  errors.code = ''
  // 停止倒计时
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 0
}

/**
 * 邮箱是否有效（用于验证码按钮禁用判断）
 */
const isEmailValid = computed(() => {
  return REGEX.email.test(emailFormData.email)
})

/**
 * 验证码按钮文本
 */
const codeButtonText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}s`
  }
  return '获取验证码'
})

/**
 * 表单是否有效（用于提交按钮禁用判断）
 */
const isFormValid = computed(() => {
  if (loginType.value === 'password') {
    return formData.username && formData.password
  } else {
    return emailFormData.email && emailFormData.code
  }
})

/**
 * 清除指定字段的错误
 */
const clearError = (field: 'username' | 'password' | 'registerEmail') => {
  errors[field] = ''
  focusedField.value = field
}

/**
 * 清除邮箱字段的错误
 */
const clearEmailError = (field: 'email' | 'code') => {
  errors[field] = ''
  focusedField.value = field
}

/**
 * 验证邮箱字段（失焦时触发）
 */
const validateEmailField = (field: 'email' | 'code') => {
  focusedField.value = ''
  
  switch (field) {
    case 'email':
      if (!emailFormData.email.trim()) {
        errors.email = '请输入邮箱地址'
      } else if (!REGEX.email.test(emailFormData.email)) {
        errors.email = '请输入有效的邮箱地址'
      } else {
        errors.email = ''
      }
      break
    case 'code':
      if (!emailFormData.code.trim()) {
        errors.code = '请输入验证码'
      } else if (emailFormData.code.length !== 6) {
        errors.code = '验证码为6位数字'
      } else {
        errors.code = ''
      }
      break
  }
}

/**
 * 验证单个字段（失焦时触发）
 */
const validateField = (field: 'username' | 'password' | 'registerEmail') => {
  focusedField.value = ''
  
  switch (field) {
    case 'username':
      if (!formData.username.trim()) {
        errors.username = '请输入用户名'
      } else if (!REGEX.username.test(formData.username)) {
        errors.username = '需字母开头，3-20位字母数字下划线'
      } else {
        errors.username = ''
      }
      break
    case 'password':
      if (!formData.password) {
        errors.password = '请输入密码'
      } else if (!REGEX.password.test(formData.password)) {
        errors.password = '需6-20位，包含字母和数字'
      } else {
        errors.password = ''
      }
      break
    case 'registerEmail':
      // 注册邮箱是可选的，只有填写了才验证格式
      if (formData.registerEmail.trim() && !REGEX.email.test(formData.registerEmail)) {
        errors.registerEmail = '请输入有效的邮箱地址'
      } else {
        errors.registerEmail = ''
      }
      break
  }
}

/**
 * 表单验证
 */
const validateForm = (): boolean => {
  // 用户名验证
  if (!formData.username.trim()) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return false
  }
  if (!REGEX.username.test(formData.username)) {
    uni.showToast({ title: '用户名需字母开头，3-20位字母数字下划线', icon: 'none' })
    return false
  }

  // 密码验证
  if (!formData.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return false
  }
  if (!REGEX.password.test(formData.password)) {
    uni.showToast({ title: '密码需6-20位，包含字母和数字', icon: 'none' })
    return false
  }

  // 注册模式：邮箱是可选的，但如果填写了要验证格式
  if (isRegister.value && formData.registerEmail.trim()) {
    if (!REGEX.email.test(formData.registerEmail)) {
      uni.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
      return false
    }
  }

  return true
}

/**
 * 发送邮箱验证码
 */
const sendCode = async () => {
  // 验证邮箱格式
  if (!emailFormData.email.trim()) {
    uni.showToast({ title: '请输入邮箱地址', icon: 'none' })
    return
  }
  if (!REGEX.email.test(emailFormData.email)) {
    uni.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
    return
  }
  
  // 防止重复发送
  if (codeSending.value || countdown.value > 0) {
    return
  }
  
  codeSending.value = true
  try {
    const scene = isRegister.value ? 'register' : 'login'
    const res = await sendEmailCode({
      email: emailFormData.email,
      scene
    })
    
    if (res.success) {
      uni.showToast({ title: res.message, icon: 'success' })
      // 开始倒计时
      countdown.value = 60
      countdownTimer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          if (countdownTimer) {
            clearInterval(countdownTimer)
            countdownTimer = null
          }
        }
      }, 1000) as unknown as number
    } else {
      uni.showToast({ title: res.message, icon: 'none' })
    }
  } catch (error: any) {
    console.error('发送验证码失败:', error)
    uni.showToast({ title: error.message || '发送失败，请稍后重试', icon: 'none' })
  } finally {
    codeSending.value = false
  }
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  // 账号密码方式需要验证表单
  if (loginType.value === 'password' && !validateForm()) return
  
  // 邮箱方式需要验证邮箱和验证码
  if (loginType.value === 'email') {
    if (!emailFormData.email.trim()) {
      uni.showToast({ title: '请输入邮箱地址', icon: 'none' })
      return
    }
    if (!REGEX.email.test(emailFormData.email)) {
      uni.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
      return
    }
    if (!emailFormData.code.trim()) {
      uni.showToast({ title: '请输入验证码', icon: 'none' })
      return
    }
    if (emailFormData.code.length !== 6) {
      uni.showToast({ title: '验证码为6位数字', icon: 'none' })
      return
    }
  }

  // #ifdef H5
  // v2 验证：登录和注册都需要验证（仅账号密码方式）
  if (loginType.value === 'password' && recaptchaVersion === 'v2') {
    try {
      await executeRecaptcha(isRegister.value ? 'register' : 'login')
    } catch (_error) {
      showRecaptchaModal.value = true
      return
    }
  }
  // #endif

  loading.value = true
  try {
    // 邮箱验证码登录/注册
    if (loginType.value === 'email') {
      if (isRegister.value) {
        // 邮箱验证码注册（注册后自动登录）
        const success = await userStore.emailRegister({
          email: emailFormData.email,
          code: emailFormData.code
        })
        if (success) {
          uni.showToast({ title: '注册成功', icon: 'success' })
          setTimeout(() => {
            uni.switchTab({ url: '/pages/index/index' })
          }, 1000)
        }
      } else {
        // 邮箱验证码登录
        const success = await userStore.emailLogin({
          email: emailFormData.email,
          code: emailFormData.code
        })
        if (success) {
          uni.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            uni.switchTab({ url: '/pages/index/index' })
          }, 1000)
        }
      }
    } 
    // 账号密码登录/注册
    else {
      // #ifdef H5
      let recaptchaToken: string | undefined
      try {
        recaptchaToken = await executeRecaptcha(isRegister.value ? 'register' : 'login')
      } catch (error: any) {
        console.error('reCAPTCHA error:', error)
        uni.showToast({ title: error.message || '验证码验证失败', icon: 'none' })
        loading.value = false
        return
      }
      // #endif

      if (isRegister.value) {
        // 账号密码注册
        const success = await userStore.register({
          username: formData.username,
          password: formData.password,
          email: formData.registerEmail || undefined,
          // #ifdef H5
          recaptcha_token: recaptchaToken
          // #endif
        })
        if (success) {
          isRegister.value = false
          formData.password = ''
          uni.showToast({ title: '注册成功，请登录', icon: 'success' })
        }
      } else {
        // 账号密码登录
        const success = await userStore.login({
          username: formData.username,
          password: formData.password,
          // #ifdef H5
          recaptcha_token: recaptchaToken
          // #endif
        })
        if (success) {
          uni.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            uni.switchTab({ url: '/pages/index/index' })
          }, 1000)
        }
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
  margin-bottom: 32rpx;
  padding-left: 8rpx;
}

/* 登录方式切换标签 */
.login-type-tabs {
  display: flex;
  background: #F3F4F6;
  border-radius: 20rpx;
  padding: 6rpx;
  margin-bottom: 36rpx;
  
  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    height: 72rpx;
    border-radius: 16rpx;
    transition: all 0.3s ease;
    cursor: pointer;
    
    .tab-icon {
      font-size: 32rpx;
      opacity: 0.5;
      transition: all 0.3s;
    }
    
    .tab-text {
      font-size: 28rpx;
      font-weight: 600;
      color: #6B7280;
      transition: all 0.3s;
    }
    
    &.active {
      background: #FFFFFF;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
      
      .tab-icon {
        opacity: 1;
        transform: scale(1.1);
      }
      
      .tab-text {
        color: #FF8F00;
      }
    }
    
    &:active {
      transform: scale(0.97);
    }
  }
}

/* 输入框包裹容器 */
.input-wrapper {
  margin-bottom: 24rpx;
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
  
  &.error {
    border-color: #F56C6C;
    background: #FEF0F0;
  }
}

/* 错误提示文字 */
.error-text {
  display: block;
  font-size: 24rpx;
  color: #F56C6C;
  padding: 8rpx 12rpx 0;
  line-height: 1.4;
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

/* 验证码按钮 */
.code-btn {
  padding: 16rpx 24rpx;
  margin-right: -12rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  transition: all 0.2s;
  
  .code-text {
    font-size: 26rpx;
    font-weight: 600;
    color: #1F2937;
    white-space: nowrap;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &.disabled {
    background: #E5E7EB;
    opacity: 0.6;
    
    .code-text {
      color: #9CA3AF;
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
