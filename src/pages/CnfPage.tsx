import { CnfProvider, useCnf } from '../context/CnfContext';
import { StepController } from '../components/StepController';
import { GrammarInput } from '../components/GrammarInput';
import { GrammarDisplay } from '../components/GrammarDisplay';
import { AnnotationPanel } from '../components/AnnotationPanel';
import type { SimulatorState } from '../types';
import { cnfExamples } from '../data/cnfExamples';
import type { CnfExample } from '../data/cnfExamples';
import './CnfPage.css';

/** Maps CnfConversionStatus to the SimulatorState status that StepController expects. */
function mapStatus(cnfStatus: 'idle' | 'converting' | 'complete'): SimulatorState['status'] {
  switch (cnfStatus) {
    case 'idle':
      return 'ready';
    case 'converting':
      return 'running';
    case 'complete':
      return 'accepted';
  }
}

/**
 * Inner dashboard component that consumes CnfContext.
 * 3-column layout: Input | Grammar Display | Annotations
 * Step controls appear below Start Conversion once conversion begins.
 */
function CnfDashboard() {
  const { state, dispatch } = useCnf();

  const mappedStatus = mapStatus(state.status);
  const currentStep = state.currentSubStepIndex + 1;

  const currentSubStep =
    state.currentSubStepIndex >= 0
      ? state.subSteps[state.currentSubStepIndex]
      : null;

  // Annotation text
  let annotation: string;
  if (state.status === 'idle') {
    annotation =
      "Define a context-free grammar and click 'Start Conversion' to begin the step-by-step CNF conversion.";
  } else if (state.status === 'converting' && state.currentSubStepIndex >= 0) {
    annotation = state.subSteps[state.currentSubStepIndex].annotation;
  } else if (state.status === 'converting' && state.currentSubStepIndex === -1) {
    annotation = 'Conversion started. Click Step Forward to begin.';
  } else {
    annotation = 'Conversion complete! The grammar is now in Chomsky Normal Form.';
  }

  function handleSelectExample(example: CnfExample) {
    dispatch({ type: 'SET_GRAMMAR', payload: example.grammar });
  }

  const conversionStarted = state.status !== 'idle';

  return (
    <div className="cnf-dashboard">
      {/* Column 1: Input + Controls */}
      <section className="cnf-dashboard__input cnf-dashboard__section">
        <div className="cnf-dashboard__examples" role="region" aria-label="Example grammars">
          <span className="cnf-dashboard__examples-label">Load Example:</span>
          <div className="cnf-dashboard__examples-buttons">
            {cnfExamples.map((example) => (
              <button
                key={example.name}
                className="cnf-dashboard__example-btn"
                type="button"
                onClick={() => handleSelectExample(example)}
                disabled={conversionStarted}
                title={example.description}
              >
                {example.name}
              </button>
            ))}
          </div>
        </div>

        <GrammarInput
          grammar={state.originalGrammar}
          isConverting={conversionStarted}
          onSetGrammar={(g) => dispatch({ type: 'SET_GRAMMAR', payload: g })}
          onStartConversion={() => dispatch({ type: 'START_CONVERSION' })}
        />

        {conversionStarted && (
          <div className="cnf-dashboard__step-controls">
            <StepController
              status={mappedStatus}
              currentStep={currentStep}
              onStepForward={() => dispatch({ type: 'STEP_FORWARD' })}
              onStepBackward={() => dispatch({ type: 'STEP_BACKWARD' })}
              onReset={() => dispatch({ type: 'RESET' })}
            />
          </div>
        )}
      </section>

      {/* Column 2: Grammar Display */}
      <section className="cnf-dashboard__display cnf-dashboard__section">
        <GrammarDisplay
          grammar={state.currentGrammar}
          addedRules={currentSubStep?.addedRules ?? []}
          removedRules={currentSubStep?.removedRules ?? []}
          currentStep={
            currentSubStep
              ? { number: currentSubStep.stepNumber, label: currentSubStep.stepLabel }
              : null
          }
        />
      </section>

      {/* Column 3: Step Explanation */}
      <section className="cnf-dashboard__annotations cnf-dashboard__section">
        <AnnotationPanel annotation={annotation} status={mappedStatus} />
      </section>
    </div>
  );
}

/**
 * CNF page component — wraps the dashboard in CnfProvider
 * so CNF state is scoped to this route only.
 */
export function CnfPage() {
  return (
    <CnfProvider>
      <CnfDashboard />
    </CnfProvider>
  );
}
