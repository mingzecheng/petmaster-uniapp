/**
 * @description 积分相关API
 */

import { get, post } from '@/utils/request'

/** 积分记录类型 */
export type PointRecordType = 'earn' | 'use' | 'adjust'

/** 积分记录 */
export interface PointRecord {
    id: number
    user_id: number
    points: number
    balance: number
    type: PointRecordType
    reason: string
    transaction_id?: number
    operator_id?: number
    created_at: string
}

/** 积分统计 */
export interface PointStats {
    current_points: number
    total_earned: number
    total_used: number
}

/** 积分使用结果 */
export interface PointUseResult {
    success: boolean
    points_used: number
    discount_amount: number
    remaining_points: number
}

/** 积分计算结果 */
export interface PointCalculateResult {
    points: number
    value: number
}

/**
 * 获取我的积分统计
 */
export const getMyPointStats = () => {
    return get<PointStats>('/points/me/stats')
}

/**
 * 获取我的积分明细
 * @param skip - 跳过数量
 * @param limit - 每页数量
 */
export const getMyPointRecords = (skip: number = 0, limit: number = 50) => {
    return get<PointRecord[]>('/points/me/records', { skip, limit })
}

/**
 * 使用积分抵扣
 * @param orderId - 订单ID
 * @param points - 使用积分数
 */
export const usePointsForOrder = (orderId: number, points: number) => {
    return post<PointUseResult>('/points/use', { order_id: orderId, points })
}

/**
 * 计算积分可抵扣金额
 * @param points - 积分数量
 */
export const calculatePointsValue = (points: number) => {
    return get<PointCalculateResult>('/points/calculate', { points })
}
