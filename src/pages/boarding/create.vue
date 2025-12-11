<template>
  <view class="create-boarding-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">寄养服务</text>
      <view class="header-placeholder"></view>
    </view>

    <view class="content-area">
      <!-- 步骤指示器 -->
      <view class="stepper">
        <view class="stepper-line"></view>
        <view 
          v-for="(stepItem, idx) in stepLabels" 
          :key="idx"
          :class="['step-item', { active: currentStep >= idx + 1, completed: currentStep > idx + 1 }]"
        >
          <view class="step-circle">
            <text v-if="currentStep > idx + 1" class="check-icon">✓</text>
            <text v-else>{{ idx + 1 }}</text>
          </view>
          <text class="step-label">{{ stepItem }}</text>
        </view>
      </view>

      <!-- 步骤内容 -->
      <view class="step-content">
        <!-- Step 1: 选择宠物 -->
        <view v-if="currentStep === 1" class="step-panel animate-slide-up">
          <text class="step-title">选择哪只爱宠？</text>
          <view class="pets-grid">
            <view 
              v-for="pet in pets" 
              :key="pet.id"
              :class="['pet-card', { selected: selectedPetId === pet.id }]"
              @click="handleSelectPet(pet.id)"
            >
              <view class="pet-avatar-wrapper">
                <image 
                  :src="getPetAvatar(pet.image_url, pet.species)" 
                  class="pet-avatar" 
                  mode="aspectFill"
                />
              </view>
              <text class="pet-name">{{ pet.name }}</text>
              <text class="pet-breed">{{ pet.species }}</text>
              <view v-if="selectedPetId === pet.id" class="selected-badge">
                <text>✓</text>
              </view>
            </view>
            
            <!-- 添加新宠物 -->
            <view class="pet-card add-new" @click="goToAddPet">
              <view class="add-icon-wrapper">
                <text class="add-icon">+</text>
              </view>
              <text class="add-label">添加新宠物</text>
            </view>
          </view>
        </view>

        <!-- Step 2: 选择日期 -->
        <view v-if="currentStep === 2" class="step-panel animate-slide-up">
          <text class="step-title">寄养时间</text>
          <view class="date-section">
            <picker mode="date" :value="startDate" :start="minDate" @change="onStartDateChange">
              <view class="date-picker">
                <text class="picker-label">开始日期</text>
                <text :class="['picker-value', { placeholder: !startDate }]">
                  {{ startDate || '请选择开始日期' }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>

            <picker mode="date" :value="endDate" :start="startDate || minDate" @change="onEndDateChange">
              <view class="date-picker">
                <text class="picker-label">结束日期</text>
                <text :class="['picker-value', { placeholder: !endDate }]">
                  {{ endDate || '请选择结束日期' }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>

            <view v-if="days > 0" class="days-badge">
              <text class="badge-label">寄养天数:</text>
              <text class="badge-value">{{ days }} 天</text>
            </view>
          </view>
        </view>

        <!-- Step 3: 确认信息 -->
        <view v-if="currentStep === 3" class="step-panel animate-slide-up">
          <text class="step-title">确认信息</text>
          
          <!-- 已选信息卡片 -->
          <view class="summary-card">
            <text class="summary-title">已选信息</text>
            
            <view class="summary-item">
              <view class="item-icon-wrapper pet">
                <text class="item-emoji">{{ getPetEmoji(currentPet?.species) }}</text>
              </view>
              <view class="item-info">
                <text class="item-label">服务对象</text>
                <text class="item-value">{{ currentPet?.name }}</text>
              </view>
            </view>

            <view class="summary-item">
              <view class="item-icon-wrapper date">
                <text class="item-emoji">📅</text>
              </view>
              <view class="item-info">
                <text class="item-label">寄养时间</text>
                <text class="item-value">{{ formatDateDisplay(startDate) }} - {{ formatDateDisplay(endDate) }}</text>
              </view>
            </view>
          </view>

          <!-- 费用信息 -->
          <view class="cost-card">
            <text class="cost-title">费用明细</text>
            <view class="cost-row">
              <text class="cost-label">每日费用</text>
              <text class="cost-value">¥{{ dailyRate }}</text>
            </view>
            <view class="cost-row">
              <text class="cost-label">寄养天数</text>
              <text class="cost-value">× {{ days }}</text>
            </view>
            <view class="cost-divider"></view>
            <view class="cost-row total">
              <text class="cost-label">总费用</text>
              <text class="cost-value">¥{{ totalCost }}</text>
            </view>
          </view>

          <!-- 备注 -->
          <view class="notes-card">
            <text class="notes-title">备注要求</text>
            <textarea
              v-model="notes"
              placeholder="例如：宠物胆小，请轻柔对待..."
              class="notes-textarea"
              maxlength="200"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar glass">
      <!-- 最后一步显示确认按钮 -->
      <button 
        v-if="currentStep === 3" 
        class="submit-btn" 
        :loading="loading" 
        @click="handleSubmit"
      >
        确认预约
      </button>
      
      <!-- 其他步骤显示下一步按钮 -->
      <button 
        v-else
        class="next-btn" 
        :disabled="!canGoNext"
        @click="goToNextStep"
      >
        下一步
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getPets, type Pet } from '@/api/pet'
import { createBoarding } from '@/api/boarding'
import { useUserStore } from '@/stores/user'
import { getPetAvatar, getPetEmoji } from '@/utils/pet'

/** 步骤标签 */
const stepLabels = ['宠物', '日期', '确认']

/** 当前步骤 */
const currentStep = ref(1)

/** 宠物列表 */
const pets = ref<Pet[]>([])

/** 选中的宠物ID */
const selectedPetId = ref<number | null>(null)

/** 开始日期 */
const startDate = ref('')

/** 结束日期 */
const endDate = ref('')

/** 每日费用（固定值） */
const dailyRate = 120

/** 备注 */
const notes = ref('')

/** 加载状态 */
const loading = ref(false)

/** 最小日期（明天） */
const minDate = (() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})()

/** 用户Store */
const userStore = useUserStore()

/** 当前选中的宠物 */
const currentPet = computed(() => {
  return pets.value.find(p => p.id === selectedPetId.value)
})

/** 寄养天数 */
const days = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const diff = end.getTime() - start.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

/** 总费用 */
const totalCost = computed(() => {
  return (days.value * dailyRate).toFixed(2)
})

/**
 * 返回
 */
const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  } else {
    uni.navigateBack()
  }
}

/**
 * 初始化
 */
onMounted(async () => {
  await loadPets()
})

/**
 * 加载宠物列表
 */
const loadPets = async () => {
  try {
    const data = await getPets()
    pets.value = data
  } catch (error) {
    console.error('加载宠物失败:', error)
  }
}

/**
 * 判断是否可以进入下一步
 */
const canGoNext = computed(() => {
  if (currentStep.value === 1) {
    return selectedPetId.value !== null
  } else if (currentStep.value === 2) {
    return selectedDate.value && endDate.value && days.value > 0
  }
  return false
})

/**
 * 进入下一步
 */
const goToNextStep = () => {
  if (canGoNext.value) {
    currentStep.value++
  }
}

/**
 * 选择宠物
 */
const handleSelectPet = (id: number) => {
  selectedPetId.value = id
}

/**
 * 开始日期变更
 */
const onStartDateChange = (e: any) => {
  startDate.value = e.detail.value
  if (endDate.value && new Date(endDate.value) <= new Date(startDate.value)) {
    endDate.value = ''
  }
}

/**
 * 结束日期变更
 */
const onEndDateChange = (e: any) => {
  endDate.value = e.detail.value
}



/**
 * 格式化日期显示
 */
const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/**
 * 跳转添加宠物
 */
const goToAddPet = () => {
  uni.navigateTo({ url: '/pages/pet/add' })
}

/**
 * 提交寄养
 */
const handleSubmit = async () => {
  if (!selectedPetId.value) {
    uni.showToast({ title: '请选择宠物', icon: 'none' })
    return
  }
  if (!startDate.value || !endDate.value) {
    uni.showToast({ title: '请选择日期', icon: 'none' })
    return
  }
  if (days.value <= 0) {
    uni.showToast({ title: '结束日期必须晚于开始日期', icon: 'none' })
    return
  }

  loading.value = true
  try {
    await createBoarding({
      pet_id: selectedPetId.value,
      start_date: startDate.value,
      end_date: endDate.value,
      daily_rate: dailyRate,
      notes: notes.value || undefined
    })

    uni.showToast({ title: '预约成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/boarding/list' })
    }, 1000)
  } catch (error) {
    console.error('创建寄养失败:', error)
    uni.showToast({ title: '提交失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.create-boarding-container {
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
  padding: 32rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 120rpx);
}

/* 步骤指示器 */
.stepper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 60rpx;
  padding: 0 20rpx;
  position: relative;
}

.stepper-line {
  position: absolute;
  top: 28rpx;
  left: 80rpx;
  right: 80rpx;
  height: 4rpx;
  background: #E5E7EB;
  z-index: 0;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  position: relative;
  z-index: 1;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  opacity: 0.5;
  
  &.active {
    opacity: 1;
  }
  
  &.completed .step-circle {
    background: #10B981;
    border-color: #10B981;
    box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.3);
  }
}

.step-circle {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #FFFFFF;
  border: 4rpx solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
  color: #6B7280;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  .check-icon {
    color: #FFFFFF;
    font-size: 28rpx;
  }
}

.step-item.active .step-circle {
  background: #FFBF00;
  border-color: #FFBF00;
  color: #1F2937;
  box-shadow: 0 8rpx 20rpx rgba(251, 191, 36, 0.4);
  transform: scale(1.1);
}

.step-label {
  font-size: 22rpx;
  font-weight: 600;
  color: #9CA3AF;
}

.step-item.active .step-label {
  color: #1F2937;
  font-weight: 700;
}

/* 步骤内容 */
.step-content {
  min-height: 500rpx;
}

.step-panel {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 40rpx;
}

/* 宠物网格 */
.pets-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.pet-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 40rpx 24rpx 32rpx;
  text-align: center;
  border: 3rpx solid transparent;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  
  &.selected {
    border-color: #FFBF00;
    background: #FFFBEB;
    transform: scale(1.02);
    box-shadow: 0 12rpx 32rpx rgba(251, 191, 36, 0.25);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.pet-avatar-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 20rpx;
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  padding: 4rpx;
}

.pet-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #F3F4F6;
}

.pet-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 8rpx;
}

.pet-breed {
  display: block;
  font-size: 24rpx;
  color: #9CA3AF;
  background: #F3F4F6;
  padding: 4rpx 16rpx;
  border-radius: 100rpx;
  display: inline-block;
}

.selected-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 40rpx;
  height: 40rpx;
  background: #FFBF00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(251, 191, 36, 0.4);
  
  text {
    color: #FFFFFF;
    font-size: 20rpx;
    font-weight: 700;
  }
}

.pet-card.add-new {
  background: #FFFFFF;
  border: 3rpx dashed #D1D5DB;
}

.add-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #F9FAFB;
  margin: 0 auto 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-icon {
  font-size: 56rpx;
  color: #9CA3AF;
  font-weight: 300;
}

.add-label {
  font-size: 26rpx;
  color: #6B7280;
  font-weight: 600;
}

/* 日期选择 */
.date-section {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.date-picker {
  display: flex;
  align-items: center;
  background: #F9FAFB;
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 24rpx;
  transition: all 0.2s;
  
  &:active {
    background: #F3F4F6;
  }
  
  &:last-of-type {
    margin-bottom: 0;
  }
}

.picker-label {
  font-size: 28rpx;
  color: #6B7280;
  min-width: 140rpx;
  font-weight: 600;
}

.picker-value {
  flex: 1;
  font-size: 30rpx;
  color: #1F2937;
  font-weight: 600;
  
  &.placeholder {
    color: #9CA3AF;
    font-weight: 400;
  }
}

.picker-arrow {
  font-size: 36rpx;
  color: #D1D5DB;
  font-weight: 300;
}

.days-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-top: 32rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  border-radius: 20rpx;
}

.badge-label {
  font-size: 26rpx;
  color: #92400E;
  font-weight: 600;
}

.badge-value {
  font-size: 36rpx;
  color: #B45309;
  font-weight: 700;
}

/* 确认信息 */
.summary-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.summary-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 24rpx;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background: #F9FAFB;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.item-icon-wrapper {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &.pet {
    background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  }
  
  &.date {
    background: linear-gradient(135deg, #DBEAFE, #BFDBFE);
  }
}

.item-emoji {
  font-size: 32rpx;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.item-label {
  font-size: 22rpx;
  color: #9CA3AF;
  font-weight: 600;
}

.item-value {
  font-size: 28rpx;
  color: #1F2937;
  font-weight: 700;
}

/* 费用卡片 */
.cost-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.cost-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 24rpx;
}

.cost-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 20rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
  margin-bottom: 12rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.total {
    background: linear-gradient(135deg, #FEF3C7, #FDE68A);
    padding: 24rpx;
    margin-top: 16rpx;
    
    .cost-label {
      font-size: 30rpx;
      font-weight: 700;
      color: #92400E;
    }
    
    .cost-value {
      font-size: 36rpx;
      font-weight: 700;
      color: #B45309;
    }
  }
}

.cost-label {
  font-size: 28rpx;
  color: #6B7280;
  font-weight: 600;
}

.cost-value {
  font-size: 30rpx;
  color: #1F2937;
  font-weight: 700;
}

.cost-divider {
  height: 2rpx;
  background: #E5E7EB;
  margin: 16rpx 0;
}

/* 备注卡片 */
.notes-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.notes-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 20rpx;
}

.notes-textarea {
  width: 100%;
  min-height: 160rpx;
  background: #F9FAFB;
  border-radius: 20rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #1F2937;
  line-height: 1.6;
}

/* 底部按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  z-index: 90;
  
  &.glass {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  }
}

.submit-btn,
.next-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
  border-radius: 32rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #FFFFFF;
  box-shadow: 0 12rpx 32rpx rgba(31, 41, 55, 0.3);
  transition: all 0.2s;
  
  &::after { border: none; }
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 6rpx 16rpx rgba(31, 41, 55, 0.2);
  }
  
  &[disabled] {
    opacity: 0.6;
    background: #D1D5DB;
    box-shadow: none;
    color: #F3F4F6;
  }
}

.next-btn {
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  color: #1F2937;
  box-shadow: 0 12rpx 32rpx rgba(251, 191, 36, 0.45);
  
  &:active {
    box-shadow: 0 6rpx 16rpx rgba(251, 191, 36, 0.35);
  }
}
</style>
