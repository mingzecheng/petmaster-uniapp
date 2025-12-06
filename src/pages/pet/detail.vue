<template>
  <view class="pet-detail-container">
    <!-- 宠物头像 -->
    <view class="pet-header">
      <view class="pet-avatar">
        <text class="pet-emoji">{{ getPetEmoji(pet?.species) }}</text>
      </view>
      <view class="pet-basic">
        <view class="name-row">
          <text class="pet-name">{{ pet?.name || '加载中...' }}</text>
          <text class="pet-gender">{{ pet?.gender === 'male' ? '♂' : '♀' }}</text>
        </view>
        <text class="pet-breed">{{ pet?.species }} · {{ pet?.breed || '未知品种' }}</text>
      </view>
    </view>

    <!-- 基本信息卡片 -->
    <view class="info-card">
      <view class="card-title">
        <text>📋 基本信息</text>
      </view>
      <view class="info-grid">
        <view class="info-item">
          <text class="info-label">年龄</text>
          <text class="info-value">{{ pet?.age ? pet.age + '岁' : '未知' }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">体重</text>
          <text class="info-value">{{ pet?.weight ? pet.weight + 'kg' : '未知' }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">添加时间</text>
          <text class="info-value">{{ formatDate(pet?.created_at) }}</text>
        </view>
      </view>
      <view v-if="pet?.description" class="description">
        <text class="desc-label">描述</text>
        <text class="desc-text">{{ pet.description }}</text>
      </view>
    </view>

    <!-- 健康记录 -->
    <view class="info-card">
      <view class="card-title">
        <text>🏥 健康记录</text>
      </view>
      <view v-if="healthRecords.length > 0" class="records-list">
        <view v-for="record in healthRecords" :key="record.id" class="record-item">
          <view class="record-header">
            <text class="record-type">{{ record.record_type }}</text>
            <text class="record-date">{{ formatDate(record.record_date) }}</text>
          </view>
          <text class="record-desc">{{ record.description }}</text>
        </view>
      </view>
      <view v-else class="empty-records">
        <text>暂无健康记录</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-wrapper">
      <button class="delete-btn" @click="handleDelete">删除宠物</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPetDetail, deletePet, getPetHealthRecords, type Pet, type HealthRecord } from '@/api/pet'

/** 宠物信息 */
const pet = ref<Pet | null>(null)

/** 健康记录 */
const healthRecords = ref<HealthRecord[]>([])

/**
 * 初始化
 */
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  if (currentPage?.options?.id) {
    const petId = parseInt(currentPage.options.id)
    loadPet(petId)
    loadHealthRecords(petId)
  }
})

/**
 * 加载宠物详情
 */
const loadPet = async (id: number) => {
  try {
    const data = await getPetDetail(id)
    pet.value = data
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
 * 获取宠物emoji
 */
const getPetEmoji = (species?: string): string => {
  const emojis: Record<string, string> = {
    '狗': '🐕',
    '猫': '🐱',
    '兔子': '🐰',
    '仓鼠': '🐹'
  }
  return emojis[species || ''] || '🐾'
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
  background: #FFFDE7;
  padding: 30rpx;
}

.pet-header {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.pet-avatar {
  width: 140rpx;
  height: 140rpx;
  background: linear-gradient(135deg, #FFF9C4, #FFE57F);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.pet-emoji {
  font-size: 72rpx;
}

.pet-basic {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.pet-name {
  font-size: 40rpx;
  font-weight: 700;
  color: #212121;
  margin-right: 12rpx;
}

.pet-gender {
  font-size: 32rpx;
  color: #2979FF;
}

.pet-breed {
  font-size: 28rpx;
  color: #757575;
}

.info-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  margin-bottom: 24rpx;
  
  text {
    font-size: 32rpx;
    font-weight: 700;
    color: #212121;
  }
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.info-item {
  width: calc(50% - 10rpx);
  background: #F5F5F5;
  border-radius: 16rpx;
  padding: 20rpx;
}

.info-label {
  display: block;
  font-size: 24rpx;
  color: #757575;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #212121;
}

.description {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F5F5F5;
}

.desc-label {
  display: block;
  font-size: 24rpx;
  color: #757575;
  margin-bottom: 8rpx;
}

.desc-text {
  font-size: 28rpx;
  color: #424242;
  line-height: 1.6;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.record-item {
  background: #F5F5F5;
  border-radius: 16rpx;
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
  color: #212121;
}

.record-date {
  font-size: 24rpx;
  color: #BDBDBD;
}

.record-desc {
  font-size: 26rpx;
  color: #757575;
}

.empty-records {
  text-align: center;
  padding: 40rpx;
  
  text {
    font-size: 26rpx;
    color: #BDBDBD;
  }
}

.action-wrapper {
  margin-top: 40rpx;
}

.delete-btn {
  width: 100%;
  height: 96rpx;
  background: #fff;
  border: 2rpx solid #FF1744;
  border-radius: 24rpx;
  font-size: 32rpx;
  color: #FF1744;
}
</style>
