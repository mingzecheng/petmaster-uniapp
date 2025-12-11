<template>
  <view class="boarding-list-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">寄养记录</text>
      <view class="header-placeholder"></view>
    </view>

    <view class="content-area">
      <!-- 状态筛选 -->
      <view class="filter-tabs">
        <view 
          v-for="tab in statusTabs" 
          :key="tab.value"
          :class="['tab-item', { active: currentStatus === tab.value }]"
          @click="selectStatus(tab.value)"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>

      <!-- 寄养列表 -->
      <scroll-view 
        class="boarding-scroll" 
        scroll-y 
        :refresher-enabled="true"
        :refresher-triggered="isRefreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
      >
        <view v-if="boardings.length > 0" class="boardings-list">
          <view 
            v-for="boarding in boardings" 
            :key="boarding.id" 
            class="boarding-card"
            @click="goToDetail(boarding.id)"
          >
            <view class="card-header">
              <view class="boarding-info">
                <image 
                  :src="getPetAvatar(boarding.pet?.image_url, boarding.pet?.species)" 
                  class="pet-avatar-img"
                  mode="aspectFill"
                />
                <view class="pet-details">
                  <text class="pet-name">{{ boarding.pet?.name || '未知宠物' }}</text>
                  <text class="pet-species">{{ boarding.pet?.species || '宠物' }}</text>
                </view>
              </view>
              <view :class="['status-badge', boarding.status]">
                <view class="status-dot"></view>
                <text>{{ getStatusText(boarding.status) }}</text>
              </view>
            </view>
            
            <view class="card-body">
              <view class="info-row">
                <text class="info-label">寄养时间</text>
                <text class="info-text">{{ formatDateRange(boarding.start_date, boarding.end_date) }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">寄养天数</text>
                <text class="info-text">{{ calculateDays(boarding.start_date, boarding.end_date) }} 天</text>
              </view>
              <view class="info-row">
                <text class="info-label">总费用</text>
                <text class="info-text price">¥{{ formatAmount(boarding.total_cost) }}</text>
              </view>
              <view v-if="boarding.notes" class="info-row notes">
                <text class="info-label">备注</text>
                <text class="info-text">{{ boarding.notes }}</text>
              </view>
            </view>
            
            <view v-if="boarding.status === 'pending'" class="card-footer">
              <button class="cancel-btn" @click.stop="handleCancel(boarding.id)">
                取消寄养
              </button>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else-if="!loading" class="empty-state">
          <view class="empty-icon-box">
            <text>🏠</text>
          </view>
          <text class="empty-title">暂无寄养记录</text>
          <text class="empty-desc">您还没有寄养过宠物，快来体验一下吧</text>
          <button class="empty-btn" @click="goToCreate">申请寄养</button>
        </view>

        <!-- 加载中 -->
        <view v-if="loading && !isRefreshing" class="loading-box">
          <view class="loading-spinner"></view>
          <text>加载中...</text>
        </view>
      </scroll-view>
    </view>

    <!-- 新建寄养按钮 -->
    <view class="bottom-bar glass">
      <button class="fab-btn" @click="goToCreate">
        <text class="fab-icon">+</text>
        <text>新建寄养</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getBoardings, cancelBoarding, type Boarding, type BoardingStatus } from '@/api/boarding'
import { getPets, type Pet } from '@/api/pet'
import { useUserStore } from '@/stores/user'
import { getPetAvatar } from '@/utils/pet'

/** 状态筛选标签 */
const statusTabs = [
  { label: '全部', value: '' },
  { label: '待确认', value: 'pending' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

/** 当前状态 */
const currentStatus = ref('')

/** 所有寄养列表 */
const allBoardings = ref<Boarding[]>([])

/** 筛选后的寄养列表 */
const boardings = computed(() => {
  if (!currentStatus.value) {
    return allBoardings.value
  }
  return allBoardings.value.filter(item => item.status === currentStatus.value)
})

/** 加载状态 */
const loading = ref(false)

/** 刷新状态 */
const isRefreshing = ref(false)

/** 用户Store */
const userStore = useUserStore()

/**
 * 返回
 */
const goBack = () => {
  uni.navigateBack()
}

/**
 * 初始化
 */
onMounted(() => {
  loadBoardings()
})

/**
 * 加载寄养列表
 */
const loadBoardings = async () => {
  if (!isRefreshing.value) {
    loading.value = true
  }
  try {
    // 并行获取寄养列表和宠物列表
    const [boardingsData, petsData] = await Promise.all([
      getBoardings({}),
      getPets()
    ])

    // 创建宠物映射
    const petMap = new Map(petsData.map((p: Pet) => [p.id, p]))

    // 填充数据
    const enrichedData = boardingsData.map(boarding => {
      const pet = boarding.pet || petMap.get(boarding.pet_id)
      
      return {
        ...boarding,
        pet: pet ? {
          id: pet.id,
          name: pet.name,
          species: pet.species,
          image_url: pet.image_url
        } : undefined
      }
    }) as Boarding[]

    // 按创建时间倒序排列
    const sortedData = enrichedData.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    allBoardings.value = sortedData
  } catch (error) {
    console.error('加载寄养列表失败:', error)
    if (!isRefreshing.value) {
      uni.showToast({ title: '加载失败', icon: 'none' })
    }
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}

/**
 * 下拉刷新
 */
const onRefresh = () => {
  isRefreshing.value = true
  loadBoardings()
}

/**
 * 选择状态
 */
const selectStatus = (status: string) => {
  currentStatus.value = status
}

/**
 * 加载更多
 */
const loadMore = () => {
  // 暂不分页
}

/**
 * 获取状态文本
 */
const getStatusText = (status: BoardingStatus): string => {
  const statusMap: Record<string, string> = {
    pending: '待确认',
    active: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

/**
 * 格式化日期范围
 */
const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
}

/**
 * 计算天数
 */
const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * 格式化金额
 */
const formatAmount = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toFixed(2)
}

/**
 * 跳转详情
 */
const goToDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/boarding/detail?id=${id}` })
}

/**
 * 取消寄养
 */
const handleCancel = (id: number) => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个寄养吗？',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中' })
        try {
          await cancelBoarding(id)
          uni.showToast({ title: '已取消', icon: 'success' })
          loadBoardings()
        } catch (error) {
          console.error('取消寄养失败:', error)
          uni.showToast({ title: '取消失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

/**
 * 跳转创建寄养
 */
const goToCreate = () => {
  if (!userStore.checkAuth()) return
  uni.navigateTo({ url: '/pages/boarding/create' })
}
</script>

<style lang="scss">
.boarding-list-container {
  min-height: 100vh;
  background: #FAFAFA;
  padding-bottom: 160rpx;
}

/* 顶部导航 */
.sub-header {
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
  
  &.glass {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
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
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  
  text {
    font-size: 48rpx;
    color: #374151;
    line-height: 1;
  }
}

.header-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1F2937;
}

.header-placeholder {
  width: 72rpx;
}

/* 内容区域 */
.content-area {
  padding-top: calc(var(--status-bar-height, 44px) + 100rpx);
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  padding: 20rpx 32rpx;
  gap: 16rpx;
  overflow-x: auto;
  white-space: nowrap;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-item {
  flex-shrink: 0;
  padding: 12rpx 32rpx;
  background: #FFFFFF;
  border-radius: 100rpx;
  font-size: 26rpx;
  color: #6B7280;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  border: 2rpx solid transparent;
  
  &.active {
    background: #FEF3C7;
    border-color: #FFBF00;
    color: #B45309;
    font-weight: 600;
    box-shadow: 0 4rpx 12rpx rgba(251, 191, 36, 0.15);
  }
}

/* 寄养列表 */
.boarding-scroll {
  height: calc(100vh - 360rpx);
  padding: 20rpx 0;
}

.boardings-list {
  padding: 0 32rpx;
  padding-bottom: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.boarding-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.03);
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.99);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx dashed #F3F4F6;
}

.boarding-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.pet-avatar-img {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: #F3F4F6;
}

.pet-details {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.pet-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
}

.pet-species {
  font-size: 24rpx;
  color: #9CA3AF;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 6rpx 16rpx;
  border-radius: 100rpx;
  
  .status-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
  }
  
  text {
    font-size: 24rpx;
    font-weight: 600;
  }
  
  &.pending { 
    background: #FEF3C7; 
    .status-dot { background: #D97706; }
    text { color: #D97706; } 
  }
  &.active { 
    background: #DBEAFE; 
    .status-dot { background: #2563EB; }
    text { color: #2563EB; } 
  }
  &.completed { 
    background: #D1FAE5; 
    .status-dot { background: #059669; }
    text { color: #059669; } 
  }
  &.cancelled { 
    background: #F3F4F6; 
    .status-dot { background: #9CA3AF; }
    text { color: #9CA3AF; } 
  }
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  
  &.notes {
    margin-top: 8rpx;
    padding: 16rpx;
    background: #F9FAFB;
    border-radius: 16rpx;
  }
}

.info-label {
  font-size: 26rpx;
  color: #9CA3AF;
  min-width: 120rpx;
}

.info-text {
  flex: 1;
  font-size: 28rpx;
  color: #4B5563;
  line-height: 1.4;
  
  &.price {
    color: #DC2626;
    font-weight: 600;
    font-size: 30rpx;
  }
}

.card-footer {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 2rpx solid #F3F4F6;
  display: flex;
  justify-content: flex-end;
}

.cancel-btn {
  height: 64rpx;
  padding: 0 32rpx;
  background: #FFFFFF;
  border: 2rpx solid #FECACA;
  border-radius: 100rpx;
  font-size: 26rpx;
  color: #EF4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all 0.2s;
  
  &::after { border: none; }
  
  &:active {
    background: #FEF2F2;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 120rpx;
}

.empty-icon-box {
  width: 160rpx;
  height: 160rpx;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.05);
  
  text {
    font-size: 72rpx;
    opacity: 0.6;
  }
}

.empty-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #9CA3AF;
  margin-bottom: 48rpx;
}

.empty-btn {
  padding: 0 48rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  border-radius: 100rpx;
  font-size: 28rpx;
  color: #1F2937;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  box-shadow: 0 8rpx 20rpx rgba(251, 191, 36, 0.3);
  
  &::after { border: none; }
  
  &:active {
    transform: scale(0.98);
  }
}

.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  gap: 16rpx;
  
  text {
    font-size: 26rpx;
    color: #9CA3AF;
  }
}

.loading-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 3rpx solid #E5E7EB;
  border-top-color: #F59E0B;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 底部按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  
  &.glass {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  }
}

.fab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  border-radius: 32rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
  box-shadow: 0 12rpx 32rpx rgba(251, 191, 36, 0.45);
  transition: all 0.2s;
  
  &::after { border: none; }
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 6rpx 16rpx rgba(251, 191, 36, 0.35);
  }
}

.fab-icon {
  font-size: 40rpx;
  font-weight: 300;
  margin-top: -4rpx;
}
</style>
