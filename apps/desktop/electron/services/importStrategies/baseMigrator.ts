export interface FieldMapping {
  sourceField: string;
  targetField: string;
}

export interface ImportOptions {
  batchSize?: number;
  mappingConfig?: Record<string, FieldMapping[]>; // key: target table name (e.g., 'Customers')
}

export interface AnalysisResult {
  tables: string[];
  columns: Record<string, string[]>;
  recordCounts: Record<string, number>;
}

export abstract class BaseMigrator {
  protected filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Analyzes the source file and returns metadata (tables, columns, counts).
   */
  abstract analyze(): Promise<AnalysisResult>;

  /**
   * Extracts data in chunks, applies mapping, and loads into the target DB.
   * @param targetDb The target better-sqlite3 database connection
   * @param options Import options including field mapping and batch size
   * @param progressCallback Callback to report progress back to the orchestrator
   */
  abstract importData(
    targetDb: any,
    options: ImportOptions,
    progressCallback: (progress: any) => void
  ): Promise<void>;
}
