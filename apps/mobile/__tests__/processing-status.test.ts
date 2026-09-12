import {
  formatObservationReadyTime,
  isProcessingObservationStatus,
  isTerminalObservationStatus,
  observationStageLabel,
  observationStatusHeadline,
  observationStatusLabel,
} from '../lib/api';

describe('processing status UX helpers', () => {
  it('renders processing, ready, and failed headlines', () => {
    expect(observationStatusHeadline('EMBEDDING')).toBe('Processing');
    expect(observationStatusHeadline('COMPLETED')).toBe('Ready');
    expect(observationStatusHeadline('FAILED')).toBe('Processing failed');
  });

  it('uses truthful stage labels without percentages', () => {
    expect(observationStatusLabel('CHUNKING')).toBe('Creating chunks…');
    expect(observationStageLabel({ status: 'EMBEDDING' })).toBe(
      'Generating embeddings…',
    );
    expect(
      observationStageLabel({
        status: 'PENDING',
        stageLabel: 'Processing…',
      }),
    ).toBe('Processing…');
    expect(formatObservationReadyTime('2026-09-12T12:42:00.000Z')).toMatch(
      /\d/,
    );
  });

  it('stops polling when ready or failed', () => {
    expect(isTerminalObservationStatus('COMPLETED')).toBe(true);
    expect(isTerminalObservationStatus('FAILED')).toBe(true);
    expect(isProcessingObservationStatus('COMPLETED')).toBe(false);
    expect(isProcessingObservationStatus('FAILED')).toBe(false);
    expect(isProcessingObservationStatus('ANALYZING')).toBe(true);
  });
});
