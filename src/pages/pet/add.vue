<template>
  <view class="add-pet-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">添加宠物</text>
      <view class="header-placeholder"></view>
    </view>

    <view class="content-area">
      <!-- 基本信息 -->
      <view class="form-card">
        <view class="card-header">
          <text class="card-icon">🐾</text>
          <text class="card-title">基本信息</text>
        </view>
        
        <view class="form-item">
          <text class="form-label">宠物名称 *</text>
          <view class="input-group">
            <input
              type="text"
              v-model="formData.name"
              placeholder="请输入宠物名称"
              class="input-field"
            />
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">宠物类型 *</text>
          <picker :range="speciesList" @change="onSpeciesChange">
            <view class="picker-group">
              <text :class="{ placeholder: !formData.species }">{{ formData.species || '请选择' }}</text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">品种</text>
          <view class="input-group">
            <input
              type="text"
              v-model="formData.breed"
              placeholder="请输入品种（选填）"
              class="input-field"
            />
          </view>
        </view>
      </view>

      <!-- 详细信息 -->
      <view class="form-card">
        <view class="card-header">
          <text class="card-icon">📋</text>
          <text class="card-title">详细信息</text>
        </view>

        <view class="form-item">
          <text class="form-label">性别</text>
          <view class="gender-row">
            <view 
              :class="['gender-btn', { active: formData.gender === 'male' }]"
              @click="formData.gender = 'male'"
            >
              <text>♂ 公</text>
            </view>
            <view 
              :class="['gender-btn', { active: formData.gender === 'female' }]"
              @click="formData.gender = 'female'"
            >
              <text>♀ 母</text>
            </view>
          </view>
        </view>

        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">年龄</text>
            <view class="input-group">
              <input
                type="number"
                v-model="formData.age"
                placeholder="岁"
                class="input-field"
              />
            </view>
          </view>
          <view class="form-item half">
            <text class="form-label">体重</text>
            <view class="input-group">
              <input
                type="digit"
                v-model="formData.weight"
                placeholder="kg"
                class="input-field"
              />
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">描述</text>
          <view class="textarea-group">
            <textarea
              v-model="formData.description"
              placeholder="添加一些关于宠物的描述（选填）"
              class="textarea-field"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="bottom-bar glass">
      <button class="submit-btn" :loading="loading" @click="handleSubmit">
        保存档案
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { createPet, type PetCreate } from '@/api/pet'
import { useUserStore } from '@/stores/user'

/** 表单数据类型 */
interface FormData {
  name: string
  species: string
  breed?: string
  gender?: string
  age?: number
  weight?: number
  description?: string
  owner_id: number
}

/** 表单数据 */
const formData = reactive<FormData>({
  name: '',
  species: '',
  breed: '',
  gender: '',
  age: undefined,
  weight: undefined,
  description: '',
  owner_id: 0
})

/** 宠物类型列表 */
const speciesList = ['狗', '猫', '兔子', '仓鼠', '鸟', '鱼', '其他']

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
 * 选择宠物类型
 */
const onSpeciesChange = (e: any) => {
  formData.species = speciesList[e.detail.value]
}

/**
 * 表单验证
 */
const validateForm = (): boolean => {
  if (!formData.name.trim()) {
    uni.showToast({ title: '请输入宠物名称', icon: 'none' })
    return false
  }
  if (!formData.species) {
    uni.showToast({ title: '请选择宠物类型', icon: 'none' })
    return false
  }
  return true
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!validateForm()) return

  if (!userStore.userInfo?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  loading.value = true
  try {
    formData.owner_id = userStore.userInfo.id
    // 构建符合 PetCreate 类型的数据（不包含 age 字段）
    const petData: PetCreate = {
      name: formData.name,
      species: formData.species,
      breed: formData.breed || undefined,
      gender: formData.gender || undefined,
      weight: formData.weight ? Number(formData.weight) : undefined,
      owner_id: formData.owner_id
    }
    await createPet(petData)

    uni.showToast({ title: '添加成功', icon: 'success' })
    
    // 通知列表刷新
    uni.$emit('refreshPets')
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
  } catch (error) {
    console.error('添加宠物失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.add-pet-container {
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

/* 表单卡片 */
.form-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 28rpx;
}

.card-icon {
  font-size: 32rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
}

.form-item {
  margin-bottom: 24rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.half {
    flex: 1;
  }
}

.form-row {
  display: flex;
  gap: 20rpx;
}

.form-label {
  display: block;
  font-size: 24rpx;
  color: #9CA3AF;
  margin-bottom: 12rpx;
}

.input-group {
  background: #F3F4F6;
  border-radius: 24rpx;
  padding: 0 24rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  transition: all 0.3s;
  
  &:focus-within {
    background: #FFFFFF;
    box-shadow: 0 0 0 4rpx rgba(251, 191, 36, 0.2);
  }
}

.input-field {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #1F2937;
}

.picker-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F3F4F6;
  border-radius: 24rpx;
  padding: 0 24rpx;
  height: 96rpx;
  
  text {
    font-size: 30rpx;
    color: #1F2937;
    
    &.placeholder {
      color: #9CA3AF;
    }
  }
}

.picker-arrow {
  font-size: 32rpx;
  color: #D1D5DB;
}

.textarea-group {
  background: #F3F4F6;
  border-radius: 24rpx;
  padding: 20rpx 24rpx;
}

.textarea-field {
  width: 100%;
  min-height: 160rpx;
  font-size: 30rpx;
  color: #1F2937;
}

/* 性别选择 */
.gender-row {
  display: flex;
  gap: 20rpx;
}

.gender-btn {
  flex: 1;
  height: 96rpx;
  background: #F3F4F6;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  text {
    font-size: 30rpx;
    color: #9CA3AF;
  }
  
  &.active {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    
    text {
      color: #1F2937;
      font-weight: 600;
    }
  }
}

/* 底部保存按钮 */
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

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  border-radius: 32rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
  box-shadow: 0 12rpx 32rpx rgba(251, 191, 36, 0.45);
  
  &::after { border: none; }
  
  &:active {
    transform: scale(0.98);
  }
}
</style>
