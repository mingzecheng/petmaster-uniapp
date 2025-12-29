<template>
  <view class="appointment-list-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">预约记录</text>
      <view class="header-placeholder"></view>
    </view>

    <view class="content-area">
      <!-- 状态筛选 - 可滚动 -->
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

      <!-- 预约列表 -->
      <scroll-view 
        class="appointment-scroll" 
        scroll-y 
        :refresher-enabled="true"
        :refresher-triggered="isRefreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
      >
        <view v-if="appointments.length > 0" class="appointments-list">
          <view 
            v-for="appointment in appointments" 
            :key="appointment.id" 
            class="appointment-card"
          >
            <view class="card-header">
              <view class="service-info">
                <text class="service-icon">{{ getServiceIcon(appointment.service?.name) }}</text>
                <text class="service-name">{{ appointment.service?.name || '服务' }}</text>
              </view>
              <view :class="['status-badge', appointment.status]">
                <view class="status-dot"></view>
                <text>{{ getStatusText(appointment.status) }}</text>
              </view>
            </view>
            <view class="card-body">
              <view class="info-row">
                <text class="info-label">宠物</text>
                <view class="pet-info-box">
                  <image 
                    :src="getPetAvatar(appointment.pet?.image_url, appointment.pet?.species)" 
                    class="pet-mini-avatar"
                    mode="aspectFill"
                  />
                  <text class="info-text">{{ appointment.pet?.name || '未知宠物' }}</text>
                </view>
              </view>
              <view class="info-row">
                <text class="info-label">时间</text>
                <text class="info-text highlight">{{ formatTime(appointment.appointment_time) }}</text>
              </view>
              <view v-if="appointment.notes" class="info-row notes">
                <text class="info-label">备注</text>
                <text class="info-text">{{ appointment.notes }}</text>
              </view>
            </view>
            <view v-if="appointment.status === 'pending'" class="card-footer">
              <button class="cancel-btn" @click="handleCancel(appointment.id)">
                取消预约
              </button>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else-if="!loading" class="empty-state">
          <view class="empty-icon-box">
            <text>📅</text>
          </view>
          <text class="empty-title">暂无预约记录</text>
          <text class="empty-desc">您还没有预约过服务，快去体验一下吧</text>
          <button class="empty-btn" @click="goToCreate">立即预约</button>
        </view>

        <!-- 加载中 -->
        <view v-if="loading && !isRefreshing" class="loading-box">
          <view class="loading-spinner"></view>
          <text>加载中...</text>
        </view>
      </scroll-view>
    </view>

    <!-- 新建预约按钮 -->
    <view class="bottom-bar glass">
      <button class="fab-btn" @click="goToCreate">
        <text class="fab-icon">+</text>
        <text>新建预约</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getAppointments, cancelAppointment, type Appointment, type AppointmentStatus } from '@/api/appointment'
import { getPets, type Pet } from '@/api/pet'
import { getServices, type Service } from '@/api/service'
import { useUserStore } from '@/stores/user'
import { getPetAvatar } from '@/utils/pet'

/** 状态筛选标签 */
const statusTabs = [
  { label: '全部', value: '' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

/** 当前状态 */
const currentStatus = ref('')

/** 所有预约列表（原始数据） */
const allAppointments = ref<Appointment[]>([])

/** 筛选后的预约列表 */
const appointments = computed(() => {
  if (!currentStatus.value) {
    return allAppointments.value
  }
  return allAppointments.value.filter(item => item.status === currentStatus.value)
})

/** 加载状态 */
const loading = ref(false)

/** 刷新状态 */
const isRefreshing = ref(false)

/**
 * 返回
 */
const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    // 导航栈有多个页面,可以正常返回
    uni.navigateBack()
  } else {
    // 导航栈只有一个页面,返回到"我的"页面
    uni.switchTab({ url: '/pages/mine/index' })
  }
}

/**
 * 初始化
 */
onMounted(() => {
  loadAppointments()
})

/**
 * 加载预约列表
 */
const loadAppointments = async () => {
  if (!isRefreshing.value) {
    loading.value = true
  }
  try {
    // 并行获取预约列表、宠物列表和服务列表以手动补全信息
    const [appointmentsData, petsData, servicesData] = await Promise.all([
      getAppointments({}),
      getPets(),
      getServices()
    ])

    // 创建映射以便快速查找
    const petMap = new Map((petsData as Pet[]).map(p => [p.id, p]))
    const serviceMap = new Map((servicesData as unknown as Service[]).map(s => [s.id, s]))

    // 手动填充关联信息
    const enrichedData = (appointmentsData as Appointment[]).map(appt => {
      // 优先使用后端返回的，如果没有则使用 ID 匹配
      const pet = appt.pet || petMap.get(appt.pet_id)
      const service = appt.service || serviceMap.get(appt.service_id)

      return {
        ...appt,
        pet: pet ? {
          id: pet.id,
          name: pet.name,
          species: pet.species,
          image_url: pet.image_url
        } : undefined,
        service: service ? {
          id: service.id,
          name: service.name,
          price: service.price
        } : undefined
      }
    })

    // 按时间倒序排列
    const sortedData = enrichedData.sort((a, b) => {
      return new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime()
    })
    allAppointments.value = sortedData as Appointment[]
  } catch (error) {
    console.error('加载预约失败:', error)
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
  loadAppointments()
}

/**
 * 选择状态（本地筛选，无需重新请求）
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
const getStatusText = (status: AppointmentStatus): string => {
  const statusMap: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

/**
 * 格式化时间
 */
const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr)
  // 格式化为：MM月DD日 HH:mm
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}

/**
 * 获取服务图标
 */
const getServiceIcon = (name: string = ''): string => {
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
 * 取消预约
 */
const handleCancel = (id: number) => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个预约吗？',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中' })
        try {
          await cancelAppointment(id)
          uni.showToast({ title: '已取消', icon: 'success' })
          loadAppointments()
        } catch (error) {
          console.error('取消预约失败:', error)
          uni.showToast({ title: '取消失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

/**
 * 跳转创建预约
 */
const goToCreate = () => {
  uni.navigateTo({ url: '/pages/appointment/create' })
}
</script>

<style lang="scss">
.appointment-list-container {
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
  padding-top: calc(var(--status-bar-height, 44px) + 140rpx);
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
    background: #FFFBEB;
    border-color: #FFBF00;
    color: #B45309;
    font-weight: 600;
    box-shadow: 0 4rpx 12rpx rgba(251, 191, 36, 0.15);
  }
}

/* 预约列表 */
.appointment-scroll {
  height: calc(100vh - 360rpx);
  padding: 20rpx 0;
}

.appointments-list {
  padding: 0 32rpx;
  padding-bottom: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.appointment-card {
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

.service-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.service-icon {
  font-size: 36rpx;
}

.service-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
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
  &.confirmed { 
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
  min-width: 60rpx;
}

.info-text {
  flex: 1;
  font-size: 28rpx;
  color: #4B5563;
  line-height: 1.4;
  
  &.highlight {
    color: #1F2937;
    font-weight: 500;
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
  background: #F3F4F6;
  border-radius: 100rpx;
  font-size: 28rpx;
  color: #4B5563;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  
  &::after { border: none; }
  
  &:active {
    background: #E5E7EB;
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
  border-top-color: #FF8F00;
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

.pet-info-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.pet-mini-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #F3F4F6;
}
</style>
