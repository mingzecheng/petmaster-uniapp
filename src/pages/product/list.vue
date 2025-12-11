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
      <view class="search-box glass">
        <text class="search-icon">🔍</text>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索您需要的商品..."
          placeholder-class="search-placeholder"
          class="search-input"
          @confirm="handleSearch"
        />
        <view v-if="searchKeyword" class="clear-btn" @click="clearSearch">
          <text>✕</text>
        </view>
        <view class="search-btn" @click="handleSearch">
          <text>搜索</text>
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
          class="product-card"
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
import { createAlipayPayment } from '@/api/payment'
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
 * 购买商品
 */
const handleBuy = async (product: Product) => {
  if (!userStore.checkAuth()) return

  // 确保价格是数字类型
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price

  uni.showModal({
    title: '确认购买',
    content: `确定要购买 ${product.name} 吗？价格：¥${price.toFixed(2)}`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '创建订单...' })
          
          const paymentRes = await createAlipayPayment({
            amount: price,
            subject: product.name,
            description: `购买商品：${product.name}`,
            related_id: product.id,
            related_type: 'product'
          })

          uni.hideLoading()

          if (paymentRes.pay_url) {
            const payUrl = encodeURIComponent(paymentRes.pay_url)
            const returnUrl = encodeURIComponent('/pages/product/list')
            
            uni.navigateTo({
              url: `/pages/payment/pay?payUrl=${payUrl}&outTradeNo=${paymentRes.out_trade_no}&amount=${price}&returnUrl=${returnUrl}`,
              fail: () => {
                // #ifdef H5
                window.open(paymentRes.pay_url, '_blank')
                // #endif
              }
            })
          }
        } catch (error) {
          uni.hideLoading()
          console.error('创建支付失败:', error)
        }
      }
    }
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
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.product-list-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
  /* 沉浸式头部 */
}  
.immersive-header {
  position: relative;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  padding: 20rpx 32rpx 48rpx;
  padding-top: calc(var(--status-bar-height, 20px) + 20rpx);
  border-radius: 0 0 48rpx 48rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(255, 179, 0, 0.25);
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
  width: 300rpx;
  height: 300rpx;
  top: -100rpx;
  right: -50rpx;
}

.c-2 {
  width: 200rpx;
  height: 200rpx;
  bottom: -40rpx;
  left: -40rpx;
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
}

.header-subtitle {
  font-size: 24rpx;
  color: rgba(31, 41, 55, 0.7);
  font-weight: 500;
}

/* 搜索框优化 */
.search-box {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  height: 88rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 0 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:active {
    transform: scale(0.99);
  }
}

.search-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #1E293B;
}

.clear-btn {
  width: 48rpx;
  height: 48rpx;
  background: #F1F5F9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 24rpx;
    color: #94A3B8;
  }
}

/* 分类筛选 */
.filter-scroll {
  white-space: nowrap;
  padding-bottom: 8rpx;
}

.filter-tabs {
  display: inline-flex;
  padding: 0 32rpx 20rpx;
  gap: 16rpx;
}

.tab-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #FFFFFF;
  border-radius: 28rpx;
  min-width: 100rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  border: 2rpx solid transparent;
  transition: all 0.25s;
  
  &.active {
    background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
    border-color: #FF8F00;
    box-shadow: 0 8rpx 24rpx rgba(251, 191, 36, 0.35);
    transform: scale(1.02);
    
    .tab-label {
      color: #1F2937;
      font-weight: 700;
    }
  }
}

.tab-icon {
  font-size: 32rpx;
  margin-bottom: 6rpx;
}

.tab-label {
  font-size: 24rpx;
  color: #64748B;
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
  gap: 24rpx;
  padding: 8rpx 8rpx 40rpx;
}

.product-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
  
  &:active {
    transform: scale(0.96);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  }
}

.product-image-wrapper {
  position: relative;
  height: 220rpx;
  overflow: hidden;
}

.product-image-bg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.bg-food { background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); }
  &.bg-toy { background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); }
  &.bg-supply { background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); }
  &.bg-wash { background: linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%); }
  &.bg-cloth { background: linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 100%); }
  &.bg-medicine { background: linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%); }
  &.bg-default { background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%); }
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-emoji {
  font-size: 80rpx;
  transition: transform 0.3s;
  
  .product-card:active & {
    transform: scale(1.1);
  }
}

.stock-badge {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  padding: 6rpx 14rpx;
  border-radius: 12rpx;
  
  text {
    font-size: 20rpx;
    font-weight: 600;
  }
  
  &.low {
    background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
    text { color: #FFFFFF; }
  }
  
  &.out {
    background: #6B7280;
    text { color: #FFFFFF; }
  }
}

.product-info {
  padding: 20rpx;
}

.product-name {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.product-desc {
  display: block;
  font-size: 22rpx;
  color: #94A3B8;
  margin-bottom: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-section {
  display: flex;
  align-items: baseline;
}

.price-label {
  font-size: 22rpx;
  font-weight: 700;
  color: #EF4444;
}

.price-value {
  font-size: 36rpx;
  font-weight: 800;
  color: #EF4444;
  font-family: 'DIN Alternate', sans-serif;
  line-height: 1;
}

.price-decimal {
  font-size: 22rpx;
  font-weight: 600;
  color: #EF4444;
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(30, 41, 59, 0.25);
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.9);
  }
}

.cart-icon {
  font-size: 28rpx;
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
  width: 36rpx;
  height: 36rpx;
  border: 4rpx solid #E2E8F0;
  border-top-color: #FBBF24;
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
  padding-top: 100rpx;
}

.empty-illustration {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  
  text {
    font-size: 72rpx;
    opacity: 0.6;
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
