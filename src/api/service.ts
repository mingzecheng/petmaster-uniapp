/**
 * @description 服务管理API
 */

import { get } from '@/utils/request'

/** 服务信息 */
export interface Service {
    id: number
    name: string
    description?: string
    price: number
    duration?: number
    category?: string
    is_active: boolean
    created_at: string
}

/**
 * 获取服务列表
 */
/**
 * 获取服务列表
 */
export const getServices = (params?: { skip?: number; limit?: number; name?: string }) => {
    return get<Service[]>('/services', params)
}

/**
 * 获取服务详情
 * @param serviceId - 服务ID
 */
export const getServiceDetail = (serviceId: number) => {
    return get<Service>(`/services/${serviceId}`)
}
