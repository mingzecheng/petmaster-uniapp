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
      <!-- 宠物状态卡片 - 品牌黄风格 -->
      <view class="pet-status-card" v-if="userPet" @click="goToPetDetail(userPet.id)">
        <view class="pet-card-content">
          <view class="pet-info-left">
            <view class="pet-status-badge">
              <text class="status-label">当前状态</text>
              <text class="status-value">健康状况良好</text>
            </view>
            <view class="pet-name-row">
              <text class="pet-name">{{ userPet.name }}</text>
              <text class="pet-gender-icon" :class="userPet.gender">{{ userPet.gender === '公' ? '♂' : '♀' }}</text>
            </view>
            <text class="pet-desc">{{ userPet.breed || '未知品种' }} · {{ calculateAge(userPet.birthday) }} · {{ userPet.weight ? userPet.weight + 'kg' : '--' }}</text>
          </view>
          <view class="pet-avatar-box">
          <view class="pet-avatar-box">
            <image 
              class="pet-avatar-img" 
              :src="getPetAvatar(userPet.image_url, userPet.species)" 
              mode="aspectFill"
            ></image>
          </view>
          </view>
        </view>
      </view>
      
      <!-- 未登录或无宠物时显示欢迎卡片 -->
      <view class="welcome-card" v-else @click="goToPetAdd">
        <view class="welcome-content">
          <text class="welcome-title">欢迎来到 PetMaster</text>
          <text class="welcome-desc">添加您的第一只宠物，开启智能养宠生活</text>
          <view class="go-add-btn">
            <text>去添加</text>
            <text class="arrow-icon">›</text>
          </view>
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
        <scroll-view class="products-scroll" scroll-x enable-flex show-scrollbar="false">
          <view class="products-flex">
            <view 
              v-for="product in products" 
              :key="product.id" 
              class="home-product-card"
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
                  <!-- 首页卡片精简展示，不显示库存标签 -->
                  <view class="action-btn-mini">
                    <text>➜</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getServices, type Service } from '@/api/service'
import { getProducts, type Product } from '@/api/product'
import { getPets, type Pet } from '@/api/pet'
import { useUserStore } from '@/stores/user'
import { getPetAvatar } from '@/utils/pet'

/** 状态栏高度 */
const statusBarHeight = ref(0)

/** 服务列表 */
const services = ref<Service[]>([])

/** 商品列表 */
const products = ref<Product[]>([])

/** 用户宠物 */
const userPet = ref<Pet | null>(null)

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
 * 页面显示时刷新宠物数据
 */
onShow(() => {
  if (userStore.token) {
    loadUserPet()
  }
})

/**
 * 加载用户宠物（获取第一只）
 */
const loadUserPet = async () => {
  try {
    const data = await getPets({ limit: 1 })
    if (data && data.length > 0) {
      userPet.value = data[0]
    } else {
      userPet.value = null
    }
  } catch (error) {
    console.error('加载宠物失败:', error)
  }
}

/**
 * 计算年龄
 */
const calculateAge = (birthday?: string): string => {
  if (!birthday) return '年龄未知'
  const birth = new Date(birthday)
  const now = new Date()
  
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  
  if (months < 0) {
    years--
    months += 12
  }
  
  if (years > 0) {
    return `${years}岁` + (months > 0 ? `${months}个月` : '')
  }
  return `${months}个月`
}

/**
 * 跳转到宠物详情
 */
const goToPetDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/pet/detail?id=${id}` })
}

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
/**
 * 跳转到添加宠物
 */
const goToPetAdd = () => {
  if (!userStore.checkAuth()) return
  uni.navigateTo({ url: '/pages/pet/add' })
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

@keyframes breathe {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.05); }
}

.home-container {
  min-height: 100vh;
  background: $pet-bg-base;
  position: relative;
  overflow: hidden;
  
  /* 顶部氛围背景 - 装饰性光斑 */
  &::before {
    content: '';
    position: absolute;
    top: -200rpx;
    left: -200rpx;
    width: 800rpx;
    height: 800rpx;
    background: radial-gradient(circle, rgba(255, 223, 137, 0.45) 0%, rgba(255, 255, 255, 0) 70%);
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
    animation: breathe 10s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -100rpx;
    right: -200rpx;
    width: 600rpx;
    height: 600rpx;
    background: radial-gradient(circle, rgba(227, 242, 253, 0.4) 0%, rgba(255, 255, 255, 0) 70%);
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
  }
}

/* 玻璃态导航栏 - 更细腻的磨砂感 */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  transition: all 0.3s ease;
  
  &.glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 4rpx 30rpx rgba(0, 0, 0, 0.02);
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
  gap: 16rpx;
  background: rgba(255, 255, 255, 0.6);
  padding: 8rpx 20rpx 8rpx 12rpx;
  border-radius: 100rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.03);
}

.location-icon {
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #FFD700 0%, #FFB300 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(255, 179, 0, 0.3);
  color: #fff;
  text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
}

.location-text {
  font-size: 28rpx;
  font-weight: 700;
  color: $pet-text-main;
  letter-spacing: 0.5rpx;
}

.nav-right {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  
  &:active {
    background: rgba(0,0,0,0.05);
  }
}

.bell-icon {
  font-size: 40rpx;
  position: relative;
  filter: drop-shadow(0 4rpx 8rpx rgba(0,0,0,0.08));
}

.bell-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 18rpx;
  height: 18rpx;
  background: #FF4D4F;
  border-radius: 50%;
  border: 3rpx solid #fff;
  box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.4);
}

/* 主内容区 */
.main-content {
  min-height: 100vh;
  padding: 30rpx 40rpx;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

/* 宠物状态卡片 - 品牌黄风格 */
.pet-status-card {
  background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
  border-radius: 48rpx;
  padding: 48rpx;
  margin-bottom: 56rpx;
  box-shadow: 0 20rpx 60rpx rgba(255, 160, 0, 0.25), inset 0 2rpx 0 rgba(255, 255, 255, 0.3);
  animation: fade-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  &:active {
    transform: scale(0.98);
  }
  
  // 装饰纹理 - 更有层次感的光
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 500rpx;
    height: 500rpx;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, transparent 60%);
    border-radius: 50%;
    pointer-events: none;
    filter: blur(20px);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -10%;
    width: 300rpx;
    height: 300rpx;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    filter: blur(10px);
  }
}

.pet-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.pet-info-left {
  flex: 1;
  padding-right: 32rpx;
}

.pet-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  padding: 10rpx 24rpx;
  border-radius: 100rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.status-label {
  font-size: 22rpx;
  color: #B45309;
  font-weight: 700;
  opacity: 0.9;
}

.status-value {
  font-size: 24rpx;
  color: #1F2937;
  font-weight: 600;
  border-left: 2rpx solid rgba(0, 0, 0, 0.06);
  padding-left: 12rpx;
}

.pet-name-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 14rpx;
}

.pet-name {
  font-size: 48rpx;
  font-weight: 800;
  color: #1F2937;
  letter-spacing: -0.5rpx;
  text-shadow: 0 2rpx 4rpx rgba(255, 255, 255, 0.2);
}

.pet-gender-icon {
  font-size: 30rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  font-weight: 800;
  backdrop-filter: blur(4px);
  box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.05);
  
  &.公, &.male { color: #0369A1; }
  &.母, &.female { color: #BE185D; }
}

.pet-desc {
  display: block;
  font-size: 28rpx;
  color: rgba(31, 41, 55, 0.85);
  font-weight: 500;
  letter-spacing: 0.5rpx;
}

.pet-avatar-box {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.8);
  background: #FFFFFF;
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  .pet-avatar-img {
    width: 100%;
    height: 100%;
    transform: scale(1.02); /* 避免白边 */
  }
}

/* 欢迎卡片 - 高级黑金风格 */
.welcome-card {
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
  border-radius: 48rpx;
  padding: 56rpx;
  margin-bottom: 56rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 24rpx 60rpx rgba(17, 24, 39, 0.25);
  position: relative;
  overflow: hidden;
  
  // 金色装饰流光
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 400rpx;
    height: 400rpx;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    mix-blend-mode: screen;
  }
}

.welcome-content {
  flex: 1;
  z-index: 1;
}

.welcome-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  background: linear-gradient(to right, #FFF, #E5E7EB);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16rpx;
}

.welcome-desc {
  display: block;
  font-size: 28rpx;
  color: #9CA3AF;
  margin-bottom: 40rpx;
  line-height: 1.5;
}

.go-add-btn {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #FFC107 0%, #FFB300 100%);
  padding: 16rpx 36rpx;
  border-radius: 100rpx;
  box-shadow: 0 8rpx 20rpx rgba(255, 179, 0, 0.3);
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.96);
  }
  
  text {
    font-size: 28rpx;
    font-weight: 700;
    color: #1F2937;
  }
  
  .arrow-icon {
    font-size: 34rpx;
    margin-left: 8rpx;
    margin-bottom: 2rpx;
  }
}

.welcome-icon {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 40rpx rgba(255, 255, 255, 0.05);
  animation: float 4s ease-in-out infinite;
}

/* 区块样式 */
.section {
  margin-bottom: 64rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
  padding: 0 8rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #111827;
  position: relative;
  z-index: 1;
  padding-left: 12rpx;
  
  // 标题装饰点
  &::before {
    content: '';
    position: absolute;
    left: 0;
    bottom: 8rpx;
    width: 100%;
    height: 16rpx;
    background: linear-gradient(90deg, #FFECB3 0%, rgba(255, 255, 255, 0) 100%);
    z-index: -1;
    border-radius: 8rpx;
    opacity: 0.6;
  }
}

.section-more {
  font-size: 28rpx;
  color: #6B7280;
  font-weight: 600;
  background: #F3F4F6;
  padding: 8rpx 24rpx;
  border-radius: 100rpx;
  transition: all 0.2s;
  
  &:active {
    background: #E5E7EB;
  }
}

/* 服务网格 - 2x2 布局 */
.service-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32rpx;
}

.service-card {
  background: #FFFFFF;
  border-radius: 40rpx;
  padding: 36rpx;
  box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.03);
  border: 1rpx solid rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
  }
}

.service-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28rpx;
}

.service-icon-box {
  width: 96rpx;
  height: 96rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  // 图标背景微光效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at top left, rgba(255,255,255,0.8), transparent);
  }
  
  &.color-sky {
    background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
    color: #0284C7;
  }
  &.color-purple {
    background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%);
    color: #9333EA;
  }
  &.color-orange {
    background: linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%);
    color: #EA580C;
  }
  &.color-green {
    background: linear-gradient(135deg, #ECFDF5 0%, #A7F3D0 100%);
    color: #059669;
  }
}

.service-icon-text {
  font-size: 44rpx;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 4rpx 4rpx rgba(0,0,0,0.05));
}

.service-price-tag {
  background: #FAFAFA;
  padding: 10rpx 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #F3F4F6;
  
  text {
    font-size: 26rpx;
    font-weight: 700;
    color: #374151;
  }
}

.service-card-bottom {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.service-card-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.service-card-duration {
  font-size: 24rpx;
  color: #9CA3AF;
  font-weight: 500;
}

/* 精选商品 - 横向滚动布局 */
.products-scroll {
  width: 100%;
  white-space: nowrap;
}

.products-flex {
  display: flex;
  padding: 0 40rpx 40rpx 40rpx; /* 左右padding对齐主内容，底部留给阴影 */
  gap: 24rpx;
}

.home-product-card {
  background: #FFFFFF;
  border-radius: 36rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column; /* 垂直布局 */
  width: 260rpx; /* 固定宽度 */
  flex-shrink: 0; /* 防止压缩 */
  gap: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  
  /* 玻璃光泽 */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 70%);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }

  &:active {
    transform: scale(0.96);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    background: #FAFAFA;
    
    &::after {
      transform: translateX(100%);
    }
  }
}

.product-image-box {
  width: 100%;
  height: 220rpx; /* 加高图片区域 */
  background: #F9FAFB;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1rpx solid #F3F4F6;
  flex-shrink: 0;
}

.product-emoji {
  font-size: 96rpx; /* 更大的 emoji */
  filter: drop-shadow(0 12rpx 16rpx rgba(0,0,0,0.08));
  transition: transform 0.3s;
  
  .home-product-card:active & {
    transform: scale(1.1) rotate(5deg);
  }
}

.sold-out-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  
  text {
    color: #fff;
    font-size: 24rpx;
    font-weight: 600;
    background: rgba(0,0,0,0.6);
    padding: 6rpx 20rpx;
    border-radius: 100rpx;
  }
}

.product-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.product-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4rpx;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  display: flex;
  align-items: baseline;
  color: #E11D48;
  
  .price-symbol {
    font-size: 24rpx;
    font-weight: 700;
    margin-right: 2rpx;
  }
  
  .price-value {
    font-size: 36rpx;
    font-weight: 800;
    font-family: 'DIN Alternate', sans-serif;
    letter-spacing: -1rpx;
  }
}

.action-btn-mini {
  width: 48rpx;
  height: 48rpx;
  background: #F3F4F6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 20rpx;
    color: #9CA3AF;
    font-weight: 700;
  }
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
  margin-bottom: 20rpx;
}
</style>
