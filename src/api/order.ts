/**
 * @description 订单管理API
 */

import { get, post } from '@/utils/request'

/** 订单状态 */
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'completed' | 'refunded'

/** 订单项 */
export interface OrderItem {
    id: number
    order_id: number
    product_id?: number
    product_name: string
    product_price: number
    quantity: number
    subtotal: number
    created_at: string
}

/** 订单 */
export interface Order {
    id: number
    order_no: string
    user_id: number
    payment_id?: number
    original_amount?: number
    points_used?: number
    points_discount?: number
    member_discount?: number
    total_amount: number
    paid_amount?: number  // 实际支付金额（从payment.amount获取）
    status: OrderStatus
    remark?: string
    created_at: string
    updated_at: string
    paid_at?: string
    completed_at?: string
}

/** 订单含明细 */
export interface OrderWithItems extends Order {
    items: OrderItem[]
}

/** 订单项创建请求 */
export interface OrderItemCreate {
    product_id: number
    quantity: number
}

/** 订单创建请求 */
export interface OrderCreateRequest {
    items: OrderItemCreate[]
    remark?: string
}

/** 取消订单请求 */
export interface CancelOrderRequest {
    reason?: string
}

/** 取消订单响应 */
export interface CancelOrderResponse {
    success: boolean
    message: string
    refund_amount?: string
    points_revoked: number
}

/**
 * 创建订单
 * @param request - 订单创建请求
 */
export const createOrder = (request: OrderCreateRequest) => {
    return post<OrderWithItems>('/orders/', request)
}

/**
 * 获取我的订单列表
 * @param params - 查询参数
 */
export const getMyOrders = (params?: { skip?: number; limit?: number }) => {
    return get<Order[]>('/orders/', params)
}

/**
 * 获取订单详情
 * @param orderId - 订单ID
 */
export const getOrderDetail = (orderId: number) => {
    return get<OrderWithItems>(`/orders/${orderId}`)
}

/**
 * 通过支付单号查询订单
 * @param outTradeNo - 支付单号
 */
export const getOrderByPayment = (outTradeNo: string) => {
    return get<OrderWithItems | null>(`/orders/payment/${outTradeNo}`)
}

/**
 * 取消订单
 * @param orderId - 订单ID
 * @param request - 取消请求
 */
export const cancelOrder = (orderId: number, request?: CancelOrderRequest) => {
    return post<CancelOrderResponse>(`/orders/${orderId}/cancel`, request || {})
}

