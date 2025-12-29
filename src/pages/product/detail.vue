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
        <view v-if="product.category" class="badge" :class="getCategoryTagClass(product.category)">{{ product.category }}</view>
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
        <view class="title-row">
            <text class="product-name">{{ product?.name || '加载中...' }}</text>
            <view v-if="product && isNewProduct(product.created_at)" class="new-tag">
                <text>新品</text>
            </view>
        </view>
      </view>

      <!-- 商品参数信息 -->
      <view class="params-section" v-if="product">
        <view class="param-row">
            <text class="param-label">商品编号</text>
            <text class="param-value">#{{ String(product.id).padStart(6, '0') }}</text>
        </view>
        <view class="param-row">
            <text class="param-label">所属分类</text>
            <view class="category-mini-tag" :class="getCategoryTagClass(product.category)">
                <text class="tag-icon">{{ getProductIcon(product.category) }}</text>
                <text>{{ product.category }}</text>
            </view>
        </view>
        <view class="param-row">
            <text class="param-label">上架时间</text>
            <text class="param-value">{{ formatDate(product.created_at) }}</text>
        </view>
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
 * 格式化价格
 */
const formatPrice = (price: number | string): [string, string] => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  const str = numPrice.toFixed(2)
  const [int, dec] = str.split('.')
  return [int, dec]
}

/**
 * 格式化日期
 */
const formatDate = (dateStr: string): string => {
    if(!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

/**
 * 购买商品
 */
const handleBuy = async () => {
  if (!product.value) return
  if (product.value.stock <= 0) return
  if (!userStore.checkAuth()) return

  loading.value = true
  
  try {
    // 1. 创建订单
    const { createOrder } = await import('@/api/order')
    
    const order = await createOrder({
      items: [{
        product_id: product.value.id,
        quantity: quantity.value
      }]
    })
    
    uni.showToast({
      title: '订单创建成功',
      icon: 'success',
      duration: 1500
    })
    
    // 2. 跳转到统一支付页面
    setTimeout(() => {
      uni.navigateTo({
        url: `/pages/payment/options?amount=${order.total_amount}&subject=${encodeURIComponent(product.value!.name + ' x' + quantity.value)}&related_id=${order.id}&related_type=order`
      })
    }, 1500)
    
  } catch (error: any) {
    console.error('创建订单失败:', error)
    uni.showToast({
      title: error.message || '创建订单失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.product-detail-container {
  min-height: 100vh;
  background: #F8F9FA;
  padding-bottom: 200rpx;
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
  padding: 20rpx 32rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 20rpx);
  transition: all 0.3s;
  
  &.glass {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.02);
  }
}

.back-btn {
  width: 72rpx;
  height: 72rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  
  text {
    font-size: 40rpx;
    color: #1F2937;
    line-height: 1;
    margin-right: 4rpx;
  }
  
  &:active {
    transform: scale(0.95);
    background: #FFFFFF;
  }
}

.placeholder-btn {
  width: 72rpx;
  height: 72rpx;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1F2937;
  opacity: 0.9;
}

/* 商品展示区 - 高级黄主题 */
.product-showcase {
  position: relative;
  height: 560rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 120rpx);
  overflow: hidden;
  background: radial-gradient(circle at center, #FFFFFF 0%, #FFF8E1 100%); /* 淡金背景 */
}

/* 移除旧的彩虹背景 */
/*.product-showcase.bg-food,
.product-showcase.bg-toy,
.product-showcase.bg-supply,
.product-showcase.bg-wash,
.product-showcase.bg-cloth,
.product-showcase.bg-medicine,
.product-showcase.bg-default {
  background: radial-gradient(circle at center, #FFFFFF 0%, #FFF8E1 100%);
}*/

/* 分类微彩背景 (Detail Page) - 颜色更明显 */
.product-showcase.bg-food-subtle { background: radial-gradient(circle at center, #FFFFFF 0%, #FFEDD5 100%); }
.product-showcase.bg-toy-subtle { background: radial-gradient(circle at center, #FFFFFF 0%, #D1FAE5 100%); }
.product-showcase.bg-supply-subtle { background: radial-gradient(circle at center, #FFFFFF 0%, #DBEAFE 100%); }
.product-showcase.bg-wash-subtle { background: radial-gradient(circle at center, #FFFFFF 0%, #E0E7FF 100%); }
.product-showcase.bg-cloth-subtle { background: radial-gradient(circle at center, #FFFFFF 0%, #FAE8FF 100%); }
.product-showcase.bg-medicine-subtle { background: radial-gradient(circle at center, #FFFFFF 0%, #FFE4E6 100%); }
.product-showcase.bg-default-subtle { background: radial-gradient(circle at center, #FFFFFF 0%, #FFFBEB 100%); }


.showcase-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco-ring {
  position: absolute;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 193, 7, 0.05); /* 淡金环 */
  
  &.deco-1 {
    width: 500rpx;
    height: 500rpx;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -40%);
  }
  
  &.deco-2 {
    width: 360rpx;
    height: 360rpx;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -40%);
    border-color: rgba(255, 193, 7, 0.1);
  }
}

.emoji-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  transform: translateY(-40rpx);
}

.product-emoji {
  font-size: 220rpx;
  filter: drop-shadow(0 20rpx 40rpx rgba(0, 0, 0, 0.12));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-20rpx); }
  100% { transform: translateY(0); }
}

.product-badges {
  position: absolute;
  top: calc(var(--status-bar-height, 44px) + 140rpx);
  left: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.badge {
  padding: 10rpx 20rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  align-self: flex-start;
  
  &.badge-low {
    background: rgba(255, 255, 255, 0.95);
    border: 1rpx solid #FFC107;
    color: #D97706;
  }
  
  &.badge-out {
    background: rgba(31, 41, 55, 0.85);
    color: #FFFFFF;
  }
  
  &.badge-category {
    background: rgba(255, 255, 255, 0.9);
    color: #4B5563;
    border: 1rpx solid rgba(0,0,0,0.05);
  }
}

/* 信息卡片 */
.info-card {
  margin: -60rpx 32rpx 32rpx;
  background: #FFFFFF;
  border-radius: 40rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 20rpx 60rpx rgba(139, 92, 246, 0.05); /* 更一致的淡紫色阴影 */
  position: relative;
  z-index: 10;
  border: 2rpx solid #F8FAFC;
}

.price-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.price-main {
  display: flex;
  align-items: baseline;
  color: #1F2937;
}

.price-symbol {
  font-size: 32rpx;
  font-weight: 700;
  margin-right: 4rpx;
}

.price-integer {
  font-size: 64rpx;
  font-weight: 800;
  font-family: 'DIN Alternate', sans-serif;
  line-height: 1;
  letter-spacing: -2rpx;
}

.price-decimal {
  font-size: 32rpx;
  font-weight: 700;
}

.stock-info {
  background: #F3F4F6;
  padding: 8rpx 20rpx;
  border-radius: 100rpx;
  
  text {
    font-size: 24rpx;
    color: #6B7280;
    font-weight: 500;
  }
}

.title-section {
  margin-bottom: 0;
}

.product-name {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #1F2937;
  line-height: 1.3;
  letter-spacing: -0.5rpx;
}

/* 规格卡片 */
.spec-card {
  margin: 0 32rpx 32rpx;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);
}

.spec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.spec-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
}

.quantity-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: #F8FAFC;
  border-radius: 20rpx; /* 更方一点 */
  padding: 8rpx;
  width: fit-content;
}

.qty-btn {
  width: 80rpx;
  height: 80rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
  
  text {
    font-size: 40rpx;
    font-weight: 400;
    color: #1F2937;
    line-height: 1;
  }
  
  &.disabled {
    opacity: 0.5;
    background: transparent;
    box-shadow: none;
    color: #9CA3AF;
  }
  
  &:active:not(.disabled) {
    transform: scale(0.95);
    background: #FFC107;
  }
}

.qty-display {
  width: 120rpx;
  text-align: center;
  
  text {
    font-size: 40rpx;
    font-weight: 700;
    color: #1F2937;
    font-family: 'DIN Alternate', sans-serif;
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
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  z-index: 100;
  
  &.glass {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border-top: 1rpx solid rgba(0,0,0,0.05);
    box-shadow: 0 -10rpx 40rpx rgba(0,0,0,0.05);
  }
}

.action-left {
  display: flex;
  gap: 32rpx;
  margin-right: 32rpx;
}

.action-icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  width: 88rpx;
  
  text:first-child {
    font-size: 44rpx;
    margin-bottom: 2rpx;
  }
  
  &:active {
    transform: scale(0.9);
    opacity: 0.7;
  }
}

.icon-label {
  font-size: 20rpx !important;
  color: #6B7280;
  font-weight: 500;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.new-tag {
    background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
    padding: 2rpx 10rpx;
    border-radius: 6rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36rpx;
    
    text {
        font-size: 20rpx;
        color: #FFFFFF;
        font-weight: 700;
        line-height: 1;
    }
}

.params-section {
    margin-top: 32rpx;
    padding-top: 24rpx;
    border-top: 2rpx dashed #F3F4F6;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.param-row {
    display: flex;
    align-items: center;
}

.param-label {
    font-size: 26rpx;
    color: #9CA3AF;
    width: 140rpx;
}

.param-value {
    font-size: 26rpx;
    color: #4B5563;
    font-weight: 500;
    font-family: 'DIN Alternate', -apple-system, sans-serif;
}

.category-mini-tag {
    padding: 6rpx 16rpx;
    border-radius: 100rpx;
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    
    .tag-icon {
        font-size: 24rpx;
        line-height: 1;
    }
    
    text {
        font-size: 22rpx;
        font-weight: 600;
    }
    
    &.tag-food { background: #FFF7ED; text { color: #EA580C; } }
    &.tag-toy { background: #ECFDF5; text { color: #059669; } }
    &.tag-supply { background: #EFF6FF; text { color: #2563EB; } }
    &.tag-wash { background: #F5F3FF; text { color: #7C3AED; } }
    &.tag-cloth { background: #FDF4FF; text { color: #C026D3; } }
    &.tag-medicine { background: #FEF2F2; text { color: #DC2626; } }
    &.tag-default { background: #F3F4F6; text { color: #4B5563; } }
}

.badge {
  padding: 10rpx 20rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  align-self: flex-start;
  
  &.badge-low {
    background: rgba(255, 255, 255, 0.95);
    border: 1rpx solid #FFC107;
    color: #D97706;
  }
  
  &.badge-out {
    background: rgba(31, 41, 55, 0.85);
    color: #FFFFFF;
  }
  
  &.tag-food { background: #FFF7ED; color: #EA580C; border: 1rpx solid rgba(234, 88, 12, 0.1); }
  &.tag-toy { background: #ECFDF5; color: #059669; border: 1rpx solid rgba(5, 150, 105, 0.1); }
  &.tag-supply { background: #EFF6FF; color: #2563EB; border: 1rpx solid rgba(37, 99, 235, 0.1); }
  &.tag-wash { background: #F5F3FF; color: #7C3AED; border: 1rpx solid rgba(124, 58, 237, 0.1); }
  &.tag-cloth { background: #FDF4FF; color: #C026D3; border: 1rpx solid rgba(192, 38, 211, 0.1); }
  &.tag-medicine { background: #FEF2F2; color: #DC2626; border: 1rpx solid rgba(220, 38, 38, 0.1); }
  &.tag-default { background: #F3F4F6; color: #4B5563; }
}

.action-right {
  flex: 1;
}

.buy-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 28rpx;
  font-size: 32rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFC107 0%, #FFB300 100%); /* 纯金渐变 */
  box-shadow: 0 10rpx 24rpx rgba(255, 179, 0, 0.3);
  letter-spacing: 2rpx;
  transition: all 0.3s;
  
  text {
    color: #1F2937;
  }
  
  &::after { border: none; }
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(255, 179, 0, 0.2);
  }
  
  &[disabled] {
    background: #E5E7EB;
    box-shadow: none;
    
    text {
      color: #9CA3AF;
    }
  }
}
</style>
