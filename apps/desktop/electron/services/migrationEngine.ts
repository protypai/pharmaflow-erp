import { EventEmitter } from 'events';
import { getDb } from './localDb.service';
import { BaseMigrator, ImportOptions, AnalysisResult } from './importStrategies/baseMigrator';
import { CsvMigrator } from './importStrategies/csvMigrator';
import { SqlMigrator } from './importStrategies/sqlMigrator';
import { logger } from './logger';

export class MigrationEngine extends EventEmitter {
  
  private getMigrator(filePath: string, format: string): BaseMigrator {
    if (format === 'csv' || filePath.endsWith('.csv') || filePath.endsWith('.xlsx')) {
      return new CsvMigrator(filePath);
    } else if (format === 'sql' || filePath.endsWith('.db') || filePath.endsWith('.sqlite')) {
      return new SqlMigrator(filePath);
    }
    throw new Error(`Unsupported format: ${format}`);
  }

  async analyzeSource(filePath: string, format: string): Promise<AnalysisResult> {
    try {
      logger.info(`Analyzing source file: ${filePath} (${format})`);
      const migrator = this.getMigrator(filePath, format);
      const result = await migrator.analyze();
      return result;
    } catch (error: any) {
      logger.error('Analyze failed', { error: error.message });
      throw error;
    }
  }

  async startImport(filePath: string, format: string, options: ImportOptions): Promise<void> {
    const targetDb = getDb();
    
    try {
      logger.info(`Starting import from ${filePath}`);
      const migrator = this.getMigrator(filePath, format);
      
      this.emit('progress', { step: 'started' });

      // Run ETL with progress callbacks
      await migrator.importData(targetDb, options, (progressData) => {
        this.emit('progress', progressData);
      });

      this.emit('progress', { step: 'completed' });
      logger.info(`Import completed successfully`);
      
    } catch (error: any) {
      logger.error('Import failed', { error: error.message });
      this.emit('error', { message: error.message });
      throw error;
    }
  }
}

// Singleton instance
export const migrationEngine = new MigrationEngine();
