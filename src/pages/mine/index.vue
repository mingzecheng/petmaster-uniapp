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
          <view v-if="isLoggedIn && userInfo?.member_level" class="level-badge">
            LV.{{ userInfo.member_level.level || 1 }}
          </view>
        </view>
        <view class="user-info-content">
          <text class="username">{{ isLoggedIn ? userInfo?.username : '点击登录' }}</text>
          <view class="user-level-tag" v-if="isLoggedIn">
            <text class="level-icon">👑</text>
            <text class="level-name">{{ userInfo?.member_level?.name || '普通会员' }}</text>
            <text class="level-discount" v-if="userInfo?.member_level?.discount_rate != null">
              {{ ((userInfo?.member_level?.discount_rate || 1) * 10).toFixed(1) }}折特权
            </text>
          </view>
          <text class="user-subtitle" v-else>登录享受更多权益</text>
        </view>
        <text class="arrow-icon">›</text>
      </view>

      <!-- 数据统计 -->
      <view v-if="isLoggedIn" class="stats-row">
        <view class="stat-item" @click="goToMemberCard">
          <view class="stat-value">
            <text class="stat-currency">¥</text>
            <text class="stat-num">{{ cardBalance }}</text>
          </view>
          <text class="stat-label">卡内余额</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goToPoints">
          <view class="stat-value">
            <text class="stat-num points-num">{{ userPoints }}</text>
            <text class="stat-unit">积分</text>
          </view>
          <text class="stat-label">当前积分 ›</text>
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
          <view v-if="myPets.length === 0" class="no-pets">
            <text class="no-pets-text">暂无宠物，点击右上角添加</text>
          </view>
          <view class="pet-item" v-for="pet in myPets" :key="pet.id" @click="goToPetDetail(pet.id)">
            <view class="pet-avatar">
              <image 
                v-if="pet.image_url"
                :src="pet.image_url" 
                class="pet-image"
                mode="aspectFill"
              />
              <image 
                v-else
                :src="getPetImage(pet.species)" 
                class="pet-image"
                mode="aspectFill"
              />
            </view>
            <view class="pet-info">
              <text class="pet-name">{{ pet.name }}</text>
              <text class="pet-desc">{{ formatPetDesc(pet) }}</text>
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
import { getPets, type Pet } from '@/api/pet'
import { getMyMemberCard, type MemberCard } from '@/api/member'

/** 状态栏高度 */
const statusBarHeight = ref(0)

/** 用户Store */
const userStore = useUserStore()

/** 是否登录 */
const isLoggedIn = computed(() => userStore.isLoggedIn)

/** 用户信息 */
const userInfo = computed(() => userStore.userInfo)

/** 会员卡数据 */
const memberCard = ref<MemberCard | null>(null)

/** 我的宠物列表 */
const myPets = ref<Pet[]>([])

/** 卡内余额 */
const cardBalance = computed(() => {
  const balance = memberCard.value?.balance
  // balance是字符串格式，如果不存在或为空字符串，返回默认值
  if (!balance) return '0.00'
  return balance
})

/** 用户积分 */
const userPoints = computed(() => {
  return userInfo.value?.points || 0
})

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
 * 页面显示时刷新数据
 */
import { onShow } from '@dcloudio/uni-app'
onShow(async () => {
  if (isLoggedIn.value) {
    await userStore.fetchUserInfo()
    await loadMemberCard()
    await loadMyPets()
  }
})

/**
 * 加载会员卡数据
 */
const loadMemberCard = async () => {
  if (!userInfo.value?.id) return
  
  try {
    const card = await getMyMemberCard(userInfo.value.id)
    memberCard.value = card
  } catch (error: any) {
    console.log('加载会员卡失败:', error.message)
    memberCard.value = null
  }
}

/**
 * 加载我的宠物列表
 */
const loadMyPets = async () => {
  if (!userInfo.value?.id) return
  
  try {
    const pets = await getPets({ owner_id: userInfo.value.id, limit: 5 })
    myPets.value = pets
  } catch (error: any) {
    console.log('加载宠物失败:', error.message)
    myPets.value = []
  }
}

/**
 * 获取宠物emoji
 */
const getPetEmoji = (species?: string): string => {
  if (!species) return '🐾'
  const lower = species.toLowerCase()
  if (lower.includes('狗') || lower.includes('dog') || lower.includes('犬')) return '🐕'
  if (lower.includes('猫') || lower.includes('cat')) return '🐱'
  if (lower.includes('鸟') || lower.includes('bird')) return '🐦'
  if (lower.includes('鱼') || lower.includes('fish')) return '🐟'
  if (lower.includes('兔') || lower.includes('rabbit')) return '🐰'
  if (lower.includes('仓鼠') || lower.includes('hamster')) return '🐹'
  return '🐾'
}

/**
 * 获取宠物默认图片
 */
const getPetImage = (species?: string): string => {
  if (!species) return '/static/pet-default.png'
  const lower = species.toLowerCase()
  if (lower.includes('狗') || lower.includes('dog') || lower.includes('犬')) return '/static/dog.png'
  if (lower.includes('猫') || lower.includes('cat')) return '/static/cat.png'
  if (lower.includes('兔') || lower.includes('rabbit')) return '/static/rabbit.png'
  if (lower.includes('仓鼠') || lower.includes('hamster')) return '/static/hamster.png'
  return '/static/pet-default.png'
}

/**
 * 格式化宠物描述
 */
const formatPetDesc = (pet: Pet): string => {
  const parts: string[] = []
  if (pet.species) parts.push(pet.species)
  if (pet.breed) parts.push(pet.breed)
  if (pet.gender) parts.push(pet.gender === 'male' ? '公' : '母')
  if (pet.weight) parts.push(`${pet.weight}kg`)
  return parts.join(' · ') || '未填写信息'
}

/**
 * 跳转宠物详情
 */
const goToPetDetail = (petId: number) => {
  uni.navigateTo({ url: `/pages/pet/detail?id=${petId}` })
}

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
 * 跳转会员卡
 */
const goToMemberCard = () => {
  if (!userStore.checkAuth()) return
  uni.navigateTo({ url: '/pages/member/index' })
}

/**
 * 查看积分明细
 */
const goToPoints = () => {
  if (!userStore.checkAuth()) return
  uni.navigateTo({ url: '/pages/points/index' })
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

/* 统计数据 */
.stats-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 32rpx;
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  flex: 1;
  text-align: center;
  transition: all 0.2s;
  padding: 12rpx;
  border-radius: 20rpx;
  
  &:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.05);
  }
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 1rpx;
}

.stat-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 8rpx;
}

.stat-currency {
  font-size: 28rpx;
  color: #FFBF00;
  font-weight: 700;
  margin-right: 4rpx;
}

.stat-num {
  font-size: 44rpx;
  font-weight: 800;
  color: #FFFFFF;
  font-family: 'DIN Alternate', sans-serif;
  letter-spacing: -1rpx;
}

.stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
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

.pet-emoji {
  font-size: 48rpx;
}

.no-pets {
  padding: 40rpx;
  text-align: center;
}

.no-pets-text {
  font-size: 26rpx;
  color: #9CA3AF;
}

.points-num {
  color: #FFB300;
}

.stat-unit {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 8rpx;
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
