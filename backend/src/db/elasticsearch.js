import { Client } from '@elastic/elasticsearch';
import config from '../config/index.js';
import prisma from './prisma.js';

let _instance = null;
let _isConfigured = null;

/**
 * Check if Elasticsearch is configured in environment.
 * @returns {boolean}
 */
export const isESConfigured = () => {
  if (_isConfigured !== null) return _isConfigured;
  _isConfigured = !!config.ELASTICSEARCH_URL;
  return _isConfigured;
};

/**
 * Get Elasticsearch Client instance.
 * Returns null if ES is not configured.
 * @returns {Client|null}
 */
const getESClient = () => {
  if (!isESConfigured()) {
    return null;
  }

  if (!_instance) {
    try {
      _instance = new Client({
        node: config.ELASTICSEARCH_URL,
        maxRetries: 3,
        requestTimeout: 5000,
      });
      console.log('[ELASTICSEARCH] Client initialized successfully');
      
      // Initialize indices asynchronously
      initESIndices().catch((err) => {
        console.error('[ELASTICSEARCH] Failed index initialization:', err.message);
      });
    } catch (error) {
      console.error('[ELASTICSEARCH] Initialization error:', error.message);
      _instance = null;
    }
  }

  return _instance;
};

/**
 * Initialize Elasticsearch index and mapping.
 */
export const initESIndices = async () => {
  const client = getESClient();
  if (!client) return;

  const indexName = `${config.ELASTICSEARCH_INDEX_PREFIX}_properties`;

  try {
    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      await client.indices.create({
        index: indexName,
        body: {
          settings: {
            analysis: {
              analyzer: {
                autocomplete_analyzer: {
                  tokenizer: 'autocomplete_tokenizer',
                  filter: ['lowercase']
                }
              },
              tokenizer: {
                autocomplete_tokenizer: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 20,
                  token_chars: ['letter', 'digit']
                }
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              host_id: { type: 'keyword' },
              type: { type: 'keyword' },
              title: {
                type: 'text',
                fields: {
                  suggest: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer',
                    search_analyzer: 'standard'
                  }
                }
              },
              description: { type: 'text' },
              city: {
                type: 'keyword',
                fields: {
                  text: { type: 'text' }
                }
              },
              state: {
                type: 'keyword',
                fields: {
                  text: { type: 'text' }
                }
              },
              country: { type: 'keyword' },
              location: { type: 'geo_point' },
              base_price_per_night: { type: 'double' },
              rating_avg: { type: 'double' },
              review_count: { type: 'integer' },
              status: { type: 'keyword' },
              amenities: { type: 'keyword' },
              rooms: {
                type: 'nested',
                properties: {
                  id: { type: 'keyword' },
                  name: { type: 'keyword' },
                  room_type: { type: 'keyword' },
                  price_per_night: { type: 'double' },
                  max_guests: { type: 'integer' },
                  has_ac: { type: 'boolean' },
                  has_wifi: { type: 'boolean' },
                  is_active: { type: 'boolean' }
                }
              },
              created_at: { type: 'date' }
            }
          }
        }
      });
      console.log(`[ELASTICSEARCH] Created index "${indexName}" with mappings.`);
    }
  } catch (error) {
    console.error(`[ELASTICSEARCH] Failed to create index "${indexName}":`, error.message);
  }
};

/**
 * Synchronize a property document to Elasticsearch.
 * Fetches required relations automatically if not present.
 * @param {string|object} propertyOrId
 */
export const syncPropertyToES = async (propertyOrId) => {
  const client = getESClient();
  if (!client) return;

  try {
    let property = null;
    if (typeof propertyOrId === 'string') {
      property = await prisma.property.findUnique({
        where: { id: propertyOrId },
        include: {
          rooms: { where: { is_active: true } },
          photos: { where: { is_cover: true }, take: 1 }
        }
      });
    } else {
      property = propertyOrId;
      // If relations are missing, refetch
      if (!property.rooms || !property.photos) {
        property = await prisma.property.findUnique({
          where: { id: property.id },
          include: {
            rooms: { where: { is_active: true } },
            photos: { where: { is_cover: true }, take: 1 }
          }
        });
      }
    }

    if (!property) {
      console.warn('[ELASTICSEARCH] Property not found for sync');
      return;
    }

    const indexName = `${config.ELASTICSEARCH_INDEX_PREFIX}_properties`;

    let amenitiesArr = [];
    if (property.amenities) {
      if (Array.isArray(property.amenities)) {
        amenitiesArr = property.amenities;
      } else if (typeof property.amenities === 'string') {
        try {
          amenitiesArr = JSON.parse(property.amenities);
        } catch {
          amenitiesArr = [property.amenities];
        }
      } else {
        // Json type might be parsed object/array
        amenitiesArr = Object.values(property.amenities);
      }
    }

    const doc = {
      id: property.id,
      host_id: property.host_id,
      type: property.type,
      title: property.title,
      description: property.description,
      city: property.city,
      state: property.state,
      country: property.country,
      base_price_per_night: property.base_price_per_night,
      rating_avg: property.rating_avg || 0,
      review_count: property.review_count || 0,
      status: property.status,
      amenities: amenitiesArr,
      created_at: property.created_at,
      rooms: (property.rooms || []).map(r => ({
        id: r.id,
        name: r.name,
        room_type: r.room_type,
        price_per_night: r.price_per_night,
        max_guests: r.max_guests,
        has_ac: r.has_ac,
        has_wifi: r.has_wifi,
        is_active: r.is_active
      }))
    };

    if (property.latitude !== null && property.latitude !== undefined &&
        property.longitude !== null && property.longitude !== undefined) {
      doc.location = {
        lat: property.latitude,
        lon: property.longitude
      };
    }

    await client.index({
      index: indexName,
      id: property.id,
      body: doc,
      refresh: 'wait_for' // Block until indexed to maintain test correctness
    });

    console.log(`[ELASTICSEARCH] Property "${property.id}" sync completed.`);
  } catch (error) {
    console.error('[ELASTICSEARCH] Failed to sync property:', error.message);
  }
};

/**
 * Remove a property document from Elasticsearch index.
 * @param {string} propertyId
 */
export const removePropertyFromES = async (propertyId) => {
  const client = getESClient();
  if (!client) return;

  try {
    const indexName = `${config.ELASTICSEARCH_INDEX_PREFIX}_properties`;
    await client.delete({
      index: indexName,
      id: propertyId,
      refresh: 'wait_for'
    });
    console.log(`[ELASTICSEARCH] Property "${propertyId}" removed from ES.`);
  } catch (error) {
    // Suppress document missing (404) errors
    if (error.meta && error.meta.statusCode === 404) {
      return;
    }
    console.error(`[ELASTICSEARCH] Failed to delete property "${propertyId}":`, error.message);
  }
};

export default getESClient;
