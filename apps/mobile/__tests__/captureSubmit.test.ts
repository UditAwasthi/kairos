import { ApiError } from '../lib/api';
import { submitCapture } from '../lib/capture';
import { enqueueCapture, listPendingCaptures } from '../lib/captureQueue';

jest.mock('../lib/api', () => {
  const actual = jest.requireActual('../lib/api');
  return {
    ...actual,
    createCapture: jest.fn(),
    uploadCapture: jest.fn(),
  };
});

jest.mock('../lib/captureQueue', () => ({
  enqueueCapture: jest.fn(async (item) => ({
    ...item,
    id: 'cap_1',
    capturedAt: '2026-09-23T00:00:00.000Z',
    attempts: 0,
  })),
  listPendingCaptures: jest.fn(async () => []),
  markCaptureAttempt: jest.fn(),
  removePendingCapture: jest.fn(),
}));

const api = jest.requireMock('../lib/api') as {
  createCapture: jest.Mock;
  uploadCapture: jest.Mock;
};

describe('submitCapture', () => {
  it('returns the observation when the network succeeds', async () => {
    api.createCapture.mockResolvedValue({ id: 'obs_1', status: 'PENDING' });
    const result = await submitCapture({
      token: 'tok',
      source: 'QUICK_CAPTURE',
      content: 'hello',
    });
    expect(result.queued).toBe(false);
    expect(result.observation?.id).toBe('obs_1');
  });

  it('queues on network failure instead of dropping the thought', async () => {
    api.createCapture.mockRejectedValue(new ApiError('offline', 500));
    const result = await submitCapture({
      token: 'tok',
      source: 'VOICE',
      content: 'spoken thought',
    });
    expect(result.queued).toBe(true);
    expect(enqueueCapture).toHaveBeenCalled();
    expect(listPendingCaptures).not.toHaveBeenCalled();
  });

  it('does not queue validation errors', async () => {
    api.createCapture.mockRejectedValue(new ApiError('Write a thought first.', 400));
    await expect(
      submitCapture({
        token: 'tok',
        source: 'QUICK_CAPTURE',
        content: '',
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
