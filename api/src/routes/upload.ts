import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Pool } from 'pg';
import AdmZip from 'adm-zip';
import { createClient } from '@supabase/supabase-js';
import csv from 'csv-parser';
import { Readable } from 'stream';

// TODO: Add authentication to this endpoint
// TODO: Add comprehensive zip file validation (structure, file types, CSV format)
// TODO: Improve file overwrite handling - maybe add versioning or backup existing files

interface TemplateRow {
  template_type?: string;
  system_name?: string;
  name?: string;
  categories?: string;
  data_context?: string;
  participant_role?: string;
  output_title?: string;
  output_file_name?: string;
  document_source?: string;
  docid: string;
}

export default async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/upload', {
    schema: {
      description: 'Upload and process ZIP files containing documents and CSV template data',
      tags: ['Document Analyser'],
      consumes: ['multipart/form-data'],
      body: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            isFile: true
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success'] },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                batchId: { type: 'string' },
                csvFile: {
                  type: 'object',
                  properties: {
                    fileName: { type: 'string' },
                    storagePath: { type: 'string' }
                  }
                },
                uploadedFiles: {
                  type: 'array',
                  items: {
                    type: 'string',
                    description: 'Storage path of uploaded file'
                  }
                },
                upsertedTemplates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      template_type: { type: 'string' },
                      system_name: { type: 'string' },
                      name: { type: 'string' },
                      categories: { type: 'string' },
                      data_context: { type: 'string' },
                      participant_role: { type: 'string' },
                      output_title: { type: 'string' },
                      output_file_name: { type: 'string' },
                      document_source: { type: 'string' },
                      docid: { type: 'string' },
                      batch_id: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['error'] },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['error'] },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get the uploaded file
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({
          status: 'error',
          message: 'No file uploaded'
        });
      }

      if (!data.filename.endsWith('.zip')) {
        return reply.status(400).send({
          status: 'error',
          message: 'Only ZIP files are allowed'
        });
      }

      // Read the zip file buffer
      const buffer = await data.toBuffer();
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      // Initialize Supabase client
      console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
      console.log('SUPABASE_SERVICE_KEY available:', !!process.env.SUPABASE_SERVICE_KEY);
      
      if (!process.env.SUPABASE_SERVICE_KEY) {
        throw new Error('SUPABASE_SERVICE_KEY environment variable is not set');
      }
      
      // Initialize Supabase client - using SERVICE_ROLE_KEY with corrected tokens
      console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
      console.log('SUPABASE_SERVICE_KEY (first 50 chars):', process.env.SUPABASE_SERVICE_KEY?.substring(0, 50));
      console.log('SUPABASE_ANON_KEY (first 50 chars):', process.env.SUPABASE_ANON_KEY?.substring(0, 50));
      
      // Configure Supabase client for self-hosted instance with proper auth config
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );

      // Find CSV file and document files
      let csvEntry: AdmZip.IZipEntry | undefined = undefined;
      const documentEntries: AdmZip.IZipEntry[] = [];

      zipEntries.forEach(entry => {
        if (!entry.isDirectory) {
          const fileName = entry.entryName.toLowerCase();
          if (fileName.endsWith('.csv')) {
            csvEntry = entry;
          } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx') || 
                     fileName.endsWith('.dot') || fileName.endsWith('.dotx')) {
            documentEntries.push(entry);
          }
        }
      });

      if (!csvEntry) {
        return reply.status(400).send({
          status: 'error',
          message: 'No CSV file found in the zip archive'
        });
      }

      // Upload CSV file to storage first
      const csvBuffer = zip.readFile(csvEntry);
      if (!csvBuffer) {
        throw new Error('Failed to read CSV file from zip');
      }

      const csvFileName = (csvEntry as AdmZip.IZipEntry).entryName;
      console.log(`=== Uploading CSV file: ${csvFileName} ===`);
      console.log(`CSV file size: ${csvBuffer.length} bytes`);
      
      const { data: csvUploadData, error: csvUploadError } = await supabase.storage
        .from('uploads')
        .upload(csvFileName, csvBuffer, {
          upsert: true
        });

      if (csvUploadError) {
        console.log(`CSV upload error for ${csvFileName}:`, csvUploadError);
        throw new Error(`Failed to upload CSV ${csvFileName}: ${csvUploadError.message}`);
      }

      console.log(`Successfully uploaded CSV: ${csvFileName}`, csvUploadData);
      const csvStoragePath = csvUploadData.path;

      // Create batch record in uploads table
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      const client = await pool.connect();
      let batchId: string;

      try {
        const batchQuery = `
          INSERT INTO uploads (filepath)
          VALUES ($1)
          RETURNING id;
        `;
        
        const batchResult = await client.query(batchQuery, [csvStoragePath]);
        batchId = batchResult.rows[0].id;
        console.log(`Created batch record with ID: ${batchId}`);
      } catch (error) {
        client.release();
        await pool.end();
        throw error;
      }

      // Upload document files to Supabase storage
      const uploadPromises = documentEntries.map(async (entry) => {
        const fileBuffer = zip.readFile(entry);
        const fileName = entry.entryName;
        
        if (!fileBuffer) {
          throw new Error(`Failed to read file: ${fileName}`);
        }

        console.log(`=== Uploading file: ${fileName} ===`);
        console.log(`File size: ${fileBuffer.length} bytes`);
        
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(fileName, fileBuffer, {
            upsert: true // This will overwrite existing files
          });

        if (error) {
          console.log(`Upload error for ${fileName}:`, error);
          throw new Error(`Failed to upload ${fileName}: ${error.message}`);
        }

        console.log(`Successfully uploaded: ${fileName}`, data);
        return data.path; // Just return the storage path
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Parse CSV file

      const csvRows: TemplateRow[] = [];
      const csvStream = Readable.from(csvBuffer.toString());

      await new Promise<void>((resolve, reject) => {
        csvStream
          .pipe(csv())
          .on('data', (row: any) => {
            // Convert the row to match our template structure
            // Handle both snake_case and Title Case column names
            const templateRow: TemplateRow = {
              template_type: row.template_type || row['Template Type'],
              system_name: row.system_name || row['System Name'],
              name: row.name || row['Name'],
              categories: row.categories || row['Categories'],
              data_context: row.data_context || row['Data Context'],
              participant_role: row.participant_role || row['Participant Role'],
              output_title: row.output_title || row['Output Title'],
              output_file_name: row.output_file_name || row['Output File Name'],
              document_source: row.document_source || row['Document Source'],
              docid: row.docid || row['DocID'] || row.DocId
            };

            if (!templateRow.docid) {
              throw new Error(`Row missing required docid field: ${JSON.stringify(row)}`);
            }

            csvRows.push(templateRow);
          })
          .on('end', resolve)
          .on('error', reject);
      });

      if (csvRows.length === 0) {
        return reply.status(400).send({
          status: 'error',
          message: 'No valid rows found in CSV file'
        });
      }

      // Create a mapping from docid to storage file path
      const docIdToStoragePath: { [key: string]: string } = {};
      uploadedFiles.forEach((storagePath, index) => {
        // Get the corresponding document entry to extract filename
        const fileName = documentEntries[index].entryName;
        // Extract filename without extension for matching
        const baseFileName = fileName.replace(/\.[^/.]+$/, "");
        docIdToStoragePath[baseFileName] = storagePath;
      });

      // Insert template records with batch_id and storage file paths
      const upsertedRows: any[] = [];

      try {
        for (const row of csvRows) {
          // Find matching storage path for this template's docid
          const storagePath = docIdToStoragePath[row.docid] || row.docid; // fallback to original docid if no match
          
          const query = `
            INSERT INTO templates (template_type, system_name, name, categories, data_context, participant_role, output_title, output_file_name, document_source, docid, batch_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (docid) 
            DO UPDATE SET
              template_type = EXCLUDED.template_type,
              system_name = EXCLUDED.system_name,
              name = EXCLUDED.name,
              categories = EXCLUDED.categories,
              data_context = EXCLUDED.data_context,
              participant_role = EXCLUDED.participant_role,
              output_title = EXCLUDED.output_title,
              output_file_name = EXCLUDED.output_file_name,
              document_source = EXCLUDED.document_source,
              batch_id = EXCLUDED.batch_id
            RETURNING *;
          `;

          const values = [
            row.template_type,
            row.system_name,
            row.name,
            row.categories,
            row.data_context,
            row.participant_role,
            row.output_title,
            row.output_file_name,
            row.document_source,
            storagePath, // Use storage path instead of docid
            batchId
          ];

          const result = await client.query(query, values);
          upsertedRows.push(result.rows[0]);
        }
      } finally {
        client.release();
        await pool.end();
      }

      return {
        status: 'success',
        message: `Successfully processed zip file. Uploaded ${uploadedFiles.length} documents and CSV file. Created batch ${batchId} and upserted ${upsertedRows.length} template records.`,
        data: {
          batchId,
          csvFile: {
            fileName: csvFileName,
            storagePath: csvStoragePath
          },
          uploadedFiles,
          upsertedTemplates: upsertedRows
        }
      };

    } catch (error) {
      fastify.log.error('Upload processing failed: %s', error instanceof Error ? error.message : error);
      return reply.status(500).send({
        status: 'error',
        message: 'Failed to process upload',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}