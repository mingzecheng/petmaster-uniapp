<template>
  <view class="product-list-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <text class="search-icon">🔍</text>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索商品"
          class="search-input"
          @confirm="handleSearch"
        />
      </view>
    </view>

    <!-- 分类筛选 -->
    <scroll-view class="category-scroll" scroll-x>
      <view class="category-wrapper">
        <view 
          v-for="cat in categories" 
          :key="cat.value"
          :class="['category-item', { active: currentCategory === cat.value }]"
          @click="selectCategory(cat.value)"
        >
          <text>{{ cat.label }}</text>
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
          v-for="product in products" 
          :key="product.id" 
          class="product-card"
          @click="goToDetail(product.id)"
        >
          <view class="product-image">
            <text class="product-emoji">{{ getProductIcon(product.category) }}</text>
          </view>
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-desc">{{ product.description || '暂无描述' }}</text>
            <view class="product-bottom">
              <text class="product-price">¥{{ product.price }}</text>
              <view class="buy-btn" @click.stop="handleBuy(product)">
                <text>购买</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-tip">
        <text>加载中...</text>
      </view>
      <view v-else-if="noMore" class="loading-tip">
        <text>没有更多了~</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && products.length === 0" class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无商品</text>
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

/** 分类列表 */
const categories = [
  { label: '全部', value: '' },
  { label: '食品', value: '食品' },
  { label: '玩具', value: '玩具' },
  { label: '用品', value: '用品' },
  { label: '服饰', value: '服饰' },
  { label: '药品', value: '药品' }
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

  uni.showModal({
    title: '确认购买',
    content: `确定要购买 ${product.name} 吗？价格：¥${product.price}`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '创建订单...' })
          
          const paymentRes = await createAlipayPayment({
            amount: product.price,
            subject: product.name,
            description: product.description,
            related_id: product.id,
            related_type: 'product'
          })

          uni.hideLoading()

          if (paymentRes.pay_url) {
            // H5环境跳转支付
            // #ifdef H5
            window.open(paymentRes.pay_url, '_blank')
            // #endif
            
            // 小程序环境提示
            // #ifdef MP
            uni.showModal({
              title: '请完成支付',
              content: '请在浏览器中完成支付',
              showCancel: false
            })
            // #endif
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
    '服饰': '👕',
    '药品': '💊'
  }
  return icons[category || ''] || '📦'
}
</script>

<style lang="scss">
.product-list-container {
  min-height: 100vh;
  background: #FFFDE7;
}

/* 搜索栏 */
.search-bar {
  padding: 20rpx 30rpx;
  background: #fff;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-radius: 40rpx;
  padding: 16rpx 24rpx;
}

.search-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #212121;
}

/* 分类筛选 */
.category-scroll {
  background: #fff;
  padding: 20rpx 0;
  white-space: nowrap;
  border-bottom: 1rpx solid #F5F5F5;
}

.category-wrapper {
  display: inline-flex;
  padding: 0 30rpx;
  gap: 20rpx;
}

.category-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14rpx 32rpx;
  background: #F5F5F5;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #757575;
  
  &.active {
    background: linear-gradient(135deg, #FFD600, #FFAB00);
    color: #212121;
    font-weight: 600;
  }
}

/* 商品滚动区 */
.product-scroll {
  height: calc(100vh - 220rpx);
  padding: 20rpx 30rpx;
}

/* 商品网格 */
.products-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.product-card {
  width: calc(50% - 10rpx);
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.product-image {
  height: 220rpx;
  background: linear-gradient(135deg, #FFF9C4, #FFFDE7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-emoji {
  font-size: 80rpx;
}

.product-info {
  padding: 20rpx;
}

.product-name {
  display: block;
  font-size: 28rpx;
  color: #212121;
  font-weight: 600;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  display: block;
  font-size: 24rpx;
  color: #BDBDBD;
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
  font-size: 32rpx;
  color: #FF6D00;
  font-weight: 700;
}

.buy-btn {
  background: linear-gradient(135deg, #FFD600, #FFAB00);
  padding: 10rpx 24rpx;
  border-radius: 20rpx;
  
  text {
    font-size: 24rpx;
    color: #212121;
    font-weight: 600;
  }
}

/* 加载提示 */
.loading-tip {
  text-align: center;
  padding: 30rpx;
  
  text {
    font-size: 26rpx;
    color: #BDBDBD;
  }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-icon {
  display: block;
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #BDBDBD;
}

.safe-area-bottom {
  height: 120rpx;
}
</style>
