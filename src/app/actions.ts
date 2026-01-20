'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addWeightEntry(weight: number, date?: string) {
    if (!prisma) return { success: false, error: 'DB not connected' }
    try {
        await prisma.weightEntry.create({
            data: {
                weight,
                date: date ? new Date(date) : new Date(),
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
    if (!prisma) return new Date()
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

export async function addActivityEntry(type: string, distance: number, date?: string) {
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

export async function getDashboardData() {
    if (!prisma) return null
    try {
        const [latestWeight, activities] = await Promise.all([
            prisma.weightEntry.findFirst({
                orderBy: { date: 'desc' },
            }),
            prisma.activityEntry.findMany(),
        ])

        const totalDistance = activities.reduce((acc: number, curr: { distance: number }) => acc + curr.distance, 0)
        const runDistance = activities.filter((a: { type: string }) => a.type === 'RUN').reduce((acc: number, curr: { distance: number }) => acc + curr.distance, 0)
        const bikeDistance = activities.filter((a: { type: string }) => a.type === 'BIKE').reduce((acc: number, curr: { distance: number }) => acc + curr.distance, 0)

        const heightM = 1.80
        const bmi = latestWeight ? (latestWeight.weight / (heightM * heightM)).toFixed(1) : '--'

        return {
            weight: latestWeight?.weight ?? '--',
            bmi,
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
    if (!prisma) return []
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

export async function deleteWeightEntry(id: string) {
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

export async function generateQuizQuestions() {
    // This could still use an AI API regardless of DB
    return [] 
}
