'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { DashboardData, ActionResult } from "@/types"
import { USER_HEIGHT_M } from "@/lib/config"
import { calculateBmi, getBmiCategory } from "@/lib/bmi"

export async function addWeightEntry(weight: number, date?: string): Promise<ActionResult> {
    if (!prisma) return { success: false, error: 'DB not connected' }
    try {
        const targetDate = date ? new Date(date) : new Date()
        
        // Setup start and end of the target day
        const startOfDay = new Date(targetDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(targetDate)
        endOfDay.setHours(23, 59, 59, 999)

        // Check if entry already exists for this day
        const existing = await prisma.weightEntry.findFirst({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        })

        if (existing) {
            return { success: false, error: 'ALREADY_EXISTS' }
        }

        await prisma.weightEntry.create({
            data: {
                weight,
                date: targetDate,
            },
        })
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Failed to add weight entry:', error)
        return { success: false, error: 'Failed to add entry' }
    }
}

export async function getEarliestWeightDate() {
    if (!prisma) return null
    try {
        const firstEntry = await prisma.weightEntry.findFirst({
            orderBy: { date: 'asc' },
        })
        return firstEntry?.date ?? new Date()
    } catch (error) {
        console.error('Failed to fetch earliest weight date:', error)
        return new Date()
    }
}

export async function addActivityEntry(type: string, distance: number, date?: string): Promise<ActionResult> {
    if (!prisma) return { success: false, error: 'DB not connected' }
    try {
        await prisma.activityEntry.create({
            data: {
                type,
                distance,
                date: date ? new Date(date) : new Date(),
            },
        })
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Failed to add activity entry:', error)
        return { success: false, error: 'Failed to add entry' }
    }
}

export async function getDashboardData(): Promise<DashboardData | null> {
    if (!prisma) return null
    try {
        const [latestWeight, activities, user] = await Promise.all([
            prisma.weightEntry.findFirst({
                orderBy: { date: 'desc' },
            }),
            prisma.activityEntry.findMany(),
            prisma.user.findFirst(),
        ])

        const totalDistance = activities.reduce((acc: number, curr: { distance: number }) => acc + curr.distance, 0)
        const runDistance = activities.filter((a: { type: string }) => a.type === 'RUN').reduce((acc: number, curr: { distance: number }) => acc + curr.distance, 0)
        const bikeDistance = activities.filter((a: { type: string }) => a.type === 'BIKE').reduce((acc: number, curr: { distance: number }) => acc + curr.distance, 0)

        const heightM = user?.heightM ?? USER_HEIGHT_M
        const bmiValue = latestWeight ? calculateBmi(latestWeight.weight, heightM) : '--'
        const bmiCategory = latestWeight ? getBmiCategory(parseFloat(bmiValue)) : ''

        return {
            weight: latestWeight?.weight ?? '--',
            bmi: bmiValue,
            bmiCategory,
            userHeightM: heightM,
            totalDistance: Math.round(totalDistance),
            runDistance: Math.round(runDistance),
            bikeDistance: Math.round(bikeDistance),
            lastUpdated: Date.now(),
        }
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        return null
    }
}

export async function getWeightHistory(startDate: Date, endDate: Date) {
    if (!prisma) return null
    try {
        const entries = await prisma.weightEntry.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { date: 'asc' },
        })

        return entries.map((entry: { id: string; date: Date; weight: number }) => ({
            id: entry.id,
            date: entry.date.toISOString(),
            weight: entry.weight,
        }))
    } catch (error) {
        console.error('Failed to fetch weight history:', error)
        return []
    }
}

export async function updateUserHeight(heightM: number): Promise<ActionResult> {
    if (!prisma) return { success: false, error: 'DB not connected' }
    try {
        const user = await prisma.user.findFirst()
        if (user) {
            await prisma.user.update({ where: { id: user.id }, data: { heightM } })
        } else {
            await prisma.user.create({ data: { name: 'User', email: 'user@stridestack.app', heightM } })
        }
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Failed to update user height:', error)
        return { success: false, error: 'Failed to update height' }
    }
}

export async function deleteWeightEntry(id: string): Promise<ActionResult> {
    if (!prisma) return { success: false, error: 'DB not connected' }
    try {
        await prisma.weightEntry.delete({
            where: { id },
        })
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete weight entry:', error)
        return { success: false, error: 'Failed to delete entry' }
    }
}

