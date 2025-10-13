import { prisma } from '@/core/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createWorkoutTemplateAction,
  updateWorkoutTemplateAction,
  deleteWorkoutTemplateAction,
  createProgramTemplateAction,
  updateProgramTemplateAction,
  deleteProgramTemplateAction
} from './actions'

type PageProps = {
  searchParams?: Promise<{
    q?: string
    page?: string
    type?: 'workout' | 'program'
    active?: string
    category?: string
    difficulty?: string
  }>
}

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const
const CATEGORIES = ['Strength', 'Cardio', 'Flexibility', 'Compound', 'Isolation', 'HIIT', 'Yoga'] as const

export default async function AdminTemplatesPage({ searchParams }: PageProps) {
  const urlParams = await searchParams
  const q = urlParams?.q?.trim() || ''
  const page = Math.max(parseInt(urlParams?.page || '1', 10) || 1, 1)
  const templateType = urlParams?.type || 'workout'
  const isActive = urlParams?.active ? urlParams.active === 'true' : undefined
  const pageSize = 20

  const whereCondition: any = {}
  if (q) {
    whereCondition.name = { contains: q, mode: 'insensitive' }
  }
  if (isActive !== undefined) {
    whereCondition.isActive = isActive
  }
  if (urlParams?.category) {
    whereCondition.category = urlParams.category
  }
  if (urlParams?.difficulty) {
    whereCondition.difficulty = urlParams.difficulty
  }

  // Get workout templates
  const [workoutTemplates, workoutTotal] = await Promise.all([
    prisma.workoutTemplate.findMany({
      where: templateType === 'workout' ? whereCondition : { id: 'no-results' },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        exercises: {
          include: {
            exercise: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: {
            purchases: true,
            ratings: true
          }
        }
      },
      skip: templateType === 'workout' ? (page - 1) * pageSize : 0,
      take: templateType === 'workout' ? pageSize : 0,
      orderBy: { updatedAt: 'desc' }
    }),
    templateType === 'workout' ? prisma.workoutTemplate.count({ where: whereCondition }) : 0
  ])

  // Get program templates
  const [programTemplates, programTotal] = await Promise.all([
    prisma.programTemplate.findMany({
      where: templateType === 'program' ? whereCondition : { id: 'no-results' },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        workouts: {
          select: { name: true }
        },
        _count: {
          select: {
            subscriptions: true,
            ratings: true
          }
        }
      },
      skip: templateType === 'program' ? (page - 1) * pageSize : 0,
      take: templateType === 'program' ? pageSize : 0,
      orderBy: { updatedAt: 'desc' }
    }),
    templateType === 'program' ? prisma.programTemplate.count({ where: whereCondition }) : 0
  ])

  const total = templateType === 'workout' ? workoutTotal : programTotal
  const hasPrev = page > 1
  const hasNext = page * pageSize < total

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Templates Management</h1>
          <p className="text-gray-600">
            Workout Templates: {workoutTotal} | Program Templates: {programTotal}
          </p>
        </div>

        {/* Search and Filters */}
        <form className="flex items-center gap-2 flex-wrap" action="/admin/templates" method="get">
          <Input name="q" placeholder="Search templates" defaultValue={q} className="w-64" />
          <input type="hidden" name="type" value={templateType} />

          <select name="category" defaultValue={urlParams?.category || ''} className="border rounded px-2 py-2">
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select name="difficulty" defaultValue={urlParams?.difficulty || ''} className="border rounded px-2 py-2">
            <option value="">All difficulties</option>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select name="active" defaultValue={isActive === undefined ? '' : String(isActive)} className="border rounded px-2 py-2">
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      </div>

      <Tabs value={templateType} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workout" asChild>
            <a href={`/admin/templates?type=workout&q=${q}&page=1`}>
              Workout Templates ({workoutTotal})
            </a>
          </TabsTrigger>
          <TabsTrigger value="program" asChild>
            <a href={`/admin/templates?type=program&q=${q}&page=1`}>
              Program Templates ({programTotal})
            </a>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workout" className="space-y-6">
          {/* Create Workout Template */}
          <Card>
            <CardHeader>
              <CardTitle>Create Workout Template</CardTitle>
              <CardDescription>Add a new workout template to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createWorkoutTemplateAction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input name="name" placeholder="Template Name" required />
                <Input name="category" placeholder="Category" list="categories" />
                <datalist id="categories">
                  {CATEGORIES.map(c => <option key={c} value={c} />)}
                </datalist>

                <select name="difficulty" className="border rounded px-2 py-2" required>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <Input name="duration" placeholder="Duration (e.g., 45 minutes)" />
                <Input name="equipment" placeholder="Equipment (comma-separated)" />
                <Input name="price" type="number" step="0.01" placeholder="Price (optional)" />

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="isPublic" />
                    <span className="text-sm">Public Template</span>
                  </label>
                </div>

                <div className="col-span-full">
                  <textarea
                    name="description"
                    placeholder="Template Description"
                    className="w-full border rounded px-2 py-2 min-h-[80px]"
                  />
                </div>

                <div className="col-span-full">
                  <Button type="submit">Create Workout Template</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Workout Templates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Creator</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Difficulty</th>
                      <th className="px-3 py-2 text-left">Exercises</th>
                      <th className="px-3 py-2 text-left">Purchases</th>
                      <th className="px-3 py-2 text-left">Rating</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workoutTemplates.map(template => (
                      <tr key={template.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{template.name}</td>
                        <td className="px-3 py-2">{template.creator.name || template.creator.email}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline">{template.category || 'None'}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={template.difficulty === 'BEGINNER' ? 'default' : template.difficulty === 'INTERMEDIATE' ? 'secondary' : 'destructive'}>
                            {template.difficulty}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{template.exercises.length}</td>
                        <td className="px-3 py-2">{template._count.purchases}</td>
                        <td className="px-3 py-2">{template.rating ? `${template.rating.toFixed(1)} (${template._count.ratings})` : 'No ratings'}</td>
                        <td className="px-3 py-2">
                          <Badge variant={template.isActive ? 'default' : 'secondary'}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-2">
                            <form action={updateWorkoutTemplateAction} className="grid grid-cols-2 gap-2">
                              <input type="hidden" name="id" value={template.id} />
                              <Input name="name" defaultValue={template.name} className="text-xs" />
                              <Input name="category" defaultValue={template.category || ''} className="text-xs" />
                              <select name="difficulty" defaultValue={template.difficulty} className="border rounded px-1 py-1 text-xs">
                                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <Input name="duration" defaultValue={template.duration || ''} className="text-xs" />
                              <Input name="price" defaultValue={template.price || ''} type="number" step="0.01" className="text-xs" />
                              <div className="flex gap-1">
                                <label className="flex items-center text-xs">
                                  <input type="checkbox" name="isPublic" defaultChecked={template.isPublic} className="mr-1" />
                                  Public
                                </label>
                                <label className="flex items-center text-xs">
                                  <input type="checkbox" name="isActive" defaultChecked={template.isActive} className="mr-1" />
                                  Active
                                </label>
                              </div>
                              <div className="col-span-2">
                                <Button type="submit" size="sm" className="w-full">Update</Button>
                              </div>
                            </form>
                            <form action={deleteWorkoutTemplateAction} className="inline-flex">
                              <input type="hidden" name="id" value={template.id} />
                              <Button type="submit" size="sm" variant="outline" className="w-full">Deactivate</Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="program" className="space-y-6">
          {/* Create Program Template */}
          <Card>
            <CardHeader>
              <CardTitle>Create Program Template</CardTitle>
              <CardDescription>Add a new program template to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createProgramTemplateAction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input name="name" placeholder="Program Name" required />
                <Input name="category" placeholder="Category" list="categories" />
                <Input name="duration" placeholder="Duration (e.g., 12 weeks)" required />

                <select name="difficulty" className="border rounded px-2 py-2" required>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <Input name="price" type="number" step="0.01" placeholder="Price (optional)" />

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="isPublic" />
                    <span className="text-sm">Public Program</span>
                  </label>
                </div>

                <div className="col-span-full">
                  <textarea
                    name="description"
                    placeholder="Program Description"
                    className="w-full border rounded px-2 py-2 min-h-[80px]"
                  />
                </div>

                <div className="col-span-full">
                  <Button type="submit">Create Program Template</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Program Templates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Program Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Creator</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Difficulty</th>
                      <th className="px-3 py-2 text-left">Duration</th>
                      <th className="px-3 py-2 text-left">Workouts</th>
                      <th className="px-3 py-2 text-left">Subscriptions</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programTemplates.map(template => (
                      <tr key={template.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{template.name}</td>
                        <td className="px-3 py-2">{template.creator.name || template.creator.email}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline">{template.category || 'None'}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={template.difficulty === 'BEGINNER' ? 'default' : template.difficulty === 'INTERMEDIATE' ? 'secondary' : 'destructive'}>
                            {template.difficulty}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{template.duration}</td>
                        <td className="px-3 py-2">{template.workouts.length}</td>
                        <td className="px-3 py-2">{template._count.subscriptions}</td>
                        <td className="px-3 py-2">
                          <Badge variant={template.isActive ? 'default' : 'secondary'}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-2">
                            <form action={updateProgramTemplateAction} className="grid grid-cols-2 gap-2">
                              <input type="hidden" name="id" value={template.id} />
                              <Input name="name" defaultValue={template.name} className="text-xs" />
                              <Input name="category" defaultValue={template.category || ''} className="text-xs" />
                              <Input name="duration" defaultValue={template.duration} className="text-xs" />
                              <select name="difficulty" defaultValue={template.difficulty} className="border rounded px-1 py-1 text-xs">
                                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <Input name="price" defaultValue={template.price || ''} type="number" step="0.01" className="text-xs" />
                              <div className="flex gap-1">
                                <label className="flex items-center text-xs">
                                  <input type="checkbox" name="isPublic" defaultChecked={template.isPublic} className="mr-1" />
                                  Public
                                </label>
                                <label className="flex items-center text-xs">
                                  <input type="checkbox" name="isActive" defaultChecked={template.isActive} className="mr-1" />
                                  Active
                                </label>
                              </div>
                              <div className="col-span-2">
                                <Button type="submit" size="sm" className="w-full">Update</Button>
                              </div>
                            </form>
                            <form action={deleteProgramTemplateAction} className="inline-flex">
                              <input type="hidden" name="id" value={template.id} />
                              <Button type="submit" size="sm" variant="outline" className="w-full">Deactivate</Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page} · Showing {templateType === 'workout' ? workoutTemplates.length : programTemplates.length} of {total}
        </div>
        <div className="flex gap-2">
          <a
            className={`btn-outline ${!hasPrev ? 'pointer-events-none opacity-50' : ''}`}
            href={`/admin/templates?type=${templateType}&q=${q}&page=${page - 1}&active=${isActive === undefined ? '' : String(isActive)}`}
          >
            Previous
          </a>
          <a
            className={`btn-outline ${!hasNext ? 'pointer-events-none opacity-50' : ''}`}
            href={`/admin/templates?type=${templateType}&q=${q}&page=${page + 1}&active=${isActive === undefined ? '' : String(isActive)}`}
          >
            Next
          </a>
        </div>
      </div>
    </div>
  )
}