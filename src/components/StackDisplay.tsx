import { useMemo } from 'react';
import './StackDisplay.css';

export interface StackDisplayProps {
  /** Stack contents, bottom to top (index 0 = bottom, last = top) */
  stack: string[];
  /** Previous stack contents for computing animations (bottom to top) */
  previousStack?: string[];
  /** Whether animations should play */
  isAnimating?: boolean;
}

/**
 * Determines the animation type for each cell in the current stack
 * by comparing with the previous stack.
 *
 * - 'push': symbol was not in the previous stack at this position (new)
 * - 'pop': (only used for a transient popped element, handled separately)
 * - 'replace': symbol changed at an existing position
 * - 'none': symbol unchanged
 */
function computeAnimations(
  stack: string[],
  previousStack: string[],
): ('push' | 'replace' | 'none')[] {
  const result: ('push' | 'replace' | 'none')[] = [];

  for (let i = 0; i < stack.length; i++) {
    if (i >= previousStack.length) {
      // This index didn't exist before — it was pushed
      result.push('push');
    } else if (stack[i] !== previousStack[i]) {
      // Symbol changed at this position — replacement
      result.push('replace');
    } else {
      result.push('none');
    }
  }

  return result;
}

/**
 * Renders the PDA stack as a vertical column of symbols.
 *
 * - The stack is displayed top-to-bottom (top element at visual top).
 * - The top element (last in the array) gets a distinct highlight.
 * - $ at the bottom is styled with a muted indicator.
 * - Push, pop, and replacement operations are animated via CSS classes.
 */
export function StackDisplay({
  stack,
  previousStack = [],
  isAnimating = false,
}: StackDisplayProps) {
  // Reverse so the top of the stack (last element) renders first visually
  const displayOrder = useMemo(() => [...stack].reverse(), [stack]);

  const animations = useMemo(() => {
    if (!isAnimating || previousStack.length === 0) {
      return stack.map(() => 'none' as const);
    }
    return computeAnimations(stack, previousStack);
  }, [stack, previousStack, isAnimating]);

  // Reverse animations to match displayOrder
  const displayAnimations = useMemo(() => [...animations].reverse(), [animations]);

  // Detect if a pop happened (previous stack was longer)
  const showPoppedElement =
    isAnimating && previousStack.length > stack.length && previousStack.length > 0;
  const poppedSymbol = showPoppedElement
    ? previousStack[previousStack.length - 1]
    : null;

  return (
    <div className="stack-display" role="region" aria-label="Stack display">
      <span className="stack-display__label">Stack</span>
      <div className="stack-display__cells" role="list">
        {/* Transient popped element (fades out) */}
        {poppedSymbol !== null && (
          <div
            className="stack-display__cell stack-display__cell--pop"
            role="listitem"
            aria-label={`Popped: ${poppedSymbol}`}
          >
            {poppedSymbol}
          </div>
        )}

        {displayOrder.map((symbol, displayIndex) => {
          // Map display index back to stack index
          const stackIndex = stack.length - 1 - displayIndex;
          const isTop = stackIndex === stack.length - 1;
          const isBottom = symbol === '$' && stackIndex === 0;
          const animationType = displayAnimations[displayIndex];

          const classNames = [
            'stack-display__cell',
            isTop && 'stack-display__cell--top',
            isBottom && 'stack-display__cell--bottom',
            isAnimating && animationType === 'push' && 'stack-display__cell--push',
            isAnimating && animationType === 'replace' && 'stack-display__cell--replace',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={`${stackIndex}-${symbol}`}
              className={classNames}
              role="listitem"
              aria-label={`Stack position ${stackIndex}: ${symbol}${isTop ? ' (top)' : ''}${isBottom ? ' (bottom)' : ''}`}
              aria-current={isTop ? 'true' : undefined}
            >
              {symbol}
            </div>
          );
        })}
      </div>
    </div>
  );
}
