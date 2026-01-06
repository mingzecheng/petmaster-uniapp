<template>
  <view class="edit-pet-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">编辑宠物</text>
      <view class="header-placeholder"></view>
    </view>

    <view class="content-area">
      <!-- 基本信息 -->
      <view class="form-card">
        <view class="card-header">
          <text class="card-icon">🐾</text>
          <text class="card-title">基本信息</text>
        </view>
        
        <!-- 头像上传区域 -->
        <view class="avatar-upload-section">
          <view class="avatar-container" @click="handleChooseImage">
            <image 
              v-if="petAvatar"
              :src="petAvatar" 
              class="pet-avatar-image"
              mode="aspectFill"
            />
            <view v-else class="avatar-placeholder">
              <text class="avatar-icon">📷</text>
              <text class="avatar-hint">点击上传头像</text>
            </view>
            <view class="avatar-edit-badge">
              <text>编辑</text>
            </view>
          </view>
          <view v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
            <text>上传中 {{ uploadProgress }}%</text>
          </view>
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
          <picker :range="speciesList" :value="speciesIndex" @change="onSpeciesChange">
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
            <text class="form-label">生日</text>
            <picker mode="date" :value="formData.birthday" @change="onBirthdayChange">
              <view class="picker-group">
                <text :class="{ placeholder: !formData.birthday }">{{ formData.birthday || '请选择' }}</text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
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
          <text class="form-label">健康状态</text>
          <view class="textarea-group">
            <textarea
              v-model="formData.health_status"
              placeholder="请描述宠物的健康状况（选填）"
              class="textarea-field"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="bottom-bar glass">
      <button class="submit-btn" :loading="loading" @click="handleSubmit">
        保存修改
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * @description 宠物编辑页面
 */

import { ref, reactive, onMounted, computed } from 'vue'
import { getPetDetail, updatePet, uploadPetImage, type Pet, type PetUpdate } from '@/api/pet'
import { getPetAvatar } from '@/utils/pet'

/** 宠物ID */
const petId = ref<number>(0)

/** 原始宠物数据 */
const originalPet = ref<Pet | null>(null)

/** 宠物头像URL */
const petAvatar = ref<string>('')

/** 上传进度 */
const uploadProgress = ref<number>(0)

/** 表单数据 */
const formData = reactive<PetUpdate>({
  name: '',
  species: '',
  breed: '',
  gender: '',
  birthday: '',
  weight: undefined,
  health_status: ''
})

/** 宠物类型列表 */
const speciesList = ['狗', '猫', '兔子', '仓鼠', '鸟', '鱼', '其他']

/** 当前选中的类型索引 */
const speciesIndex = computed(() => {
  const idx = speciesList.indexOf(formData.species || '')
  return idx >= 0 ? idx : 0
})

/** 加载状态 */
const loading = ref(false)

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
    petId.value = parseInt(currentPage.options.id)
    loadPet(petId.value)
  }
})

/**
 * 加载宠物详情
 */
const loadPet = async (id: number) => {
  try {
    uni.showLoading({ title: '加载中...' })
    const data = await getPetDetail(id)
    originalPet.value = data
    
    // 填充表单
    formData.name = data.name
    formData.species = data.species
    formData.breed = data.breed || ''
    formData.gender = data.gender || ''
    formData.birthday = data.birthday || ''
    formData.weight = data.weight
    formData.health_status = data.health_status || ''
    
    // 加载头像
    petAvatar.value = getPetAvatar(data.image_url, data.species)
    
    uni.hideLoading()
  } catch (error) {
    uni.hideLoading()
    console.error('加载宠物失败:', error)
    uni.showToast({ title: '宠物不存在', icon: 'none' })
  }
}

/**
 * 选择并上传头像
 */
const handleChooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      handleUploadImage(tempFilePath)
    }
  })
}

/**
 * 上传图片
 */
const handleUploadImage = async (filePath: string) => {
  try {
    uploadProgress.value = 0
    
    // 显示上传中提示
    uni.showLoading({ title: '上传中...' })
    
    // 上传图片
    const result = await uploadPetImage(petId.value, filePath)
    
    // 上传成功
    uploadProgress.value = 100
    uni.hideLoading()
    uni.showToast({ title: '上传成功', icon: 'success' })
    
    // 更新头像显示
    petAvatar.value = getPetAvatar(result.image_url, result.species)
    formData.image_url = result.image_url
    
    // 通知列表刷新
    uni.$emit('refreshPets')
  } catch (error) {
    console.error('上传图片失败:', error)
    uploadProgress.value = 0
    uni.hideLoading()
    uni.showToast({ title: '上传失败', icon: 'none' })
  }
}

/**
 * 选择宠物类型
 */
const onSpeciesChange = (e: any) => {
  formData.species = speciesList[e.detail.value]
}

/**
 * 选择生日
 */
const onBirthdayChange = (e: any) => {
  formData.birthday = e.detail.value
}

/**
 * 表单验证
 */
const validateForm = (): boolean => {
  if (!formData.name?.trim()) {
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

  loading.value = true
  try {
    await updatePet(petId.value, {
      ...formData,
      weight: formData.weight ? Number(formData.weight) : undefined,
      birthday: formData.birthday || undefined,
      health_status: formData.health_status || undefined
    })

    uni.showToast({ title: '保存成功', icon: 'success' })
    
    // 通知列表刷新
    uni.$emit('refreshPets')
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
  } catch (error) {
    console.error('更新宠物失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.edit-pet-container {
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

/* 头像上传区域 */
.avatar-upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0;
  margin-bottom: 32rpx;
  border-bottom: 2rpx solid #F3F4F6;
}

.avatar-container {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.95);
  }
}

.pet-avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.avatar-icon {
  font-size: 64rpx;
}

.avatar-hint {
  font-size: 24rpx;
  color: #92400E;
  font-weight: 600;
}

.avatar-edit-badge {
  position: absolute;
  bottom: 12rpx;
  right: 12rpx;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8rpx);
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  
  text {
    font-size: 22rpx;
    color: #FFFFFF;
    font-weight: 600;
  }
}

.upload-progress {
  margin-top: 16rpx;
  padding: 8rpx 24rpx;
  background: #FEF3C7;
  border-radius: 16rpx;
  
  text {
    font-size: 24rpx;
    color: #92400E;
    font-weight: 600;
  }
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
