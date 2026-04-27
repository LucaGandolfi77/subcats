import {
  createId,
  createLayer,
  createProject,
  createSlide,
  createSlideObject,
  createVariable,
  type ProjectDocument,
  type Trigger
} from './models';

export const createDemoProject = (): ProjectDocument => {
  const project = createProject('Customer Care Foundations');
  project.courseMetadata.provider = 'CourseWeaver Studio Demo';
  project.courseMetadata.subject = 'Customer support communication';
  project.courseMetadata.durationMinutes = 12;
  project.courseMetadata.keywords = ['customer service', 'handoff', 'communication'];
  project.publishing.scorm.organizationTitle = 'Customer Care Foundations';
  project.publishing.scorm.itemTitle = 'Customer Care Foundations';
  project.publishing.scorm.masteryScore = 85;
  project.publishing.scorm.maxTimeAllowed = '0001:00:00';
  project.publishing.scorm.dataFromLms = 'cohort=demo';
  const baseScene = project.scenes[0];
  const introSlide = project.slides[0];
  introSlide.title = 'Welcome';
  introSlide.notes = 'Introduce the module and its learning goals.';

  const detailLayer = createLayer('Goal Detail');
  detailLayer.visibleByDefault = false;
  introSlide.layers.push(detailLayer);

  const proceedVariable = createVariable('go_to_quiz', 'boolean', false);
  project.variables.push(proceedVariable);

  const heading = createSlideObject('text', introSlide.layers[0].id);
  heading.position = { x: 72, y: 64, width: 560, height: 88 };
  heading.text = 'Build confident customer conversations';
  heading.style.fontSize = 42;
  heading.style.fontWeight = 700;

  const body = createSlideObject('text', introSlide.layers[0].id);
  body.position = { x: 72, y: 168, width: 500, height: 140 };
  body.text = 'This demo course shows layers, states, triggers, variables, quiz scoring, and web export.';
  body.style.fontSize = 22;

  const marker = createSlideObject('marker', introSlide.layers[0].id);
  marker.position = { x: 700, y: 146, width: 48, height: 48 };
  marker.interaction = {
    marker: {
      label: '1',
      body: 'Reveal the goal detail layer to see author-controlled overlays.'
    }
  };

  const revealButton = createSlideObject('button', introSlide.layers[0].id);
  revealButton.position = { x: 72, y: 356, width: 240, height: 56 };
  revealButton.text = 'Show learning goals';
  revealButton.states = [
    {
      id: createId(),
      name: 'Visited',
      style: { fill: '#c5601a', textColor: '#fff4ea' },
      text: 'Goals reviewed'
    }
  ];
  revealButton.defaultStateId = revealButton.states[0].id;

  const revealTrigger: Trigger = {
    id: createId(),
    name: 'Reveal goal layer',
    event: 'onClick',
    order: 1,
    sourceObjectId: revealButton.id,
    conditions: [],
    actions: [
      { id: createId(), type: 'showLayer', targetId: detailLayer.id },
      { id: createId(), type: 'changeState', targetId: revealButton.id, stateId: revealButton.states[0].id },
      { id: createId(), type: 'setVariable', variableId: proceedVariable.id, value: true }
    ]
  };
  revealButton.triggers.push(revealTrigger);

  const layerPanelText = createSlideObject('text', detailLayer.id);
  layerPanelText.position = { x: 632, y: 206, width: 420, height: 160 };
  layerPanelText.text = 'Goal detail: listen, clarify, confirm, and close with clear next steps.';
  layerPanelText.style = {
    fill: '#10211c',
    textColor: '#f7fbfa',
    fontSize: 20,
    padding: 18,
    borderRadius: 18
  };

  introSlide.objects.push(heading, body, marker, revealButton, layerPanelText);
  introSlide.layers[0].objectIds.push(heading.id, body.id, marker.id, revealButton.id);
  detailLayer.objectIds.push(layerPanelText.id);

  const tabs = createSlideObject('tabs', introSlide.layers[0].id);
  tabs.position = { x: 72, y: 438, width: 520, height: 180 };
  introSlide.objects.push(tabs);
  introSlide.layers[0].objectIds.push(tabs.id);

  const quizSlide = createSlide(baseScene.id, 'Knowledge Check');
  const quizObject = createSlideObject('quiz', quizSlide.layers[0].id);
  const continueButton = createSlideObject('button', quizSlide.layers[0].id);
  continueButton.position = { x: 72, y: 544, width: 220, height: 56 };
  continueButton.text = 'View results';
  continueButton.triggers.push({
    id: createId(),
    name: 'Jump to result slide when ready',
    event: 'onClick',
    order: 1,
    sourceObjectId: continueButton.id,
    conditions: [
      { id: createId(), variableId: proceedVariable.id, operator: 'isTrue' }
    ],
    actions: []
  });

  if (quizObject.interaction?.quiz) {
    quizObject.interaction.quiz.prompt = 'Which behavior is strongest in a customer handoff?';
    quizObject.interaction.quiz.options = [
      { id: createId(), label: 'Close the chat without summary' },
      { id: createId(), label: 'Confirm the next step and owner' },
      { id: createId(), label: 'Wait for the customer to ask again' }
    ];
    quizObject.interaction.quiz.correctOptionIds = [quizObject.interaction.quiz.options[1].id];
    quizObject.interaction.quiz.points = 15;
    quizObject.interaction.quiz.feedbackCorrect = 'Correct. Ownership and next steps reduce friction.';
    quizObject.interaction.quiz.feedbackIncorrect = 'Not quite. The best answer confirms what happens next.';
  }

  quizObject.position = { x: 72, y: 108, width: 620, height: 360 };
  quizSlide.objects.push(quizObject, continueButton);
  quizSlide.layers[0].objectIds.push(quizObject.id, continueButton.id);

  const resultSlide = createSlide(baseScene.id, 'Results');
  const resultHeading = createSlideObject('text', resultSlide.layers[0].id);
  resultHeading.position = { x: 72, y: 108, width: 500, height: 80 };
  resultHeading.text = 'You have completed the demo flow.';
  resultHeading.style.fontSize = 38;
  resultHeading.style.fontWeight = 700;
  resultSlide.objects.push(resultHeading);
  resultSlide.layers[0].objectIds.push(resultHeading.id);

  continueButton.triggers[0].actions.push({ id: createId(), type: 'jumpToSlide', targetId: resultSlide.id });

  project.slides.push(quizSlide, resultSlide);
  baseScene.slideIds.push(quizSlide.id, resultSlide.id);
  project.playerSettings.startSlideId = introSlide.id;

  return project;
};