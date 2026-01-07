/**
 * @description 宠物管理API
 */

import { get, post, put, del } from '@/utils/request'

/** 宠物信息 */
export interface Pet {
    id: number
    name: string
    species: string
    breed?: string
    gender?: string
    birthday?: string
    weight?: number
    health_status?: string
    image_url?: string
    owner_id: number
    created_at: string
    updated_at?: string
}

/** 创建宠物参数 */
export interface PetCreate {
    name: string
    species: string
    breed?: string
    gender?: string
    birthday?: string
    weight?: number
    health_status?: string
    owner_id: number
}

/** 更新宠物参数 */
export interface PetUpdate {
    name?: string
    species?: string
    breed?: string
    gender?: string
    birthday?: string
    weight?: number
    health_status?: string
    image_url?: string
}

/**
 * 获取宠物列表
 */
/**
 * 获取宠物列表
 */
export const getPets = (params?: { skip?: number; limit?: number; owner_id?: number }) => {
    return get<Pet[]>('/pets/', params)
}

/**
 * 获取宠物详情
 * @param petId - 宠物ID
 */
export const getPetDetail = (petId: number) => {
    return get<Pet>(`/pets/${petId}`)
}

/**
 * 创建宠物
 * @param data - 宠物数据
 */
export const createPet = (data: PetCreate) => {
    return post<Pet>('/pets/', data)
}

/**
 * 更新宠物信息
 * @param petId - 宠物ID
 * @param data - 更新数据
 */
export const updatePet = (petId: number, data: PetUpdate) => {
    return put<Pet>(`/pets/${petId}`, data)
}

/**
 * 删除宠物
 * @param petId - 宠物ID
 */
export const deletePet = (petId: number) => {
    return del(`/pets/${petId}`)
}

/**
 * 上传宠物图片
 * @param petId - 宠物ID
 * @param filePath - 图片文件路径
 */
export const uploadPetImage = (petId: number, filePath: string) => {
    return new Promise<Pet>((resolve, reject) => {
        // 从storage工具获取token
        const token = uni.getStorageSync('pet_master_token')

        uni.uploadFile({
            url: `${import.meta.env.VITE_API_BASE_URL}/pets/${petId}/upload-image`,
            filePath: filePath,
            name: 'file',
            header: {
                'Authorization': `Bearer ${token}`
            },
            success: (uploadFileRes) => {
                if (uploadFileRes.statusCode === 200) {
                    const data = JSON.parse(uploadFileRes.data)
                    resolve(data)
                } else {
                    reject(new Error('上传失败'))
                }
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

/**
 * 删除宠物图片
 * @param petId - 宠物ID
 */
export const deletePetImage = (petId: number) => {
    return del<Pet>(`/pets/${petId}/image`)
}

/** 健康记录 */
export interface HealthRecord {
    id: number
    pet_id: number
    record_date: string
    record_type: string
    description: string
    veterinarian?: string
    notes?: string
    created_at: string
}

/** 健康记录创建参数 */
export interface HealthRecordCreate {
    pet_id: number
    record_date: string
    record_type: string
    description: string
    veterinarian?: string
    notes?: string
}

/** 健康记录更新参数 */
export interface HealthRecordUpdate {
    record_date?: string
    record_type?: string
    description?: string
    veterinarian?: string
    notes?: string
}

/**
 * 获取宠物健康记录
 * @param petId - 宠物ID
 */
export const getPetHealthRecords = (petId: number, params?: { skip?: number; limit?: number }) => {
    return get<HealthRecord[]>(`/pet_health_records/pet/${petId}`, params)
}

/**
 * 创建健康记录
 * @param data - 记录数据
 */
export const createHealthRecord = (data: HealthRecordCreate) => {
    return post<HealthRecord>('/pet_health_records', data)
}

/**
 * 获取健康记录详情
 * @param recordId - 记录ID
 */
export const getHealthRecordDetail = (recordId: number) => {
    return get<HealthRecord>(`/pet_health_records/${recordId}`)
}

/**
 * 更新健康记录
 * @param recordId - 记录ID
 * @param data - 更新数据
 */
export const updateHealthRecord = (recordId: number, data: HealthRecordUpdate) => {
    return put<HealthRecord>(`/pet_health_records/${recordId}`, data)
}

/**
 * 删除健康记录
 * @param recordId - 记录ID
 */
export const deleteHealthRecord = (recordId: number) => {
    return del(`/pet_health_records/${recordId}`)
}
