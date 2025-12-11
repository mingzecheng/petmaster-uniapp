<template>
  <view class="home-container">
    <!-- 玻璃态导航栏 -->
    <view class="nav-bar glass" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="location-area">
          <view class="location-icon">📍</view>
          <text class="location-text">PetMaster 旗舰店</text>
        </view>
        <view class="nav-right" @click="goToMine">
          <view class="bell-icon">
            <text>🔔</text>
            <view class="bell-dot"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <scroll-view class="main-content" scroll-y :style="{ paddingTop: (statusBarHeight + 56) + 'px' }">
      <!-- 宠物状态卡片 - 暗色风格 -->
      <view class="pet-status-card" v-if="userPet" @click="goToService('pet')">
        <view class="pet-card-content">
          <view class="pet-info-left">
            <view class="pet-status-badge">
              <text class="status-label">状态</text>
              <text class="status-value">健康状况良好</text>
            </view>
            <text class="pet-name">{{ userPet.name || '我的宠物' }}</text>
            <text class="pet-desc">{{ userPet.breed || '品种' }} · {{ userPet.weight || '0' }}kg</text>
          </view>
          <view class="pet-avatar">
            <text class="pet-emoji">{{ getPetEmoji(userPet.species) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 未登录或无宠物时显示欢迎卡片 -->
      <view class="welcome-card" v-else @click="goToService('pet')">
        <view class="welcome-content">
          <text class="welcome-title">欢迎来到 PetMaster</text>
          <text class="welcome-desc">添加您的第一只宠物</text>
        </view>
        <view class="welcome-icon">
          <text>🐾</text>
        </view>
      </view>

      <!-- 快速服务 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">快速服务</text>
          <text class="section-more" @click="goToServices">›</text>
        </view>
        <view class="service-grid">
          <view 
            v-for="service in services.slice(0, 4)" 
            :key="service.id" 
            class="service-card"
            @click="goToAppointment(service)"
          >
            <view class="service-card-top">
              <view class="service-icon-box" :class="getServiceColorClass(service.name)">
                <text class="service-icon-text">{{ getServiceIcon(service.name) }}</text>
              </view>
              <view class="service-price-tag">
                <text>¥{{ service.price }}</text>
              </view>
            </view>
            <view class="service-card-bottom">
              <text class="service-card-name">{{ service.name }}</text>
              <text class="service-card-duration">约{{ service.duration || 60 }}分钟</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 精选商品 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">精选商品</text>
          <text class="section-more" @click="goToProducts">全部 ›</text>
        </view>
        <view class="products-grid">
          <view 
            v-for="product in products" 
            :key="product.id" 
            class="product-card"
            @click="goToProductDetail(product.id)"
          >
            <view class="product-image-box">
              <text class="product-emoji">{{ getProductIcon(product.category) }}</text>
              <view v-if="product.stock <= 0" class="sold-out-mask">
                <text>已售罄</text>
              </view>
            </view>
            <view class="product-info">
              <text class="product-name">{{ product.name }}</text>
              <view class="product-bottom">
                <view class="product-price">
                  <text class="price-symbol">¥</text>
                  <text class="price-value">{{ product.price }}</text>
                </view>
                <text class="product-stock-tag" v-if="product.stock > 0 && product.stock < 10">
                  库存 {{ product.stock }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getServices, type Service } from '@/api/service'
import { getProducts, type Product } from '@/api/product'
import { useUserStore } from '@/stores/user'

/** 状态栏高度 */
const statusBarHeight = ref(0)

/** 服务列表 */
const services = ref<Service[]>([])

/** 商品列表 */
const products = ref<Product[]>([])

/** 用户Store */
const userStore = useUserStore()

/** 用户的第一只宠物（用于展示） */
const userPet = computed(() => {
  // 这里需要从 store 或 API 获取用户的宠物
  // 暂时返回 null，实际需要接入宠物数据
  return null
})

/**
 * 初始化
 */
onMounted(async () => {
  // 获取状态栏高度
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20

  // 加载数据
  await Promise.all([
    loadServices(),
    loadProducts()
  ])
})

/**
 * 加载服务列表
 */
const loadServices = async () => {
  try {
    const data = await getServices({ limit: 6 })
    services.value = data
  } catch (error) {
    console.error('加载服务失败:', error)
  }
}

/**
 * 加载商品列表
 */
const loadProducts = async () => {
  try {
    const data = await getProducts({ limit: 4 })
    products.value = data
  } catch (error) {
    console.error('加载商品失败:', error)
  }
}

/**
 * 获取宠物 emoji
 */
const getPetEmoji = (species?: string): string => {
  const icons: Record<string, string> = {
    'dog': '🐕',
    'cat': '🐱',
    'bird': '🐦',
    'fish': '🐟'
  }
  return icons[species || ''] || '🐾'
}

/**
 * 获取服务图标
 */
const getServiceIcon = (name: string): string => {
  const icons: Record<string, string> = {
    '洗澡': '🛁',
    '美容': '✂️',
    '寄养': '🏠',
    '体检': '🩺',
    '驱虫': '💊',
    '疫苗': '💉'
  }
  for (const [key, icon] of Object.entries(icons)) {
    if (name.includes(key)) return icon
  }
  return '🐾'
}

/**
 * 获取服务颜色类
 */
const getServiceColorClass = (name: string): string => {
  if (name.includes('洗澡') || name.includes('美容')) return 'color-sky'
  if (name.includes('寄养')) return 'color-orange'
  if (name.includes('体检') || name.includes('健康')) return 'color-green'
  return 'color-purple'
}

/**
 * 获取商品图标
 */
const getProductIcon = (category?: string): string => {
  const icons: Record<string, string> = {
    '食品': '🍖',
    '玩具': '🎾',
    '用品': '🦴',
    '服饰': '👕',
    '药品': '💊'
  }
  return icons[category || ''] || '📦'
}

/**
 * 跳转到服务
 */
const goToService = (type: string) => {
  if (!userStore.checkAuth()) return
  
  // tabBar 页面
  const tabBarRoutes: Record<string, string> = {
    pet: '/pages/pet/index'
  }
  
  // 普通页面
  const routes: Record<string, string> = {
    appointment: '/pages/appointment/create',
    member: '/pages/member/index',
    record: '/pages/appointment/list'
  }
  
  if (tabBarRoutes[type]) {
    uni.switchTab({ url: tabBarRoutes[type] })
  } else if (routes[type]) {
    uni.navigateTo({ url: routes[type] })
  }
}

/**
 * 跳转到服务列表
 */
const goToServices = () => {
  uni.navigateTo({ url: '/pages/appointment/create' })
}

/**
 * 跳转到商品列表
 */
const goToProducts = () => {
  uni.switchTab({ url: '/pages/product/list' })
}

/**
 * 跳转到商品详情
 */
const goToProductDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

/**
 * 跳转到预约
 */
const goToAppointment = (service: Service) => {
  if (!userStore.checkAuth()) return
  uni.navigateTo({ url: `/pages/appointment/create?serviceId=${service.id}` })
}

/**
 * 跳转到个人中心
 */
const goToMine = () => {
  uni.switchTab({ url: '/pages/mine/index' })
}
</script>

<style lang="scss">
/* 动画定义 */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

.home-container {
  min-height: 100vh;
  background: #FAFAFA;
}

/* 玻璃态导航栏 */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  
  &.glass {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.5);
  }
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  height: 88rpx;
}

.location-area {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.location-icon {
  width: 48rpx;
  height: 48rpx;
  background: #FEF3C7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.location-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
}

.nav-right {
  position: relative;
  padding: 16rpx;
}

.bell-icon {
  font-size: 36rpx;
  position: relative;
}

.bell-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 16rpx;
  height: 16rpx;
  background: #EF4444;
  border-radius: 50%;
  border: 2rpx solid #fff;
}

/* 主内容区 */
.main-content {
  min-height: 100vh;
  padding: 20rpx 40rpx;
  box-sizing: border-box;
}

/* 宠物状态卡片 - 暗色风格 */
.pet-status-card {
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
  border-radius: 48rpx;
  padding: 48rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
  animation: fade-in 0.5s ease-out;
}

.pet-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pet-info-left {
  flex: 1;
}

.pet-status-badge {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.status-label {
  font-size: 20rpx;
  color: #FFBF00;
  background: rgba(255, 255, 255, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2rpx;
}

.status-value {
  font-size: 24rpx;
  color: #9CA3AF;
}

.pet-name {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #FFFFFF;
  margin-bottom: 8rpx;
}

.pet-desc {
  display: block;
  font-size: 26rpx;
  color: #9CA3AF;
}

.pet-avatar {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid rgba(255, 255, 255, 0.2);
}

.pet-emoji {
  font-size: 60rpx;
}

/* 欢迎卡片 */
.welcome-card {
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
  border-radius: 48rpx;
  padding: 48rpx;
  margin-bottom: 40rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
}

.welcome-content {
  flex: 1;
}

.welcome-title {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  color: #FFFFFF;
  margin-bottom: 8rpx;
}

.welcome-desc {
  display: block;
  font-size: 26rpx;
  color: #9CA3AF;
}

.welcome-icon {
  width: 100rpx;
  height: 100rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  animation: float 3s ease-in-out infinite;
}

/* 区块样式 */
.section {
  margin-bottom: 48rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #1F2937;
}

.section-more {
  font-size: 28rpx;
  color: #9CA3AF;
  font-weight: 500;
}

/* 服务网格 - 2x2 布局 */
.service-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.service-card {
  background: #FFFFFF;
  border-radius: 40rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  border: 2rpx solid #F3F4F6;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.98);
    border-color: $pet-primary;
  }
}

.service-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24rpx;
}

.service-icon-box {
  width: 88rpx;
  height: 88rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.color-sky {
    background: #E0F2FE;
    color: #0284C7;
  }
  &.color-purple {
    background: #F3E8FF;
    color: #9333EA;
  }
  &.color-orange {
    background: #FFF7ED;
    color: #EA580C;
  }
  &.color-green {
    background: #ECFDF5;
    color: #059669;
  }
}

.service-icon-text {
  font-size: 40rpx;
}

.service-price-tag {
  background: #F9FAFB;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  
  text {
    font-size: 24rpx;
    font-weight: 700;
    color: #4B5563;
  }
}

.service-card-bottom {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.service-card-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
}

.service-card-duration {
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 商品网格 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.product-card {
  background: #FFFFFF;
  border-radius: 40rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  border: 2rpx solid #F3F4F6;
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  }
}

.product-image-box {
  height: 260rpx;
  background: #F9FAFB;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 32rpx 32rpx 0 0;
  margin: 12rpx 12rpx 0;
}

.product-emoji {
  font-size: 80rpx;
}

.sold-out-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 32rpx;
  
  text {
    font-size: 28rpx;
    font-weight: 700;
    color: #FFFFFF;
  }
}

.product-info {
  padding: 24rpx;
}

.product-name {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  display: flex;
  align-items: baseline;
  color: #EF4444;
}

.price-symbol {
  font-size: 24rpx;
  font-weight: 700;
}

.price-value {
  font-size: 36rpx;
  font-weight: 800;
  font-family: DINAlternate-Bold, sans-serif;
}

.product-stock-tag {
  font-size: 20rpx;
  color: #9CA3AF;
  background: #F3F4F6;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
}

.safe-area-bottom {
  height: 180rpx;
}
</style>
