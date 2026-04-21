import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FREE_MONTHLY_LIMIT = 3;
export const PRO_PRICE_USD = 9;
