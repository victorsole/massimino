/**
 * Unit Tests for Workout Queries
 * Tests the database query functions for workout log operations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SetType, WeightUnit } from '@prisma/client';

// Import the functions after mocking
const {
  createWorkoutLogEntry,
  getWorkoutLogEntries,
  updateWorkoutLogEntry,
  deleteWorkoutLogEntry,
  getExercises,
  createExercise,
  getWorkoutStats
} = require('@/core/database');

// Mock Prisma client - must be done before importing the module
const mockPrisma = {
  workoutLogEntry: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  exercise: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  workoutSession: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn()
};

jest.mock('@/core/database/client', () => ({
  prisma: mockPrisma,
}));

describe('Workout Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkoutLogEntry', () => {
    it('should create a workout log entry with calculated fields', async () => {
      const mockEntry = {
        id: 'test-id',
        userId: 'user-id',
        exerciseId: 'exercise-id',
        date: new Date('2024-01-15'),
        order: '1',
        setNumber: 1,
        setType: SetType.STRAIGHT,
        reps: 8,
        weight: '135',
        unit: WeightUnit.LB,
        trainingVolume: 489.6, // 8 * 135 * 0.453592
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the transaction function to execute the callback
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          workoutLogEntry: {
            create: jest.fn().mockResolvedValue(mockEntry)
          },
          exercise: {
            update: jest.fn().mockResolvedValue({})
          }
        };
        return callback(mockTx);
      });

      const result = await createWorkoutLogEntry('user-id', {
        date: '2024-01-15',
        exerciseId: 'exercise-id',
        setNumber: 1,
        setType: SetType.STRAIGHT,
        reps: 8,
        weight: '135',
        unit: WeightUnit.LB,
      });

      expect(result).toEqual(mockEntry);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getWorkoutLogEntries', () => {
    it('should return workout entries with pagination', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          exercise: { name: 'Bench Press' },
          user: { id: 'user-1', name: 'Test User', role: 'CLIENT' },
        },
      ];

      mockPrisma.workoutLogEntry.count.mockResolvedValue(1);
      mockPrisma.workoutLogEntry.findMany.mockResolvedValue(mockEntries);

      const result = await getWorkoutLogEntries('user-id', {
        pagination: { page: 1, limit: 10 },
      });

      expect(result.entries).toEqual(mockEntries);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should apply filters correctly', async () => {
      mockPrisma.workoutLogEntry.count.mockResolvedValue(0);
      mockPrisma.workoutLogEntry.findMany.mockResolvedValue([]);

      await getWorkoutLogEntries('user-id', {
        filters: {
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
          exercises: ['exercise-1'],
          setTypes: [SetType.STRAIGHT],
        },
      });

      expect(mockPrisma.workoutLogEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-id',
            date: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31'),
            },
            exerciseId: { in: ['exercise-1'] },
            setType: { in: [SetType.STRAIGHT] },
          }),
        })
      );
    });
  });

  describe('updateWorkoutLogEntry', () => {
    it('should update a workout entry', async () => {
      const mockUpdatedEntry = {
        id: 'entry-id',
        reps: 10,
        weight: '140',
        trainingVolume: 635.03, // 10 * 140 * 0.453592
      };

      mockPrisma.workoutLogEntry.findFirst.mockResolvedValue({
        id: 'entry-id',
        weight: '135',
        reps: 8,
        unit: WeightUnit.LB,
        trainingVolume: 489.6,
      });
      mockPrisma.workoutLogEntry.update.mockResolvedValue(mockUpdatedEntry);

      const result = await updateWorkoutLogEntry('entry-id', 'user-id', {
        reps: 10,
        weight: '140',
      });

      expect(result).toEqual(mockUpdatedEntry);
      expect(mockPrisma.workoutLogEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-id' },
        data: expect.objectContaining({
          reps: 10,
          weight: '140',
          trainingVolume: expect.any(Number),
        }),
      });
    });

    it('should return null if entry not found', async () => {
      mockPrisma.workoutLogEntry.findFirst.mockResolvedValue(null);

      const result = await updateWorkoutLogEntry('entry-id', 'user-id', {
        reps: 10,
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteWorkoutLogEntry', () => {
    it('should delete a workout entry', async () => {
      mockPrisma.workoutLogEntry.deleteMany.mockResolvedValue({ count: 1 });

      const result = await deleteWorkoutLogEntry('entry-id', 'user-id');

      expect(result).toBe(true);
      expect(mockPrisma.workoutLogEntry.deleteMany).toHaveBeenCalledWith({
        where: { id: 'entry-id', userId: 'user-id' },
      });
    });

    it('should return false if entry not found', async () => {
      mockPrisma.workoutLogEntry.deleteMany.mockResolvedValue({ count: 0 });

      const result = await deleteWorkoutLogEntry('entry-id', 'user-id');

      expect(result).toBe(false);
    });
  });

  describe('getExercises', () => {
    it('should return exercises with optional filtering', async () => {
      const mockExercises = [
        {
          id: 'exercise-1',
          name: 'Bench Press',
          category: 'Compound',
          muscleGroups: ['chest'],
          equipment: ['barbell'],
        },
      ];

      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await getExercises({
        category: 'Compound',
        muscleGroups: ['chest'],
      });

      expect(result).toEqual(mockExercises);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          category: 'Compound',
          muscleGroups: { hasSome: ['chest'] },
        }),
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('createExercise', () => {
    it('should create a new exercise', async () => {
      const mockExercise = {
        id: 'exercise-1',
        name: 'New Exercise',
        category: 'Compound',
        muscleGroups: ['chest'],
        equipment: ['barbell'],
        difficulty: 'INTERMEDIATE',
      };

      mockPrisma.exercise.create.mockResolvedValue(mockExercise);

      const result = await createExercise({
        name: 'New Exercise',
        category: 'Compound',
        muscleGroups: ['chest'],
        equipment: ['barbell'],
        difficulty: 'INTERMEDIATE',
      });

      expect(result).toEqual(mockExercise);
      expect(mockPrisma.exercise.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Exercise',
          category: 'Compound',
          muscleGroups: ['chest'],
          equipment: ['barbell'],
          difficulty: 'INTERMEDIATE',
        }),
      });
    });
  });

  describe('getWorkoutStats', () => {
    it('should return workout statistics', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          trainingVolume: 100,
          reps: 8,
          exercise: { name: 'Bench Press' },
        },
        {
          id: 'entry-2',
          trainingVolume: 150,
          reps: 10,
          exercise: { name: 'Squat' },
        },
      ];

      mockPrisma.workoutLogEntry.findMany.mockResolvedValue(mockEntries);
      mockPrisma.workoutSession.findMany.mockResolvedValue([
        { duration: 3600 },
        { duration: 1800 },
      ]);

      const result = await getWorkoutStats('user-id');

      expect(result).toEqual({
        totalWorkouts: 1,
        totalVolume: 250,
        totalSets: 2,
        totalReps: 18,
        averageWorkoutDuration: 2700,
        mostUsedExercises: expect.any(Array),
        volumeByMuscleGroup: expect.any(Array),
      });
    });
  });
});
