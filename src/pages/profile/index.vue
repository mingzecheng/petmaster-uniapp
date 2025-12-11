<template>
  <view class="profile-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">个人信息</text>
      <view class="header-placeholder"></view>
    </view>

    <view class="content-area">
      <!-- 头像选择 -->
      <view class="avatar-section">
        <view class="current-avatar">
          <view class="avatar-ring">
            <view class="avatar-inner">
              <text class="avatar-emoji">{{ getAvatarEmoji(selectedAvatar) }}</text>
            </view>
          </view>
          <view class="change-btn">
            <text>✏️</text>
          </view>
        </view>
        <text class="user-id">ID: {{ userStore.userInfo?.id }}</text>
      </view>

      <!-- 头像选择网格 -->
      <view class="section-card">
        <text class="section-label">选择头像</text>
        <view class="avatar-grid">
          <view 
            v-for="(avatar, index) in avatarList" 
            :key="index"
            :class="['avatar-item', { selected: selectedAvatar === avatar.url }]"
            @click="selectAvatar(avatar.url)"
          >
            <text class="avatar-emoji">{{ avatar.emoji }}</text>
          </view>
        </view>
      </view>

      <!-- 表单区域 -->
      <view class="section-card">
        <view class="form-item">
          <text class="form-label">昵称</text>
          <input 
            type="text"
            v-model="form.username"
            placeholder="请输入用户名"
            class="form-input"
            maxlength="20"
          />
        </view>
      </view>

      <!-- 只读信息 -->
      <view class="section-card">
        <view class="info-row">
          <text class="info-label">当前等级</text>
          <view class="info-value-row">
            <text class="level-icon">👑</text>
            <text class="info-value">{{ userStore.userInfo?.member_level?.name || '普通会员' }}</text>
          </view>
        </view>
        <view class="info-row no-border">
          <text class="info-label">注册时间</text>
          <text class="info-value">{{ formatDate(userStore.userInfo?.created_at) }}</text>
        </view>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="bottom-bar glass">
      <button class="submit-btn" :loading="loading" @click="handleSubmit">
        保存修改
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * @description 个人资料编辑页面
 */

import { ref, onMounted } from 'vue'
import { updateCurrentUser } from '@/api/user'
import { useUserStore } from '@/stores/user'

/** 用户Store */
const userStore = useUserStore()

/** 预设头像列表 */
const avatarList = [
  { emoji: '😊', url: 'avatar_smile' },
  { emoji: '😎', url: 'avatar_cool' },
  { emoji: '🐶', url: 'avatar_dog' },
  { emoji: '🐱', url: 'avatar_cat' },
  { emoji: '🦊', url: 'avatar_fox' }
]

/** 选中的头像 */
const selectedAvatar = ref('')

/** 表单数据 */
const form = ref({
  username: ''
})

/** 加载状态 */
const loading = ref(false)

/**
 * 初始化
 */
onMounted(() => {
  // 加载当前用户信息
  const userInfo = userStore.userInfo
  if (userInfo) {
    form.value.username = userInfo.username || ''
    selectedAvatar.value = userInfo.avatar || avatarList[0].url
  }
})

/**
 * 返回
 */
const goBack = () => {
  uni.navigateBack()
}

/**
 * 获取头像 emoji
 */
const getAvatarEmoji = (url: string): string => {
  const avatar = avatarList.find(a => a.url === url)
  return avatar?.emoji || '😊'
}

/**
 * 格式化日期
 */
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  return dateStr.split('T')[0]
}

/**
 * 选择头像
 */
const selectAvatar = (url: string) => {
  selectedAvatar.value = url
}

/**
 * 提交修改
 */
const handleSubmit = async () => {
  // 表单验证
  if (!form.value.username || form.value.username.length < 3) {
    uni.showToast({ title: '用户名至少3个字符', icon: 'none' })
    return
  }
  
  if (form.value.username.length > 20) {
    uni.showToast({ title: '用户名最多20个字符', icon: 'none' })
    return
  }
  
  loading.value = true
  try {
    await updateCurrentUser({
      username: form.value.username,
      avatar: selectedAvatar.value
    })
    
    // 刷新用户信息
    await userStore.fetchUserInfo()
    
    uni.showToast({ title: '修改成功', icon: 'success' })
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    const msg = error?.message || '修改失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.profile-container {
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

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.current-avatar {
  position: relative;
  margin-bottom: 16rpx;
}

.avatar-ring {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  padding: 6rpx;
}

.avatar-inner {
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-inner .avatar-emoji {
  font-size: 72rpx;
}

.change-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 48rpx;
  height: 48rpx;
  background: #FFBF00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(251, 191, 36, 0.4);
  
  text {
    font-size: 24rpx;
  }
}

.user-id {
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 区块卡片 */
.section-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.section-label {
  display: block;
  font-size: 24rpx;
  color: #9CA3AF;
  margin-bottom: 24rpx;
}

/* 头像网格 */
.avatar-grid {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.avatar-item {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid transparent;
  transition: all 0.2s;
  
  &.selected {
    border-color: #FFBF00;
    background: #FEF3C7;
    transform: scale(1.1);
  }
  
  .avatar-emoji {
    font-size: 40rpx;
  }
}

/* 表单项 */
.form-item {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 24rpx;
  color: #9CA3AF;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #F9FAFB;
  border-radius: 24rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #1F2937;
  box-sizing: border-box;
}

/* 只读信息 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #F3F4F6;
  
  &.no-border {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.info-label {
  font-size: 24rpx;
  color: #9CA3AF;
}

.info-value-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.level-icon {
  font-size: 24rpx;
}

.info-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #374151;
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
