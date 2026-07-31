import Database from 'better-sqlite3';
import crypto from 'crypto';
import { BaseMigrator, AnalysisResult, ImportOptions } from './baseMigrator';

export class SqlMigrator extends BaseMigrator {
  async analyze(): Promise<AnalysisResult> {
    try {
      const sourceDb = new Database(this.filePath, { readonly: true });
      
      // Get all tables (excluding sqlite_ internal tables)
      const tablesStmt = sourceDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      const tableRows = tablesStmt.all() as { name: string }[];
      const tables = tableRows.map(row => row.name);

      const columns: Record<string, string[]> = {};
      const recordCounts: Record<string, number> = {};

      for (const table of tables) {
        // Get columns
        const pragma = sourceDb.pragma(`table_info('${table}')`) as { name: string }[];
        columns[table] = pragma.map(c => c.name);

        // Get count
        const countRow = sourceDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
        recordCounts[table] = countRow.count;
      }

      sourceDb.close();

      return {
        tables,
        columns,
        recordCounts
      };
    } catch (error: any) {
      throw new Error(`Failed to analyze SQL Database: ${error.message}`);
    }
  }

  async importData(
    targetDb: any,
    options: ImportOptions,
    progressCallback: (progress: any) => void
  ): Promise<void> {
    if (!options.mappingConfig) {
      throw new Error('No field mappings provided for SQL import.');
    }

    const sourceDb = new Database(this.filePath, { readonly: true });
    const batchSize = options.batchSize || 500;

    const sourceTables = Object.keys(options.mappingConfig);

    for (const sourceTable of sourceTables) {
      const mappings = options.mappingConfig[sourceTable];
      if (!mappings || mappings.length === 0) continue;

      const countRow = sourceDb.prepare(`SELECT COUNT(*) as count FROM ${sourceTable}`).get() as { count: number };
      const totalRecords = countRow.count;

      if (totalRecords === 0) continue;

      progressCallback({ step: 'importing', entity: sourceTable, imported: 0, total: totalRecords });

      // We determine target tables from the mappings
      const targetTables = new Set<string>();
      mappings.forEach(m => {
        const parts = m.targetField.split('.');
        if (parts.length > 1) targetTables.add(parts[0]);
      });

      let offset = 0;

      while (offset < totalRecords) {
        // 1. Extract
        const rows = sourceDb.prepare(`SELECT * FROM ${sourceTable} LIMIT ? OFFSET ?`).all(batchSize, offset);
        if (rows.length === 0) break;

        // 2. Transform
        const transformedChunk = rows.map((row: any) => {
          const newRow: any = {};
          for (const mapping of mappings) {
            if (row[mapping.sourceField] !== undefined) {
              newRow[mapping.targetField] = row[mapping.sourceField];
            }
          }
          return newRow;
        });

        // 3. Load
        for (const targetTable of targetTables) {
          
          // Fetch companyId
          let companyId = 'demo-company';
          try {
            const compRow = targetDb.prepare('SELECT id FROM companies LIMIT 1').get();
            if (compRow && compRow.id) companyId = compRow.id;
          } catch(e) {}
          
          // get actual columns from SQLite
          let existingColumns: any[] = [];
          try {
            existingColumns = targetDb.pragma(`table_info('${targetTable}')`) as any[];
          } catch(e) {
            console.error(e);
          }
          
          const colNames = existingColumns.map(c => c.name);
          
          const tableColumns = mappings
             .filter((m: any) => m.targetField.startsWith(`${targetTable}.`))
             .map((m: any) => m.targetField.split('.')[1])
             .filter(col => colNames.includes(col));
          
          const autoCols: string[] = [];
          if (colNames.includes('id')) autoCols.push('id');
          if (colNames.includes('company_id')) autoCols.push('company_id');
          if (colNames.includes('created_at')) autoCols.push('created_at');
          if (colNames.includes('updated_at')) autoCols.push('updated_at');

          // Find NOT NULL columns that have no default, are not mapped, and are not autoCols
          const missingRequiredCols = existingColumns.filter(c => 
            c.notnull === 1 && 
            c.dflt_value === null && 
            !tableColumns.includes(c.name) && 
            !autoCols.includes(c.name) &&
            c.name !== 'id'
          );

          const requiredColsToInject = missingRequiredCols.map(c => c.name);
          const columnsToInsert = [...autoCols, ...tableColumns, ...requiredColsToInject];

          const tableRecords = transformedChunk.map((row: any) => {
            const tableRecord: any = {};
            if (autoCols.includes('id')) tableRecord.id = crypto.randomUUID();
            if (autoCols.includes('company_id')) tableRecord.company_id = companyId;
            if (autoCols.includes('created_at')) tableRecord.created_at = new Date().toISOString();
            if (autoCols.includes('updated_at')) tableRecord.updated_at = new Date().toISOString();

            // Inject defaults for missing required columns
            for (const col of missingRequiredCols) {
              if (col.type.includes('REAL') || col.type.includes('INTEGER')) {
                tableRecord[col.name] = 0;
              } else {
                tableRecord[col.name] = `IMPORT_${Math.floor(Math.random()*1000000)}`;
              }
            }

            for(const key of Object.keys(row)) {
              if (key.startsWith(`${targetTable}.`)) {
                const colName = key.split('.')[1];
                if (colNames.includes(colName)) {
                  tableRecord[colName] = row[key];
                }
              }
            }
            return tableRecord;
          });

          // Insert into target DB
          targetDb.transaction(() => {
            if (columnsToInsert.length > 0) {
              const placeholders = columnsToInsert.map(() => '?').join(', ');
              const stmt = targetDb.prepare(`INSERT INTO ${targetTable} (${columnsToInsert.join(', ')}) VALUES (${placeholders})`);
              for (const record of tableRecords) {
                // Ensure no undefined values are passed to SQLite
                const values = columnsToInsert.map(col => record[col] === undefined ? null : record[col]);
                stmt.run(...values);
              }
            }
          })();
        }

        offset += rows.length;
        progressCallback({ step: 'importing', entity: sourceTable, imported: offset, total: totalRecords });
      }
    }

    sourceDb.close();
  }
}
