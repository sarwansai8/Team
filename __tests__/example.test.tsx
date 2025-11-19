import { render, screen } from '@testing-library/react';
import HealthUpdates from '../app/health-updates/page';

test('renders health updates component', () => {
    render(<HealthUpdates />);
    const linkElement = screen.getByText(/health updates/i);
    expect(linkElement).toBeInTheDocument();
});