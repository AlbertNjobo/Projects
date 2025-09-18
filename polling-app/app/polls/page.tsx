'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Users, Clock, Plus, Edit, Trash2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Poll {
  id: string
  question: string
  created_at: string
  totalVotes: number
  options: Array<{
    id: string
    text: string
    position: number
  }>
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pollToDelete, setPollToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchPolls()
  }, [])

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/polls')
      
      if (response.status === 401) {
        router.push('/auth/login')
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch polls')
      }
      
      const data = await response.json()
      setPolls(data.polls || [])
    } catch (error) {
      console.error('Error fetching polls:', error)
      setError('Failed to load polls')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditPoll = (pollId: string) => {
    router.push(`/polls/edit/${pollId}`)
  }

  const handleDeletePoll = async (pollId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete poll')
      }

      // Remove poll from state
      setPolls(polls.filter(poll => poll.id !== pollId))
      setDeleteDialogOpen(false)
      setPollToDelete(null)
    } catch (error) {
      console.error('Error deleting poll:', error)
      setError('Failed to delete poll')
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (pollId: string) => {
    setPollToDelete(pollId)
    setDeleteDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Polls</h1>
              <p className="text-gray-600 mt-2">Loading your polls...</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Error loading polls</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={fetchPolls}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Polls</h1>
            <p className="text-gray-600 mt-2">
              {polls.length || 0} poll{polls.length !== 1 ? 's' : ''} created
            </p>
          </div>
          <Button asChild className="shadow-lg">
            <Link href="/polls/new">
              <Plus className="h-4 w-4 mr-2" />
              Create New Poll
            </Link>
          </Button>
        </div>

        {polls.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => (
              <Card key={poll.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <CardTitle className="line-clamp-2 text-lg">{poll.question}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-2">
                        <Clock className="h-3 w-3" />
                        {new Date(poll.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPoll(poll.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Poll
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(poll.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Poll
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        {poll.options?.length || 0} options
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {poll.totalVotes || 0} votes
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/polls/${poll.id}`}>View Results</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/vote/${poll.id}`}>Share Link</Link>
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
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No polls yet</h3>
              <p className="text-gray-600 mb-6">Create your first poll to get started collecting responses!</p>
              <Button asChild className="shadow-lg">
                <Link href="/polls/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Poll
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this poll? This action cannot be undone and will permanently delete all votes and responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pollToDelete && handleDeletePoll(pollToDelete)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Poll'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}