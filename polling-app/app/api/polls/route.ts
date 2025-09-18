import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createPollSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(200, 'Question must be less than 200 characters'),
  options: z.array(z.string().min(1, 'Option cannot be empty').max(100, 'Option must be less than 100 characters')).min(2, 'At least 2 options required').max(10, 'Maximum 10 options allowed')
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const { question, options } = createPollSchema.parse(json)

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        user_id: user.id,
        question
      })
      .select()
      .single()

    if (pollError) {
      console.error('Poll creation error:', pollError)
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })
    }

    // Create options
    const optionsData = options.map((text, index) => ({
      poll_id: poll.id,
      text,
      position: index
    }))

    const { error: optionsError } = await supabase
      .from('options')
      .insert(optionsData)

    if (optionsError) {
      console.error('Options creation error:', optionsError)
      // Clean up poll if options failed
      await supabase.from('polls').delete().eq('id', poll.id)
      return NextResponse.json({ error: 'Failed to create poll options' }, { status: 500 })
    }

    return NextResponse.json({ poll }, { status: 201 })
  } catch (error) {
    console.error('Error creating poll:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's polls with vote counts
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        created_at,
        options:options(id, text, position),
        votes:votes(id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching polls:', error)
      return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 })
    }

    // Calculate vote counts for each poll
    const pollsWithCounts = polls.map(poll => ({
      ...poll,
      totalVotes: poll.votes.length,
      options: poll.options.sort((a, b) => a.position - b.position)
    }))

    return NextResponse.json({ polls: pollsWithCounts })
  } catch (error) {
    console.error('Error fetching polls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
