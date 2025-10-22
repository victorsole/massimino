// src/app/exercises/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Dumbbell, 
  Play, 
  Image as ImageIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Exercise } from '@/types/workout';

interface ExerciseFilters {
  search: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
}

interface ExerciseStats {
  totalExercises: number;
  categories: string[];
  muscleGroups: string[];
  equipment: string[];
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [myExercises, setMyExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [stats, setStats] = useState<ExerciseStats>({
    totalExercises: 0,
    categories: [],
    muscleGroups: [],
    equipment: []
  });
  const [filters, setFilters] = useState<ExerciseFilters>({
    search: '',
    category: 'all',
    muscleGroup: 'all',
    equipment: 'all',
    difficulty: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [activeTab, setActiveTab] = useState<'all'|'mine'>(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      return url.searchParams.get('view') === 'my' ? 'mine' : 'all'
    }
    return 'all'
  });
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaForm, setMediaForm] = useState<{ provider: string; url: string; title?: string }>({ provider: 'youtube', url: '' });
  const [targetRef, setTargetRef] = useState<{ type: 'global'|'user'; id: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    category: '',
    muscleGroups: '',
    equipment: '',
    difficulty: 'BEGINNER',
    instructions: '',
    safetyNotes: '',
    visibility: 'private',
  });
  const [linkModal, setLinkModal] = useState<{ userExerciseId: string; name: string } | null>(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkResults, setLinkResults] = useState<Exercise[]>([]);

  // Fetch exercises and stats
  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    // Load user's library if authenticated; ignore errors silently
    fetch('/api/workout/my_exercises').then(r => r.ok ? r.json() : []).then(setMyExercises).catch(() => setMyExercises([]))
  }, []);

  // Fetch stats after exercises are loaded
  useEffect(() => {
    if (exercises.length > 0) {
      fetchStats();
    }
  }, [exercises]);

  // Filter exercises when filters change
  useEffect(() => {
    filterExercises();
  }, [exercises, filters]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workout/exercises');
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [categoriesRes, muscleGroupsRes, equipmentRes] = await Promise.all([
        fetch('/api/workout/exercises?categories=true'),
        fetch('/api/workout/exercises?muscleGroups=true'),
        fetch('/api/workout/exercises?equipment=true')
      ]);

      const categories = categoriesRes.ok ? await categoriesRes.json() : [];
      const muscleGroups = muscleGroupsRes.ok ? await muscleGroupsRes.json() : [];
      const equipment = equipmentRes.ok ? await equipmentRes.json() : [];

      setStats(prevStats => ({
        ...prevStats,
        totalExercises: exercises.length,
        categories,
        muscleGroups,
        equipment
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterExercises = () => {
    const source = activeTab === 'mine' ? (myExercises as any[]) : (exercises as any[]);
    let filtered = source;

    if (filters.search) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        exercise.category.toLowerCase().includes(filters.search.toLowerCase()) ||
        exercise.muscleGroups.some(mg => mg.toLowerCase().includes(filters.search.toLowerCase())) ||
        exercise.equipment.some(eq => eq.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === filters.category);
    }

    if (filters.muscleGroup && filters.muscleGroup !== 'all') {
      filtered = filtered.filter(exercise => 
        exercise.muscleGroups.includes(filters.muscleGroup)
      );
    }

    if (filters.equipment && filters.equipment !== 'all') {
      filtered = filtered.filter(exercise => 
        exercise.equipment.includes(filters.equipment)
      );
    }

    if (filters.difficulty && filters.difficulty !== 'all') {
      filtered = filtered.filter(exercise => exercise.difficulty === filters.difficulty);
    }

    setFilteredExercises(filtered as Exercise[]);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      muscleGroup: 'all',
      equipment: 'all',
      difficulty: 'all'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'compound': return 'bg-blue-100 text-blue-800';
      case 'isolation': return 'bg-purple-100 text-purple-800';
      case 'cardio': return 'bg-orange-100 text-orange-800';
      case 'mobility': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExercises = filteredExercises.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exercise Database</h1>
        <p className="text-gray-600">
          Browse and search through our comprehensive database of fitness exercises
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant={activeTab==='all' ? 'default' : 'outline'} onClick={() => setActiveTab('all')}>All Exercises</Button>
          <Button variant={activeTab==='mine' ? 'default' : 'outline'} onClick={() => setActiveTab('mine')}>My Exercise Library</Button>
          {activeTab==='mine' && (
            <Button onClick={() => setShowCreateModal(true)}>Create Exercise</Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Dumbbell className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exercises</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExercises}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">C</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">M</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Muscle Groups</p>
                <p className="text-2xl font-bold text-gray-900">{stats.muscleGroups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">E</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Equipment Types</p>
                <p className="text-2xl font-bold text-gray-900">{stats.equipment.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search exercises..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {stats.categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Muscle Group</label>
              <Select
                value={filters.muscleGroup}
                onValueChange={(value) => setFilters(prev => ({ ...prev, muscleGroup: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All muscle groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All muscle groups</SelectItem>
                  {stats.muscleGroups.map(muscleGroup => (
                    <SelectItem key={muscleGroup} value={muscleGroup}>
                      {muscleGroup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Equipment</label>
              <Select
                value={filters.equipment}
                onValueChange={(value) => setFilters(prev => ({ ...prev, equipment: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All equipment</SelectItem>
                  {stats.equipment.map(equipment => (
                    <SelectItem key={equipment} value={equipment}>
                      {equipment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty</label>
              <Select
                value={filters.difficulty}
                onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {filteredExercises.length} of {exercises.length} exercises
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button variant="outline" onClick={fetchExercises}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exercise Database</CardTitle>
          <CardDescription>
            Browse through our comprehensive collection of fitness exercises
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading exercises...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Muscle Groups</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentExercises.map((exercise) => (
                      <TableRow key={exercise.id}>
                        <TableCell className="font-medium">{exercise.name}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(exercise.category)}>
                            {exercise.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {exercise.muscleGroups.slice(0, 2).map((muscleGroup, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {muscleGroup}
                              </Badge>
                            ))}
                            {exercise.muscleGroups.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{exercise.muscleGroups.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {exercise.equipment.slice(0, 2).map((equipment, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {equipment}
                              </Badge>
                            ))}
                            {exercise.equipment.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{exercise.equipment.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDifficultyColor(exercise.difficulty)}>
                            {exercise.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {exercise.usageCount} times
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedExercise(exercise)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {activeTab === 'all' && (
                              <Button size="sm" onClick={async () => {
                                await fetch('/api/workout/my_exercises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseExerciseId: (exercise as any).id, name: exercise.name, category: exercise.category, muscleGroups: exercise.muscleGroups, equipment: exercise.equipment, difficulty: exercise.difficulty }) })
                                const res = await fetch('/api/workout/my_exercises');
                                if (res.ok) setMyExercises(await res.json())
                              }}>Add to My Library</Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => { setTargetRef({ type: activeTab==='mine' ? 'user' : 'global', id: (exercise as any).id }); setShowMediaModal(true) }}>+ Media</Button>
                            {activeTab === 'mine' && !(exercise as any).baseExerciseId && (
                              <Button variant="outline" size="sm" onClick={() => {
                                setLinkModal({ userExerciseId: (exercise as any).id, name: exercise.name });
                                setLinkSearch(exercise.name);
                                setLinkResults([]);
                              }}>Link</Button>
                            )}
                            {exercise.videoUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">
                                  <Play className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {exercise.imageUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={exercise.imageUrl} target="_blank" rel="noopener noreferrer">
                                  <ImageIcon className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredExercises.length)} of {filteredExercises.length} exercises
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Go to page:</span>
                      <Input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= totalPages) {
                            goToPage(page);
                          }
                        }}
                        className="w-20 h-8"
                      />
                      <span className="text-sm text-gray-600">of {totalPages}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    
                    <div className="flex items-center space-x-1">
                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(1)}
                          >
                            1
                          </Button>
                          {currentPage > 4 && <span className="text-gray-500">...</span>}
                        </>
                      )}
                      
                      {/* Current page and nearby pages */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        
                        if (page < 1 || page > totalPages) return null;
                        
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      
                      {/* Last page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && <span className="text-gray-500">...</span>}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedExercise.name}</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setSelectedExercise(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Category</h4>
                  <Badge className={getCategoryColor(selectedExercise.category)}>
                    {selectedExercise.category}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Difficulty</h4>
                  <Badge className={getDifficultyColor(selectedExercise.difficulty)}>
                    {selectedExercise.difficulty}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Muscle Groups</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.muscleGroups.map((muscleGroup, index) => (
                    <Badge key={index} variant="outline">
                      {muscleGroup}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Equipment</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.equipment.map((equipment, index) => (
                    <Badge key={index} variant="secondary">
                      {equipment}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedExercise.instructions && (
                <div>
                  <h4 className="font-semibold mb-2">Instructions</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedExercise.instructions}
                  </p>
                </div>
              )}

              {selectedExercise.safetyNotes && (
                <div>
                  <h4 className="font-semibold mb-2">Safety Notes</h4>
                  <p className="text-red-700 whitespace-pre-wrap">
                    {selectedExercise.safetyNotes}
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                {selectedExercise.videoUrl && (
                  <Button asChild>
                    <a href={selectedExercise.videoUrl} target="_blank" rel="noopener noreferrer">
                      <Play className="h-4 w-4 mr-2" />
                      Watch Video
                    </a>
                  </Button>
                )}
                {selectedExercise.imageUrl && (
                  <Button variant="outline" asChild>
                    <a href={selectedExercise.imageUrl} target="_blank" rel="noopener noreferrer">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      View Image
                    </a>
                  </Button>
                )}
                <Button variant="outline" onClick={() => { setTargetRef({ type: activeTab==='mine' ? 'user' : 'global', id: (selectedExercise as any).id }); setShowMediaModal(true) }}>Add Media</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Media Modal */}
      {showMediaModal && targetRef && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Add Media</CardTitle>
              <CardDescription>Link Instagram/TikTok/YouTube URLs to this exercise.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm block mb-1">Provider</label>
                <Select value={mediaForm.provider} onValueChange={(v) => setMediaForm(prev => ({ ...prev, provider: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm block mb-1">URL</label>
                <Input placeholder="https://..." value={mediaForm.url} onChange={(e) => setMediaForm(prev => ({ ...prev, url: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMediaModal(false)}>Cancel</Button>
                <Button onClick={async () => {
                  const endpoint = targetRef.type === 'global' ? `/api/workout/exercises/${targetRef.id}/media` : `/api/workout/my_exercises/${targetRef.id}/media`
                  await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mediaForm) })
                  setShowMediaModal(false)
                }}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Link to Global Exercise Modal */}
      {linkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-xl w-full">
            <CardHeader>
              <CardTitle>Link “{linkModal.name}” to a global exercise</CardTitle>
              <CardDescription>Select the closest match from the global database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-10" placeholder="Search global exercises..." value={linkSearch} onChange={async (e)=>{
                  const v = e.target.value; setLinkSearch(v);
                  if (v.trim().length >= 2) {
                    const r = await fetch(`/api/workout/exercises?search=${encodeURIComponent(v)}&limit=10`);
                    const data = r.ok ? await r.json() : [];
                    setLinkResults(Array.isArray(data) ? data : []);
                  } else {
                    setLinkResults([]);
                  }
                }} />
              </div>
              <div className="max-h-64 overflow-auto border rounded">
                {linkResults.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">No results. Try another search.</div>
                ) : linkResults.map((ex: any) => (
                  <div key={ex.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0" onClick={async ()=>{
                    await fetch(`/api/workout/my_exercises/${linkModal.userExerciseId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ baseExerciseId: ex.id }) });
                    const res = await fetch('/api/workout/my_exercises'); if (res.ok) setMyExercises(await res.json());
                    setLinkModal(null);
                  }}>
                    <div className="font-medium">{ex.name}</div>
                    <div className="text-xs text-gray-500">{ex.category} • {(ex.muscleGroups||[]).slice(0,2).join(', ')}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setLinkModal(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Exercise Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Create Exercise</CardTitle>
              <CardDescription>Add a custom exercise to My Exercise Library.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Name</label>
                  <Input value={createForm.name} onChange={(e)=>setCreateForm({...createForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm">Category</label>
                  <Input value={createForm.category} onChange={(e)=>setCreateForm({...createForm, category: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm">Muscle Groups (comma)</label>
                  <Input value={createForm.muscleGroups} onChange={(e)=>setCreateForm({...createForm, muscleGroups: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm">Equipment (comma)</label>
                  <Input value={createForm.equipment} onChange={(e)=>setCreateForm({...createForm, equipment: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm">Difficulty</label>
                  <Select value={createForm.difficulty} onValueChange={(v)=>setCreateForm({...createForm, difficulty: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Visibility</label>
                  <Select value={createForm.visibility} onValueChange={(v)=>setCreateForm({...createForm, visibility: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="followers">Followers</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm">Instructions</label>
                  <Input value={createForm.instructions} onChange={(e)=>setCreateForm({...createForm, instructions: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm">Safety Notes</label>
                  <Input value={createForm.safetyNotes} onChange={(e)=>setCreateForm({...createForm, safetyNotes: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setShowCreateModal(false)}>Cancel</Button>
                <Button onClick={async ()=>{
                  const payload = {
                    name: createForm.name,
                    category: createForm.category || 'Other',
                    muscleGroups: createForm.muscleGroups.split(',').map(s=>s.trim()).filter(Boolean),
                    equipment: createForm.equipment.split(',').map(s=>s.trim()).filter(Boolean),
                    difficulty: createForm.difficulty,
                    instructions: createForm.instructions || undefined,
                    safetyNotes: createForm.safetyNotes || undefined,
                    visibility: createForm.visibility,
                  };
                  const res = await fetch('/api/workout/my_exercises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (res.ok) {
                    const list = await fetch('/api/workout/my_exercises');
                    if (list.ok) setMyExercises(await list.json());
                    setShowCreateModal(false);
                    setCreateForm({ name:'', category:'', muscleGroups:'', equipment:'', difficulty:'BEGINNER', instructions:'', safetyNotes:'', visibility:'private' });
                  }
                }}>Create</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
