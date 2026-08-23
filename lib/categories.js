// lib/categories.js
// Single source of truth for product categories — must match the <option> values
// in components/products/ProductFormModal.jsx (what a seller can actually pick).
// Filter UIs used to hardcode their own copy of this list per page, and some of
// them added a nonexistent 'etc' entry that no product can ever match.
export const PRODUCT_CATEGORIES = [
  'Industrial Machinery',
  'K-Beauty & Cosmetics',
  'K-Food & Beverages',
  'Electronics & Smart IT',
  'General Manufacturing'
];

export const FILTER_CATEGORIES = ['All', ...PRODUCT_CATEGORIES];
