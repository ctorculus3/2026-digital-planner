// Stripe product IDs for each subscription tier
export const STUDENT_PRODUCT_ID = "prod_U02SnVjJ3i3Acb";
export const TEACHER_PRODUCT_ID = "prod_U1AUmfw6LA4Q1s";

export function isTeacherTier(productId: string | null): boolean {
  return productId === TEACHER_PRODUCT_ID;
}

export function isStudentTier(productId: string | null): boolean {
  return productId === STUDENT_PRODUCT_ID;
}
