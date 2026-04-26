import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { HomePage } from './pages/HomePage';
import { PdaPage } from './pages/PdaPage';

/**
 * Mock PdaPage to avoid pulling in the entire simulator context + heavy components.
 * We only need to verify the route renders PdaPage content.
 */
vi.mock('./pages/PdaPage', () => ({
  PdaPage: () => <div className="dashboard" data-testid="pda-page">PDA Dashboard</div>,
}));

/**
 * Helper: render the full route tree inside a MemoryRouter.
 */
function renderAtRoute(initialEntries: string[], initialIndex?: number) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="pda" element={<PdaPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Routing', () => {
  it('renders HomePage content when navigating to "/"', () => {
    renderAtRoute(['/']);

    expect(
      screen.getByRole('heading', { name: /theory of computation interactive guide/i }),
    ).toBeInTheDocument();
  });

  it('renders PdaPage content when navigating to "/pda"', () => {
    renderAtRoute(['/pda']);

    expect(screen.getByTestId('pda-page')).toBeInTheDocument();
    expect(screen.getByTestId('pda-page')).toHaveClass('dashboard');
  });

  it('redirects undefined paths to "/" and renders HomePage', () => {
    renderAtRoute(['/nonexistent']);

    expect(
      screen.getByRole('heading', { name: /theory of computation interactive guide/i }),
    ).toBeInTheDocument();
  });

  it('supports back/forward navigation between routes', () => {
    // Start at "/"
    renderAtRoute(['/']);

    // Verify HomePage is rendered
    expect(
      screen.getByRole('heading', { name: /theory of computation interactive guide/i }),
    ).toBeInTheDocument();

    // Click the PDA sidebar link to navigate to "/pda"
    const pdaLink = screen.getByRole('link', { name: /5-tuple PDA/i });
    fireEvent.click(pdaLink);

    // Verify PdaPage is now rendered
    expect(screen.getByTestId('pda-page')).toBeInTheDocument();

    // Click the Home sidebar link to navigate back to "/"
    const homeLink = screen.getByRole('link', { name: /home/i });
    fireEvent.click(homeLink);

    // Verify HomePage is rendered again
    expect(
      screen.getByRole('heading', { name: /theory of computation interactive guide/i }),
    ).toBeInTheDocument();
  });
});
