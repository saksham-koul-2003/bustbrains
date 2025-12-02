import axios from 'axios';

/**
 * Get Airtable API client with user's access token
 */
export function getAirtableClient(accessToken) {
  return axios.create({
    baseURL: 'https://api.airtable.com/v0',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Map Airtable field type to our supported types
 */
export function mapAirtableFieldType(airtableType) {
  const typeMap = {
    'singleLineText': 'singleLineText',
    'multilineText': 'multilineText',
    'singleSelect': 'singleSelect',
    'multipleSelects': 'multipleSelects',
    'multipleAttachments': 'multipleAttachments'
  };

  return typeMap[airtableType] || null;
}

/**
 * Get supported field types
 */
export const SUPPORTED_FIELD_TYPES = [
  'singleLineText',
  'multilineText',
  'singleSelect',
  'multipleSelects',
  'multipleAttachments'
];

