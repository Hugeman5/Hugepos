
import { type Settings } from './settingsRepo';

export function getRateForCategory(categoryId: string | undefined, settings: Settings): number {
  const defaultRate = settings.vat.defaultRate;
  if (!categoryId) {
    return defaultRate;
  }
  return settings.vat.categories[categoryId] ?? defaultRate;
}
