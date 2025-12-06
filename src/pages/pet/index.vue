<template>
  <view class="pet-container">
    <!-- 宠物列表 -->
    <scroll-view class="pet-scroll" scroll-y @scrolltolower="loadMore">
      <view v-if="pets.length > 0" class="pets-list">
        <view 
          v-for="pet in pets" 
          :key="pet.id" 
          class="pet-card"
          @click="goToDetail(pet.id)"
        >
          <view class="pet-card-left">
            <view class="pet-avatar">
              <text class="pet-emoji">{{ getPetEmoji(pet.species) }}</text>
            </view>
          </view>
          <view class="pet-card-right">
            <view class="pet-header">
              <text class="pet-name">{{ pet.name }}</text>
              <view class="pet-gender-badge" :class="pet.gender">
                <text>{{ pet.gender === 'male' ? '♂' : '♀' }}</text>
              </view>
            </view>
            <text class="pet-breed">{{ pet.species }} · {{ pet.breed || '未知品种' }}</text>
            <view class="pet-tags">
              <text v-if="pet.age" class="pet-tag">{{ pet.age }}岁</text>
              <text v-if="pet.weight" class="pet-tag">{{ pet.weight }}kg</text>
            </view>
          </view>
          <view class="pet-arrow">
            <text>›</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!loading" class="empty-state">
        <view class="empty-image">
          <text>🐾</text>
        </view>
        <text class="empty-text">还没有添加宠物</text>
        <text class="empty-hint">点击下方按钮添加您的爱宠</text>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-tip">
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
import { getPets, type Pet } from '@/api/pet'
import { useUserStore } from '@/stores/user'

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
 * 获取宠物emoji
 */
const getPetEmoji = (species: string): string => {
  const emojis: Record<string, string> = {
    '狗': '🐕',
    '猫': '🐱',
    '兔子': '🐰',
    '仓鼠': '🐹',
    '鸟': '🐦',
    '鱼': '🐟'
  }
  return emojis[species] || '🐾'
}
</script>

<style lang="scss">
.pet-container {
  min-height: 100vh;
  background-color: $pet-bg-base;
}

.pet-scroll {
  height: 100vh;
}

.pets-list {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.pet-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: $pet-radius-lg;
  padding: 30rpx;
  box-shadow: $pet-shadow;
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.98);
  }
}

.pet-card-left {
  margin-right: 24rpx;
}

.pet-avatar {
  width: 120rpx;
  height: 120rpx;
  background: $pet-bg-hover;
  border-radius: $pet-radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid $pet-border-light;
}

.pet-emoji {
  font-size: 64rpx;
}

.pet-card-right {
  flex: 1;
}

.pet-header {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.pet-name {
  font-size: 32rpx;
  font-weight: 700;
  color: $pet-text-main;
  margin-right: 16rpx;
}

.pet-gender-badge {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 24rpx;
    color: #fff;
    line-height: 1;
  }
  
  &.male {
    background: #2979FF;
  }
  
  &.female {
    background: #FF4081;
  }
}

.pet-breed {
  display: block;
  font-size: 26rpx;
  color: $pet-text-secondary;
  margin-bottom: 16rpx;
}

.pet-tags {
  display: flex;
  gap: 12rpx;
}

.pet-tag {
  font-size: 22rpx;
  color: $pet-text-secondary;
  background: $pet-bg-base;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.pet-arrow {
  font-size: 40rpx;
  color: $pet-text-placeholder;
  margin-left: 16rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
  box-shadow: $pet-shadow;
  
  text {
    font-size: 80rpx;
    opacity: 0.5;
  }
}

.empty-text {
  font-size: 32rpx;
  font-weight: 600;
  color: $pet-text-main;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: $pet-text-secondary;
}

/* 加载状态 */
.loading-tip {
  text-align: center;
  padding: 30rpx;
  
  text {
    font-size: 26rpx;
    color: $pet-text-secondary;
  }
}

/* 悬浮添加按钮 */
.fab-btn {
  position: fixed;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  background: $pet-primary;
  padding: 24rpx 48rpx;
  border-radius: 60rpx;
  display: flex;
  align-items: center;
  box-shadow: $pet-shadow-float;
  z-index: 100;
  
  &:active {
    transform: translateX(-50%) scale(0.95);
  }
}

.fab-icon {
  font-size: 40rpx;
  font-weight: 300;
  margin-right: 12rpx;
  color: $pet-text-on-primary;
  line-height: 1;
}

.fab-text {
  font-size: 32rpx;
  font-weight: 600;
  color: $pet-text-on-primary;
}

.safe-area-bottom {
  height: 160rpx;
}
</style>
