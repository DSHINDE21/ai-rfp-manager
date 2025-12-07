import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import App from './App'

const TestWrapper = ({ children }) => (
  <ChakraProvider>
    <BrowserRouter>{children}</BrowserRouter>
  </ChakraProvider>
)

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    expect(screen.getByText(/RFP Management System/i)).toBeInTheDocument()
  })
})

