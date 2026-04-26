import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { CnfConversionState, CnfAction, Grammar } from '../types';
import { convertToCnf } from '../engine/cnfConverter';

// ── Default empty grammar ──

const emptyGrammar: Grammar = {
  variables: [],
  terminals: [],
  rules: [],
  startVariable: '',
};

// ── Initial state ──

const initialState: CnfConversionState = {
  originalGrammar: emptyGrammar,
  currentGrammar: emptyGrammar,
  subSteps: [],
  currentSubStepIndex: -1,
  status: 'idle',
};

// ── Reducer ──

export function cnfReducer(
  state: CnfConversionState,
  action: CnfAction,
): CnfConversionState {
  switch (action.type) {
    case 'SET_GRAMMAR': {
      return {
        ...initialState,
        originalGrammar: action.payload,
        currentGrammar: action.payload,
      };
    }

    case 'START_CONVERSION': {
      const subSteps = convertToCnf(state.originalGrammar);
      return {
        ...state,
        subSteps,
        currentSubStepIndex: -1,
        status: 'converting',
      };
    }

    case 'STEP_FORWARD': {
      if (state.status !== 'converting') return state;

      const nextIndex = state.currentSubStepIndex + 1;
      if (nextIndex >= state.subSteps.length) return state;

      const isLast = nextIndex === state.subSteps.length - 1;
      return {
        ...state,
        currentSubStepIndex: nextIndex,
        currentGrammar: state.subSteps[nextIndex].grammarAfter,
        status: isLast ? 'complete' : 'converting',
      };
    }

    case 'STEP_BACKWARD': {
      if (state.currentSubStepIndex < 0) return state;

      const prevIndex = state.currentSubStepIndex - 1;
      const currentGrammar =
        prevIndex < 0
          ? state.originalGrammar
          : state.subSteps[prevIndex].grammarAfter;

      return {
        ...state,
        currentSubStepIndex: prevIndex,
        currentGrammar,
        status: 'converting',
      };
    }

    case 'RESET': {
      return {
        ...state,
        currentGrammar: state.originalGrammar,
        subSteps: [],
        currentSubStepIndex: -1,
        status: 'idle',
      };
    }

    default:
      return state;
  }
}

// ── Context ──

interface CnfContextValue {
  state: CnfConversionState;
  dispatch: React.Dispatch<CnfAction>;
}

export const CnfContext = createContext<CnfContextValue | null>(null);

// ── Provider ──

interface CnfProviderProps {
  children: ReactNode;
}

export function CnfProvider({ children }: CnfProviderProps) {
  const [state, dispatch] = useReducer(cnfReducer, initialState);

  return (
    <CnfContext.Provider value={{ state, dispatch }}>
      {children}
    </CnfContext.Provider>
  );
}

// ── Hook ──

export function useCnf(): CnfContextValue {
  const context = useContext(CnfContext);
  if (context === null) {
    throw new Error('useCnf must be used within a CnfProvider');
  }
  return context;
}
