import { useRef, useCallback } from 'react';
import { useSimulator } from './context/SimulatorContext';
import { generateAnnotation } from './engine/simulator';
import { ControlBar } from './components/ControlBar';
import { TapeDisplay } from './components/TapeDisplay';
import { StackDisplay } from './components/StackDisplay';
import { StateControlDisplay } from './components/StateControlDisplay';
import { TransitionTable } from './components/TransitionTable';
import { AnnotationPanel } from './components/AnnotationPanel';
import { ComputationHistory } from './components/ComputationHistory';
import { BranchView } from './components/BranchView';
import { BranchExplainer } from './components/BranchExplainer';
import { FormalDefinitionDisplay } from './components/FormalDefinitionDisplay';
import './App.css';

/**
 * App shell for the PDA Interactive Dashboard.
 *
 * Lays out all visualisation components in a responsive CSS Grid.
 * ≥1024 px → 3-column layout
 * 768–1023 px → 2-column layout
 *
 * All components are wired to SimulatorContext for live state.
 */
function App() {
  const { state, dispatch } = useSimulator();

  // Track previous stack for StackDisplay animations
  const previousStackRef = useRef<string[]>(state.stack);
  const lastStepRef = useRef<number>(state.currentStep);

  // Track previous state for StateControlDisplay animations
  const previousStateRef = useRef<string | null>(null);
  const lastCurrentStateRef = useRef<string>(state.currentState);

  // Update previous stack/state when step changes
  let previousStack = previousStackRef.current;
  let previousState = previousStateRef.current;

  if (state.currentStep !== lastStepRef.current) {
    previousStack = previousStackRef.current;
    previousStackRef.current = state.stack;
    lastStepRef.current = state.currentStep;
  } else {
    // Same step — no animation needed, sync refs
    previousStack = state.stack;
    previousStackRef.current = state.stack;
  }

  if (state.currentState !== lastCurrentStateRef.current) {
    previousState = lastCurrentStateRef.current;
    previousStateRef.current = lastCurrentStateRef.current;
    lastCurrentStateRef.current = state.currentState;
  } else {
    previousState = null;
    previousStateRef.current = null;
  }

  const isAnimating = state.status === 'running' || state.status === 'accepted' || state.status === 'rejected';

  // Generate annotation text
  const annotation = generateAnnotation(state, state.lastAppliedTransition);

  // Callbacks for child components
  const handleRestoreStep = useCallback(
    (stepIndex: number) => dispatch({ type: 'RESTORE_STEP', payload: stepIndex }),
    [dispatch],
  );

  const handleSelectBranch = useCallback(
    (id: string) => dispatch({ type: 'SELECT_BRANCH', payload: id }),
    [dispatch],
  );

  return (
    <div className="dashboard">
      {/* ── Control Bar (sticky) ── */}
      <div className="dashboard__control-bar">
        <ControlBar />
      </div>

      {/* ── Row 1: Tape · Stack · State ── */}
      <section className="dashboard__tape dashboard__section">
        <TapeDisplay tape={state.tape} headPosition={state.headPosition} />
      </section>

      <section className="dashboard__stack dashboard__section">
        <StackDisplay
          stack={state.stack}
          previousStack={previousStack}
          isAnimating={isAnimating}
        />
      </section>

      <section className="dashboard__state dashboard__section">
        <StateControlDisplay
          states={state.pdaDefinition.states}
          currentState={state.currentState}
          previousState={previousState}
        />
      </section>

      {/* ── Row 2: Transition Table · Annotation Panel ── */}
      <section className="dashboard__transitions dashboard__section">
        <TransitionTable
          transitions={state.pdaDefinition.transitions}
          activeTransition={state.lastAppliedTransition}
          groupByState={state.pdaDefinition.states.length > 1}
        />
      </section>

      <section className="dashboard__annotations dashboard__section">
        <AnnotationPanel annotation={annotation} status={state.status} />
      </section>

      {/* ── Nondeterministic branch explanation (only for NPDA) ── */}
      {state.pdaDefinition.isNondeterministic && (
        <section className="dashboard__branch-explainer dashboard__section">
          <BranchExplainer
            isNondeterministic={state.pdaDefinition.isNondeterministic}
            status={state.status}
            branchCount={state.branches.length}
          />
        </section>
      )}

      {/* ── Row 3: Computation History · Branch View ── */}
      <section className="dashboard__history dashboard__section">
        <ComputationHistory
          history={state.history}
          currentStep={state.currentStep}
          onRestoreStep={handleRestoreStep}
        />
      </section>

      <section className="dashboard__branches dashboard__section">
        <BranchView
          branches={state.branches}
          activeBranchId={state.activeBranchId}
          onSelectBranch={handleSelectBranch}
        />
      </section>

      {/* ── Row 4: Formal Definition (full width) ── */}
      <section className="dashboard__formal dashboard__section">
        <FormalDefinitionDisplay definition={state.pdaDefinition} />
      </section>
    </div>
  );
}

export default App;
