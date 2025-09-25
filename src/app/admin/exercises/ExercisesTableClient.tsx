"use client"

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { bulkUpdateExercisesAction, syncExerciseFromFirestoreAction, updateExerciseAction, deleteExerciseAction, syncAllExercisesToFirestoreAction } from './actions'

type ExerciseItem = {
  id: string
  name: string
  category: string
  difficulty: string
  muscleGroups: string[]
  equipment: string[]
  imageUrl?: string | null
  videoUrl?: string | null
  instructions?: string | null
  safetyNotes?: string | null
  isActive: boolean
  updatedAt: string | Date
  usageCount?: number
}

export default function ExercisesTableClient({ items, q, page, isActive, sort, dir }: { items: ExerciseItem[]; q: string; page: number; isActive?: boolean; sort?: string; dir?: 'asc'|'desc' }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const allSelected = useMemo(() => items.length > 0 && items.every(i => selected[i.id]), [items, selected])

  const toggleAll = () => {
    const next: Record<string, boolean> = {}
    if (!allSelected) items.forEach(i => { next[i.id] = true })
    setSelected(next)
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelected(prev => ({ ...prev, [id]: checked }))
  }

  const buildSortHref = (field: string) => {
    const params = new URLSearchParams({ q, page: String(page), active: isActive === undefined ? '' : String(isActive), sort: field, dir: (sort===field && dir==='asc') ? 'desc' : 'asc' })
    return `/admin/exercises?${params.toString()}`
  }

  return (
    <form action={bulkUpdateExercisesAction}>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left w-8">
              <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} />
            </th>
            <th className="px-3 py-2 text-left"><a href={buildSortHref('name')}>Name</a></th>
            <th className="px-3 py-2 text-left"><a href={buildSortHref('category')}>Category</a></th>
            <th className="px-3 py-2 text-left"><a href={buildSortHref('difficulty')}>Difficulty</a></th>
            <th className="px-3 py-2 text-left">Muscles</th>
            <th className="px-3 py-2 text-left">Equipment</th>
            <th className="px-3 py-2 text-left"><a href={buildSortHref('usageCount')}>Usage</a></th>
            <th className="px-3 py-2 text-left"><a href={buildSortHref('updatedAt')}>Updated</a></th>
            <th className="px-3 py-2 text-left">Active</th>
            <th className="px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(ex => (
            <tr key={ex.id} className="border-t align-top">
              <td className="px-3 py-2"><input type="checkbox" name="ids" value={ex.id} checked={!!selected[ex.id]} onChange={(e) => toggleOne(ex.id, e.currentTarget.checked)} /></td>
              <td className="px-3 py-2 font-medium">{ex.name}</td>
              <td className="px-3 py-2">{ex.category}</td>
              <td className="px-3 py-2">{ex.difficulty}</td>
              <td className="px-3 py-2 max-w-[16rem] truncate" title={ex.muscleGroups.join(', ')}>{ex.muscleGroups.join(', ')}</td>
              <td className="px-3 py-2 max-w-[16rem] truncate" title={ex.equipment.join(', ')}>{ex.equipment.join(', ')}</td>
              <td className="px-3 py-2">{ex.usageCount ?? 0}</td>
              <td className="px-3 py-2">{new Date(ex.updatedAt).toLocaleDateString()}</td>
              <td className="px-3 py-2">{ex.isActive ? 'Yes' : 'No'}</td>
              <td className="px-3 py-2 space-y-2">
                <form action={updateExerciseAction} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input type="hidden" name="id" value={ex.id} />
                  <Input name="name" defaultValue={ex.name} />
                  <Input name="category" defaultValue={ex.category} />
                  <select name="difficulty" defaultValue={ex.difficulty} className="border rounded px-2 py-2">
                    {['BEGINNER','INTERMEDIATE','ADVANCED'].map(d => (<option key={d} value={d}>{d}</option>))}
                  </select>
                  <Input name="muscleGroups" defaultValue={ex.muscleGroups.join(', ')} />
                  <Input name="equipment" defaultValue={ex.equipment.join(', ')} />
                  <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={ex.isActive} /> Active</label>
                  <Input name="imageUrl" defaultValue={ex.imageUrl ?? ''} placeholder="Image URL" />
                  <Input name="videoUrl" defaultValue={ex.videoUrl ?? ''} placeholder="Video URL" />
                  <textarea name="instructions" defaultValue={ex.instructions ?? ''} className="border rounded px-2 py-2 min-h-[60px]" />
                  <textarea name="safetyNotes" defaultValue={ex.safetyNotes ?? ''} className="border rounded px-2 py-2 min-h-[60px]" />
                  <div className="col-span-full"><Button type="submit" size="sm">Save</Button></div>
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
        <select name="bulkAction" className="border rounded px-2 py-1">
          <option value="">Bulk action</option>
          <option value="setActive">Activate</option>
          <option value="deactivate">Deactivate</option>
          <option value="setDifficulty">Set difficulty</option>
        </select>
        <select name="difficulty" className="border rounded px-2 py-1">
          <option value="">Select difficulty</option>
          {['BEGINNER','INTERMEDIATE','ADVANCED'].map(d => (<option key={d} value={d}>{d}</option>))}
        </select>
        <Button type="submit" variant="outline">Apply</Button>
        <form action={syncAllExercisesToFirestoreAction} className="ml-auto">
          <Button type="submit" variant="secondary">Sync All to Firestore</Button>
        </form>
      </div>
    </form>
  )
}

