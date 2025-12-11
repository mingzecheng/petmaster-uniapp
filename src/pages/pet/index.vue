<template>
  <view class="pet-container">
    <!-- 页头 -->
    <view class="page-header">
      <view class="header-bg-deco">
        <text class="deco-paw paw-1">🐾</text>
        <text class="deco-paw paw-2">🐾</text>
      </view>
      <view class="header-content">
        <text class="header-title">我的宠物</text>
        <text class="header-subtitle">管理您的爱宠档案</text>
      </view>
      <view class="header-tracker">
        <text class="tracker-num">{{ pets.length }}</text>
        <text class="tracker-label">只爱宠</text>
      </view>
    </view>

    <!-- 宠物列表 -->
    <scroll-view class="pet-scroll" scroll-y @scrolltolower="loadMore">
      <view v-if="pets.length > 0" class="pets-list">
        <view 
          v-for="pet in pets" 
          :key="pet.id" 
          class="pet-card"
          @click="goToDetail(pet.id)"
        >
          <view class="pet-avatar-box">
            <image 
              :src="getPetAvatar(pet.image_url, pet.species)" 
              class="pet-image"
              mode="aspectFill"
            />
          </view>
          <view class="pet-info">
            <view class="pet-header">
              <text class="pet-name">{{ pet.name }}</text>
              <view class="pet-gender" :class="pet.gender">
                <text>{{ pet.gender === 'male' ? '♂' : '♀' }}</text>
              </view>
            </view>
            <text class="pet-breed">{{ pet.species }} · {{ pet.breed || '未知品种' }}</text>
            <view class="pet-meta">
              <text v-if="pet.birthday" class="meta-item">🎂 {{ formatBirthday(pet.birthday) }}</text>
              <text v-if="pet.weight" class="meta-item">⚖️ {{ pet.weight }}kg</text>
            </view>
          </view>
          <text class="pet-arrow">›</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!loading" class="empty-state">
        <view class="empty-icon">
          <text>🐾</text>
        </view>
        <text class="empty-title">还没有添加宠物</text>
        <text class="empty-desc">点击下方按钮添加您的爱宠</text>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-box">
        <text>加载中...</text>
      </view>
      
      <!-- 底部占位 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>

    <!-- 悬浮添加按钮 -->
    <view class="fab-btn" @click="goToAdd">
      <text class="fab-icon">+</text>
      <text class="fab-text">添加宠物</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPets, deletePet, type Pet } from '@/api/pet'
import { useUserStore } from '@/stores/user'
import { getPetAvatar, getPetEmoji } from '@/utils/pet'

/** 宠物列表 */
const pets = ref<Pet[]>([])

/** 加载状态 */
const loading = ref(false)

/** 用户Store */
const userStore = useUserStore()

/**
 * 页面显示时刷新
 */
onMounted(() => {
  loadPets()
})

/**
 * 监听页面显示（从添加/编辑页面返回时刷新）
 */
uni.$on('refreshPets', () => {
  loadPets()
})

/**
 * 加载宠物列表
 */
const loadPets = async () => {
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/index' })
    return
  }

  loading.value = true
  try {
    const data = await getPets()
    pets.value = data
  } catch (error) {
    console.error('加载宠物失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 加载更多
 */
const loadMore = () => {
  // 暂时不分页
}

/**
 * 跳转到添加
 */
const goToAdd = () => {
  uni.navigateTo({ url: '/pages/pet/add' })
}

/**
 * 跳转到详情
 */
const goToDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/pet/detail?id=${id}` })
}

/**
 * 格式化生日
 */
const formatBirthday = (dateStr: string): string => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style lang="scss">
.pet-container {
  min-height: 100vh;
  background: #FAFAFA;
}

/* 页头 */
.page-header {
  position: relative;
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
  padding: 40rpx;
  padding-top: calc(var(--status-bar-height, 20px) + 40rpx);
  padding-bottom: 80rpx;
  border-radius: 0 0 48rpx 48rpx;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 12rpx 32rpx rgba(17, 24, 39, 0.15);
}

.header-bg-deco {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.deco-paw {
  position: absolute;
  font-size: 160rpx;
  opacity: 0.03;
  color: #FFFFFF;
  transform: rotate(15deg);
}

.paw-1 {
  top: -20rpx;
  right: -20rpx;
  font-size: 200rpx;
}

.paw-2 {
  bottom: 0;
  left: 40rpx;
  opacity: 0.02;
  transform: rotate(-10deg);
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-title {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  color: #FFFFFF;
  margin-bottom: 8rpx;
  letter-spacing: 1rpx;
}

.header-subtitle {
  font-size: 26rpx;
  color: #9CA3AF;
  font-weight: 300;
}

.header-tracker {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  padding: 12rpx 24rpx;
  border-radius: 100rpx;
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.tracker-num {
  font-size: 36rpx;
  font-weight: 700;
  color: #FFBF00;
  line-height: 1;
  font-family: DINAlternate-Bold, sans-serif;
}

.tracker-label {
  font-size: 24rpx;
  color: #D1D5DB;
}

.pet-scroll {
  height: calc(100vh - 200rpx);
}

.pets-list {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 宠物卡片 */
.pet-card {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  border: 2rpx solid #F3F4F6;
  gap: 20rpx;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.98);
    border-color: #FFBF00;
  }
}

.pet-avatar-box {
  width: 100rpx;
  height: 100rpx;
  background: #F3F4F6;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.pet-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pet-emoji {
  font-size: 48rpx;
}

.pet-info {
  flex: 1;
}

.pet-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.pet-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
}

.pet-gender {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 20rpx;
    color: #FFFFFF;
  }
  
  &.male {
    background: #3B82F6;
  }
  
  &.female {
    background: #EC4899;
  }
}

.pet-breed {
  display: block;
  font-size: 24rpx;
  color: #9CA3AF;
  margin-bottom: 12rpx;
}

.pet-meta {
  display: flex;
  gap: 16rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #6B7280;
  background: #F9FAFB;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
}

.pet-arrow {
  font-size: 36rpx;
  color: #D1D5DB;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
}

.empty-icon {
  width: 160rpx;
  height: 160rpx;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  
  text {
    font-size: 64rpx;
    opacity: 0.5;
  }
}

.empty-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #9CA3AF;
}

/* 加载状态 */
.loading-box {
  text-align: center;
  padding: 40rpx;
  
  text {
    font-size: 26rpx;
    color: #9CA3AF;
  }
}

/* 悬浮按钮 */
.fab-btn {
  position: fixed;
  bottom: 180rpx;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  padding: 24rpx 48rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 12rpx 32rpx rgba(251, 191, 36, 0.45);
  z-index: 999;
  
  &:active {
    transform: translateX(-50%) scale(0.95);
  }
}

.fab-icon {
  font-size: 40rpx;
  font-weight: 300;
  color: #1F2937;
  line-height: 1;
}

.fab-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
}

.safe-area-bottom {
  height: 280rpx;
}
</style>
