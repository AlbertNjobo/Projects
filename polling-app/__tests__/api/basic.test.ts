/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Simple test to verify Jest is working
describe('API Tests Setup', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should be able to create NextRequest', () => {
    const request = new NextRequest('http://localhost:3000/test')
    expect(request.url).toBe('http://localhost:3000/test')
  })

  it('should handle API request data', () => {
    const mockPollData = {
      question: 'What is your favorite color?',
      options: ['Red', 'Blue', 'Green']
    }

    const requestBody = JSON.stringify(mockPollData)
    const parsedData = JSON.parse(requestBody)

    expect(parsedData.question).toBe('What is your favorite color?')
    expect(parsedData.options).toHaveLength(3)
  })

  it('should validate poll creation data', () => {
    const validPoll = {
      question: 'A valid question with enough characters',
      options: ['Option 1', 'Option 2', 'Option 3']
    }

    const invalidPoll = {
      question: 'Hi',  // Only 2 characters, less than 5
      options: ['Only one']
    }

    // Simulate validation logic
    const isValidQuestion = validPoll.question.length >= 5 && validPoll.question.length <= 200
    const hasEnoughOptions = validPoll.options.length >= 2 && validPoll.options.length <= 10

    expect(isValidQuestion).toBe(true)
    expect(hasEnoughOptions).toBe(true)

    // Invalid poll checks
    const invalidQuestionLength = invalidPoll.question.length >= 5
    const invalidOptionsCount = invalidPoll.options.length >= 2

    expect(invalidQuestionLength).toBe(false) // "Hi" is less than 5 characters
    expect(invalidOptionsCount).toBe(false)   // Only 1 option, need at least 2
  })
})