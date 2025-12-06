<template>
  <view class="appointment-list-container">
    <!-- 状态筛选 -->
    <view class="status-tabs">
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
    <scroll-view class="appointment-scroll" scroll-y @scrolltolower="loadMore">
      <view v-if="appointments.length > 0" class="appointments-list">
        <view 
          v-for="appointment in appointments" 
          :key="appointment.id" 
          class="appointment-card"
        >
          <view class="card-header">
            <text class="service-name">{{ appointment.service?.name || '服务' }}</text>
            <text :class="['status-tag', appointment.status]">
              {{ getStatusText(appointment.status) }}
            </text>
          </view>
          <view class="card-body">
            <view class="info-row">
              <text class="info-icon">🐾</text>
              <text class="info-text">{{ appointment.pet?.name || '宠物' }}</text>
            </view>
            <view class="info-row">
              <text class="info-icon">🕐</text>
              <text class="info-text">{{ formatTime(appointment.appointment_time) }}</text>
            </view>
            <view v-if="appointment.notes" class="info-row">
              <text class="info-icon">📝</text>
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
        <text class="empty-icon">📅</text>
        <text class="empty-text">暂无预约记录</text>
        <button class="empty-btn" @click="goToCreate">
          立即预约
        </button>
      </view>

      <view v-if="loading" class="loading-tip">
        <text>加载中...</text>
      </view>
    </scroll-view>

    <!-- 新建预约按钮 -->
    <view class="fab-wrapper">
      <button class="fab-btn" @click="goToCreate">
        <text>+ 新建预约</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAppointments, cancelAppointment, type Appointment, type AppointmentStatus } from '@/api/appointment'

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

/** 预约列表 */
const appointments = ref<Appointment[]>([])

/** 加载状态 */
const loading = ref(false)

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
  loading.value = true
  try {
    const params: any = {}
    if (currentStatus.value) {
      params.status = currentStatus.value
    }
    const data = await getAppointments(params)
    appointments.value = data
  } catch (error) {
    console.error('加载预约失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 选择状态
 */
const selectStatus = (status: string) => {
  currentStatus.value = status
  loadAppointments()
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/**
 * 取消预约
 */
const handleCancel = (id: number) => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个预约吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await cancelAppointment(id)
          uni.showToast({ title: '取消成功', icon: 'success' })
          loadAppointments()
        } catch (error) {
          console.error('取消预约失败:', error)
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
  background: #FFFDE7;
}

/* 状态筛选 */
.status-tabs {
  display: flex;
  background: #fff;
  padding: 20rpx;
  gap: 16rpx;
  overflow-x: auto;
  white-space: nowrap;
}

.tab-item {
  flex-shrink: 0;
  padding: 16rpx 28rpx;
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

/* 预约滚动区 */
.appointment-scroll {
  height: calc(100vh - 120rpx);
  padding: 20rpx 30rpx;
  padding-bottom: 150rpx;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.appointment-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.service-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #212121;
}

.status-tag {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  
  &.pending {
    background: #FFF9C4;
    color: #FF6D00;
  }
  &.confirmed {
    background: #E3F2FD;
    color: #2979FF;
  }
  &.completed {
    background: #E8F5E9;
    color: #00C853;
  }
  &.cancelled {
    background: #FAFAFA;
    color: #BDBDBD;
  }
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.info-row {
  display: flex;
  align-items: center;
}

.info-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.info-text {
  font-size: 28rpx;
  color: #757575;
}

.card-footer {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F5F5F5;
  display: flex;
  justify-content: flex-end;
}

.cancel-btn {
  height: 64rpx;
  padding: 0 32rpx;
  background: #fff;
  border: 2rpx solid #FF1744;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #FF1744;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-icon {
  display: block;
  font-size: 100rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  color: #757575;
  margin-bottom: 30rpx;
}

.empty-btn {
  display: inline-block;
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #FFD600, #FFAB00);
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #212121;
  font-weight: 600;
}

.loading-tip {
  text-align: center;
  padding: 30rpx;
  
  text {
    font-size: 26rpx;
    color: #BDBDBD;
  }
}

/* 浮动按钮 */
.fab-wrapper {
  position: fixed;
  bottom: 40rpx;
  left: 30rpx;
  right: 30rpx;
  padding-bottom: env(safe-area-inset-bottom);
}

.fab-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #FFD600, #FFAB00);
  border: none;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #212121;
  box-shadow: 0 12rpx 30rpx rgba(255, 214, 0, 0.4);
}
</style>
