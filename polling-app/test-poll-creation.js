// Simple test script to verify poll creation API
// Run with: node test-poll-creation.js

const testPollCreation = async () => {
  const testData = {
    question: "What's your favorite programming language?",
    options: ["JavaScript", "Python", "TypeScript", "Go"]
  }

  console.log('Testing poll creation with data:', testData)
  
  try {
    const response = await fetch('http://localhost:3001/api/polls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Success! Poll created:', result)
    } else {
      console.log('❌ Error:', result)
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
}

// Note: This test requires authentication, so it will fail with 401
// Use this to verify the API endpoint is accessible
testPollCreation()