const { render, screen } = require('@testing-library/react');
const Page = require('./page');

test('renders health updates page', () => {
    render(<Page />);
    const linkElement = screen.getByText(/health updates/i);
    expect(linkElement).toBeInTheDocument();
});