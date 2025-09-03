// Equipment category management utilities

export interface EquipmentCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get equipment category name from category ID
 */
export function getEquipmentCategoryName(categoryId: number | null, categories: EquipmentCategory[]): string {
  if (!categoryId) return 'OTHER';
  
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.name.toUpperCase() : 'OTHER';
}

/**
 * Get equipment category icon from category ID
 */
export function getEquipmentCategoryIcon(categoryId: number | null, categories: EquipmentCategory[]): string {
  if (!categoryId) return '🔧'; // Default OTHER icon
  
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.icon || '🔧' : '🔧';
}

/**
 * Get equipment category color from category ID
 */
export function getEquipmentCategoryColor(categoryId: number | null, categories: EquipmentCategory[]): string {
  if (!categoryId) return '#9E9E9E'; // Default OTHER color
  
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.color || '#9E9E9E' : '#9E9E9E';
}

/**
 * Group equipment by category and count
 */
export function groupEquipmentByCategory(equipment: Array<{ name: string; categoryId?: number; category_id?: number; [key: string]: any }>, categories: EquipmentCategory[] = []) {
  const categoryCounts: { [key: string]: number } = {};
  
  equipment.forEach(item => {
    // Handle both camelCase and snake_case field names
    const categoryId = item.categoryId || item.category_id;
    const categoryName = getEquipmentCategoryName(categoryId, categories);
    categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
  });
  
  return categoryCounts;
}

/**
 * Filter equipment by category
 */
export function filterEquipmentByCategory(
  equipment: Array<{ name: string; categoryId?: number; category_id?: number; [key: string]: any }>, 
  categoryName: string,
  categories: EquipmentCategory[] = []
) {
  if (!categoryName || categoryName === 'all') {
    return equipment;
  }
  
  return equipment.filter(item => {
    // Handle both camelCase and snake_case field names
    const categoryId = item.categoryId || item.category_id;
    const itemCategory = getEquipmentCategoryName(categoryId, categories);
    return itemCategory === categoryName;
  });
}

// Legacy functions for backward compatibility (deprecated)
/**
 * @deprecated Use getEquipmentCategoryName instead
 */
export function getEquipmentTypeFromName(categoryName: string): string {
  return categoryName ? categoryName.toUpperCase() : 'OTHER';
}

/**
 * @deprecated Use getEquipmentCategoryName instead
 */
export function getEquipmentTypeFromCategoryId(categoryId: number | null, categories: EquipmentCategory[]): string {
  return getEquipmentCategoryName(categoryId, categories);
}

/**
 * @deprecated Use getEquipmentCategoryIcon instead
 */
export function getEquipmentTypeIcon(type: string): string {
  // This is now just a fallback for legacy code
  const iconMap: { [key: string]: string } = {
    'DOZER': '🚜',
    'LOADER': '🏗️',
    'TRUCK': '🚛',
    'WATER TANKER': '💧',
    'ROLLER': '⚙️',
    'GRADER': '🛣️',
    'EXCAVATOR': '⛏️',
    'CRANE': '🏗️',
    'COMPACTOR': '🔨',
    'FORKLIFT': '📦',
    'TRACTOR': '🚜',
    'GENERATOR': '⚡',
    'COMPRESSOR': '💨',
    'PUMP': '🌊',
    'WELDER': '🔥',
    'OTHER': '🔧',
  };
  
  return iconMap[type] || '🔧';
}

/**
 * @deprecated Use getEquipmentCategoryColor instead
 */
export function getEquipmentTypeColor(type: string): string {
  // This is now just a fallback for legacy code
  const colorMap: { [key: string]: string } = {
    'DOZER': '#FF6B6B',
    'LOADER': '#4ECDC4',
    'TRUCK': '#45B7D1',
    'WATER TANKER': '#96CEB4',
    'ROLLER': '#FFEAA7',
    'GRADER': '#DDA0DD',
    'EXCAVATOR': '#FF8A80',
    'CRANE': '#FFB74D',
    'COMPACTOR': '#81C784',
    'FORKLIFT': '#64B5F6',
    'TRACTOR': '#A1887F',
    'GENERATOR': '#FFD54F',
    'COMPRESSOR': '#7986CB',
    'PUMP': '#4FC3F7',
    'WELDER': '#FF7043',
    'OTHER': '#9E9E9E',
  };
  
  return colorMap[type] || '#9E9E9E';
}

/**
 * @deprecated Use groupEquipmentByCategory instead
 */
export function groupEquipmentByType(equipment: Array<{ name: string; categoryId?: number; [key: string]: any }>, categories: EquipmentCategory[] = []) {
  return groupEquipmentByCategory(equipment, categories);
}

/**
 * @deprecated Use filterEquipmentByCategory instead
 */
export function filterEquipmentByType(
  equipment: Array<{ name: string; categoryId?: number; [key: string]: any }>, 
  type: string,
  categories: EquipmentCategory[] = []
) {
  return filterEquipmentByCategory(equipment, type, categories);
}
