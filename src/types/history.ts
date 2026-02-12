export interface ActSplit {
  actNumber: number;
  time: string; // HH:MM:SS format
}

export interface RunRecord {
  id: string;
  buildPlanId?: string;
  buildName: string;
  date: string;
  totalTime: string; // HH:MM:SS format
  actSplits: ActSplit[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export function createEmptyRun(id: string): RunRecord {
  return {
    id,
    buildName: '',
    date: new Date().toISOString().split('T')[0],
    totalTime: '',
    actSplits: Array.from({ length: 10 }, (_, i) => ({
      actNumber: i + 1,
      time: '',
    })),
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
