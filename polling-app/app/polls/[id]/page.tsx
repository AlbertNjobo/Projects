'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Check, BarChart3, Users, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface Option {
  id: string
  text: string
  position: number
  votes: number
}

interface Poll {
  id: string
  question: string
  options: Option[]
  totalVotes: number
  created_at: string
}

interface VoteState {
  hasVoted: boolean
  selectedOptionId: string | null
  results: Poll | null
}

export default function PollDetailPage() {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [voteState, setVoteState] = useState<VoteState>({
    hasVoted: false,
    selectedOptionId: null,
    results: null
  })
  const [error, setError] = useState('')
  
  const params = useParams()
  const pollId = params?.id as string

  useEffect(() => {
    if (pollId) {
      fetchPoll()
    }
  }, [pollId])

  const fetchPoll = async () => {
    try {
      const response = await fetch(`/api/polls/${pollId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch poll')
      }
      
      const data = await response.json()
      setPoll(data.poll)
    } catch (error) {
      console.error('Error fetching poll:', error)
      setError('Failed to load poll')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async () => {
    if (!selectedOption || !poll) return

    setIsVoting(true)
    
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-visitor-id': getVisitorId()
        },
        body: JSON.stringify({
          optionId: selectedOption
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cast vote')
      }

      // Update state to show results
      setVoteState({
        hasVoted: true,
        selectedOptionId: selectedOption,
        results: data.poll
      })
    } catch (error) {
      console.error('Error casting vote:', error)
      setError(error instanceof Error ? error.message : 'Failed to cast vote')
    } finally {
      setIsVoting(false)
    }
  }

  const getVisitorId = () => {
    // Get or create visitor ID from localStorage
    let visitorId = localStorage.getItem('visitor_id')
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('visitor_id', visitorId)
    }
    return visitorId
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getOptionPercentage = (votes: number, total: number) => {
    if (total === 0) return 0
    return Math.round((votes / total) * 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Error</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-xl font-semibold mb-2">Poll Not Found</h3>
                <p className="text-gray-600 mb-6">The poll you&apos;re looking for doesn&apos;t exist.</p>
                <Button asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const displayPoll = voteState.results || poll
  const showResults = voteState.hasVoted

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              Created {formatDate(poll.created_at)}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {poll.question}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {displayPoll.totalVotes} {displayPoll.totalVotes === 1 ? 'vote' : 'votes'}
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                {displayPoll.options.length} options
              </div>
            </div>
          </div>

          {showResults ? (
            /* Results View */
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-green-900">Thank you for voting!</CardTitle>
                    <CardDescription>Here are the current results</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayPoll.options.map((option) => {
                    const percentage = getOptionPercentage(option.votes, displayPoll.totalVotes)
                    const isSelected = option.id === voteState.selectedOptionId
                    
                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                            {option.text}
                            {isSelected && (
                              <span className="ml-2 text-sm text-blue-600">(Your choice)</span>
                            )}
                          </span>
                          <span className="text-sm text-gray-600">
                            {option.votes} votes ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              isSelected ? 'bg-blue-600' : 'bg-gray-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600 text-center">
                    Poll results update in real-time as more people vote.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Voting Form */
            <Card>
              <CardHeader>
                <CardTitle>Cast Your Vote</CardTitle>
                <CardDescription>
                  Select one option below to cast your vote
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {poll.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id={option.id}
                        name="poll-option"
                        value={option.id}
                        checked={selectedOption === option.id}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <Label 
                        htmlFor={option.id}
                        className="flex-1 text-base cursor-pointer py-3 px-4 rounded-md border hover:bg-gray-50 transition-colors"
                      >
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleVote}
                  disabled={!selectedOption || isVoting}
                  className="w-full mt-6"
                  size="lg"
                >
                  {isVoting ? 'Casting Vote...' : 'Cast Vote'}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  You can only vote once on this poll
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
