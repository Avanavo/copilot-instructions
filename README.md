# DocSpective - Document Analysis and Template Management System

DocSpective is a containerized document processing system that allows you to upload ZIP files containing documents and CSV metadata, automatically storing them in Supabase Storage and linking them through a PostgreSQL database.

## Purpose and Vision

The primary purpose of DocSpective is to **convert legacy document templates from .doc/.dot formats to .docx format** and **integrate them with Sharedo**, a legal document management platform. The system serves as a bridge for:

1. **Document Format Modernization** - Converting older Word formats (.doc, .dot) to modern .docx format
2. **Metadata Processing** - Parsing CSV files containing template information and business rules
3. **Storage Management** - Organizing documents in cloud storage with proper categorization
4. **Sharedo Integration** - Preparing documents for upload and linking within Sharedo's document template system

This solution enables law firms and legal organizations to migrate their existing document templates into modern, cloud-based document automation systems.

## Architecture Overview

- **FastifyAPI** - RESTful API with TypeScript and comprehensive Swagger documentation
- **Supabase** - Self-hosted backend with PostgreSQL database, Storage, and Studio UI
- **Docker Compose** - Complete containerized development environment
- **Automated Processing** - ZIP file extraction, document storage, and metadata linking

## Prerequisites

- **Docker** and **Docker Compose** installed
- **Git** for cloning the repository
- **curl** for testing API endpoints (optional)

## Quick Start

### 1. Clone and Initialize

```bash
# Clone the repository
git clone <repository-url>
cd DocSpective

# Run the complete initialization script
./scripts/initialize-container
```

The initialization script will:
- Stop any existing containers
- Remove old volumes and data
- Rebuild the API container
- Start all services
- Verify health and storage setup

### 2. Access the Services

After initialization, the following services will be available:

| Service | URL | Description |
|---------|-----|-------------|
| **API Documentation** | http://localhost:3001/ | Interactive Swagger UI for testing endpoints |
| **API Health Check** | http://localhost:3001/api/health | System health and connectivity status |
| **API Upload Endpoint** | http://localhost:3001/api/upload | Document upload and processing |
| **Supabase Studio** | http://localhost:3000 | Database management and storage browser |
| **Kong Gateway** | http://localhost:8000 | API gateway (for advanced routing) |

## How to Upload Documents

### Using Swagger UI (Recommended)

1. **Open the API Documentation**: Navigate to http://localhost:3001/
2. **Find the Upload Endpoint**: Look for the `POST /api/upload` endpoint under "Document Analyser"
3. **Click "Try it out"**: This will enable the file upload interface
4. **Choose your ZIP file**: Click "Choose File" and select `.testdata/uploadtestdata.zip`
5. **Execute the request**: Click the "Execute" button
6. **Review the response**: You should see a successful response with:
   - Batch ID (UUID)
   - CSV file information (filename and storage path)
   - Uploaded files (array of storage paths)
   - Template records (parsed from CSV and linked to batch)

### Using curl (Alternative)

```bash
curl -X POST \
  -F "file=@.testdata/uploadtestdata.zip" \
  http://localhost:3001/api/upload
```

### Expected Response Structure

```json
{
  "status": "success",
  "message": "Successfully processed zip file. Uploaded 4 documents and CSV file. Created batch <uuid> and upserted 4 template records.",
  "data": {
    "batchId": "123e4567-e89b-12d3-a456-426614174000",
    "csvFile": {
      "fileName": "templates.csv",
      "storagePath": "templates.csv"
    },
    "uploadedFiles": [
      "Document1.docx",
      "Document2.docx",
      "Document3.docx",
      "Document4.docx"
    ],
    "upsertedTemplates": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "template_type": "Contract",
        "system_name": "Legal System",
        "name": "Employment Contract",
        "docid": "Document1.docx",
        "batch_id": "123e4567-e89b-12d3-a456-426614174000"
      }
    ]
  }
}
```

## How to Validate Document Storage

### Using Supabase Studio

1. **Open Supabase Studio**: Navigate to http://localhost:3000
2. **Navigate to Storage**: Click on "Storage" in the left sidebar
3. **Browse the 'uploads' bucket**: 
   - You should see your uploaded documents (.docx files)
   - You should see the CSV file from your upload
4. **Check file details**: Click on any file to see its metadata and download options

### Using Database Queries

In Supabase Studio, go to the SQL Editor and run:

```sql
-- View all batches
SELECT * FROM uploads ORDER BY timestamp DESC;

-- View all templates linked to batches
SELECT 
  t.*,
  u.filepath as csv_file_path,
  u.timestamp as batch_created_at
FROM templates t
JOIN uploads u ON t.batch_id = u.id
ORDER BY u.timestamp DESC;

-- Count documents per batch
SELECT 
  u.id as batch_id,
  u.filepath as csv_file,
  u.timestamp,
  COUNT(t.id) as document_count
FROM uploads u
LEFT JOIN templates t ON t.batch_id = u.id
GROUP BY u.id, u.filepath, u.timestamp
ORDER BY u.timestamp DESC;
```

### Storage Bucket Structure

After upload, your storage will contain:

```
uploads/
├── templates.csv           # CSV metadata file
├── Document1.docx          # Uploaded document
├── Document2.docx          # Uploaded document
├── Document3.docx          # Uploaded document
└── Document4.docx          # Uploaded document

conversions/                # Ready for future processed documents
```

## System Health Check

### API Health Endpoint

Visit http://localhost:3001/api/health to see comprehensive system status:

```json
{
  "status": "healthy",
  "timestamp": "2025-09-16T21:42:47.798Z",
  "uptime": 6.677114304,
  "checks": {
    "api": {
      "status": "healthy",
      "message": "API is responding"
    },
    "database": {
      "status": "healthy",
      "message": "Database connection successful",
      "responseTime": 39
    },
    "storage": {
      "status": "healthy",
      "message": "Storage connection successful",
      "buckets": ["uploads", "conversions"]
    }
  }
}
```

### Container Status

```bash
# Check all container status
docker-compose ps

# Check specific logs
docker logs docspective-api
docker logs supabase-db
docker logs supabase-storage
```

## Development Workflow

### Making Changes

1. **Edit source code** in `api/src/`
2. **Rebuild the API container**:
   ```bash
   docker-compose down api
   docker-compose build api
   docker-compose up -d api
   ```

### Full Reset

If you need to completely reset the environment:

```bash
./scripts/initialize-container
```

This will wipe all data and start fresh.

### Database Schema

The system uses two main tables:

**uploads table** (batches):
- `id` (UUID, Primary Key)
- `timestamp` (Created timestamp)
- `filepath` (Path to CSV file in storage)

**templates table**:
- `id` (UUID, Primary Key)
- `template_type`, `system_name`, `name`, etc. (Metadata from CSV)
- `docid` (Storage path to the actual document file)
- `batch_id` (Foreign key to uploads table)

## Troubleshooting

### Common Issues

1. **"Port already in use"**: Stop existing containers with `docker-compose down`
2. **"Permission denied"**: Make sure the initialization script is executable: `chmod +x scripts/initialize-container`
3. **API not responding**: Check logs with `docker logs docspective-api`
4. **Storage bucket missing**: Re-run the initialization script

### Container Logs

```bash
# API logs
docker logs docspective-api --follow

# Database logs
docker logs supabase-db --follow

# All services
docker-compose logs --follow
```

### Health Diagnostics

```bash
# Quick health check
curl http://localhost:3001/api/health

# Full container status
docker-compose ps

# Storage verification
curl -s http://localhost:3001/api/health | grep -o '"buckets":\[[^]]*\]'
```

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System health check |
| POST | `/api/upload` | Upload and process ZIP files |
| GET | `/` | Swagger UI documentation |

## File Format Requirements

### ZIP File Structure
```
your-upload.zip
├── templates.csv           # Required: CSV metadata file
├── Document1.docx          # Word documents
├── Document2.docx
└── ...                     # Additional .doc, .docx, .dot, .dotx files
```

### CSV Format
The CSV file should contain columns that match the template schema. Supported column names (case-insensitive):
- `template_type` or `Template Type`
- `system_name` or `System Name`
- `name` or `Name`
- `categories` or `Categories`
- `data_context` or `Data Context`
- `participant_role` or `Participant Role`
- `output_title` or `Output Title`
- `output_file_name` or `Output File Name`
- `document_source` or `Document Source`
- `docid` or `DocID` or `DocId` (Required: should match document filenames without extension)

---

🎉 **You're all set!** The system is designed to be self-contained and easy to use. Start by uploading the test data through the Swagger UI and explore the results in Supabase Studio.

## Next Steps - Sharedo Integration

The next phase of DocSpective development will focus on **Sharedo connectivity** to complete the document template migration workflow:

### Planned Enhancements

#### 1. **Document Format Conversion**
- Implement conversion from .doc/.dot to .docx format
- Preserve document structure, formatting, and embedded objects
- Validate converted documents for compatibility

#### 2. **Sharedo API Integration**
- Connect to Sharedo's document template management system
- Authenticate using Sharedo's OAuth/Bearer token system
- Implement template upload and registration workflows

#### 3. **Template Registration Workflow**
- **Template Creation**: Use Sharedo's `/api/modeller/documentTemplates` endpoint
- **Document Upload**: Upload converted .docx files to Sharedo repositories
- **Metadata Mapping**: Map CSV template data to Sharedo's template schema
- **Work Type Linking**: Associate templates with appropriate Sharedo work types

#### 4. **Enhanced API Endpoints**
Based on the provided Postman collection, planned endpoints include:

```
POST /api/sharedo/templates/upload     # Upload documents to Sharedo
POST /api/sharedo/templates/create     # Create template definitions
GET  /api/sharedo/templates/types      # Retrieve available template types
GET  /api/sharedo/work-types           # Get Sharedo work type mappings
POST /api/convert/doc-to-docx          # Document format conversion
```

#### 5. **Configuration Management**
- Sharedo environment configuration (demo-aus.sharedo.tech)
- Authentication credential management
- Repository and folder mapping settings
- Template type and work type associations

### Development Roadmap

1. **Phase 1 (Current)**: ✅ Document storage and metadata processing
2. **Phase 2 (Next)**: Document format conversion (.doc/.dot → .docx)
3. **Phase 3**: Sharedo authentication and API connectivity
4. **Phase 4**: End-to-end template migration workflow
5. **Phase 5**: Batch processing and monitoring dashboard

### Technical Integration Points

The system will integrate with Sharedo using:

- **Authentication**: OAuth 2.0 flow with client credentials
- **Document Repository**: Sharedo's SharePoint-based template storage
- **Template Metadata**: Mapping CSV fields to Sharedo's template schema
- **Work Types**: Linking templates to appropriate legal work categories

Reference materials for this integration are available in:
- `.testdata/DocSpective.postman_collection.json` - Complete API reference
- `.testdata/demo-aus.postman_environment.json` - Environment configuration

This integration will enable seamless migration of legacy document templates into modern legal document automation workflows.
