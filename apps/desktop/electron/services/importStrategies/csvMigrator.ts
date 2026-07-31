import * as xlsx from 'xlsx';
import crypto from 'crypto';
import { BaseMigrator, AnalysisResult, ImportOptions } from './baseMigrator';

export class CsvMigrator extends BaseMigrator {
  async analyze(): Promise<AnalysisResult> {
    try {
      const workbook = xlsx.readFile(this.filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Parse as JSON to get headers and rows
      const data: any[] = xlsx.utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays
      
      if (data.length === 0) {
        throw new Error('File is empty');
      }

      const headers = data[0] as string[];
      const recordCount = data.length > 1 ? data.length - 1 : 0;
      const tableName = 'CsvData'; // CSV represents one table

      return {
        tables: [tableName],
        columns: {
          [tableName]: headers,
        },
        recordCounts: {
          [tableName]: recordCount,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to analyze CSV file: ${error.message}`);
    }
  }

  async importData(
    targetDb: any,
    options: ImportOptions,
    progressCallback: (progress: any) => void
  ): Promise<void> {
    const workbook = xlsx.readFile(this.filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Read with headers as keys
    const data: any[] = xlsx.utils.sheet_to_json(worksheet); 
    const tableName = 'CsvData';
    const mappings = options.mappingConfig?.[tableName] || [];
    
    if (mappings.length === 0) {
      throw new Error('No field mappings provided for CSV import.');
    }

    const batchSize = options.batchSize || 500;
    let offset = 0;

    progressCallback({ step: 'importing', entity: 'Records', imported: 0, total: data.length });

    while (offset < data.length) {
      const chunk = data.slice(offset, offset + batchSize);
      
      // Transform
      const transformedChunk = chunk.map((row) => {
        const newRow: any = {};
        for (const mapping of mappings) {
          if (row[mapping.sourceField] !== undefined) {
            newRow[mapping.targetField] = row[mapping.sourceField];
          }
        }
        return newRow;
      });

        // Load (Insert into the target database)
      if (transformedChunk.length > 0) {
        
        const targetTables = new Set<string>();
        mappings.forEach(m => {
          const parts = m.targetField.split('.');
          if(parts.length > 1) targetTables.add(parts[0]);
        });
        
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
             .filter(m => m.targetField.startsWith(`${targetTable}.`))
             .map(m => m.targetField.split('.')[1])
             .filter(col => colNames.includes(col)); // ensure mapped col exists
          
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

          const tableRecords = transformedChunk.map(row => {
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

          // Insert into targetDB using transaction
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
      }

      offset += chunk.length;
      progressCallback({ step: 'importing', entity: 'Records', imported: offset, total: data.length });
    }
  }
}
