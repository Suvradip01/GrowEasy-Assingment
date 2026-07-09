'use strict';

const { SchemaType } = require('@google/generative-ai');
const { z } = require('zod');

const CRM_STATUSES = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
const DATA_SOURCES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
];

const CrmRecordSchema = z.object({
  created_at: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  country_code: z.string().optional().nullable(),
  mobile_without_country_code: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lead_owner: z.string().optional().nullable(),
  crm_status: z.enum(CRM_STATUSES).optional().nullable(),
  crm_note: z.string().optional().nullable(),
  data_source: z.enum(DATA_SOURCES).optional().nullable(),
  possession_time: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  _skipped: z.boolean().optional().nullable(),
  _skip_reason: z.string().optional().nullable(),
});

const FieldMappingSchema = z.object({
  mappings: z.array(
    z.object({
      csv_column: z.string(),
      crm_field: z.string().nullable(),
    })
  ),
  confidence: z.number().min(0).max(1),
});

const BatchExtractionSchema = z.object({
  records: z.array(CrmRecordSchema),
});

const GEMINI_CRM_RECORD_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    created_at: { type: SchemaType.STRING, nullable: true },
    name: { type: SchemaType.STRING, nullable: true },
    email: { type: SchemaType.STRING, nullable: true },
    country_code: { type: SchemaType.STRING, nullable: true },
    mobile_without_country_code: { type: SchemaType.STRING, nullable: true },
    company: { type: SchemaType.STRING, nullable: true },
    city: { type: SchemaType.STRING, nullable: true },
    state: { type: SchemaType.STRING, nullable: true },
    country: { type: SchemaType.STRING, nullable: true },
    lead_owner: { type: SchemaType.STRING, nullable: true },
    crm_status: {
      type: SchemaType.STRING,
      enum: CRM_STATUSES,
      nullable: true,
    },
    crm_note: { type: SchemaType.STRING, nullable: true },
    data_source: {
      type: SchemaType.STRING,
      enum: DATA_SOURCES,
      nullable: true,
    },
    possession_time: { type: SchemaType.STRING, nullable: true },
    description: { type: SchemaType.STRING, nullable: true },
    _skipped: { type: SchemaType.BOOLEAN, nullable: true },
    _skip_reason: { type: SchemaType.STRING, nullable: true },
  },
};

const GEMINI_FIELD_MAPPING_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    mappings: {
      type: SchemaType.ARRAY,
      description: 'List of column mappings from CSV to CRM target field names',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          csv_column: {
            type: SchemaType.STRING,
            description: 'The exact column name from the CSV'
          },
          crm_field: {
            type: SchemaType.STRING,
            description: 'The target CRM field name mapping (or null/crm_note)',
            nullable: true
          }
        },
        required: ['csv_column', 'crm_field']
      }
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: 'Overall mapping confidence score 0–1',
    },
  },
  required: ['mappings', 'confidence'],
};

const GEMINI_BATCH_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    records: {
      type: SchemaType.ARRAY,
      items: GEMINI_CRM_RECORD_SCHEMA,
    },
  },
  required: ['records'],
};

module.exports = {
  CRM_STATUSES,
  DATA_SOURCES,
  CrmRecordSchema,
  FieldMappingSchema,
  BatchExtractionSchema,
  GEMINI_CRM_RECORD_SCHEMA,
  GEMINI_FIELD_MAPPING_SCHEMA,
  GEMINI_BATCH_SCHEMA,
};
