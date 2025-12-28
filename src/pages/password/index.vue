<template>
  <view class="password-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">密码管理</text>
      <view class="header-placeholder"></view>
    </view>

    <view class="content-area">
      <!-- 表单卡片 -->
      <view class="form-card">
        <!-- 邮箱地址 -->
        <view class="form-item">
          <text class="form-label">邮箱地址</text>
          <view class="input-group">
            <view class="input-icon">📧</view>
            <input 
              type="text"
              v-model="form.email"
              placeholder="请输入邮箱地址"
              class="input-field"
              @blur="validateEmailField"
              @input="clearEmailError"
            />
          </view>
          <text v-if="emailError" class="error-text">{{ emailError }}</text>
        </view>

        <!-- 邮箱验证码 -->
        <view class="form-item">
          <text class="form-label">邮箱验证码</text>
          <view class="input-group">
            <view class="input-icon">🔢</view>
            <input 
              type="text"
              v-model="form.code"
              placeholder="请输入6位验证码"
              maxlength="6"
              class="input-field"
            />
            <view 
              class="code-btn"
              :class="{ disabled: !isEmailValid || codeSending || countdown > 0 }"
              @click="sendCode"
            >
              <text class="code-text">{{ codeButtonText }}</text>
            </view>
          </view>
        </view>

        <!-- 新密码 -->
        <view class="form-item">
          <text class="form-label">新密码</text>
          <view class="input-group">
            <view class="input-icon">🔐</view>
            <input 
              :type="showNewPassword ? 'text' : 'password'"
              v-model="form.newPassword"
              placeholder="请输入新密码（至少6位）"
              class="input-field"
            />
            <view class="eye-btn" @click="showNewPassword = !showNewPassword">
              <text>{{ showNewPassword ? '👀' : '🙈' }}</text>
            </view>
          </view>
        </view>

        <!-- 确认密码 -->
        <view class="form-item">
          <text class="form-label">确认密码</text>
          <view class="input-group">
            <view class="input-icon">✅</view>
            <input 
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="form.confirmPassword"
              placeholder="请再次输入新密码"
              class="input-field"
            />
            <view class="eye-btn" @click="showConfirmPassword = !showConfirmPassword">
              <text>{{ showConfirmPassword ? '👀' : '🙈' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 提示信息 -->
      <view class="tips-card">
        <text class="tips-title">密码设置要求</text>
        <view class="tips-list">
          <text class="tips-item">• 密码长度至少 6 位</text>
          <text class="tips-item">• 必须包含字母和数字</text>
          <text class="tips-item">• 支持特殊字符 @$!%*#?&</text>
          <text class="tips-item">• 需要邮箱验证码验证</text>
          <text class="tips-item">• 设置成功后需重新登录</text>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar glass">
      <button class="submit-btn" :loading="loading" @click="handleSubmit">
        确认设置
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * @description 密码管理页面（通过邮箱验证码设置/修改密码）
 */

import { ref, computed, onMounted } from 'vue'
import { setPassword } from '@/api/user'
import { sendEmailCode } from '@/api/auth'
import { useUserStore } from '@/stores/user'

/** 用户Store */
const userStore = useUserStore()

/** 用户信息 */
const userInfo = computed(() => userStore.userInfo)

/** 页面标题 */
const pageTitle = computed(() => '设置/修改密码')

/** 表单数据 */
const form = ref({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

/** 邮箱错误信息 */
const emailError = ref('')

/** 验证码发送状态 */
const codeSending = ref(false)

/** 倒计时秒数 */
const countdown = ref(0)

/** 倒计时定时器 */
let countdownTimer: number | null = null

/** 密码显示状态 */
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

/** 加载状态 */
const loading = ref(false)

/** 邮箱验证正则 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 密码强度正则：至少6位，必须包含字母和数字 */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/

/** 邮箱是否有效 */
const isEmailValid = computed(() => {
  return EMAIL_REGEX.test(form.value.email)
})

/** 验证码按钮文本 */
const codeButtonText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}s`
  }
  if (codeSending.value) {
    return '发送中...'
  }
  return '获取验证码'
})

/**
 * 初始化
 */
onMounted(() => {
  // 预填邮箱
  if (userInfo.value?.email) {
    form.value.email = userInfo.value.email
  }
})

/**
 * 验证邮箱字段
 */
const validateEmailField = () => {
  if (form.value.email && !isEmailValid.value) {
    emailError.value = '请输入有效的邮箱地址'
  }
}

/**
 * 清除邮箱错误
 */
const clearEmailError = () => {
  emailError.value = ''
}

/**
 * 发送验证码
 */
const sendCode = async () => {
  // 验证邮箱
  if (!form.value.email) {
    uni.showToast({ title: '请输入邮箱地址', icon: 'none' })
    return
  }
  
  if (!isEmailValid.value) {
    uni.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
    return
  }
  
  // 检查是否在倒计时中
  if (countdown.value > 0 || codeSending.value) {
    return
  }
  
  codeSending.value = true
  try {
    // 调用发送验证码API（使用login场景，因为用户已登录，邮箱肯定存在）
    await sendEmailCode({
      email: form.value.email,
      scene: 'login'
    })
    
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    
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
  } catch (error: any) {
    uni.showToast({ 
      title: error?.message || '发送验证码失败', 
      icon: 'none' 
    })
  } finally {
    codeSending.value = false
  }
}

/**
 * 返回
 */
const goBack = () => {
  // 清除定时器
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  uni.navigateBack()
}

/**
 * 提交修改
 */
const handleSubmit = async () => {
  // 验证邮箱
  if (!form.value.email) {
    uni.showToast({ title: '请输入邮箱地址', icon: 'none' })
    return
  }
  
  if (!isEmailValid.value) {
    uni.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
    return
  }
  
  // 验证验证码
  if (!form.value.code) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  
  if (form.value.code.length !== 6) {
    uni.showToast({ title: '验证码为6位数字', icon: 'none' })
    return
  }
  
  // 验证新密码
  if (!form.value.newPassword) {
    uni.showToast({ title: '请输入新密码', icon: 'none' })
    return
  }
  
  if (form.value.newPassword.length < 6) {
    uni.showToast({ title: '新密码至少6位', icon: 'none' })
    return
  }
  
  // 验证密码强度
  if (!PASSWORD_REGEX.test(form.value.newPassword)) {
    uni.showToast({ 
      title: '密码必须包含字母和数字', 
      icon: 'none',
      duration: 2000
    })
    return
  }
  
  // 验证确认密码
  if (form.value.newPassword !== form.value.confirmPassword) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
    return
  }
  
  loading.value = true
  try {
    // 设置/修改密码（统一使用setPassword API，只需邮箱验证码）
    await setPassword({
      email: form.value.email,
      code: form.value.code,
      new_password: form.value.newPassword
    })
    
    uni.showModal({
      title: '密码设置成功',
      content: '为了您的账户安全，请重新登录',
      showCancel: false,
      success: () => {
        // 清除登录状态
        userStore.logout()
        // 跳转到登录页
        uni.reLaunch({ url: '/pages/login/index' })
      }
    })
  } catch (error: any) {
    const msg = error?.message || '设置失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.password-container {
  min-height: 100vh;
  background: #FAFAFA;
  padding-bottom: 160rpx;
}

/* 顶部导航 */
.sub-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 20rpx);
  
  &.glass {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  }
}

.back-btn {
  width: 72rpx;
  height: 72rpx;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  
  text {
    font-size: 48rpx;
    color: #374151;
    line-height: 1;
  }
}

.header-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1F2937;
}

.header-placeholder {
  width: 72rpx;
}

/* 内容区域 */
.content-area {
  padding: 32rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 120rpx);
}

/* 表单卡片 */
.form-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.form-item {
  margin-bottom: 28rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 24rpx;
  color: #9CA3AF;
  margin-bottom: 12rpx;
}

.input-group {
  display: flex;
  align-items: center;
  background: #F3F4F6;
  border-radius: 24rpx;
  padding: 0 24rpx;
  height: 96rpx;
  gap: 16rpx;
  transition: all 0.3s;
  
  &:focus-within {
    background: #FFFFFF;
    box-shadow: 0 0 0 4rpx rgba(251, 191, 36, 0.2);
  }
}

.input-icon {
  font-size: 32rpx;
  opacity: 0.6;
}

.input-field {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #1F2937;
}

.eye-btn {
  padding: 16rpx;
  margin-right: -16rpx;
  
  text {
    font-size: 28rpx;
  }
}

.error-text {
  display: block;
  font-size: 22rpx;
  color: #EF4444;
  margin-top: 8rpx;
  padding-left: 12rpx;
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

/* 提示卡片 */
.tips-card {
  background: #FEF3C7;
  border-radius: 24rpx;
  padding: 24rpx;
}

.tips-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #92400E;
  margin-bottom: 16rpx;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.tips-item {
  font-size: 24rpx;
  color: #B45309;
}

/* 底部按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  
  &.glass {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  }
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: #1F2937;
  border-radius: 32rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(31, 41, 55, 0.25);
  
  &::after { border: none; }
  
  &:active {
    transform: scale(0.98);
  }
}
</style>
