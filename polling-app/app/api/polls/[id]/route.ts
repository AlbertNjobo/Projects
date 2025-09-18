import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updatePollSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(200, 'Question must be less than 200 characters'),
  options: z.array(z.string().min(1, 'Option cannot be empty').max(100, 'Option must be less than 100 characters')).min(2, 'At least 2 options required').max(10, 'Maximum 10 options allowed')
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    // Get poll with options and vote counts
    const { data: poll, error } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        created_at,
        user_id,
        options:options(id, text, position),
        votes:votes(id, option_id)
      `)
      .eq('id', params.id)
      .single()

    if (error || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Calculate vote counts per option
    const optionsWithVotes = poll.options
      .sort((a, b) => a.position - b.position)
      .map(option => ({
        ...option,
        voteCount: poll.votes.filter(vote => vote.option_id === option.id).length
      }))

    const pollWithStats = {
      ...poll,
      options: optionsWithVotes,
      totalVotes: poll.votes.length
    }

    return NextResponse.json({ poll: pollWithStats })
  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if poll exists and user owns it
    const { data: existingPoll, error: pollError } = await supabase
      .from('polls')
      .select('id, user_id')
      .eq('id', params.id)
      .single()

    if (pollError || !existingPoll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    if (existingPoll.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const json = await request.json()
    const { question, options } = updatePollSchema.parse(json)

    // Update poll question
    const { error: updateError } = await supabase
      .from('polls')
      .update({ question })
      .eq('id', params.id)

    if (updateError) {
      console.error('Poll update error:', updateError)
      return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 })
    }

    // Delete existing options
    const { error: deleteOptionsError } = await supabase
      .from('options')
      .delete()
      .eq('poll_id', params.id)

    if (deleteOptionsError) {
      console.error('Options delete error:', deleteOptionsError)
      return NextResponse.json({ error: 'Failed to update poll options' }, { status: 500 })
    }

    // Create new options
    const optionsData = options.map((text, index) => ({
      poll_id: params.id,
      text,
      position: index
    }))

    const { error: optionsError } = await supabase
      .from('options')
      .insert(optionsData)

    if (optionsError) {
      console.error('Options creation error:', optionsError)
      return NextResponse.json({ error: 'Failed to create poll options' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Poll updated successfully' })
  } catch (error) {
    console.error('Error updating poll:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if poll exists and user owns it
    const { data: existingPoll, error: pollError } = await supabase
      .from('polls')
      .select('id, user_id')
      .eq('id', params.id)
      .single()

    if (pollError || !existingPoll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    if (existingPoll.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete poll (this will cascade delete options and votes due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Poll deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Poll deleted successfully' })
  } catch (error) {
    console.error('Error deleting poll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
