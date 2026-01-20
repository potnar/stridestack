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

        // BMI Calculation (Assuming constant height 180cm from requirements)
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

interface Question {
    id: number
    text: string
    options: string[]
    correctAnswer: number // index 0-3
    explanation: string
}

export async function generateQuizQuestions(): Promise<Question[]> {
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
        console.warn("Missing OPENROUTER_API_KEY, returning mock data")
        return MOCK_QUESTIONS
    }

    const prompt = `
    Generate 5 recruitment interview questions for a Senior Fullstack Developer role.
    Tech stack: Node.js, Next.js (App Router), React, PostgreSQL, Stripe, Tpay.
    Focus on: Architecture, Security, Performance, and Advanced Patterns.
    
    Return ONLY valid JSON in the following format:
    [
      {
        "id": 1,
        "text": "Question text here?",
        "options": ["Answer A", "Answer B", "Answer C", "Answer D"],
        "correctAnswer": 0,
        "explanation": "Why A is correct..."
      }
    ]
    Do not wrap in markdown or code blocks. Just raw JSON.
  `

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free", // Using a likely free/cheap model, can be changed
                messages: [
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter API Error:", data);
            return MOCK_QUESTIONS;
        }

        const content = data.choices[0].message.content;
        // Clean up potential markdown code blocks if the model behaves poorly
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanContent);

    } catch (error) {
        console.error("Failed to generate quiz:", error);
        return MOCK_QUESTIONS;
    }
}

const MOCK_QUESTIONS: Question[] = [
    {
        id: 1,
        text: "Which pattern best prevents 'Waterfalling' in Next.js Server Components?",
        options: [
            "Using useEffect to fetch data",
            "Parallel data fetching with Promise.all()",
            "Using Redux for state management",
            "Wrapping components in React.memo()"
        ],
        correctAnswer: 1,
        explanation: "Parallel data fetching allows multiple independent requests to initiate simultaneously, reducing total load time."
    },
    {
        id: 2,
        text: "In PostgreSQL, what is the primary benefit of using an Index scan over a Sequential scan?",
        options: [
            "It always returns data sorted",
            "It requires less CPU for small tables",
            "It avoids reading the entire table for selective queries",
            "It automatically compresses the data"
        ],
        correctAnswer: 2,
        explanation: "Index scans allow directly locating specific rows without scanning the full table, drastically improving performance for selective queries."
    },
    {
        id: 3,
        text: "How should you securely handle Stripe Webhook events in a Next.js API route?",
        options: [
            "Trust the request body implicitly",
            "Verify the signature header using the raw request body",
            "Check the IP address of the sender",
            "Use a secret query parameter"
        ],
        correctAnswer: 1,
        explanation: "Stripe sends a signature header (stripe-signature) that must be verified against the raw request body to ensure the event was actually sent by Stripe."
    }
]
