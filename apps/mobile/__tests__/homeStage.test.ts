import { homeStage, homeStageCopy } from '../lib/homeStage';

describe('homeStage', () => {
  it('starts on first day with no memories', () => {
    expect(homeStage({ totalCount: 0, topicCount: 0, weekCount: 0, hasPattern: false })).toBe(
      'first-day',
    );
    expect(homeStageCopy('first-day').title).toContain('starts here');
  });

  it('moves to early after the first memories', () => {
    expect(homeStage({ totalCount: 2, topicCount: 0, weekCount: 1, hasPattern: false })).toBe(
      'early',
    );
  });

  it('becomes established once topics exist', () => {
    expect(homeStage({ totalCount: 8, topicCount: 2, weekCount: 2, hasPattern: false })).toBe(
      'established',
    );
  });

  it('becomes rich only with real patterns', () => {
    expect(homeStage({ totalCount: 20, topicCount: 5, weekCount: 4, hasPattern: true })).toBe(
      'rich',
    );
  });
});
