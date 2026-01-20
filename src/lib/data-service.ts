import * as db from '@/app/actions'
import * as local from '@/lib/storage'

// Use localStorage ONLY if NEXT_PUBLIC_DATA_SOURCE is explicitly 'localstorage'
const useLocal = process.env.NEXT_PUBLIC_DATA_SOURCE === 'localstorage';

export const addWeightEntry = async (weight: number, date?: string) => {
  if (useLocal) return local.addWeightEntryLocal(weight, date);
  return await db.addWeightEntry(weight, date);
}

export const getEarliestWeightDate = async () => {
  if (useLocal) return local.getEarliestWeightDateLocal();
  const date = await db.getEarliestWeightDate();
  return date.toISOString();
}

export const addActivityEntry = async (type: string, distance: number, date?: string) => {
  if (useLocal) return local.addActivityEntryLocal(type, distance, date);
  return await db.addActivityEntry(type, distance, date);
}

export const getDashboardData = async () => {
  if (useLocal) return local.getDashboardDataLocal();
  return await db.getDashboardData();
}

export const getWeightHistory = async (startDate: Date, endDate: Date) => {
  if (useLocal) return local.getWeightHistoryLocal(startDate, endDate);
  return await db.getWeightHistory(startDate, endDate);
}

export const deleteWeightEntry = async (id: string) => {
  if (useLocal) return local.deleteWeightEntryLocal(id);
  return await db.deleteWeightEntry(id);
}
