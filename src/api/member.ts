/**
 * @description 会员相关API
 */

import { get, post } from '@/utils/request'

/** 会员卡信息 */
export interface MemberCard {
    id: number
    user_id: number
    card_number: string
    balance: string  // 后端返回字符串格式
    total_recharge: string  // 后端返回字符串格式
    total_consumption: string  // 累计消费
    status: 'active' | 'frozen' | 'cancelled'
    activated_at?: string  // 激活时间
    created_at: string
    updated_at?: string
}

/** 充值记录 */
export interface RechargeRecord {
    id: number
    member_card_id: number
    amount: number
    balance_before: number
    balance_after: number
    payment_method: string
    transaction_no?: string
    remark?: string
    created_at: string
}

/** 积分记录 */
export interface PointRecord {
    id: number
    user_id: number
    points: number
    balance: number
    type: string
    reason: string
    created_at: string
}

/** 交易记录 */
export interface Transaction {
    id: number
    user_id: number
    type: string
    amount: number
    points?: number
    description?: string
    related_id?: number
    related_type?: string
    created_at: string
}

/**
 * 获取我的会员卡
 * @param userId - 用户ID
 */
/**
 * 获取我的会员卡
 * @param userId - 用户ID
 */
export const getMyMemberCard = (userId: number) => {
    return get<MemberCard>(`/member_cards/users/${userId}`)
}

/**
 * 获取会员卡充值记录
 * @param cardId - 会员卡ID
 */
export const getRechargeRecords = (cardId: number) => {
    return get<RechargeRecord[]>(`/member_cards/${cardId}/recharge_records`)
}

/**
 * 创建会员卡充值支付
 * @param cardId - 会员卡ID
 * @param amount - 充值金额
 */
export const createCardRechargePayment = (cardId: number, amount: number) => {
    return post(`/member_cards/${cardId}/payment/create`, { amount })
}

/**
 * 查询充值支付状态
 * @param cardId - 会员卡ID
 * @param outTradeNo - 订单号
 */
export const queryRechargePaymentStatus = (cardId: number, outTradeNo: string) => {
    return get(`/member_cards/${cardId}/payment/${outTradeNo}/status`)
}

/**
 * 获取我的交易记录
 */
export const getMyTransactions = (params?: { skip?: number; limit?: number }) => {
    return get<Transaction[]>('/transactions/me', params)
}

/**
 * 获取我的积分
 */
export const getMyPoints = () => {
    return get<{ user_id: number; total_points: number }>('/transactions/me/points')
}

/**
 * 获取我的消费总额
 */
export const getMySpending = () => {
    return get<{ user_id: number; total_spending: number }>('/transactions/me/spending')
}
