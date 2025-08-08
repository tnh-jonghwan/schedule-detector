# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MySQL batch processing service for detecting scheduling anomalies in medical record systems. The application connects to multiple databases, scans for invalid visit types in main schedules, and runs either once or on a configurable interval.

## Key Commands

- `npm run build` - Compile TypeScript to JavaScript in dist/ directory
- `npm start` - Run the TypeScript service directly with tsx
- `npm run dev` - Run with TypeScript file watching for development (restarts on file changes)
- `npm run typecheck` - Type check without building
- `npm run clean` - Remove compiled dist/ directory

## Architecture

The application is written in TypeScript with a modular structure:

1. **src/index.ts** - Main entry point with scheduling logic and Korean time formatting
2. **src/config.ts** - Environment-based configuration loader with TypeScript interfaces
3. **src/services/database.service.ts** - Database connection and query execution service
4. **src/services/scheduleDetector.service.ts** - Core schedule detection logic
5. **src/types/database.ts** - TypeScript type definitions for database entities

The project follows a service-based architecture where database operations are separated from business logic. The DatabaseService handles all MySQL connections and query execution, while ScheduleDetectorService focuses on the detection logic.

### Configuration Structure

Environment variables control database connections and behavior:
- `DATABASES` - JSON array of database configurations with host/port
- `MAIN_USER`, `MAIN_PASSWORD` - Database credentials  
- `RUN_INTERVAL_HOURS` - Scheduling interval (default: 1 hour)
- `RUN_ONCE` - Set to 'true' for single execution mode
- `BATCH_SIZE` - Query batch size (default: 100)

Excel export configuration:
- `EXCEL_EXPORT` - Set to 'true' to enable Excel file generation
- `EXCEL_OUTPUT_DIR` - Output directory for Excel files (default: './exports')
- `EXCEL_INCLUDE_TIMESTAMP` - Include timestamp in filename (default: true)
- `EXCEL_SEPARATE_SHEETS` - Create separate sheets for each query type (default: true)

### Database Processing

The service:
1. Creates connection pools for multiple MySQL databases
2. Targets databases named 'amelia' or 6-character names starting with 'c'
3. Queries for main schedules (ORGSCHID = 0) with invalid visit types (5,6) from 2025 onwards
4. Joins patient, medical record, and employee tables for complete reporting

### Schedule Detection Query

The core detection targets invalid visit types in main schedules:
```sql
SELECT P.PATID, P.PATNAME, P.CHARTNO, S.SCHID, M.MRID, M.CONSULTTIME, E.EMPLNAME, E.EMPLID, S.VISITTYPE
FROM {database}.TSCHEDULE S
JOIN {database}.TPATIENT P ON P.PATID = S.PATID
JOIN {database}.TMEDICALRECORD M ON M.SCHID = S.SCHID  
JOIN {database}.TEMPLOYEE E ON E.EMPLID = M.DRID
WHERE S.ORGSCHID = 0 AND S.VISITTYPE IN ('5','6') AND S.SCHDATE >= "20250101"
```

This detects main schedules with visit types that should be initial/follow-up/re-initial visits instead.