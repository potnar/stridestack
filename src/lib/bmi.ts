export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese'

export function calculateBmi(weightKg: number, heightM: number): string {
  return (weightKg / (heightM * heightM)).toFixed(1)
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

export const BMI_CATEGORY_COLORS: Record<BmiCategory, string> = {
  Underweight: 'text-blue-400',
  Normal: 'text-green-400',
  Overweight: 'text-amber-400',
  Obese: 'text-red-400',
}
