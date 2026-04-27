import type { ProjectDocument, QuizQuestion, Slide, VariableDefinition } from '@courseweaver/domain';

export type AiCapability = 'generateQuiz' | 'generateScenario' | 'summarizeNarration' | 'suggestInteraction' | 'draftVoiceScript';

export interface AiRequestBase {
  capability: AiCapability;
  project: ProjectDocument;
  slide?: Slide;
}

export interface QuizGenerationRequest extends AiRequestBase {
  capability: 'generateQuiz';
  difficulty: 'introductory' | 'intermediate' | 'advanced';
  objective: string;
}

export interface ScenarioGenerationRequest extends AiRequestBase {
  capability: 'generateScenario';
  objective: string;
  variables: VariableDefinition[];
}

export type AiRequest = QuizGenerationRequest | ScenarioGenerationRequest | AiRequestBase;

export interface AiSuggestion {
  title: string;
  summary: string;
  payload: unknown;
}

export interface AiProvider {
  id: string;
  name: string;
  supports: AiCapability[];
  request: (request: AiRequest) => Promise<AiSuggestion[]>;
}

export class NullAiProvider implements AiProvider {
  id = 'null';

  name = 'Disabled provider';

  supports: AiCapability[] = ['generateQuiz', 'generateScenario', 'summarizeNarration', 'suggestInteraction', 'draftVoiceScript'];

  async request(request: AiRequest): Promise<AiSuggestion[]> {
    if (request.capability === 'generateQuiz') {
      const quiz: QuizQuestion = {
        id: 'ai-sample-question',
        prompt: `Draft a question for: ${(request as QuizGenerationRequest).objective}`,
        type: 'multipleChoice',
        options: [
          { id: 'a', label: 'Sample distractor' },
          { id: 'b', label: 'Sample correct answer' },
          { id: 'c', label: 'Another distractor' }
        ],
        correctOptionIds: ['b'],
        points: 10
      };

      return [
        {
          title: 'AI suggestion unavailable',
          summary: 'The null provider returns deterministic placeholder content so the extension point can be wired end to end.',
          payload: quiz
        }
      ];
    }

    return [
      {
        title: 'AI capability placeholder',
        summary: 'Register a real provider to return production suggestions.',
        payload: { capability: request.capability }
      }
    ];
  }
}

export class AiServiceRegistry {
  constructor(private provider: AiProvider = new NullAiProvider()) {}

  setProvider(provider: AiProvider) {
    this.provider = provider;
  }

  getProvider() {
    return this.provider;
  }

  request(request: AiRequest) {
    return this.provider.request(request);
  }
}