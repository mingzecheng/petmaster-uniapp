/**
 * @description 支付管理API
 */

import { get, post } from '@/utils/request'

/** 支付状态 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

/** 支付方式 */
export type PaymentMethod = 'alipay' | 'wechat'

/** 创建支付请求参数 */
export interface PaymentCreate {
    amount: number
    subject: string
    description?: string
    related_id?: number
    related_type?: string
}

/** 支付请求响应 */
export interface PaymentResponse {
    payment_id: number
    out_trade_no: string
    amount: number
    subject: string
    qr_code?: string
    pay_url: string
    status: string
    message: string
}

/** 支付状态响应 */
export interface PaymentStatusResponse {
    out_trade_no: string
    status: PaymentStatus
    is_paid?: boolean
    amount: string
    subject?: string  // 新增
    description?: string  // 新增
    created_at: string
    paid_at?: string
}

/**
 * 创建支付请求（Mock模式）
 * @param data - 支付数据
 */
export const createPayment = (data: PaymentCreate) => {
    return post<PaymentResponse>('/payments/create', data)
}

/**
 * 创建支付宝支付请求（已弃用，保留向后兼容）
 * @deprecated 请使用 createPayment 代替
 */
export const createAlipayPayment = createPayment

/**
 * 查询支付状态
 * @param outTradeNo - 商户订单号
 */
export const queryPaymentStatus = (outTradeNo: string) => {
    return get<PaymentStatusResponse>(`/payments/${outTradeNo}/status`)
}

/**
 * 轮询支付状态（轻量版）
 * @param outTradeNo - 商户订单号
 */
export const pollPaymentStatus = (outTradeNo: string) => {
    return get<PaymentStatusResponse>(`/payments/${outTradeNo}/poll`)
}

/** 支付记录 */
export interface PaymentRecord {
    id: number
    user_id: number
    out_trade_no: string
    amount: string
    subject: string
    description?: string
    status: PaymentStatus
    payment_method: PaymentMethod
    related_id?: number
    related_type?: string
    created_at: string
    paid_at?: string
}

/**
 * 获取我的支付记录
 * @param params - 查询参数
 */
export const getPaymentRecords = (params?: { skip?: number; limit?: number }) => {
    return get<PaymentRecord[]>('/payments/', params)
}

/** 组合支付请求参数 */
export interface CombinedPaymentRequest {
    amount: number
    subject: string
    related_id: number
    related_type: 'appointment' | 'boarding' | 'product'
    use_card_balance?: boolean  // 是否使用会员卡余额，默认true
    use_points?: number  // 使用积分数量，默认0
}

/** 组合支付响应 */
export interface CombinedPaymentResponse {
    points_used: number
    points_deduction: number
    card_used: number
    alipay_amount: number
    pay_url?: string
    out_trade_no?: string
    payment_id?: number
    fully_paid: boolean
}

/**
 * 创建组合支付（会员卡余额+支付宝）
 * @param data - 支付数据
 */
export const createCombinedPayment = (data: CombinedPaymentRequest) => {
    return post<CombinedPaymentResponse>('/payments/combined', data)
}
