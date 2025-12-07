<template>
  <view class="mine-container">
    <!-- 顶部背景 -->
    <view class="header-bg"></view>
    
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="card-content">
        <view class="user-header">
          <view class="user-avatar" @click="goToLogin">
            <text class="avatar-emoji">{{ isLoggedIn ? '😊' : '👤' }}</text>
          </view>
          <view class="user-info">
            <text class="user-name">{{ isLoggedIn ? userInfo?.username : '点击登录/注册' }}</text>
            <view v-if="isLoggedIn" class="user-level-badge">
              <text class="level-icon">👑</text>
              <text class="level-text">{{ userInfo?.member_level?.name || '普通会员' }}</text>
            </view>
            <text v-else class="user-desc">登录享受更多会员权益</text>
          </view>
        </view>
        
        <view v-if="isLoggedIn" class="card-footer">
          <view class="data-item">
            <text class="data-value">{{ userInfo?.points || 0 }}</text>
            <text class="data-label">当前积分</text>
          </view>
          <view class="data-divider"></view>
          <view class="data-item" @click="goTo('/pages/member/index')">
            <text class="data-value">查看</text>
            <text class="data-label">会员权益</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @click="goTo('/pages/appointment/list')">
          <view class="menu-left">
            <view class="menu-icon-box icon-blue">
              <text>📅</text>
            </view>
            <text class="menu-text">我的预约</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goTo('/pages/member/index')">
          <view class="menu-left">
            <view class="menu-icon-box icon-yellow">
              <text>💳</text>
            </view>
            <text class="menu-text">会员中心</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goTo('/pages/pet/index')">
          <view class="menu-left">
            <view class="menu-icon-box icon-green">
              <text>🐕</text>
            </view>
            <text class="menu-text">宠物档案</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @click="handleChangePassword">
          <view class="menu-left">
            <view class="menu-icon-box icon-purple">
              <text>🔐</text>
            </view>
            <text class="menu-text">修改密码</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="handleAbout">
          <view class="menu-left">
            <view class="menu-icon-box icon-grey">
              <text>ℹ️</text>
            </view>
            <text class="menu-text">关于我们</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>
      
      <!-- 退出登录 -->
      <view v-if="isLoggedIn" class="logout-wrapper">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

/** 状态栏高度 */
const statusBarHeight = ref(0)

/** 用户Store */
const userStore = useUserStore()

/** 是否登录 */
const isLoggedIn = computed(() => userStore.isLoggedIn)

/** 用户信息 */
const userInfo = computed(() => userStore.userInfo)

/**
 * 初始化
 */
onMounted(async () => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20

  // 如果已登录，刷新用户信息
  if (isLoggedIn.value) {
    await userStore.fetchUserInfo()
  }
})

/**
 * 跳转登录
 */
const goToLogin = () => {
  if (!isLoggedIn.value) {
    uni.navigateTo({ url: '/pages/login/index' })
  }
}

/**
 * 跳转页面
 */
const goTo = (url: string) => {
  if (!userStore.checkAuth()) return
  uni.navigateTo({ url })
}

/**
 * 修改密码
 */
const handleChangePassword = () => {
  if (!userStore.checkAuth()) return
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

/**
 * 关于我们
 */
const handleAbout = () => {
  uni.showModal({
    title: 'PetMaster',
    content: '专业宠物护理服务平台\n版本：1.0.0',
    showCancel: false
  })
}

/**
 * 退出登录
 */
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
      }
    }
  })
}
</script>

<style lang="scss">
.mine-container {
  min-height: 100vh;
  background-color: $pet-bg-base;
  padding-bottom: 40rpx;
}

/* 顶部背景 - 增加装饰 */
.header-bg {
  height: 360rpx;
  background: linear-gradient(135deg, $pet-primary, #FFC107);
  border-radius: 0 0 48rpx 48rpx;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 0;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    right: -60rpx;
    top: -60rpx;
    width: 300rpx;
    height: 300rpx;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
  }
  
  &::before {
    content: '';
    position: absolute;
    left: -40rpx;
    bottom: 40rpx;
    width: 200rpx;
    height: 200rpx;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
}

/* 用户卡片 */
.user-card {
  position: relative;
  z-index: 1;
  padding: 160rpx 30rpx 0;
  margin-bottom: 40rpx;
}

.card-content {
  background: #fff;
  border-radius: $pet-radius-lg;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.user-avatar {
  width: 128rpx;
  height: 128rpx;
  background: $pet-bg-hover;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 32rpx;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  
  &:active {
    transform: scale(0.95);
  }
}

.avatar-emoji {
  font-size: 64rpx;
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 38rpx;
  font-weight: 800;
  color: $pet-text-main;
  margin-bottom: 12rpx;
}

.user-desc {
  font-size: 26rpx;
  color: $pet-text-secondary;
}

.user-level-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(90deg, #333, #1a1a1a);
  padding: 8rpx 24rpx;
  border-radius: 30rpx;
  gap: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.level-icon {
  font-size: 24rpx;
}

.level-text {
  font-size: 22rpx;
  color: #FFD700;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-top: 32rpx;
  border-top: 2rpx solid $pet-border-light;
}

.data-item {
  text-align: center;
  flex: 1;
  padding: 10rpx 0;
  border-radius: $pet-radius;
  transition: background 0.2s;
  
  &:active {
    background: $pet-bg-hover;
  }
}

.data-divider {
  width: 2rpx;
  height: 40rpx;
  background: $pet-border;
}

.data-value {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: $pet-text-main;
  margin-bottom: 4rpx;
}

.data-label {
  font-size: 24rpx;
  color: $pet-text-secondary;
}

/* 菜单区域 */
.menu-section {
  padding: 0 30rpx;
}

.menu-group {
  background: #fff;
  border-radius: $pet-radius-lg;
  margin-bottom: 30rpx;
  overflow: hidden;
  box-shadow: $pet-shadow;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 30rpx;
  border-bottom: 2rpx solid $pet-border-light;
  transition: background 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background: $pet-bg-hover;
  }
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon-box {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  
  text {
    font-size: 36rpx;
  }
  
  &.icon-blue { background: rgba(41, 121, 255, 0.1); color: $pet-secondary; }
  &.icon-yellow { background: rgba(255, 214, 0, 0.15); color: #FF6F00; }
  &.icon-green { background: rgba(0, 200, 83, 0.1); color: $pet-success; }
  &.icon-purple { background: rgba(156, 39, 176, 0.1); color: #9C27B0; }
  &.icon-grey { background: rgba(158, 158, 158, 0.1); color: #757575; }
}

.menu-text {
  font-size: 30rpx;
  color: $pet-text-main;
  font-weight: 500;
}

.menu-arrow {
  font-size: 32rpx;
  color: $pet-text-placeholder;
}

/* 退出按钮 */
.logout-wrapper {
  margin-top: 60rpx;
  padding-bottom: 40rpx;
}

.logout-btn {
  background: #fff;
  color: $pet-danger;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  box-shadow: $pet-shadow;
  height: 96rpx;
  line-height: 96rpx;
  
  &:active {
    background: #FFF5F5;
    transform: scale(0.98);
  }
  
  &::after {
    border: none;
  }
}
</style>
