<template>
  <view class="mine-container">
    <!-- 用户信息区域 - 暗色风格 -->
    <view class="user-header" :style="{ paddingTop: (statusBarHeight + 40) + 'px' }">
      <!-- 用户头像和信息 -->
      <view class="user-info-row" @click="isLoggedIn ? goToProfile() : goToLogin()">
        <view class="avatar-wrapper">
          <view class="avatar-ring">
            <view class="avatar-inner">
              <text class="avatar-emoji">{{ getAvatarEmoji() }}</text>
            </view>
          </view>
          <view v-if="isLoggedIn" class="level-badge">
            LV.{{ userInfo?.member_level?.level || 1 }}
          </view>
        </view>
        <view class="user-info-content">
          <text class="username">{{ isLoggedIn ? userInfo?.username : '点击登录' }}</text>
          <view class="user-level-tag" v-if="isLoggedIn">
            <text class="level-icon">👑</text>
            <text class="level-name">{{ userInfo?.member_level?.name || '普通会员' }}</text>
            <text class="level-discount" v-if="userInfo?.member_level?.discount_rate">
              {{ (userInfo.member_level.discount_rate * 10).toFixed(1) }}折特权
            </text>
          </view>
          <text class="user-subtitle" v-else>登录享受更多权益</text>
        </view>
        <text class="arrow-icon">›</text>
      </view>

      <!-- 数据统计 -->
      <view v-if="isLoggedIn" class="stats-row">
        <view class="stat-item" @click="goTo('/pages/member/index')">
          <view class="stat-value">
            <text class="stat-currency">¥</text>
            <text class="stat-num">{{ userInfo?.member_card?.balance || '0.00' }}</text>
          </view>
          <text class="stat-label">卡内余额</text>
        </view>
        <view class="stat-item" @click="goTo('/pages/records/index')">
          <text class="stat-num">{{ userInfo?.points || 0 }}</text>
          <text class="stat-label">当前积分 ›</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">3</text>
          <text class="stat-label">优惠券</text>
        </view>
      </view>
    </view>

    <!-- 我的宠物模块 -->
    <view class="section pets-section" v-if="isLoggedIn">
      <view class="section-card">
        <view class="section-header">
          <view class="section-title-row">
            <text class="section-icon">🦴</text>
            <text class="section-title">我的宠物</text>
          </view>
          <view class="add-btn" @click="goTo('/pages/pet/add')">
            <text>+</text>
          </view>
        </view>
        <view class="pets-list">
          <view class="pet-item" v-for="i in 2" :key="i" @click="goTo('/pages/pet/index')">
            <view class="pet-avatar">
              <image 
                :src="i === 1 ? '/static/dog.png' : '/static/cat.png'" 
                class="pet-image"
                mode="aspectFill"
              />
            </view>
            <view class="pet-info">
              <text class="pet-name">{{ i === 1 ? '旺财' : '咪咪' }}</text>
              <text class="pet-desc">{{ i === 1 ? '柴犬 · 公 · 12.5kg' : '英短 · 母 · 4.2kg' }}</text>
            </view>
            <text class="pet-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="section menu-section">
      <view class="section-card">
        <view class="menu-item" @click="goTo('/pages/order/list')">
          <view class="menu-icon color-yellow">
            <text>📦</text>
          </view>
          <text class="menu-name">我的订单</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goTo('/pages/appointment/list')">
          <view class="menu-icon color-blue">
            <text>📅</text>
          </view>
          <text class="menu-name">预约记录</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goTo('/pages/boarding/list')">
          <view class="menu-icon color-orange">
            <text>🏨</text>
          </view>
          <text class="menu-name">寄养订单</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item no-border" @click="goTo('/pages/records/index')">
          <view class="menu-icon color-green">
            <text>📊</text>
          </view>
          <text class="menu-name">消费记录</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 设置菜单 -->
    <view class="section menu-section">
      <view class="section-card">
        <view class="menu-item" @click="handleChangePassword">
          <view class="menu-icon color-purple">
            <text>🔐</text>
          </view>
          <text class="menu-name">修改密码</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item no-border" @click="handleAbout">
          <view class="menu-icon color-gray">
            <text>ℹ️</text>
          </view>
          <text class="menu-name">关于我们</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="isLoggedIn" class="section logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
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
 * 跳转编辑资料
 */
const goToProfile = () => {
  if (!userStore.checkAuth()) return
  uni.navigateTo({ url: '/pages/profile/index' })
}

/**
 * 获取头像 emoji
 */
const getAvatarEmoji = (): string => {
  if (!isLoggedIn.value) return '👤'
  
  const avatarMap: Record<string, string> = {
    'avatar_smile': '😊',
    'avatar_cool': '😎',
    'avatar_dog': '🐶',
    'avatar_cat': '🐱',
    'avatar_fox': '🦊'
  }
  
  return avatarMap[userInfo.value?.avatar || ''] || '😊'
}

/**
 * 跳转页面
 */
const goTo = (url: string) => {
  if (!userStore.checkAuth()) return
  
  // TabBar 页面列表
  const tabBarPages = ['/pages/index/index', '/pages/product/list', '/pages/pet/index', '/pages/mine/index']
  
  if (tabBarPages.includes(url)) {
    uni.switchTab({ url })
  } else {
    uni.navigateTo({ url })
  }
}

/**
 * 修改密码
 */
const handleChangePassword = () => {
  if (!userStore.checkAuth()) return
  uni.navigateTo({ url: '/pages/password/index' })
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
  background: #FAFAFA;
  padding-bottom: 120rpx;
}

/* 用户头部 - 暗色风格 */
.user-header {
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
  border-radius: 0 0 64rpx 64rpx;
  padding: 40rpx 40rpx 60rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
}

.user-info-row {
  display: flex;
  align-items: center;
  gap: 32rpx;
  margin-bottom: 48rpx;
}

.avatar-wrapper {
  position: relative;
}

.avatar-ring {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFBF00 0%, transparent 50%);
  padding: 6rpx;
}

.avatar-inner {
  width: 100%;
  height: 100%;
  background: #1F2937;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 6rpx solid #1F2937;
}

.avatar-emoji {
  font-size: 64rpx;
}

.level-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #FFBF00;
  color: #1F2937;
  font-size: 20rpx;
  font-weight: 800;
  padding: 4rpx 12rpx;
  border-radius: 16rpx;
  border: 4rpx solid #1F2937;
}

.user-info-content {
  flex: 1;
}

.username {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #FFFFFF;
  margin-bottom: 12rpx;
}

.user-level-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  width: fit-content;
}

.level-icon {
  font-size: 20rpx;
}

.level-name {
  font-size: 22rpx;
  font-weight: 600;
  color: #FCD34D;
}

.level-discount {
  font-size: 20rpx;
  color: #9CA3AF;
  margin-left: 8rpx;
}

.user-subtitle {
  font-size: 26rpx;
  color: #9CA3AF;
}

.arrow-icon {
  font-size: 40rpx;
  color: #6B7280;
}

/* 数据统计 */
.stats-row {
  display: flex;
  justify-content: space-between;
  padding: 0 20rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
  
  &:first-child {
    text-align: left;
  }
  
  &:last-child {
    text-align: right;
  }
}

.stat-value {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  margin-bottom: 8rpx;
}

.stat-currency {
  font-size: 24rpx;
  font-weight: 700;
  color: #FFBF00;
}

.stat-num {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  color: #FFFFFF;
  font-family: DINAlternate-Bold, sans-serif;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #9CA3AF;
  font-weight: 500;
}

/* 区块样式 */
.section {
  padding: 0 40rpx;
  margin-bottom: 24rpx;
}

.section-card {
  background: #FFFFFF;
  border-radius: 48rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  border: 2rpx solid #F3F4F6;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-icon {
  font-size: 36rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #1F2937;
}

.add-btn {
  width: 56rpx;
  height: 56rpx;
  background: #FEF3C7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 32rpx;
    font-weight: 700;
    color: #D97706;
  }
  
  &:active {
    background: #FFBF00;
    
    text {
      color: #FFFFFF;
    }
  }
}

/* 宠物列表 */
.pets-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.pet-item {
  display: flex;
  align-items: center;
  background: #F9FAFB;
  border-radius: 24rpx;
  padding: 24rpx;
  gap: 20rpx;
  transition: all 0.2s;
  
  &:active {
    background: #F3F4F6;
    transform: scale(0.98);
  }
}

.pet-avatar {
  width: 80rpx;
  height: 80rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
  
  text {
    font-size: 40rpx;
  }
}

.pet-image {
  width: 100%;
  height: 100%;
}

.pet-info {
  flex: 1;
}

.pet-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 6rpx;
}

.pet-desc {
  font-size: 24rpx;
  color: #9CA3AF;
}

.pet-arrow {
  font-size: 32rpx;
  color: #D1D5DB;
}

/* 菜单项 */
.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 2rpx solid #F3F4F6;
  gap: 20rpx;
  
  &.no-border {
    border-bottom: none;
  }
  
  &:active {
    opacity: 0.7;
  }
}

.menu-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 32rpx;
  }
  
  &.color-yellow { background: #FEF3C7; }
  &.color-blue { background: #DBEAFE; }
  &.color-orange { background: #FFEDD5; }
  &.color-green { background: #D1FAE5; }
  &.color-purple { background: #EDE9FE; }
  &.color-gray { background: #F3F4F6; }
}

.menu-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: #374151;
}

.menu-arrow {
  font-size: 32rpx;
  color: #D1D5DB;
}

/* 退出登录 */
.logout-section {
  margin-top: 40rpx;
}

.logout-btn {
  background: #FFFFFF;
  height: 96rpx;
  border-radius: 48rpx;
  color: #EF4444;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  border: 2rpx solid #FEE2E2;
  
  &:active {
    background: #FEF2F2;
  }
  
  &::after { border: none; }
}
</style>
