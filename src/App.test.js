import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  // 앱이 렌더링될 때 기본 텍스트가 화면에 나타나는지 확인한다.
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
