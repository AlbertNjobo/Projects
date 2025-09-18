import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Poll {
  id: string
  question: string
  created_at: string
  options: Array<{
    id: string
    text: string
    position: number
  }>
  votes: Array<{
    id: string
  }>
}

export default async function PollsPage() {
  const supabase = createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's polls with options and vote counts
  const { data: polls } = await supabase
    .from('polls')
    .select(`
      id,
      question,
      created_at,
      options (
        id,
        text,
        position
      ),
      votes (
        id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Polls</h1>
            <p className="text-gray-600 mt-2">Manage your polls and view results</p>
          </div>
          <Button asChild>
            <Link href="/polls/new">Create New Poll</Link>
          </Button>
        </div>

        {polls && polls.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll: Poll) => (
              <Card key={poll.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{poll.question}</CardTitle>
                  <CardDescription>
                    Created {new Date(poll.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      {poll.options?.length || 0} options
                    </p>
                    <p className="text-sm text-gray-600">
                      {poll.votes?.length || 0} votes
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/polls/${poll.id}`}>View Results</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/vote/${poll.id}`}>Share</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No polls yet</h3>
              <p className="text-gray-600 mb-6">Create your first poll to get started!</p>
              <Button asChild>
                <Link href="/polls/new">Create Your First Poll</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}