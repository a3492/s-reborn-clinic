#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const schemaDir = path.join(root, 'docs', 'experience', 'schemas');

function readJson(name) {
  const file = path.join(schemaDir, name);
  assert.ok(fs.existsSync(file), `Missing schema: ${name}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function requiredIncludes(schema, fields) {
  assert.ok(Array.isArray(schema.required), `${schema.title} must declare required fields`);
  for (const field of fields) {
    assert.ok(schema.required.includes(field), `${schema.title} must require ${field}`);
  }
}

const content = readJson('content-record.schema.json');
const relation = readJson('relation-edge.schema.json');
const intake = readJson('question-intake.schema.json');

requiredIncludes(content, [
  'id',
  'slug',
  'title',
  'description',
  'editorial_pillar',
  'reader_intents',
  'core_thesis',
  'medical_review_status',
]);

assert.deepEqual(
  relation.properties.relation_type.enum,
  ['primary_next', 'related'],
  'Relation contract must preserve curated primary_next separately from related.',
);
requiredIncludes(relation, [
  'source_content_id',
  'target_content_id',
  'relation_type',
  'branch_type',
  'reason',
  'provenance',
]);

const coverage = intake.properties.coverage_disposition.enum;
for (const state of ['STRONG_EXISTING', 'PARTIAL_EXISTING', 'NO_DIRECT']) {
  assert.ok(coverage.includes(state), `Question Intake must preserve ${state} coverage state.`);
}
requiredIncludes(intake, [
  'raw_question_id',
  'question_raw',
  'privacy_state',
  'moderation_state',
  'coverage_disposition',
]);

const docs = [
  'README.md',
  'EXPERIENCE_CONTENT_CONTRACT_v01.md',
  'USABILITY_TO_RETRIEVAL_HANDOFF_v01.md',
  'QUESTION_INTAKE_CONTRACT_v01.md',
  'PRODUCTION_READINESS_MATRIX_v01.md',
];
for (const doc of docs) {
  assert.ok(fs.existsSync(path.join(root, 'docs', 'experience', doc)), `Missing Experience doc: ${doc}`);
}

console.log('Experience contract regression check: OK');
