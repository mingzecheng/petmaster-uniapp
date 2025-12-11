<template>
  <view class="password-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">修改密码</text>
      <view class="header-placeholder"></view>
    </view>

    <view class="content-area">
      <!-- 表单卡片 -->
      <view class="form-card">
        <!-- 原密码 -->
        <view class="form-item">
          <text class="form-label">原密码</text>
          <view class="input-group">
            <view class="input-icon">🔒</view>
            <input 
              :type="showOldPassword ? 'text' : 'password'"
              v-model="form.oldPassword"
              placeholder="请输入原密码"
              class="input-field"
            />
            <view class="eye-btn" @click="showOldPassword = !showOldPassword">
              <text>{{ showOldPassword ? '👀' : '🙈' }}</text>
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
        <text class="tips-title">密码要求</text>
        <view class="tips-list">
          <text class="tips-item">• 密码长度至少 6 位</text>
          <text class="tips-item">• 建议使用字母、数字组合</text>
          <text class="tips-item">• 修改后需重新登录</text>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar glass">
      <button class="submit-btn" :loading="loading" @click="handleSubmit">
        确认修改
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * @description 修改密码页面
 */

import { ref } from 'vue'
import { changePassword } from '@/api/user'
import { useUserStore } from '@/stores/user'

/** 用户Store */
const userStore = useUserStore()

/** 表单数据 */
const form = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

/** 密码显示状态 */
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

/** 加载状态 */
const loading = ref(false)

/**
 * 返回
 */
const goBack = () => {
  uni.navigateBack()
}

/**
 * 提交修改
 */
const handleSubmit = async () => {
  // 表单验证
  if (!form.value.oldPassword) {
    uni.showToast({ title: '请输入原密码', icon: 'none' })
    return
  }
  
  if (!form.value.newPassword) {
    uni.showToast({ title: '请输入新密码', icon: 'none' })
    return
  }
  
  if (form.value.newPassword.length < 6) {
    uni.showToast({ title: '新密码至少6位', icon: 'none' })
    return
  }
  
  if (form.value.newPassword !== form.value.confirmPassword) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
    return
  }
  
  loading.value = true
  try {
    await changePassword({
      old_password: form.value.oldPassword,
      new_password: form.value.newPassword
    })
    
    uni.showModal({
      title: '密码修改成功',
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
    const msg = error?.message || '修改失败'
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
