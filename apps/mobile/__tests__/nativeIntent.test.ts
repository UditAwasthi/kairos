import { redirectSystemPath } from '../app/+native-intent';

describe('deep link mapping', () => {
  it('maps OS entry points onto existing routes', () => {
    expect(redirectSystemPath({ path: 'kairos://capture', initial: true })).toBe(
      '/quick-capture',
    );
    expect(
      redirectSystemPath({ path: 'kairos://capture?source=WIDGET', initial: false }),
    ).toBe('/quick-capture?source=WIDGET');
    expect(redirectSystemPath({ path: 'kairos://voice', initial: true })).toBe(
      '/voice-capture',
    );
    expect(redirectSystemPath({ path: 'kairos://insight', initial: true })).toBe(
      '/insight',
    );
    expect(redirectSystemPath({ path: 'kairos://dashboard', initial: true })).toBe(
      '/dashboard',
    );
    expect(redirectSystemPath({ path: 'kairos://predictions', initial: true })).toBe(
      '/predictions',
    );
    expect(redirectSystemPath({ path: 'kairos://brief', initial: true })).toBe(
      '/brief',
    );
    expect(redirectSystemPath({ path: 'kairos://ask', initial: true })).toBe('/ask');
    expect(redirectSystemPath({ path: 'kairos://project/abc', initial: true })).toBe(
      '/projects/abc',
    );
  });

  it('maps share intents onto capture', () => {
    expect(
      redirectSystemPath({
        path: 'android.intent.action.SEND',
        initial: true,
      }),
    ).toBe('/quick-capture?source=SHARE');
  });

  it('leaves unrelated paths alone', () => {
    expect(redirectSystemPath({ path: '/settings', initial: false })).toBe('/settings');
  });
});
