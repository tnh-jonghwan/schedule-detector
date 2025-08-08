export interface DatabaseInfo {
  Database: string;
}

// 기본 스케줄 행
export interface ScheduleRow {
  PATID: string;
  PATNAME: string;
  CHARTNO: string;
  SCHID: string;
  MRID: string;
  CONSULTTIME: string;
  EMPLNAME: string;
  EMPLID: string;
  VISITTYPE: string;
}

// 자격조회 매칭 안되는 경우
export interface InsuranceMismatchRow {
  INSID: string;
  PATID: string;
  PATNAME: string;
  CHARTNO: string;
}

// 스케줄 담당의와 차트 담당의 매칭 안되는 경우
export interface DoctorMismatchRow {
  PATID: string;
  PATNAME: string;
  CHARTNO: string;
  SCHID: string;
  MRID: string;
  CONSULTTIME: string;
  EMPLNAME: string;
  EMPLID: string;
}

// 스케줄과 차트 날짜가 다른 경우
export interface DateMismatchRow {
  PATID: string;
  PATNAME: string;
  CHARTNO: string;
  SCHID: string;
  MRID: string;
  CONSULTTIME: string;
  EMPLID: string;
  EMPLNAME: string;
}

// 감지 결과 타입
export type DetectionRow = ScheduleRow | InsuranceMismatchRow | DoctorMismatchRow | DateMismatchRow;

// 감지 쿼리 설정
export interface DetectionQuery {
  name: string;
  description: string;
  query: string;
  enabled: boolean;
}

// 감지 결과
export interface DetectionResult {
  queryName: string;
  dbRoute: string;
  dbName: string;
  rows: DetectionRow[];
  count: number;
}

export interface HospitalInfo {
  dbName: string;
  hospitalName: string;
}

export const HospitalMap: Record<string, HospitalInfo> = {
  'amelia': {
    dbName: 'amelia',
    hospitalName: '아멜리아'
  },
  'c00052': {
    dbName: 'c00052',
    hospitalName: '당당'
  },
  'c00053': {
    dbName: 'c00053',
    hospitalName: '리봄(강남)'
  },
  'c00054': {
    dbName: 'c00054',
    hospitalName: '광덕'
  },
  'c00055': {
    dbName: 'c00055',
    hospitalName: '리봄(대구)'
  },
  'c00057': {
    dbName: 'c00057',
    hospitalName: '메타'
  },
  'c00066': {
    dbName: 'c00066',
    hospitalName: '새로본'
  },
  'c00068': {
    dbName: 'c00068',
    hospitalName: '라라'
  },
  'c00071': {
    dbName: 'c00071',
    hospitalName: '소담'
  },
  'c00072': {
    dbName: 'c00072',
    hospitalName: '경기서부한의사랑'
  },
  'c00076': {
    dbName: 'c00076',
    hospitalName: '원흥'
  },
  'c00078': {
    dbName: 'c00078',
    hospitalName: '광덕(부산하단)'
  },
  'c00082': {
    dbName: 'c00082',
    hospitalName: '당당(대구달서)'
  },
  'c00083': {
    dbName: 'c00083',
    hospitalName: '연산당당한방병원'
  },
  'c00084': {
    dbName: 'c00084',
    hospitalName: '청아람한방병원'
  },
  'c00085': {
    dbName: 'c00085',
    hospitalName: '한가온'
  }
}