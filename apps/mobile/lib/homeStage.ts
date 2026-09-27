export type HomeStage = 'first-day' | 'early' | 'established' | 'rich';

export function homeStage(params: {
  totalCount: number;
  topicCount: number;
  weekCount: number;
  hasPattern: boolean;
}): HomeStage {
  if (params.totalCount <= 0) return 'first-day';
  if (params.totalCount < 4 || params.topicCount === 0) return 'early';
  if (params.hasPattern && params.topicCount >= 4 && params.weekCount >= 3) return 'rich';
  return 'established';
}

export function homeStageCopy(stage: HomeStage): { title: string; body: string } {
  switch (stage) {
    case 'first-day':
      return {
        title: 'Your world starts here.',
        body: 'Capture something you want to remember.',
      };
    case 'early':
      return {
        title: 'The first threads are forming.',
        body: 'Keep adding what matters. Kairos will start noticing connections.',
      };
    case 'established':
      return {
        title: 'Your world is taking shape.',
        body: 'Ask, recall, or follow what Kairos noticed.',
      };
    case 'rich':
      return {
        title: 'Plenty to return to.',
        body: 'Your memories already have topics, projects, and threads.',
      };
  }
}
