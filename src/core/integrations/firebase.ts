// Firebase Admin integration (optional)
// Initializes Firestore when env vars are present. Safe no-op otherwise.

let firestoreSingleton: any | null = null

function getFirebaseConfigFromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }
  if (!projectId || !clientEmail || !privateKey) return null
  return { projectId, clientEmail, privateKey }
}

export async function getFirestore(): Promise<any | null> {
  if (firestoreSingleton) return firestoreSingleton
  const cfg = getFirebaseConfigFromEnv()
  if (!cfg) return null

  try {
    const admin: any = await import('firebase-admin')
    const apps = admin.getApps?.() || []
    if (!apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: cfg.projectId,
          clientEmail: cfg.clientEmail,
          privateKey: cfg.privateKey,
        } as any),
      })
    }
    firestoreSingleton = admin.firestore()
    return firestoreSingleton
  } catch (err) {
    console.warn('Firebase Admin not available or failed to initialize:', err)
    return null
  }
}

export async function publishUserSummary(user: {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  reputationScore: number
  warningCount: number
  trainerVerified: boolean
  updatedAt?: Date
}) {
  const db = await getFirestore()
  if (!db) return
  const adminDocRef = db.collection('admin').doc('users').collection('items').doc(user.id)
  const userDocRef = db.collection('users').doc(user.email)
  const payload = {
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    reputationScore: user.reputationScore,
    warningCount: user.warningCount,
    trainerVerified: user.trainerVerified,
    updatedAt: (user.updatedAt ?? new Date()).toISOString(),
  }
  await adminDocRef.set(payload, { merge: true })
  await userDocRef.set(
    {
      // Mirror a simpler shape commonly used in Firestore
      email: user.email,
      name: user.name,
      admin: user.role === 'ADMIN',
      trainer: user.role === 'TRAINER' || user.role === 'ADMIN',
      trainer_verified: user.trainerVerified,
      created_at: new Date(),
      updated_at: new Date(),
    },
    { merge: true }
  )
}

export async function getFirestoreUserByEmail(email: string): Promise<{
  exists: boolean
  admin?: boolean
  trainer?: boolean
  trainer_verified?: boolean
  name?: string | null
  [key: string]: any
}> {
  const db = await getFirestore()
  if (!db) return { exists: false }
  const snap = await db.collection('users').doc(email).get()
  if (!snap.exists) return { exists: false }
  return { exists: true, ...(snap.data() as any) }
}

export async function publishExercise(ex: {
  id: string
  name: string
  category: string
  muscleGroups: string[]
  equipment: string[]
  difficulty: string
  instructions?: string | null
  safetyNotes?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  isActive?: boolean
  usageCount?: number
  lastUsed?: Date | null
}) {
  const db = await getFirestore()
  if (!db) return
  const docRef = db.collection('exercises').doc(ex.id)
  const keywords = Array.from(new Set([
    ex.name, ex.category, ...ex.muscleGroups, ...ex.equipment
  ].join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)))
  await docRef.set(
    {
      name: ex.name,
      category: ex.category,
      muscleGroups: ex.muscleGroups,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
      instructions: ex.instructions ?? null,
      safetyNotes: ex.safetyNotes ?? null,
      imageUrl: ex.imageUrl ?? null,
      videoUrl: ex.videoUrl ?? null,
      isActive: ex.isActive ?? true,
      usageCount: ex.usageCount ?? 0,
      lastUsed: ex.lastUsed ? ex.lastUsed : null,
      keywords,
      updated_at: new Date(),
    },
    { merge: true }
  )
}

export async function deleteExerciseDoc(id: string) {
  const db = await getFirestore()
  if (!db) return
  await db.collection('exercises').doc(id).set({ isActive: false, updated_at: new Date() }, { merge: true })
}

export async function getFirestoreExercise(id: string): Promise<any | null> {
  const db = await getFirestore()
  if (!db) return null
  const snap = await db.collection('exercises').doc(id).get()
  return snap.exists ? snap.data() : null
}

export async function publishAccreditedProvider(p: {
  id: string
  name: string
  country: string
  qualifications: string[]
  profileUrl?: string | null
  profilePath?: string | null
  slug?: string | null
  source?: string
  isActive?: boolean
}) {
  const db = await getFirestore()
  if (!db) return
  const docRef = db.collection('accredited_providers').doc(p.id)
  await docRef.set({
    name: p.name,
    country: p.country,
    qualifications: p.qualifications,
    profileUrl: p.profileUrl ?? null,
    profilePath: p.profilePath ?? null,
    slug: p.slug ?? null,
    source: p.source ?? 'EREPS',
    isActive: p.isActive ?? true,
    updated_at: new Date(),
  }, { merge: true })
}
