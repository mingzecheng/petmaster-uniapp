/**
 * @description 寄养管理API
 */

import { get, post, del, patch } from '@/utils/request'

/** 寄养状态 */
export type BoardingStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'refunded'

/** 寄养信息 */
export interface Boarding {
    id: number
    pet_id: number
    payment_id?: number
    start_date: string
    end_date: string
    daily_rate: number | string
    total_cost: number | string
    status: BoardingStatus
    notes?: string
    cancel_reason?: string
    created_at: string
    updated_at: string
    pet?: {
        id: number
        name: string
        species: string
        image_url?: string
    }
}

/** 创建寄养参数 */
export interface BoardingCreate {
    pet_id: number
    start_date: string
    end_date: string
    daily_rate?: number
    notes?: string
}

/** 取消寄养请求 */
export interface CancelBoardingRequest {
    reason?: string
}

/** 取消寄养响应 */
export interface CancelBoardingResponse {
    success: boolean
    message: string
    refund_amount?: string
}

/**
 * 获取寄养列表
 */
export const getBoardings = (params?: {
    skip?: number
    limit?: number
    pet_id?: number
    status?: BoardingStatus
}) => {
    return get<Boarding[]>('/boarding', params)
}

/**
 * 获取寄养详情
 * @param boardingId - 寄养ID
 */
export const getBoardingDetail = (boardingId: number) => {
    return get<Boarding>(`/boarding/${boardingId}`)
}

/**
 * 创建寄养
 * @param data - 寄养数据
 */
export const createBoarding = (data: BoardingCreate) => {
    return post<Boarding>('/boarding/', data)
}

/**
 * 取消寄养
 * @param boardingId - 寄养ID
 * @param request - 取消请求
 */
export const cancelBoarding = (boardingId: number, request?: CancelBoardingRequest) => {
    return post<CancelBoardingResponse>(`/boarding/${boardingId}/cancel`, request || {})
}

