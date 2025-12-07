<template>
  <view class="home-container">
    <!-- 顶部状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-content">
        <view class="logo-area">
          <view class="logo-icon-small">
            <text>🐕</text>
          </view>
          <text class="logo-text">PetMaster</text>
        </view>
        <view class="user-area" @click="goToMine">
          <text class="user-icon">👤</text>
        </view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <scroll-view class="main-content" scroll-y>
      <!-- 欢迎横幅 -->
      <view class="welcome-banner">
        <view class="banner-content">
          <text class="banner-title">专业宠物护理服务</text>
          <text class="banner-desc">为您的爱宠提供最贴心的呵护</text>
          <view class="banner-btn" @click="goToService('appointment')">
            <text>立即预约</text>
          </view>
        </view>
        <view class="banner-image">
          <text class="banner-emoji">🐶</text>
        </view>
      </view>

      <!-- 服务入口 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">便捷服务</text>
        </view>
        <view class="service-grid">
          <view class="service-item" @click="goToService('appointment')">
            <view class="service-icon icon-yellow">
              <text>📅</text>
            </view>
            <text class="service-name">预约服务</text>
          </view>
          <view class="service-item" @click="goToService('pet')">
            <view class="service-icon icon-blue">
              <text>🐕</text>
            </view>
            <text class="service-name">我的宠物</text>
          </view>
          <view class="service-item" @click="goToService('member')">
            <view class="service-icon icon-green">
              <text>💳</text>
            </view>
            <text class="service-name">会员卡</text>
          </view>
          <view class="service-item" @click="goToService('record')">
            <view class="service-icon icon-orange">
              <text>📋</text>
            </view>
            <text class="service-name">预约记录</text>
          </view>
        </view>
      </view>

      <!-- 热门服务 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">热门服务</text>
          <text class="section-more" @click="goToServices">全部 ›</text>
        </view>
        <scroll-view class="services-scroll" scroll-x>
          <view class="services-wrapper">
            <view 
              v-for="service in services" 
              :key="service.id" 
              class="service-card"
              @click="goToAppointment(service)"
            >
              <view class="service-card-image">
                <text class="service-emoji">{{ getServiceIcon(service.name) }}</text>
              </view>
              <view class="service-card-info">
                <text class="service-card-name">{{ service.name }}</text>
                <view class="service-card-bottom">
                  <text class="service-card-price">¥{{ service.price }}</text>
                  <view class="add-btn">+</view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 热门商品 -->
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
            <view class="product-image">
              <text class="product-emoji">{{ getProductIcon(product.category) }}</text>
            </view>
            <view class="product-info">
              <text class="product-name">{{ product.name }}</text>
              <view class="product-bottom">
                <text class="product-price">¥{{ product.price }}</text>
                <text class="product-stock" v-if="product.stock < 10">仅剩 {{ product.stock }}</text>
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
import { ref, onMounted } from 'vue'
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
  
  const routes: Record<string, string> = {
    appointment: '/pages/appointment/create',
    pet: '/pages/pet/index',
    member: '/pages/member/index',
    record: '/pages/appointment/list'
  }
  uni.navigateTo({ url: routes[type] || '/pages/index/index' })
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
.home-container {
  min-height: 100vh;
  background-color: $pet-bg-base;
}

.status-bar {
  background: transparent;
}

/* 导航栏 - 玻璃拟态 */
.nav-bar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 20rpx 30rpx;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-area {
  display: flex;
  align-items: center;
}

.logo-icon-small {
  width: 64rpx;
  height: 64rpx;
  background: linear-gradient(135deg, $pet-primary, $pet-primary-dark);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(255, 214, 0, 0.3);
  
  text {
    font-size: 32rpx;
  }
}

.logo-text {
  font-size: 36rpx;
  font-weight: 800;
  color: $pet-text-main;
  letter-spacing: -0.5rpx;
}

.user-area {
  width: 72rpx;
  height: 72rpx;
  background: #fff;
  border: 2rpx solid $pet-bg-hover;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $pet-shadow-sm;
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.95);
    background: $pet-bg-hover;
  }
}

.user-icon {
  font-size: 36rpx;
}

/* 主内容区 */
.main-content {
  height: calc(100vh - 180rpx);
}

/* 欢迎横幅 - 更丰富的视觉 */
.welcome-banner {
  margin: 30rpx;
  padding: 40rpx;
  background: linear-gradient(120deg, $pet-primary, #FFC107);
  border-radius: $pet-radius-lg;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8rpx 32rpx rgba(255, 193, 7, 0.3);
  color: $pet-text-on-primary;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    right: -20rpx;
    top: -20rpx;
    width: 200rpx;
    height: 200rpx;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
}

.banner-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.banner-title {
  display: block;
  font-size: 38rpx;
  font-weight: 800;
  margin-bottom: 12rpx;
  text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.05);
}

.banner-desc {
  display: block;
  font-size: 26rpx;
  opacity: 0.9;
  margin-bottom: 28rpx;
  font-weight: 500;
}

.banner-btn {
  display: inline-block;
  background: #fff;
  padding: 14rpx 36rpx;
  border-radius: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.95);
  }
  
  text {
    font-size: 26rpx;
    font-weight: 700;
    color: $pet-text-main;
  }
}

.banner-image {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  border: 2rpx solid rgba(255,255,255,0.3);
}

.banner-emoji {
  font-size: 60rpx;
}

/* 区块样式 */
.section {
  padding: 0 30rpx;
  margin-bottom: 48rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: 800;
  color: $pet-text-main;
  position: relative;
  padding-left: 24rpx;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 8rpx;
    height: 36rpx;
    background: $pet-primary;
    border-radius: 4rpx;
    box-shadow: 0 2rpx 8rpx rgba(255, 214, 0, 0.4);
  }
}

.section-more {
  font-size: 26rpx;
  color: $pet-text-secondary;
  font-weight: 500;
  padding: 8rpx 16rpx;
  background: #fff;
  border-radius: 20rpx;
}

/* 服务网格 */
.service-grid {
  display: flex;
  justify-content: space-between;
  background: #fff;
  padding: 40rpx 20rpx;
  border-radius: $pet-radius-lg;
  box-shadow: $pet-shadow;
}

.service-item {
  width: 25%;
  text-align: center;
  
  &:active .service-icon {
    transform: scale(0.92);
  }
}

.service-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20rpx;
  transition: transform 0.2s;
  
  text {
    font-size: 48rpx;
  }
  
  &.icon-yellow { background: linear-gradient(135deg, #FFF8E1, #FFECB3); color: #FF6F00; }
  &.icon-blue { background: linear-gradient(135deg, #E3F2FD, #BBDEFB); color: #0D47A1; }
  &.icon-green { background: linear-gradient(135deg, #E8F5E9, #C8E6C9); color: #1B5E20; }
  &.icon-orange { background: linear-gradient(135deg, #FBE9E7, #FFCCBC); color: #BF360C; }
}

.service-name {
  font-size: 26rpx;
  color: $pet-text-main;
  font-weight: 500;
}

/* 服务滚动 */
.services-scroll {
  white-space: nowrap;
  margin: 0 -30rpx;
  width: calc(100% + 60rpx);
}

.services-wrapper {
  display: inline-flex;
  gap: 24rpx;
  padding: 4rpx 30rpx 30rpx;
}

.service-card {
  width: 280rpx;
  background: #fff;
  border-radius: $pet-radius-lg;
  padding: 24rpx;
  display: inline-block;
  box-shadow: $pet-shadow;
  vertical-align: top;
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:active {
    transform: scale(0.98);
  }
}

.service-card-image {
  width: 100%;
  height: 180rpx;
  background: $pet-bg-hover;
  border-radius: $pet-radius;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.service-emoji {
  font-size: 72rpx;
}

.service-card-name {
  display: block;
  font-size: 30rpx;
  color: $pet-text-main;
  font-weight: 700;
  margin-bottom: 16rpx;
  white-space: normal;
}

.service-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-card-price {
  font-size: 32rpx;
  color: $pet-warning;
  font-weight: 800;
}

.add-btn {
  width: 48rpx;
  height: 48rpx;
  background: $pet-primary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: $pet-text-main;
  box-shadow: 0 4rpx 12rpx rgba(255, 214, 0, 0.3);
}

/* 商品网格 */
.products-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.product-card {
  width: calc(50% - 12rpx);
  background: #fff;
  border-radius: $pet-radius-lg;
  overflow: hidden;
  box-shadow: $pet-shadow;
  transition: transform 0.3s;
  
  &:active {
    transform: scale(0.98);
  }
}

.product-image {
  height: 260rpx;
  background: $pet-bg-hover;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60rpx;
    background: linear-gradient(to top, rgba(0,0,0,0.05), transparent);
  }
}

.product-emoji {
  font-size: 90rpx;
  filter: drop-shadow(0 8rpx 16rpx rgba(0,0,0,0.1));
}

.product-info {
  padding: 24rpx;
}

.product-name {
  display: block;
  font-size: 28rpx;
  color: $pet-text-main;
  font-weight: 600;
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
  font-size: 34rpx;
  color: $pet-warning;
  font-weight: 800;
  
  &::before {
    content: '¥';
    font-size: 24rpx;
    margin-right: 2rpx;
  }
}

.product-stock {
  font-size: 20rpx;
  color: $pet-danger;
  background: rgba(255, 23, 68, 0.08);
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

.safe-area-bottom {
  height: 120rpx;
}
</style>
