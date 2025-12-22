<template>
  <view class="product-detail-container">
    <!-- 顶部导航 -->
    <view class="nav-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="nav-title">商品详情</text>
      <view class="placeholder-btn"></view>
    </view>

    <!-- 商品展示区 -->
    <view class="product-showcase" :class="getCategoryBgClass(product?.category)">
      <view class="showcase-decoration">
        <view class="deco-ring deco-1"></view>
        <view class="deco-ring deco-2"></view>
      </view>
      <view class="emoji-container">
        <text class="product-emoji">{{ getProductIcon(product?.category) }}</text>
      </view>
      <!-- 标签 -->
      <view v-if="product" class="product-badges">
        <view v-if="product.stock <= 0" class="badge badge-out">已售罄</view>
        <view v-else-if="product.stock <= 5" class="badge badge-low">仅剩{{ product.stock }}件</view>
        <view v-if="product.category" class="badge badge-category">{{ product.category }}</view>
      </view>
    </view>

    <!-- 商品信息卡片 -->
    <view class="info-card">
      <!-- 价格区 -->
      <view class="price-section">
        <view class="price-main">
          <text class="price-symbol">¥</text>
          <text class="price-integer">{{ formatPrice(product?.price || 0)[0] }}</text>
          <text class="price-decimal">.{{ formatPrice(product?.price || 0)[1] }}</text>
        </view>
        <view class="stock-info">
          <text>库存 {{ product?.stock || 0 }} 件</text>
        </view>
      </view>

      <!-- 标题区 -->
      <view class="title-section">
        <text class="product-name">{{ product?.name || '加载中...' }}</text>
      </view>
    </view>

    <!-- 规格选择卡片 -->
    <view class="spec-card">
      <view class="spec-header">
        <text class="spec-title">购买数量</text>
      </view>
      <view class="quantity-selector">
        <view class="qty-btn" :class="{ disabled: quantity <= 1 }" @click="decreaseQty">
          <text>−</text>
        </view>
        <view class="qty-display">
          <text>{{ quantity }}</text>
        </view>
        <view class="qty-btn" :class="{ disabled: product && quantity >= product.stock }" @click="increaseQty">
          <text>+</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar glass">
      <view class="action-left">
        <view class="action-icon-btn" @click="goHome">
          <text>🏠</text>
          <text class="icon-label">首页</text>
        </view>
      </view>
      <view class="action-right">
        <button class="buy-btn" :loading="loading" :disabled="!product || (product.stock ?? 0) <= 0" @click="handleBuy">
          <text>{{ (product?.stock ?? 0) <= 0 ? '暂时缺货' : '立即购买' }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getProductDetail, type Product } from '@/api/product'
import { createAlipayPayment } from '@/api/payment'
import { useUserStore } from '@/stores/user'

/** 商品信息 */
const product = ref<Product | null>(null)

/** 购买数量 */
const quantity = ref(1)

/** 加载状态 */
const loading = ref(false)

/** 用户Store */
const userStore = useUserStore()

/**
 * 返回
 */
const goBack = () => {
  uni.navigateBack()
}

/**
 * 回首页
 */
const goHome = () => {
  uni.switchTab({ url: '/pages/index/index' })
}

/**
 * 初始化
 */
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  if (currentPage?.options?.id) {
    loadProduct(parseInt(currentPage.options.id))
  }
})

/**
 * 加载商品详情
 */
const loadProduct = async (id: number) => {
  try {
    const data = await getProductDetail(id)
    product.value = data
  } catch (error) {
    console.error('加载商品失败:', error)
    uni.showToast({ title: '商品不存在', icon: 'none' })
  }
}

/**
 * 增加数量
 */
const increaseQty = () => {
  if (product.value && quantity.value < product.value.stock) {
    quantity.value++
  }
}

/**
 * 减少数量
 */
const decreaseQty = () => {
  if (quantity.value > 1) {
    quantity.value--
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
 * 格式化价格
 */
const formatPrice = (price: number | string): [string, string] => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  const str = numPrice.toFixed(2)
  const [int, dec] = str.split('.')
  return [int, dec]
}

/**
 * 购买商品
 */
const handleBuy = async () => {
  if (!product.value) return
  if (product.value.stock <= 0) return
  if (!userStore.checkAuth()) return

  // 确保价格是数字类型
  const unitPrice = typeof product.value.price === 'string' ? parseFloat(product.value.price) : product.value.price
  const totalPrice = unitPrice * quantity.value

  // 跳转到结算页面
  const productIcon = getProductIcon(product.value.category)
  uni.navigateTo({
    url: `/pages/order/checkout?productId=${product.value.id}&productName=${encodeURIComponent(product.value.name)}&productIcon=${encodeURIComponent(productIcon)}&quantity=${quantity.value}&amount=${totalPrice.toFixed(2)}`
  })
}
</script>

<style lang="scss">
.product-detail-container {
  min-height: 100vh;
  background: #F1F5F9;
  padding-bottom: 180rpx;
}

/* 顶部导航 */
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 20rpx);
  
  &.glass {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
  }
}

.back-btn {
  width: 72rpx;
  height: 72rpx;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  
  text {
    font-size: 40rpx;
    color: #1E293B;
    line-height: 1;
  }
}

.placeholder-btn {
  width: 72rpx;
  height: 72rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1E293B;
}

/* 商品展示区 */
.product-showcase {
  position: relative;
  height: 480rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 100rpx);
  overflow: hidden;
  
  &.bg-food { background: linear-gradient(180deg, #FFF7ED 0%, #FFEDD5 100%); }
  &.bg-toy { background: linear-gradient(180deg, #ECFDF5 0%, #D1FAE5 100%); }
  &.bg-supply { background: linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%); }
  &.bg-wash { background: linear-gradient(180deg, #F0FDFA 0%, #CCFBF1 100%); }
  &.bg-cloth { background: linear-gradient(180deg, #FDF4FF 0%, #FAE8FF 100%); }
  &.bg-medicine { background: linear-gradient(180deg, #FFF1F2 0%, #FFE4E6 100%); }
  &.bg-default { background: linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%); }
}

.showcase-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco-ring {
  position: absolute;
  border-radius: 50%;
  border: 3rpx solid rgba(255, 255, 255, 0.5);
  
  &.deco-1 {
    width: 400rpx;
    height: 400rpx;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  &.deco-2 {
    width: 300rpx;
    height: 300rpx;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-color: rgba(255, 255, 255, 0.3);
  }
}

.emoji-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.product-image {
  width: 300rpx;
  height: 300rpx;
  border-radius: 24rpx;
}

.product-emoji {
  font-size: 180rpx;
  filter: drop-shadow(0 20rpx 40rpx rgba(0, 0, 0, 0.1));
}

.product-badges {
  position: absolute;
  top: calc(var(--status-bar-height, 44px) + 120rpx);
  left: 24rpx;
  display: flex;
  gap: 12rpx;
}

.badge {
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  font-weight: 600;
  
  &.badge-low {
    background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
    color: #FFFFFF;
  }
  
  &.badge-out {
    background: #6B7280;
    color: #FFFFFF;
  }
  
  &.badge-category {
    background: rgba(255, 255, 255, 0.9);
    color: #64748B;
  }
}

/* 信息卡片 */
.info-card {
  margin: -40rpx 24rpx 24rpx;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.08);
  position: relative;
}

.price-section {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #F1F5F9;
}

.price-main {
  display: flex;
  align-items: baseline;
  color: #EF4444;
}

.price-symbol {
  font-size: 28rpx;
  font-weight: 700;
}

.price-integer {
  font-size: 56rpx;
  font-weight: 800;
  font-family: 'DIN Alternate', sans-serif;
  line-height: 1;
}

.price-decimal {
  font-size: 28rpx;
  font-weight: 600;
}

.stock-info {
  text {
    font-size: 24rpx;
    color: #94A3B8;
  }
}

.title-section {
  margin-bottom: 24rpx;
}

.product-name {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  color: #1E293B;
  line-height: 1.4;
}

.desc-section {
  background: #F8FAFC;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
}

.desc-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.desc-icon {
  font-size: 24rpx;
}

.desc-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #1E293B;
}

.desc-content {
  font-size: 26rpx;
  color: #64748B;
  line-height: 1.7;
}

.service-tags {
  display: flex;
  gap: 16rpx;
}

.service-tag {
  display: flex;
  align-items: center;
  gap: 6rpx;
  
  .tag-icon {
    font-size: 22rpx;
    color: #10B981;
  }
  
  text {
    font-size: 24rpx;
    color: #64748B;
  }
}

/* 规格卡片 */
.spec-card {
  margin: 0 24rpx 24rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.spec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.spec-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1E293B;
}

.quantity-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  background: #F1F5F9;
  border-radius: 48rpx;
  padding: 8rpx;
  width: fit-content;
}

.qty-btn {
  width: 72rpx;
  height: 72rpx;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  
  text {
    font-size: 40rpx;
    font-weight: 300;
    color: #1E293B;
    line-height: 1;
  }
  
  &.disabled {
    opacity: 0.4;
  }
  
  &:active:not(.disabled) {
    background: #F1F5F9;
  }
}

.qty-display {
  width: 100rpx;
  text-align: center;
  
  text {
    font-size: 36rpx;
    font-weight: 700;
    color: #1E293B;
  }
}

/* 底部操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  
  &.glass {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-top: 2rpx solid #F1F5F9;
  }
}

.action-left {
  display: flex;
  gap: 24rpx;
}

.action-icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  
  text:first-child {
    font-size: 40rpx;
  }
}

.icon-label {
  font-size: 20rpx !important;
  color: #64748B;
}

.action-right {
  flex: 1;
  margin-left: 24rpx;
}

.buy-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  box-shadow: 0 8rpx 24rpx rgba(251, 191, 36, 0.4);
  
  text {
    color: #1F2937;
  }
  
  &::after { border: none; }
  
  &:active {
    transform: scale(0.98);
  }
  
  &[disabled] {
    background: #E2E8F0;
    box-shadow: none;
    
    text {
      color: #94A3B8;
    }
  }
}
</style>
