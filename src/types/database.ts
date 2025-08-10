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
    hospitalName: '테스트 서버'
  },
  'c00052': {
    dbName: 'c00052',
    hospitalName: '당당52'
  },
  'c00053': {
    dbName: 'c00053',
    hospitalName: '리봄(강남)53'
  },
  'c00054': {
    dbName: 'c00054',
    hospitalName: '광덕54'
  },
  'c00055': {
    dbName: 'c00055',
    hospitalName: '리봄(대구)55'
  },
  'c00057': {
    dbName: 'c00057',
    hospitalName: '메타57'
  },
  'c00066': {
    dbName: 'c00066',
    hospitalName: '새로본66'
  },
  'c00068': {
    dbName: 'c00068',
    hospitalName: '라라68'
  },
  'c00071': {
    dbName: 'c00071',
    hospitalName: '소담71'
  },
  'c00072': {
    dbName: 'c00072',
    hospitalName: '경기서부한의사랑72'
  },
  'c00076': {
    dbName: 'c00076',
    hospitalName: '원흥76'
  },
  'c00078': {
    dbName: 'c00078',
    hospitalName: '광덕(부산하단)78'
  },
  'c00082': {
    dbName: 'c00082',
    hospitalName: '당당(대구달서)82'
  },
  'c00083': {
    dbName: 'c00083',
    hospitalName: '연산당당한방병원83'
  },
  'c00084': {
    dbName: 'c00084',
    hospitalName: '청아람한방병원84'
  },
  'c00085': {
    dbName: 'c00085',
    hospitalName: '한가온85'
  }
}

export enum QUERY_TYPE {
  VISITTYPE_MISMATCH = 'VISITTYPE_MISMATCH',
  INSURANCE_MISMATCH = 'INSURANCE_MISMATCH',
  DOCTOR_MISMATCH = 'DOCTOR_MISMATCH',
  CONSULTTIME_MISMATCH = 'CONSULTTIME_MISMATCH'
}

export const QUERY_TYPE_INFO = {
  [QUERY_TYPE.VISITTYPE_MISMATCH] : {
      description: '주스케줄 진료구분이 초진, 재진 재초진이 아닌 경우',                                                      
      excelSheetName: '주스케줄 진료구분 오류'   
  },
  [QUERY_TYPE.INSURANCE_MISMATCH]: {
      description: '환자의 자격조회 데이터 매칭이 안되는 경우',
      excelSheetName: '자격조회 환자 매칭 오류'
  },
  [QUERY_TYPE.DOCTOR_MISMATCH]: {
      description: '스케줄의 담당의와 차트의 담당의가 매칭이 안되는 경우',
      excelSheetName: '담당의 매칭 오류'
  },
  [QUERY_TYPE.CONSULTTIME_MISMATCH]: {
      description: '외래에서 스케줄 날짜와 차트 날짜가 다른 경우',
      excelSheetName: '스케줄, 차트 날짜 불일치 오류'
  }
}

// 필드명 한국어 매핑
export const FIELD_NAME_MAPPING: Record<string, string> = {
  'PATNAME': '환자명',
  'CHARTNO': '차트번호', 
  'CONSULTTIME': '진료날짜',
  'SCHDATE': '스케줄날짜',
  'EMPLNAME': '담당의',
  'VISITTYPE': '진료구분',
}