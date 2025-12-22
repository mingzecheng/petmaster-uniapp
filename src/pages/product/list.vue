<template>
  <view class="product-list-container">
    <!-- 沉浸式页头 + 搜索 -->
    <view class="immersive-header">
      <!-- 背景装饰 -->
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
          :class="['tab-item', { active: currentCategory === cat.value }]"
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
          </view>

          <!-- 商品信息 -->
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
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
const categories = [
  { label: '全部', value: '', icon: '🏠' },
  { label: '食品', value: '食品', icon: '🍖' },
  { label: '玩具', value: '玩具', icon: '🎾' },
  { label: '用品', value: '用品', icon: '🦴' },
  { label: '洗护', value: '洗护', icon: '🧴' },
  { label: '服饰', value: '服饰', icon: '👕' },
  { label: '药品', value: '药品', icon: '💊' }
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
 * 购买商品 - 跳转到结算页
 */
const handleBuy = (product: Product) => {
  if (!userStore.checkAuth()) return

  if (product.stock <= 0) {
    uni.showToast({ title: '商品已售罄', icon: 'none' })
    return
  }

  // 确保价格是数字类型
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price
  const productIcon = getProductIcon(product.category)

  // 跳转到结算页面，支持积分抵扣
  uni.navigateTo({
    url: `/pages/order/checkout?productId=${product.id}&productName=${encodeURIComponent(product.name)}&productIcon=${encodeURIComponent(productIcon)}&quantity=1&amount=${price.toFixed(2)}`
  })
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
 * 获取分类背景色 class
 */
const getCategoryBgClass = (category?: string): string => {
  const classes: Record<string, string> = {
    '食品': 'bg-food',
    '玩具': 'bg-toy',
    '用品': 'bg-supply',
    '洗护': 'bg-wash',
    '服饰': 'bg-cloth',
    '药品': 'bg-medicine'
  }
  return classes[category || ''] || 'bg-default'
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
  background: #FAFAFA;
}  

/* 沉浸式头部 */
.immersive-header {
  position: relative;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  padding: 20rpx 32rpx 48rpx;
  padding-top: calc(var(--status-bar-height, 20px) + 20rpx);
  border-radius: 0 0 48rpx 48rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 30rpx rgba(255, 143, 0, 0.25);
  margin-bottom: 24rpx;
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
}

.header-title {
  font-size: 40rpx;
  font-weight: 800;
  color: #1F2937;
  display: block;
  margin-bottom: 4rpx;
  text-shadow: 0 2rpx 4rpx rgba(255, 255, 255, 0.2);
}

.header-subtitle {
  font-size: 24rpx;
  color: rgba(31, 41, 55, 0.75);
  font-weight: 600;
}

/* 搜索框优化 */
.search-box-enhanced {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  height: 92rpx;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 32rpx;
  padding: 0 32rpx;
  box-shadow: 0 10rpx 32rpx rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(15px);
  transition: all 0.3s;
  border: 2rpx solid rgba(255, 215, 0, 0.2);

  &:focus-within {
    border-color: rgba(255, 179, 0, 0.5);
    box-shadow: 0 12rpx 40rpx rgba(255, 179, 0, 0.15);
  }

  &:active {
    transform: scale(0.99);
  }
}

.search-icon {
  font-size: 38rpx;
  margin-right: 24rpx;
  opacity: 0.7;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #1E293B;
  font-weight: 500;
}

.clear-btn-enhanced {
  width: 52rpx;
  height: 52rpx;
  background: #F1F5F9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  transition: all 0.2s;
  
  text {
    font-size: 26rpx;
    color: #64748B;
    font-weight: 700;
  }
  
  &:active {
    transform: scale(0.9);
    background: #E2E8F0;
  }
}

.voice-hint {
  width: 52rpx;
  height: 52rpx;
  background: linear-gradient(135deg, #FFD700 0%, #FFB300 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(255, 179, 0, 0.25);
  
  text {
    font-size: 28rpx;
  }
}

/* 分类筛选 - 更精致的胶囊设计 */
.filter-scroll {
  white-space: nowrap;
  background: #FFFFFF;
  padding: 16rpx 0;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
}

.filter-tabs {
  display: inline-flex;
  padding: 0 24rpx;
  gap: 16rpx;
}

.tab-item {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  background: #F8FAFC;
  border-radius: 100rpx;
  border: 2rpx solid transparent;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.active {
    background: linear-gradient(135deg, #FFD700 0%, #FFA000 100%);
    box-shadow: 0 6rpx 20rpx rgba(255, 160, 0, 0.3);
    
    .tab-label {
      color: #1F2937;
      font-weight: 700;
    }
  }
  
  &:not(.active):active {
    background: #EEF2F5;
  }
}

.tab-icon {
  font-size: 28rpx;
}

.tab-label {
  font-size: 26rpx;
  color: #64748B;
  font-weight: 600;
  transition: all 0.25s;
}

/* 商品列表 */
.product-scroll {
  height: calc(100vh - 480rpx);
  padding: 0 24rpx;
}

/* 商品网格 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 20rpx 8rpx 40rpx;
}

/* 商城商品卡片 - 高级卡片设计 */
.store-product-card {
  background: #FFFFFF;
  border-radius: 28rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  animation: fadeInUp 0.4s ease-out forwards;
  opacity: 0;
  display: flex;
  flex-direction: column;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  }
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 85%; /* 略矮的比例更精致 */
  overflow: hidden;
  background: #F9FAFB;
  flex-shrink: 0;
}

.product-image-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.bg-food { background: linear-gradient(150deg, #FFF7ED 0%, #FFEDD5 100%); }
  &.bg-toy { background: linear-gradient(150deg, #ECFDF5 0%, #D1FAE5 100%); }
  &.bg-supply { background: linear-gradient(150deg, #EFF6FF 0%, #DBEAFE 100%); }
  &.bg-wash { background: linear-gradient(150deg, #F5F3FF 0%, #EDE9FE 100%); }
  &.bg-default { background: linear-gradient(150deg, #F8FAFC 0%, #F1F5F9 100%); }
}

.product-emoji {
  font-size: 88rpx;
  filter: drop-shadow(0 8rpx 12rpx rgba(0,0,0,0.08));
}

.stock-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  left: auto;
  padding: 6rpx 14rpx;
  border-radius: 100rpx;
  backdrop-filter: blur(8px);
  z-index: 10;
  
  text {
    font-size: 18rpx;
    font-weight: 700;
  }
  
  &.low {
    background: rgba(255, 251, 235, 0.95);
    border: 1rpx solid #FCD34D;
    text { color: #B45309; }
  }
  
  &.out {
    background: rgba(0, 0, 0, 0.65);
    text { color: #FFFFFF; }
  }
}

.product-info {
  padding: 20rpx;
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
  font-size: 26rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 16rpx;
  line-height: 1.35;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.price-section {
  display: flex;
  align-items: baseline;
  color: #DC2626;
}

.price-label {
  font-size: 22rpx;
  font-weight: 700;
  margin-right: 2rpx;
}

.price-value {
  font-size: 36rpx;
  font-weight: 800;
  font-family: 'DIN Alternate', -apple-system, sans-serif;
  letter-spacing: -1rpx;
}

.price-decimal {
  font-size: 22rpx;
  font-weight: 700;
}

.action-btn {
  width: 60rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 16rpx rgba(255, 165, 0, 0.35);
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.92);
    box-shadow: 0 3rpx 8rpx rgba(255, 165, 0, 0.25);
  }
}

.cart-icon {
  font-size: 28rpx;
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
    color: #94A3B8;
  }
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #E2E8F0;
  border-top-color: #FFB300;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.divider-line {
  width: 60rpx;
  height: 2rpx;
  background: #E2E8F0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}

.empty-illustration {
  width: 180rpx;
  height: 180rpx;
  background: #F8FAFC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  border: 2rpx dashed #E2E8F0;
  
  text {
    font-size: 80rpx;
    opacity: 0.5;
  }
}

.empty-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #94A3B8;
}

.safe-area-bottom {
  height: 180rpx;
}
</style>
