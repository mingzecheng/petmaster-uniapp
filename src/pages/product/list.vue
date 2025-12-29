<template>
  <view class="product-list-container">
    <!-- 沉浸式页头 + 搜索 -->
    <view class="immersive-header">
      <!-- 背景装饰 -->
      <view class="header-pattern"></view>
      <view class="header-bg-circles">
        <view class="circle c-1"></view>
        <view class="circle c-2"></view>
      </view>
      
      <!-- 标题栏 -->
      <view class="header-top">
        <text class="header-title">🛒 宠物商城</text>
        <text class="header-subtitle">精选优质宠物用品</text>
      </view>

      <!-- 搜索框 -->
      <view class="search-box-enhanced glass">
        <text class="search-icon">🔍</text>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索您需要的商品..."
          placeholder-class="search-placeholder"
          class="search-input"
          @confirm="handleSearch"
        />
        <view v-if="searchKeyword" class="clear-btn-enhanced" @click="clearSearch">
          <text>✕</text>
        </view>
        <view class="voice-hint">
          <text>🎤</text>
        </view>
      </view>
    </view>

    <!-- 分类筛选 -->
    <scroll-view class="filter-scroll" scroll-x>
      <view class="filter-tabs">
        <view 
          v-for="cat in categories" 
          :key="cat.value"
          :class="['tab-item', currentCategory === cat.value ? cat.activeClass : cat.inactiveClass]"
          @click="selectCategory(cat.value)"
        >
          <text class="tab-icon">{{ cat.icon }}</text>
          <text class="tab-label">{{ cat.label }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 商品列表 -->
    <scroll-view 
      class="product-scroll" 
      scroll-y
      @scrolltolower="loadMore"
    >
      <view class="products-grid">
        <view 
          v-for="(product, index) in products" 
          :key="product.id" 
          class="store-product-card"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @click="goToDetail(product.id)"
        >
            <!-- 商品图片区 -->
          <view class="product-image-wrapper">
            <view class="product-image-bg" :class="getCategoryBgClass(product.category)">
              <text class="product-emoji">{{ getProductIcon(product.category) }}</text>
            </view>
            <!-- 标签 -->
            <view v-if="product.stock <= 0" class="stock-badge out">
              <text>售罄</text>
            </view>
            <view v-else-if="product.stock <= 5" class="stock-badge low">
              <text>仅剩{{ product.stock }}件</text>
            </view>
            <!-- 新品标签 -->
            <view v-if="isNewProduct(product.created_at)" class="new-badge">
              <text>NEW</text>
            </view>
          </view>

          <!-- 商品信息 -->
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            
            <!-- 分类标签 -->
            <view class="product-tags">
              <view v-if="product.category" class="category-tag" :class="getCategoryTagClass(product.category)">
                <text class="tag-icon">{{ getProductIcon(product.category) }}</text>
                <text>{{ product.category }}</text>
              </view>
            </view>

            <view class="product-footer">
              <view class="price-section">
                <text class="price-label">¥</text>
                <text class="price-value">{{ formatPrice(product.price)[0] }}</text>
                <text class="price-decimal">.{{ formatPrice(product.price)[1] }}</text>
              </view>
              <view class="action-btn" @click.stop="handleBuy(product)">
                <text class="cart-icon">🛒</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-section">
        <view class="loading-spinner"></view>
        <text>加载中...</text>
      </view>
      <view v-else-if="noMore && products.length > 0" class="loading-section">
        <view class="divider-line"></view>
        <text>已展示全部商品</text>
        <view class="divider-line"></view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && products.length === 0" class="empty-state">
        <view class="empty-illustration">
          <text>📦</text>
        </view>
        <text class="empty-title">暂无商品</text>
        <text class="empty-desc">敬请期待更多精选好物上架</text>
      </view>

      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getProducts, type Product } from '@/api/product'
import { useUserStore } from '@/stores/user'

/** 商品列表 */
const products = ref<Product[]>([])

/** 搜索关键词 */
const searchKeyword = ref('')

/** 当前分类 */
const currentCategory = ref('')

/** 分页参数 */
const page = ref(0)
const pageSize = 10

/** 加载状态 */
const loading = ref(false)
const noMore = ref(false)

/** 用户Store */
const userStore = useUserStore()

/** 分类列表（带图标） */
/** 分类列表（带图标和颜色类） */
const categories = [
  { label: '全部', value: '', icon: '🏠', activeClass: 'tab-all', inactiveClass: 'tab-all-light' },
  { label: '食品', value: '食品', icon: '🍖', activeClass: 'tab-food', inactiveClass: 'tab-food-light' },
  { label: '玩具', value: '玩具', icon: '🎾', activeClass: 'tab-toy', inactiveClass: 'tab-toy-light' },
  { label: '用品', value: '用品', icon: '🦴', activeClass: 'tab-supply', inactiveClass: 'tab-supply-light' },
  { label: '洗护', value: '洗护', icon: '🧴', activeClass: 'tab-wash', inactiveClass: 'tab-wash-light' },
  { label: '服饰', value: '服饰', icon: '👕', activeClass: 'tab-cloth', inactiveClass: 'tab-cloth-light' },
  { label: '药品', value: '药品', icon: '💊', activeClass: 'tab-medicine', inactiveClass: 'tab-medicine-light' }
]

/**
 * 初始化
 */
onMounted(() => {
  loadProducts()
})

/**
 * 加载商品
 */
const loadProducts = async (reset = false) => {
  if (loading.value) return
  if (noMore.value && !reset) return

  if (reset) {
    page.value = 0
    products.value = []
    noMore.value = false
  }

  loading.value = true
  try {
    const params: any = {
      skip: page.value * pageSize,
      limit: pageSize
    }
    if (currentCategory.value) {
      params.category = currentCategory.value
    }
    if (searchKeyword.value) {
      params.name = searchKeyword.value
    }

    const data = await getProducts(params)
    
    if (data.length < pageSize) {
      noMore.value = true
    }
    
    products.value = reset ? data : [...products.value, ...data]
    page.value++
  } catch (error) {
    console.error('加载商品失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 选择分类
 */
const selectCategory = (category: string) => {
  currentCategory.value = category
  loadProducts(true)
}

/**
 * 搜索
 */
const handleSearch = () => {
  loadProducts(true)
}

/**
 * 清除搜索
 */
const clearSearch = () => {
  searchKeyword.value = ''
  loadProducts(true)
}

/**
 * 加载更多
 */
const loadMore = () => {
  loadProducts()
}

/**
 * 跳转到详情
 */
const goToDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

/**
 * 购买商品 - 创建订单并跳转支付
 */
const handleBuy = async (product: Product) => {
  if (!userStore.checkAuth()) return

  if (product.stock <= 0) {
    uni.showToast({ title: '商品已售罄', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '创建订单...' })
    
    // 1. 创建订单
    const { createOrder } = await import('@/api/order')
    
    const order = await createOrder({
      items: [{
        product_id: product.id,
        quantity: 1
      }]
    })
    
    uni.hideLoading()
    uni.showToast({
      title: '订单创建成功',
      icon: 'success',
      duration: 1500
    })
    
    // 2. 跳转到统一支付页面
    setTimeout(() => {
      uni.navigateTo({
        url: `/pages/payment/options?amount=${order.total_amount}&subject=${encodeURIComponent(product.name)}&related_id=${order.id}&related_type=order`
      })
    }, 1500)
    
  } catch (error: any) {
    uni.hideLoading()
    console.error('创建订单失败:', error)
    uni.showToast({
      title: error.message || '创建订单失败',
      icon: 'none'
    })
  }
}

/**
 * 获取商品图标
 */
const getProductIcon = (category?: string): string => {
  const icons: Record<string, string> = {
    '食品': '🍖',
    '玩具': '🎾',
    '用品': '🦴',
    '洗护': '🧴',
    '服饰': '👕',
    '药品': '💊'
  }
  return icons[category || ''] || '📦'
}



/**
 * 格式化价格(分割整数和小数)
 */
const formatPrice = (price: number | string): [string, string] => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  const str = numPrice.toFixed(2)
  const [int, dec] = str.split('.')
  return [int, dec]
}

/**
 * 判断是否为新品（60天内 - 演示用延长周期）
 */
const isNewProduct = (createdAt: string): boolean => {
  if (!createdAt) return false
  const createTime = new Date(createdAt).getTime()
  const now = new Date().getTime()
  return (now - createTime) < 60 * 24 * 60 * 60 * 1000
}

/**
 * 获取分类标签样式类
 */
const getCategoryTagClass = (category?: string): string => {
  const classes: Record<string, string> = {
    '食品': 'tag-food',
    '玩具': 'tag-toy',
    '用品': 'tag-supply',
    '洗护': 'tag-wash',
    '服饰': 'tag-cloth',
    '药品': 'tag-medicine'
  }
  return classes[category || ''] || 'tag-default'
}
/**
 * 获取分类背景样式类 (Subtle)
 */
const getCategoryBgClass = (category?: string): string => {
  const classes: Record<string, string> = {
    '食品': 'bg-food-subtle',
    '玩具': 'bg-toy-subtle',
    '用品': 'bg-supply-subtle',
    '洗护': 'bg-wash-subtle',
    '服饰': 'bg-cloth-subtle',
    '药品': 'bg-medicine-subtle'
  }
  return classes[category || ''] || 'bg-default-subtle'
}
</script>

<style lang="scss">
/* 入场动画 */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.product-list-container {
  min-height: 100vh;
  background: #F8F9FA;
}  

/* 沉浸式头部 - 高级黄主题 */
.immersive-header {
  position: relative;
  background: linear-gradient(135deg, #FFC107 0%, #FFB300 100%);
  padding: 20rpx 32rpx 48rpx;
  padding-top: calc(var(--status-bar-height, 20px) + 20rpx);
  border-radius: 0 0 48rpx 48rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 30rpx rgba(255, 179, 0, 0.2);
  margin-bottom: 24rpx;
  overflow: hidden;
}

.header-pattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.1;
    background-image: radial-gradient(#FFFFFF 15%, transparent 16%), radial-gradient(#FFFFFF 15%, transparent 16%);
    background-size: 40rpx 40rpx;
    background-position: 0 0, 20rpx 20rpx;
    z-index: 0;
}

.header-bg-circles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
}

.c-1 {
  width: 400rpx;
  height: 400rpx;
  top: -150rpx;
  right: -100rpx;
  filter: blur(20px);
}

.c-2 {
  width: 300rpx;
  height: 300rpx;
  bottom: -60rpx;
  left: -60rpx;
  filter: blur(15px);
}

.header-top {
  position: relative;
  z-index: 1;
  margin-bottom: 32rpx;
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 44rpx;
  font-weight: 800;
  color: #1F2937;
  letter-spacing: -1rpx;
  margin-bottom: 4rpx;
  text-shadow: 0 2rpx 4rpx rgba(255, 255, 255, 0.2);
}

.header-subtitle {
  font-size: 24rpx;
  color: rgba(31, 41, 55, 0.7);
  font-weight: 600;
}

/* 搜索框优化 - 黄金边框 */
.search-box-enhanced {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  height: 96rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx;
  padding: 0 32rpx;
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  transition: all 0.3s;
  border: 2rpx solid transparent;

  &:focus-within {
    border-color: #FFC107;
    background: #FFFFFF;
    box-shadow: 0 12rpx 40rpx rgba(255, 193, 7, 0.15);
    transform: translateY(-2rpx);
  }

  &:active {
    transform: scale(0.99);
  }
}

.search-icon {
  font-size: 36rpx;
  margin-right: 24rpx;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #1F2937;
  font-weight: 500;
  height: 100%;
}

.clear-btn-enhanced {
  width: 48rpx;
  height: 48rpx;
  background: #F3F4F6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  transition: all 0.2s;
  
  text {
    font-size: 24rpx;
    color: #9CA3AF;
    font-weight: 700;
  }
  
  &:active {
    background: #E5E7EB;
  }
}

.voice-hint {
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #FFC107 0%, #FFB300 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(255, 179, 0, 0.3);
  
  text {
    font-size: 28rpx;
  }
}

/* 分类筛选 - 统一金黄风格 */
.filter-scroll {
  white-space: nowrap;
  background: transparent;
  padding: 8rpx 0 24rpx;
}

.filter-tabs {
  display: inline-flex;
  padding: 0 32rpx;
  gap: 20rpx;
}

.tab-item {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 32rpx;
  background: #FFFFFF;
  border-radius: 100rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1rpx solid transparent;
  position: relative;
  overflow: hidden;

  /* 统一黄色主题 - 未激活状态 */
  &.tab-all-light, &.tab-food-light, &.tab-toy-light, &.tab-supply-light, 
  &.tab-wash-light, &.tab-cloth-light, &.tab-medicine-light { 
    background: #FFF9E6; 
    .tab-label { color: #92400E; } 
  }
  
  /* 统一黄色主题 - 激活状态 */
  &.tab-all, &.tab-food, &.tab-toy, &.tab-supply, 
  &.tab-wash, &.tab-cloth, &.tab-medicine { 
    background: linear-gradient(135deg, #FFC107 0%, #FFB300 100%); 
    box-shadow: 0 6rpx 16rpx rgba(255, 193, 7, 0.35); 
  }

  /* 激活状态通用 */
  &[class*="tab-"][class$="-light"] {
     /* 保持未激活状态的样式 */
     transform: scale(1);
  }

  &[class*="tab-"]:not([class$="-light"]) {
    transform: translateY(-2rpx);
    .tab-label { color: #FFFFFF; font-weight: 700; text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1); }
    .tab-icon { opacity: 1; filter: drop-shadow(0 2rpx 2rpx rgba(0,0,0,0.1)); }
  }
  
  &:active {
    transform: scale(0.95) !important;
  }
}

.tab-icon {
  font-size: 32rpx;
  opacity: 1; /* 始终保持可见 */
}

.tab-label {
  font-size: 26rpx;
  font-weight: 600;
  transition: all 0.25s;
}

/* 商品列表 */
.product-scroll {
  height: calc(100vh - 460rpx);
  padding: 0 24rpx;
}

/* 商品网格 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  padding: 0 8rpx 40rpx;
}

/* 商城商品卡片 - 统一黄色主题 */
.store-product-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(251, 191, 36, 0.08);
  transition: all 0.3s ease;
  animation: fadeInUp 0.4s ease-out forwards;
  opacity: 0;
  display: flex;
  flex-direction: column;
  border: 2rpx solid #FEF3C7;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(251, 191, 36, 0.15);
  }
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 90%;
  overflow: hidden;
  background: #FAF9F6; /* 统一米白底色 */
  flex-shrink: 0;
}

.product-image-bg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  border-radius: 24rpx 24rpx 0 0;
}

.product-emoji {
  font-size: 120rpx;
  filter: drop-shadow(0 8rpx 16rpx rgba(251, 191, 36, 0.3));
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

.store-product-card:active .product-emoji {
  transform: scale(1.1);
}

.stock-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  left: auto;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  backdrop-filter: blur(8px);
  z-index: 10;
  box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.05);
  
  text {
    font-size: 20rpx;
    font-weight: 700;
  }
  
  &.low {
    background: rgba(255, 255, 255, 0.9);
    border: 1rpx solid #FFC107;
    text { color: #D97706; }
  }
  
  &.out {
    background: rgba(31, 41, 55, 0.8);
    text { color: #FFFFFF; }
  }
}

.new-badge {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
  z-index: 10;
  
  text {
    font-size: 18rpx;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: 1rpx;
  }
}

.product-info {
  padding: 24rpx;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 12rpx;
  line-height: 1.4;
  height: 80rpx; 
}

.product-tags {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
  min-height: 40rpx; 
}

.category-tag {
  padding: 6rpx 16rpx;
  border-radius: 100rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  
  .tag-icon {
    font-size: 22rpx;
    line-height: 1;
  }
  
  text {
    font-size: 20rpx;
    font-weight: 700;
  }
  
  &.tag-food { background: #FFF7ED; text { color: #EA580C; } }
  &.tag-toy { background: #ECFDF5; text { color: #059669; } }
  &.tag-supply { background: #EFF6FF; text { color: #2563EB; } }
  &.tag-wash { background: #F5F3FF; text { color: #7C3AED; } }
  &.tag-cloth { background: #FDF4FF; text { color: #C026D3; } }
  &.tag-medicine { background: #FEF2F2; text { color: #DC2626; } }
  &.tag-default { background: #F3F4F6; text { color: #4B5563; } }
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12rpx;
}

.price-section {
  display: flex;
  align-items: baseline;
  color: #1F2937; /* 深黑文字更显高级 */
}

.price-label {
  font-size: 24rpx;
  font-weight: 600;
  margin-right: 4rpx;
}

.price-value {
  font-size: 40rpx;
  font-weight: 800;
  font-family: 'DIN Alternate', -apple-system, sans-serif;
  letter-spacing: -1rpx;
}

.price-decimal {
  font-size: 24rpx;
  font-weight: 700;
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  background: linear-gradient(135deg, #FFC107 0%, #FFB300 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(255, 179, 0, 0.25); /* 增强阴影 */
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.92);
    box-shadow: 0 4rpx 10rpx rgba(255, 179, 0, 0.2);
  }
}

.cart-icon {
  font-size: 32rpx;
  color: #1F2937;
}

/* 加载状态 */
.loading-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 40rpx;
  
  text {
    font-size: 26rpx;
    color: #9CA3AF;
  }
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #E5E7EB;
  border-top-color: #FFC107;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.divider-line {
  width: 60rpx;
  height: 2rpx;
  background: #E5E7EB;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
}

.empty-illustration {
  width: 200rpx;
  height: 200rpx;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  box-shadow: 0 10rpx 20rpx rgba(0,0,0,0.03);
  
  text {
    font-size: 88rpx;
    opacity: 0.8;
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

.safe-area-bottom {
  height: 180rpx;
}
</style>
