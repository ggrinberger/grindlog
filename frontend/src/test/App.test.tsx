import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

// Mock the auth store
vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    login: vi.fn(),
    isAuthenticated: false,
  }),
}));

// Mock the API
vi.mock('../services/api', () => ({
  auth: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

describe('Login Page', () => {
  it('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('has link to register page', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('Sign up')).toHaveAttribute('href', '/register');
  });
});

describe('Validation helpers', () => {
  it('validates email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('invalid')).toBe(false);
  });

  it('validates password length', () => {
    const isValidPassword = (password: string) => password.length >= 6;
    
    expect(isValidPassword('short')).toBe(false);
    expect(isValidPassword('longenough')).toBe(true);
  });
});
