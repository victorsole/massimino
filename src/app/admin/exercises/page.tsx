import { getExerciseRepository } from '@/services/repository/exercises'
import { getExerciseCategories, getMuscleGroups, getEquipmentTypes } from '@/core/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createExerciseAction, updateExerciseAction, deleteExerciseAction, syncExerciseFromFirestoreAction, importExercisesCsvAction, syncAllExercisesToFirestoreAction } from './actions'

type PageProps = { searchParams?: Promise<{ q?: string; page?: string; active?: string; sort?: string; dir?: 'asc'|'desc'; category?: string; difficulty?: string; muscle?: string; equipment?: string }> }

const DIFFICULTIES = ['BEGINNER','INTERMEDIATE','ADVANCED'] as const

export default async function AdminExercisesPage({ searchParams }: PageProps) {
  const urlParams = await searchParams
  const q = urlParams?.q?.trim() || ''
  const page = Math.max(parseInt(urlParams?.page || '1', 10) || 1, 1)
  const isActive = urlParams?.active ? urlParams.active === 'true' : undefined
  const pageSize = 20
  const repo = getExerciseRepository()
  const params: any = { page, pageSize }
  if (q) params.search = q
  if (isActive !== undefined) params.isActive = isActive
  if (urlParams?.sort) {
    params.orderBy = { field: urlParams.sort, direction: (urlParams.dir || 'asc') }
  }
  if (urlParams?.category) params.category = urlParams.category
  if (urlParams?.difficulty) params.difficulty = urlParams.difficulty
  if (urlParams?.muscle) params.muscle = urlParams.muscle
  if (urlParams?.equipment) params.equipment = urlParams.equipment
  const { items, total } = await repo.list(params)
  const hasPrev = page > 1
  const hasNext = page * pageSize < total

  // For filter selectors
  const [categories, muscles, equipmentList] = await Promise.all([
    getExerciseCategories(),
    getMuscleGroups(),
    getEquipmentTypes(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Exercises</h1>
          <p className="text-gray-600">Total: {total}</p>
        </div>
        <form className="flex items-center gap-2 flex-wrap" action="/admin/exercises" method="get">
          <div>
            <Input name="q" placeholder="Search name" defaultValue={q} className="w-64" />
          </div>
          <div>
            <select name="category" defaultValue={urlParams?.category || ''} className="border rounded px-2 py-2">
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <select name="muscle" defaultValue={urlParams?.muscle || ''} className="border rounded px-2 py-2">
              <option value="">All muscles</option>
              {muscles.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <select name="equipment" defaultValue={urlParams?.equipment || ''} className="border rounded px-2 py-2">
              <option value="">All equipment</option>
              {equipmentList.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <select name="difficulty" defaultValue={urlParams?.difficulty || ''} className="border rounded px-2 py-2">
              <option value="">All difficulties</option>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <select name="active" defaultValue={isActive === undefined ? '' : String(isActive)} className="border rounded px-2 py-2">
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Create Exercise</h2>
        <form action={createExerciseAction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input name="name" placeholder="Name" required />
          <Input name="category" placeholder="Category (e.g. Compound)" required />
          <select name="difficulty" className="border rounded px-2 py-2">
            {DIFFICULTIES.map(d => (<option key={d} value={d}>{d}</option>))}
          </select>
          <Input name="muscleGroups" placeholder="Muscle groups (comma-separated)" />
          <Input name="equipment" placeholder="Equipment (comma-separated)" />
          <Input name="imageUrl" placeholder="Image URL" />
          <Input name="videoUrl" placeholder="Video URL" />
          <textarea name="instructions" placeholder="Instructions" className="border rounded px-2 py-2 min-h-[80px]" />
          <textarea name="safetyNotes" placeholder="Safety notes" className="border rounded px-2 py-2 min-h-[80px]" />
          <div className="col-span-full">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4">
        {/* Quick Jump: filter by name via datalist */}
        <form action="/admin/exercises" method="get" className="flex items-center gap-2 flex-wrap">
          <Input name="q" list="exercise-names" placeholder="Quick find by name" className="w-80" />
          <datalist id="exercise-names">
            {items.slice(0,100).map((ex) => (
              <option key={ex.id} value={ex.name} />
            ))}
          </datalist>
          <Button type="submit" variant="secondary">Find</Button>
        </form>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Import CSV</h2>
        <form action={async (formData) => { await importExercisesCsvAction(formData); }} className="space-y-3">
          <div className="text-sm text-gray-600">Upload a CSV file or paste CSV content. Accepted columns: name or Exercise; category or Primary Exercise Classification; muscleGroups or multiple muscle columns; equipment or equipment columns; instructions; Short YouTube Demonstration; Difficulty Level; Posture.</div>
          <div className="flex items-center gap-3 flex-wrap">
            <input type="file" name="csvFile" accept=".csv" className="border rounded px-2 py-2" />
            <Button type="submit">Upload</Button>
          </div>
          <div>
            <textarea name="csvText" placeholder="Or paste CSV content here" className="w-full min-h-[140px] border rounded px-2 py-2"></textarea>
          </div>
          <Button type="submit" variant="outline">Import Pasted CSV</Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left w-8"></th>
              <th className="px-3 py-2 text-left">
                <a href={`/admin/exercises?${new URLSearchParams({ q, page: String(page), active: isActive === undefined ? '' : String(isActive), sort: 'name', dir: (urlParams?.sort==='name' && urlParams.dir==='asc') ? 'desc' : 'asc' })}`}>Name</a>
              </th>
              <th className="px-3 py-2 text-left">
                <a href={`/admin/exercises?${new URLSearchParams({ q, page: String(page), active: isActive === undefined ? '' : String(isActive), sort: 'category', dir: (urlParams?.sort==='category' && urlParams.dir==='asc') ? 'desc' : 'asc' })}`}>Category</a>
              </th>
              <th className="px-3 py-2 text-left">
                <a href={`/admin/exercises?${new URLSearchParams({ q, page: String(page), active: isActive === undefined ? '' : String(isActive), sort: 'difficulty', dir: (urlParams?.sort==='difficulty' && urlParams.dir==='asc') ? 'desc' : 'asc' })}`}>Difficulty</a>
              </th>
              <th className="px-3 py-2 text-left">Muscles</th>
              <th className="px-3 py-2 text-left">Equipment</th>
              <th className="px-3 py-2 text-left">
                <a href={`/admin/exercises?${new URLSearchParams({ q, page: String(page), active: isActive === undefined ? '' : String(isActive), sort: 'usageCount', dir: (urlParams?.sort==='usageCount' && urlParams.dir==='asc') ? 'desc' : 'asc' })}`}>Usage</a>
              </th>
              <th className="px-3 py-2 text-left">
                <a href={`/admin/exercises?${new URLSearchParams({ q, page: String(page), active: isActive === undefined ? '' : String(isActive), sort: 'updatedAt', dir: (urlParams?.sort==='updatedAt' && urlParams.dir==='asc') ? 'desc' : 'asc' })}`}>Updated</a>
              </th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(ex => (
              <tr key={ex.id} className="border-t align-top">
                <td className="px-3 py-2"><input type="checkbox" name="ids" value={ex.id} /></td>
                <td className="px-3 py-2 font-medium">{ex.name}</td>
                <td className="px-3 py-2">{ex.category}</td>
                <td className="px-3 py-2">{ex.difficulty}</td>
                <td className="px-3 py-2 max-w-[16rem] truncate" title={ex.muscleGroups.join(', ')}>{ex.muscleGroups.join(', ')}</td>
                <td className="px-3 py-2 max-w-[16rem] truncate" title={ex.equipment.join(', ')}>{ex.equipment.join(', ')}</td>
                <td className="px-3 py-2">{ex.usageCount}</td>
                <td className="px-3 py-2">{new Date(ex.updatedAt).toLocaleDateString()}</td>
                <td className="px-3 py-2">{ex.isActive ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 space-y-2">
                  <form action={updateExerciseAction} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input type="hidden" name="id" value={ex.id} />
                    <Input name="name" defaultValue={ex.name} />
                    <Input name="category" defaultValue={ex.category} />
                    <select name="difficulty" defaultValue={ex.difficulty} className="border rounded px-2 py-2">
                      {DIFFICULTIES.map(d => (<option key={d} value={d}>{d}</option>))}
                    </select>
                    <Input name="muscleGroups" defaultValue={ex.muscleGroups.join(', ')} />
                    <Input name="equipment" defaultValue={ex.equipment.join(', ')} />
                    <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={ex.isActive} /> Active</label>
                    <Input name="imageUrl" defaultValue={ex.imageUrl ?? ''} placeholder="Image URL" />
                    <Input name="videoUrl" defaultValue={ex.videoUrl ?? ''} placeholder="Video URL" />
                    <textarea name="instructions" defaultValue={ex.instructions ?? ''} className="border rounded px-2 py-2 min-h-[60px]" />
                    <textarea name="safetyNotes" defaultValue={ex.safetyNotes ?? ''} className="border rounded px-2 py-2 min-h-[60px]" />
                    <div className="col-span-full">
                      <Button type="submit" size="sm">Save</Button>
                    </div>
                  </form>
                  <form action={syncExerciseFromFirestoreAction} className="inline-flex">
                    <input type="hidden" name="id" value={ex.id} />
                    <Button type="submit" size="sm" variant="outline">Sync from Firestore</Button>
                  </form>
                  <form action={deleteExerciseAction} className="inline-flex">
                    <input type="hidden" name="id" value={ex.id} />
                    <Button type="submit" size="sm" variant="outline">Deactivate</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-2 p-3 border-t">
          <form action={syncAllExercisesToFirestoreAction} className="ml-auto">
            <Button type="submit" variant="secondary">Sync All to Firestore</Button>
          </form>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page} · Showing {items.length} of {total}
        </div>
        <div className="flex gap-2">
          <a className={`btn-outline ${!hasPrev ? 'pointer-events-none opacity-50' : ''}`} href={`/admin/exercises?${new URLSearchParams({ q, page: String(page - 1), active: isActive === undefined ? '' : String(isActive) })}`}>Prev</a>
          <a className={`btn-outline ${!hasNext ? 'pointer-events-none opacity-50' : ''}`} href={`/admin/exercises?${new URLSearchParams({ q, page: String(page + 1), active: isActive === undefined ? '' : String(isActive) })}`}>Next</a>
        </div>
      </div>
    </div>
  )
}
