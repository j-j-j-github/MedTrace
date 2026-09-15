import { sanitizeAIResponse } from './aiExtractor.js';
import assert from 'assert';

console.log('🧪 Running MedTrace AI Backend Unit Tests...\n');

// Test 1: Null Safety - Converting "N/A", "Unknown", "None", "" to null
console.log('Test 1: Testing null safety...');
const rawWithNAs = {
  documentType: 'LAB_REPORT',
  hospital: 'N/A',
  doctor: 'Not specified',
  department: 'none',
  patientName: 'UNKNOWN',
  date: '2024-05-12',
  summary: 'Routine blood panel.',
  labResults: [
    { testName: 'Hemoglobin', value: '11.5', unit: 'g/dL', referenceRange: '13-17', status: 'low' }
  ],
  medications: [],
  findings: []
};

const sanitized1 = sanitizeAIResponse(rawWithNAs);
assert.strictEqual(sanitized1.hospital, null, 'hospital should be null');
assert.strictEqual(sanitized1.doctor, null, 'doctor should be null');
assert.strictEqual(sanitized1.department, null, 'department should be null');
assert.strictEqual(sanitized1.patientName, null, 'patientName should be null');
assert.strictEqual(sanitized1.date, '2024-05-12', 'date should match');
console.log('✅ Test 1 Passed: Null safety properly applied.\n');

// Test 2: Date Formatting - Converting various date representations to strict YYYY-MM-DD
console.log('Test 2: Testing date format normalization...');
const rawWithTextDate = {
  documentType: 'PRESCRIPTION',
  hospital: 'Apollo Clinic',
  doctor: 'Dr. Sarah Connor',
  department: 'Cardiology',
  patientName: 'Jane Doe',
  date: '2024/09/15',
  summary: 'Follow up prescription.',
  labResults: [],
  medications: [
    { name: 'Metformin', dosage: '500mg', frequency: 'Once daily', duration: '30 days', instructions: 'With breakfast' }
  ],
  findings: []
};

const sanitized2 = sanitizeAIResponse(rawWithTextDate);
assert.strictEqual(sanitized2.date, '2024-09-15', 'date should normalize to YYYY-MM-DD');
console.log('✅ Test 2 Passed: Date normalized to YYYY-MM-DD.\n');

// Test 3: Document Type validation
console.log('Test 3: Testing documentType enum fallback...');
const rawWithInvalidType = {
  documentType: 'INVALID_TYPE_SCAN',
  hospital: 'City Hospital',
  summary: 'General medical report',
};

const sanitized3 = sanitizeAIResponse(rawWithInvalidType);
assert.strictEqual(sanitized3.documentType, 'OTHER', 'Invalid document type should fall back to OTHER');
console.log('✅ Test 3 Passed: documentType enum validation and fallback work.\n');

// Test 4: Default summary & empty array guarantees
console.log('Test 4: Testing summary and array guarantees...');
const emptyRaw = {};
const sanitized4 = sanitizeAIResponse(emptyRaw);
assert.ok(sanitized4.summary.length > 0, 'Summary should not be empty');
assert.ok(Array.isArray(sanitized4.labResults), 'labResults must be an array');
assert.ok(Array.isArray(sanitized4.medications), 'medications must be an array');
assert.ok(Array.isArray(sanitized4.findings), 'findings must be an array');
console.log('✅ Test 4 Passed: Summary and arrays are guaranteed.\n');

console.log('🎉 All Unit Tests Passed Successfully!');
