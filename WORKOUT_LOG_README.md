# Workout Log Feature for Massimino

A comprehensive workout tracking system that mirrors the Google Sheets functionality with enhanced UI and automated logic.

## 🎯 Overview

The Workout Log module provides an interactive, coach-client shared workout tracking system with the following key features:

- **Interactive Table Interface**: Real-time editing with inline form controls
- **Automated Calculations**: Training volume, order generation, and weight parsing
- **Role-Based Access**: Different permissions for coaches and clients
- **Advanced Filtering**: Date ranges, exercises, set types, and more
- **Coach Feedback System**: Inline feedback and comments
- **Statistics Dashboard**: Progress tracking and analytics

## 🏗️ Architecture

### Database Schema

The workout log system uses three main models:

1. **WorkoutLogEntry**: Individual workout sets with all performance data
2. **Exercise**: Exercise library with categories, muscle groups, and equipment
3. **WorkoutSession**: Container for grouping related workout entries

### Key Features

#### 1. Order Auto-Generation
- **Straight Sets**: 1, 2, 3, 4...
- **Supersets**: 1A, 1B, 2A, 2B...
- **Trisets**: 1A, 1B, 1C, 2A, 2B, 2C...
- **Giant Sets**: 1A, 1B, 1C, 1D...

#### 2. Weight Parsing
- Single weight: `40`
- Multiple weights: `40,45,50` (for pyramid/drop sets)
- Automatic average calculation for training volume

#### 3. Unit Conversion
- Automatic conversion between kg and lb
- All calculations stored in kg for consistency

#### 4. Training Volume Calculation
```
Volume = Sets × Reps × Average Weight (in kg)
```

## 🚀 Setup Instructions

### 1. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database with initial data
npm run db:seed
```

### 2. Environment Variables

Ensure these environment variables are set:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Dependencies

The workout log requires these additional packages:

```bash
npm install date-fns react-day-picker @radix-ui/react-tabs @radix-ui/react-popover
```

## 📊 API Endpoints

### Workout Entries
- `GET /api/workout/entries` - List workout entries with filtering
- `POST /api/workout/entries` - Create new workout entries
- `GET /api/workout/entries/[id]` - Get specific entry
- `PUT /api/workout/entries/[id]` - Update entry
- `DELETE /api/workout/entries/[id]` - Delete entry
- `PATCH /api/workout/entries/[id]` - Add coach feedback

### Exercises
- `GET /api/workout/exercises` - List exercises with search/filtering
- `POST /api/workout/exercises` - Create new exercise (trainers only)

### Workout Sessions
- `GET /api/workout/sessions` - List workout sessions
- `POST /api/workout/sessions` - Create new session
- `PATCH /api/workout/sessions/complete` - Complete session

## 🎨 UI Components

### Main Components

1. **WorkoutLogTable**: Interactive table with inline editing
2. **WorkoutLogPage**: Main page with tabs and statistics
3. **CoachFeedbackCell**: Inline feedback editing for coaches

### Key UI Features

- **Inline Editing**: Click to edit any field directly in the table
- **Filter Panel**: Collapsible filter controls
- **Sortable Columns**: Click headers to sort
- **Pagination**: Navigate through large datasets
- **Role-Based UI**: Different interfaces for coaches vs clients

## 🔧 Business Logic

### Set Type Configurations

Each set type has specific behavior:

```typescript
const SET_TYPE_CONFIGS = {
  STRAIGHT: {
    orderPattern: 'numeric',
    weightHandling: 'single',
  },
  SUPERSET: {
    orderPattern: 'grouped',
    maxGroupSize: 2,
    weightHandling: 'single',
  },
  PYRAMID: {
    orderPattern: 'numeric',
    weightHandling: 'progressive',
  },
  // ... more configurations
};
```

### Weight Handling

- **Single**: Regular weight input
- **Multiple**: Comma-separated for progressive sets
- **Progressive**: Automatic weight progression

### Order Generation

```typescript
const generateOrder = (setType: SetType, context: OrderGenerationContext): string => {
  const config = SET_TYPE_CONFIGS[setType];
  
  if (config.orderPattern === 'numeric') {
    return context.currentGroupNumber.toString();
  } else {
    return `${context.currentGroupNumber}${context.currentSubOrder}`;
  }
};
```

## 🎯 Usage Examples

### Creating a Workout Entry

```typescript
const entry = {
  date: '2024-01-15',
  exerciseId: 'exercise-id',
  setNumber: 1,
  setType: 'STRAIGHT',
  reps: 8,
  weight: '135',
  unit: 'LB',
  intensity: '75%',
  tempo: '3-1-1-0',
  restSeconds: 120,
  userComments: 'Felt strong today!'
};
```

### Filtering Workout Entries

```typescript
const filters = {
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  },
  exercises: ['exercise-id-1', 'exercise-id-2'],
  setTypes: ['STRAIGHT', 'SUPERSET']
};
```

### Coach Feedback

```typescript
// Only trainers can add feedback
const feedback = {
  entryId: 'entry-id',
  feedback: 'Great form! Keep your chest up on the next set.'
};
```

## 🔒 Security & Permissions

### Role-Based Access

- **Clients**: Can edit all fields except coach feedback
- **Trainers**: Can edit all fields including coach feedback
- **Admins**: Full access to all features

### Data Validation

All inputs are validated using Zod schemas:

```typescript
const createWorkoutLogEntrySchema = z.object({
  date: dateStringSchema,
  exerciseId: z.string().min(1),
  setNumber: z.number().int().positive(),
  // ... more validations
});
```

## 📈 Statistics & Analytics

The system provides comprehensive statistics:

- Total workouts completed
- Training volume (kg)
- Most used exercises
- Volume by muscle group
- Average workout duration

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

## 🚀 Deployment

1. **Database Migration**: Run `npx prisma db push`
2. **Build**: `npm run build`
3. **Start**: `npm start`

## 📝 Future Enhancements

- [ ] Advanced analytics with charts
- [ ] Workout templates
- [ ] Mobile app integration
- [ ] Social features (sharing workouts)
- [ ] Integration with fitness trackers
- [ ] AI-powered form analysis
- [ ] Video form analysis
- [ ] Progress photos
- [ ] Nutrition tracking integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is part of the Massimino platform and follows the same licensing terms.

---

For more information, see the main [Massimino README](../README.md).
