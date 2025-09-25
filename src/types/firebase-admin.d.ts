declare module 'firebase-admin' {
  const anyExport: any
  export default anyExport
  export const credential: any
  export function initializeApp(options?: any): any
  export function getApps(): any[]
  export function firestore(): any
}

declare module 'firebase-admin/firestore' {
  export type Firestore = any
}

