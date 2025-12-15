/**
 * @description 订单管理API
 */

import { get } from '@/utils/request'

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
    total_amount: number
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
