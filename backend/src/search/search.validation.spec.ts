import {
  validateSearchRequest,
  MAX_SEARCH_QUERY_LENGTH,
} from './search.validation';

describe('validateSearchRequest', () => {
  it('rejects empty query', () => {
    expect(() => validateSearchRequest({ query: '   ' })).toThrow();
  });

  it('rejects non-string query', () => {
    expect(() => validateSearchRequest({ query: 123 })).toThrow();
  });

  it('rejects oversized query', () => {
    expect(() =>
      validateSearchRequest({ query: 'a'.repeat(MAX_SEARCH_QUERY_LENGTH + 1) }),
    ).toThrow();
  });

  it('rejects invalid limit', () => {
    expect(() => validateSearchRequest({ query: 'redis', limit: 0 })).toThrow();
    expect(() =>
      validateSearchRequest({ query: 'redis', limit: 99 }),
    ).toThrow();
  });

  it('accepts a valid request', () => {
    const result = validateSearchRequest({
      query: '  What did I learn about Redis? ',
      limit: 5,
      filters: {
        observationType: 'TEXT',
        from: '2026-01-01T00:00:00.000Z',
      },
    });
    expect(result.query).toBe('What did I learn about Redis?');
    expect(result.limit).toBe(5);
    expect(result.filters.observationType).toBe('TEXT');
    expect(result.filters.from?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});
