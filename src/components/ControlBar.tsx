import { useSimulator } from '../context/SimulatorContext';
import { allExamples } from '../data';
import { ExampleSelector } from './ExampleSelector';
import { StringInput } from './StringInput';
import { StepController } from './StepController';
import './ControlBar.css';

/**
 * Persistent sticky control bar that composes ExampleSelector,
 * StringInput, and StepController. Wired to the SimulatorContext
 * so child controls dispatch actions directly.
 */
export function ControlBar() {
  const { state, dispatch } = useSimulator();

  return (
    <div className="control-bar" role="region" aria-label="Simulation control bar">
      <div className="control-bar__section control-bar__section--example">
        <ExampleSelector
          examples={allExamples}
          currentExample={state.pdaDefinition}
          onSelect={(example) => dispatch({ type: 'SELECT_EXAMPLE', payload: example })}
        />
      </div>

      <div className="control-bar__section control-bar__section--input">
        <StringInput
          tapeAlphabet={state.pdaDefinition.tapeAlphabet}
          predefinedInputs={state.pdaDefinition.predefinedInputs}
          onSubmit={(input) => dispatch({ type: 'SET_INPUT', payload: input })}
        />
      </div>

      <div className="control-bar__section control-bar__section--controls">
        <StepController
          status={state.status}
          currentStep={state.currentStep}
          onStepForward={() => dispatch({ type: 'STEP_FORWARD' })}
          onStepBackward={() => dispatch({ type: 'STEP_BACKWARD' })}
          onReset={() => dispatch({ type: 'RESET' })}
        />
      </div>
    </div>
  );
}
