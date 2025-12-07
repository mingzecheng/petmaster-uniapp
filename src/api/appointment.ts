/**
 * @description 预约管理API
 */

import { get, post, put, del } from '@/utils/request'

/** 预约状态 */
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

/** 预约信息 */
export interface Appointment {
    id: number
    pet_id: number
    service_id: number
    appointment_time: string
    status: AppointmentStatus
    notes?: string
    created_at: string
    updated_at?: string
    pet?: {
        id: number
        name: string
        species: string
    }
    service?: {
        id: number
        name: string
        price: number
    }
}

/** 创建预约参数 */
export interface AppointmentCreate {
    pet_id: number
    service_id: number
    appointment_time: string
    notes?: string
}

/** 更新预约参数 */
export interface AppointmentUpdate {
    appointment_time?: string
    notes?: string
}

/**
 * 获取预约列表
 */
/**
 * 获取预约列表
 */
export const getAppointments = (params?: { skip?: number; limit?: number; pet_id?: number; status?: AppointmentStatus }) => {
    return get<Appointment[]>('/appointments/', params)
}

/**
 * 获取预约详情
 * @param appointmentId - 预约ID
 */
export const getAppointmentDetail = (appointmentId: number) => {
    return get<Appointment>(`/appointments/${appointmentId}`)
}

/**
 * 创建预约
 * @param data - 预约数据
 */
export const createAppointment = (data: AppointmentCreate) => {
    return post<Appointment>('/appointments/', data)
}

/**
 * 更新预约
 * @param appointmentId - 预约ID
 * @param data - 更新数据
 */
export const updateAppointment = (appointmentId: number, data: AppointmentUpdate) => {
    return put<Appointment>(`/appointments/${appointmentId}`, data)
}

/**
 * 取消预约
 * @param appointmentId - 预约ID
 */
export const cancelAppointment = (appointmentId: number) => {
    return del(`/appointments/${appointmentId}`)
}
