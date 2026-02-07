export type LogType = 'damage' | 'heal' | 'death' | 'waveStart' | 'waveEnd' | 'effect' | 'spawn';

export interface CombatLogEntry {
  tick: number;
  type: LogType;
  sourceId?: string;
  targetId?: string;
  value?: number;
  message: string;
}

export class CombatLog {
  private logs: CombatLogEntry[] = [];

  add(entry: CombatLogEntry) {
    this.logs.push(entry);
  }

  getLogs(): CombatLogEntry[] {
    return this.logs;
  }
}
