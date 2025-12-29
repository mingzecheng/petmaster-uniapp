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
    <scroll-view class="main-content" scroll-y :style="{ paddingTop: (statusBarHeight + 68) + 'px' }">
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
            <image 
              class="pet-avatar-img" 
              :src="getPetAvatar(userPet.image_url, userPet.species)" 
              mode="aspectFill"
            ></image>
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

      <!-- 寄养服务推广卡片 -->
      <view class="boarding-promo-card" @click="goToBoarding">
        <view class="promo-content">
          <view class="promo-header">
            <view class="promo-icon">🏠</view>
            <view class="promo-title-section">
              <text class="promo-title">宠物寄养服务</text>
              <text class="promo-subtitle">专业看护 · 温馨环境 · 24小时监护</text>
            </view>
          </view>
          <view class="promo-footer">
            <view class="price-section">
              <text class="price-label">每日</text>
              <text class="price-value">¥120</text>
              <text class="price-unit">起</text>
            </view>
            <view class="promo-btn">
              <text>立即预约</text>
              <text class="arrow">→</text>
            </view>
          </view>
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
        <view class="section-header-enhanced">
          <view class="header-left">
            <text class="section-title">精选商品</text>
            <text class="section-subtitle">为您的爱宠精选优质好物</text>
          </view>
          <view class="header-right" @click="goToProducts">
            <text class="more-text">更多</text>
            <text class="arrow">›</text>
          </view>
        </view>
        
        <scroll-view class="products-scroll" scroll-x show-scrollbar="false">
          <view class="products-wrapper">
            <!-- 商品卡片 -->
            <view 
              v-for="product in products" 
              :key="product.id" 
              class="product-card-enhanced"
              @click="goToProductDetail(product.id)"
            >
              <!-- 图片区域 -->
              <view class="product-img-wrapper" :class="getProductBgClass(product.category)">
                <text class="product-icon">{{ getProductIcon(product.category) }}</text>
                <!-- 库存标签 -->
                <view v-if="product.stock <= 5 && product.stock > 0" class="stock-badge low">
                  <text>仅剩{{product.stock}}件</text>
                </view>
                <view v-else-if="product.stock <= 0" class="stock-badge sold-out">
                  <text>已售罄</text>
                </view>
              </view>
              
              <!-- 信息区域 -->
              <view class="product-details">
                <!-- 分类标签 -->
                <view class="category-tag">
                  <text>{{ product.category || '精选' }}</text>
                </view>
                
                <!-- 商品名称 -->
                <text class="product-title">{{ product.name }}</text>
                
                <!-- 底部价格和操作 -->
                <view class="product-footer">
                  <view class="price-box">
                    <text class="price-currency">¥</text>
                    <text class="price-number">{{ formatPrice(product.price) }}</text>
                  </view>
                  <view class="add-cart-btn" @click.stop="handleQuickBuy(product)">
                    <text class="cart-icon">🛒</text>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 查看更多卡片 -->
            <view class="more-card" @click="goToProducts">
              <view class="more-icon-box">
                <text class="more-icon">→</text>
              </view>
              <text class="more-label">查看全部</text>
              <text class="more-count">更多商品</text>
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
 * 获取商品背景色class
 */
const getProductBgClass = (category?: string): string => {
  const classes: Record<string, string> = {
    '食品': 'bg-food',
    '玩具': 'bg-toy',
    '用品': 'bg-supply',
    '服饰': 'bg-cloth',
    '药品': 'bg-medicine'
  }
  return classes[category || ''] || 'bg-default'
}

/**
 * 格式化价格
 */
const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(2)
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

/**
 * 跳转到寄养创建
 */
const goToBoarding = () => {
  if (!userStore.checkAuth()) return
  uni.navigateTo({ url: '/pages/boarding/create' })
}

/**
 * 快速购买商品
 */
const handleQuickBuy = (product: Product) => {
  if (!userStore.checkAuth()) return
  
  if (product.stock <= 0) {
    uni.showToast({ title: '商品已售罄', icon: 'none' })
    return
  }
  
  // 直接跳转到商品详情页
  goToProductDetail(product.id)
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
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  text-shadow: none;
}

.location-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
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
  background-clip: text;
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

/* 寄养服务推广卡片 */
.boarding-promo-card {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  border-radius: 32rpx;
  padding: 40rpx;
  margin-bottom: 56rpx;
  box-shadow: 0 16rpx 48rpx rgba(245, 124, 0, 0.25), inset 0 2rpx 0 rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  
  &:active {
    transform: scale(0.98);
  }
  
  // 装饰背景光晕
  &::before {
    content: '';
    position: absolute;
    top: -40%;
    right: -15%;
    width: 400rpx;
    height: 400rpx;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 60%);
    border-radius: 50%;
    pointer-events: none;
    filter: blur(15px);
  }
}

.promo-content {
  position: relative;
  z-index: 1;
}

.promo-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.promo-icon {
  width: 88rpx;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.promo-title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.promo-title {
  font-size: 40rpx;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: -0.5rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.promo-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  letter-spacing: 0.5rpx;
}

.promo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.price-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.price-value {
  font-size: 56rpx;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: -1rpx;
  font-family: 'Outfit', sans-serif;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.price-unit {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.promo-btn {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 18rpx 32rpx;
  border-radius: 100rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  gap: 8rpx;
  
  &:active {
    transform: scale(0.95);
    background: #FFFFFF;
  }
  
  text {
    font-size: 28rpx;
    font-weight: 700;
    color: #E65100;
  }
  
  .arrow {
    font-size: 32rpx;
    font-weight: 400;
  }
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

/* 增强版区块标题 */
.section-header-enhanced {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 36rpx;
  padding: 0 8rpx;
}

.header-left {
  flex: 1;
}

.section-subtitle {
  display: block;
  font-size: 24rpx;
  color: #9CA3AF;
  margin-top: 8rpx;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 20rpx;
  background: #FFFFFF;
  border-radius: 100rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.96);
    background: #F9FAFB;
  }
}

.more-text {
  font-size: 26rpx;
  color: #6B7280;
  font-weight: 600;
}

.arrow {
  font-size: 32rpx;
  color: #9CA3AF;
  margin-left: 2rpx;
}

/* 服务网格 - 2x2 布局 */
.service-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.service-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
  }
}

.service-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.service-icon-box {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
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
  
  /* 统一黄色系背景 */
  &.color-sky,
  &.color-purple,
  &.color-orange,
  &.color-green {
    background: linear-gradient(135deg, #FFF9E6 0%, #FEF3C7 100%);
    color: #D97706;
  }
}

.service-icon-text {
  font-size: 36rpx;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2rpx 2rpx rgba(0,0,0,0.05));
}

.service-price-tag {
  background: linear-gradient(135deg, #FFC107 0%, #FFB300 100%);
  padding: 8rpx 16rpx;
  border-radius: 100rpx;
  
  text {
    font-size: 24rpx;
    font-weight: 800;
    color: #1F2937;
  }
}

.service-card-bottom {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.service-card-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #111827;
}

.service-card-duration {
  font-size: 22rpx;
  color: #9CA3AF;
  font-weight: 500;
}

/* 精选商品 - 横向滑动布局 */
.products-scroll {
  width: 100%;
  white-space: nowrap;
  margin: 0 -40rpx;
}

.products-wrapper {
  display: flex;
  padding: 0 40rpx 24rpx 40rpx;
  gap: 20rpx;
}

/* 增强版商品卡片 */
.product-card-enhanced {
  background: #FFFFFF;
  border-radius: 36rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  width: 280rpx;
  flex-shrink: 0;
  gap: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
  }
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

/* 商品图片区域 */
.product-img-wrapper {
  width: 100%;
  height: 200rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1rpx solid rgba(0, 0, 0, 0.02);
  flex-shrink: 0;
  
  /* 统一黄色系背景 */
  &.bg-food,
  &.bg-toy,
  &.bg-supply,
  &.bg-cloth,
  &.bg-medicine,
  &.bg-default { 
    background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); 
  }
}

.product-icon {
  font-size: 100rpx;
  filter: drop-shadow(0 8rpx 16rpx rgba(251, 191, 36, 0.3));
}

/* 库存徽章 */
.stock-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 8rpx 16rpx;
  border-radius: 100rpx;
  backdrop-filter: blur(8px);
  font-size: 22rpx;
  font-weight: 700;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  
  &.low {
    background: rgba(255, 237, 213, 0.95);
    color: #EA580C;
    border: 2rpx solid rgba(234, 88, 12, 0.2);
  }
  
  &.sold-out {
    background: rgba(0, 0, 0, 0.7);
    color: #FFFFFF;
  }
}

/* 商品信息区域 */
.product-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

/* 分类标签 */
.category-tag {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 6rpx 16rpx;
  background: #F9FAFB;
  border-radius: 12rpx;
  border: 1rpx solid #E5E7EB;
  
  text {
    font-size: 20rpx;
    color: #6B7280;
    font-weight: 600;
  }
}

/* 商品标题 */
.product-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #1F2937;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  white-space: normal;
}

/* 底部价格和操作 */
.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.price-box {
  display: flex;
  align-items: baseline;
  color: #E11D48;
}

.price-currency {
  font-size: 26rpx;
  font-weight: 700;
  margin-right: 4rpx;
}

.price-number {
  font-size: 42rpx;
  font-weight: 800;
  font-family: 'DIN Alternate', sans-serif;
  letter-spacing: -1rpx;
}

/* 加入购物车按钮 */
.add-cart-btn {
  width: 68rpx;
  height: 68rpx;
  background: linear-gradient(135deg, #FFD700 0%, #FFB300 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 16rpx rgba(255, 179, 0, 0.35);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  .cart-icon {
    font-size: 34rpx;
  }
  
  &:active {
    transform: scale(0.9) rotate(-15deg);
    box-shadow: 0 3rpx 8rpx rgba(255, 179, 0, 0.25);
  }
}

/* 查看更多卡片 */
.more-card {
  background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
  border-radius: 44rpx;
  padding: 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 200rpx;
  flex-shrink: 0;
  gap: 20rpx;
  border: 2rpx dashed #D1D5DB;
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.96);
    background: #E5E7EB;
  }
}

.more-icon-box {
  width: 80rpx;
  height: 80rpx;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.more-icon {
  font-size: 48rpx;
  color: #9CA3AF;
  font-weight: 700;
}

.more-label {
  font-size: 28rpx;
  color: #4B5563;
  font-weight: 700;
}

.more-count {
  font-size: 22rpx;
  color: #9CA3AF;
  font-weight: 500;
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
  margin-bottom: 20rpx;
}
</style>
