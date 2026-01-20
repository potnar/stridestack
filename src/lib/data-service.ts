import * as db from '@/app/actions'
import * as local from '@/lib/storage'

// Helper to determine if we should fall back to local storage
const shouldFallback = (result: any) => {
  if (result === null) return true;
  if (result && typeof result === 'object' && result.success === false && 
     (result.error === 'DB not connected' || result.error === 'Failed to fetch dashboard data')) {
    return true;
  }
  return false;
}

export const addWeightEntry = async (weight: number, date?: string) => {
  try {
    const result = await db.addWeightEntry(weight, date);
    if (shouldFallback(result)) return local.addWeightEntryLocal(weight, date);
    return result;
  } catch (error) {
    console.warn("DB operation failed, falling back to local storage", error);
    return local.addWeightEntryLocal(weight, date);
  }
}

export const getEarliestWeightDate = async () => {
  try {
    const result = await db.getEarliestWeightDate();
    if (result === null) return local.getEarliestWeightDateLocal();
    return result.toISOString();
  } catch (error) {
    return local.getEarliestWeightDateLocal();
  }
}

export const addActivityEntry = async (type: string, distance: number, date?: string) => {
  try {
    const result = await db.addActivityEntry(type, distance, date);
    if (shouldFallback(result)) return local.addActivityEntryLocal(type, distance, date);
    return result;
  } catch (error) {
    return local.addActivityEntryLocal(type, distance, date);
  }
}

export const getDashboardData = async () => {
  try {
    const result = await db.getDashboardData();
    if (shouldFallback(result)) return local.getDashboardDataLocal();
    return result;
  } catch (error) {
    return local.getDashboardDataLocal();
  }
}

export const getWeightHistory = async (startDate: Date, endDate: Date) => {
  try {
    const result = await db.getWeightHistory(startDate, endDate);
    if (shouldFallback(result)) return local.getWeightHistoryLocal(startDate, endDate);
    return result;
  } catch (error) {
    return local.getWeightHistoryLocal(startDate, endDate);
  }
}

export const deleteWeightEntry = async (id: string) => {
  try {
    const result = await db.deleteWeightEntry(id);
    if (shouldFallback(result)) return local.deleteWeightEntryLocal(id);
    return result;
  } catch (error) {
    return local.deleteWeightEntryLocal(id);
  }
}
