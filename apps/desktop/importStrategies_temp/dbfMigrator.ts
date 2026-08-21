import { DBFFile } from 'dbffile';
import crypto from 'crypto';
import { BaseMigrator, AnalysisResult, ImportOptions } from './baseMigrator';

export class DbfMigrator extends BaseMigrator {
  async analyze(): Promise<AnalysisResult> {
    try {
      const dbf = await DBFFile.open(this.filePath);
      const headers = dbf.fields.map(f => f.name);
      const recordCount = dbf.recordCount;
      const tableName = 'DbfData';

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
      throw new Error(`Failed to analyze DBF file: ${error.message}`);
    }
  }

  async importData(
    targetDb: any,
    options: ImportOptions,
    progressCallback: (progress: any) => void
  ): Promise<void> {
    try {
      const dbf = await DBFFile.open(this.filePath);
      const tableName = 'DbfData';
      const mappings = options.mappingConfig?.[tableName] || [];

      if (mappings.length === 0) {
        throw new Error('No field mappings provided for DBF import.');
      }

      const batchSize = options.batchSize || 500;
      let offset = 0;

      progressCallback({ step: 'importing', entity: 'Records', imported: 0, total: dbf.recordCount });

      // Fetch companyId
      let companyId = 'demo-company';
      try {
        const compRow = targetDb.prepare('SELECT id FROM companies LIMIT 1').get();
        if (compRow && compRow.id) companyId = compRow.id;
      } catch (e) {}

      while (offset < dbf.recordCount) {
        // Read records in chunk
        const records = await dbf.readRecords(batchSize);
        if (records.length === 0) break;

        // Group mappings by target table
        const targetTables = new Set<string>();
        mappings.forEach(m => {
          const parts = m.targetField.split('.');
          if (parts.length > 1) targetTables.add(parts[0]);
        });

        for (const targetTable of targetTables) {
          // get actual columns from SQLite
          let existingColumns: any[] = [];
          try {
            existingColumns = targetDb.pragma(`table_info('${targetTable}')`) as any[];
          } catch (e) {
            console.error('Failed to get table schema from sqlite', e);
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

          const tableRecords = records.map((row: any) => {
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
                tableRecord[col.name] = `IMPORT_${Math.floor(Math.random() * 1000000)}`;
              }
            }

            // Map mapped source fields to target columns
            for (const mapping of mappings) {
              if (mapping.targetField.startsWith(`${targetTable}.`)) {
                const colName = mapping.targetField.split('.')[1];
                if (colNames.includes(colName) && row[mapping.sourceField] !== undefined) {
                  let val = row[mapping.sourceField];
                  if (typeof val === 'string') val = val.trim();
                  tableRecord[colName] = val;
                }
              }
            }
            return tableRecord;
          });

          // Insert or update in SQLite using transaction
          targetDb.transaction(() => {
            if (columnsToInsert.length > 0) {
              const placeholders = columnsToInsert.map(() => '?').join(', ');
              // Use INSERT OR REPLACE to overwrite duplicate entries seamlessly (Upsert logic)
              const stmt = targetDb.prepare(`INSERT OR REPLACE INTO ${targetTable} (${columnsToInsert.join(', ')}) VALUES (${placeholders})`);
              for (const record of tableRecords) {
                const values = columnsToInsert.map(col => record[col] === undefined ? null : record[col]);
                stmt.run(...values);
              }
            }
          })();

          // If we imported products, check if we need to create matching batches
          if (targetTable === 'products') {
            const hasBatchFields = mappings.some(m => 
              ['mrp', 'purchase_price', 'ptr', 'initial_stock', 'expiry_date', 'batch_no'].some(f => 
                m.targetField === `products.${f}`
              )
            );
            
            if (hasBatchFields) {
              let batchColumns: any[] = [];
              try {
                batchColumns = targetDb.pragma("table_info('batches')") as any[];
              } catch (e) {}
              const bColNames = batchColumns.map(c => c.name);

              const batchRecords = tableRecords.map((prodRec: any, idx: number) => {
                const row = records[idx]; // the raw dBase row
                const batchRec: any = {};
                
                batchRec.id = crypto.randomUUID();
                batchRec.product_id = prodRec.id;
                batchRec.company_id = companyId;
                batchRec.created_at = new Date().toISOString();
                batchRec.updated_at = new Date().toISOString();
                
                batchRec.batch_no = 'OPENING';
                batchRec.expiry_date = '2030-12-31';
                batchRec.mrp = 0;
                batchRec.ptr = 0;
                batchRec.purchase_price = 0;
                batchRec.current_qty = 0;
                batchRec.pts = 0;
                batchRec.free_qty = 0;
                batchRec.gst_rate = prodRec.gst_rate || 12;

                for (const mapping of mappings) {
                  const fName = mapping.targetField.split('.')[1];
                  if (row[mapping.sourceField] !== undefined) {
                    let val = row[mapping.sourceField];
                    if (typeof val === 'string') val = val.trim();
                    
                    if (fName === 'mrp') batchRec.mrp = parseFloat(String(val)) || 0;
                    else if (fName === 'purchase_price') batchRec.purchase_price = parseFloat(String(val)) || 0;
                    else if (fName === 'ptr') batchRec.ptr = parseFloat(String(val)) || 0;
                    else if (fName === 'initial_stock') batchRec.current_qty = parseFloat(String(val)) || 0;
                    else if (fName === 'expiry_date') batchRec.expiry_date = String(val);
                    else if (fName === 'batch_no') batchRec.batch_no = String(val);
                  }
                }

                return batchRec;
              });

              targetDb.transaction(() => {
                const bCols = bColNames.filter(c => c !== 'id_old');
                const placeholders = bCols.map(() => '?').join(', ');
                const stmt = targetDb.prepare(`INSERT OR REPLACE INTO batches (${bCols.join(', ')}) VALUES (${placeholders})`);
                for (const record of batchRecords) {
                  const values = bCols.map(col => record[col] === undefined ? null : record[col]);
                  stmt.run(...values);
                }
              })();
            }
          }
        }

        offset += records.length;
        progressCallback({ step: 'importing', entity: 'Records', imported: offset, total: dbf.recordCount });
      }
    } catch (error: any) {
      throw new Error(`DBF Import failed: ${error.message}`);
    }
  }
}
