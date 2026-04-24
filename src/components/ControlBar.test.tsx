import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SimulatorProvider } from '../context/SimulatorContext';
import { ControlBar } from './ControlBar';

describe('ControlBar', () => {
  it('renders within a SimulatorProvider', () => {
    render(
      <SimulatorProvider>
        <ControlBar />
      </SimulatorProvider>,
    );

    expect(
      screen.getByRole('region', { name: 'Simulation control bar' }),
    ).toBeInTheDocument();
  });

  it('renders the ExampleSelector section', () => {
    render(
      <SimulatorProvider>
        <ControlBar />
      </SimulatorProvider>,
    );

    expect(
      screen.getByRole('region', { name: 'Example selector' }),
    ).toBeInTheDocument();
  });

  it('renders the StringInput section', () => {
    render(
      <SimulatorProvider>
        <ControlBar />
      </SimulatorProvider>,
    );

    expect(
      screen.getByRole('region', { name: 'String input' }),
    ).toBeInTheDocument();
  });

  it('renders the StepController section', () => {
    render(
      <SimulatorProvider>
        <ControlBar />
      </SimulatorProvider>,
    );

    expect(
      screen.getByRole('toolbar', { name: 'Simulation controls' }),
    ).toBeInTheDocument();
  });
});
