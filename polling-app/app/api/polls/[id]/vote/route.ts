import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const voteSchema = z.object({
  optionId: z.string().uuid('Valid option ID required'),
})

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const pollId = params.id

    // Parse request body
    const body = await request.json()
    const { optionId } = voteSchema.parse(body)

    // Generate or get visitor ID from cookie
    const visitorId = request.headers.get('x-visitor-id') || 
                     `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Check if poll exists and get its options
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        options:options(id, text, position)
      `)
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Verify the option belongs to this poll
    const validOption = poll.options.find(option => option.id === optionId)
    if (!validOption) {
      return NextResponse.json(
        { error: 'Invalid option for this poll' },
        { status: 400 }
      )
    }

    // Check if visitor has already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('visitor_id', visitorId)
      .single()

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this poll' },
        { status: 409 }
      )
    }

    // Cast the vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        visitor_id: visitorId,
      })

    if (voteError) {
      console.error('Vote creation error:', voteError)
      return NextResponse.json(
        { error: 'Failed to cast vote' },
        { status: 500 }
      )
    }

    // Get updated vote counts for the poll
    const { data: results, error: resultsError } = await supabase
      .from('options')
      .select(`
        id,
        text,
        position,
        votes:votes(count)
      `)
      .eq('poll_id', pollId)
      .order('position')

    if (resultsError) {
      console.error('Results fetch error:', resultsError)
      return NextResponse.json(
        { error: 'Vote cast but failed to fetch results' },
        { status: 500 }
      )
    }

    // Calculate vote counts
    const optionsWithCounts = results.map(option => ({
      id: option.id,
      text: option.text,
      position: option.position,
      votes: option.votes.length
    }))

    const totalVotes = optionsWithCounts.reduce((sum, option) => sum + option.votes, 0)

    const response = NextResponse.json({
      success: true,
      poll: {
        id: poll.id,
        question: poll.question,
        options: optionsWithCounts,
        totalVotes
      }
    })

    // Set visitor ID cookie for future requests
    response.cookies.set('visitor_id', visitorId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response
  } catch (error) {
    console.error('Vote API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
