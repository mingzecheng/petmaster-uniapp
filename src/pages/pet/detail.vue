<template>
  <view class="pet-detail-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">宠物详情</text>
      <view class="header-placeholder"></view>
    </view>

    <!-- 宠物头部信息 -->
    <view class="pet-header-card">
      <view class="pet-avatar-large">
        <image :src="getPetAvatar(pet?.image_url, pet?.species)" class="pet-image" mode="aspectFill" />
      </view>
      <view class="pet-basic-info">
        <view class="name-row">
          <text class="pet-name">{{ pet?.name || '加载中...' }}</text>
          <view v-if="pet?.gender" class="pet-gender" :class="pet.gender">
            <text>{{ pet.gender === 'male' ? '♂' : '♀' }}</text>
          </view>
        </view>
        <text class="pet-breed">{{ pet?.species }} · {{ pet?.breed || '未知品种' }}</text>
        <view class="pet-meta-tags">
          <text v-if="pet?.birthday" class="meta-tag">🎂 {{ formatDate(pet.birthday) }}</text>
          <text v-if="pet?.weight" class="meta-tag">⚖️ {{ pet.weight }}kg</text>
        </view>
      </view>
    </view>

    <view class="content-area">
      <!-- 基本信息卡片 -->
      <view class="info-card">
        <view class="card-header">
          <text class="card-icon">📋</text>
          <text class="card-title">基本信息</text>
        </view>
        <view class="info-grid">
          <view class="info-item">
            <text class="info-label">生日</text>
            <text class="info-value">{{ pet?.birthday ? formatDate(pet.birthday) : '未知' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">体重</text>
            <text class="info-value">{{ pet?.weight ? pet.weight + 'kg' : '未知' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">添加时间</text>
            <text class="info-value">{{ formatDate(pet?.created_at) }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">健康状态</text>
            <text class="info-value">{{ pet?.health_status || '良好' }}</text>
          </view>
        </view>
      </view>

      <!-- 健康记录 -->
      <view class="info-card">
        <view class="card-header">
          <text class="card-icon">🏥</text>
          <text class="card-title">健康记录</text>
        </view>
        <view v-if="healthRecords.length > 0" class="records-timeline">
          <view v-for="record in healthRecords" :key="record.id" class="record-item">
            <view class="timeline-dot"></view>
            <view class="record-content">
              <view class="record-header">
                <text class="record-type">{{ record.record_type }}</text>
                <text class="record-date">{{ formatDate(record.record_date) }}</text>
              </view>
              <text class="record-desc">{{ record.description }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-records">
          <text>暂无健康记录</text>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="bottom-actions glass">
      <button class="edit-btn" @click="handleEdit">编辑宠物</button>
      <button class="delete-btn" @click="handleDelete">删除</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, shallowRef, triggerRef, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getPetDetail, deletePet, getPetHealthRecords, type Pet, type HealthRecord } from '@/api/pet'
import { getPetAvatar, getPetEmoji } from '@/utils/pet'

/** 宠物信息 - 使用 shallowRef 避免深层响应式问题 */
const pet = shallowRef<Pet | null>(null)

/** 健康记录 */
const healthRecords = ref<HealthRecord[]>([])

/** 当前宠物ID */
const currentPetId = ref<number>(0)

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
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  if (currentPage?.options?.id) {
    currentPetId.value = parseInt(currentPage.options.id)
    loadPet(currentPetId.value)
    loadHealthRecords(currentPetId.value)
  }
})

/**
 * 页面显示时刷新数据（从编辑页返回时）
 */
onShow(() => {
  console.log('[pet-detail] onShow triggered, petId:', currentPetId.value)
  if (currentPetId.value) {
    loadPet(currentPetId.value)
  }
})

/**
 * 加载宠物详情
 * @param id 宠物ID
 */
const loadPet = async (id: number) => {
  try {
    console.log('[pet-detail] Loading pet:', id)
    const data = await getPetDetail(id)
    console.log('[pet-detail] Pet data loaded:', data)
    // 使用 shallowRef 需要先赋值再触发更新
    pet.value = { ...data }
    triggerRef(pet)
    console.log('[pet-detail] Pet ref updated:', pet.value)
  } catch (error) {
    console.error('加载宠物失败:', error)
    uni.showToast({ title: '宠物不存在', icon: 'none' })
  }
}

/**
 * 加载健康记录
 */
const loadHealthRecords = async (petId: number) => {
  try {
    const data = await getPetHealthRecords(petId)
    healthRecords.value = data
  } catch (error) {
    console.error('加载健康记录失败:', error)
  }
}

/**
 * 格式化日期
 */
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * 编辑宠物
 */
const handleEdit = () => {
  if (!pet.value) return
  uni.navigateTo({
    url: `/pages/pet/edit?id=${pet.value.id}`
  })
}

/**
 * 删除宠物
 */
const handleDelete = () => {
  if (!pet.value) return
  
  uni.showModal({
    title: '确认删除',
    content: `确定要删除 ${pet.value.name} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await deletePet(pet.value!.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          uni.$emit('refreshPets')
          setTimeout(() => {
            uni.navigateBack()
          }, 1000)
        } catch (error) {
          console.error('删除宠物失败:', error)
        }
      }
    }
  })
}
</script>

<style lang="scss">
.pet-detail-container {
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

/* 宠物头部卡片 */
.pet-header-card {
  margin-top: calc(var(--status-bar-height, 44px) + 100rpx);
  margin-left: 32rpx;
  margin-right: 32rpx;
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
  border-radius: 40rpx;
  padding: 40rpx;
  display: flex;
  align-items: center;
  gap: 32rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
}

.pet-avatar-large {
  width: 140rpx;
  height: 140rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 4rpx solid rgba(255, 255, 255, 0.2);
}

.pet-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pet-emoji {
  font-size: 64rpx;
}

.pet-basic-info {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.pet-name {
  font-size: 40rpx;
  font-weight: 800;
  color: #FFFFFF;
}

.pet-gender {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 24rpx;
    color: #FFFFFF;
  }
  
  &.male {
    background: #3B82F6;
  }
  
  &.female {
    background: #EC4899;
  }
}

.pet-breed {
  display: block;
  font-size: 26rpx;
  color: #9CA3AF;
  margin-bottom: 16rpx;
}

.pet-meta-tags {
  display: flex;
  gap: 12rpx;
}

.meta-tag {
  font-size: 22rpx;
  color: #D1D5DB;
  background: rgba(255, 255, 255, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
}

/* 内容区域 */
.content-area {
  padding: 24rpx 32rpx;
}

/* 信息卡片 */
.info-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.card-icon {
  font-size: 32rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.info-item {
  background: #F9FAFB;
  border-radius: 20rpx;
  padding: 20rpx;
}

.info-label {
  display: block;
  font-size: 22rpx;
  color: #9CA3AF;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #1F2937;
}

/* 健康记录时间线 */
.records-timeline {
  position: relative;
  padding-left: 24rpx;
}

.record-item {
  position: relative;
  padding-left: 32rpx;
  padding-bottom: 24rpx;
  border-left: 4rpx solid #E5E7EB;
  
  &:last-child {
    border-left-color: transparent;
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: -12rpx;
  top: 8rpx;
  width: 20rpx;
  height: 20rpx;
  background: #10B981;
  border-radius: 50%;
  border: 4rpx solid #FFFFFF;
  box-shadow: 0 2rpx 8rpx rgba(16, 185, 129, 0.3);
}

.record-content {
  background: #F9FAFB;
  border-radius: 20rpx;
  padding: 20rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.record-type {
  font-size: 28rpx;
  font-weight: 600;
  color: #1F2937;
}

.record-date {
  font-size: 22rpx;
  color: #9CA3AF;
}

.record-desc {
  font-size: 26rpx;
  color: #6B7280;
  line-height: 1.6;
}

.empty-records {
  text-align: center;
  padding: 40rpx;
  
  text {
    font-size: 26rpx;
    color: #9CA3AF;
  }
}

/* 底部操作按钮 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 20rpx;
  
  &.glass {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  }
}

.edit-btn {
  flex: 1;
  height: 96rpx;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  border-radius: 32rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
  box-shadow: 0 8rpx 24rpx rgba(251, 191, 36, 0.35);
  
  &::after { border: none; }
}

.delete-btn {
  width: 160rpx;
  height: 96rpx;
  background: #FFFFFF;
  border: 4rpx solid #FEE2E2;
  border-radius: 32rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #EF4444;
  
  &::after { border: none; }
  
  &:active {
    background: #FEF2F2;
  }
}
</style>
